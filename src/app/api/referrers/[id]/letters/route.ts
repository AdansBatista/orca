import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createReferralLetterSchema } from '@/lib/validations/referrers';

/**
 * GET /api/referrers/[id]/letters
 * Get referral letters for a provider
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Verify provider exists and belongs to clinic
    const provider = await db.referringProvider.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      select: { id: true },
    });

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Referring provider not found',
          },
        },
        { status: 404 }
      );
    }

    const letters = await db.referralLetter.findMany({
      where: {
        providerId: id,
        clinicId: session.user.clinicId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: letters });
  },
  { permissions: ['leads:view', 'leads:edit', 'leads:full'] }
);

/**
 * POST /api/referrers/[id]/letters
 * Create a new referral letter for a provider
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = createReferralLetterSchema.safeParse({ ...body, providerId: id });
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid letter data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Verify provider exists and belongs to clinic
    const provider = await db.referringProvider.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      select: { id: true, practiceName: true, firstName: true, lastName: true },
    });

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Referring provider not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Create the letter
    const letter = await db.referralLetter.create({
      data: {
        clinicId: session.user.clinicId,
        providerId: id,
        patientId: data.patientId,
        type: data.type,
        subject: data.subject,
        body: data.body,
        createdById: session.user.id,
      },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'ReferralLetter',
      entityId: letter.id,
      details: {
        provider: `${provider.practiceName} - Dr. ${provider.firstName} ${provider.lastName}`,
        type: letter.type,
        subject: letter.subject,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: letter }, { status: 201 });
  },
  { permissions: ['leads:edit', 'leads:full'] }
);
