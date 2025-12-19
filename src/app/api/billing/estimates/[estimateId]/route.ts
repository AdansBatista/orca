import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  updateTreatmentEstimateSchema,
  presentEstimateSchema,
  acceptEstimateSchema,
} from '@/lib/validations/billing';

/**
 * GET /api/billing/estimates/[estimateId]
 * Get a single treatment estimate by ID
 */
export const GET = withAuth<{ estimateId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { estimateId } = await context.params;

    const estimate = await db.treatmentEstimate.findFirst({
      where: withSoftDelete({
        id: estimateId,
        ...getClinicFilter(session),
      }),
      include: {
        account: {
          select: {
            id: true,
            accountNumber: true,
            currentBalance: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
          },
        },
        scenarios: true,
      },
    });

    if (!estimate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Treatment estimate not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if expired
    const isExpired = estimate.validUntil && new Date(estimate.validUntil) < new Date();

    return NextResponse.json({
      success: true,
      data: {
        ...estimate,
        isExpired,
      },
    });
  },
  { permissions: ['billing:read'] }
);

/**
 * PATCH /api/billing/estimates/[estimateId]
 * Update a treatment estimate
 */
export const PATCH = withAuth<{ estimateId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { estimateId } = await context.params;
    const body = await req.json();

    // Check for action-specific handlers
    const { action } = body;

    if (action === 'present') {
      return handlePresent(req, session, estimateId, body);
    } else if (action === 'accept') {
      return handleAccept(req, session, estimateId, body);
    } else if (action === 'decline') {
      return handleDecline(req, session, estimateId, body);
    } else if (action === 'expire') {
      return handleExpire(req, session, estimateId);
    }

    // Standard update
    const result = updateTreatmentEstimateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check estimate exists
    const existingEstimate = await db.treatmentEstimate.findFirst({
      where: withSoftDelete({
        id: estimateId,
        ...getClinicFilter(session),
      }),
    });

    if (!existingEstimate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Treatment estimate not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if estimate can be modified
    if (['ACCEPTED', 'DECLINED', 'EXPIRED'].includes(existingEstimate.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ESTIMATE_LOCKED',
            message: `Cannot modify estimate with status: ${existingEstimate.status}`,
          },
        },
        { status: 400 }
      );
    }

    // Handle scenario updates if provided
    if (data.scenarios) {
      // Delete existing scenarios and recreate
      await db.estimateScenario.deleteMany({
        where: { estimateId },
      });

      await db.estimateScenario.createMany({
        data: data.scenarios.map((scenario) => ({
          estimateId,
          name: scenario.name,
          description: scenario.description,
          totalCost: scenario.totalCost,
          insuranceEstimate: scenario.insuranceEstimate || 0,
          patientEstimate: scenario.patientEstimate,
          procedures: scenario.procedures || [],
          isRecommended: scenario.isRecommended || false,
          isSelected: scenario.isSelected || false,
        })),
      });
    }

    // Build update data - only include fields that exist in the model
    const updateData: Record<string, unknown> = {};

    if (data.validUntil !== undefined) updateData.validUntil = data.validUntil;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.totalCost !== undefined) updateData.totalCost = data.totalCost;
    if (data.insuranceEstimate !== undefined) updateData.insuranceEstimate = data.insuranceEstimate;
    if (data.patientEstimate !== undefined) updateData.patientEstimate = data.patientEstimate;
    if (data.downPayment !== undefined) updateData.downPayment = data.downPayment;
    if (data.documentUrl !== undefined) updateData.documentUrl = data.documentUrl;

    // Update estimate
    const estimate = await db.treatmentEstimate.update({
      where: { id: estimateId },
      data: updateData,
      include: {
        account: {
          select: {
            id: true,
            accountNumber: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        scenarios: true,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'TreatmentEstimate',
      entityId: estimate.id,
      details: {
        estimateNumber: estimate.estimateNumber,
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: estimate });
  },
  { permissions: ['billing:update'] }
);

/**
 * DELETE /api/billing/estimates/[estimateId]
 * Soft delete a treatment estimate
 */
export const DELETE = withAuth<{ estimateId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { estimateId } = await context.params;

    // Check estimate exists
    const existingEstimate = await db.treatmentEstimate.findFirst({
      where: withSoftDelete({
        id: estimateId,
        ...getClinicFilter(session),
      }),
    });

    if (!existingEstimate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Treatment estimate not found',
          },
        },
        { status: 404 }
      );
    }

    // Soft delete
    await db.treatmentEstimate.update({
      where: { id: estimateId },
      data: {
        deletedAt: new Date(),
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'TreatmentEstimate',
      entityId: estimateId,
      details: {
        estimateNumber: existingEstimate.estimateNumber,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { id: estimateId } });
  },
  { permissions: ['billing:delete'] }
);

// Helper: Present estimate to patient
async function handlePresent(
  req: Request,
  session: Session,
  estimateId: string,
  body: unknown
) {
  const result = presentEstimateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid presentation data',
          details: result.error.flatten(),
        },
      },
      { status: 400 }
    );
  }

  const estimate = await db.treatmentEstimate.findFirst({
    where: withSoftDelete({
      id: estimateId,
      clinicId: session.user.clinicId,
    }),
  });

  if (!estimate) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Estimate not found' } },
      { status: 404 }
    );
  }

  if (estimate.status !== 'DRAFT') {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Only draft estimates can be presented' },
      },
      { status: 400 }
    );
  }

  const updatedEstimate = await db.treatmentEstimate.update({
    where: { id: estimateId },
    data: {
      status: 'PRESENTED',
      presentedAt: new Date(),
      presentedBy: session.user.id,
    },
    include: {
      scenarios: true,
    },
  });

  const { ipAddress, userAgent } = getRequestMeta(req);
  await logAudit(session, {
    action: 'UPDATE',
    entity: 'TreatmentEstimate',
    entityId: estimateId,
    details: { action: 'presented', presentedBy: session.user.id },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ success: true, data: updatedEstimate });
}

// Helper: Accept estimate
async function handleAccept(
  req: Request,
  session: Session,
  estimateId: string,
  body: unknown
) {
  const result = acceptEstimateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid acceptance data',
          details: result.error.flatten(),
        },
      },
      { status: 400 }
    );
  }

  const data = result.data;

  const estimate = await db.treatmentEstimate.findFirst({
    where: withSoftDelete({
      id: estimateId,
      clinicId: session.user.clinicId,
    }),
    include: {
      scenarios: true,
    },
  });

  if (!estimate) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Estimate not found' } },
      { status: 404 }
    );
  }

  if (estimate.status !== 'PRESENTED') {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Only presented estimates can be accepted' },
      },
      { status: 400 }
    );
  }

  // Update the selected scenario if provided
  if (data.selectedScenarioId && estimate.scenarios.length > 0) {
    // Unselect all scenarios
    await db.estimateScenario.updateMany({
      where: { estimateId },
      data: { isSelected: false },
    });

    // Select the chosen scenario
    const selectedScenario = estimate.scenarios.find(s => s.id === data.selectedScenarioId);
    if (selectedScenario) {
      await db.estimateScenario.update({
        where: { id: data.selectedScenarioId },
        data: { isSelected: true },
      });

      // Update estimate totals from selected scenario
      await db.treatmentEstimate.update({
        where: { id: estimateId },
        data: {
          totalCost: selectedScenario.totalCost,
          insuranceEstimate: selectedScenario.insuranceEstimate,
          patientEstimate: selectedScenario.patientEstimate,
        },
      });
    }
  }

  const updatedEstimate = await db.treatmentEstimate.update({
    where: { id: estimateId },
    data: {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
    },
    include: {
      scenarios: true,
    },
  });

  const { ipAddress, userAgent } = getRequestMeta(req);
  await logAudit(session, {
    action: 'UPDATE',
    entity: 'TreatmentEstimate',
    entityId: estimateId,
    details: {
      action: 'accepted',
      selectedScenarioId: data.selectedScenarioId,
      patientEstimate: updatedEstimate.patientEstimate,
    },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ success: true, data: updatedEstimate });
}

// Helper: Decline estimate
async function handleDecline(
  req: Request,
  session: Session,
  estimateId: string,
  body: { declineReason?: string }
) {
  const estimate = await db.treatmentEstimate.findFirst({
    where: withSoftDelete({
      id: estimateId,
      clinicId: session.user.clinicId,
    }),
  });

  if (!estimate) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Estimate not found' } },
      { status: 404 }
    );
  }

  if (estimate.status !== 'PRESENTED') {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Only presented estimates can be declined' },
      },
      { status: 400 }
    );
  }

  const updatedEstimate = await db.treatmentEstimate.update({
    where: { id: estimateId },
    data: {
      status: 'DECLINED',
      declinedAt: new Date(),
      declineReason: body.declineReason,
    },
  });

  const { ipAddress, userAgent } = getRequestMeta(req);
  await logAudit(session, {
    action: 'UPDATE',
    entity: 'TreatmentEstimate',
    entityId: estimateId,
    details: { action: 'declined', reason: body.declineReason },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ success: true, data: updatedEstimate });
}

// Helper: Manually expire estimate
async function handleExpire(
  req: Request,
  session: Session,
  estimateId: string
) {
  const estimate = await db.treatmentEstimate.findFirst({
    where: withSoftDelete({
      id: estimateId,
      clinicId: session.user.clinicId,
    }),
  });

  if (!estimate) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Estimate not found' } },
      { status: 404 }
    );
  }

  if (['ACCEPTED', 'DECLINED', 'EXPIRED'].includes(estimate.status)) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Estimate cannot be expired in current status' },
      },
      { status: 400 }
    );
  }

  const updatedEstimate = await db.treatmentEstimate.update({
    where: { id: estimateId },
    data: {
      status: 'EXPIRED',
      validUntil: new Date(),
    },
  });

  const { ipAddress, userAgent } = getRequestMeta(req);
  await logAudit(session, {
    action: 'UPDATE',
    entity: 'TreatmentEstimate',
    entityId: estimateId,
    details: { action: 'expired' },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ success: true, data: updatedEstimate });
}
