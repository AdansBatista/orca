import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updatePatientAccountSchema } from '@/lib/validations/billing';

/**
 * GET /api/billing/accounts/[accountId]
 * Get a single patient account by ID
 */
export const GET = withAuth<{ accountId: string }>(
  async (req, session, context) => {
    const { accountId } = await context.params;

    const account = await db.patientAccount.findFirst({
      where: withSoftDelete({
        id: accountId,
        ...getClinicFilter(session),
      }),
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
          },
        },
        guarantor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        familyGroup: {
          select: {
            id: true,
            groupName: true,
          },
        },
        invoices: {
          where: { deletedAt: null },
          orderBy: { invoiceDate: 'desc' },
          take: 10,
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            dueDate: true,
            subtotal: true,
            balance: true,
            paidAmount: true,
            status: true,
          },
        },
        payments: {
          where: { deletedAt: null },
          orderBy: { paymentDate: 'desc' },
          take: 10,
          select: {
            id: true,
            paymentNumber: true,
            paymentDate: true,
            amount: true,
            paymentMethodType: true,
            status: true,
          },
        },
        paymentPlans: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            planNumber: true,
            totalAmount: true,
            remainingBalance: true,
            status: true,
          },
        },
        credits: {
          where: {
            status: 'AVAILABLE',
            remainingAmount: { gt: 0 },
          },
          select: {
            id: true,
            amount: true,
            remainingAmount: true,
            source: true,
            expiresAt: true,
          },
        },
        _count: {
          select: {
            invoices: true,
            payments: true,
            paymentPlans: { where: { status: 'ACTIVE' } },
            statements: true,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Patient account not found',
          },
        },
        { status: 404 }
      );
    }

    // Calculate available credit
    const availableCredit = account.credits.reduce(
      (sum, credit) => sum + credit.remainingAmount,
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        ...account,
        availableCredit,
      },
    });
  },
  { permissions: ['billing:read'] }
);

/**
 * PATCH /api/billing/accounts/[accountId]
 * Update a patient account
 */
export const PATCH = withAuth<{ accountId: string }>(
  async (req, session, context) => {
    const { accountId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updatePatientAccountSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check account exists
    const existingAccount = await db.patientAccount.findFirst({
      where: withSoftDelete({
        id: accountId,
        ...getClinicFilter(session),
      }),
    });

    if (!existingAccount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Patient account not found',
          },
        },
        { status: 404 }
      );
    }

    // Verify guarantor if changing
    if (data.guarantorId && data.guarantorId !== existingAccount.guarantorId) {
      const guarantor = await db.patient.findFirst({
        where: withSoftDelete({
          id: data.guarantorId,
          clinicId: session.user.clinicId,
        }),
      });

      if (!guarantor) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'GUARANTOR_NOT_FOUND',
              message: 'Guarantor patient not found',
            },
          },
          { status: 400 }
        );
      }
    }

    // Verify family group if changing
    if (data.familyGroupId && data.familyGroupId !== existingAccount.familyGroupId) {
      const familyGroup = await db.familyGroup.findFirst({
        where: withSoftDelete({
          id: data.familyGroupId,
          clinicId: session.user.clinicId,
        }),
      });

      if (!familyGroup) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FAMILY_GROUP_NOT_FOUND',
              message: 'Family group not found',
            },
          },
          { status: 400 }
        );
      }
    }

    // Update the account
    const account = await db.patientAccount.update({
      where: { id: accountId },
      data: {
        ...data,
        updatedBy: session.user.id,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        guarantor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        familyGroup: {
          select: {
            id: true,
            groupName: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'PatientAccount',
      entityId: account.id,
      details: {
        accountNumber: account.accountNumber,
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: account });
  },
  { permissions: ['billing:update'] }
);

/**
 * DELETE /api/billing/accounts/[accountId]
 * Soft delete a patient account
 */
export const DELETE = withAuth<{ accountId: string }>(
  async (req, session, context) => {
    const { accountId } = await context.params;

    // Check account exists
    const existingAccount = await db.patientAccount.findFirst({
      where: withSoftDelete({
        id: accountId,
        ...getClinicFilter(session),
      }),
      include: {
        _count: {
          select: {
            invoices: { where: { status: { notIn: ['DRAFT', 'VOID', 'PAID'] }, deletedAt: null } },
            paymentPlans: { where: { status: 'ACTIVE', deletedAt: null } },
          },
        },
      },
    });

    if (!existingAccount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Patient account not found',
          },
        },
        { status: 404 }
      );
    }

    // Check for outstanding balance
    if (existingAccount.currentBalance > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_BALANCE',
            message: 'Cannot delete account with outstanding balance',
            details: { currentBalance: existingAccount.currentBalance },
          },
        },
        { status: 400 }
      );
    }

    // Check for open invoices
    if (existingAccount._count.invoices > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_OPEN_INVOICES',
            message: 'Cannot delete account with open invoices',
          },
        },
        { status: 400 }
      );
    }

    // Check for active payment plans
    if (existingAccount._count.paymentPlans > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_ACTIVE_PLANS',
            message: 'Cannot delete account with active payment plans',
          },
        },
        { status: 400 }
      );
    }

    // Soft delete the account
    await db.patientAccount.update({
      where: { id: accountId },
      data: {
        deletedAt: new Date(),
        status: 'CLOSED',
        updatedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'PatientAccount',
      entityId: accountId,
      details: {
        accountNumber: existingAccount.accountNumber,
        patientId: existingAccount.patientId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { id: accountId } });
  },
  { permissions: ['billing:delete'] }
);
