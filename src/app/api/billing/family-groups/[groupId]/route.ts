import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateFamilyGroupSchema } from '@/lib/validations/billing';

/**
 * GET /api/billing/family-groups/[groupId]
 * Get a single family group by ID
 */
export const GET = withAuth<{ groupId: string }>(
  async (req, session, context) => {
    const { groupId } = await context.params;

    const group = await db.familyGroup.findFirst({
      where: withSoftDelete({
        id: groupId,
        ...getClinicFilter(session),
      }),
      include: {
        accounts: {
          where: { deletedAt: null },
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
            _count: {
              select: {
                invoices: { where: { deletedAt: null, status: { notIn: ['DRAFT', 'VOID', 'PAID'] } } },
                paymentPlans: { where: { deletedAt: null, status: 'ACTIVE' } },
              },
            },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Family group not found',
          },
        },
        { status: 404 }
      );
    }

    // Get guarantor patient info
    const primaryGuarantor = await db.patient.findUnique({
      where: { id: group.primaryGuarantorId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    // Calculate combined stats
    const combinedBalance = group.accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

    return NextResponse.json({
      success: true,
      data: {
        ...group,
        primaryGuarantor,
        stats: {
          memberCount: group.accounts.length,
          combinedBalance,
        },
      },
    });
  },
  { permissions: ['billing:read'] }
);

/**
 * PATCH /api/billing/family-groups/[groupId]
 * Update a family group
 */
export const PATCH = withAuth<{ groupId: string }>(
  async (req, session, context) => {
    const { groupId } = await context.params;
    const body = await req.json();

    // Check for member operations
    const { action, accountId } = body;

    if (action === 'addMember' && accountId) {
      return handleAddMember(req, session, groupId, accountId);
    } else if (action === 'removeMember' && accountId) {
      return handleRemoveMember(req, session, groupId, accountId);
    }

    // Standard update
    const result = updateFamilyGroupSchema.safeParse(body);
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

    // Check group exists
    const existingGroup = await db.familyGroup.findFirst({
      where: withSoftDelete({
        id: groupId,
        ...getClinicFilter(session),
      }),
    });

    if (!existingGroup) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Family group not found',
          },
        },
        { status: 404 }
      );
    }

    // Verify primary guarantor if changing
    if (data.primaryGuarantorId && data.primaryGuarantorId !== existingGroup.primaryGuarantorId) {
      const guarantor = await db.patient.findFirst({
        where: withSoftDelete({
          id: data.primaryGuarantorId,
          clinicId: session.user.clinicId,
        }),
      });

      if (!guarantor) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'GUARANTOR_NOT_FOUND',
              message: 'Primary guarantor patient not found',
            },
          },
          { status: 400 }
        );
      }
    }

    // Update group
    const group = await db.familyGroup.update({
      where: { id: groupId },
      data: {
        groupName: data.groupName,
        primaryGuarantorId: data.primaryGuarantorId,
        consolidateStatements: data.consolidateStatements,
      },
      include: {
        accounts: {
          where: { deletedAt: null },
          select: {
            id: true,
            accountNumber: true,
            currentBalance: true,
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Get guarantor info
    const primaryGuarantor = await db.patient.findUnique({
      where: { id: group.primaryGuarantorId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'FamilyGroup',
      entityId: group.id,
      details: {
        groupName: group.groupName,
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { ...group, primaryGuarantor } });
  },
  { permissions: ['billing:update'] }
);

/**
 * DELETE /api/billing/family-groups/[groupId]
 * Soft delete a family group
 */
export const DELETE = withAuth<{ groupId: string }>(
  async (req, session, context) => {
    const { groupId } = await context.params;

    // Check group exists
    const existingGroup = await db.familyGroup.findFirst({
      where: withSoftDelete({
        id: groupId,
        ...getClinicFilter(session),
      }),
      include: {
        accounts: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
    });

    if (!existingGroup) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Family group not found',
          },
        },
        { status: 404 }
      );
    }

    // Remove accounts from group first
    if (existingGroup.accounts.length > 0) {
      await db.patientAccount.updateMany({
        where: {
          familyGroupId: groupId,
          deletedAt: null,
        },
        data: {
          familyGroupId: null,
          updatedBy: session.user.id,
        },
      });
    }

    // Soft delete the group
    await db.familyGroup.update({
      where: { id: groupId },
      data: {
        deletedAt: new Date(),
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'FamilyGroup',
      entityId: groupId,
      details: {
        groupName: existingGroup.groupName,
        accountsRemoved: existingGroup.accounts.length,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { id: groupId } });
  },
  { permissions: ['billing:delete'] }
);

// Helper: Add member to family group
async function handleAddMember(
  req: Request,
  session: { user: { id: string; clinicId: string } },
  groupId: string,
  accountId: string
) {
  // Verify group exists
  const group = await db.familyGroup.findFirst({
    where: withSoftDelete({
      id: groupId,
      clinicId: session.user.clinicId,
    }),
  });

  if (!group) {
    return NextResponse.json(
      { success: false, error: { code: 'GROUP_NOT_FOUND', message: 'Family group not found' } },
      { status: 404 }
    );
  }

  // Verify account exists and is not already in a group
  const account = await db.patientAccount.findFirst({
    where: withSoftDelete({
      id: accountId,
      clinicId: session.user.clinicId,
    }),
  });

  if (!account) {
    return NextResponse.json(
      { success: false, error: { code: 'ACCOUNT_NOT_FOUND', message: 'Patient account not found' } },
      { status: 404 }
    );
  }

  if (account.familyGroupId && account.familyGroupId !== groupId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ALREADY_IN_GROUP',
          message: 'Account is already in another family group',
        },
      },
      { status: 400 }
    );
  }

  // Add to group
  const updatedAccount = await db.patientAccount.update({
    where: { id: accountId },
    data: {
      familyGroupId: groupId,
      updatedBy: session.user.id,
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  const { ipAddress, userAgent } = getRequestMeta(req);
  await logAudit({ user: session.user } as Parameters<typeof logAudit>[0], {
    action: 'UPDATE',
    entity: 'FamilyGroup',
    entityId: groupId,
    details: {
      action: 'addMember',
      accountId,
      accountNumber: updatedAccount.accountNumber,
    },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ success: true, data: updatedAccount });
}

// Helper: Remove member from family group
async function handleRemoveMember(
  req: Request,
  session: { user: { id: string; clinicId: string } },
  groupId: string,
  accountId: string
) {
  // Verify account is in this group
  const account = await db.patientAccount.findFirst({
    where: withSoftDelete({
      id: accountId,
      clinicId: session.user.clinicId,
      familyGroupId: groupId,
    }),
  });

  if (!account) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'ACCOUNT_NOT_IN_GROUP', message: 'Account is not in this family group' },
      },
      { status: 404 }
    );
  }

  // Remove from group
  const updatedAccount = await db.patientAccount.update({
    where: { id: accountId },
    data: {
      familyGroupId: null,
      updatedBy: session.user.id,
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  const { ipAddress, userAgent } = getRequestMeta(req);
  await logAudit({ user: session.user } as Parameters<typeof logAudit>[0], {
    action: 'UPDATE',
    entity: 'FamilyGroup',
    entityId: groupId,
    details: {
      action: 'removeMember',
      accountId,
      accountNumber: updatedAccount.accountNumber,
    },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ success: true, data: updatedAccount });
}
