/**
 * Portal Session Helper
 *
 * Utility functions for validating portal sessions in API routes.
 */

import { cookies } from 'next/headers';
import { db } from '@/lib/db';

export interface PortalSession {
  accountId: string;
  patientId: string;
  clinicId: string;
  patientName: string;
  email: string;
}

/**
 * Get the current portal session from cookies
 * Returns null if no valid session exists
 */
export async function getPortalSession(): Promise<PortalSession | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('portal_session')?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await db.portalSession.findFirst({
    where: {
      sessionToken,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
    include: {
      account: {
        include: {
          patient: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
    },
  });

  if (!session?.account || session.account.deletedAt || session.account.status !== 'ACTIVE') {
    return null;
  }

  // Update last activity
  await db.portalSession.update({
    where: { id: session.id },
    data: { lastActivityAt: new Date() },
  });

  return {
    accountId: session.account.id,
    patientId: session.account.patientId,
    clinicId: session.account.clinicId,
    patientName: `${session.account.patient.firstName} ${session.account.patient.lastName}`,
    email: session.account.email,
  };
}

/**
 * Require a valid portal session - returns session or throws
 */
export async function requirePortalSession(): Promise<PortalSession> {
  const session = await getPortalSession();
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}
