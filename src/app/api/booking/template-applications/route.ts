import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { eachDayOfInterval, getDay, format } from 'date-fns';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { applyTemplateSchema } from '@/lib/validations/advanced-scheduling';

/**
 * GET /api/booking/template-applications
 * List template applications with filtering
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const providerId = searchParams.get('providerId') ?? undefined;
    const templateId = searchParams.get('templateId') ?? undefined;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    if (providerId) {
      where.providerId = providerId;
    }

    if (templateId) {
      where.templateId = templateId;
    }

    if (startDate && endDate) {
      where.appliedDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const applications = await db.templateApplication.findMany({
      where,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            slots: true,
            color: true,
          },
        },
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { appliedDate: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      data: applications,
    });
  },
  { permissions: ['booking:read'] }
);

/**
 * POST /api/booking/template-applications
 * Apply a template to a date range
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();
    const validationResult = applyTemplateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid application data',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Verify template exists
    const template = await db.bookingTemplate.findFirst({
      where: {
        id: data.templateId,
        ...getClinicFilter(session),
      },
    });

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: 'Template not found',
          },
        },
        { status: 404 }
      );
    }

    // Verify provider exists if specified
    if (data.providerId) {
      const provider = await db.staffProfile.findFirst({
        where: {
          id: data.providerId,
          ...getClinicFilter(session),
          isProvider: true,
        },
      });

      if (!provider) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'PROVIDER_NOT_FOUND',
              message: 'Provider not found',
            },
          },
          { status: 404 }
        );
      }
    }

    // Calculate date range
    const startDate = data.dateRangeStart || data.appliedDate;
    const endDate = data.dateRangeEnd || data.appliedDate;

    // Get all days in the range
    const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });

    // Get template blocks/slots
    const blocks = (template.slots as Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      appointmentTypeIds?: string[];
      isBlocked?: boolean;
      blockReason?: string | null;
      label?: string | null;
      color?: string | null;
    }>) || [];

    // Count stats
    let slotsCreated = 0;
    let slotsSkipped = 0;

    // Convert null to undefined for Prisma queries
    const providerId = data.providerId ?? undefined;

    // If override is not enabled, check for existing applications
    if (!data.overrideExisting) {
      const existingApplications = await db.templateApplication.findMany({
        where: {
          ...getClinicFilter(session),
          providerId,
          appliedDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Create a set of already-applied dates
      const appliedDates = new Set(
        existingApplications.map((a) => format(a.appliedDate, 'yyyy-MM-dd'))
      );

      // Filter out days that already have applications
      for (const day of daysInRange) {
        const dayKey = format(day, 'yyyy-MM-dd');
        const dayOfWeek = getDay(day);
        const blocksForDay = blocks.filter((b) => b.dayOfWeek === dayOfWeek);

        if (appliedDates.has(dayKey)) {
          slotsSkipped += blocksForDay.length;
        } else {
          slotsCreated += blocksForDay.length;
        }
      }
    } else {
      // Override mode - delete existing applications in range first
      await db.templateApplication.deleteMany({
        where: {
          ...getClinicFilter(session),
          providerId,
          appliedDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Count all blocks that will be created
      for (const day of daysInRange) {
        const dayOfWeek = getDay(day);
        const blocksForDay = blocks.filter((b) => b.dayOfWeek === dayOfWeek);
        slotsCreated += blocksForDay.length;
      }
    }

    // Create the application record
    const application = await db.templateApplication.create({
      data: {
        clinicId: session.user.clinicId,
        templateId: data.templateId,
        providerId,
        appliedDate: data.appliedDate,
        dateRangeStart: startDate,
        dateRangeEnd: endDate,
        overrideExisting: data.overrideExisting,
        slotsCreated,
        slotsSkipped,
        appliedBy: session.user.id,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: application,
      },
      { status: 201 }
    );
  },
  { permissions: ['booking:write'] }
);

/**
 * DELETE /api/booking/template-applications
 * Remove template applications from a date range
 * Query params: providerId, templateId, startDate, endDate
 */
export const DELETE = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const providerId = searchParams.get('providerId') ?? undefined;
    const templateId = searchParams.get('templateId') ?? undefined;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    if (providerId) {
      where.providerId = providerId;
    }

    if (templateId) {
      where.templateId = templateId;
    }

    // Require at least a date range or specific template
    if (!startDate || !endDate) {
      if (!templateId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Must provide either a date range or templateId',
            },
          },
          { status: 400 }
        );
      }
    }

    if (startDate && endDate) {
      where.appliedDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Delete the applications
    const result = await db.templateApplication.deleteMany({
      where,
    });

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: result.count,
      },
    });
  },
  { permissions: ['booking:write'] }
);
