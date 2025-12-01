import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * DEBUG: Check current session
 * Remove this file in production!
 */
export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({
      authenticated: false,
      message: 'No session found - please log in',
    });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      clinicId: session.user.clinicId,
      clinicIds: session.user.clinicIds,
    },
    expectedClinicId: '692dbe24f59f416a4fa8c9c9',
    clinicIdMatches: session.user.clinicId === '692dbe24f59f416a4fa8c9c9',
  });
}
