import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { updateAfterHoursSettingsSchema } from '@/lib/validations/emergency-reminders';

/**
 * GET /api/booking/after-hours/settings
 * Get after-hours settings for the clinic
 */
export const GET = withAuth(
  async (req, session) => {
    let settings = await db.afterHoursSettings.findFirst({
      where: getClinicFilter(session),
    });

    // If no settings exist, return defaults
    if (!settings) {
      settings = {
        id: '',
        clinicId: session.user.clinicId,
        weekdayOpen: '08:00',
        weekdayClose: '17:00',
        saturdayOpen: null,
        saturdayClose: null,
        sundayOpen: null,
        sundayClose: null,
        afterHoursPhone: null,
        answeringServicePhone: null,
        emergencyLinePhone: null,
        smsAutoReply: null,
        emailAutoReply: null,
        voicemailGreeting: null,
        emergencyKeywords: ['pain', 'bleeding', 'swelling', 'broken', 'emergency'],
        urgentResponseMinutes: 30,
        routineResponseHours: 24,
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: null,
      };
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  },
  { permissions: ['booking:read'] }
);

/**
 * PUT /api/booking/after-hours/settings
 * Update after-hours settings for the clinic
 */
export const PUT = withAuth(
  async (req, session) => {
    const body = await req.json();

    const validationResult = updateAfterHoursSettingsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid settings data',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Upsert - create if doesn't exist, update if it does
    const settings = await db.afterHoursSettings.upsert({
      where: {
        clinicId: session.user.clinicId,
      },
      create: {
        clinicId: session.user.clinicId,
        ...data,
        updatedBy: session.user.id,
      },
      update: {
        ...data,
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: settings,
    });
  },
  { permissions: ['booking:write'] }
);
