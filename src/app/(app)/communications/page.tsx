'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Send,
  RefreshCw,
  Search,
  Settings,
  FileText,
  Users,
  Mail,
  Inbox,
  Check,
  CheckCheck,
  AlertCircle,
  Clock,
} from 'lucide-react';

import { PageHeader, PageContent, StatsRow } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, StatCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConversationSheet } from '@/components/communications/ConversationSheet';
import { ComposeMessageDialog } from '@/components/communications/ComposeMessageDialog';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Conversation {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
  lastMessage: {
    id: string;
    channel: 'SMS' | 'EMAIL' | 'PUSH' | 'IN_APP';
    body: string;
    direction: 'INBOUND' | 'OUTBOUND';
    status: string;
    createdAt: string;
    readAt: string | null;
  };
  unreadCount: number;
}

interface InboxData {
  items: Conversation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  totalUnread: number;
}

type ChannelFilter = 'all' | 'SMS' | 'EMAIL';

export default function CommunicationsPage() {
  const [inbox, setInbox] = useState<InboxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showComposeDialog, setShowComposeDialog] = useState(false);

  // Fetch inbox
  const fetchInbox = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (channelFilter !== 'all') {
        params.set('channel', channelFilter);
      }
      if (showUnreadOnly) {
        params.set('unreadOnly', 'true');
      }

      const response = await fetch(`/api/communications/inbox?${params}`);
      const result = await response.json();

      if (result.success) {
        setInbox(result.data);
      } else {
        toast.error('Failed to load inbox');
      }
    } catch {
      toast.error('Failed to load inbox');
    } finally {
      setLoading(false);
    }
  }, [channelFilter, showUnreadOnly]);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  // Filter conversations by search query (client-side)
  const filteredConversations = inbox?.items.filter((conv) => {
    if (!searchQuery) return true;
    const name = `${conv.patient.firstName} ${conv.patient.lastName}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  }) || [];

  // Handle conversation click
  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  // Handle conversation close and refresh
  const handleConversationClose = () => {
    setSelectedConversation(null);
    fetchInbox(); // Refresh to update read status
  };

  // Get channel icon
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'SMS':
        return <MessageSquare className="h-4 w-4" />;
      case 'EMAIL':
        return <Mail className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  // Get delivery status icon and styling
  const getDeliveryStatus = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return {
          icon: <CheckCheck className="h-3.5 w-3.5" />,
          color: 'text-green-500',
          label: 'Delivered',
        };
      case 'SENT':
        return {
          icon: <Check className="h-3.5 w-3.5" />,
          color: 'text-blue-500',
          label: 'Sent',
        };
      case 'FAILED':
      case 'BOUNCED':
        return {
          icon: <AlertCircle className="h-3.5 w-3.5" />,
          color: 'text-red-500',
          label: status === 'BOUNCED' ? 'Bounced' : 'Failed',
        };
      case 'PENDING':
      case 'SCHEDULED':
        return {
          icon: <Clock className="h-3.5 w-3.5" />,
          color: 'text-amber-500',
          label: status === 'SCHEDULED' ? 'Scheduled' : 'Pending',
        };
      default:
        return null;
    }
  };

  return (
    <>
      <PageHeader
        title="Communications"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Communications' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/communications/templates">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Templates
              </Button>
            </Link>
            <Link href="/communications/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Button size="sm" onClick={() => setShowComposeDialog(true)}>
              <Send className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </div>
        }
      />

      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Stats Overview */}
          <StatsRow>
            <StatCard accentColor="primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Conversations</p>
                  <p className="text-xl font-bold">{inbox?.total ?? 0}</p>
                </div>
                <Users className="h-8 w-8 text-primary-500/60" />
              </div>
            </StatCard>
            <StatCard accentColor={inbox?.totalUnread ? 'warning' : 'success'}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Unread Messages</p>
                  <p className="text-xl font-bold">{inbox?.totalUnread ?? 0}</p>
                </div>
                <Inbox className="h-8 w-8 text-warning-500/60" />
              </div>
            </StatCard>
            <StatCard accentColor="accent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">SMS Conversations</p>
                  <p className="text-xl font-bold">
                    {inbox?.items.filter((c) => c.lastMessage.channel === 'SMS').length ?? 0}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-accent-500/60" />
              </div>
            </StatCard>
            <StatCard accentColor="secondary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Email Conversations</p>
                  <p className="text-xl font-bold">
                    {inbox?.items.filter((c) => c.lastMessage.channel === 'EMAIL').length ?? 0}
                  </p>
                </div>
                <Mail className="h-8 w-8 text-secondary-500/60" />
              </div>
            </StatCard>
          </StatsRow>

          {/* Filters */}
          <Card variant="ghost">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Channel Filter */}
                <Select
                  value={channelFilter}
                  onValueChange={(v) => setChannelFilter(v as ChannelFilter)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Channels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                  </SelectContent>
                </Select>

                {/* Unread Toggle */}
                <Tabs
                  value={showUnreadOnly ? 'unread' : 'all'}
                  onValueChange={(v) => setShowUnreadOnly(v === 'unread')}
                >
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="unread">
                      Unread
                      {inbox?.totalUnread ? (
                        <Badge variant="warning" className="ml-2">
                          {inbox.totalUnread}
                        </Badge>
                      ) : null}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Refresh */}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={fetchInbox}
                  disabled={loading}
                  className="ml-auto"
                >
                  <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Conversations List */}
          <Card>
            <CardHeader>
              <CardTitle>Inbox</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading && !inbox ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredConversations.map((conversation) => (
                    <button
                      key={conversation.patient.id}
                      onClick={() => handleConversationClick(conversation)}
                      className={cn(
                        'w-full flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors text-left',
                        conversation.unreadCount > 0 && 'bg-primary-50/50 dark:bg-primary-900/10'
                      )}
                    >
                      {/* Avatar */}
                      <Avatar>
                        <AvatarFallback
                          className={cn(
                            'text-sm',
                            conversation.unreadCount > 0
                              ? 'bg-primary-100 text-primary-700'
                              : 'bg-muted'
                          )}
                        >
                          {conversation.patient.firstName[0]}
                          {conversation.patient.lastName[0]}
                        </AvatarFallback>
                      </Avatar>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <PhiProtected fakeData={getFakeName()}>
                            <span
                              className={cn(
                                'font-medium',
                                conversation.unreadCount > 0 && 'font-semibold'
                              )}
                            >
                              {conversation.patient.firstName} {conversation.patient.lastName}
                            </span>
                          </PhiProtected>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="default" size="sm">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p
                          className={cn(
                            'text-sm truncate mt-0.5',
                            conversation.unreadCount > 0
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          )}
                        >
                          {conversation.lastMessage.direction === 'OUTBOUND' && (
                            <span className="text-muted-foreground">You: </span>
                          )}
                          {conversation.lastMessage.body.length > 100
                            ? `${conversation.lastMessage.body.substring(0, 100)}...`
                            : conversation.lastMessage.body}
                        </p>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            {getChannelIcon(conversation.lastMessage.channel)}
                            <span className="text-xs">{conversation.lastMessage.channel}</span>
                          </div>
                          {conversation.lastMessage.direction === 'OUTBOUND' && (() => {
                            const deliveryStatus = getDeliveryStatus(conversation.lastMessage.status);
                            if (!deliveryStatus) return null;
                            return (
                              <div
                                className={cn('flex items-center gap-0.5', deliveryStatus.color)}
                                title={deliveryStatus.label}
                              >
                                {deliveryStatus.icon}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContent>

      {/* Conversation Sheet */}
      <ConversationSheet
        open={!!selectedConversation}
        onOpenChange={(open) => !open && handleConversationClose()}
        patient={selectedConversation?.patient ?? null}
      />

      {/* Compose Message Dialog */}
      <ComposeMessageDialog
        open={showComposeDialog}
        onOpenChange={setShowComposeDialog}
        onComplete={() => {
          fetchInbox();
          setShowComposeDialog(false);
        }}
      />
    </>
  );
}
