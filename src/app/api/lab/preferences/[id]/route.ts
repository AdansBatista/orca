import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { z } from 'zod';

const conditionsSchema = z.object({
  productCategory: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  isRush: z.boolean().optional().nullable(),
  minOrderValue: z.number().optional().nullable(),
  maxOrderValue: z.number().optional().nullable(),
}).optional();

const updateLabPreferenceRuleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  vendorId: z.string().optional(),
  priority: z.number().int().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
  conditions: conditionsSchema,
});

/**
 * GET /api/lab/preferences/[id]
 * Get a specific preference rule
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const rule = await db.labPreferenceRule.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        vendor: {
          select: { id: true, name: true, code: true, status: true },
        },
      },
    });

    if (!rule) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RULE_NOT_FOUND',
            message: 'Preference rule not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: rule });
  },
  { permissions: ['lab:view'] }
);

/**
 * PUT /api/lab/preferences/[id]
 * Update a preference rule
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    const result = updateLabPreferenceRuleSchema.safeParse(body);
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

    const existing = await db.labPreferenceRule.findFirst({
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
            code: 'RULE_NOT_FOUND',
            message: 'Preference rule not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // If changing vendor, verify it exists
    if (data.vendorId) {
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
    }

    const rule = await db.labPreferenceRule.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.vendorId && { vendorId: data.vendorId }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.conditions !== undefined && { conditions: data.conditions || {} }),
      },
      include: {
        vendor: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'LabPreferenceRule',
      entityId: rule.id,
      details: { name: rule.name, changes: Object.keys(data) },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: rule });
  },
  { permissions: ['lab:manage_vendors'] }
);

/**
 * DELETE /api/lab/preferences/[id]
 * Delete a preference rule
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const existing = await db.labPreferenceRule.findFirst({
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
            code: 'RULE_NOT_FOUND',
            message: 'Preference rule not found',
          },
        },
        { status: 404 }
      );
    }

    await db.labPreferenceRule.delete({
      where: { id },
    });

    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'LabPreferenceRule',
      entityId: id,
      details: { name: existing.name },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  },
  { permissions: ['lab:manage_vendors'] }
);
