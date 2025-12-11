'use client';

/**
 * ArchiveManagement Component
 *
 * Manages archived images: view, restore, and track archive history.
 */

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Archive,
  RotateCcw,
  Search,
  Filter,
  Calendar,
  User,
  FileImage,
  History,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';
import type { ArchiveRecord } from '@/hooks/use-retention';

const ACTION_LABELS: Record<string, string> = {
  ARCHIVED: 'Archived',
  RESTORED: 'Restored',
  DELETED: 'Deleted',
  LEGAL_HOLD_SET: 'Legal Hold Set',
  LEGAL_HOLD_REMOVED: 'Legal Hold Removed',
  RETENTION_EXTENDED: 'Retention Extended',
};

const ACTION_VARIANTS: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  ARCHIVED: 'secondary',
  RESTORED: 'success',
  DELETED: 'destructive',
  LEGAL_HOLD_SET: 'warning',
  LEGAL_HOLD_REMOVED: 'default',
  RETENTION_EXTENDED: 'default',
};

interface PaginatedArchiveHistory {
  items: ArchiveRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ArchiveManagementProps {
  onRestoreImage?: (imageId: string, reason?: string) => Promise<boolean>;
}

export function ArchiveManagement({ onRestoreImage }: ArchiveManagementProps) {
  const [data, setData] = useState<PaginatedArchiveHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);

  // Restore dialog
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ArchiveRecord | null>(null);
  const [restoreReason, setRestoreReason] = useState('');
  const [restoring, setRestoring] = useState(false);

  const fetchArchiveHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (actionFilter) params.set('action', actionFilter);
      params.set('page', String(page));
      params.set('pageSize', '20');

      const response = await fetch(`/api/imaging/retention/archive?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch archive history');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, page]);

  useEffect(() => {
    fetchArchiveHistory();
  }, [fetchArchiveHistory]);

  const handleRestore = (record: ArchiveRecord) => {
    setSelectedRecord(record);
    setRestoreReason('');
    setRestoreDialogOpen(true);
  };

  const handleConfirmRestore = async () => {
    if (!selectedRecord || !onRestoreImage) return;

    setRestoring(true);
    const success = await onRestoreImage(selectedRecord.image.id, restoreReason || undefined);
    setRestoring(false);

    if (success) {
      setRestoreDialogOpen(false);
      setSelectedRecord(null);
      fetchArchiveHistory();
    }
  };

  const handleFilterChange = (value: string) => {
    setActionFilter(value === 'all' ? '' : value);
    setPage(1);
  };

  // Filter records by search (client-side for simplicity)
  const filteredRecords = data?.items.filter((record) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      record.image.fileName.toLowerCase().includes(searchLower) ||
      `${record.image.patient.firstName} ${record.image.patient.lastName}`
        .toLowerCase()
        .includes(searchLower)
    );
  });

  if (loading && !data) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-9 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-warning-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load archive history</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchArchiveHistory}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              Archive History
            </CardTitle>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by file or patient..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={actionFilter || 'all'} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                  <SelectItem value="RESTORED">Restored</SelectItem>
                  <SelectItem value="LEGAL_HOLD_SET">Legal Hold Set</SelectItem>
                  <SelectItem value="LEGAL_HOLD_REMOVED">Legal Hold Removed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredRecords?.length === 0 ? (
            <div className="text-center py-8">
              <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No archive records found</h3>
              <p className="text-muted-foreground">
                {search || actionFilter
                  ? 'Try adjusting your filters'
                  : 'Archive activity will appear here'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Performed By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords?.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <Badge variant={ACTION_VARIANTS[record.action] || 'default'}>
                            {ACTION_LABELS[record.action] || record.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileImage className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{record.image.fileName}</p>
                              <p className="text-xs text-muted-foreground">{record.image.category}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <PhiProtected fakeData={getFakeName()}>
                            {record.image.patient.firstName} {record.image.patient.lastName}
                          </PhiProtected>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {record.performedBy.firstName} {record.performedBy.lastName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(record.actionAt), 'MMM d, yyyy HH:mm')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground line-clamp-2">
                            {record.reason || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {record.action === 'ARCHIVED' && onRestoreImage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRestore(record)}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Restore
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of{' '}
                    {data.total} records
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {page} of {data.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === data.totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Restore Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Archived Image</DialogTitle>
            <DialogDescription>
              This will restore the image from cold storage to active storage. The image will
              become immediately accessible.
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="py-4 space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium">{selectedRecord.image.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  Patient:{' '}
                  <PhiProtected fakeData={getFakeName()}>
                    {selectedRecord.image.patient.firstName}{' '}
                    {selectedRecord.image.patient.lastName}
                  </PhiProtected>
                </p>
              </div>

              <FormField label="Reason for Restoration" description="Optional - document why this image is being restored">
                <Textarea
                  placeholder="e.g., Patient requested copies, needed for legal review..."
                  value={restoreReason}
                  onChange={(e) => setRestoreReason(e.target.value)}
                  rows={3}
                />
              </FormField>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialogOpen(false)} disabled={restoring}>
              Cancel
            </Button>
            <Button onClick={handleConfirmRestore} disabled={restoring}>
              {restoring ? 'Restoring...' : 'Restore Image'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
