import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { z } from 'zod';

const wireSequenceQuerySchema = z.object({
  applianceRecordId: z.string().min(1),
  arch: z.enum(['UPPER', 'LOWER', 'BOTH']).optional(),
});

/**
 * GET /api/wires/sequence
 * Get wire sequence for an appliance (chronological wire history)
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      applianceRecordId: searchParams.get('applianceRecordId') ?? '',
      arch: searchParams.get('arch') ?? undefined,
    };

    const queryResult = wireSequenceQuerySchema.safeParse(rawParams);

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

    const { applianceRecordId, arch } = queryResult.data;

    // Verify appliance record belongs to clinic
    const applianceRecord = await db.applianceRecord.findFirst({
      where: {
        id: applianceRecordId,
        ...getClinicFilter(session),
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

    if (!applianceRecord) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'APPLIANCE_NOT_FOUND',
            message: 'Appliance record not found',
          },
        },
        { status: 404 }
      );
    }

    // Build where clause
    const where: Record<string, unknown> = {
      applianceRecordId,
      ...getClinicFilter(session),
    };

    if (arch) {
      where.arch = arch;
    }

    // Get all wires for this appliance in sequence order
    const wires = await db.wireRecord.findMany({
      where,
      orderBy: [{ arch: 'asc' }, { sequenceNumber: 'asc' }],
      include: {
        placedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        removedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Group by arch
    const upperWires = wires.filter((w) => w.arch === 'UPPER' || w.arch === 'BOTH');
    const lowerWires = wires.filter((w) => w.arch === 'LOWER' || w.arch === 'BOTH');

    // Calculate current wire (most recent active)
    const currentUpperWire = upperWires.find((w) => w.status === 'ACTIVE');
    const currentLowerWire = lowerWires.find((w) => w.status === 'ACTIVE');

    // Calculate stats
    const stats = {
      totalWireChanges: wires.length,
      upperWireChanges: upperWires.length,
      lowerWireChanges: lowerWires.length,
      averageDaysPerWire: calculateAverageWireDuration(wires),
      currentPhase: determineWirePhase(currentUpperWire, currentLowerWire),
    };

    return NextResponse.json({
      success: true,
      data: {
        applianceRecord: {
          id: applianceRecord.id,
          applianceType: applianceRecord.applianceType,
          patient: applianceRecord.patient,
        },
        sequence: {
          upper: upperWires,
          lower: lowerWires,
          current: {
            upper: currentUpperWire || null,
            lower: currentLowerWire || null,
          },
        },
        stats,
      },
    });
  },
  { permissions: ['treatment:read'] }
);

/**
 * Calculate average wire duration in days
 */
function calculateAverageWireDuration(wires: { placedDate: Date; removedDate: Date | null; status: string }[]): number | null {
  const completedWires = wires.filter((w) => w.removedDate);
  if (completedWires.length === 0) return null;

  const totalDays = completedWires.reduce((sum, wire) => {
    const days = Math.ceil(
      (new Date(wire.removedDate!).getTime() - new Date(wire.placedDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return sum + days;
  }, 0);

  return Math.round(totalDays / completedWires.length);
}

/**
 * Determine current wire phase based on wire characteristics
 */
function determineWirePhase(
  upperWire: { wireSize: string; wireMaterial: string } | undefined,
  lowerWire: { wireSize: string; wireMaterial: string } | undefined
): string {
  const currentWire = upperWire || lowerWire;
  if (!currentWire) return 'Not Started';

  const { wireSize, wireMaterial } = currentWire;
  const size = wireSize.toLowerCase();
  const material = wireMaterial.toUpperCase();

  // Initial alignment phase (small NiTi wires)
  if (size.includes('0.012') || size.includes('0.014')) {
    return 'Initial Alignment';
  }

  // Early leveling (medium NiTi)
  if (size.includes('0.016') && !size.includes('x') && material.includes('NITI')) {
    return 'Early Leveling';
  }

  // Late leveling (rectangular NiTi)
  if (size.includes('x') && material.includes('NITI')) {
    return 'Late Leveling';
  }

  // Working phase (SS wires)
  if (material.includes('STEEL') || material === 'SS') {
    if (size.includes('0.019') || size.includes('0.018')) {
      return 'Working Phase';
    }
    if (size.includes('0.021')) {
      return 'Finishing Phase';
    }
  }

  // TMA for detailing
  if (material === 'TMA' || material.includes('TITANIUM')) {
    return 'Detailing Phase';
  }

  return 'Active Treatment';
}
