'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Landmark,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  FileText,
  Calendar,
  CreditCard,
  Loader2,
  Flag,
} from 'lucide-react';

import { PageHeader, PageContent, DashboardGrid, StatsRow } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { PhiProtected } from '@/components/ui/phi-protected';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getFakeName } from '@/lib/fake-data';

interface Settlement {
  id: string;
  settlementNumber: string;
  settlementDate: string;
  grossAmount: number;
  fees: number;
  netAmount: number;
  transactionCount: number;
  status: string;
  externalId?: string;
  depositedAt?: string;
  depositReference?: string;
  reconciledAt?: string;
  notes?: string;
  payments: Array<{
    id: string;
    paymentNumber: string;
    amount: number;
    paymentDate: string;
    paymentType: string;
    status: string;
    patient?: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
}

const settlementStatusVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
  PENDING: 'warning',
  DEPOSITED: 'info',
  RECONCILED: 'success',
  DISCREPANCY: 'destructive',
};

const settlementStatusLabels: Record<string, string> = {
  PENDING: 'Pending',
  DEPOSITED: 'Deposited',
  RECONCILED: 'Reconciled',
  DISCREPANCY: 'Discrepancy',
};

export default function SettlementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const settlementId = params.settlementId as string;

  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showReconcileDialog, setShowReconcileDialog] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [depositReference, setDepositReference] = useState('');
  const [reconcileNotes, setReconcileNotes] = useState('');
  const [flagNotes, setFlagNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchSettlement = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/settlements/${settlementId}`);
      const data = await response.json();

      if (data.success) {
        setSettlement(data.data);
      } else {
        toast({
          title: 'Error',
          description: data.error?.message || 'Failed to load settlement',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to fetch settlement:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settlement',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [settlementId, toast]);

  useEffect(() => {
    if (settlementId) {
      fetchSettlement();
    }
  }, [settlementId, fetchSettlement]);

  const handleConfirmDeposit = async () => {
    if (!settlement) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/settlements/${settlementId}?action=confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositReference }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Deposit confirmed',
          description: 'Settlement has been marked as deposited',
        });
        setShowConfirmDialog(false);
        setDepositReference('');
        fetchSettlement();
      } else {
        toast({
          title: 'Failed to confirm',
          description: data.error?.message || 'Could not confirm deposit',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to confirm deposit',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReconcile = async () => {
    if (!settlement) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/settlements/${settlementId}?action=reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: reconcileNotes }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Settlement reconciled',
          description: 'Settlement has been marked as reconciled',
        });
        setShowReconcileDialog(false);
        setReconcileNotes('');
        fetchSettlement();
      } else {
        toast({
          title: 'Failed to reconcile',
          description: data.error?.message || 'Could not reconcile settlement',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to reconcile settlement',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFlagDiscrepancy = async () => {
    if (!settlement || !flagNotes.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/settlements/${settlementId}?action=flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: flagNotes }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Discrepancy flagged',
          description: 'Settlement has been flagged for review',
        });
        setShowFlagDialog(false);
        setFlagNotes('');
        fetchSettlement();
      } else {
        toast({
          title: 'Failed to flag',
          description: data.error?.message || 'Could not flag discrepancy',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to flag discrepancy',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Settlement"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Billing', href: '/billing' },
            { label: 'Settlements', href: '/billing/settlements' },
            { label: 'Details' },
          ]}
        />
        <PageContent density="comfortable">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </PageContent>
      </>
    );
  }

  if (!settlement) {
    return (
      <>
        <PageHeader
          title="Settlement"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Billing', href: '/billing' },
            { label: 'Settlements', href: '/billing/settlements' },
            { label: 'Not Found' },
          ]}
        />
        <PageContent density="comfortable">
          <Card>
            <CardContent className="py-12 text-center">
              <Landmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Settlement Not Found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The settlement you're looking for doesn't exist.
              </p>
              <Link href="/billing/settlements">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Settlements
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
        title={`Settlement: ${settlement.settlementNumber}`}
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Billing', href: '/billing' },
          { label: 'Settlements', href: '/billing/settlements' },
          { label: settlement.settlementNumber },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {settlement.status === 'PENDING' && (
              <>
                <Button onClick={() => setShowConfirmDialog(true)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Deposit
                </Button>
                <Button variant="outline" onClick={() => setShowFlagDialog(true)}>
                  <Flag className="h-4 w-4 mr-2" />
                  Flag Issue
                </Button>
              </>
            )}
            {settlement.status === 'DEPOSITED' && (
              <>
                <Button onClick={() => setShowReconcileDialog(true)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Reconciled
                </Button>
                <Button variant="outline" onClick={() => setShowFlagDialog(true)}>
                  <Flag className="h-4 w-4 mr-2" />
                  Flag Issue
                </Button>
              </>
            )}
          </div>
        }
      />

      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Stats */}
          <StatsRow>
            <StatCard accentColor="primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Gross Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(settlement.grossAmount)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary-500" />
              </div>
            </StatCard>
            <StatCard accentColor="destructive">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Processing Fees</p>
                  <p className="text-2xl font-bold">-{formatCurrency(settlement.fees)}</p>
                </div>
                <CreditCard className="h-8 w-8 text-destructive-500" />
              </div>
            </StatCard>
            <StatCard accentColor="success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Net Deposit</p>
                  <p className="text-2xl font-bold">{formatCurrency(settlement.netAmount)}</p>
                </div>
                <Landmark className="h-8 w-8 text-success-500" />
              </div>
            </StatCard>
            <StatCard
              accentColor={
                settlement.status === 'RECONCILED'
                  ? 'success'
                  : settlement.status === 'DISCREPANCY'
                    ? 'destructive'
                    : 'warning'
              }
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={settlementStatusVariant[settlement.status] || 'default'} className="mt-1">
                    {settlement.status === 'DISCREPANCY' && (
                      <AlertTriangle className="h-3 w-3 mr-1" />
                    )}
                    {settlementStatusLabels[settlement.status] || settlement.status}
                  </Badge>
                </div>
                {settlement.status === 'RECONCILED' ? (
                  <CheckCircle className="h-8 w-8 text-success-500" />
                ) : settlement.status === 'DISCREPANCY' ? (
                  <AlertTriangle className="h-8 w-8 text-destructive-500" />
                ) : (
                  <Clock className="h-8 w-8 text-warning-500" />
                )}
              </div>
            </StatCard>
          </StatsRow>

          <DashboardGrid>
            <DashboardGrid.TwoThirds>
              {/* Included Payments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Included Payments ({settlement.transactionCount})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {settlement.payments.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        No payment details available
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Payment</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {settlement.payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              <Link
                                href={`/billing/payments/${payment.id}`}
                                className="text-primary hover:underline"
                              >
                                {payment.paymentNumber}
                              </Link>
                            </TableCell>
                            <TableCell>
                              {payment.patient ? (
                                <PhiProtected fakeData={getFakeName()}>
                                  {payment.patient.firstName} {payment.patient.lastName}
                                </PhiProtected>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{payment.paymentType}</Badge>
                            </TableCell>
                            <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </DashboardGrid.TwoThirds>

            <DashboardGrid.OneThird>
              {/* Settlement Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Settlement Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Settlement Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p>{formatDate(settlement.settlementDate)}</p>
                    </div>
                  </div>

                  {settlement.externalId && (
                    <div>
                      <p className="text-sm text-muted-foreground">Stripe Reference</p>
                      <p className="font-mono text-sm">{settlement.externalId}</p>
                    </div>
                  )}

                  {settlement.depositReference && (
                    <div>
                      <p className="text-sm text-muted-foreground">Deposit Reference</p>
                      <p>{settlement.depositReference}</p>
                    </div>
                  )}

                  {settlement.depositedAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Deposited</p>
                      <p>{formatDate(settlement.depositedAt)}</p>
                    </div>
                  )}

                  {settlement.reconciledAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Reconciled</p>
                      <p>{formatDate(settlement.reconciledAt)}</p>
                    </div>
                  )}

                  {settlement.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="text-sm">{settlement.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Fee Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Fee Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Gross Amount</span>
                    <span>{formatCurrency(settlement.grossAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Processing Fees</span>
                    <span className="text-destructive">-{formatCurrency(settlement.fees)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Net Amount</span>
                      <span className="font-bold">{formatCurrency(settlement.netAmount)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Effective rate: {((settlement.fees / settlement.grossAmount) * 100).toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
            </DashboardGrid.OneThird>
          </DashboardGrid>
        </div>
      </PageContent>

      {/* Confirm Deposit Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deposit</DialogTitle>
            <DialogDescription>
              Confirm that this settlement has been deposited to your bank account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Net Amount</span>
                <span className="font-bold">{formatCurrency(settlement.netAmount)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="depositReference">Bank Reference (Optional)</Label>
              <Input
                id="depositReference"
                placeholder="e.g., Check #1234 or Bank Reference"
                value={depositReference}
                onChange={(e) => setDepositReference(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmDeposit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Deposit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reconcile Dialog */}
      <Dialog open={showReconcileDialog} onOpenChange={setShowReconcileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Reconciled</DialogTitle>
            <DialogDescription>
              Confirm that this settlement matches your bank statement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reconcileNotes">Notes (Optional)</Label>
              <Textarea
                id="reconcileNotes"
                placeholder="Any notes about the reconciliation..."
                value={reconcileNotes}
                onChange={(e) => setReconcileNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReconcileDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReconcile} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reconciling...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Reconciled
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Flag Discrepancy Dialog */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag Discrepancy</DialogTitle>
            <DialogDescription>
              Report an issue with this settlement for investigation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="flagNotes">Describe the Issue *</Label>
              <Textarea
                id="flagNotes"
                placeholder="Describe what doesn't match..."
                value={flagNotes}
                onChange={(e) => setFlagNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFlagDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleFlagDiscrepancy}
              disabled={isSubmitting || !flagNotes.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Flagging...
                </>
              ) : (
                <>
                  <Flag className="h-4 w-4 mr-2" />
                  Flag Discrepancy
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
