'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface WriteOff {
  id: string;
  writeOffNumber: string;
  amount: number;
  reason: string;
  reasonDetails: string | null;
  status: string;
  requestedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  recoveredAmount: number;
  account?: {
    id: string;
    accountNumber: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
}

export default function WriteOffsPage() {
  const [writeOffs, setWriteOffs] = useState<WriteOff[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<{
    pending: number;
    approvedTotal: number;
    rejected: number;
  }>({ pending: 0, approvedTotal: 0, rejected: 0 });

  useEffect(() => {
    fetchWriteOffs();
  }, [status, reason, page]);

  async function fetchWriteOffs() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '20',
      });
      if (status) params.set('status', status);
      if (reason) params.set('reason', reason);

      const res = await fetch(`/api/collections/write-offs?${params}`);
      const data = await res.json();

      if (data.success) {
        setWriteOffs(data.data.items);
        setTotalPages(data.data.totalPages);
        setTotal(data.data.total);
        setSummary(data.data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch write-offs:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string): "success" | "info" | "warning" | "destructive" | "secondary" {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'destructive';
      case 'PARTIALLY_RECOVERED':
        return 'info';
      case 'FULLY_RECOVERED':
        return 'success';
      default:
        return 'secondary';
    }
  }

  function getReasonLabel(reason: string) {
    switch (reason) {
      case 'BANKRUPTCY':
        return 'Bankruptcy';
      case 'DECEASED':
        return 'Deceased';
      case 'UNCOLLECTIBLE':
        return 'Uncollectible';
      case 'STATUTE_OF_LIMITATIONS':
        return 'Statute of Limitations';
      case 'SMALL_BALANCE':
        return 'Small Balance';
      case 'HARDSHIP':
        return 'Financial Hardship';
      case 'OTHER':
        return 'Other';
      default:
        return reason;
    }
  }

  async function handleApprove(writeOffId: string) {
    try {
      const res = await fetch(`/api/collections/write-offs/${writeOffId}?action=approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Approved via workqueue' }),
      });

      if (res.ok) {
        fetchWriteOffs();
      }
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  }

  async function handleReject(writeOffId: string) {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const res = await fetch(`/api/collections/write-offs/${writeOffId}?action=reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        fetchWriteOffs();
      }
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/billing/collections">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Write-offs</h1>
          <p className="text-muted-foreground">
            Manage bad debt write-off requests
          </p>
        </div>
        <Button asChild>
          <Link href="/billing/collections/write-offs/new">
            <Plus className="mr-2 h-4 w-4" />
            Request Write-off
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Approval</p>
              <p className="text-2xl font-bold">{summary.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Approved</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.approvedTotal)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold">{summary.rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="PARTIALLY_RECOVERED">Partially Recovered</SelectItem>
                <SelectItem value="FULLY_RECOVERED">Fully Recovered</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Reasons</SelectItem>
                <SelectItem value="BANKRUPTCY">Bankruptcy</SelectItem>
                <SelectItem value="DECEASED">Deceased</SelectItem>
                <SelectItem value="UNCOLLECTIBLE">Uncollectible</SelectItem>
                <SelectItem value="SMALL_BALANCE">Small Balance</SelectItem>
                <SelectItem value="HARDSHIP">Hardship</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" onClick={() => { setStatus(''); setReason(''); }}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Write-offs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Write-offs ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading write-offs...
            </div>
          ) : writeOffs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No write-offs found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {writeOffs.map((writeOff) => (
                    <TableRow key={writeOff.id}>
                      <TableCell className="font-medium">
                        {writeOff.writeOffNumber}
                      </TableCell>
                      <TableCell>
                        {writeOff.account && (
                          <Link
                            href={`/billing/accounts/${writeOff.account.id}`}
                            className="text-primary hover:underline"
                          >
                            {writeOff.account.accountNumber}
                          </Link>
                        )}
                      </TableCell>
                      <TableCell>
                        {writeOff.account && (
                          <PhiProtected fakeData={getFakeName()}>
                            {writeOff.account.patient.firstName} {writeOff.account.patient.lastName}
                          </PhiProtected>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(writeOff.amount)}
                      </TableCell>
                      <TableCell>{getReasonLabel(writeOff.reason)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(writeOff.requestedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(writeOff.status)}>
                          {writeOff.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {writeOff.status === 'PENDING' && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600"
                              onClick={() => handleApprove(writeOff.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => handleReject(writeOff.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
