'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Link2,
  ArrowLeft,
  Copy,
  Send,
  XCircle,
  ExternalLink,
  Clock,
  CheckCircle,
  Eye,
  Calendar,
  User,
  CreditCard,
  Mail,
  MessageSquare,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

import { PageHeader, PageContent, DashboardGrid, StatsRow } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { PhiProtected } from '@/components/ui/phi-protected';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getFakeName, getFakeEmail, getFakePhone } from '@/lib/fake-data';

interface PaymentLink {
  id: string;
  code: string;
  linkUrl: string;
  paymentUrl: string;
  amount: number;
  description?: string;
  allowPartial: boolean;
  minimumAmount?: number;
  status: string;
  expiresAt?: string;
  viewedAt?: string;
  paidAt?: string;
  sentVia?: string;
  sentAt?: string;
  sentTo?: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  account: {
    id: string;
    accountNumber: string;
    currentBalance: number;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    subtotal: number;
    balance: number;
    status: string;
  };
  payment?: {
    id: string;
    paymentNumber: string;
    amount: number;
    status: string;
    paymentDate: string;
  };
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

const linkStatusVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
  PENDING: 'secondary',
  ACTIVE: 'info',
  SENT: 'info',
  VIEWED: 'warning',
  COMPLETED: 'success',
  EXPIRED: 'secondary',
  CANCELLED: 'destructive',
};

const linkStatusLabels: Record<string, string> = {
  PENDING: 'Pending',
  ACTIVE: 'Active',
  SENT: 'Sent',
  VIEWED: 'Viewed',
  COMPLETED: 'Completed',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
};

export default function PaymentLinkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const linkId = params.linkId as string;

  const [link, setLink] = useState<PaymentLink | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [sendMethod, setSendMethod] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchLink = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/payment-links/${linkId}`);
      const data = await response.json();

      if (data.success) {
        setLink(data.data);
      } else {
        toast({
          title: 'Error',
          description: data.error?.message || 'Failed to load payment link',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to fetch payment link:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment link',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [linkId, toast]);

  useEffect(() => {
    if (linkId) {
      fetchLink();
    }
  }, [linkId, fetchLink]);

  const handleCopyLink = async () => {
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link.paymentUrl);
      toast({
        title: 'Link copied',
        description: 'Payment link copied to clipboard',
      });
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy link to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleSendLink = async () => {
    if (!link) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/payment-links/${linkId}?action=send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: sendMethod }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Link sent',
          description: `Payment link sent via ${sendMethod.toLowerCase()}`,
        });
        setShowSendDialog(false);
        fetchLink();
      } else {
        toast({
          title: 'Failed to send',
          description: data.error?.message || 'Could not send payment link',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to send payment link',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendLink = async () => {
    if (!link) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/payment-links/${linkId}?action=resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: link.sentVia || 'EMAIL' }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Link resent',
          description: `Payment link resent`,
        });
        fetchLink();
      } else {
        toast({
          title: 'Failed to resend',
          description: data.error?.message || 'Could not resend payment link',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to resend payment link',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelLink = async () => {
    if (!link) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/payment-links/${linkId}?action=cancel`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Link cancelled',
          description: 'Payment link has been cancelled',
        });
        setShowCancelDialog(false);
        fetchLink();
      } else {
        toast({
          title: 'Failed to cancel',
          description: data.error?.message || 'Could not cancel payment link',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to cancel payment link',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isExpired = link?.expiresAt && new Date(link.expiresAt) < new Date();
  const canSend = link?.status === 'PENDING' || link?.status === 'ACTIVE';
  const canResend = (link?.status === 'SENT' || link?.status === 'VIEWED') && !isExpired;
  const canCancel = !['COMPLETED', 'CANCELLED'].includes(link?.status || '');

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Payment Link"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Billing', href: '/billing' },
            { label: 'Payment Links', href: '/billing/payment-links' },
            { label: 'Details' },
          ]}
        />
        <PageContent density="comfortable">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </PageContent>
      </>
    );
  }

  if (!link) {
    return (
      <>
        <PageHeader
          title="Payment Link"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Billing', href: '/billing' },
            { label: 'Payment Links', href: '/billing/payment-links' },
            { label: 'Not Found' },
          ]}
        />
        <PageContent density="comfortable">
          <Card>
            <CardContent className="py-12 text-center">
              <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Payment Link Not Found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The payment link you're looking for doesn't exist or has been deleted.
              </p>
              <Link href="/billing/payment-links">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Payment Links
                </Button>
              </Link>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Payment Link: ${link.code}`}
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Billing', href: '/billing' },
          { label: 'Payment Links', href: '/billing/payment-links' },
          { label: link.code },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCopyLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            {canSend && (
              <Button onClick={() => setShowSendDialog(true)}>
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            )}
            {canResend && (
              <Button variant="outline" onClick={handleResendLink} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Resend
              </Button>
            )}
            {canCancel && (
              <Button variant="destructive" onClick={() => setShowCancelDialog(true)}>
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        }
      />

      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Status Banner */}
          {isExpired && link.status !== 'COMPLETED' && (
            <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 [&>svg]:text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This payment link has expired. You can resend it to extend the expiration.
              </AlertDescription>
            </Alert>
          )}

          {link.status === 'COMPLETED' && link.payment && (
            <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200 [&>svg]:text-green-600">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Payment completed on {formatDate(link.paidAt || link.payment.paymentDate)}.{' '}
                <Link href={`/billing/payments/${link.payment.id}`} className="underline">
                  View Payment
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {/* Stats */}
          <StatsRow>
            <StatCard accentColor="primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(link.amount)}</p>
                  {link.allowPartial && (
                    <p className="text-xs text-muted-foreground">
                      Min: {formatCurrency(link.minimumAmount || 0)}
                    </p>
                  )}
                </div>
                <CreditCard className="h-8 w-8 text-primary-500" />
              </div>
            </StatCard>

            <StatCard
              accentColor={
                link.status === 'COMPLETED'
                  ? 'success'
                  : isExpired
                    ? 'secondary'
                    : link.status === 'VIEWED'
                      ? 'warning'
                      : 'primary'
              }
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      isExpired && link.status !== 'COMPLETED'
                        ? 'secondary'
                        : linkStatusVariant[link.status] || 'default'
                    }
                    className="mt-1"
                  >
                    {isExpired && link.status !== 'COMPLETED'
                      ? 'Expired'
                      : linkStatusLabels[link.status] || link.status}
                  </Badge>
                  {link.viewedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Viewed {formatDate(link.viewedAt)}
                    </p>
                  )}
                </div>
                {link.status === 'COMPLETED' ? (
                  <CheckCircle className="h-8 w-8 text-success-500" />
                ) : link.status === 'VIEWED' ? (
                  <Eye className="h-8 w-8 text-warning-500" />
                ) : (
                  <Clock className="h-8 w-8 text-primary-500" />
                )}
              </div>
            </StatCard>

            <StatCard accentColor={link.expiresAt ? (isExpired ? 'error' : 'warning') : 'secondary'}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Expires</p>
                  <p className="text-lg font-medium">
                    {link.expiresAt ? formatDate(link.expiresAt) : 'Never'}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-warning-500" />
              </div>
            </StatCard>
          </StatsRow>

          <DashboardGrid>
            <DashboardGrid.TwoThirds>
              <div className="space-y-6">
                {/* Link Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Link2 className="h-5 w-5" />
                      Link Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Payment URL</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 text-sm bg-muted px-2 py-1 rounded truncate">
                          {link.paymentUrl}
                        </code>
                        <Button variant="ghost" size="sm" onClick={handleCopyLink}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <a href={link.paymentUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Link Code</p>
                        <p className="font-mono">{link.code}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Partial Payments</p>
                        <p>{link.allowPartial ? 'Allowed' : 'Not Allowed'}</p>
                      </div>
                    </div>

                    {link.description && (
                      <div>
                        <p className="text-sm text-muted-foreground">Description</p>
                        <p>{link.description}</p>
                      </div>
                    )}

                    {link.invoice && (
                      <div>
                        <p className="text-sm text-muted-foreground">Invoice</p>
                        <Link
                          href={`/billing/invoices/${link.invoice.id}`}
                          className="text-primary hover:underline"
                        >
                          {link.invoice.invoiceNumber}
                        </Link>
                        <span className="text-sm text-muted-foreground ml-2">
                          (Balance: {formatCurrency(link.invoice.balance)})
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Delivery Status */}
                {link.sentAt && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        Delivery
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Sent Via</p>
                          <div className="flex items-center gap-2 mt-1">
                            {link.sentVia === 'EMAIL' ? (
                              <Mail className="h-4 w-4" />
                            ) : (
                              <MessageSquare className="h-4 w-4" />
                            )}
                            <span>{link.sentVia}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Sent At</p>
                          <p>{formatDate(link.sentAt)}</p>
                        </div>
                        {link.sentTo && (
                          <div>
                            <p className="text-sm text-muted-foreground">Sent To</p>
                            <PhiProtected fakeData={getFakeEmail()}>
                              <p>{link.sentTo}</p>
                            </PhiProtected>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Payment Info (if completed) */}
                {link.payment && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-success-500" />
                        Payment Received
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Payment Number</p>
                          <Link
                            href={`/billing/payments/${link.payment.id}`}
                            className="text-primary hover:underline"
                          >
                            {link.payment.paymentNumber}
                          </Link>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Amount</p>
                          <p className="font-medium">{formatCurrency(link.payment.amount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Date</p>
                          <p>{formatDate(link.payment.paymentDate)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </DashboardGrid.TwoThirds>

            <DashboardGrid.OneThird>
              {/* Patient Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Patient
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <PhiProtected fakeData={getFakeName()}>
                      <Link
                        href={`/patients/${link.patient.id}`}
                        className="text-primary hover:underline"
                      >
                        {link.patient.firstName} {link.patient.lastName}
                      </Link>
                    </PhiProtected>
                  </div>
                  {link.patient.email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <PhiProtected fakeData={getFakeEmail()}>
                        <p>{link.patient.email}</p>
                      </PhiProtected>
                    </div>
                  )}
                  {link.patient.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <PhiProtected fakeData={getFakePhone()}>
                        <p>{link.patient.phone}</p>
                      </PhiProtected>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Account</p>
                    <Link
                      href={`/billing/accounts/${link.account.id}`}
                      className="text-primary hover:underline"
                    >
                      {link.account.accountNumber}
                    </Link>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account Balance</p>
                    <p className="font-medium">{formatCurrency(link.account.currentBalance)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Audit Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p>{formatDate(link.createdAt)}</p>
                    {link.createdByUser && (
                      <p className="text-xs text-muted-foreground">
                        by {link.createdByUser.firstName} {link.createdByUser.lastName}
                      </p>
                    )}
                  </div>
                  {link.sentAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Sent</p>
                      <p>{formatDate(link.sentAt)}</p>
                    </div>
                  )}
                  {link.viewedAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">First Viewed</p>
                      <p>{formatDate(link.viewedAt)}</p>
                    </div>
                  )}
                  {link.paidAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Paid</p>
                      <p>{formatDate(link.paidAt)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </DashboardGrid.OneThird>
          </DashboardGrid>
        </div>
      </PageContent>

      {/* Send Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Payment Link</DialogTitle>
            <DialogDescription>
              Choose how to send the payment link to{' '}
              <PhiProtected fakeData={getFakeName()}>
                {link.patient.firstName} {link.patient.lastName}
              </PhiProtected>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={sendMethod === 'EMAIL' ? 'default' : 'outline'}
                onClick={() => setSendMethod('EMAIL')}
                className="h-20 flex-col"
              >
                <Mail className="h-6 w-6 mb-2" />
                Email
                {link.patient.email && (
                  <span className="text-xs text-muted-foreground mt-1 truncate max-w-full">
                    <PhiProtected fakeData={getFakeEmail()}>{link.patient.email}</PhiProtected>
                  </span>
                )}
              </Button>
              <Button
                variant={sendMethod === 'SMS' ? 'default' : 'outline'}
                onClick={() => setSendMethod('SMS')}
                className="h-20 flex-col"
                disabled={!link.patient.phone}
              >
                <MessageSquare className="h-6 w-6 mb-2" />
                SMS
                {link.patient.phone && (
                  <span className="text-xs text-muted-foreground mt-1">
                    <PhiProtected fakeData={getFakePhone()}>{link.patient.phone}</PhiProtected>
                  </span>
                )}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendLink} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Payment Link</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this payment link? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Link
            </Button>
            <Button variant="destructive" onClick={handleCancelLink} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Link
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
