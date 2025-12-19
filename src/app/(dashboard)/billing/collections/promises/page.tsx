'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Filter, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface PaymentPromise {
  id: string;
  promisedAmount: number;
  promisedDate: string;
  status: string;
  notes: string | null;
  fulfilledAmount: number | null;
  fulfilledAt: string | null;
  brokenReason: string | null;
  accountCollection?: {
    id: string;
    account: {
      id: string;
      accountNumber: string;
      patient: {
        id: string;
        firstName: string;
        lastName: string;
      };
    };
  };
}

export default function PaymentPromisesPage() {
  const [promises, setPromises] = useState<PaymentPromise[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<{
    pending: number;
    fulfilled: number;
    broken: number;
    totalPromised: number;
  }>({ pending: 0, fulfilled: 0, broken: 0, totalPromised: 0 });

  useEffect(() => {
    fetchPromises();
  }, [status, page]);

  async function fetchPromises() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '20',
      });
      if (status) params.set('status', status);

      const res = await fetch(`/api/collections/promises?${params}`);
      const data = await res.json();

      if (data.success) {
        setPromises(data.data.items);
        setTotalPages(data.data.totalPages);
        setTotal(data.data.total);
        setSummary(data.data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch promises:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string): "success" | "info" | "warning" | "destructive" | "secondary" {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'FULFILLED':
        return 'success';
      case 'PARTIAL':
        return 'info';
      case 'BROKEN':
        return 'destructive';
      case 'EXPIRED':
        return 'secondary';
      default:
        return 'secondary';
    }
  }

  function isOverdue(promisedDate: string, status: string) {
    if (status !== 'PENDING') return false;
    return new Date(promisedDate) < new Date();
  }

  async function handleMarkFulfilled(promiseId: string) {
    const amount = prompt('Enter fulfilled amount:');
    if (!amount) return;

    try {
      const res = await fetch(`/api/collections/promises/${promiseId}?action=fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });

      if (res.ok) {
        fetchPromises();
      }
    } catch (error) {
      console.error('Failed to mark fulfilled:', error);
    }
  }

  async function handleMarkBroken(promiseId: string) {
    const reason = prompt('Enter reason for broken promise:');
    if (!reason) return;

    try {
      const res = await fetch(`/api/collections/promises/${promiseId}?action=broken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        fetchPromises();
      }
    } catch (error) {
      console.error('Failed to mark broken:', error);
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
          <h1 className="text-2xl font-semibold">Payment Promises</h1>
          <p className="text-muted-foreground">
            Track and manage patient payment commitments
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
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
              <p className="text-sm text-muted-foreground">Fulfilled</p>
              <p className="text-2xl font-bold">{summary.fulfilled}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Broken</p>
              <p className="text-2xl font-bold">{summary.broken}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-full bg-primary/10">
              <AlertTriangle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Promised</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.totalPromised)}</p>
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
                <SelectItem value="FULFILLED">Fulfilled</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="BROKEN">Broken</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" onClick={() => setStatus('')}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Promises Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Promises ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading promises...
            </div>
          ) : promises.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payment promises found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Promise Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promises.map((promise) => (
                    <TableRow key={promise.id}>
                      <TableCell>
                        {promise.accountCollection && (
                          <Link
                            href={`/billing/accounts/${promise.accountCollection.account.id}`}
                            className="text-primary hover:underline"
                          >
                            {promise.accountCollection.account.accountNumber}
                          </Link>
                        )}
                      </TableCell>
                      <TableCell>
                        {promise.accountCollection && (
                          <PhiProtected fakeData={getFakeName()}>
                            {promise.accountCollection.account.patient.firstName}{' '}
                            {promise.accountCollection.account.patient.lastName}
                          </PhiProtected>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(promise.promisedAmount)}
                        {promise.fulfilledAmount !== null && promise.fulfilledAmount > 0 && (
                          <span className="text-sm text-muted-foreground ml-2">
                            (Paid: {formatCurrency(promise.fulfilledAmount)})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {new Date(promise.promisedDate).toLocaleDateString()}
                          {isOverdue(promise.promisedDate, promise.status) && (
                            <Badge variant="destructive" size="sm">Overdue</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(promise.status)}>
                          {promise.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-48 truncate text-sm text-muted-foreground">
                        {promise.notes || promise.brokenReason || '-'}
                      </TableCell>
                      <TableCell>
                        {promise.status === 'PENDING' && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600"
                              onClick={() => handleMarkFulfilled(promise.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => handleMarkBroken(promise.id)}
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
