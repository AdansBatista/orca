import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { addDays } from 'date-fns';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { retentionReportQuerySchema } from '@/lib/validations/imaging';

/**
 * GET /api/imaging/retention/report
 * Get retention compliance report
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    try {
      const { searchParams } = new URL(req.url);
      const queryResult = retentionReportQuerySchema.safeParse(
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
      const now = new Date();

      // Build where clause based on status filter
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = withSoftDelete({
        ...getClinicFilter(session),
      });

      if (query.category) {
        where.category = query.category;
      }
      if (query.patientId) {
        where.patientId = query.patientId;
      }

      // Status-specific filters
      switch (query.status) {
        case 'expiring_soon': {
          const daysUntil = query.daysUntilExpiry || 90;
          where.retentionExpiresAt = {
            gte: now,
            lte: addDays(now, daysUntil),
          };
          where.isArchived = false;
          where.legalHold = false;
          break;
        }
        case 'expired':
          where.retentionExpiresAt = { lt: now };
          where.isArchived = false;
          where.legalHold = false;
          break;
        case 'archived':
          where.isArchived = true;
          break;
        case 'legal_hold':
          where.legalHold = true;
          break;
        // 'all' - no additional filters
      }

      // Get total count
      const total = await db.patientImage.count({ where });

      // Get images
      const images = await db.patientImage.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { retentionExpiresAt: 'asc' },
        select: {
          id: true,
          fileName: true,
          category: true,
          fileSize: true,
          captureDate: true,
          createdAt: true,
          retentionExpiresAt: true,
          isArchived: true,
          archivedAt: true,
          legalHold: true,
          legalHoldSetAt: true,
          legalHoldReason: true,
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              dateOfBirth: true,
            },
          },
          retentionPolicy: {
            select: {
              id: true,
              name: true,
              retentionYears: true,
            },
          },
        },
      });

      // Calculate summary stats
      const [
        totalImages,
        archivedCount,
        legalHoldCount,
        expiringSoonCount,
        expiredCount,
        noRetentionPolicyCount,
      ] = await Promise.all([
        db.patientImage.count({
          where: withSoftDelete(getClinicFilter(session)),
        }),
        db.patientImage.count({
          where: withSoftDelete({
            ...getClinicFilter(session),
            isArchived: true,
          }),
        }),
        db.patientImage.count({
          where: withSoftDelete({
            ...getClinicFilter(session),
            legalHold: true,
          }),
        }),
        db.patientImage.count({
          where: withSoftDelete({
            ...getClinicFilter(session),
            retentionExpiresAt: {
              gte: now,
              lte: addDays(now, 90),
            },
            isArchived: false,
            legalHold: false,
          }),
        }),
        db.patientImage.count({
          where: withSoftDelete({
            ...getClinicFilter(session),
            retentionExpiresAt: { lt: now },
            isArchived: false,
            legalHold: false,
          }),
        }),
        db.patientImage.count({
          where: withSoftDelete({
            ...getClinicFilter(session),
            retentionPolicyId: null,
          }),
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          items: images,
          total,
          page: query.page,
          pageSize: query.pageSize,
          totalPages: Math.ceil(total / query.pageSize),
          summary: {
            totalImages,
            archivedCount,
            legalHoldCount,
            expiringSoonCount,
            expiredCount,
            noRetentionPolicyCount,
            complianceRate:
              totalImages > 0
                ? Math.round(
                    ((totalImages - noRetentionPolicyCount) / totalImages) * 100
                  )
                : 100,
          },
        },
      });
    } catch (error) {
      console.error('[Retention Report API] GET Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch retention report',
          },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['imaging:admin'] }
);
