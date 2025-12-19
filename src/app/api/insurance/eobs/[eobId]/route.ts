import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  updateEOBSchema,
  processEOBSchema,
  postEOBPaymentSchema,
} from '@/lib/validations/insurance';
import { createClaimStatusHistory, updateInsuranceBenefitUsage } from '@/lib/billing/insurance-utils';

interface RouteContext {
  params: Promise<{ eobId: string }>;
}

/**
 * GET /api/insurance/eobs/[eobId]
 * Get a single EOB by ID with full details
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session, context: RouteContext) => {
    const { eobId } = await context.params;

    const eob = await db.eOB.findFirst({
      where: {
        id: eobId,
        clinicId: session.user.clinicId,
      },
      include: {
        claim: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            insuranceCompany: true,
            patientInsurance: true,
            items: {
              orderBy: { lineNumber: 'asc' },
            },
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!eob) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'EOB not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: eob,
    });
  },
  { permissions: ['insurance:read'] }
);

/**
 * PATCH /api/insurance/eobs/[eobId]
 * Update an EOB
 */
export const PATCH = withAuth(
  async (req: NextRequest, session: Session, context: RouteContext) => {
    const { eobId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateEOBSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid EOB data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Check if EOB exists
    const existing = await db.eOB.findFirst({
      where: {
        id: eobId,
        clinicId: session.user.clinicId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'EOB not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if EOB can be edited
    if (existing.status === 'PROCESSED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EOB_PROCESSED',
            message: 'Cannot edit a processed EOB',
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Update the EOB
    const eob = await db.eOB.update({
      where: { id: eobId },
      data: {
        ...data,
        extractedData: data.extractedData as never,
      },
      include: {
        claim: {
          select: {
            id: true,
            claimNumber: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'EOB',
      entityId: eobId,
      details: {
        updatedFields: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: eob });
  },
  { permissions: ['insurance:update'] }
);

/**
 * POST /api/insurance/eobs/[eobId]
 * Special actions: process, post
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session, context: RouteContext) => {
    const { eobId } = await context.params;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const body = await req.json();

    // Check if EOB exists
    const existing = await db.eOB.findFirst({
      where: {
        id: eobId,
        clinicId: session.user.clinicId,
      },
      include: {
        claim: {
          include: {
            items: true,
            patientInsurance: true,
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
            message: 'EOB not found',
          },
        },
        { status: 404 }
      );
    }

    switch (action) {
      case 'process': {
        // Process EOB - validate and prepare for posting
        if (existing.status !== 'PENDING' && existing.status !== 'REVIEWING') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: `Cannot process EOB in ${existing.status} status`,
              },
            },
            { status: 400 }
          );
        }

        // Validate process data
        const processResult = processEOBSchema.safeParse(body);
        if (!processResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid process data',
                details: processResult.error.flatten(),
              },
            },
            { status: 400 }
          );
        }

        const processData = processResult.data;

        // Verify claim if provided
        if (processData.claimId && processData.claimId !== existing.claimId) {
          const claim = await db.insuranceClaim.findFirst({
            where: {
              id: processData.claimId,
              clinicId: session.user.clinicId,
            },
          });

          if (!claim) {
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'CLAIM_NOT_FOUND',
                  message: 'Claim not found',
                },
              },
              { status: 404 }
            );
          }
        }

        // Update line items if provided
        if (processData.lineItems && existing.claim) {
          for (const lineItem of processData.lineItems) {
            await db.claimItem.update({
              where: { id: lineItem.claimItemId },
              data: {
                paidAmount: lineItem.paidAmount,
                adjustmentAmount: lineItem.adjustmentAmount,
                denialCode: lineItem.denialCode,
                denialReason: lineItem.denialReason,
                status: lineItem.denialCode ? 'DENIED' : lineItem.paidAmount > 0 ? 'PAID' : 'ADJUSTED',
              },
            });
          }
        }

        // Update EOB
        const eob = await db.eOB.update({
          where: { id: eobId },
          data: {
            claimId: processData.claimId,
            totalPaid: processData.totalPaid,
            totalAdjusted: processData.totalAdjusted,
            patientResponsibility: processData.patientResponsibility,
            status: 'REVIEWING',
            needsReview: false,
          },
          include: {
            claim: {
              select: {
                id: true,
                claimNumber: true,
              },
            },
          },
        });

        // Audit log
        const { ipAddress, userAgent } = getRequestMeta(req);
        await logAudit(session, {
          action: 'UPDATE',
          entity: 'EOB',
          entityId: eobId,
          details: {
            action: 'process',
            totalPaid: processData.totalPaid,
            totalAdjusted: processData.totalAdjusted,
          },
          ipAddress,
          userAgent,
        });

        return NextResponse.json({
          success: true,
          data: eob,
          message: 'EOB processed successfully. Ready for posting.',
        });
      }

      case 'post': {
        // Post insurance payment from EOB
        if (existing.status !== 'REVIEWING') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'NOT_REVIEWED',
                message: 'EOB must be reviewed before posting',
              },
            },
            { status: 400 }
          );
        }

        if (!existing.claim) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'NO_CLAIM',
                message: 'EOB must be linked to a claim before posting',
              },
            },
            { status: 400 }
          );
        }

        // Validate post data
        const postResult = postEOBPaymentSchema.safeParse(body);
        if (!postResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid post data',
                details: postResult.error.flatten(),
              },
            },
            { status: 400 }
          );
        }

        const postData = postResult.data;

        // Verify account exists
        const account = await db.patientAccount.findFirst({
          where: {
            id: postData.accountId,
            clinicId: session.user.clinicId,
          },
        });

        if (!account) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'ACCOUNT_NOT_FOUND',
                message: 'Patient account not found',
              },
            },
            { status: 404 }
          );
        }

        // Create insurance payment record
        const insurancePayment = await db.insurancePayment.create({
          data: {
            clinicId: session.user.clinicId,
            eobId,
            claimId: existing.claimId!,
            accountId: postData.accountId,
            paymentDate: postData.paymentDate,
            amount: existing.totalPaid,
            adjustmentAmount: existing.totalAdjusted,
            adjustmentReason: postData.adjustmentReason,
            postedAt: new Date(),
            postedBy: session.user.id,
          },
        });

        // Update EOB status
        await db.eOB.update({
          where: { id: eobId },
          data: {
            status: 'PROCESSED',
            processedAt: new Date(),
            processedBy: session.user.id,
          },
        });

        // Update claim with payment info
        const previousClaimStatus = existing.claim.status;
        const claimPaidAmount = (existing.claim.paidAmount || 0) + existing.totalPaid;
        const claimAdjustment = (existing.claim.adjustmentAmount || 0) + existing.totalAdjusted;
        const newClaimStatus = claimPaidAmount >= existing.claim.billedAmount ? 'PAID' :
          claimPaidAmount > 0 ? 'PARTIAL' : previousClaimStatus;

        await db.insuranceClaim.update({
          where: { id: existing.claimId! },
          data: {
            paidAmount: claimPaidAmount,
            adjustmentAmount: claimAdjustment,
            patientResponsibility: existing.patientResponsibility,
            status: newClaimStatus,
            updatedBy: session.user.id,
          },
        });

        // Record claim status change
        if (newClaimStatus !== previousClaimStatus) {
          await createClaimStatusHistory(
            existing.claimId!,
            previousClaimStatus,
            newClaimStatus,
            session.user.id,
            `Payment posted from EOB: $${existing.totalPaid}`
          );
        }

        // Update insurance benefit usage
        if (existing.claim.patientInsurance && existing.totalPaid > 0) {
          await updateInsuranceBenefitUsage(
            existing.claim.patientInsurance.id,
            existing.totalPaid,
            session.user.clinicId
          );
        }

        // Audit log
        const postMeta = getRequestMeta(req);
        await logAudit(session, {
          action: 'CREATE',
          entity: 'InsurancePayment',
          entityId: insurancePayment.id,
          details: {
            action: 'post',
            eobId,
            claimId: existing.claimId,
            amount: existing.totalPaid,
            adjustmentAmount: existing.totalAdjusted,
          },
          ipAddress: postMeta.ipAddress,
          userAgent: postMeta.userAgent,
        });

        return NextResponse.json({
          success: true,
          data: {
            payment: insurancePayment,
            claimStatus: newClaimStatus,
          },
          message: 'Payment posted successfully',
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ACTION',
              message: 'Invalid action. Supported actions: process, post',
            },
          },
          { status: 400 }
        );
    }
  },
  { permissions: ['insurance:post_payment'] }
);
