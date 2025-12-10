import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { submitFormSchema } from '@/lib/validations/forms';

/**
 * POST /api/forms/submit
 * Public endpoint for patients/leads to submit forms
 * Uses intake tokens for authentication
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = req.headers.get('X-Intake-Token');

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Intake token is required',
          },
        },
        { status: 401 }
      );
    }

    // Validate input
    const result = submitFormSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid form data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Find intake token
    const intakeToken = await db.intakeToken.findFirst({
      where: {
        token,
        isUsed: false,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!intakeToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired intake token',
          },
        },
        { status: 401 }
      );
    }

    const data = result.data;

    // Verify template is in the allowed list
    const templateIds = intakeToken.templateIds as string[];
    if (!templateIds.includes(data.templateId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Template not allowed for this intake token',
          },
        },
        { status: 403 }
      );
    }

    // Verify template exists and is active
    const template = await db.formTemplate.findFirst({
      where: {
        id: data.templateId,
        OR: [{ clinicId: intakeToken.clinicId }, { clinicId: null }],
        isActive: true,
      },
    });

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Form template not found or inactive',
          },
        },
        { status: 404 }
      );
    }

    // Check if form was already submitted
    const existingSubmission = await db.formSubmission.findFirst({
      where: {
        clinicId: intakeToken.clinicId,
        templateId: data.templateId,
        OR: [
          { leadId: intakeToken.leadId },
          { patientId: intakeToken.patientId },
        ].filter(Boolean),
        status: 'COMPLETED',
      },
    });

    if (existingSubmission) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_SUBMITTED',
            message: 'This form has already been submitted',
          },
        },
        { status: 400 }
      );
    }

    // Create form submission
    const submission = await db.formSubmission.create({
      data: {
        clinicId: intakeToken.clinicId,
        templateId: data.templateId,
        leadId: intakeToken.leadId,
        patientId: intakeToken.patientId,
        responses: data.responses as Prisma.InputJsonValue,
        status: 'COMPLETED',
        startedAt: new Date(),
        completedAt: new Date(),
        submittedBy: data.submittedBy,
        signatureData: data.signatureData,
        signedAt: data.signatureData ? new Date() : null,
        signerName: data.signerName,
        signerRelation: data.signerRelation,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Check if all required forms have been submitted
    const completedSubmissions = await db.formSubmission.count({
      where: {
        clinicId: intakeToken.clinicId,
        templateId: { in: templateIds },
        OR: [
          { leadId: intakeToken.leadId },
          { patientId: intakeToken.patientId },
        ].filter(Boolean),
        status: 'COMPLETED',
      },
    });

    // If all forms completed, mark token as used
    if (completedSubmissions === templateIds.length) {
      await db.intakeToken.update({
        where: { id: intakeToken.id },
        data: { isUsed: true },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        submission,
        formsRemaining: templateIds.length - completedSubmissions,
        allFormsCompleted: completedSubmissions === templateIds.length,
      },
    });
  } catch (error) {
    console.error('Form submission error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to submit form',
        },
      },
      { status: 500 }
    );
  }
}
