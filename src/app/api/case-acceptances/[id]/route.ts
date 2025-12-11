import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateCaseAcceptanceSchema, signCaseAcceptanceSchema } from '@/lib/validations/treatment';

/**
 * GET /api/case-acceptances/[id]
 * Get a single case acceptance
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const acceptance = await db.caseAcceptance.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
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
        treatmentPlan: {
          select: {
            id: true,
            planName: true,
            status: true,
            treatmentOptions: {
              where: { deletedAt: null },
              orderBy: { optionNumber: 'asc' },
            },
          },
        },
        selectedOption: {
          select: {
            id: true,
            optionName: true,
            applianceSystem: true,
            estimatedDuration: true,
            estimatedCost: true,
          },
        },
        witnessedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!acceptance) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CASE_ACCEPTANCE_NOT_FOUND',
            message: 'Case acceptance not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: acceptance });
  },
  { permissions: ['treatment:read'] }
);

/**
 * PUT /api/case-acceptances/[id]
 * Update a case acceptance
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateCaseAcceptanceSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid case acceptance data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Verify acceptance exists
    const existingAcceptance = await db.caseAcceptance.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!existingAcceptance) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CASE_ACCEPTANCE_NOT_FOUND',
            message: 'Case acceptance not found',
          },
        },
        { status: 404 }
      );
    }

    // Cannot update fully signed acceptance (except to withdraw)
    if (existingAcceptance.status === 'FULLY_SIGNED' && body.status !== 'WITHDRAWN') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ACCEPTANCE_FINALIZED',
            message: 'Cannot modify a fully signed case acceptance',
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Calculate new status based on signatures
    let newStatus = existingAcceptance.status;
    const informedConsentSigned = data.informedConsentSigned ?? existingAcceptance.informedConsentSigned;
    const financialAgreementSigned = data.financialAgreementSigned ?? existingAcceptance.financialAgreementSigned;
    const patientSignature = data.patientSignature ?? existingAcceptance.patientSignature;

    if (patientSignature && informedConsentSigned && financialAgreementSigned) {
      newStatus = 'FULLY_SIGNED';
    } else if (patientSignature || informedConsentSigned || financialAgreementSigned) {
      newStatus = 'PARTIALLY_SIGNED';
    }

    // Override if explicitly set
    if (data.status) {
      newStatus = data.status;
    }

    // Update acceptance
    const acceptance = await db.caseAcceptance.update({
      where: { id },
      data: {
        ...(data.informedConsentSigned !== undefined && { informedConsentSigned: data.informedConsentSigned }),
        ...(data.informedConsentDate !== undefined && { informedConsentDate: data.informedConsentDate }),
        ...(data.financialAgreementSigned !== undefined && { financialAgreementSigned: data.financialAgreementSigned }),
        ...(data.financialAgreementDate !== undefined && { financialAgreementDate: data.financialAgreementDate }),
        ...(data.hipaaAcknowledged !== undefined && { hipaaAcknowledged: data.hipaaAcknowledged }),
        ...(data.hipaaAcknowledgedDate !== undefined && { hipaaAcknowledgedDate: data.hipaaAcknowledgedDate }),
        ...(data.photoReleaseConsent !== undefined && { photoReleaseConsent: data.photoReleaseConsent }),
        ...(data.photoReleaseDate !== undefined && { photoReleaseDate: data.photoReleaseDate }),
        ...(data.totalTreatmentCost !== undefined && { totalTreatmentCost: data.totalTreatmentCost }),
        ...(data.downPayment !== undefined && { downPayment: data.downPayment }),
        ...(data.monthlyPayment !== undefined && { monthlyPayment: data.monthlyPayment }),
        ...(data.paymentPlanMonths !== undefined && { paymentPlanMonths: data.paymentPlanMonths }),
        ...(data.insuranceEstimate !== undefined && { insuranceEstimate: data.insuranceEstimate }),
        ...(data.patientResponsibility !== undefined && { patientResponsibility: data.patientResponsibility }),
        ...(data.patientSignature !== undefined && { patientSignature: data.patientSignature }),
        ...(data.patientSignedDate !== undefined && { patientSignedDate: data.patientSignedDate }),
        ...(data.guardianSignature !== undefined && { guardianSignature: data.guardianSignature }),
        ...(data.guardianSignedDate !== undefined && { guardianSignedDate: data.guardianSignedDate }),
        ...(data.guardianName !== undefined && { guardianName: data.guardianName }),
        ...(data.guardianRelation !== undefined && { guardianRelation: data.guardianRelation }),
        ...(data.witnessedById !== undefined && { witnessedById: data.witnessedById }),
        ...(data.witnessedDate !== undefined && { witnessedDate: data.witnessedDate }),
        ...(data.documentUrls !== undefined && { documentUrls: data.documentUrls }),
        ...(data.selectedOptionId !== undefined && { selectedOptionId: data.selectedOptionId }),
        ...(data.specialConditions !== undefined && { specialConditions: data.specialConditions }),
        ...(data.notes !== undefined && { notes: data.notes }),
        status: newStatus,
        ...(newStatus === 'FULLY_SIGNED' && !existingAcceptance.acceptedDate && {
          acceptedDate: new Date(),
        }),
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        selectedOption: {
          select: {
            id: true,
            optionName: true,
          },
        },
      },
    });

    // If fully signed, update treatment plan status
    if (newStatus === 'FULLY_SIGNED' && existingAcceptance.status !== 'FULLY_SIGNED') {
      await db.treatmentPlan.update({
        where: { id: existingAcceptance.treatmentPlanId },
        data: {
          status: 'ACCEPTED',
          acceptedDate: new Date(),
        },
      });
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'CaseAcceptance',
      entityId: id,
      details: {
        updatedFields: Object.keys(data),
        statusChange: newStatus !== existingAcceptance.status ? { from: existingAcceptance.status, to: newStatus } : undefined,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: acceptance });
  },
  { permissions: ['treatment:update'] }
);

/**
 * DELETE /api/case-acceptances/[id]
 * Soft delete a case acceptance
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Verify acceptance exists
    const existingAcceptance = await db.caseAcceptance.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!existingAcceptance) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CASE_ACCEPTANCE_NOT_FOUND',
            message: 'Case acceptance not found',
          },
        },
        { status: 404 }
      );
    }

    // Cannot delete fully signed acceptance
    if (existingAcceptance.status === 'FULLY_SIGNED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ACCEPTANCE_FINALIZED',
            message: 'Cannot delete a fully signed case acceptance. Withdraw it instead.',
          },
        },
        { status: 400 }
      );
    }

    // Soft delete
    await db.caseAcceptance.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'CaseAcceptance',
      entityId: id,
      details: {
        treatmentPlanId: existingAcceptance.treatmentPlanId,
        patientId: existingAcceptance.patientId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  },
  { permissions: ['treatment:delete'] }
);

/**
 * PATCH /api/case-acceptances/[id]
 * Sign a case acceptance (collect signatures)
 */
export const PATCH = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = signCaseAcceptanceSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid signature data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Verify acceptance exists
    const existingAcceptance = await db.caseAcceptance.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!existingAcceptance) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CASE_ACCEPTANCE_NOT_FOUND',
            message: 'Case acceptance not found',
          },
        },
        { status: 404 }
      );
    }

    if (existingAcceptance.status === 'FULLY_SIGNED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_SIGNED',
            message: 'Case acceptance is already fully signed',
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Update with signatures and mark as fully signed
    const acceptance = await db.caseAcceptance.update({
      where: { id },
      data: {
        patientSignature: data.patientSignature,
        patientSignedDate: data.patientSignedDate || new Date(),
        ...(data.guardianSignature && { guardianSignature: data.guardianSignature }),
        ...(data.guardianSignedDate && { guardianSignedDate: data.guardianSignedDate }),
        ...(data.witnessedById && { witnessedById: data.witnessedById }),
        witnessedDate: data.witnessedById ? new Date() : undefined,
        status: 'FULLY_SIGNED',
        acceptedDate: new Date(),
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update treatment plan status to ACCEPTED
    await db.treatmentPlan.update({
      where: { id: existingAcceptance.treatmentPlanId },
      data: {
        status: 'ACCEPTED',
        acceptedDate: new Date(),
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'CaseAcceptance',
      entityId: id,
      details: {
        action: 'SIGNED',
        treatmentPlanId: existingAcceptance.treatmentPlanId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: acceptance });
  },
  { permissions: ['treatment:update'] }
);
