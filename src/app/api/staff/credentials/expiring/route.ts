import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { z } from 'zod';

const querySchema = z.object({
  days: z.coerce.number().min(1).max(365).default(90),
});

/**
 * GET /api/staff/credentials/expiring
 * Get all credentials and certifications expiring within a specified number of days
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const queryResult = querySchema.safeParse({
      days: searchParams.get('days') ?? undefined,
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

    const { days } = queryResult.data;

    const now = new Date();
    const expirationThreshold = new Date();
    expirationThreshold.setDate(expirationThreshold.getDate() + days);

    // Get expiring credentials
    const credentials = await db.credential.findMany({
      where: {
        ...getClinicFilter(session),
        expirationDate: {
          lte: expirationThreshold,
        },
        status: { not: 'REVOKED' },
      },
      include: {
        staffProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
      orderBy: { expirationDate: 'asc' },
    });

    // Get expiring certifications
    const certifications = await db.certification.findMany({
      where: {
        ...getClinicFilter(session),
        expirationDate: {
          lte: expirationThreshold,
        },
        status: { not: 'REVOKED' },
      },
      include: {
        staffProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
      orderBy: { expirationDate: 'asc' },
    });

    // Calculate stats
    const allItems = [
      ...credentials.map((c) => ({ type: 'credential', expDate: c.expirationDate })),
      ...certifications.map((c) => ({ type: 'certification', expDate: c.expirationDate })),
    ];

    const stats = {
      expired: allItems.filter((i) => i.expDate && new Date(i.expDate) < now).length,
      critical: allItems.filter((i) => {
        if (!i.expDate) return false;
        const d = new Date(i.expDate);
        const daysUntil = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil >= 0 && daysUntil <= 30;
      }).length,
      warning: allItems.filter((i) => {
        if (!i.expDate) return false;
        const d = new Date(i.expDate);
        const daysUntil = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil > 30 && daysUntil <= 60;
      }).length,
      upcoming: allItems.filter((i) => {
        if (!i.expDate) return false;
        const d = new Date(i.expDate);
        const daysUntil = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil > 60 && daysUntil <= days;
      }).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        credentials,
        certifications,
        stats,
      },
    });
  },
  { permissions: ['staff:view', 'staff:edit', 'staff:full'] }
);
