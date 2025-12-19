'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Filter, Phone, Mail, Clock, DollarSign, MoreHorizontal } from 'lucide-react';

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/utils';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName, getFakePhone, getFakeEmail } from '@/lib/fake-data';

interface CollectionAccount {
  id: string;
  status: string;
  currentStage: number;
  startingBalance: number;
  currentBalance: number;
  paidAmount: number;
  startedAt: string;
  lastActionAt: string | null;
  account: {
    id: string;
    accountNumber: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
  };
  workflow: {
    id: string;
    name: string;
  };
  _count: {
    activities: number;
    promises: number;
  };
}

export default function CollectionWorkqueuePage() {
  const [accounts, setAccounts] = useState<CollectionAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('ACTIVE');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchAccounts();
  }, [status, search, page]);

  async function fetchAccounts() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '20',
      });
      if (status) params.set('status', status);
      if (search) params.set('search', search);

      const res = await fetch(`/api/collections/accounts?${params}`);
      const data = await res.json();

      if (data.success) {
        setAccounts(data.data.items);
        setTotalPages(data.data.totalPages);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string): "success" | "info" | "warning" | "destructive" | "secondary" | "soft-primary" {
    switch (status) {
      case 'ACTIVE':
        return 'info';
      case 'PAUSED':
        return 'warning';
      case 'PAYMENT_PLAN':
        return 'soft-primary';
      case 'SETTLED':
      case 'COMPLETED':
        return 'success';
      case 'WRITTEN_OFF':
        return 'secondary';
      case 'AGENCY':
        return 'destructive';
      default:
        return 'secondary';
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'PAUSED':
        return 'Paused';
      case 'PAYMENT_PLAN':
        return 'Payment Plan';
      case 'SETTLED':
        return 'Settled';
      case 'COMPLETED':
        return 'Completed';
      case 'WRITTEN_OFF':
        return 'Written Off';
      case 'AGENCY':
        return 'With Agency';
      default:
        return status;
    }
  }

  async function handleAction(accountId: string, action: string) {
    try {
      const res = await fetch(`/api/collections/accounts/${accountId}?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Manual action', notes: '' }),
      });

      if (res.ok) {
        fetchAccounts();
      }
    } catch (error) {
      console.error('Action failed:', error);
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
          <h1 className="text-2xl font-semibold">Collection Workqueue</h1>
          <p className="text-muted-foreground">
            Manage accounts in collection workflows
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Input
              placeholder="Search by account or patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
                <SelectItem value="PAYMENT_PLAN">Payment Plan</SelectItem>
                <SelectItem value="AGENCY">With Agency</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="WRITTEN_OFF">Written Off</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              onClick={() => {
                setStatus('ACTIVE');
                setSearch('');
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Accounts ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading accounts...
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
                    <TableHead>Contact</TableHead>
                    <TableHead>Workflow</TableHead>
                    <TableHead className="text-center">Stage</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Action</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <Link
                          href={`/billing/collections/accounts/${account.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {account.account.accountNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <PhiProtected fakeData={getFakeName()}>
                          {account.account.patient.firstName} {account.account.patient.lastName}
                        </PhiProtected>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {account.account.patient.phone && (
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Phone className="h-4 w-4" />
                            </Button>
                          )}
                          {account.account.patient.email && (
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{account.workflow.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">Stage {account.currentStage}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(account.currentBalance)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(account.paidAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(account.status)}>
                          {getStatusLabel(account.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {account.lastActionAt
                          ? new Date(account.lastActionAt).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/billing/collections/accounts/${account.id}`}>
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              Record Promise
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              Add Note
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {account.status === 'ACTIVE' && (
                              <>
                                <DropdownMenuItem onClick={() => handleAction(account.id, 'advance')}>
                                  Advance Stage
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAction(account.id, 'pause')}>
                                  Pause Collection
                                </DropdownMenuItem>
                              </>
                            )}
                            {account.status === 'PAUSED' && (
                              <DropdownMenuItem onClick={() => handleAction(account.id, 'resume')}>
                                Resume Collection
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              Send to Agency
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
