import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { updateReminderTemplateSchema } from '@/lib/validations/emergency-reminders';

/**
 * GET /api/booking/reminder-templates/:id
 * Get a specific reminder template
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;

    const template = await db.reminderTemplate.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Reminder template not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  },
  { permissions: ['booking:read'] }
);

/**
 * PUT /api/booking/reminder-templates/:id
 * Update a reminder template
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    const validationResult = updateReminderTemplateSchema.safeParse(body);

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

    const existing = await db.reminderTemplate.findFirst({
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
            message: 'Reminder template not found',
          },
        },
        { status: 404 }
      );
    }

    const data = validationResult.data;

    // If setting as default, unset other defaults for this channel/type
    if (data.isDefault && !existing.isDefault) {
      await db.reminderTemplate.updateMany({
        where: {
          clinicId: session.user.clinicId,
          channel: data.channel || existing.channel,
          type: data.type || existing.type,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    const template = await db.reminderTemplate.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      success: true,
      data: template,
    });
  },
  { permissions: ['booking:write'] }
);

/**
 * DELETE /api/booking/reminder-templates/:id
 * Delete a reminder template
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;

    const existing = await db.reminderTemplate.findFirst({
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
            message: 'Reminder template not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if template is used in any sequences
    const usageCount = await db.reminderSequenceStep.count({
      where: { templateId: id },
    });

    if (usageCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TEMPLATE_IN_USE',
            message: `Cannot delete template that is used in ${usageCount} reminder sequence(s)`,
          },
        },
        { status: 400 }
      );
    }

    await db.reminderTemplate.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  },
  { permissions: ['booking:write'] }
);
