import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import {
  updateEmergencySchema,
  triageEmergencySchema,
  resolveEmergencySchema,
} from '@/lib/validations/emergency-reminders';

/**
 * GET /api/booking/emergencies/:id
 * Get a specific emergency appointment request
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;

    const emergency = await db.emergencyAppointment.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!emergency) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Emergency appointment not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: emergency,
    });
  },
  { permissions: ['booking:read'] }
);

/**
 * PUT /api/booking/emergencies/:id
 * Update an emergency appointment request
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    const validationResult = updateEmergencySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update data',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Check if emergency exists
    const existing = await db.emergencyAppointment.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Emergency appointment not found',
          },
        },
        { status: 404 }
      );
    }

    // Don't allow updates to resolved emergencies
    if (existing.resolution) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_RESOLVED',
            message: 'Cannot update a resolved emergency',
          },
        },
        { status: 400 }
      );
    }

    const emergency = await db.emergencyAppointment.update({
      where: { id },
      data: validationResult.data,
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

    return NextResponse.json({
      success: true,
      data: emergency,
    });
  },
  { permissions: ['booking:write'] }
);

/**
 * PATCH /api/booking/emergencies/:id/triage
 * Complete triage for an emergency
 */
export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    // Determine action from URL
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    if (action === 'triage') {
      const validationResult = triageEmergencySchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid triage data',
              details: validationResult.error.flatten(),
            },
          },
          { status: 400 }
        );
      }

      const existing = await db.emergencyAppointment.findFirst({
        where: {
          id,
          ...getClinicFilter(session),
        },
      });

      if (!existing) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Emergency appointment not found',
            },
          },
          { status: 404 }
        );
      }

      const { triageStatus, triageNotes, severity, selfCareInstructions } = validationResult.data;

      const emergency = await db.emergencyAppointment.update({
        where: { id },
        data: {
          triageStatus,
          triageNotes,
          ...(severity && { severity }),
          ...(selfCareInstructions && { selfCareInstructions }),
          triageCompletedAt: triageStatus === 'COMPLETED' || triageStatus === 'REFERRED' ? new Date() : null,
          triageCompletedBy: triageStatus === 'COMPLETED' || triageStatus === 'REFERRED' ? session.user.id : null,
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

      return NextResponse.json({
        success: true,
        data: emergency,
      });
    }

    if (action === 'resolve') {
      const validationResult = resolveEmergencySchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid resolution data',
              details: validationResult.error.flatten(),
            },
          },
          { status: 400 }
        );
      }

      const existing = await db.emergencyAppointment.findFirst({
        where: {
          id,
          ...getClinicFilter(session),
        },
      });

      if (!existing) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Emergency appointment not found',
            },
          },
          { status: 404 }
        );
      }

      if (existing.resolution) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'ALREADY_RESOLVED',
              message: 'Emergency is already resolved',
            },
          },
          { status: 400 }
        );
      }

      const { resolution, resolutionNotes, appointmentId, scheduledFor } = validationResult.data;

      const emergency = await db.emergencyAppointment.update({
        where: { id },
        data: {
          resolution,
          resolutionNotes,
          resolvedAt: new Date(),
          resolvedBy: session.user.id,
          ...(appointmentId && { appointmentId }),
          ...(scheduledFor && { scheduledFor }),
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

      return NextResponse.json({
        success: true,
        data: emergency,
      });
    }

    // Default update (for general PATCH requests)
    const validationResult = updateEmergencySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update data',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const existing = await db.emergencyAppointment.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Emergency appointment not found',
          },
        },
        { status: 404 }
      );
    }

    const emergency = await db.emergencyAppointment.update({
      where: { id },
      data: validationResult.data,
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

    return NextResponse.json({
      success: true,
      data: emergency,
    });
  },
  { permissions: ['booking:write'] }
);

/**
 * DELETE /api/booking/emergencies/:id
 * Delete an emergency appointment request
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;

    const existing = await db.emergencyAppointment.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Emergency appointment not found',
          },
        },
        { status: 404 }
      );
    }

    await db.emergencyAppointment.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  },
  { permissions: ['booking:write'] }
);
