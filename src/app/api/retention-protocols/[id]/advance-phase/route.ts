import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { advanceRetentionPhaseSchema } from '@/lib/validations/treatment';

/**
 * POST /api/retention-protocols/[id]/advance-phase
 * Advance a retention protocol to the next phase
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = advanceRetentionPhaseSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid phase advancement data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Find existing record
    const existing = await db.retentionProtocol.findFirst({
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
            code: 'NOT_FOUND',
            message: 'Retention protocol not found',
          },
        },
        { status: 404 }
      );
    }

    if (!existing.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROTOCOL_INACTIVE',
            message: 'Cannot advance phase on an inactive protocol',
          },
        },
        { status: 400 }
      );
    }

    // Get staff profile for tracking who advanced the phase
    const staffProfile = await db.staffProfile.findFirst({
      where: { userId: session.user.id },
    });

    // Build adjustment history entry
    const adjustmentEntry = {
      date: new Date().toISOString(),
      previousPhase: existing.currentPhase,
      newPhase: data.newPhase,
      previousWearSchedule: existing.wearSchedule,
      newWearSchedule: data.newWearSchedule || existing.wearSchedule,
      notes: data.notes,
      advancedBy: staffProfile?.id,
    };

    // Get existing adjustment history or initialize empty array
    const existingHistory = (existing.adjustmentHistory as Prisma.JsonArray) || [];

    // Update the protocol
    const retentionProtocol = await db.retentionProtocol.update({
      where: { id },
      data: {
        currentPhase: data.newPhase,
        phaseStartDate: new Date(),
        wearSchedule: data.newWearSchedule || existing.wearSchedule,
        currentNotes: data.notes,
        adjustmentHistory: [...existingHistory, adjustmentEntry as Prisma.JsonObject],
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        treatmentPlan: {
          select: {
            id: true,
            planNumber: true,
            status: true,
          },
        },
        managingProvider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'RetentionProtocol',
      entityId: retentionProtocol.id,
      details: {
        action: 'PHASE_ADVANCED',
        patientId: retentionProtocol.patientId,
        treatmentPlanId: retentionProtocol.treatmentPlanId,
        previousPhase: existing.currentPhase,
        newPhase: data.newPhase,
        newWearSchedule: data.newWearSchedule,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: retentionProtocol });
  },
  { permissions: ['treatment:update'] }
);
