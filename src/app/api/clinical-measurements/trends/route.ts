import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { z } from 'zod';

const trendsQuerySchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  measurementTypes: z.string().optional(), // Comma-separated list of types
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});

/**
 * GET /api/clinical-measurements/trends
 * Get measurement trends over time for a patient
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      patientId: searchParams.get('patientId') ?? undefined,
      measurementTypes: searchParams.get('measurementTypes') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
    };

    const queryResult = trendsQuerySchema.safeParse(rawParams);

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

    const { patientId, measurementTypes, fromDate, toDate } = queryResult.data;

    // Verify patient exists and belongs to clinic
    const patient = await db.patient.findFirst({
      where: withSoftDelete({
        id: patientId,
        ...getClinicFilter(session),
      }),
    });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PATIENT_NOT_FOUND',
            message: 'Patient not found',
          },
        },
        { status: 404 }
      );
    }

    // Build where clause
    const where: Record<string, unknown> = {
      patientId,
      ...getClinicFilter(session),
    };

    if (measurementTypes) {
      const types = measurementTypes.split(',').map((t) => t.trim());
      where.measurementType = { in: types };
    }

    if (fromDate || toDate) {
      where.measurementDate = {};
      if (fromDate) {
        (where.measurementDate as Record<string, Date>).gte = fromDate;
      }
      if (toDate) {
        (where.measurementDate as Record<string, Date>).lte = toDate;
      }
    }

    // Get all measurements ordered by date
    const measurements = await db.clinicalMeasurement.findMany({
      where,
      orderBy: { measurementDate: 'asc' },
      select: {
        id: true,
        measurementType: true,
        measurementDate: true,
        value: true,
        unit: true,
        method: true,
        notes: true,
      },
    });

    // Group measurements by type for trend analysis
    const trendsByType: Record<
      string,
      {
        type: string;
        unit: string;
        dataPoints: Array<{
          id: string;
          date: Date;
          value: number;
          method: string | null;
          notes: string | null;
        }>;
        statistics: {
          count: number;
          min: number;
          max: number;
          average: number;
          latest: number;
          earliest: number;
          change: number;
          changePercent: number;
        };
      }
    > = {};

    for (const m of measurements) {
      if (!trendsByType[m.measurementType]) {
        trendsByType[m.measurementType] = {
          type: m.measurementType,
          unit: m.unit,
          dataPoints: [],
          statistics: {
            count: 0,
            min: Infinity,
            max: -Infinity,
            average: 0,
            latest: 0,
            earliest: 0,
            change: 0,
            changePercent: 0,
          },
        };
      }

      trendsByType[m.measurementType].dataPoints.push({
        id: m.id,
        date: m.measurementDate,
        value: m.value,
        method: m.method,
        notes: m.notes,
      });
    }

    // Calculate statistics for each type
    for (const type of Object.keys(trendsByType)) {
      const trend = trendsByType[type];
      const values = trend.dataPoints.map((d) => d.value);

      trend.statistics.count = values.length;
      trend.statistics.min = Math.min(...values);
      trend.statistics.max = Math.max(...values);
      trend.statistics.average = values.reduce((a, b) => a + b, 0) / values.length;
      trend.statistics.earliest = values[0];
      trend.statistics.latest = values[values.length - 1];
      trend.statistics.change = trend.statistics.latest - trend.statistics.earliest;
      trend.statistics.changePercent =
        trend.statistics.earliest !== 0
          ? ((trend.statistics.change / trend.statistics.earliest) * 100)
          : 0;
    }

    return NextResponse.json({
      success: true,
      data: {
        patientId,
        patient: {
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
        },
        trends: Object.values(trendsByType),
        totalMeasurements: measurements.length,
        dateRange: {
          from: measurements.length > 0 ? measurements[0].measurementDate : null,
          to: measurements.length > 0 ? measurements[measurements.length - 1].measurementDate : null,
        },
      },
    });
  },
  { permissions: ['treatment:read'] }
);
