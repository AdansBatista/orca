'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard,
  ArrowLeft,
  Receipt,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  FileText,
  Calendar,
  DollarSign,
  RefreshCw,
  Ban,
} from 'lucide-react';

import { PageHeader, PageContent, DashboardGrid } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { getFakeName, getFakeEmail } from '@/lib/fake-data';

interface Payment {
  id: string;
  paymentNumber: string;
  amount: number;
  paymentDate: string;
  paymentType: string;
  paymentMethodType: string;
  sourceType: string;
  gateway: string;
  gatewayPaymentId?: string;
  status: string;
  cardBrand?: string;
  cardLast4?: string;
  cardExpiry?: string;
  checkNumber?: string;
  checkBank?: string;
  notes?: string;
  processedAt?: string;
  createdAt: string;
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
  allocations: Array<{
    id: string;
    amount: number;
    invoice: {
      id: string;
      invoiceNumber: string;
      subtotal: number;
      balance: number;
      status: string;
    };
  }>;
  refunds: Array<{
    id: string;
    refundNumber: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
  paymentMethod?: {
    id: string;
    cardBrand: string;
    cardLast4: string;
    cardExpMonth: number;
    cardExpYear: number;
    isDefault: boolean;
  };
  processedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  receipt?: {
    id: string;
    receiptNumber: string;
    sentAt?: string;
    deliveryMethod: string;
  };
}

const paymentStatusConfig: Record<string, { variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'; icon: typeof CheckCircle; label: string }> = {
  PENDING: { variant: 'warning', icon: Clock, label: 'Pending' },
  PROCESSING: { variant: 'info', icon: RefreshCw, label: 'Processing' },
  COMPLETED: { variant: 'success', icon: CheckCircle, label: 'Completed' },
  FAILED: { variant: 'destructive', icon: XCircle, label: 'Failed' },
  CANCELLED: { variant: 'secondary', icon: Ban, label: 'Cancelled' },
  REFUNDED: { variant: 'secondary', icon: RotateCcw, label: 'Refunded' },
  PARTIALLY_REFUNDED: { variant: 'warning', icon: RotateCcw, label: 'Partial Refund' },
  DISPUTED: { variant: 'destructive', icon: AlertTriangle, label: 'Disputed' },
};

const paymentMethodLabels: Record<string, string> = {
  CREDIT_CARD: 'Credit Card',
  DEBIT_CARD: 'Debit Card',
  ACH: 'Bank Transfer',
  CASH: 'Cash',
  CHECK: 'Check',
  E_TRANSFER: 'E-Transfer',
  WIRE: 'Wire Transfer',
  INSURANCE: 'Insurance',
  OTHER: 'Other',
};

export default function PaymentDetailPage({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const response = await fetch(`/api/payments/${paymentId}`);
        const data = await response.json();

        if (data.success) {
          setPayment(data.data);
        } else {
          toast({
            title: 'Error',
            description: data.error?.message || 'Failed to load payment',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Failed to fetch payment:', error);
        toast({
          title: 'Error',
          description: 'Failed to load payment details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayment();
  }, [paymentId, toast]);

  const handleAction = async (action: 'capture' | 'cancel' | 'sync') => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/payments/${paymentId}?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        setPayment(data.data);
        toast({
          title: 'Success',
          description: `Payment ${action}${action === 'sync' ? 'ed' : action === 'capture' ? 'd' : 'led'} successfully`,
        });
      } else {
        toast({
          title: 'Error',
          description: data.error?.message || `Failed to ${action} payment`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${action} payment`,
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
          title="Payment Details"
          compact
          breadcrumbs={[
            { label: 'Billing', href: '/billing' },
            { label: 'Payments', href: '/billing/payments' },
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

  if (!payment) {
    return (
      <>
        <PageHeader
          title="Payment Not Found"
          compact
          breadcrumbs={[
            { label: 'Billing', href: '/billing' },
            { label: 'Payments', href: '/billing/payments' },
            { label: 'Not Found' },
          ]}
        />
        <PageContent density="comfortable">
          <Card>
            <CardContent className="py-12 text-center">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Payment not found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The payment you're looking for doesn't exist or has been removed.
              </p>
              <Link href="/billing/payments">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Payments
                </Button>
              </Link>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  const statusConfig = paymentStatusConfig[payment.status] || paymentStatusConfig.PENDING;
  const StatusIcon = statusConfig.icon;
  const totalRefunded = payment.refunds.reduce((sum, r) => sum + r.amount, 0);
  const canRefund = payment.status === 'COMPLETED' && totalRefunded < payment.amount;
  const canCapture = payment.status === 'PENDING' && payment.gatewayPaymentId;
  const canCancel = payment.status === 'PENDING';

  return (
    <>
      <PageHeader
        title={payment.paymentNumber}
        compact
        breadcrumbs={[
          { label: 'Billing', href: '/billing' },
          { label: 'Payments', href: '/billing/payments' },
          { label: payment.paymentNumber },
        ]}
        actions={
          <div className="flex gap-2">
            {payment.gatewayPaymentId && (
              <Button variant="outline" onClick={() => handleAction('sync')} disabled={isProcessing}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Status
              </Button>
            )}
            {canCapture && (
              <Button onClick={() => handleAction('capture')} disabled={isProcessing}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Capture Payment
              </Button>
            )}
            {canRefund && (
              <Link href={`/billing/payments/${paymentId}/refund`}>
                <Button variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Issue Refund
                </Button>
              </Link>
            )}
            {canCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isProcessing}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Payment</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel this payment? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Payment</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleAction('cancel')}>
                      Yes, Cancel Payment
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
            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      payment.status === 'COMPLETED' ? 'bg-success-100' :
                      payment.status === 'FAILED' || payment.status === 'DISPUTED' ? 'bg-destructive/10' :
                      'bg-muted'
                    }`}>
                      <StatusIcon className={`h-6 w-6 ${
                        payment.status === 'COMPLETED' ? 'text-success-600' :
                        payment.status === 'FAILED' || payment.status === 'DISPUTED' ? 'text-destructive' :
                        'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{formatCurrency(payment.amount)}</CardTitle>
                      <CardDescription>
                        {paymentMethodLabels[payment.paymentMethodType] || payment.paymentMethodType}
                        {payment.cardLast4 && ` •••• ${payment.cardLast4}`}
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
                    <p className="text-sm text-muted-foreground">Payment Date</p>
                    <p className="font-medium">{formatDate(payment.paymentDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Type</p>
                    <p className="font-medium capitalize">{payment.paymentType.toLowerCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Source</p>
                    <p className="font-medium capitalize">{payment.sourceType.toLowerCase().replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gateway</p>
                    <p className="font-medium">{payment.gateway}</p>
                  </div>
                  {payment.processedAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Processed At</p>
                      <p className="font-medium">{formatDateTime(payment.processedAt)}</p>
                    </div>
                  )}
                  {payment.processedBy && (
                    <div>
                      <p className="text-sm text-muted-foreground">Processed By</p>
                      <p className="font-medium">
                        {payment.processedBy.firstName} {payment.processedBy.lastName}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card/Check Details */}
                {(payment.cardBrand || payment.checkNumber) && (
                  <>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-2 gap-4">
                      {payment.cardBrand && (
                        <>
                          <div>
                            <p className="text-sm text-muted-foreground">Card Brand</p>
                            <p className="font-medium capitalize">{payment.cardBrand}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Card Number</p>
                            <p className="font-medium">•••• {payment.cardLast4}</p>
                          </div>
                        </>
                      )}
                      {payment.checkNumber && (
                        <>
                          <div>
                            <p className="text-sm text-muted-foreground">Check Number</p>
                            <p className="font-medium">{payment.checkNumber}</p>
                          </div>
                          {payment.checkBank && (
                            <div>
                              <p className="text-sm text-muted-foreground">Bank</p>
                              <p className="font-medium">{payment.checkBank}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}

                {payment.notes && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm">{payment.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Invoice Allocations */}
            <Card>
              <CardHeader compact>
                <CardTitle size="sm" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Invoice Allocations
                </CardTitle>
                <CardDescription>How this payment was applied</CardDescription>
              </CardHeader>
              <CardContent compact>
                {payment.allocations.length > 0 ? (
                  <div className="space-y-3">
                    {payment.allocations.map((allocation) => (
                      <Link
                        key={allocation.id}
                        href={`/billing/invoices/${allocation.invoice.id}`}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div>
                          <p className="font-medium">{allocation.invoice.invoiceNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            Invoice total: {formatCurrency(allocation.invoice.subtotal)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-success-600">
                            -{formatCurrency(allocation.amount)}
                          </p>
                          <Badge variant={allocation.invoice.status === 'PAID' ? 'success' : 'warning'} className="text-xs">
                            {allocation.invoice.status}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No invoice allocations</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Refunds */}
            {payment.refunds.length > 0 && (
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Refunds
                  </CardTitle>
                  <CardDescription>
                    Total refunded: {formatCurrency(totalRefunded)}
                  </CardDescription>
                </CardHeader>
                <CardContent compact>
                  <div className="space-y-3">
                    {payment.refunds.map((refund) => (
                      <Link
                        key={refund.id}
                        href={`/billing/refunds/${refund.id}`}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div>
                          <p className="font-medium">{refund.refundNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(refund.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(refund.amount)}</p>
                          <Badge
                            variant={
                              refund.status === 'COMPLETED' ? 'success' :
                              refund.status === 'PENDING' ? 'warning' :
                              'secondary'
                            }
                            className="text-xs"
                          >
                            {refund.status}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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
                    {payment.patient.firstName} {payment.patient.lastName}
                  </p>
                </PhiProtected>
                {payment.patient.email && (
                  <PhiProtected fakeData={getFakeEmail()}>
                    <p className="text-sm text-muted-foreground">{payment.patient.email}</p>
                  </PhiProtected>
                )}
                <Separator className="my-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Account</p>
                  <Link href={`/billing/accounts/${payment.account.id}`} className="text-primary hover:underline">
                    {payment.account.accountNumber}
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1">
                    Balance: {formatCurrency(payment.account.currentBalance)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Receipt */}
            {payment.receipt && (
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Receipt
                  </CardTitle>
                </CardHeader>
                <CardContent compact>
                  <p className="font-medium">{payment.receipt.receiptNumber}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    Sent via {payment.receipt.deliveryMethod.toLowerCase()}
                  </p>
                  {payment.receipt.sentAt && (
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(payment.receipt.sentAt)}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Gateway Info */}
            {payment.gatewayPaymentId && (
              <Card variant="ghost">
                <CardHeader compact>
                  <CardTitle size="sm">Gateway Reference</CardTitle>
                </CardHeader>
                <CardContent compact>
                  <p className="text-xs font-mono text-muted-foreground break-all">
                    {payment.gatewayPaymentId}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Timestamps */}
            <Card variant="ghost">
              <CardHeader compact>
                <CardTitle size="sm">Activity</CardTitle>
              </CardHeader>
              <CardContent compact className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDateTime(payment.createdAt)}</span>
                </div>
                {payment.processedAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Processed</span>
                    <span>{formatDateTime(payment.processedAt)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </DashboardGrid.OneThird>
        </DashboardGrid>
      </PageContent>
    </>
  );
}
