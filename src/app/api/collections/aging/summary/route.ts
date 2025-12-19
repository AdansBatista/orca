import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { withAuth } from '@/lib/auth/with-auth';
import {
  calculateAgingSummary,
  calculateDSO,
  calculateCollectionSummary,
} from '@/lib/billing/collections-utils';

/**
 * GET /api/collections/aging/summary
 * Get aging summary statistics
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);
    const includeZeroBalance = searchParams.get('includeZeroBalance') === 'true';

    // Calculate aging summary
    const agingSummary = await calculateAgingSummary(
      session.user.clinicId,
      includeZeroBalance
    );

    // Calculate DSO (Days Sales Outstanding)
    const dso = await calculateDSO(session.user.clinicId);

    // Calculate collection summary
    const collectionSummary = await calculateCollectionSummary(session.user.clinicId);

    return NextResponse.json({
      success: true,
      data: {
        aging: agingSummary,
        dso,
        collections: collectionSummary,
      },
    });
  },
  { permissions: ['collections:read'] }
);
