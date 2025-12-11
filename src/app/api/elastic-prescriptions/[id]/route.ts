import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateElasticPrescriptionSchema } from '@/lib/validations/treatment';

/**
 * GET /api/elastic-prescriptions/[id]
 * Get a single elastic prescription
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const prescription = await db.elasticPrescription.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId,
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
        applianceRecord: {
          select: {
            id: true,
            applianceType: true,
            arch: true,
          },
        },
        prescribedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
    });

    if (!prescription) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Elastic prescription not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: prescription,
    });
  },
  { permissions: ['treatment:read'] }
);

/**
 * PUT /api/elastic-prescriptions/[id]
 * Update an elastic prescription
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateElasticPrescriptionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid prescription data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check prescription exists
    const existing = await db.elasticPrescription.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Elastic prescription not found',
          },
        },
        { status: 404 }
      );
    }

    // Update prescription
    const prescription = await db.elasticPrescription.update({
      where: { id },
      data: {
        ...(data.elasticType && { elasticType: data.elasticType }),
        ...(data.elasticSize && { elasticSize: data.elasticSize }),
        ...(data.elasticForce !== undefined && { elasticForce: data.elasticForce }),
        ...(data.manufacturer !== undefined && { manufacturer: data.manufacturer }),
        ...(data.fromTooth !== undefined && { fromTooth: data.fromTooth }),
        ...(data.toTooth !== undefined && { toTooth: data.toTooth }),
        ...(data.configuration !== undefined && { configuration: data.configuration }),
        ...(data.wearSchedule && { wearSchedule: data.wearSchedule }),
        ...(data.hoursPerDay !== undefined && { hoursPerDay: data.hoursPerDay }),
        ...(data.startDate && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.discontinuedDate !== undefined && { discontinuedDate: data.discontinuedDate }),
        ...(data.discontinuedReason !== undefined && { discontinuedReason: data.discontinuedReason }),
        ...(data.complianceNotes !== undefined && { complianceNotes: data.complianceNotes }),
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        prescribedBy: {
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
      entity: 'ElasticPrescription',
      entityId: prescription.id,
      details: {
        fields: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: prescription,
    });
  },
  { permissions: ['treatment:update'] }
);

/**
 * DELETE /api/elastic-prescriptions/[id]
 * Delete an elastic prescription
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Check prescription exists
    const existing = await db.elasticPrescription.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Elastic prescription not found',
          },
        },
        { status: 404 }
      );
    }

    // Delete prescription
    await db.elasticPrescription.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'ElasticPrescription',
      entityId: id,
      details: {
        patientId: existing.patientId,
        elasticType: existing.elasticType,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  },
  { permissions: ['treatment:delete'] }
);
