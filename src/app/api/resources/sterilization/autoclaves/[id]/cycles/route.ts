import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { fetchCyclesQuerySchema } from '@/lib/validations/autoclave';
import {
  fetchAvailableCycles,
  fetchMonthCycles,
  getCyclesSince,
  FlattenedCycle,
} from '@/lib/sterilization/autoclave-service';

/**
 * GET /api/resources/sterilization/autoclaves/[id]/cycles
 * List available cycles from the autoclave device
 *
 * Query params:
 * - year: Filter to specific year
 * - month: Filter to specific month (requires year)
 * - sinceCycleNumber: Get only cycles newer than this number
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      year: searchParams.get('year') ?? undefined,
      month: searchParams.get('month') ?? undefined,
      sinceCycleNumber: searchParams.get('sinceCycleNumber') ?? undefined,
    };

    const queryResult = fetchCyclesQuerySchema.safeParse(rawParams);

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

    const { year, month, sinceCycleNumber } = queryResult.data;

    // Find existing autoclave
    const autoclave = await db.autoclaveIntegration.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!autoclave) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Autoclave not found',
          },
        },
        { status: 404 }
      );
    }

    if (!autoclave.enabled) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTOCLAVE_DISABLED',
            message: 'Autoclave is disabled',
          },
        },
        { status: 400 }
      );
    }

    try {
      // If sinceCycleNumber is provided, get only newer cycles
      if (sinceCycleNumber !== undefined) {
        const cycles = await getCyclesSince(
          autoclave.ipAddress,
          autoclave.port,
          sinceCycleNumber
        );

        // Check which cycles are already imported
        const importedCycles = await getImportedCycleNumbers(
          session.user.clinicId,
          id,
          cycles.map((c) => parseInt(c.cycleNumber, 10))
        );

        return NextResponse.json({
          success: true,
          data: {
            cycles: cycles.map((c) => ({
              ...c,
              alreadyImported: importedCycles.has(parseInt(c.cycleNumber, 10)),
            })),
            total: cycles.length,
            newCount: cycles.filter(
              (c) => !importedCycles.has(parseInt(c.cycleNumber, 10))
            ).length,
          },
        });
      }

      // If year and month provided, get detailed month data
      if (year && month) {
        const days = await fetchMonthCycles(
          autoclave.ipAddress,
          autoclave.port,
          year,
          month
        );

        // Flatten to cycle list
        const cycles: FlattenedCycle[] = [];
        for (const dayData of days) {
          for (const cycleNum of dayData.cycles) {
            cycles.push({
              year,
              month,
              day: dayData.day,
              cycleNumber: cycleNum,
              date: new Date(parseInt(year), parseInt(month) - 1, parseInt(dayData.day)),
            });
          }
        }

        // Check which cycles are already imported
        const importedCycles = await getImportedCycleNumbers(
          session.user.clinicId,
          id,
          cycles.map((c) => parseInt(c.cycleNumber, 10))
        );

        return NextResponse.json({
          success: true,
          data: {
            year,
            month,
            days,
            cycles: cycles.map((c) => ({
              ...c,
              alreadyImported: importedCycles.has(parseInt(c.cycleNumber, 10)),
            })),
            total: cycles.length,
            newCount: cycles.filter(
              (c) => !importedCycles.has(parseInt(c.cycleNumber, 10))
            ).length,
          },
        });
      }

      // Otherwise, get the full index (years/months only)
      const index = await fetchAvailableCycles(autoclave.ipAddress, autoclave.port);

      return NextResponse.json({
        success: true,
        data: {
          index,
          lastCycleNum: autoclave.lastCycleNum,
        },
      });
    } catch (error) {
      console.error('Error fetching cycles from autoclave:', error);

      // Update autoclave status to error
      await db.autoclaveIntegration.update({
        where: { id },
        data: {
          status: 'ERROR',
          errorMessage: error instanceof Error ? error.message : 'Failed to fetch cycles',
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTOCLAVE_ERROR',
            message: error instanceof Error ? error.message : 'Failed to fetch cycles from autoclave',
          },
        },
        { status: 502 }
      );
    }
  },
  { permissions: ['sterilization:read'] }
);

/**
 * Helper to check which cycle numbers are already imported
 */
async function getImportedCycleNumbers(
  clinicId: string,
  autoclaveId: string,
  cycleNumbers: number[]
): Promise<Set<number>> {
  if (cycleNumbers.length === 0) return new Set();

  const imported = await db.sterilizationCycle.findMany({
    where: {
      clinicId,
      autoclaveId,
      externalCycleNumber: { in: cycleNumbers },
    },
    select: {
      externalCycleNumber: true,
    },
  });

  return new Set(imported.map((c) => c.externalCycleNumber).filter((n): n is number => n !== null));
}
