import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDeleteAnd } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updatePreferencesSchema } from '@/lib/validations/communications';

/**
 * GET /api/communications/preferences/[patientId]
 * Get notification preferences for a patient
 */
export const GET = withAuth<{ patientId: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { patientId } = await params;

    // Verify patient exists (using soft delete helper)
    const patient = await db.patient.findFirst({
      where: withSoftDeleteAnd([{ id: patientId }, getClinicFilter(session)]),
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
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

    // Get or create preferences
    let preferences = await db.notificationPreference.findFirst({
      where: {
        patientId,
        ...getClinicFilter(session),
      },
    });

    // If no preferences exist, return defaults
    if (!preferences) {
      return NextResponse.json({
        success: true,
        data: {
          patient,
          preferences: {
            patientId,
            smsEnabled: true,
            emailEnabled: true,
            pushEnabled: true,
            appointmentReminders: true,
            treatmentUpdates: true,
            billingNotifications: true,
            marketingMessages: false,
            channelPriority: ['SMS', 'EMAIL', 'PUSH', 'IN_APP'],
            quietHoursStart: null,
            quietHoursEnd: null,
            timezone: null,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        patient,
        preferences,
      },
    });
  },
  { permissions: ['comms:view_inbox'] }
);

/**
 * PUT /api/communications/preferences/[patientId]
 * Update notification preferences for a patient
 */
export const PUT = withAuth<{ patientId: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { patientId } = await params;
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = updatePreferencesSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid preferences data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;
    const clinicId = session.user.clinicId;

    // Verify patient exists (using soft delete helper)
    const patient = await db.patient.findFirst({
      where: withSoftDeleteAnd([{ id: patientId }, { clinicId }]),
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

    // Upsert preferences
    const preferences = await db.notificationPreference.upsert({
      where: {
        patientId,
      },
      create: {
        clinicId,
        patientId,
        ...data,
      },
      update: {
        ...data,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'NotificationPreference',
      entityId: preferences.id,
      details: {
        patientId,
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  },
  { permissions: ['comms:manage_preferences'] }
);
