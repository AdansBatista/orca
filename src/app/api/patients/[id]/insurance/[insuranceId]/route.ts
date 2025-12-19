import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withSoftDelete, softDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updatePatientInsuranceSchema } from '@/lib/validations/insurance';

interface RouteContext {
  params: Promise<{ id: string; insuranceId: string }>;
}

/**
 * GET /api/patients/[id]/insurance/[insuranceId]
 * Get a single patient insurance coverage
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session, context: RouteContext) => {
    const { id: patientId, insuranceId } = await context.params;

    // Verify patient exists
    const patient = await db.patient.findFirst({
      where: withSoftDelete({
        id: patientId,
        clinicId: session.user.clinicId,
      }),
    });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PATIENT_NOT_FOUND',
            message: 'Patient not found',
          },
        },
        { status: 404 }
      );
    }

    const insurance = await db.patientInsurance.findFirst({
      where: withSoftDelete({
        id: insuranceId,
        patientId,
        clinicId: session.user.clinicId,
      }),
      include: {
        company: true,
        eligibilityChecks: {
          orderBy: { checkDate: 'desc' },
          take: 5,
        },
        preauthorizations: {
          orderBy: { requestDate: 'desc' },
          take: 5,
        },
        claims: {
          orderBy: { serviceDate: 'desc' },
          take: 10,
          include: {
            _count: { select: { items: true } },
          },
        },
      },
    });

    if (!insurance) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Insurance coverage not found',
          },
        },
        { status: 404 }
      );
    }

    // Audit log (PHI access)
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'READ',
      entity: 'PatientInsurance',
      entityId: insuranceId,
      details: {
        patientId,
        priority: insurance.priority,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: insurance,
    });
  },
  { permissions: ['insurance:read'] }
);

/**
 * PATCH /api/patients/[id]/insurance/[insuranceId]
 * Update a patient insurance coverage
 */
export const PATCH = withAuth(
  async (req: NextRequest, session: Session, context: RouteContext) => {
    const { id: patientId, insuranceId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updatePatientInsuranceSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid insurance data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Check if insurance exists
    const existing = await db.patientInsurance.findFirst({
      where: withSoftDelete({
        id: insuranceId,
        patientId,
        clinicId: session.user.clinicId,
      }),
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Insurance coverage not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // If changing priority, check for conflicts
    if (data.priority && data.priority !== existing.priority) {
      const existingPriority = await db.patientInsurance.findFirst({
        where: withSoftDelete({
          patientId,
          clinicId: session.user.clinicId,
          priority: data.priority,
          id: { not: insuranceId },
          OR: [
            { terminationDate: null },
            { terminationDate: { gt: new Date() } },
          ],
        }),
      });

      if (existingPriority) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_PRIORITY',
              message: `Patient already has an active ${data.priority.toLowerCase()} insurance`,
            },
          },
          { status: 409 }
        );
      }
    }

    // If changing company, verify it exists
    if (data.insuranceCompanyId && data.insuranceCompanyId !== existing.insuranceCompanyId) {
      const company = await db.insuranceCompany.findFirst({
        where: withSoftDelete({
          id: data.insuranceCompanyId,
          clinicId: session.user.clinicId,
        }),
      });

      if (!company) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'COMPANY_NOT_FOUND',
              message: 'Insurance company not found',
            },
          },
          { status: 400 }
        );
      }
    }

    // Recalculate remaining amount if lifetime max or used amount changed
    let orthoRemainingAmount = data.orthoRemainingAmount;
    if (data.orthoLifetimeMax !== undefined || data.orthoUsedAmount !== undefined) {
      const lifetimeMax = data.orthoLifetimeMax ?? existing.orthoLifetimeMax;
      const usedAmount = data.orthoUsedAmount ?? existing.orthoUsedAmount;
      if (lifetimeMax !== null && lifetimeMax !== undefined) {
        orthoRemainingAmount = Math.max(0, lifetimeMax - (usedAmount || 0));
      }
    }

    // Update the insurance
    const insurance = await db.patientInsurance.update({
      where: { id: insuranceId },
      data: {
        ...data,
        orthoRemainingAmount,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            payerId: true,
            type: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'PatientInsurance',
      entityId: insuranceId,
      details: {
        patientId,
        updatedFields: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: insurance });
  },
  { permissions: ['insurance:update'] }
);

/**
 * DELETE /api/patients/[id]/insurance/[insuranceId]
 * Soft delete a patient insurance coverage
 */
export const DELETE = withAuth(
  async (req: NextRequest, session: Session, context: RouteContext) => {
    const { id: patientId, insuranceId } = await context.params;

    // Check if insurance exists
    const existing = await db.patientInsurance.findFirst({
      where: withSoftDelete({
        id: insuranceId,
        patientId,
        clinicId: session.user.clinicId,
      }),
      include: {
        _count: {
          select: {
            claims: { where: { status: { notIn: ['VOID', 'CLOSED'] } } },
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
            message: 'Insurance coverage not found',
          },
        },
        { status: 404 }
      );
    }

    // Prevent deletion if there are active claims
    if (existing._count.claims > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_ACTIVE_CLAIMS',
            message: `Cannot delete: ${existing._count.claims} active claim(s) exist for this insurance`,
          },
        },
        { status: 400 }
      );
    }

    // Soft delete the insurance
    await db.patientInsurance.update({
      where: { id: insuranceId },
      data: softDelete(),
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'PatientInsurance',
      entityId: insuranceId,
      details: {
        patientId,
        priority: existing.priority,
        subscriberId: existing.subscriberId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  },
  { permissions: ['insurance:delete'] }
);
