'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  RotateCcw,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  User,
  CreditCard,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

import { PageHeader, PageContent, DashboardGrid } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { PhiProtected } from '@/components/ui/phi-protected';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { getFakeName, getFakeEmail } from '@/lib/fake-data';

interface Refund {
  id: string;
  refundNumber: string;
  amount: number;
  refundType: string;
  reason?: string;
  notes?: string;
  status: string;
  gatewayRefundId?: string;
  requestedAt: string;
  approvedAt?: string;
  processedAt?: string;
  approvalNotes?: string;
  createdAt: string;
  payment: {
    id: string;
    paymentNumber: string;
    amount: number;
    paymentMethodType: string;
    cardBrand?: string;
    cardLast4?: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
      email?: string;
    };
    account: {
      id: string;
      accountNumber: string;
    };
  };
  requestedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  approvedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  processedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const refundStatusConfig: Record<string, { variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'; icon: typeof CheckCircle; label: string }> = {
  PENDING: { variant: 'warning', icon: Clock, label: 'Pending Approval' },
  APPROVED: { variant: 'info', icon: CheckCircle, label: 'Approved' },
  PROCESSING: { variant: 'info', icon: Loader2, label: 'Processing' },
  COMPLETED: { variant: 'success', icon: CheckCircle, label: 'Completed' },
  REJECTED: { variant: 'destructive', icon: XCircle, label: 'Rejected' },
  FAILED: { variant: 'destructive', icon: AlertTriangle, label: 'Failed' },
};

export default function RefundDetailPage({ params }: { params: Promise<{ refundId: string }> }) {
  const { refundId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [refund, setRefund] = useState<Refund | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    const fetchRefund = async () => {
      try {
        const response = await fetch(`/api/refunds/${refundId}`);
        const data = await response.json();

        if (data.success) {
          setRefund(data.data);
        } else {
          toast({
            title: 'Error',
            description: data.error?.message || 'Failed to load refund',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Failed to fetch refund:', error);
        toast({
          title: 'Error',
          description: 'Failed to load refund details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRefund();
  }, [refundId, toast]);

  const handleAction = async (action: 'approve' | 'reject' | 'process', body?: Record<string, unknown>) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/refunds/${refundId}?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
      });

      const data = await response.json();

      if (data.success) {
        setRefund(data.data);
        toast({
          title: 'Success',
          description: `Refund ${action}${action === 'process' ? 'ed' : 'd'} successfully`,
        });
        setShowRejectDialog(false);
        setRejectReason('');
      } else {
        toast({
          title: 'Error',
          description: data.error?.message || `Failed to ${action} refund`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${action} refund`,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Refund Details"
          compact
          breadcrumbs={[
            { label: 'Billing', href: '/billing' },
            { label: 'Refunds', href: '/billing/refunds' },
            { label: 'Details' },
          ]}
        />
        <PageContent density="comfortable">
          <div className="space-y-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-64" />
          </div>
        </PageContent>
      </>
    );
  }

  if (!refund) {
    return (
      <>
        <PageHeader
          title="Refund Not Found"
          compact
          breadcrumbs={[
            { label: 'Billing', href: '/billing' },
            { label: 'Refunds', href: '/billing/refunds' },
            { label: 'Not Found' },
          ]}
        />
        <PageContent density="comfortable">
          <Card>
            <CardContent className="py-12 text-center">
              <RotateCcw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Refund not found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The refund you're looking for doesn't exist or has been removed.
              </p>
              <Link href="/billing/refunds">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Refunds
                </Button>
              </Link>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  const statusConfig = refundStatusConfig[refund.status] || refundStatusConfig.PENDING;
  const StatusIcon = statusConfig.icon;
  const canApprove = refund.status === 'PENDING';
  const canProcess = refund.status === 'APPROVED';

  return (
    <>
      <PageHeader
        title={refund.refundNumber}
        compact
        breadcrumbs={[
          { label: 'Billing', href: '/billing' },
          { label: 'Refunds', href: '/billing/refunds' },
          { label: refund.refundNumber },
        ]}
        actions={
          <div className="flex gap-2">
            {canApprove && (
              <>
                <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" disabled={isProcessing}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reject Refund</DialogTitle>
                      <DialogDescription>
                        Please provide a reason for rejecting this refund request.
                      </DialogDescription>
                    </DialogHeader>
                    <Textarea
                      placeholder="Rejection reason..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                    />
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setShowRejectDialog(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleAction('reject', { reason: rejectReason })}
                        disabled={!rejectReason || isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Reject Refund
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button onClick={() => handleAction('approve')} disabled={isProcessing}>
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </Button>
              </>
            )}
            {canProcess && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={isProcessing}>
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4 mr-2" />
                    )}
                    Process Refund
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Process Refund</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will process the refund of {formatCurrency(refund.amount)} through the payment gateway.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleAction('process')}>
                      Process Refund
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        }
      />
      <PageContent density="comfortable">
        <DashboardGrid>
          <DashboardGrid.TwoThirds>
            {/* Refund Summary */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      refund.status === 'COMPLETED' ? 'bg-success-100' :
                      refund.status === 'REJECTED' || refund.status === 'FAILED' ? 'bg-destructive/10' :
                      refund.status === 'PENDING' ? 'bg-warning-100' :
                      'bg-muted'
                    }`}>
                      <StatusIcon className={`h-6 w-6 ${
                        refund.status === 'COMPLETED' ? 'text-success-600' :
                        refund.status === 'REJECTED' || refund.status === 'FAILED' ? 'text-destructive' :
                        refund.status === 'PENDING' ? 'text-warning-600' :
                        'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{formatCurrency(refund.amount)}</CardTitle>
                      <CardDescription>
                        {refund.refundType === 'FULL' ? 'Full refund' : 'Partial refund'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={statusConfig.variant} className="text-sm">
                    {statusConfig.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Requested</p>
                    <p className="font-medium">{formatDateTime(refund.requestedAt)}</p>
                  </div>
                  {refund.requestedByUser && (
                    <div>
                      <p className="text-sm text-muted-foreground">Requested By</p>
                      <p className="font-medium">
                        {refund.requestedByUser.firstName} {refund.requestedByUser.lastName}
                      </p>
                    </div>
                  )}
                  {refund.approvedAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {refund.status === 'REJECTED' ? 'Rejected' : 'Approved'}
                      </p>
                      <p className="font-medium">{formatDateTime(refund.approvedAt)}</p>
                    </div>
                  )}
                  {refund.approvedByUser && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {refund.status === 'REJECTED' ? 'Rejected By' : 'Approved By'}
                      </p>
                      <p className="font-medium">
                        {refund.approvedByUser.firstName} {refund.approvedByUser.lastName}
                      </p>
                    </div>
                  )}
                  {refund.processedAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Processed</p>
                      <p className="font-medium">{formatDateTime(refund.processedAt)}</p>
                    </div>
                  )}
                  {refund.processedByUser && (
                    <div>
                      <p className="text-sm text-muted-foreground">Processed By</p>
                      <p className="font-medium">
                        {refund.processedByUser.firstName} {refund.processedByUser.lastName}
                      </p>
                    </div>
                  )}
                </div>

                {refund.reason && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Reason</p>
                      <p className="text-sm capitalize">{refund.reason.toLowerCase().replace('_', ' ')}</p>
                    </div>
                  </>
                )}

                {refund.notes && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm">{refund.notes}</p>
                    </div>
                  </>
                )}

                {refund.approvalNotes && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {refund.status === 'REJECTED' ? 'Rejection Reason' : 'Approval Notes'}
                      </p>
                      <p className="text-sm">{refund.approvalNotes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Original Payment */}
            <Card>
              <CardHeader compact>
                <CardTitle size="sm" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Original Payment
                </CardTitle>
              </CardHeader>
              <CardContent compact>
                <Link
                  href={`/billing/payments/${refund.payment.id}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium">{refund.payment.paymentNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {refund.payment.paymentMethodType.replace('_', ' ')}
                      {refund.payment.cardLast4 && ` •••• ${refund.payment.cardLast4}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(refund.payment.amount)}</p>
                    <p className="text-xs text-muted-foreground">Original amount</p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </DashboardGrid.TwoThirds>

          <DashboardGrid.OneThird>
            {/* Patient Info */}
            <Card>
              <CardHeader compact>
                <CardTitle size="sm" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Patient
                </CardTitle>
              </CardHeader>
              <CardContent compact>
                <PhiProtected fakeData={getFakeName()}>
                  <p className="font-medium">
                    {refund.payment.patient.firstName} {refund.payment.patient.lastName}
                  </p>
                </PhiProtected>
                {refund.payment.patient.email && (
                  <PhiProtected fakeData={getFakeEmail()}>
                    <p className="text-sm text-muted-foreground">{refund.payment.patient.email}</p>
                  </PhiProtected>
                )}
                <Separator className="my-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Account</p>
                  <Link href={`/billing/accounts/${refund.payment.account.id}`} className="text-primary hover:underline">
                    {refund.payment.account.accountNumber}
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Gateway Info */}
            {refund.gatewayRefundId && (
              <Card variant="ghost">
                <CardHeader compact>
                  <CardTitle size="sm">Gateway Reference</CardTitle>
                </CardHeader>
                <CardContent compact>
                  <p className="text-xs font-mono text-muted-foreground break-all">
                    {refund.gatewayRefundId}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card variant="ghost">
              <CardHeader compact>
                <CardTitle size="sm">Timeline</CardTitle>
              </CardHeader>
              <CardContent compact>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                    <div>
                      <p className="text-sm font-medium">Requested</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(refund.requestedAt)}
                      </p>
                    </div>
                  </div>
                  {refund.approvedAt && (
                    <div className="flex items-start gap-3">
                      <div className={`h-2 w-2 rounded-full mt-2 ${
                        refund.status === 'REJECTED' ? 'bg-destructive' : 'bg-success-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">
                          {refund.status === 'REJECTED' ? 'Rejected' : 'Approved'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(refund.approvedAt)}
                        </p>
                      </div>
                    </div>
                  )}
                  {refund.processedAt && (
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-success-500 mt-2" />
                      <div>
                        <p className="text-sm font-medium">Processed</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(refund.processedAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </DashboardGrid.OneThird>
        </DashboardGrid>
      </PageContent>
    </>
  );
}
