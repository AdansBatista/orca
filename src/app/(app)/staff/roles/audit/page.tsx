'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Key,
  RefreshCw,
  Calendar,
  Filter,
  ExternalLink,
} from 'lucide-react';

import { PageHeader, PageContent, StatsRow } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

interface RoleChangeHistory {
  id: string;
  roleId: string;
  changeType: string;
  changeData: Record<string, unknown>;
  description: string | null;
  changedById: string;
  changedByName: string | null;
  changedAt: string;
  role: {
    id: string;
    name: string;
    code: string;
  };
}

interface AuditStats {
  created: number;
  updated: number;
  deleted: number;
  permissionChanges: number;
}

const CHANGE_TYPES = [
  { value: 'CREATE', label: 'Created', icon: Plus, variant: 'success' as const },
  { value: 'UPDATE', label: 'Updated', icon: Edit, variant: 'info' as const },
  { value: 'DELETE', label: 'Deleted', icon: Trash2, variant: 'destructive' as const },
  { value: 'PERMISSION_CHANGE', label: 'Permission Change', icon: Key, variant: 'warning' as const },
];

export default function RoleAuditPage() {
  const [items, setItems] = useState<RoleChangeHistory[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const [changeTypeFilter, setChangeTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [selectedItem, setSelectedItem] = useState<RoleChangeHistory | null>(null);

  const fetchAuditData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (changeTypeFilter && changeTypeFilter !== 'all') {
        params.set('changeType', changeTypeFilter);
      }
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const response = await fetch(`/api/roles/audit?${params}`);
      const data = await response.json();

      if (data.success) {
        setItems(data.data.items);
        setTotal(data.data.total);
        setStats(data.data.stats);
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load audit data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, changeTypeFilter, startDate, endDate]);

  useEffect(() => {
    fetchAuditData();
  }, [fetchAuditData]);

  const totalPages = Math.ceil(total / pageSize);

  const getChangeTypeInfo = (changeType: string) => {
    return CHANGE_TYPES.find((t) => t.value === changeType) || {
      label: changeType,
      icon: Edit,
      variant: 'default' as const,
    };
  };

  const formatChangeData = (changeData: Record<string, unknown>) => {
    const keys = Object.keys(changeData);
    if (keys.length === 0) return 'No details';
    if (keys.length <= 2) {
      return keys.map((k) => `${k}: ${JSON.stringify(changeData[k])}`).join(', ');
    }
    return `${keys.length} fields changed`;
  };

  return (
    <>
      <PageHeader
        title="Access Audit Log"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Staff', href: '/staff' },
          { label: 'Roles', href: '/staff/roles' },
          { label: 'Audit Log' },
        ]}
        actions={
          <Button variant="outline" onClick={fetchAuditData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Stats */}
          {stats && (
            <StatsRow>
              <StatCard accentColor="success">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Roles Created</p>
                    <p className="text-lg font-bold">{stats.created}</p>
                  </div>
                  <Plus className="h-5 w-5 text-success-500" />
                </div>
              </StatCard>
              <StatCard accentColor="primary">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Roles Updated</p>
                    <p className="text-lg font-bold">{stats.updated}</p>
                  </div>
                  <Edit className="h-5 w-5 text-primary-500" />
                </div>
              </StatCard>
              <StatCard accentColor="warning">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Permission Changes</p>
                    <p className="text-lg font-bold">{stats.permissionChanges}</p>
                  </div>
                  <Key className="h-5 w-5 text-warning-500" />
                </div>
              </StatCard>
              <StatCard accentColor="error">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Roles Deleted</p>
                    <p className="text-lg font-bold">{stats.deleted}</p>
                  </div>
                  <Trash2 className="h-5 w-5 text-error-500" />
                </div>
              </StatCard>
            </StatsRow>
          )}

          {/* Filters */}
          <Card variant="ghost">
            <CardContent className="p-4">
              <div className="flex items-end gap-4 flex-wrap">
                <FormField label="Change Type">
                  <Select value={changeTypeFilter} onValueChange={setChangeTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Changes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Changes</SelectItem>
                      {CHANGE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Start Date">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-[160px]"
                  />
                </FormField>
                <FormField label="End Date">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-[160px]"
                  />
                </FormField>
                <Button
                  variant="outline"
                  onClick={() => {
                    setChangeTypeFilter('');
                    setStartDate('');
                    setEndDate('');
                    setPage(1);
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Audit Table */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">{total} Audit Entries</CardTitle>
            </CardHeader>
            <CardContent compact>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Change Type</TableHead>
                    <TableHead>Changed By</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No audit entries found
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => {
                      const typeInfo = getChangeTypeInfo(item.changeType);
                      const TypeIcon = typeInfo.icon;
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium">
                                {format(new Date(item.changedAt), 'MMM d, yyyy')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(item.changedAt), 'h:mm a')}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/staff/roles/${item.role.id}`}
                              className="flex items-center gap-2 hover:text-primary-600"
                            >
                              <Shield className="h-4 w-4" />
                              <div>
                                <p className="font-medium">{item.role.name}</p>
                                <p className="text-xs text-muted-foreground">{item.role.code}</p>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant={typeInfo.variant} className="gap-1">
                              <TypeIcon className="h-3 w-3" />
                              {typeInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {item.changedByName || 'System'}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {item.description || formatChangeData(item.changeData)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedItem(item)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
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
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
      </PageContent>

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Audit Entry Details</DialogTitle>
            <DialogDescription>
              {selectedItem && format(new Date(selectedItem.changedAt), 'MMMM d, yyyy h:mm a')}
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium">{selectedItem.role.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Change Type</p>
                  <Badge variant={getChangeTypeInfo(selectedItem.changeType).variant}>
                    {getChangeTypeInfo(selectedItem.changeType).label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Changed By</p>
                  <p className="font-medium">{selectedItem.changedByName || 'System'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{selectedItem.description || 'No description'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Change Data</p>
                <pre className="p-3 rounded-lg bg-muted text-xs overflow-auto max-h-48">
                  {JSON.stringify(selectedItem.changeData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
