import { NextResponse } from 'next/server';

import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ token: string }>;
}

/**
 * GET /api/intake/[token]
 * Public endpoint to get intake token data for form submission
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { token } = await params;

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
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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

    if (!intakeToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'This link is invalid or has expired',
          },
        },
        { status: 404 }
      );
    }

    // Get the form templates
    const templateIds = intakeToken.templateIds as string[];
    const templates = await db.formTemplate.findMany({
      where: {
        id: { in: templateIds },
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Get already completed submissions
    const completedSubmissions = await db.formSubmission.findMany({
      where: {
        clinicId: intakeToken.clinicId,
        templateId: { in: templateIds },
        OR: [
          { leadId: intakeToken.leadId },
          { patientId: intakeToken.patientId },
        ].filter((c) => c.leadId || c.patientId),
        status: 'COMPLETED',
      },
      select: {
        templateId: true,
      },
    });

    const completedTemplateIds = completedSubmissions.map((s) => s.templateId);

    // Filter out already completed templates
    const remainingTemplates = templates.filter(
      (t) => !completedTemplateIds.includes(t.id)
    );

    if (remainingTemplates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALL_COMPLETED',
            message: 'All forms have already been submitted',
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        clinic: intakeToken.clinic,
        lead: intakeToken.lead,
        patient: intakeToken.patient,
        templates: remainingTemplates,
        totalForms: templates.length,
        completedForms: completedTemplateIds.length,
      },
    });
  } catch (error) {
    console.error('Intake token fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to load intake forms',
        },
      },
      { status: 500 }
    );
  }
}
