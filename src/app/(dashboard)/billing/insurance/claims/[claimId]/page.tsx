'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  ArrowLeft,
  Send,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User,
  Building2,
  Calendar,
  Edit,
  RotateCcw,
  Trash2,
  History,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { StatsRow } from '@/components/layout';
import { Textarea } from '@/components/ui/textarea';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface ClaimItem {
  id: string;
  lineNumber: number;
  procedureCode: string;
  toothNumbers: string[];
  description: string;
  quantity: number;
  unitFee: number;
  totalFee: number;
  status: string;
}

interface InsuranceClaim {
  id: string;
  claimNumber: string;
  status: string;
  claimType: string;
  serviceDate: string;
  filingDate: string | null;
  billedAmount: number;
  allowedAmount: number | null;
  paidAmount: number;
  adjustmentAmount: number;
  patientResponsibility: number;
  denialCode: string | null;
  denialReason: string | null;
  appealDeadline: string | null;
  submissionMethod: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  };
  insuranceCompany: {
    id: string;
    name: string;
    payerId: string | null;
  };
  patientInsurance: {
    id: string;
    subscriberId: string;
    groupNumber: string | null;
  };
  items: ClaimItem[];
  statusHistory?: Array<{
    id: string;
    status: string;
    changedAt: string;
    changedBy: string;
    notes: string | null;
  }>;
}

const CLAIM_STATUSES: Record<string, { label: string; color: string; icon: typeof FileText }> = {
  DRAFT: { label: 'Draft', color: 'secondary', icon: FileText },
  READY: { label: 'Ready', color: 'default', icon: Clock },
  SUBMITTED: { label: 'Submitted', color: 'info', icon: Send },
  ACCEPTED: { label: 'Accepted', color: 'success', icon: CheckCircle },
  IN_PROCESS: { label: 'In Process', color: 'warning', icon: Clock },
  PAID: { label: 'Paid', color: 'success', icon: DollarSign },
  DENIED: { label: 'Denied', color: 'destructive', icon: XCircle },
  APPEALED: { label: 'Appealed', color: 'warning', icon: AlertCircle },
  VOID: { label: 'Void', color: 'secondary', icon: XCircle },
};

export default function InsuranceClaimDetailPage({
  params,
}: {
  params: Promise<{ claimId: string }>;
}) {
  const { claimId } = use(params);
  const router = useRouter();
  const [claim, setClaim] = useState<InsuranceClaim | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAppealDialog, setShowAppealDialog] = useState(false);
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [voidReason, setVoidReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchClaim();
  }, [claimId]);

  async function fetchClaim() {
    try {
      setLoading(true);
      const res = await fetch(`/api/insurance/claims/${claimId}`);
      const data = await res.json();

      if (data.success) {
        setClaim(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch claim:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: string, body: Record<string, unknown> = {}) {
    try {
      setProcessing(true);
      const res = await fetch(`/api/insurance/claims/${claimId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
      });
      const data = await res.json();

      if (data.success) {
        setClaim(data.data);
        setShowAppealDialog(false);
        setShowVoidDialog(false);
        setAppealReason('');
        setVoidReason('');
      }
    } catch (error) {
      console.error(`Failed to ${action} claim:`, error);
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

  if (!claim) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Claim not found</p>
        <Link href="/billing/insurance/claims">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Claims
          </Button>
        </Link>
      </div>
    );
  }

  const statusConfig = CLAIM_STATUSES[claim.status] || CLAIM_STATUSES.DRAFT;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/billing/insurance/claims">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  Claim {claim.claimNumber}
                </h1>
                <Badge variant={statusConfig.color as 'default' | 'secondary' | 'destructive'}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {claim.claimType} • Service Date: {formatDate(claim.serviceDate)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(claim.status === 'DRAFT' || claim.status === 'READY') && (
            <>
              <Button variant="outline" onClick={() => router.push(`/billing/insurance/claims/${claimId}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button onClick={() => handleAction('submit')}>
                <Send className="mr-2 h-4 w-4" />
                Submit Claim
              </Button>
            </>
          )}
          {claim.status === 'DENIED' && (
            <Button onClick={() => setShowAppealDialog(true)}>
              <AlertCircle className="mr-2 h-4 w-4" />
              File Appeal
            </Button>
          )}
          {claim.status === 'APPEALED' && (
            <Button variant="outline" onClick={() => handleAction('resubmit')}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Resubmit
            </Button>
          )}
          {claim.status !== 'VOID' && claim.status !== 'PAID' && (
            <Button variant="destructive" onClick={() => setShowVoidDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Void
            </Button>
          )}
        </div>
      </div>

      {/* Denial Alert */}
      {claim.status === 'DENIED' && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Claim Denied</p>
                <p className="text-sm text-muted-foreground">
                  Denial Code: <span className="font-mono">{claim.denialCode}</span>
                </p>
                {claim.denialReason && (
                  <p className="text-sm mt-1">{claim.denialReason}</p>
                )}
                {claim.appealDeadline && (
                  <p className="text-sm text-destructive mt-2">
                    Appeal Deadline: {formatDate(claim.appealDeadline)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <StatsRow>
        <StatCard accentColor="primary">
          <p className="text-xs text-muted-foreground">Billed Amount</p>
          <p className="text-2xl font-bold">{formatCurrency(claim.billedAmount)}</p>
          <p className="text-xs text-muted-foreground">{claim.items.length} line items</p>
        </StatCard>
        <StatCard accentColor="accent">
          <p className="text-xs text-muted-foreground">Allowed Amount</p>
          <p className="text-2xl font-bold">{claim.allowedAmount ? formatCurrency(claim.allowedAmount) : '-'}</p>
          <p className="text-xs text-muted-foreground">Insurance allowed</p>
        </StatCard>
        <StatCard accentColor="success">
          <p className="text-xs text-muted-foreground">Paid Amount</p>
          <p className="text-2xl font-bold">{formatCurrency(claim.paidAmount)}</p>
          <p className="text-xs text-muted-foreground">Received</p>
        </StatCard>
        <StatCard accentColor="warning">
          <p className="text-xs text-muted-foreground">Patient Responsibility</p>
          <p className="text-2xl font-bold">{formatCurrency(claim.patientResponsibility)}</p>
          <p className="text-xs text-muted-foreground">Due from patient</p>
        </StatCard>
      </StatsRow>

      {/* Details Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Patient & Insurance Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">
                <PhiProtected fakeData={getFakeName()}>
                  {claim.patient.firstName} {claim.patient.lastName}
                </PhiProtected>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date of Birth</p>
              <p className="font-medium">{formatDate(claim.patient.dateOfBirth)}</p>
            </div>
            <Link href={`/patients/${claim.patient.id}`}>
              <Button variant="outline" size="sm" className="w-full">
                View Patient
              </Button>
            </Link>
          </CardContent>
        </Card>

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
              <p className="font-medium">{claim.insuranceCompany.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payer ID</p>
              <code className="rounded bg-muted px-2 py-1 text-sm">
                {claim.insuranceCompany.payerId || 'N/A'}
              </code>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Subscriber ID</p>
              <p className="font-medium">{claim.patientInsurance.subscriberId}</p>
            </div>
            {claim.patientInsurance.groupNumber && (
              <div>
                <p className="text-sm text-muted-foreground">Group Number</p>
                <p className="font-medium">{claim.patientInsurance.groupNumber}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Service Date</p>
              <p className="font-medium">{formatDate(claim.serviceDate)}</p>
            </div>
            {claim.filingDate && (
              <div>
                <p className="text-sm text-muted-foreground">Filing Date</p>
                <p className="font-medium">{formatDate(claim.filingDate)}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{formatDateTime(claim.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">{formatDateTime(claim.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Claim Line Items</CardTitle>
          <CardDescription>Procedures and charges included in this claim</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Procedure Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Teeth</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Fee</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claim.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.lineNumber}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-2 py-1 text-sm">
                      {item.procedureCode}
                    </code>
                  </TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>
                    {item.toothNumbers.length > 0 ? item.toothNumbers.join(', ') : '-'}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitFee)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.totalFee)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.status === 'PAID'
                          ? 'success'
                          : item.status === 'DENIED'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Status History */}
      {claim.statusHistory && claim.statusHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Status History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {claim.statusHistory.map((history, index) => {
                const HistoryIcon = CLAIM_STATUSES[history.status]?.icon;
                return (
                <div key={history.id} className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    {HistoryIcon && (
                      <HistoryIcon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{CLAIM_STATUSES[history.status]?.label || history.status}</p>
                      <p className="text-sm text-muted-foreground">{formatDateTime(history.changedAt)}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">By: {history.changedBy}</p>
                    {history.notes && (
                      <p className="text-sm mt-1">{history.notes}</p>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appeal Dialog */}
      <Dialog open={showAppealDialog} onOpenChange={setShowAppealDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File Appeal</DialogTitle>
            <DialogDescription>
              Provide a reason for appealing this denied claim.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter appeal reason..."
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAppealDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleAction('appeal', { appealReason })}
              disabled={processing || !appealReason.trim()}
            >
              {processing ? 'Filing...' : 'File Appeal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void Confirmation */}
      <AlertDialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Claim</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to void claim {claim.claimNumber}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter reason for voiding..."
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAction('void', { voidReason })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={processing}
            >
              {processing ? 'Voiding...' : 'Void Claim'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
