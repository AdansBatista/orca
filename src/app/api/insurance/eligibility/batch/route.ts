import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { batchEligibilitySchema } from '@/lib/validations/insurance';

/**
 * POST /api/insurance/eligibility/batch
 * Batch check eligibility for multiple patient insurances
 *
 * Useful for verifying all patients scheduled for a specific day
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = batchEligibilitySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid batch eligibility data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { patientInsuranceIds, serviceDate } = result.data;
    const checkServiceDate = serviceDate || new Date();

    // Limit batch size
    if (patientInsuranceIds.length > 50) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BATCH_TOO_LARGE',
            message: 'Maximum 50 eligibility checks per batch',
          },
        },
        { status: 400 }
      );
    }

    // Get all patient insurances
    const patientInsurances = await db.patientInsurance.findMany({
      where: withSoftDelete({
        id: { in: patientInsuranceIds },
        clinicId: session.user.clinicId,
      }),
      include: {
        company: {
          select: {
            id: true,
            name: true,
            payerId: true,
            supportsEligibility: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Track results
    const results: {
      patientInsuranceId: string;
      patientName: string;
      companyName: string;
      status: 'pending' | 'success' | 'failed' | 'skipped';
      message?: string;
      checkId?: string;
    }[] = [];

    // Process each insurance
    for (const insurance of patientInsurances) {
      // Skip if eligibility not supported
      if (!insurance.company.supportsEligibility) {
        results.push({
          patientInsuranceId: insurance.id,
          patientName: `${insurance.patient.firstName} ${insurance.patient.lastName}`,
          companyName: insurance.company.name,
          status: 'skipped',
          message: 'Eligibility verification not supported for this payer',
        });
        continue;
      }

      // Create eligibility check record
      const eligibilityCheck = await db.eligibilityCheck.create({
        data: {
          clinicId: session.user.clinicId,
          patientInsuranceId: insurance.id,
          serviceDate: checkServiceDate,
          status: 'PENDING',
          checkedBy: session.user.id,
        },
      });

      try {
        // Mock eligibility check - replace with real clearinghouse integration
        // In production, these would be queued and processed asynchronously
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay

        // Mock successful response
        const mockResponse = {
          success: true,
          isEligible: true,
          hasOrthoBenefit: true,
          orthoLifetimeMax: 2000,
          orthoUsed: 0,
          orthoRemaining: 2000,
          orthoCoverage: 50,
        };

        // Update eligibility check
        await db.eligibilityCheck.update({
          where: { id: eligibilityCheck.id },
          data: {
            status: 'SUCCESS',
            isEligible: mockResponse.isEligible,
            hasOrthoBenefit: mockResponse.hasOrthoBenefit,
            orthoLifetimeMax: mockResponse.orthoLifetimeMax,
            orthoUsed: mockResponse.orthoUsed,
            orthoRemaining: mockResponse.orthoRemaining,
            orthoCoverage: mockResponse.orthoCoverage,
          },
        });

        // Update patient insurance verification status
        await db.patientInsurance.update({
          where: { id: insurance.id },
          data: {
            verificationStatus: 'VERIFIED',
            lastVerified: new Date(),
          },
        });

        results.push({
          patientInsuranceId: insurance.id,
          patientName: `${insurance.patient.firstName} ${insurance.patient.lastName}`,
          companyName: insurance.company.name,
          status: 'success',
          checkId: eligibilityCheck.id,
        });
      } catch (error) {
        // Update check as failed
        await db.eligibilityCheck.update({
          where: { id: eligibilityCheck.id },
          data: {
            status: 'FAILED',
            errorCode: 'SYSTEM_ERROR',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        results.push({
          patientInsuranceId: insurance.id,
          patientName: `${insurance.patient.firstName} ${insurance.patient.lastName}`,
          companyName: insurance.company.name,
          status: 'failed',
          message: error instanceof Error ? error.message : 'Verification failed',
          checkId: eligibilityCheck.id,
        });
      }
    }

    // Find any requested IDs that weren't found
    const foundIds = patientInsurances.map(i => i.id);
    const notFoundIds = patientInsuranceIds.filter(id => !foundIds.includes(id));

    for (const id of notFoundIds) {
      results.push({
        patientInsuranceId: id,
        patientName: 'Unknown',
        companyName: 'Unknown',
        status: 'failed',
        message: 'Patient insurance not found',
      });
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'EligibilityCheck',
      entityId: 'batch',
      details: {
        batchSize: patientInsuranceIds.length,
        successCount: results.filter(r => r.status === 'success').length,
        failedCount: results.filter(r => r.status === 'failed').length,
        skippedCount: results.filter(r => r.status === 'skipped').length,
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
          success: results.filter(r => r.status === 'success').length,
          failed: results.filter(r => r.status === 'failed').length,
          skipped: results.filter(r => r.status === 'skipped').length,
        },
      },
    });
  },
  { permissions: ['insurance:verify'] }
);
