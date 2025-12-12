import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { z } from 'zod';

/**
 * Conditions schema for preference rules
 * Stored as JSON in the conditions field
 */
const conditionsSchema = z.object({
  productCategory: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  isRush: z.boolean().optional().nullable(),
  minOrderValue: z.number().optional().nullable(),
  maxOrderValue: z.number().optional().nullable(),
}).optional();

const createLabPreferenceRuleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  vendorId: z.string().min(1, 'Vendor is required'),
  priority: z.number().int().min(0).max(100).optional().default(50),
  isActive: z.boolean().optional().default(true),
  conditions: conditionsSchema,
});

const updateLabPreferenceRuleSchema = createLabPreferenceRuleSchema.partial();

/**
 * GET /api/lab/preferences
 * List preference rules for the clinic
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const rules = await db.labPreferenceRule.findMany({
      where: {
        ...getClinicFilter(session),
        ...(activeOnly && { isActive: true }),
      },
      include: {
        vendor: {
          select: { id: true, name: true, code: true, status: true },
        },
      },
      orderBy: [{ priority: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ success: true, data: rules });
  },
  { permissions: ['lab:view'] }
);

/**
 * POST /api/lab/preferences
 * Create a new preference rule
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    const result = createLabPreferenceRuleSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid preference rule data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify vendor exists
    const vendor = await db.labVendor.findFirst({
      where: {
        id: data.vendorId,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VENDOR_NOT_FOUND',
            message: 'Vendor not found',
          },
        },
        { status: 404 }
      );
    }

    const rule = await db.labPreferenceRule.create({
      data: {
        clinicId: session.user.clinicId,
        vendorId: data.vendorId,
        name: data.name,
        description: data.description,
        priority: data.priority ?? 50,
        isActive: data.isActive ?? true,
        conditions: data.conditions || {},
      },
      include: {
        vendor: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'LabPreferenceRule',
      entityId: rule.id,
      details: { name: rule.name, vendorId: rule.vendorId },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: rule }, { status: 201 });
  },
  { permissions: ['lab:manage_vendors'] }
);

// Note: evaluatePreferences helper function has been moved to @/lib/lab/preferences
