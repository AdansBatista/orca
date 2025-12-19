import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  approveWriteOffSchema,
  rejectWriteOffSchema,
  recoverWriteOffSchema,
} from '@/lib/validations/collections';

interface RouteParams {
  params: Promise<{ writeOffId: string }>;
}

/**
 * GET /api/collections/write-offs/:writeOffId
 * Get write-off details
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { writeOffId } = await params;

    const writeOff = await db.writeOff.findFirst({
      where: {
        id: writeOffId,
        clinicId: session.user.clinicId,
      },
    });

    if (!writeOff) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'WRITE_OFF_NOT_FOUND',
            message: 'Write-off not found',
          },
        },
        { status: 404 }
      );
    }

    // Get account details
    const account = await db.patientAccount.findUnique({
      where: { id: writeOff.accountId },
      select: {
        id: true,
        accountNumber: true,
        currentBalance: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Get invoice if specified
    let invoice = null;
    if (writeOff.invoiceId) {
      invoice = await db.invoice.findUnique({
        where: { id: writeOff.invoiceId },
        select: {
          id: true,
          invoiceNumber: true,
          balance: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...writeOff,
        account,
        invoice,
      },
    });
  },
  { permissions: ['collections:read'] }
);

/**
 * POST /api/collections/write-offs/:writeOffId
 * Actions: approve, reject, recover
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { writeOffId } = await params;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const body = await req.json();

    // Verify write-off exists
    const writeOff = await db.writeOff.findFirst({
      where: {
        id: writeOffId,
        clinicId: session.user.clinicId,
      },
    });

    if (!writeOff) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'WRITE_OFF_NOT_FOUND',
            message: 'Write-off not found',
          },
        },
        { status: 404 }
      );
    }

    const { ipAddress, userAgent } = getRequestMeta(req);

    switch (action) {
      case 'approve': {
        if (writeOff.status !== 'PENDING') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Only pending write-offs can be approved',
              },
            },
            { status: 400 }
          );
        }

        const approveResult = approveWriteOffSchema.safeParse(body);
        if (!approveResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid approve data',
                details: approveResult.error.flatten(),
              },
            },
            { status: 400 }
          );
        }

        // Update write-off
        const updated = await db.writeOff.update({
          where: { id: writeOffId },
          data: {
            status: 'APPROVED',
            approvedBy: session.user.id,
            approvedAt: new Date(),
          },
        });

        // Update account balance
        await db.patientAccount.update({
          where: { id: writeOff.accountId },
          data: {
            currentBalance: { decrement: writeOff.amount },
          },
        });

        // If there's an account collection, mark as written off
        const accountCollection = await db.accountCollection.findFirst({
          where: {
            accountId: writeOff.accountId,
            clinicId: session.user.clinicId,
            status: { in: ['ACTIVE', 'PAUSED'] },
          },
        });

        if (accountCollection) {
          await db.accountCollection.update({
            where: { id: accountCollection.id },
            data: {
              status: 'WRITTEN_OFF',
              writtenOffAt: new Date(),
              writeOffAmount: writeOff.amount,
              writeOffReason: writeOff.reason,
            },
          });
        }

        await logAudit(session, {
          action: 'UPDATE',
          entity: 'WriteOff',
          entityId: writeOffId,
          details: { action: 'approve', amount: writeOff.amount },
          ipAddress,
          userAgent,
        });

        return NextResponse.json({ success: true, data: updated });
      }

      case 'reject': {
        if (writeOff.status !== 'PENDING') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Only pending write-offs can be rejected',
              },
            },
            { status: 400 }
          );
        }

        const rejectResult = rejectWriteOffSchema.safeParse(body);
        if (!rejectResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid reject data',
                details: rejectResult.error.flatten(),
              },
            },
            { status: 400 }
          );
        }

        const updated = await db.writeOff.update({
          where: { id: writeOffId },
          data: {
            status: 'REJECTED',
            rejectedBy: session.user.id,
            rejectedAt: new Date(),
            rejectionReason: rejectResult.data.reason,
          },
        });

        await logAudit(session, {
          action: 'UPDATE',
          entity: 'WriteOff',
          entityId: writeOffId,
          details: { action: 'reject', reason: rejectResult.data.reason },
          ipAddress,
          userAgent,
        });

        return NextResponse.json({ success: true, data: updated });
      }

      case 'recover': {
        if (!['APPROVED', 'PARTIALLY_RECOVERED'].includes(writeOff.status)) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Only approved write-offs can have recoveries',
              },
            },
            { status: 400 }
          );
        }

        const recoverResult = recoverWriteOffSchema.safeParse(body);
        if (!recoverResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid recovery data',
                details: recoverResult.error.flatten(),
              },
            },
            { status: 400 }
          );
        }

        const data = recoverResult.data;
        const newRecoveredAmount = writeOff.recoveredAmount + data.amount;
        const isFullyRecovered = newRecoveredAmount >= writeOff.amount;

        const updated = await db.writeOff.update({
          where: { id: writeOffId },
          data: {
            status: isFullyRecovered ? 'FULLY_RECOVERED' : 'PARTIALLY_RECOVERED',
            recoveredAmount: newRecoveredAmount,
            recoveredAt: new Date(),
          },
        });

        await logAudit(session, {
          action: 'UPDATE',
          entity: 'WriteOff',
          entityId: writeOffId,
          details: {
            action: 'recover',
            amount: data.amount,
            totalRecovered: newRecoveredAmount,
          },
          ipAddress,
          userAgent,
        });

        return NextResponse.json({ success: true, data: updated });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ACTION',
              message: 'Invalid action. Valid actions: approve, reject, recover',
            },
          },
          { status: 400 }
        );
    }
  },
  { permissions: ['collections:approve_write_off'] }
);
