import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/\d/, 'Password must contain a number'),
});

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('portal_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        },
        { status: 401 }
      );
    }

    // Validate session
    const session = await db.portalSession.findFirst({
      where: {
        sessionToken,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      include: {
        account: true,
      },
    });

    if (!session?.account) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Invalid session' },
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = changePasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.issues[0]?.message || 'Invalid input',
          },
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validation.data;

    // Verify current password
    if (!session.account.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_PASSWORD',
            message: 'No password is set for this account',
          },
        },
        { status: 400 }
      );
    }

    const isValidPassword = await bcrypt.compare(
      currentPassword,
      session.account.passwordHash
    );

    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PASSWORD',
            message: 'Current password is incorrect',
          },
        },
        { status: 400 }
      );
    }

    // Hash new password and update
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await db.portalAccount.update({
      where: { id: session.account.id },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    // Log activity
    await db.portalActivityLog.create({
      data: {
        accountId: session.account.id,
        activityType: 'PASSWORD_CHANGE',
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
        metadata: {},
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Password changed successfully' },
    });
  } catch (error) {
    console.error('[Portal Change Password] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An error occurred' },
      },
      { status: 500 }
    );
  }
}
