import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { randomBytes } from 'crypto';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createIntakeTokenSchema } from '@/lib/validations/forms';

/**
 * GET /api/forms/intake-tokens
 * List intake tokens for a lead or patient
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('leadId');
    const patientId = searchParams.get('patientId');

    if (!leadId && !patientId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Either leadId or patientId is required',
          },
        },
        { status: 400 }
      );
    }

    const tokens = await db.intakeToken.findMany({
      where: {
        ...getClinicFilter(session),
        ...(leadId && { leadId }),
        ...(patientId && { patientId }),
      },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: tokens,
    });
  },
  { permissions: ['forms:view', 'forms:edit', 'forms:full'] }
);

/**
 * POST /api/forms/intake-tokens
 * Create a new intake token
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createIntakeTokenSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid intake token data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Ensure at least lead or patient is provided
    if (!data.leadId && !data.patientId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Either lead or patient must be specified',
          },
        },
        { status: 400 }
      );
    }

    // Verify all template IDs exist
    const templates = await db.formTemplate.findMany({
      where: {
        id: { in: data.templateIds },
        OR: [{ clinicId: session.user.clinicId }, { clinicId: null }],
        isActive: true,
      },
    });

    if (templates.length !== data.templateIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'One or more form templates not found or inactive',
          },
        },
        { status: 400 }
      );
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex');

    // Default expiration: 7 days
    const expiresAt = data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create intake token
    const intakeToken = await db.intakeToken.create({
      data: {
        clinicId: session.user.clinicId,
        token,
        leadId: data.leadId,
        patientId: data.patientId,
        templateIds: data.templateIds,
        email: data.email,
        phone: data.phone,
        expiresAt,
        createdById: session.user.id,
      },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'IntakeToken',
      entityId: intakeToken.id,
      details: {
        leadId: data.leadId,
        patientId: data.patientId,
        templateCount: data.templateIds.length,
        expiresAt,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...intakeToken,
          intakeUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/intake/${token}`,
        },
      },
      { status: 201 }
    );
  },
  { permissions: ['forms:edit', 'forms:full'] }
);
