import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';

/**
 * GET /api/patients/[patientId]/treatment-phases
 * Get all treatment plans and phases for a patient (for image linking UI)
 */
export const GET = withAuth(
  async (
    req: NextRequest,
    session: Session,
    { params }: { params: Promise<{ patientId: string }> }
  ) => {
    try {
      const { patientId } = await params;

      // Verify patient exists and belongs to clinic
      const patient = await db.patient.findFirst({
        where: withSoftDelete({
          id: patientId,
          ...getClinicFilter(session),
        }),
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
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

      // Get all treatment plans with their phases
      const treatmentPlans = await db.treatmentPlan.findMany({
        where: withSoftDelete({
          patientId,
          ...getClinicFilter(session),
        }),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          planNumber: true,
          planName: true,
          planType: true,
          status: true,
          startDate: true,
          estimatedEndDate: true,
          phases: {
            orderBy: { phaseNumber: 'asc' },
            select: {
              id: true,
              phaseNumber: true,
              phaseName: true,
              phaseType: true,
              status: true,
              progressPercent: true,
              plannedStartDate: true,
              plannedEndDate: true,
              actualStartDate: true,
              actualEndDate: true,
              _count: {
                select: {
                  images: true,
                },
              },
            },
          },
          _count: {
            select: {
              phases: true,
            },
          },
        },
      });

      // Transform to add image counts
      const plansWithPhases = treatmentPlans.map((plan) => ({
        ...plan,
        phases: plan.phases.map((phase) => ({
          ...phase,
          imageCount: phase._count.images,
          _count: undefined,
        })),
        phaseCount: plan._count.phases,
        _count: undefined,
      }));

      return NextResponse.json({
        success: true,
        data: {
          patient,
          treatmentPlans: plansWithPhases,
        },
      });
    } catch (error) {
      console.error('[Patient Treatment Phases API] Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch treatment phases',
          },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['imaging:view'] }
);
