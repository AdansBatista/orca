import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateCollectionAgencySchema } from '@/lib/validations/collections';

interface RouteParams {
  params: Promise<{ agencyId: string }>;
}

/**
 * GET /api/collections/agencies/:agencyId
 * Get agency details
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { agencyId } = await params;

    const agency = await db.collectionAgency.findFirst({
      where: withSoftDelete({
        id: agencyId,
        clinicId: session.user.clinicId,
      }),
      include: {
        referrals: {
          orderBy: { referralDate: 'desc' },
          take: 20,
          include: {
            agency: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!agency) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AGENCY_NOT_FOUND',
            message: 'Collection agency not found',
          },
        },
        { status: 404 }
      );
    }

    // Get aggregate stats
    const stats = await db.agencyReferral.aggregate({
      where: {
        agencyId,
        clinicId: session.user.clinicId,
      },
      _sum: {
        referredBalance: true,
        collectedAmount: true,
        agencyFees: true,
        netRecovered: true,
      },
      _count: true,
    });

    // Get status breakdown
    const statusBreakdown = await db.agencyReferral.groupBy({
      by: ['status'],
      where: {
        agencyId,
        clinicId: session.user.clinicId,
      },
      _count: true,
      _sum: {
        referredBalance: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...agency,
        stats: {
          totalReferred: stats._sum.referredBalance || 0,
          totalCollected: stats._sum.collectedAmount || 0,
          totalFees: stats._sum.agencyFees || 0,
          netRecovered: stats._sum.netRecovered || 0,
          referralCount: stats._count,
          collectionRate: stats._sum.referredBalance
            ? Math.round(((stats._sum.collectedAmount || 0) / stats._sum.referredBalance) * 100 * 10) / 10
            : 0,
        },
        statusBreakdown: statusBreakdown.reduce((acc, item) => {
          acc[item.status] = {
            count: item._count,
            balance: item._sum.referredBalance || 0,
          };
          return acc;
        }, {} as Record<string, { count: number; balance: number }>),
      },
    });
  },
  { permissions: ['collections:read'] }
);

/**
 * PATCH /api/collections/agencies/:agencyId
 * Update an agency
 */
export const PATCH = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { agencyId } = await params;
    const body = await req.json();

    const result = updateCollectionAgencySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid agency data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const existingAgency = await db.collectionAgency.findFirst({
      where: withSoftDelete({
        id: agencyId,
        clinicId: session.user.clinicId,
      }),
    });

    if (!existingAgency) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AGENCY_NOT_FOUND',
            message: 'Collection agency not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    const agency = await db.collectionAgency.update({
      where: { id: agencyId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.contactName !== undefined && { contactName: data.contactName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.street !== undefined && { street: data.street }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.zip !== undefined && { zip: data.zip }),
        ...(data.exportFormat !== undefined && { exportFormat: data.exportFormat }),
        ...(data.feePercentage !== undefined && { feePercentage: data.feePercentage }),
        ...(data.minBalance !== undefined && { minBalance: data.minBalance }),
        ...(data.minDays !== undefined && { minDays: data.minDays }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'CollectionAgency',
      entityId: agencyId,
      details: { changes: data },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: agency,
    });
  },
  { permissions: ['collections:manage'] }
);

/**
 * DELETE /api/collections/agencies/:agencyId
 * Soft delete an agency
 */
export const DELETE = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { agencyId } = await params;

    const existingAgency = await db.collectionAgency.findFirst({
      where: withSoftDelete({
        id: agencyId,
        clinicId: session.user.clinicId,
      }),
      include: {
        _count: {
          select: { referrals: true },
        },
      },
    });

    if (!existingAgency) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AGENCY_NOT_FOUND',
            message: 'Collection agency not found',
          },
        },
        { status: 404 }
      );
    }

    // Check for active referrals
    const activeReferrals = await db.agencyReferral.count({
      where: {
        agencyId,
        status: 'ACTIVE',
      },
    });

    if (activeReferrals > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AGENCY_IN_USE',
            message: `Cannot delete agency with ${activeReferrals} active referrals`,
          },
        },
        { status: 400 }
      );
    }

    // Soft delete
    await db.collectionAgency.update({
      where: { id: agencyId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'CollectionAgency',
      entityId: agencyId,
      details: { name: existingAgency.name },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  },
  { permissions: ['collections:manage'] }
);
