'use client';

import { useState, useEffect, use, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileCheck,
  ArrowLeft,
  CheckCircle,
  DollarSign,
  Clock,
  Eye,
  Calendar,
  FileText,
  Building2,
  User,
  AlertCircle,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StatCard } from '@/components/ui/stat-card';
import { StatsRow } from '@/components/layout';
import { FormField } from '@/components/ui/form-field';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface EOBLineItem {
  id: string;
  procedureCode: string;
  chargedAmount: number;
  allowedAmount: number;
  paidAmount: number;
  adjustmentAmount: number;
  denialCode: string | null;
  denialReason: string | null;
}

interface EOB {
  id: string;
  eobNumber: string | null;
  checkNumber: string | null;
  receivedDate: string;
  paymentDate: string | null;
  status: string;
  receiptMethod: string;
  totalPaid: number;
  totalAdjusted: number;
  patientResponsibility: number;
  needsReview: boolean;
  reviewNotes: string | null;
  documentUrl: string | null;
  extractedData: Record<string, unknown> | null;
  extractionConfidence: number | null;
  createdAt: string;
  updatedAt: string;
  claim: {
    id: string;
    claimNumber: string;
    billedAmount: number;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
    };
    insuranceCompany: {
      id: string;
      name: string;
    };
  };
  lineItems?: EOBLineItem[];
  payments?: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    postedAt: string | null;
  }>;
}

const EOB_STATUSES: Record<string, { label: string; color: string; icon: typeof FileCheck }> = {
  PENDING: { label: 'Pending', color: 'secondary', icon: Clock },
  REVIEWING: { label: 'Reviewing', color: 'warning', icon: Eye },
  PROCESSED: { label: 'Processed', color: 'success', icon: CheckCircle },
  POSTED: { label: 'Posted', color: 'default', icon: DollarSign },
};

function EOBDetailPageContent({ eobId }: { eobId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [eob, setEob] = useState<EOB | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProcessDialog, setShowProcessDialog] = useState(searchParams.get('action') === 'process');
  const [showPostDialog, setShowPostDialog] = useState(searchParams.get('action') === 'post');
  const [processing, setProcessing] = useState(false);
  const [processData, setProcessData] = useState({
    totalPaid: 0,
    totalAdjusted: 0,
    patientResponsibility: 0,
    reviewNotes: '',
  });

  useEffect(() => {
    fetchEOB();
  }, [eobId]);

  async function fetchEOB() {
    try {
      setLoading(true);
      const res = await fetch(`/api/insurance/eobs/${eobId}`);
      const data = await res.json();

      if (data.success) {
        setEob(data.data);
        setProcessData({
          totalPaid: data.data.totalPaid || 0,
          totalAdjusted: data.data.totalAdjusted || 0,
          patientResponsibility: data.data.patientResponsibility || 0,
          reviewNotes: data.data.reviewNotes || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch EOB:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: string, body: Record<string, unknown> = {}) {
    try {
      setProcessing(true);
      const res = await fetch(`/api/insurance/eobs/${eobId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
      });
      const data = await res.json();

      if (data.success) {
        setEob(data.data);
        setShowProcessDialog(false);
        setShowPostDialog(false);
      }
    } catch (error) {
      console.error(`Failed to ${action} EOB:`, error);
    } finally {
      setProcessing(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!eob) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">EOB not found</p>
        <Link href="/billing/insurance/eobs">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to EOBs
          </Button>
        </Link>
      </div>
    );
  }

  const statusConfig = EOB_STATUSES[eob.status] || EOB_STATUSES.PENDING;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/billing/insurance/eobs">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <FileCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  EOB {eob.eobNumber || eob.checkNumber || eob.id.slice(0, 8)}
                </h1>
                <Badge variant={statusConfig.color as 'default' | 'secondary' | 'destructive'}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {statusConfig.label}
                </Badge>
                {eob.needsReview && (
                  <Badge variant="warning">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Needs Review
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                {eob.receiptMethod} • Received: {formatDate(eob.receivedDate)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {eob.status === 'PENDING' && (
            <Button onClick={() => setShowProcessDialog(true)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Process EOB
            </Button>
          )}
          {eob.status === 'PROCESSED' && (
            <Button onClick={() => setShowPostDialog(true)}>
              <DollarSign className="mr-2 h-4 w-4" />
              Post Payment
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <StatsRow>
        <StatCard accentColor="primary">
          <p className="text-xs text-muted-foreground">Claim Billed</p>
          <p className="text-2xl font-bold">{formatCurrency(eob.claim.billedAmount)}</p>
          <p className="text-xs text-muted-foreground">Original charges</p>
        </StatCard>
        <StatCard accentColor="success">
          <p className="text-xs text-muted-foreground">Insurance Paid</p>
          <p className="text-2xl font-bold">{formatCurrency(eob.totalPaid)}</p>
          <p className="text-xs text-muted-foreground">Payment amount</p>
        </StatCard>
        <StatCard accentColor="warning">
          <p className="text-xs text-muted-foreground">Adjustments</p>
          <p className="text-2xl font-bold">{formatCurrency(eob.totalAdjusted)}</p>
          <p className="text-xs text-muted-foreground">Write-offs</p>
        </StatCard>
        <StatCard accentColor="accent">
          <p className="text-xs text-muted-foreground">Patient Responsibility</p>
          <p className="text-2xl font-bold">{formatCurrency(eob.patientResponsibility)}</p>
          <p className="text-xs text-muted-foreground">Due from patient</p>
        </StatCard>
      </StatsRow>

      {/* Details Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Claim Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Related Claim
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Claim Number</p>
              <Link
                href={`/billing/insurance/claims/${eob.claim.id}`}
                className="font-medium text-primary hover:underline"
              >
                {eob.claim.claimNumber}
              </Link>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Patient</p>
              <p className="font-medium">
                <PhiProtected fakeData={getFakeName()}>
                  {eob.claim.patient.firstName} {eob.claim.patient.lastName}
                </PhiProtected>
              </p>
            </div>
            <Link href={`/billing/insurance/claims/${eob.claim.id}`}>
              <Button variant="outline" size="sm" className="w-full">
                View Claim
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Insurance Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Insurance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Company</p>
              <p className="font-medium">{eob.claim.insuranceCompany.name}</p>
            </div>
            {eob.checkNumber && (
              <div>
                <p className="text-sm text-muted-foreground">Check Number</p>
                <code className="rounded bg-muted px-2 py-1 text-sm">
                  {eob.checkNumber}
                </code>
              </div>
            )}
            {eob.paymentDate && (
              <div>
                <p className="text-sm text-muted-foreground">Payment Date</p>
                <p className="font-medium">{formatDate(eob.paymentDate)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Received Date</p>
              <p className="font-medium">{formatDate(eob.receivedDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receipt Method</p>
              <Badge variant="outline">{eob.receiptMethod}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">{formatDateTime(eob.updatedAt)}</p>
            </div>
            {eob.extractionConfidence !== null && (
              <div>
                <p className="text-sm text-muted-foreground">AI Extraction Confidence</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${eob.extractionConfidence * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {Math.round(eob.extractionConfidence * 100)}%
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      {eob.lineItems && eob.lineItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Line Item Details</CardTitle>
            <CardDescription>Breakdown by procedure code</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Procedure</TableHead>
                  <TableHead className="text-right">Charged</TableHead>
                  <TableHead className="text-right">Allowed</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Adjustment</TableHead>
                  <TableHead>Denial</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eob.lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-1 text-sm">
                        {item.procedureCode}
                      </code>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.chargedAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.allowedAmount)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(item.paidAmount)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(item.adjustmentAmount)}
                    </TableCell>
                    <TableCell>
                      {item.denialCode ? (
                        <Badge variant="destructive">{item.denialCode}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Review Notes */}
      {eob.reviewNotes && (
        <Card>
          <CardHeader>
            <CardTitle>Review Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{eob.reviewNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Process EOB Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Process EOB</DialogTitle>
            <DialogDescription>
              Enter the payment details from the EOB document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FormField label="Total Paid" required>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={processData.totalPaid}
                onChange={(e) =>
                  setProcessData({ ...processData, totalPaid: parseFloat(e.target.value) || 0 })
                }
              />
            </FormField>
            <FormField label="Total Adjustments">
              <Input
                type="number"
                min={0}
                step={0.01}
                value={processData.totalAdjusted}
                onChange={(e) =>
                  setProcessData({ ...processData, totalAdjusted: parseFloat(e.target.value) || 0 })
                }
              />
            </FormField>
            <FormField label="Patient Responsibility">
              <Input
                type="number"
                min={0}
                step={0.01}
                value={processData.patientResponsibility}
                onChange={(e) =>
                  setProcessData({
                    ...processData,
                    patientResponsibility: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </FormField>
            <FormField label="Review Notes">
              <Textarea
                value={processData.reviewNotes}
                onChange={(e) => setProcessData({ ...processData, reviewNotes: e.target.value })}
                placeholder="Optional notes about the EOB..."
                rows={3}
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcessDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                handleAction('process', {
                  totalPaid: processData.totalPaid,
                  totalAdjusted: processData.totalAdjusted,
                  patientResponsibility: processData.patientResponsibility,
                  reviewNotes: processData.reviewNotes || undefined,
                })
              }
              disabled={processing}
            >
              {processing ? 'Processing...' : 'Process EOB'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post Payment Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post Payment</DialogTitle>
            <DialogDescription>
              Post the insurance payment of {formatCurrency(eob.totalPaid)} to the patient&apos;s account.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Amount:</span>
                <span className="font-medium text-green-600">{formatCurrency(eob.totalPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Adjustments:</span>
                <span>{formatCurrency(eob.totalAdjusted)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-muted-foreground">Patient Owes:</span>
                <span className="font-medium">{formatCurrency(eob.patientResponsibility)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPostDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleAction('post')} disabled={processing}>
              {processing ? 'Posting...' : 'Post Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function EOBDetailPage({
  params,
}: {
  params: Promise<{ eobId: string }>;
}) {
  const { eobId } = use(params);
  return (
    <Suspense fallback={<div className="flex h-48 items-center justify-center"><div className="text-muted-foreground">Loading...</div></div>}>
      <EOBDetailPageContent eobId={eobId} />
    </Suspense>
  );
}
