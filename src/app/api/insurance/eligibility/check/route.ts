import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { checkEligibilitySchema } from '@/lib/validations/insurance';

/**
 * POST /api/insurance/eligibility/check
 * Check eligibility for a patient insurance
 *
 * Note: This is a placeholder implementation. In production, this would
 * integrate with a clearinghouse API (e.g., Tesia, Availity, Change Healthcare)
 * to perform real-time eligibility verification via EDI 270/271.
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = checkEligibilitySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid eligibility check data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { patientInsuranceId, serviceDate } = result.data;
    const checkServiceDate = serviceDate || new Date();

    // Get the patient insurance with company info
    const patientInsurance = await db.patientInsurance.findFirst({
      where: withSoftDelete({
        id: patientInsuranceId,
        clinicId: session.user.clinicId,
      }),
      include: {
        company: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
          },
        },
      },
    });

    if (!patientInsurance) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Patient insurance not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if company supports eligibility verification
    if (!patientInsurance.company.supportsEligibility) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ELIGIBILITY_NOT_SUPPORTED',
            message: 'This insurance company does not support electronic eligibility verification',
          },
        },
        { status: 400 }
      );
    }

    // Create eligibility check record (starts as PENDING)
    const eligibilityCheck = await db.eligibilityCheck.create({
      data: {
        clinicId: session.user.clinicId,
        patientInsuranceId,
        serviceDate: checkServiceDate,
        status: 'PENDING',
        checkedBy: session.user.id,
      },
    });

    try {
      // TODO: Integrate with clearinghouse API
      // This is a mock response - in production, call the clearinghouse
      const mockResponse = await performEligibilityCheck({
        payerId: patientInsurance.company.payerId,
        subscriberId: patientInsurance.subscriberId,
        subscriberName: patientInsurance.subscriberName,
        subscriberDob: patientInsurance.subscriberDob,
        patientName: `${patientInsurance.patient.firstName} ${patientInsurance.patient.lastName}`,
        patientDob: patientInsurance.patient.dateOfBirth,
        relationToSubscriber: patientInsurance.relationToSubscriber,
        serviceDate: checkServiceDate,
      });

      // Update eligibility check with results
      const updatedCheck = await db.eligibilityCheck.update({
        where: { id: eligibilityCheck.id },
        data: {
          status: mockResponse.success ? 'SUCCESS' : 'FAILED',
          isEligible: mockResponse.isEligible,
          eligibilityData: mockResponse.rawData as never,
          hasOrthoBenefit: mockResponse.ortho?.hasBenefit,
          orthoLifetimeMax: mockResponse.ortho?.lifetimeMax,
          orthoUsed: mockResponse.ortho?.usedAmount,
          orthoRemaining: mockResponse.ortho?.remainingAmount,
          orthoCoverage: mockResponse.ortho?.coveragePercent,
          orthoDeductible: mockResponse.ortho?.deductible,
          orthoDeductibleMet: mockResponse.ortho?.deductibleMet,
          errorCode: mockResponse.errorCode,
          errorMessage: mockResponse.errorMessage,
        },
        include: {
          patientInsurance: {
            include: {
              company: {
                select: { name: true },
              },
            },
          },
        },
      });

      // If successful, update the patient insurance with new benefit info
      if (mockResponse.success && mockResponse.isEligible && mockResponse.ortho) {
        await db.patientInsurance.update({
          where: { id: patientInsuranceId },
          data: {
            verificationStatus: 'VERIFIED',
            lastVerified: new Date(),
            hasOrthoBenefit: mockResponse.ortho.hasBenefit,
            orthoLifetimeMax: mockResponse.ortho.lifetimeMax,
            orthoUsedAmount: mockResponse.ortho.usedAmount,
            orthoRemainingAmount: mockResponse.ortho.remainingAmount,
            orthoCoveragePercent: mockResponse.ortho.coveragePercent,
            orthoDeductible: mockResponse.ortho.deductible,
            orthoDeductibleMet: mockResponse.ortho.deductibleMet,
          },
        });
      } else if (!mockResponse.success) {
        await db.patientInsurance.update({
          where: { id: patientInsuranceId },
          data: {
            verificationStatus: 'FAILED',
            lastVerified: new Date(),
          },
        });
      }

      // Audit log
      const { ipAddress, userAgent } = getRequestMeta(req);
      await logAudit(session, {
        action: 'CREATE',
        entity: 'EligibilityCheck',
        entityId: eligibilityCheck.id,
        details: {
          patientInsuranceId,
          status: updatedCheck.status,
          isEligible: updatedCheck.isEligible,
        },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        data: updatedCheck,
      });
    } catch (error) {
      // Update check as failed
      const failedCheck = await db.eligibilityCheck.update({
        where: { id: eligibilityCheck.id },
        data: {
          status: 'FAILED',
          errorCode: 'SYSTEM_ERROR',
          errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ELIGIBILITY_CHECK_FAILED',
            message: 'Failed to verify eligibility',
          },
          data: failedCheck,
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['insurance:verify'] }
);

// Mock eligibility check function - replace with real clearinghouse integration
interface EligibilityCheckParams {
  payerId: string;
  subscriberId: string;
  subscriberName: string;
  subscriberDob: Date;
  patientName: string;
  patientDob: Date | null;
  relationToSubscriber: string;
  serviceDate: Date;
}

interface EligibilityResponse {
  success: boolean;
  isEligible: boolean;
  ortho?: {
    hasBenefit: boolean;
    lifetimeMax: number | null;
    usedAmount: number;
    remainingAmount: number | null;
    coveragePercent: number | null;
    deductible: number | null;
    deductibleMet: number;
    ageLimit: number | null;
    waitingPeriodMonths: number | null;
  };
  rawData: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
}

async function performEligibilityCheck(_params: EligibilityCheckParams): Promise<EligibilityResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock successful response - in production, call clearinghouse API
  // and parse EDI 271 response
  return {
    success: true,
    isEligible: true,
    ortho: {
      hasBenefit: true,
      lifetimeMax: 2000,
      usedAmount: 0,
      remainingAmount: 2000,
      coveragePercent: 50,
      deductible: 50,
      deductibleMet: 0,
      ageLimit: 19,
      waitingPeriodMonths: 12,
    },
    rawData: {
      source: 'mock',
      timestamp: new Date().toISOString(),
      message: 'This is a mock eligibility response. Integrate with clearinghouse for production.',
    },
  };
}
