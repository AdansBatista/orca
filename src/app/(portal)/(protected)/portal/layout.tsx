import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { PortalShell } from '@/components/portal';

async function getPortalSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('portal_session')?.value;

  if (!sessionToken) {
    return null;
  }

  try {
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

    if (!session || !session.account || session.account.deletedAt || session.account.status !== 'ACTIVE') {
      return null;
    }

    return {
      accountId: session.account.id,
      patientId: session.account.patientId,
      clinicId: session.account.clinicId,
      patientName: `${session.account.patient.firstName} ${session.account.patient.lastName}`,
    };
  } catch (error) {
    console.error('[Portal Layout] Session validation error:', error);
    return null;
  }
}

async function getUnreadMessageCount(patientId: string, clinicId: string) {
  try {
    const count = await db.message.count({
      where: {
        patientId,
        clinicId,
        direction: 'INBOUND',
        readAt: null,
      },
    });
    return count;
  } catch {
    return 0;
  }
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getPortalSession();

  if (!session) {
    redirect('/portal/login');
  }

  const unreadCount = await getUnreadMessageCount(session.patientId, session.clinicId);

  return (
    <PortalShell patientName={session.patientName} unreadCount={unreadCount}>
      {children}
    </PortalShell>
  );
}
