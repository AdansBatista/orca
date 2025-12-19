import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { z } from 'zod';

const uploadEOBSchema = z.object({
  documentUrl: z.string().url('Valid document URL is required'),
  receivedDate: z.coerce.date().optional(),
  claimId: z.string().optional().nullable(),
  eobNumber: z.string().max(100).optional().nullable(),
  checkNumber: z.string().max(50).optional().nullable(),
});

/**
 * POST /api/insurance/eobs/upload
 * Upload a scanned EOB document for AI extraction
 *
 * Note: In production, this would integrate with:
 * - Document storage (S3, Azure Blob, etc.)
 * - AI/OCR service for data extraction (Claude Vision, AWS Textract, etc.)
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = uploadEOBSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid upload data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify claim exists if provided
    if (data.claimId) {
      const claim = await db.insuranceClaim.findFirst({
        where: {
          id: data.claimId,
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

    // Create the EOB with pending AI extraction
    const eob = await db.eOB.create({
      data: {
        clinicId: session.user.clinicId,
        claimId: data.claimId,
        eobNumber: data.eobNumber,
        checkNumber: data.checkNumber,
        receivedDate: data.receivedDate || new Date(),
        receiptMethod: 'SCANNED',
        documentUrl: data.documentUrl,
        totalPaid: 0, // Will be updated after extraction
        status: 'PENDING',
        needsReview: true, // Scanned EOBs always need review
      },
    });

    // TODO: In production, trigger AI extraction here
    // This would:
    // 1. Send document to AI/OCR service
    // 2. Extract payment details, adjustments, denial codes
    // 3. Update the EOB with extracted data
    // 4. Set extractionConfidence based on AI confidence scores

    // Mock AI extraction response
    const mockExtraction = {
      success: true,
      data: {
        totalPaid: 0,
        totalAdjusted: 0,
        patientResponsibility: 0,
        lineItems: [],
        confidence: 0,
      },
      message: 'Document queued for AI extraction. Please review manually or wait for automated extraction.',
    };

    // Update EOB with mock extraction data (placeholder)
    await db.eOB.update({
      where: { id: eob.id },
      data: {
        extractedData: mockExtraction.data as never,
        extractionConfidence: mockExtraction.data.confidence,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'EOB',
      entityId: eob.id,
      details: {
        action: 'upload',
        receiptMethod: 'SCANNED',
        documentUrl: data.documentUrl,
        claimId: data.claimId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...eob,
          extractionStatus: 'pending',
          message: mockExtraction.message,
        },
      },
      { status: 201 }
    );
  },
  { permissions: ['insurance:create'] }
);
