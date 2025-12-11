import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateRetentionPolicySchema } from '@/lib/validations/imaging';

/**
 * GET /api/imaging/retention/policies/[policyId]
 * Get a specific retention policy
 */
export const GET = withAuth(
  async (
    req: NextRequest,
    session: Session,
    { params }: { params: Promise<{ policyId: string }> }
  ) => {
    try {
      const { policyId } = await params;

      const policy = await db.imageRetentionPolicy.findFirst({
        where: {
          id: policyId,
          ...getClinicFilter(session),
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              images: true,
            },
          },
        },
      });

      if (!policy) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Retention policy not found',
            },
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          ...policy,
          imageCount: policy._count.images,
          _count: undefined,
        },
      });
    } catch (error) {
      console.error('[Retention Policy API] GET Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch retention policy',
          },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['imaging:admin'] }
);

/**
 * PUT /api/imaging/retention/policies/[policyId]
 * Update a retention policy
 */
export const PUT = withAuth(
  async (
    req: NextRequest,
    session: Session,
    { params }: { params: Promise<{ policyId: string }> }
  ) => {
    try {
      const { policyId } = await params;
      const body = await req.json();

      const validation = updateRetentionPolicySchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request body',
              details: validation.error.flatten(),
            },
          },
          { status: 400 }
        );
      }

      // Verify policy exists and belongs to clinic
      const existingPolicy = await db.imageRetentionPolicy.findFirst({
        where: {
          id: policyId,
          ...getClinicFilter(session),
        },
      });

      if (!existingPolicy) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Retention policy not found',
            },
          },
          { status: 404 }
        );
      }

      const data = validation.data;

      // If setting as default, unset existing default
      if (data.isDefault === true && !existingPolicy.isDefault) {
        await db.imageRetentionPolicy.updateMany({
          where: {
            ...getClinicFilter(session),
            isDefault: true,
            id: { not: policyId },
          },
          data: { isDefault: false },
        });
      }

      // Update policy
      const policy = await db.imageRetentionPolicy.update({
        where: { id: policyId },
        data: {
          name: data.name,
          description: data.description,
          isDefault: data.isDefault,
          isActive: data.isActive,
          imageCategories: data.imageCategories,
          retentionYears: data.retentionYears,
          retentionForMinorsYears: data.retentionForMinorsYears,
          archiveAfterYears: data.archiveAfterYears,
          notifyBeforeArchive: data.notifyBeforeArchive,
          autoExtendOnAccess: data.autoExtendOnAccess,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              images: true,
            },
          },
        },
      });

      // Audit log
      const { ipAddress, userAgent } = getRequestMeta(req);
      await logAudit(session, {
        action: 'UPDATE',
        entity: 'ImageRetentionPolicy',
        entityId: policy.id,
        details: {
          changes: data,
        },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        data: {
          ...policy,
          imageCount: policy._count.images,
          _count: undefined,
        },
      });
    } catch (error) {
      console.error('[Retention Policy API] PUT Error:', error);

      if (
        error instanceof Error &&
        error.message.includes('Unique constraint')
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_NAME',
              message: 'A retention policy with this name already exists',
            },
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UPDATE_ERROR',
            message: 'Failed to update retention policy',
          },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['imaging:admin'] }
);

/**
 * DELETE /api/imaging/retention/policies/[policyId]
 * Delete a retention policy
 */
export const DELETE = withAuth(
  async (
    req: NextRequest,
    session: Session,
    { params }: { params: Promise<{ policyId: string }> }
  ) => {
    try {
      const { policyId } = await params;

      // Verify policy exists and belongs to clinic
      const policy = await db.imageRetentionPolicy.findFirst({
        where: {
          id: policyId,
          ...getClinicFilter(session),
        },
        include: {
          _count: {
            select: {
              images: true,
            },
          },
        },
      });

      if (!policy) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Retention policy not found',
            },
          },
          { status: 404 }
        );
      }

      // Check if policy has images assigned
      if (policy._count.images > 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'POLICY_IN_USE',
              message: `Cannot delete policy with ${policy._count.images} assigned images. Reassign images first.`,
            },
          },
          { status: 400 }
        );
      }

      // Delete policy
      await db.imageRetentionPolicy.delete({
        where: { id: policyId },
      });

      // Audit log
      const { ipAddress, userAgent } = getRequestMeta(req);
      await logAudit(session, {
        action: 'DELETE',
        entity: 'ImageRetentionPolicy',
        entityId: policyId,
        details: {
          name: policy.name,
        },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        data: { deleted: true },
      });
    } catch (error) {
      console.error('[Retention Policy API] DELETE Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DELETE_ERROR',
            message: 'Failed to delete retention policy',
          },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['imaging:admin'] }
);
