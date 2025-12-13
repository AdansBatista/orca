import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete, softDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  updateInsuranceClaimSchema,
  submitClaimSchema,
  appealClaimSchema,
  resubmitClaimSchema,
} from '@/lib/validations/insurance';
import {
  createClaimStatusHistory,
  generateClaimNumber,
  calculateClaimTotals,
} from '@/lib/billing/insurance-utils';

interface RouteContext {
  params: Promise<{ claimId: string }>;
}

/**
 * GET /api/insurance/claims/[claimId]
 * Get a single claim by ID with full details
 */
export const GET = withAuth(
  async (req, session, context: RouteContext) => {
    const { claimId } = await context.params;

    const claim = await db.insuranceClaim.findFirst({
      where: withSoftDelete({
        id: claimId,
        clinicId: session.user.clinicId,
      }),
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
        insuranceCompany: true,
        items: {
          orderBy: { lineNumber: 'asc' },
        },
        eobs: {
          orderBy: { receivedDate: 'desc' },
        },
        statusHistory: {
          orderBy: { changedAt: 'desc' },
        },
      },
    });

    if (!claim) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Claim not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: claim,
    });
  },
  { permissions: ['insurance:read'] }
);

/**
 * PATCH /api/insurance/claims/[claimId]
 * Update a claim
 */
export const PATCH = withAuth(
  async (req, session, context: RouteContext) => {
    const { claimId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateInsuranceClaimSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid claim data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Check if claim exists
    const existing = await db.insuranceClaim.findFirst({
      where: withSoftDelete({
        id: claimId,
        clinicId: session.user.clinicId,
      }),
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Claim not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if claim can be edited
    if (['PAID', 'CLOSED', 'VOID'].includes(existing.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CLAIM_LOCKED',
            message: `Cannot edit a ${existing.status.toLowerCase()} claim`,
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;
    const previousStatus = existing.status;

    // Update the claim
    const claim = await db.insuranceClaim.update({
      where: { id: claimId },
      data: {
        ...data,
        updatedBy: session.user.id,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        insuranceCompany: {
          select: {
            id: true,
            name: true,
            payerId: true,
          },
        },
        items: true,
      },
    });

    // Record status change if status was updated
    if (data.status && data.status !== previousStatus) {
      await createClaimStatusHistory(
        claimId,
        previousStatus,
        data.status,
        session.user.id
      );
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'InsuranceClaim',
      entityId: claimId,
      details: {
        claimNumber: claim.claimNumber,
        previousStatus,
        newStatus: claim.status,
        updatedFields: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: claim });
  },
  { permissions: ['insurance:update'] }
);

/**
 * POST /api/insurance/claims/[claimId]
 * Special actions: submit, void, appeal, resubmit
 */
export const POST = withAuth(
  async (req, session, context: RouteContext) => {
    const { claimId } = await context.params;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const body = await req.json().catch(() => ({}));

    // Check if claim exists
    const existing = await db.insuranceClaim.findFirst({
      where: withSoftDelete({
        id: claimId,
        clinicId: session.user.clinicId,
      }),
      include: {
        items: true,
        insuranceCompany: true,
        patientInsurance: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Claim not found',
          },
        },
        { status: 404 }
      );
    }

    switch (action) {
      case 'submit': {
        // Submit claim to insurance
        if (!['DRAFT', 'READY'].includes(existing.status)) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Only draft or ready claims can be submitted',
              },
            },
            { status: 400 }
          );
        }

        // Validate submission method
        const submitResult = submitClaimSchema.safeParse(body);
        if (!submitResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid submission data',
                details: submitResult.error.flatten(),
              },
            },
            { status: 400 }
          );
        }

        const previousStatus = existing.status;

        // Update claim status
        const claim = await db.insuranceClaim.update({
          where: { id: claimId },
          data: {
            status: 'SUBMITTED',
            submissionMethod: submitResult.data.submissionMethod,
            submittedAt: new Date(),
            submittedBy: session.user.id,
            filingDate: existing.filingDate || new Date(),
            updatedBy: session.user.id,
          },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            insuranceCompany: {
              select: {
                id: true,
                name: true,
                payerId: true,
              },
            },
            items: true,
          },
        });

        // Record status change
        await createClaimStatusHistory(
          claimId,
          previousStatus,
          'SUBMITTED',
          session.user.id,
          `Submitted via ${submitResult.data.submissionMethod.toLowerCase()}`
        );

        // Audit log
        const { ipAddress, userAgent } = getRequestMeta(req);
        await logAudit(session, {
          action: 'UPDATE',
          entity: 'InsuranceClaim',
          entityId: claimId,
          details: {
            action: 'submit',
            claimNumber: claim.claimNumber,
            submissionMethod: submitResult.data.submissionMethod,
          },
          ipAddress,
          userAgent,
        });

        return NextResponse.json({
          success: true,
          data: claim,
          message: 'Claim submitted successfully',
        });
      }

      case 'void': {
        // Void a claim
        if (['VOID', 'CLOSED'].includes(existing.status)) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'ALREADY_VOID',
                message: 'Claim is already void or closed',
              },
            },
            { status: 400 }
          );
        }

        const previousStatus = existing.status;

        // Update claim status
        const claim = await db.insuranceClaim.update({
          where: { id: claimId },
          data: {
            status: 'VOID',
            updatedBy: session.user.id,
          },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            insuranceCompany: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        // Record status change
        await createClaimStatusHistory(
          claimId,
          previousStatus,
          'VOID',
          session.user.id,
          body.reason || 'Claim voided'
        );

        // Audit log
        const meta = getRequestMeta(req);
        await logAudit(session, {
          action: 'UPDATE',
          entity: 'InsuranceClaim',
          entityId: claimId,
          details: {
            action: 'void',
            claimNumber: claim.claimNumber,
            reason: body.reason,
          },
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        });

        return NextResponse.json({
          success: true,
          data: claim,
          message: 'Claim voided successfully',
        });
      }

      case 'appeal': {
        // Appeal a denied claim
        if (existing.status !== 'DENIED') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'NOT_DENIED',
                message: 'Only denied claims can be appealed',
              },
            },
            { status: 400 }
          );
        }

        // Validate appeal data
        const appealResult = appealClaimSchema.safeParse(body);
        if (!appealResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid appeal data',
                details: appealResult.error.flatten(),
              },
            },
            { status: 400 }
          );
        }

        const previousStatus = existing.status;

        // Update claim status
        const claim = await db.insuranceClaim.update({
          where: { id: claimId },
          data: {
            status: 'APPEALED',
            updatedBy: session.user.id,
          },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            insuranceCompany: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        // Record status change with appeal reason
        await createClaimStatusHistory(
          claimId,
          previousStatus,
          'APPEALED',
          session.user.id,
          appealResult.data.appealReason
        );

        // Audit log
        const appealMeta = getRequestMeta(req);
        await logAudit(session, {
          action: 'UPDATE',
          entity: 'InsuranceClaim',
          entityId: claimId,
          details: {
            action: 'appeal',
            claimNumber: claim.claimNumber,
            denialCode: existing.denialCode,
          },
          ipAddress: appealMeta.ipAddress,
          userAgent: appealMeta.userAgent,
        });

        return NextResponse.json({
          success: true,
          data: claim,
          message: 'Appeal submitted successfully',
        });
      }

      case 'resubmit': {
        // Resubmit a denied or rejected claim
        if (!['DENIED', 'APPEALED'].includes(existing.status)) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Only denied or appealed claims can be resubmitted',
              },
            },
            { status: 400 }
          );
        }

        // Validate resubmit data
        const resubmitResult = resubmitClaimSchema.safeParse(body);
        if (!resubmitResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid resubmit data',
                details: resubmitResult.error.flatten(),
              },
            },
            { status: 400 }
          );
        }

        // Generate new claim number for corrected claim
        const newClaimNumber = await generateClaimNumber(session.user.clinicId);

        // Calculate totals from items
        const items = resubmitResult.data.items || existing.items.map(item => ({
          lineNumber: item.lineNumber,
          procedureCode: item.procedureCode,
          procedureCodeModifier: item.procedureCodeModifier,
          description: item.description,
          serviceDate: item.serviceDate,
          quantity: item.quantity,
          toothNumbers: item.toothNumbers,
          billedAmount: item.billedAmount,
          procedureId: item.procedureId,
        }));
        const { totalBilled } = calculateClaimTotals(items);

        // Create a new corrected claim
        const newClaim = await db.insuranceClaim.create({
          data: {
            clinicId: session.user.clinicId,
            patientId: existing.patientId,
            patientInsuranceId: existing.patientInsuranceId,
            insuranceCompanyId: existing.insuranceCompanyId,
            claimNumber: newClaimNumber,
            claimType: 'CORRECTED',
            serviceDate: existing.serviceDate,
            status: 'DRAFT',
            billedAmount: totalBilled,
            originalClaimId: existing.id,
            preauthNumber: existing.preauthNumber,
            renderingProviderId: existing.renderingProviderId,
            npi: existing.npi,
            createdBy: session.user.id,
            updatedBy: session.user.id,
            items: {
              create: items.map((item, index) => ({
                lineNumber: item.lineNumber || index + 1,
                procedureCode: item.procedureCode,
                procedureCodeModifier: item.procedureCodeModifier,
                description: item.description,
                serviceDate: item.serviceDate,
                quantity: item.quantity,
                toothNumbers: item.toothNumbers || [],
                billedAmount: item.billedAmount,
                procedureId: item.procedureId,
              })),
            },
          },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            insuranceCompany: {
              select: {
                id: true,
                name: true,
              },
            },
            items: true,
          },
        });

        // Record status history for new claim
        await createClaimStatusHistory(
          newClaim.id,
          null,
          'DRAFT',
          session.user.id,
          `Corrected claim created from ${existing.claimNumber}. ${resubmitResult.data.correctionNotes || ''}`
        );

        // Mark original claim as closed
        await db.insuranceClaim.update({
          where: { id: claimId },
          data: {
            status: 'CLOSED',
            updatedBy: session.user.id,
          },
        });

        await createClaimStatusHistory(
          claimId,
          existing.status,
          'CLOSED',
          session.user.id,
          `Replaced by corrected claim ${newClaimNumber}`
        );

        // Audit log
        const resubmitMeta = getRequestMeta(req);
        await logAudit(session, {
          action: 'CREATE',
          entity: 'InsuranceClaim',
          entityId: newClaim.id,
          details: {
            action: 'resubmit',
            originalClaimNumber: existing.claimNumber,
            newClaimNumber: newClaim.claimNumber,
          },
          ipAddress: resubmitMeta.ipAddress,
          userAgent: resubmitMeta.userAgent,
        });

        return NextResponse.json({
          success: true,
          data: newClaim,
          message: 'Corrected claim created successfully',
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ACTION',
              message: 'Invalid action. Supported actions: submit, void, appeal, resubmit',
            },
          },
          { status: 400 }
        );
    }
  },
  { permissions: ['insurance:submit_claim'] }
);

/**
 * DELETE /api/insurance/claims/[claimId]
 * Soft delete a claim (only drafts)
 */
export const DELETE = withAuth(
  async (req, session, context: RouteContext) => {
    const { claimId } = await context.params;

    // Check if claim exists
    const existing = await db.insuranceClaim.findFirst({
      where: withSoftDelete({
        id: claimId,
        clinicId: session.user.clinicId,
      }),
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Claim not found',
          },
        },
        { status: 404 }
      );
    }

    // Only allow deleting draft claims
    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CANNOT_DELETE',
            message: 'Only draft claims can be deleted. Use void for submitted claims.',
          },
        },
        { status: 400 }
      );
    }

    // Soft delete the claim
    await db.insuranceClaim.update({
      where: { id: claimId },
      data: softDelete(),
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'InsuranceClaim',
      entityId: claimId,
      details: {
        claimNumber: existing.claimNumber,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  },
  { permissions: ['insurance:void'] }
);
