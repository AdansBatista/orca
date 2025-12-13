import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updatePreauthorizationSchema } from '@/lib/validations/insurance';

interface RouteContext {
  params: Promise<{ preauthId: string }>;
}

/**
 * GET /api/insurance/preauthorizations/[preauthId]
 * Get a single preauthorization by ID
 */
export const GET = withAuth(
  async (req, session, context: RouteContext) => {
    const { preauthId } = await context.params;

    const preauth = await db.preauthorization.findFirst({
      where: {
        id: preauthId,
        clinicId: session.user.clinicId,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
          },
        },
        patientInsurance: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!preauth) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Preauthorization not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: preauth,
    });
  },
  { permissions: ['insurance:read'] }
);

/**
 * PATCH /api/insurance/preauthorizations/[preauthId]
 * Update a preauthorization (status, response info, etc.)
 */
export const PATCH = withAuth(
  async (req, session, context: RouteContext) => {
    const { preauthId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updatePreauthorizationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid preauthorization data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Check if preauth exists
    const existing = await db.preauthorization.findFirst({
      where: {
        id: preauthId,
        clinicId: session.user.clinicId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Preauthorization not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // If setting auth number, set response date if not already set
    const updateData: Record<string, unknown> = { ...data };
    if (data.authNumber && !existing.responseDate && !data.responseDate) {
      updateData.responseDate = new Date();
    }

    // If approving, set approved status
    if (data.status === 'APPROVED' && data.approvedAmount === undefined) {
      updateData.approvedAmount = existing.requestedAmount;
    }

    // Update the preauthorization
    const preauth = await db.preauthorization.update({
      where: { id: preauthId },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        patientInsurance: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                payerId: true,
              },
            },
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'Preauthorization',
      entityId: preauthId,
      details: {
        patientId: preauth.patientId,
        previousStatus: existing.status,
        newStatus: preauth.status,
        updatedFields: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: preauth });
  },
  { permissions: ['insurance:update'] }
);

/**
 * POST /api/insurance/preauthorizations/[preauthId]
 * Special actions: submit, check-status
 */
export const POST = withAuth(
  async (req, session, context: RouteContext) => {
    const { preauthId } = await context.params;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    // Check if preauth exists
    const existing = await db.preauthorization.findFirst({
      where: {
        id: preauthId,
        clinicId: session.user.clinicId,
      },
      include: {
        patientInsurance: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Preauthorization not found',
          },
        },
        { status: 404 }
      );
    }

    switch (action) {
      case 'submit': {
        // Submit preauthorization to insurance
        if (existing.status !== 'DRAFT') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Only draft preauthorizations can be submitted',
              },
            },
            { status: 400 }
          );
        }

        // Update status to pending
        const preauth = await db.preauthorization.update({
          where: { id: preauthId },
          data: {
            status: 'PENDING',
            requestDate: new Date(),
          },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            patientInsurance: {
              include: {
                company: {
                  select: {
                    id: true,
                    name: true,
                    payerId: true,
                  },
                },
              },
            },
          },
        });

        // Audit log
        const { ipAddress, userAgent } = getRequestMeta(req);
        await logAudit(session, {
          action: 'UPDATE',
          entity: 'Preauthorization',
          entityId: preauthId,
          details: {
            action: 'submit',
            patientId: preauth.patientId,
            insuranceCompany: existing.patientInsurance.company.name,
          },
          ipAddress,
          userAgent,
        });

        return NextResponse.json({
          success: true,
          data: preauth,
          message: 'Preauthorization submitted successfully',
        });
      }

      case 'check-status': {
        // Check status with insurance (mock - would integrate with clearinghouse)
        if (existing.status !== 'PENDING') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Can only check status for pending preauthorizations',
              },
            },
            { status: 400 }
          );
        }

        // Mock status check - in production, call clearinghouse API
        return NextResponse.json({
          success: true,
          data: {
            preauthId,
            status: 'PENDING',
            message: 'Authorization is still pending review by the insurance company',
            checkedAt: new Date().toISOString(),
          },
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ACTION',
              message: 'Invalid action. Supported actions: submit, check-status',
            },
          },
          { status: 400 }
        );
    }
  },
  { permissions: ['insurance:update'] }
);
