import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createLeadSchema, leadQuerySchema } from '@/lib/validations/leads';

/**
 * GET /api/leads
 * List leads with pagination, search, and filters
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      stage: searchParams.get('stage') ?? undefined,
      source: searchParams.get('source') ?? undefined,
      assignedToId: searchParams.get('assignedToId') ?? undefined,
      patientType: searchParams.get('patientType') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = leadQuerySchema.safeParse(rawParams);

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

    const {
      search,
      status,
      stage,
      source,
      assignedToId,
      patientType,
      fromDate,
      toDate,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause with soft delete filter
    const where: Record<string, unknown> = withSoftDelete(getClinicFilter(session));

    if (status) where.status = status;
    if (stage) where.stage = stage;
    if (source) where.source = source;
    if (assignedToId) where.assignedToId = assignedToId;
    if (patientType) where.patientType = patientType;

    // Date range filter
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) (where.createdAt as Record<string, Date>).gte = fromDate;
      if (toDate) (where.createdAt as Record<string, Date>).lte = toDate;
    }

    // Search across name, email, phone
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { primaryConcern: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await db.lead.count({ where });

    // Get paginated results
    const items = await db.lead.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
        referringDentist: {
          select: { id: true, practiceName: true, firstName: true, lastName: true },
        },
        _count: {
          select: { activities: true, tasks: true, formSubmissions: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['leads:view', 'leads:edit', 'leads:full'] }
);

/**
 * POST /api/leads
 * Create a new lead
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createLeadSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid lead data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check for duplicate by phone or email in this clinic (if provided)
    if (data.email) {
      const existingByEmail = await db.lead.findFirst({
        where: withSoftDelete({
          clinicId: session.user.clinicId,
          email: data.email,
          status: { not: 'CONVERTED' as const }, // Allow duplicate if converted
        }),
      });

      if (existingByEmail) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_LEAD',
              message: 'A lead with this email already exists',
              existingLeadId: existingByEmail.id,
            },
          },
          { status: 409 }
        );
      }
    }

    // Create the lead
    const lead = await db.lead.create({
      data: {
        ...data,
        clinicId: session.user.clinicId,
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
        referringDentist: {
          select: { id: true, practiceName: true, firstName: true, lastName: true },
        },
      },
    });

    // Create initial activity
    await db.leadActivity.create({
      data: {
        clinicId: session.user.clinicId,
        leadId: lead.id,
        type: 'SYSTEM',
        title: 'Lead created',
        description: `Lead created from source: ${data.source}`,
        performedById: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'Lead',
      entityId: lead.id,
      details: {
        name: `${lead.firstName} ${lead.lastName}`,
        source: lead.source,
        stage: lead.stage,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: lead }, { status: 201 });
  },
  { permissions: ['leads:edit', 'leads:full'] }
);
