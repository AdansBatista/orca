import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete, softDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateInsuranceCompanySchema } from '@/lib/validations/insurance';

interface RouteContext {
  params: Promise<{ companyId: string }>;
}

/**
 * GET /api/insurance/companies/[companyId]
 * Get a single insurance company by ID
 */
export const GET = withAuth(
  async (req, session, context: RouteContext) => {
    const { companyId } = await context.params;

    const company = await db.insuranceCompany.findFirst({
      where: withSoftDelete({
        id: companyId,
        clinicId: session.user.clinicId,
      }),
      include: {
        _count: {
          select: {
            patientInsurances: true,
            claims: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Insurance company not found',
          },
        },
        { status: 404 }
      );
    }

    // Get claim statistics for this company
    const claimStats = await db.insuranceClaim.groupBy({
      by: ['status'],
      where: withSoftDelete({
        insuranceCompanyId: companyId,
        clinicId: session.user.clinicId,
      }),
      _count: true,
      _sum: {
        billedAmount: true,
        paidAmount: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...company,
        claimStats: claimStats.reduce((acc, item) => {
          acc[item.status] = {
            count: item._count,
            billedAmount: item._sum.billedAmount || 0,
            paidAmount: item._sum.paidAmount || 0,
          };
          return acc;
        }, {} as Record<string, { count: number; billedAmount: number; paidAmount: number }>),
      },
    });
  },
  { permissions: ['insurance:read'] }
);

/**
 * PATCH /api/insurance/companies/[companyId]
 * Update an insurance company
 */
export const PATCH = withAuth(
  async (req, session, context: RouteContext) => {
    const { companyId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateInsuranceCompanySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid insurance company data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Check if company exists
    const existing = await db.insuranceCompany.findFirst({
      where: withSoftDelete({
        id: companyId,
        clinicId: session.user.clinicId,
      }),
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Insurance company not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Check for duplicate payer ID if changing it
    if (data.payerId && data.payerId !== existing.payerId) {
      const duplicatePayer = await db.insuranceCompany.findFirst({
        where: withSoftDelete({
          clinicId: session.user.clinicId,
          payerId: data.payerId,
          id: { not: companyId },
        }),
      });

      if (duplicatePayer) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_PAYER_ID',
              message: 'An insurance company with this payer ID already exists',
            },
          },
          { status: 409 }
        );
      }
    }

    // Update the company
    const company = await db.insuranceCompany.update({
      where: { id: companyId },
      data: {
        ...data,
      },
      include: {
        _count: {
          select: {
            patientInsurances: true,
            claims: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'InsuranceCompany',
      entityId: company.id,
      details: {
        name: company.name,
        updatedFields: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: company });
  },
  { permissions: ['insurance:update'] }
);

/**
 * DELETE /api/insurance/companies/[companyId]
 * Soft delete an insurance company
 */
export const DELETE = withAuth(
  async (req, session, context: RouteContext) => {
    const { companyId } = await context.params;

    // Check if company exists
    const existing = await db.insuranceCompany.findFirst({
      where: withSoftDelete({
        id: companyId,
        clinicId: session.user.clinicId,
      }),
      include: {
        _count: {
          select: {
            patientInsurances: true,
            claims: { where: { status: { notIn: ['VOID', 'CLOSED'] } } },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Insurance company not found',
          },
        },
        { status: 404 }
      );
    }

    // Prevent deletion if company has active patient insurances or claims
    if (existing._count.patientInsurances > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_DEPENDENCIES',
            message: `Cannot delete: ${existing._count.patientInsurances} patient(s) have this insurance`,
          },
        },
        { status: 400 }
      );
    }

    if (existing._count.claims > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_ACTIVE_CLAIMS',
            message: `Cannot delete: ${existing._count.claims} active claim(s) exist for this company`,
          },
        },
        { status: 400 }
      );
    }

    // Soft delete the company
    await db.insuranceCompany.update({
      where: { id: companyId },
      data: softDelete(),
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'InsuranceCompany',
      entityId: companyId,
      details: {
        name: existing.name,
        payerId: existing.payerId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  },
  { permissions: ['insurance:delete'] }
);
