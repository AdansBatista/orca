'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  ChevronRight,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

import { PageHeader, PageContent, StatsRow, DataTableLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getFakeName } from '@/lib/fake-data';

interface Refund {
  id: string;
  refundNumber: string;
  amount: number;
  refundType: string;
  reason?: string;
  status: string;
  requestedAt: string;
  payment: {
    id: string;
    paymentNumber: string;
    amount: number;
    patient?: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  requestedByUser?: {
    firstName: string;
    lastName: string;
  };
}

export default function PendingRefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchPendingRefunds = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: 'PENDING',
        sortBy: 'requestedAt',
        sortOrder: 'asc',
        pageSize: '100',
      });

      const response = await fetch(`/api/refunds?${params}`);
      const data = await response.json();

      if (data.success) {
        setRefunds(data.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch pending refunds:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingRefunds();
  }, [fetchPendingRefunds]);

  const handleApprove = async () => {
    if (!selectedRefund) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/refunds/${selectedRefund.id}?action=approve`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Refund approved',
          description: `Refund ${selectedRefund.refundNumber} has been approved`,
        });
        setShowApproveDialog(false);
        setSelectedRefund(null);
        fetchPendingRefunds();
      } else {
        toast({
          title: 'Failed to approve',
          description: data.error?.message || 'Could not approve refund',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to approve refund',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRefund) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/refunds/${selectedRefund.id}?action=reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Refund rejected',
          description: `Refund ${selectedRefund.refundNumber} has been rejected`,
        });
        setShowRejectDialog(false);
        setSelectedRefund(null);
        setRejectionReason('');
        fetchPendingRefunds();
      } else {
        toast({
          title: 'Failed to reject',
          description: data.error?.message || 'Could not reject refund',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to reject refund',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPendingAmount = refunds.reduce((sum, r) => sum + r.amount, 0);

  return (
    <>
      <PageHeader
        title="Pending Refund Approvals"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Billing', href: '/billing' },
          { label: 'Refunds', href: '/billing/refunds' },
          { label: 'Pending Approvals' },
        ]}
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Stats */}
          <StatsRow>
            <StatCard accentColor="warning">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending Approvals</p>
                  <p className="text-2xl font-bold">{refunds.length}</p>
                  <p className="text-xs text-muted-foreground">Awaiting review</p>
                </div>
                <Clock className="h-8 w-8 text-warning-500" />
              </div>
            </StatCard>
            <StatCard accentColor="primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalPendingAmount)}</p>
                  <p className="text-xs text-muted-foreground">Pending refunds</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary-500" />
              </div>
            </StatCard>
          </StatsRow>

          <DataTableLayout>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : refunds.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 mx-auto text-success-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  No refunds pending approval
                </p>
                <Link href="/billing/refunds">
                  <Button variant="outline">View All Refunds</Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Refund</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Original Payment</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead className="w-[180px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refunds.map((refund) => (
                    <TableRow key={refund.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{refund.refundNumber}</p>
                          <Badge variant="outline" className="text-xs">
                            {refund.refundType === 'FULL' ? 'Full' : 'Partial'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {refund.payment.patient ? (
                          <PhiProtected fakeData={getFakeName()}>
                            <p className="text-sm">
                              {refund.payment.patient.firstName} {refund.payment.patient.lastName}
                            </p>
                          </PhiProtected>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{refund.payment.paymentNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(refund.payment.amount)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-destructive">
                          {formatCurrency(refund.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {refund.reason || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{formatDate(refund.requestedAt)}</p>
                        {refund.requestedByUser && (
                          <p className="text-xs text-muted-foreground">
                            by {refund.requestedByUser.firstName}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-success-600 hover:text-success-700 hover:bg-success-50"
                            onClick={() => {
                              setSelectedRefund(refund);
                              setShowApproveDialog(true);
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setSelectedRefund(refund);
                              setShowRejectDialog(true);
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Link href={`/billing/refunds/${refund.id}`}>
                            <Button variant="ghost" size="sm">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DataTableLayout>
        </div>
      </PageContent>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Refund</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this refund request?
            </DialogDescription>
          </DialogHeader>

          {selectedRefund && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Refund Number</span>
                <span className="font-medium">{selectedRefund.refundNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="font-medium text-destructive">
                  {formatCurrency(selectedRefund.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Reason</span>
                <span className="text-sm">{selectedRefund.reason || '-'}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Refund
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Refund</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this refund request.
            </DialogDescription>
          </DialogHeader>

          {selectedRefund && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Refund Number</span>
                  <span className="font-medium">{selectedRefund.refundNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-medium">{formatCurrency(selectedRefund.amount)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Rejection Reason</Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Enter the reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting || !rejectionReason.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Refund
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
