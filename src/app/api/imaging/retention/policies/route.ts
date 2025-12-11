import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createRetentionPolicySchema,
  retentionPolicyListQuerySchema,
} from '@/lib/validations/imaging';

/**
 * GET /api/imaging/retention/policies
 * List retention policies for the clinic
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    try {
      const { searchParams } = new URL(req.url);
      const queryResult = retentionPolicyListQuerySchema.safeParse(
        Object.fromEntries(searchParams.entries())
      );

      if (!queryResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid query parameters',
              details: queryResult.error.flatten(),
            },
          },
          { status: 400 }
        );
      }

      const query = queryResult.data;
      const skip = (query.page - 1) * query.pageSize;

      // Build where clause
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = getClinicFilter(session);

      if (query.isActive !== undefined) {
        where.isActive = query.isActive === 'true';
      }

      // Get total count
      const total = await db.imageRetentionPolicy.count({ where });

      // Get policies
      const policies = await db.imageRetentionPolicy.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
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

      // Transform results
      const items = policies.map((policy) => ({
        ...policy,
        imageCount: policy._count.images,
        _count: undefined,
      }));

      return NextResponse.json({
        success: true,
        data: {
          items,
          total,
          page: query.page,
          pageSize: query.pageSize,
          totalPages: Math.ceil(total / query.pageSize),
        },
      });
    } catch (error) {
      console.error('[Retention Policies API] GET Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch retention policies',
          },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['imaging:admin'] }
);

/**
 * POST /api/imaging/retention/policies
 * Create a new retention policy
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    try {
      const body = await req.json();
      const validation = createRetentionPolicySchema.safeParse(body);

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

      const data = validation.data;

      // Get staff profile
      const staffProfile = await db.staffProfile.findFirst({
        where: {
          userId: session.user.id,
          ...getClinicFilter(session),
        },
      });

      if (!staffProfile) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'STAFF_NOT_FOUND',
              message: 'Staff profile not found',
            },
          },
          { status: 400 }
        );
      }

      // If this is set as default, unset any existing default
      if (data.isDefault) {
        await db.imageRetentionPolicy.updateMany({
          where: {
            ...getClinicFilter(session),
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }

      // Create policy
      const policy = await db.imageRetentionPolicy.create({
        data: {
          clinicId: session.user.clinicId,
          name: data.name,
          description: data.description,
          isDefault: data.isDefault,
          imageCategories: data.imageCategories,
          retentionYears: data.retentionYears,
          retentionForMinorsYears: data.retentionForMinorsYears,
          archiveAfterYears: data.archiveAfterYears,
          notifyBeforeArchive: data.notifyBeforeArchive,
          autoExtendOnAccess: data.autoExtendOnAccess,
          createdById: staffProfile.id,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Audit log
      const { ipAddress, userAgent } = getRequestMeta(req);
      await logAudit(session, {
        action: 'CREATE',
        entity: 'ImageRetentionPolicy',
        entityId: policy.id,
        details: {
          name: policy.name,
          retentionYears: policy.retentionYears,
          isDefault: policy.isDefault,
        },
        ipAddress,
        userAgent,
      });

      return NextResponse.json(
        {
          success: true,
          data: policy,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('[Retention Policies API] POST Error:', error);

      // Check for unique constraint violation
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
            code: 'CREATE_ERROR',
            message: 'Failed to create retention policy',
          },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['imaging:admin'] }
);
