import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createClaimStatusHistory } from '@/lib/billing/insurance-utils';
import { z } from 'zod';

const batchSubmitSchema = z.object({
  claimIds: z.array(z.string()).min(1, 'At least one claim is required'),
  submissionMethod: z.enum(['ELECTRONIC', 'PAPER', 'PORTAL']).default('ELECTRONIC'),
});

/**
 * POST /api/insurance/claims/batch-submit
 * Submit multiple claims at once
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = batchSubmitSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid batch submit data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { claimIds, submissionMethod } = result.data;

    // Limit batch size
    if (claimIds.length > 50) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BATCH_TOO_LARGE',
            message: 'Maximum 50 claims per batch',
          },
        },
        { status: 400 }
      );
    }

    // Get all claims
    const claims = await db.insuranceClaim.findMany({
      where: withSoftDelete({
        id: { in: claimIds },
        clinicId: session.user.clinicId,
      }),
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        insuranceCompany: {
          select: {
            name: true,
          },
        },
      },
    });

    // Track results
    const results: {
      claimId: string;
      claimNumber: string;
      patientName: string;
      status: 'submitted' | 'skipped' | 'error';
      message?: string;
    }[] = [];

    // Process each claim
    for (const claim of claims) {
      // Skip claims that aren't ready to submit
      if (!['DRAFT', 'READY'].includes(claim.status)) {
        results.push({
          claimId: claim.id,
          claimNumber: claim.claimNumber,
          patientName: `${claim.patient.firstName} ${claim.patient.lastName}`,
          status: 'skipped',
          message: `Claim status is ${claim.status}, must be DRAFT or READY`,
        });
        continue;
      }

      try {
        const previousStatus = claim.status;

        // Update claim status
        await db.insuranceClaim.update({
          where: { id: claim.id },
          data: {
            status: 'SUBMITTED',
            submissionMethod,
            submittedAt: new Date(),
            submittedBy: session.user.id,
            filingDate: claim.filingDate || new Date(),
            updatedBy: session.user.id,
          },
        });

        // Record status change
        await createClaimStatusHistory(
          claim.id,
          previousStatus,
          'SUBMITTED',
          session.user.id,
          `Batch submitted via ${submissionMethod.toLowerCase()}`
        );

        results.push({
          claimId: claim.id,
          claimNumber: claim.claimNumber,
          patientName: `${claim.patient.firstName} ${claim.patient.lastName}`,
          status: 'submitted',
        });
      } catch (error) {
        results.push({
          claimId: claim.id,
          claimNumber: claim.claimNumber,
          patientName: `${claim.patient.firstName} ${claim.patient.lastName}`,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Find any requested IDs that weren't found
    const foundIds = claims.map(c => c.id);
    const notFoundIds = claimIds.filter(id => !foundIds.includes(id));

    for (const id of notFoundIds) {
      results.push({
        claimId: id,
        claimNumber: 'Unknown',
        patientName: 'Unknown',
        status: 'error',
        message: 'Claim not found',
      });
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'InsuranceClaim',
      entityId: 'batch',
      details: {
        action: 'batch-submit',
        batchSize: claimIds.length,
        submittedCount: results.filter(r => r.status === 'submitted').length,
        skippedCount: results.filter(r => r.status === 'skipped').length,
        errorCount: results.filter(r => r.status === 'error').length,
        submissionMethod,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          submitted: results.filter(r => r.status === 'submitted').length,
          skipped: results.filter(r => r.status === 'skipped').length,
          errors: results.filter(r => r.status === 'error').length,
        },
      },
    });
  },
  { permissions: ['insurance:submit_claim'] }
);
