'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageSquare, Mail, ChevronDown, Check, CheckCheck, AlertCircle, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName, getFakeEmail, getFakePhone } from '@/lib/fake-data';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

interface MessageDelivery {
  id: string;
  provider: string;
  status: string;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  failedAt: string | null;
  statusDetails: string | null;
}

interface Message {
  id: string;
  channel: 'SMS' | 'EMAIL' | 'PUSH' | 'IN_APP';
  body: string;
  htmlBody?: string | null;
  direction: 'INBOUND' | 'OUTBOUND';
  status: string;
  createdAt: string;
  readAt: string | null;
  template?: {
    id: string;
    name: string;
  } | null;
  deliveries?: MessageDelivery[];
}

interface ConversationData {
  patient: Patient;
  messages: Message[];
  preferences: {
    smsEnabled: boolean;
    emailEnabled: boolean;
  } | null;
  hasMore: boolean;
}

interface ConversationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
}

export function ConversationSheet({ open, onOpenChange, patient }: ConversationSheetProps) {
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversation
  const fetchConversation = useCallback(async () => {
    if (!patient) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/communications/messages/patient/${patient.id}`);
      const result = await response.json();

      if (result.success) {
        setConversation(result.data);
        // Mark all as read
        await fetch(`/api/communications/messages/patient/${patient.id}/read-all`, {
          method: 'POST',
        });
      } else {
        toast.error('Failed to load conversation');
      }
    } catch {
      toast.error('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }, [patient]);

  // Load conversation when patient changes
  useEffect(() => {
    if (open && patient) {
      fetchConversation();
    }
  }, [open, patient, fetchConversation]);

  // Scroll to bottom when messages load
  useEffect(() => {
    if (conversation?.messages.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation?.messages.length]);

  // Reset state when closed
  useEffect(() => {
    if (!open) {
      setConversation(null);
      setReplyBody('');
    }
  }, [open]);

  // Send reply
  const handleSendReply = async () => {
    if (!patient || !replyBody.trim()) return;

    setSending(true);
    try {
      const response = await fetch(`/api/communications/messages/patient/${patient.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyBody.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        setReplyBody('');
        fetchConversation(); // Refresh messages
        toast.success('Message sent');
      } else {
        toast.error(result.error?.message || 'Failed to send message');
      }
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key to send
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  // Get channel icon
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'SMS':
        return <MessageSquare className="h-3 w-3" />;
      case 'EMAIL':
        return <Mail className="h-3 w-3" />;
      default:
        return <MessageSquare className="h-3 w-3" />;
    }
  };

  // Get delivery status icon and color
  const getDeliveryStatusDisplay = (message: Message) => {
    const delivery = message.deliveries?.[0];
    const status = delivery?.status || message.status;

    switch (status) {
      case 'DELIVERED':
        return {
          icon: <CheckCheck className="h-3 w-3" />,
          color: 'text-green-500',
          label: 'Delivered',
        };
      case 'SENT':
        return {
          icon: <Check className="h-3 w-3" />,
          color: 'text-blue-500',
          label: 'Sent',
        };
      case 'OPENED':
        return {
          icon: <CheckCheck className="h-3 w-3" />,
          color: 'text-green-600',
          label: 'Opened',
        };
      case 'FAILED':
      case 'BOUNCED':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          color: 'text-red-500',
          label: delivery?.statusDetails || status.toLowerCase(),
        };
      case 'PENDING':
      case 'SCHEDULED':
        return {
          icon: <Clock className="h-3 w-3" />,
          color: 'text-amber-500',
          label: status.toLowerCase(),
        };
      default:
        return {
          icon: <Clock className="h-3 w-3" />,
          color: 'text-muted-foreground',
          label: status.toLowerCase(),
        };
    }
  };

  if (!patient) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg flex flex-col">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary-100 text-primary-700">
                {patient.firstName[0]}
                {patient.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="text-left">
                <PhiProtected fakeData={getFakeName()}>
                  {patient.firstName} {patient.lastName}
                </PhiProtected>
              </SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                {patient.phone && (
                  <span className="text-xs text-muted-foreground">
                    <PhiProtected fakeData={getFakePhone()}>{patient.phone}</PhiProtected>
                  </span>
                )}
                {patient.email && (
                  <span className="text-xs text-muted-foreground">
                    <PhiProtected fakeData={getFakeEmail()}>{patient.email}</PhiProtected>
                  </span>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              Loading messages...
            </div>
          ) : conversation?.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mb-2" />
              <p>No messages yet</p>
              <p className="text-xs">Start a conversation below</p>
            </div>
          ) : (
            <>
              {conversation?.hasMore && (
                <button className="w-full flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <ChevronDown className="h-3 w-3" />
                  Load older messages
                </button>
              )}
              {conversation?.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex',
                    message.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg px-4 py-2',
                      message.direction === 'OUTBOUND'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                    <div
                      className={cn(
                        'flex items-center gap-2 mt-1 text-[10px]',
                        message.direction === 'OUTBOUND'
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      )}
                    >
                      <span>{format(new Date(message.createdAt), 'MMM d, h:mm a')}</span>
                      <span className="flex items-center gap-0.5">
                        {getChannelIcon(message.channel)}
                        {message.channel}
                      </span>
                      {message.direction === 'OUTBOUND' && (() => {
                        const statusDisplay = getDeliveryStatusDisplay(message);
                        return (
                          <span
                            className={cn('flex items-center gap-0.5', statusDisplay.color)}
                            title={statusDisplay.label}
                          >
                            {statusDisplay.icon}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Reply Input */}
        <div className="border-t pt-4">
          {conversation?.preferences && (
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              <span>Preferred channels:</span>
              {conversation.preferences.smsEnabled && (
                <Badge variant="outline" size="sm">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  SMS
                </Badge>
              )}
              {conversation.preferences.emailEnabled && (
                <Badge variant="outline" size="sm">
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </Badge>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={2}
              className="resize-none"
              disabled={sending}
            />
            <Button
              onClick={handleSendReply}
              disabled={!replyBody.trim() || sending}
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
