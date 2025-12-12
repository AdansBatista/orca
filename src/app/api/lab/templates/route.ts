import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createLabOrderTemplateSchema } from '@/lib/validations/lab';

/**
 * GET /api/lab/templates
 * List order templates for the clinic
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const vendorId = searchParams.get('vendorId');

    const templates = await db.labOrderTemplate.findMany({
      where: {
        ...getClinicFilter(session),
        deletedAt: null,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(vendorId && { vendorId }),
      },
      orderBy: { name: 'asc' },
    });

    // Manually fetch vendor info for each template with a vendorId
    const vendorIds = templates
      .map((t) => t.vendorId)
      .filter((id): id is string => id !== null);

    const vendors = vendorIds.length > 0
      ? await db.labVendor.findMany({
          where: { id: { in: vendorIds } },
          select: { id: true, name: true, code: true },
        })
      : [];

    const vendorMap = new Map(vendors.map((v) => [v.id, v]));

    const templatesWithVendor = templates.map((template) => ({
      ...template,
      vendor: template.vendorId ? vendorMap.get(template.vendorId) || null : null,
    }));

    return NextResponse.json({ success: true, data: templatesWithVendor });
  },
  { permissions: ['lab:view'] }
);

/**
 * POST /api/lab/templates
 * Create a new order template
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    const result = createLabOrderTemplateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid template data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check for duplicate name
    const existing = await db.labOrderTemplate.findFirst({
      where: {
        clinicId: session.user.clinicId,
        name: data.name,
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_NAME',
            message: 'A template with this name already exists',
          },
        },
        { status: 400 }
      );
    }

    const template = await db.labOrderTemplate.create({
      data: {
        clinicId: session.user.clinicId,
        name: data.name,
        description: data.description,
        isClinicWide: data.isClinicWide,
        vendorId: data.vendorId,
        items: data.items,
        defaultNotes: data.defaultNotes,
        createdByUserId: session.user.id,
      },
    });

    // Fetch vendor info if applicable
    let vendor = null;
    if (template.vendorId) {
      vendor = await db.labVendor.findUnique({
        where: { id: template.vendorId },
        select: { id: true, name: true, code: true },
      });
    }

    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'LabOrderTemplate',
      entityId: template.id,
      details: { name: template.name },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: { ...template, vendor } },
      { status: 201 }
    );
  },
  { permissions: ['lab:create_order'] }
);
