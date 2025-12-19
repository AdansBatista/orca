'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Filter, RefreshCw } from 'lucide-react';

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

interface AgingAccount {
  id: string;
  accountNumber: string;
  currentBalance: number;
  patientBalance: number;
  insuranceBalance: number;
  aging0: number;
  aging30: number;
  aging60: number;
  aging90: number;
  aging120: number;
  daysOverdue: number;
  agingBucket: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface AgingSummary {
  totalAR: number;
  patientAR: number;
  insuranceAR: number;
  buckets: {
    current: number;
    days1_30: number;
    days31_60: number;
    days61_90: number;
    days91_120: number;
    days120Plus: number;
  };
  accountCount: number;
  avgDaysOutstanding: number;
}

export default function AgingReportPage() {
  const [accounts, setAccounts] = useState<AgingAccount[]>([]);
  const [summary, setSummary] = useState<AgingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [arType, setArType] = useState<string>('ALL');
  const [minBalance, setMinBalance] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAgingReport();
  }, [arType, minBalance, page]);

  async function fetchAgingReport() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        arType,
        page: String(page),
        pageSize: '50',
      });
      if (minBalance) params.set('minBalance', minBalance);

      const res = await fetch(`/api/collections/aging?${params}`);
      const data = await res.json();

      if (data.success) {
        setAccounts(data.data.items);
        setSummary(data.data.summary);
        setTotalPages(data.data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch aging report:', error);
    } finally {
      setLoading(false);
    }
  }

  function getBucketColor(bucket: string): "success" | "info" | "warning" | "destructive" | "secondary" {
    switch (bucket) {
      case 'CURRENT':
        return 'success';
      case '1_30':
        return 'info';
      case '31_60':
        return 'warning';
      case '61_90':
        return 'warning';
      case '91_120':
        return 'destructive';
      case '120_PLUS':
        return 'destructive';
      default:
        return 'secondary';
    }
  }

  function getBucketLabel(bucket: string) {
    switch (bucket) {
      case 'CURRENT':
        return 'Current';
      case '1_30':
        return '1-30 Days';
      case '31_60':
        return '31-60 Days';
      case '61_90':
        return '61-90 Days';
      case '91_120':
        return '91-120 Days';
      case '120_PLUS':
        return '120+ Days';
      default:
        return bucket;
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
          <h1 className="text-2xl font-semibold">AR Aging Report</h1>
          <p className="text-muted-foreground">
            Accounts receivable aging analysis
          </p>
        </div>
        <Button variant="outline" onClick={fetchAgingReport}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-6 gap-4">
          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">Current</p>
              <p className="text-xl font-bold">{formatCurrency(summary.buckets.current)}</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">1-30 Days</p>
              <p className="text-xl font-bold">{formatCurrency(summary.buckets.days1_30)}</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">31-60 Days</p>
              <p className="text-xl font-bold">{formatCurrency(summary.buckets.days31_60)}</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm font-medium text-orange-700 dark:text-orange-400">61-90 Days</p>
              <p className="text-xl font-bold">{formatCurrency(summary.buckets.days61_90)}</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 dark:bg-red-950/20 border-red-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">91-120 Days</p>
              <p className="text-xl font-bold">{formatCurrency(summary.buckets.days91_120)}</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm font-medium text-purple-700 dark:text-purple-400">120+ Days</p>
              <p className="text-xl font-bold">{formatCurrency(summary.buckets.days120Plus)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Select value={arType} onValueChange={setArType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="AR Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All AR</SelectItem>
                <SelectItem value="PATIENT">Patient AR</SelectItem>
                <SelectItem value="INSURANCE">Insurance AR</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Min Balance"
              value={minBalance}
              onChange={(e) => setMinBalance(e.target.value)}
              className="w-32"
            />
            <Button variant="ghost" onClick={() => { setArType('ALL'); setMinBalance(''); }}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Accounts ({summary?.accountCount || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading aging report...
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No accounts found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">1-30</TableHead>
                    <TableHead className="text-right">31-60</TableHead>
                    <TableHead className="text-right">61-90</TableHead>
                    <TableHead className="text-right">91-120</TableHead>
                    <TableHead className="text-right">120+</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <Link
                          href={`/billing/accounts/${account.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {account.accountNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <PhiProtected fakeData={getFakeName()}>
                          {account.patient.firstName} {account.patient.lastName}
                        </PhiProtected>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(account.aging0 || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(account.aging30 || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(account.aging60 || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(account.aging90 || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(account.aging120 || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(0)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(account.currentBalance)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getBucketColor(account.agingBucket)}>
                          {getBucketLabel(account.agingBucket)}
                        </Badge>
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
