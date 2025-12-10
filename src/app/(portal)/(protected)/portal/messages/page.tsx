import { cookies } from 'next/headers';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Mail, Phone, Inbox } from 'lucide-react';
import { db } from '@/lib/db';
import { PortalSection, PortalCard, PortalListItem, PortalEmptyState } from '@/components/portal';
import { Badge } from '@/components/ui/badge';

async function getPortalSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('portal_session')?.value;

  if (!sessionToken) return null;

  const session = await db.portalSession.findFirst({
    where: {
      sessionToken,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
    include: {
      account: {
        include: {
          patient: { select: { id: true } },
          clinic: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!session?.account) return null;

  return {
    patientId: session.account.patientId,
    clinicId: session.account.clinicId,
    clinicName: session.account.clinic.name,
  };
}

async function getMessages(patientId: string, clinicId: string) {
  const messages = await db.message.findMany({
    where: {
      patientId,
      clinicId,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // Mark all inbound messages as read
  await db.message.updateMany({
    where: {
      patientId,
      clinicId,
      direction: 'INBOUND',
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  return messages;
}

function getChannelIcon(channel: string) {
  switch (channel) {
    case 'SMS':
      return <Phone className="h-4 w-4" />;
    case 'EMAIL':
      return <Mail className="h-4 w-4" />;
    default:
      return <MessageSquare className="h-4 w-4" />;
  }
}

function getChannelBadge(channel: string) {
  switch (channel) {
    case 'SMS':
      return <Badge variant="soft-primary" size="sm">SMS</Badge>;
    case 'EMAIL':
      return <Badge variant="info" size="sm">Email</Badge>;
    case 'IN_APP':
      return <Badge variant="outline" size="sm">In-App</Badge>;
    default:
      return <Badge variant="outline" size="sm">{channel}</Badge>;
  }
}

export const metadata = {
  title: 'Messages',
};

export default async function PortalMessagesPage() {
  const session = await getPortalSession();
  if (!session) return null;

  const messages = await getMessages(session.patientId, session.clinicId);

  // Group messages by date (today, yesterday, this week, older)
  const groupedMessages = {
    today: [] as typeof messages,
    yesterday: [] as typeof messages,
    thisWeek: [] as typeof messages,
    older: [] as typeof messages,
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  messages.forEach((msg) => {
    const msgDate = new Date(msg.createdAt);
    if (msgDate >= today) {
      groupedMessages.today.push(msg);
    } else if (msgDate >= yesterday) {
      groupedMessages.yesterday.push(msg);
    } else if (msgDate >= weekAgo) {
      groupedMessages.thisWeek.push(msg);
    } else {
      groupedMessages.older.push(msg);
    }
  });

  const hasMessages = messages.length > 0;

  return (
    <div className="py-6 space-y-6">
      <PortalSection>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground">
          Messages from {session.clinicName}
        </p>
      </PortalSection>

      {!hasMessages ? (
        <PortalSection>
          <PortalEmptyState
            icon={<Inbox className="h-10 w-10 text-muted-foreground" />}
            title="No messages yet"
            description="Messages from your clinic will appear here."
          />
        </PortalSection>
      ) : (
        <>
          {/* Today's Messages */}
          {groupedMessages.today.length > 0 && (
            <PortalSection title="Today">
              <PortalCard>
                <div className="divide-y divide-border">
                  {groupedMessages.today.map((msg) => (
                    <MessageItem key={msg.id} message={msg} clinicName={session.clinicName} />
                  ))}
                </div>
              </PortalCard>
            </PortalSection>
          )}

          {/* Yesterday's Messages */}
          {groupedMessages.yesterday.length > 0 && (
            <PortalSection title="Yesterday">
              <PortalCard>
                <div className="divide-y divide-border">
                  {groupedMessages.yesterday.map((msg) => (
                    <MessageItem key={msg.id} message={msg} clinicName={session.clinicName} />
                  ))}
                </div>
              </PortalCard>
            </PortalSection>
          )}

          {/* This Week's Messages */}
          {groupedMessages.thisWeek.length > 0 && (
            <PortalSection title="This Week">
              <PortalCard>
                <div className="divide-y divide-border">
                  {groupedMessages.thisWeek.map((msg) => (
                    <MessageItem key={msg.id} message={msg} clinicName={session.clinicName} />
                  ))}
                </div>
              </PortalCard>
            </PortalSection>
          )}

          {/* Older Messages */}
          {groupedMessages.older.length > 0 && (
            <PortalSection title="Older">
              <PortalCard>
                <div className="divide-y divide-border">
                  {groupedMessages.older.map((msg) => (
                    <MessageItem key={msg.id} message={msg} clinicName={session.clinicName} />
                  ))}
                </div>
              </PortalCard>
            </PortalSection>
          )}
        </>
      )}
    </div>
  );
}

function MessageItem({ message, clinicName }: {
  message: {
    id: string;
    channel: string;
    direction: string;
    subject: string | null;
    body: string;
    createdAt: Date;
    readAt: Date | null;
  };
  clinicName: string;
}) {
  const isOutbound = message.direction === 'OUTBOUND';
  const isUnread = message.direction === 'INBOUND' && !message.readAt;

  return (
    <PortalListItem
      showArrow={false}
      leading={
        <div className={`relative h-10 w-10 rounded-full flex items-center justify-center ${
          isOutbound ? 'bg-primary/10' : 'bg-muted'
        }`}>
          {getChannelIcon(message.channel)}
          {isUnread && (
            <span className="absolute top-0 right-0 h-3 w-3 bg-primary rounded-full" />
          )}
        </div>
      }
    >
      <div className="flex items-center gap-2 mb-0.5">
        <span className={`text-sm ${isUnread ? 'font-semibold' : 'font-medium'}`}>
          {isOutbound ? 'You' : clinicName}
        </span>
        {getChannelBadge(message.channel)}
      </div>
      {message.subject && (
        <p className={`text-sm ${isUnread ? 'font-medium' : ''}`}>
          {message.subject}
        </p>
      )}
      <p className="text-sm text-muted-foreground line-clamp-2">
        {message.body}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {formatDistanceToNow(message.createdAt, { addSuffix: true })}
      </p>
    </PortalListItem>
  );
}
