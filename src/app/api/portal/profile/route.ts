/**
 * Portal Profile API
 *
 * GET /api/portal/profile - Get patient profile information
 * PUT /api/portal/profile - Update patient contact info and preferences
 *
 * Allows patients to view and update their own profile through the portal.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getPortalSession } from '@/lib/services/portal';

// Validation schema for profile updates
const profileUpdateSchema = z.object({
  // Contact information (optional - only update what's provided)
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),

  // Notification preferences
  preferences: z
    .object({
      smsEnabled: z.boolean().optional(),
      emailEnabled: z.boolean().optional(),
      pushEnabled: z.boolean().optional(),
      appointmentReminders: z.boolean().optional(),
      treatmentUpdates: z.boolean().optional(),
      billingNotifications: z.boolean().optional(),
      marketingMessages: z.boolean().optional(),
      quietHoursStart: z.string().nullable().optional(), // e.g., "21:00"
      quietHoursEnd: z.string().nullable().optional(), // e.g., "08:00"
      timezone: z.string().optional(),
    })
    .optional(),
});

/**
 * GET /api/portal/profile
 * Fetch patient's profile information and notification preferences
 */
export async function GET() {
  try {
    const session = await getPortalSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Please log in to continue' },
        },
        { status: 401 }
      );
    }

    // Get patient information
    const patient = await db.patient.findFirst({
      where: {
        id: session.patientId,
        clinicId: session.clinicId,
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
      },
    });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'PATIENT_NOT_FOUND', message: 'Patient record not found' },
        },
        { status: 404 }
      );
    }

    // Get notification preferences
    const preferences = await db.notificationPreference.findFirst({
      where: {
        patientId: session.patientId,
        clinicId: session.clinicId,
      },
    });

    // Get clinic info
    const clinic = await db.clinic.findUnique({
      where: { id: session.clinicId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        patient: {
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.email,
          phone: patient.phone,
          dateOfBirth: patient.dateOfBirth?.toISOString() || null,
        },
        preferences: preferences
          ? {
              smsEnabled: preferences.smsEnabled,
              emailEnabled: preferences.emailEnabled,
              pushEnabled: preferences.pushEnabled,
              appointmentReminders: preferences.appointmentReminders,
              treatmentUpdates: preferences.treatmentUpdates,
              billingNotifications: preferences.billingNotifications,
              marketingMessages: preferences.marketingMessages,
              quietHoursStart: preferences.quietHoursStart,
              quietHoursEnd: preferences.quietHoursEnd,
              timezone: preferences.timezone,
            }
          : {
              smsEnabled: true,
              emailEnabled: true,
              pushEnabled: true,
              appointmentReminders: true,
              treatmentUpdates: true,
              billingNotifications: true,
              marketingMessages: false,
              quietHoursStart: null,
              quietHoursEnd: null,
              timezone: null,
            },
        clinic,
      },
    });
  } catch (error) {
    console.error('[Portal Profile GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/portal/profile
 * Update patient contact information and notification preferences
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getPortalSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Please log in to continue' },
        },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = profileUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid profile data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { email, phone, preferences } = result.data;

    // Verify patient exists
    const existingPatient = await db.patient.findFirst({
      where: {
        id: session.patientId,
        clinicId: session.clinicId,
        deletedAt: null,
      },
    });

    if (!existingPatient) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'PATIENT_NOT_FOUND', message: 'Patient record not found' },
        },
        { status: 404 }
      );
    }

    // Update patient contact info if provided
    const patientUpdateData: Record<string, unknown> = {};
    if (email !== undefined) patientUpdateData.email = email;
    if (phone !== undefined) patientUpdateData.phone = phone;

    if (Object.keys(patientUpdateData).length > 0) {
      await db.patient.update({
        where: { id: session.patientId },
        data: patientUpdateData,
      });

      // Also update PortalAccount email if email changed
      if (email) {
        await db.portalAccount.update({
          where: { id: session.accountId },
          data: { email },
        });
      }
    }

    // Update notification preferences if provided
    if (preferences) {
      const prefUpdateData: Record<string, unknown> = {};
      if (preferences.smsEnabled !== undefined) prefUpdateData.smsEnabled = preferences.smsEnabled;
      if (preferences.emailEnabled !== undefined)
        prefUpdateData.emailEnabled = preferences.emailEnabled;
      if (preferences.pushEnabled !== undefined)
        prefUpdateData.pushEnabled = preferences.pushEnabled;
      if (preferences.appointmentReminders !== undefined)
        prefUpdateData.appointmentReminders = preferences.appointmentReminders;
      if (preferences.treatmentUpdates !== undefined)
        prefUpdateData.treatmentUpdates = preferences.treatmentUpdates;
      if (preferences.billingNotifications !== undefined)
        prefUpdateData.billingNotifications = preferences.billingNotifications;
      if (preferences.marketingMessages !== undefined) {
        prefUpdateData.marketingMessages = preferences.marketingMessages;
        // Track marketing consent
        if (preferences.marketingMessages) {
          prefUpdateData.marketingConsentAt = new Date();
          prefUpdateData.marketingConsentBy = 'portal';
        }
      }
      if (preferences.quietHoursStart !== undefined)
        prefUpdateData.quietHoursStart = preferences.quietHoursStart;
      if (preferences.quietHoursEnd !== undefined)
        prefUpdateData.quietHoursEnd = preferences.quietHoursEnd;
      if (preferences.timezone !== undefined) prefUpdateData.timezone = preferences.timezone;

      if (Object.keys(prefUpdateData).length > 0) {
        // Upsert notification preferences
        await db.notificationPreference.upsert({
          where: { patientId: session.patientId },
          update: prefUpdateData,
          create: {
            clinicId: session.clinicId,
            patientId: session.patientId,
            ...prefUpdateData,
          },
        });
      }
    }

    // Return updated profile
    const updatedPatient = await db.patient.findUnique({
      where: { id: session.patientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    const updatedPreferences = await db.notificationPreference.findFirst({
      where: {
        patientId: session.patientId,
        clinicId: session.clinicId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        patient: updatedPatient,
        preferences: updatedPreferences
          ? {
              smsEnabled: updatedPreferences.smsEnabled,
              emailEnabled: updatedPreferences.emailEnabled,
              pushEnabled: updatedPreferences.pushEnabled,
              appointmentReminders: updatedPreferences.appointmentReminders,
              treatmentUpdates: updatedPreferences.treatmentUpdates,
              billingNotifications: updatedPreferences.billingNotifications,
              marketingMessages: updatedPreferences.marketingMessages,
              quietHoursStart: updatedPreferences.quietHoursStart,
              quietHoursEnd: updatedPreferences.quietHoursEnd,
              timezone: updatedPreferences.timezone,
            }
          : null,
        message: 'Profile updated successfully',
      },
    });
  } catch (error) {
    console.error('[Portal Profile PUT] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    );
  }
}
