import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  pauseAccountCollectionSchema,
  resumeAccountCollectionSchema,
  advanceStageSchema,
  addActivitySchema,
} from '@/lib/validations/collections';
import {
  logCollectionActivity,
  advanceToNextStage,
} from '@/lib/billing/collections-utils';

interface RouteParams {
  params: Promise<{ accountCollectionId: string }>;
}

/**
 * GET /api/collections/accounts/:accountCollectionId
 * Get collection account details
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { accountCollectionId } = await params;

    const accountCollection = await db.accountCollection.findFirst({
      where: {
        id: accountCollectionId,
        clinicId: session.user.clinicId,
      },
      include: {
        account: {
          select: {
            id: true,
            accountNumber: true,
            currentBalance: true,
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        workflow: {
          include: {
            stages: {
              orderBy: { stageNumber: 'asc' },
            },
          },
        },
        activities: {
          orderBy: { occurredAt: 'desc' },
          take: 50,
        },
        promises: {
          orderBy: { promisedDate: 'desc' },
        },
      },
    });

    if (!accountCollection) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account collection not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: accountCollection,
    });
  },
  { permissions: ['collections:read'] }
);

/**
 * POST /api/collections/accounts/:accountCollectionId
 * Actions: pause, resume, advance, activity
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { accountCollectionId } = await params;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const body = await req.json();

    // Verify account collection exists
    const accountCollection = await db.accountCollection.findFirst({
      where: {
        id: accountCollectionId,
        clinicId: session.user.clinicId,
      },
    });

    if (!accountCollection) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account collection not found',
          },
        },
        { status: 404 }
      );
    }

    const { ipAddress, userAgent } = getRequestMeta(req);

    switch (action) {
      case 'pause': {
        if (accountCollection.status !== 'ACTIVE') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Only active accounts can be paused',
              },
            },
            { status: 400 }
          );
        }

        const pauseResult = pauseAccountCollectionSchema.safeParse(body);
        if (!pauseResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid pause data',
                details: pauseResult.error.flatten(),
              },
            },
            { status: 400 }
          );
        }

        const updated = await db.accountCollection.update({
          where: { id: accountCollectionId },
          data: {
            status: 'PAUSED',
            pausedAt: new Date(),
            pauseReason: pauseResult.data.reason,
            lastActionAt: new Date(),
          },
        });

        await logCollectionActivity(
          accountCollectionId,
          'PAUSED',
          `Collection paused: ${pauseResult.data.reason}`,
          session.user.id
        );

        await logAudit(session, {
          action: 'UPDATE',
          entity: 'AccountCollection',
          entityId: accountCollectionId,
          details: { action: 'pause', reason: pauseResult.data.reason },
          ipAddress,
          userAgent,
        });

        return NextResponse.json({ success: true, data: updated });
      }

      case 'resume': {
        if (accountCollection.status !== 'PAUSED') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Only paused accounts can be resumed',
              },
            },
            { status: 400 }
          );
        }

        const resumeResult = resumeAccountCollectionSchema.safeParse(body);
        if (!resumeResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid resume data',
                details: resumeResult.error.flatten(),
              },
            },
            { status: 400 }
          );
        }

        const updated = await db.accountCollection.update({
          where: { id: accountCollectionId },
          data: {
            status: 'ACTIVE',
            pausedAt: null,
            pauseReason: null,
            lastActionAt: new Date(),
          },
        });

        await logCollectionActivity(
          accountCollectionId,
          'RESUMED',
          resumeResult.data.notes || 'Collection resumed',
          session.user.id
        );

        await logAudit(session, {
          action: 'UPDATE',
          entity: 'AccountCollection',
          entityId: accountCollectionId,
          details: { action: 'resume' },
          ipAddress,
          userAgent,
        });

        return NextResponse.json({ success: true, data: updated });
      }

      case 'advance': {
        if (accountCollection.status !== 'ACTIVE') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Only active accounts can be advanced',
              },
            },
            { status: 400 }
          );
        }

        const advanceResult = advanceStageSchema.safeParse(body);
        if (!advanceResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid advance data',
                details: advanceResult.error.flatten(),
              },
            },
            { status: 400 }
          );
        }

        const result = await advanceToNextStage(
          accountCollectionId,
          session.user.id,
          advanceResult.data.notes ?? undefined
        );

        if (!result.success) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'ADVANCE_FAILED',
                message: result.error,
              },
            },
            { status: 400 }
          );
        }

        await logAudit(session, {
          action: 'UPDATE',
          entity: 'AccountCollection',
          entityId: accountCollectionId,
          details: { action: 'advance', newStage: result.newStage },
          ipAddress,
          userAgent,
        });

        const updated = await db.accountCollection.findUnique({
          where: { id: accountCollectionId },
        });

        return NextResponse.json({ success: true, data: updated });
      }

      case 'activity': {
        const activityResult = addActivitySchema.safeParse(body);
        if (!activityResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid activity data',
                details: activityResult.error.flatten(),
              },
            },
            { status: 400 }
          );
        }

        const data = activityResult.data;

        await logCollectionActivity(
          accountCollectionId,
          data.activityType,
          data.description,
          session.user.id,
          {
            channel: data.channel || undefined,
            templateUsed: data.templateUsed || undefined,
            sentTo: data.sentTo || undefined,
            result: data.result || undefined,
            responseReceived: data.responseReceived,
            paymentReceived: data.paymentReceived || undefined,
          }
        );

        // Update last action timestamp
        await db.accountCollection.update({
          where: { id: accountCollectionId },
          data: { lastActionAt: new Date() },
        });

        return NextResponse.json({
          success: true,
          data: { added: true },
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ACTION',
              message: 'Invalid action. Valid actions: pause, resume, advance, activity',
            },
          },
          { status: 400 }
        );
    }
  },
  { permissions: ['collections:manage'] }
);
