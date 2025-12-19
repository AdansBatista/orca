import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { createReminderTemplateSchema, reminderTemplateQuerySchema } from '@/lib/validations/emergency-reminders';

/**
 * GET /api/booking/reminder-templates
 * List reminder templates with filtering
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validationResult = reminderTemplateQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { channel, type, isActive, page, pageSize } = validationResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    if (channel) where.channel = channel;
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive;

    // Get total count
    const total = await db.reminderTemplate.count({ where });

    // Get paginated results
    const templates = await db.reminderTemplate.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: templates,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['booking:read'] }
);

/**
 * POST /api/booking/reminder-templates
 * Create a new reminder template
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    const validationResult = createReminderTemplateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid template data',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // If setting as default, unset other defaults for this channel/type
    if (data.isDefault) {
      await db.reminderTemplate.updateMany({
        where: {
          clinicId: session.user.clinicId,
          channel: data.channel,
          type: data.type,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const template = await db.reminderTemplate.create({
      data: {
        ...data,
        clinicId: session.user.clinicId,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: template,
    });
  },
  { permissions: ['booking:write'] }
);
