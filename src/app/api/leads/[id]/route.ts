import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateLeadSchema } from '@/lib/validations/leads';

/**
 * GET /api/leads/[id]
 * Get a single lead by ID with full details
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const lead = await db.lead.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        referringDentist: {
          select: {
            id: true,
            practiceName: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            performedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        tasks: {
          orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
          include: {
            assignedTo: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        formSubmissions: {
          orderBy: { createdAt: 'desc' },
          include: {
            template: {
              select: { id: true, name: true, type: true },
            },
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Lead not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: lead });
  },
  { permissions: ['leads:view', 'leads:edit', 'leads:full'] }
);

/**
 * PUT /api/leads/[id]
 * Update a lead
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateLeadSchema.safeParse(body);
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

    // Check lead exists
    const existingLead = await db.lead.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existingLead) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Lead not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Track changes for activity log
    const changes: string[] = [];
    if (data.stage && data.stage !== existingLead.stage) {
      changes.push(`Stage changed from ${existingLead.stage} to ${data.stage}`);
    }
    if (data.status && data.status !== existingLead.status) {
      changes.push(`Status changed from ${existingLead.status} to ${data.status}`);
    }
    if (data.assignedToId !== undefined && data.assignedToId !== existingLead.assignedToId) {
      changes.push('Assignment changed');
    }

    // Update the lead
    const lead = await db.lead.update({
      where: { id },
      data: {
        ...data,
        // Handle lost status
        ...(data.status === 'LOST' && !existingLead.lostDate ? { lostDate: new Date() } : {}),
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

    // Log activity for significant changes
    if (changes.length > 0) {
      await db.leadActivity.create({
        data: {
          clinicId: session.user.clinicId,
          leadId: lead.id,
          type: data.stage !== existingLead.stage ? 'STAGE_CHANGE' :
                data.status !== existingLead.status ? 'STATUS_CHANGE' :
                data.assignedToId !== existingLead.assignedToId ? 'ASSIGNMENT_CHANGE' : 'NOTE',
          title: changes.join(', '),
          metadata: { changes, previousValues: { stage: existingLead.stage, status: existingLead.status } },
          performedById: session.user.id,
        },
      });
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'Lead',
      entityId: lead.id,
      details: {
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: lead });
  },
  { permissions: ['leads:edit', 'leads:full'] }
);

/**
 * DELETE /api/leads/[id]
 * Soft delete a lead
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    // Check lead exists
    const existingLead = await db.lead.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existingLead) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Lead not found',
          },
        },
        { status: 404 }
      );
    }

    // Prevent deletion of converted leads
    if (existingLead.status === 'CONVERTED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CANNOT_DELETE_CONVERTED',
            message: 'Cannot delete a converted lead',
          },
        },
        { status: 400 }
      );
    }

    // Soft delete
    await db.lead.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'Lead',
      entityId: id,
      details: {
        name: `${existingLead.firstName} ${existingLead.lastName}`,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { id } });
  },
  { permissions: ['leads:full'] }
);
