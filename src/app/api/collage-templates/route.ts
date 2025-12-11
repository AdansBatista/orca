import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';

// Validation schemas
const slotSchema = z.object({
  id: z.string(),
  row: z.number().int().min(0),
  col: z.number().int().min(0),
  rowSpan: z.number().int().min(1),
  colSpan: z.number().int().min(1),
  label: z.string().optional(),
  category: z.string().optional(),
  required: z.boolean().optional(),
});

const layoutSchema = z.object({
  rows: z.number().int().min(1).max(10),
  cols: z.number().int().min(1).max(10),
});

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.enum(['PROGRESS', 'COMPARISON', 'TREATMENT', 'PRESENTATION']),
  layout: layoutSchema,
  slots: z.array(slotSchema).min(1),
  aspectRatio: z.enum(['16:9', '4:3', '1:1', 'A4', 'LETTER']).default('16:9'),
  background: z.string().default('#ffffff'),
  padding: z.number().int().min(0).max(100).default(16),
  gap: z.number().int().min(0).max(50).default(8),
});

/**
 * GET /api/collage-templates
 * List collage templates (system + clinic-specific)
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const includeSystem = searchParams.get('includeSystem') !== 'false';

    const whereClause: Prisma.CollageTemplateWhereInput = {
      isActive: true,
      OR: [
        // System templates
        ...(includeSystem ? [{ isSystem: true, clinicId: null }] : []),
        // Clinic-specific templates
        { clinicId: session.user.clinicId },
      ],
    };

    if (category) {
      whereClause.category = category;
    }

    const templates = await db.collageTemplate.findMany({
      where: whereClause,
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' },
      ],
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            collages: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: templates,
    });
  },
  { permissions: ['imaging:view'] }
);

/**
 * POST /api/collage-templates
 * Create a new collage template
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    const result = createTemplateSchema.safeParse(body);

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

    // Get staff profile
    const staffProfile = await db.staffProfile.findFirst({
      where: {
        userId: session.user.id,
        ...getClinicFilter(session),
      },
    });

    if (!staffProfile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'STAFF_NOT_FOUND',
            message: 'Staff profile not found',
          },
        },
        { status: 400 }
      );
    }

    const template = await db.collageTemplate.create({
      data: {
        clinicId: session.user.clinicId,
        name: result.data.name,
        description: result.data.description,
        category: result.data.category,
        layout: result.data.layout as Prisma.InputJsonValue,
        slots: result.data.slots as Prisma.InputJsonValue,
        aspectRatio: result.data.aspectRatio,
        background: result.data.background,
        padding: result.data.padding,
        gap: result.data.gap,
        isSystem: false,
        createdById: staffProfile.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'CollageTemplate',
      entityId: template.id,
      details: {
        name: template.name,
        category: template.category,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: template,
    });
  },
  { permissions: ['imaging:edit'] }
);
