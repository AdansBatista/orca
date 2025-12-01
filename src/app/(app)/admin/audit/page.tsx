'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Shield,
  FileText,
  Users,
  Activity,
  Search,
  RefreshCw,
  Filter,
  Clock,
} from 'lucide-react';
import type { AuditLog } from '@prisma/client';

import { PageHeader, PageContent, StatsRow } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { FormField } from '@/components/ui/form-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface AuditSummary {
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  summary: {
    totalLogs: number;
    securityEvents: number;
    phiAccess: number;
  };
  byAction: Array<{ action: string; count: number }>;
  byEntity: Array<{ entity: string; count: number }>;
  topUsers: Array<{ userId: string; userName: string; count: number }>;
}

const actionVariants: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'destructive',
  READ: 'default',
  LOGIN: 'success',
  LOGOUT: 'default',
  LOGIN_FAILED: 'destructive',
  APPROVE: 'success',
  REJECT: 'warning',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (searchQuery) params.set('search', searchQuery);
      if (actionFilter) params.set('action', actionFilter);
      if (entityFilter) params.set('entity', entityFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const response = await fetch(`/api/audit?${params}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.data.items);
        setTotal(data.data.total);
      } else {
        toast({
          title: 'Error',
          description: data.error?.message || 'Failed to load audit logs',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load audit logs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, actionFilter, entityFilter, startDate, endDate]);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch('/api/audit/summary?days=7');
      const data = await response.json();

      if (data.success) {
        setSummary(data.data);
      }
    } catch {
      console.error('Failed to load audit summary');
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <PageHeader
        title="Audit Logs"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Admin' },
          { label: 'Audit Logs' },
        ]}
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Summary Stats */}
          {summary && (
            <StatsRow>
              <StatCard accentColor="primary">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Events (7 days)</p>
                    <p className="text-lg font-bold">{summary.summary.totalLogs.toLocaleString()}</p>
                  </div>
                  <Activity className="h-5 w-5 text-primary-500" />
                </div>
              </StatCard>
              <StatCard accentColor="warning">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Security Events</p>
                    <p className="text-lg font-bold">{summary.summary.securityEvents.toLocaleString()}</p>
                  </div>
                  <Shield className="h-5 w-5 text-warning-500" />
                </div>
              </StatCard>
              <StatCard accentColor="secondary">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">PHI Access</p>
                    <p className="text-lg font-bold">{summary.summary.phiAccess.toLocaleString()}</p>
                  </div>
                  <FileText className="h-5 w-5 text-secondary-500" />
                </div>
              </StatCard>
              <StatCard accentColor="accent">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Active Users</p>
                    <p className="text-lg font-bold">{summary.topUsers.length}</p>
                  </div>
                  <Users className="h-5 w-5 text-accent-500" />
                </div>
              </StatCard>
            </StatsRow>
          )}

          {/* Filters */}
          <Card variant="ghost">
            <CardContent className="p-4">
              <div className="flex items-end gap-4 flex-wrap">
                <FormField label="Search">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by user, entity..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </FormField>
                <FormField label="Action">
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="CREATE">Create</SelectItem>
                      <SelectItem value="UPDATE">Update</SelectItem>
                      <SelectItem value="DELETE">Delete</SelectItem>
                      <SelectItem value="READ">Read</SelectItem>
                      <SelectItem value="LOGIN">Login</SelectItem>
                      <SelectItem value="LOGOUT">Logout</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Entity">
                  <Input
                    placeholder="e.g., Patient, Role"
                    value={entityFilter}
                    onChange={(e) => setEntityFilter(e.target.value)}
                    className="w-[150px]"
                  />
                </FormField>
                <FormField label="Start Date">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </FormField>
                <FormField label="End Date">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </FormField>
                <Button variant="outline" onClick={fetchLogs}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Audit Log Table */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm" className="flex items-center justify-between">
                <span>Audit Log Entries</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {total} total entries
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent compact>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No audit logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            {format(new Date(log.occurredAt), 'MMM d, yyyy HH:mm:ss')}
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.userName ? (
                            <PhiProtected fakeData={getFakeName()}>
                              {log.userName}
                            </PhiProtected>
                          ) : (
                            <span className="text-muted-foreground">System</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={actionVariants[log.action] || 'default'}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.entity}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.entityId ? log.entityId.slice(-8) : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
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
            </CardContent>
          </Card>
        </div>

        {/* Detail Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Audit Log Details</DialogTitle>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Timestamp</p>
                    <p className="font-medium">
                      {format(new Date(selectedLog.occurredAt), 'PPpp')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Action</p>
                    <Badge variant={actionVariants[selectedLog.action] || 'default'}>
                      {selectedLog.action}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">User</p>
                    <p className="font-medium">
                      {selectedLog.userName ? (
                        <PhiProtected fakeData={getFakeName()}>
                          {selectedLog.userName}
                        </PhiProtected>
                      ) : (
                        'System'
                      )}
                    </p>
                    {selectedLog.userRole && (
                      <Badge variant="outline" className="mt-1">
                        {selectedLog.userRole}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Entity</p>
                    <p className="font-medium">{selectedLog.entity}</p>
                    {selectedLog.entityId && (
                      <p className="text-xs font-mono text-muted-foreground">
                        {selectedLog.entityId}
                      </p>
                    )}
                  </div>
                </div>

                {selectedLog.ipAddress && (
                  <div>
                    <p className="text-sm text-muted-foreground">IP Address</p>
                    <p className="font-mono text-sm">{selectedLog.ipAddress}</p>
                  </div>
                )}

                {selectedLog.details && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Details</p>
                    <Card variant="ghost">
                      <CardContent className="p-3">
                        <pre className="text-xs overflow-auto whitespace-pre-wrap">
                          {JSON.stringify(selectedLog.details, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </PageContent>
    </>
  );
}
