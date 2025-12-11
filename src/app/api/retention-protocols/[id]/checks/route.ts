import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createRetentionCheckSchema } from '@/lib/validations/treatment';

/**
 * GET /api/retention-protocols/[id]/checks
 * Get all retention checks for a protocol
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    // Verify protocol exists and belongs to clinic
    const protocol = await db.retentionProtocol.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!protocol) {
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

    // Get total count
    const total = await db.retentionCheck.count({
      where: { retentionProtocolId: id },
    });

    // Get paginated checks
    const items = await db.retentionCheck.findMany({
      where: { retentionProtocolId: id },
      orderBy: { checkDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        performedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
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
  { permissions: ['treatment:read'] }
);

/**
 * POST /api/retention-protocols/[id]/checks
 * Create a new retention check for a protocol
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Override the retentionProtocolId from the URL
    const checkData = {
      ...body,
      retentionProtocolId: id,
    };

    // Validate input
    const result = createRetentionCheckSchema.safeParse(checkData);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid retention check data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify protocol exists and belongs to clinic
    const protocol = await db.retentionProtocol.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!protocol) {
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

    if (!protocol.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROTOCOL_INACTIVE',
            message: 'Cannot add checks to an inactive protocol',
          },
        },
        { status: 400 }
      );
    }

    // Get staff profile for performedBy
    const staffProfile = await db.staffProfile.findFirst({
      where: { userId: session.user.id },
    });

    if (!staffProfile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'STAFF_NOT_FOUND',
            message: 'Staff profile not found for current user',
          },
        },
        { status: 400 }
      );
    }

    // Create the retention check
    const retentionCheck = await db.retentionCheck.create({
      data: {
        clinicId: session.user.clinicId,
        retentionProtocolId: id,
        patientId: protocol.patientId,
        checkNumber: data.checkNumber,
        wearScheduleFollowed: data.wearScheduleFollowed,
        reportedWearHours: data.reportedWearHours,
        complianceStatus: data.complianceStatus,
        upperRetainerCondition: data.upperRetainerCondition,
        lowerRetainerCondition: data.lowerRetainerCondition,
        retainerFit: data.retainerFit,
        stabilityStatus: data.stabilityStatus,
        movementObserved: data.movementObserved,
        measurementsJson: data.measurementsJson,
        adjustmentsMade: data.adjustmentsMade,
        retainerReplaced: data.retainerReplaced,
        newRetainerOrdered: data.newRetainerOrdered,
        clinicalFindings: data.clinicalFindings,
        patientConcerns: data.patientConcerns,
        instructions: data.instructions,
        recommendations: data.recommendations,
        phaseAdvanced: data.phaseAdvanced,
        newPhase: data.newPhase,
        newWearSchedule: data.newWearSchedule,
        nextCheckDate: data.nextCheckDate,
        performedById: staffProfile.id,
      },
      include: {
        performedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
    });

    // Update the protocol with check results
    const protocolUpdates: Record<string, unknown> = {
      totalChecks: { increment: 1 },
    };

    if (data.complianceStatus) {
      protocolUpdates.complianceStatus = data.complianceStatus;
      protocolUpdates.lastComplianceUpdate = new Date();
    }

    if (data.stabilityStatus) {
      protocolUpdates.stabilityStatus = data.stabilityStatus;
      protocolUpdates.lastStabilityAssessment = new Date();
    }

    if (data.nextCheckDate) {
      protocolUpdates.nextCheckDate = data.nextCheckDate;
    }

    if (data.phaseAdvanced && data.newPhase) {
      protocolUpdates.currentPhase = data.newPhase;
      protocolUpdates.phaseStartDate = new Date();
    }

    if (data.newWearSchedule) {
      protocolUpdates.wearSchedule = data.newWearSchedule;
    }

    await db.retentionProtocol.update({
      where: { id },
      data: protocolUpdates,
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'RetentionCheck',
      entityId: retentionCheck.id,
      details: {
        retentionProtocolId: id,
        patientId: protocol.patientId,
        checkNumber: data.checkNumber,
        phaseAdvanced: data.phaseAdvanced,
        newPhase: data.newPhase,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: retentionCheck }, { status: 201 });
  },
  { permissions: ['treatment:create'] }
);
