import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { z } from 'zod';

const querySchema = z.object({
  days: z.coerce.number().min(1).max(365).default(30),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
});

/**
 * GET /api/staff/documents/expiring
 * Get all documents expiring within a specified number of days
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    const queryResult = querySchema.safeParse({
      days: searchParams.get('days') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    });

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

    const { days, page, pageSize } = queryResult.data;

    const now = new Date();
    const expirationThreshold = new Date();
    expirationThreshold.setDate(expirationThreshold.getDate() + days);

    // Build where clause for expiring documents
    const where = {
      ...getClinicFilter(session),
      isCurrentVersion: true,
      expirationDate: {
        gte: now,
        lte: expirationThreshold,
      },
    };

    // Get total count
    const total = await db.staffDocument.count({ where });

    // Get paginated results
    const documents = await db.staffDocument.findMany({
      where,
      include: {
        staffProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
          },
        },
      },
      orderBy: [{ expirationDate: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Add days until expiration
    const documentsWithDays = documents.map((doc) => ({
      ...doc,
      daysUntilExpiration: doc.expirationDate
        ? Math.ceil((doc.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null,
    }));

    // Also get documents that are already expired
    const expiredWhere = {
      ...getClinicFilter(session),
      isCurrentVersion: true,
      expirationDate: {
        lt: now,
      },
      expirationStatus: { not: 'EXPIRED' as const }, // Not yet marked as expired
    };

    const expiredDocuments = await db.staffDocument.findMany({
      where: expiredWhere,
      include: {
        staffProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
          },
        },
      },
      orderBy: [{ expirationDate: 'desc' }],
      take: 20,
    });

    return NextResponse.json({
      success: true,
      data: {
        expiringSoon: {
          items: documentsWithDays,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
        alreadyExpired: expiredDocuments.map((doc) => ({
          ...doc,
          daysOverdue: doc.expirationDate
            ? Math.ceil((now.getTime() - doc.expirationDate.getTime()) / (1000 * 60 * 60 * 24))
            : null,
        })),
      },
    });
  },
  { permissions: ['staff:view', 'staff:edit', 'staff:full'] }
);
