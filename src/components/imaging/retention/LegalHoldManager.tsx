'use client';

/**
 * LegalHoldManager Component
 *
 * Manages legal holds on images - view active holds, add new holds, remove holds.
 */

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Scale,
  Plus,
  X,
  Search,
  Calendar,
  User,
  FileImage,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface LegalHoldImage {
  id: string;
  fileName: string;
  category: string;
  legalHoldSetAt: string;
  legalHoldReason: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  legalHoldSetBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface PaginatedLegalHolds {
  items: LegalHoldImage[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface LegalHoldManagerProps {
  onSetLegalHold?: (imageId: string, reason: string) => Promise<boolean>;
  onRemoveLegalHold?: (imageId: string, reason?: string) => Promise<boolean>;
}

export function LegalHoldManager({
  onSetLegalHold,
  onRemoveLegalHold,
}: LegalHoldManagerProps) {
  const [data, setData] = useState<PaginatedLegalHolds | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Remove hold dialog
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedHold, setSelectedHold] = useState<LegalHoldImage | null>(null);
  const [removeReason, setRemoveReason] = useState('');
  const [removing, setRemoving] = useState(false);

  // Add hold dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newHoldImageId, setNewHoldImageId] = useState('');
  const [newHoldReason, setNewHoldReason] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const fetchLegalHolds = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '20');

      const response = await fetch(`/api/imaging/retention/legal-hold?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch legal holds');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLegalHolds();
  }, [fetchLegalHolds]);

  const handleRemoveClick = (hold: LegalHoldImage) => {
    setSelectedHold(hold);
    setRemoveReason('');
    setRemoveDialogOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (!selectedHold || !onRemoveLegalHold) return;

    setRemoving(true);
    const success = await onRemoveLegalHold(selectedHold.id, removeReason || undefined);
    setRemoving(false);

    if (success) {
      setRemoveDialogOpen(false);
      setSelectedHold(null);
      fetchLegalHolds();
    }
  };

  const handleAddLegalHold = async () => {
    if (!newHoldImageId.trim() || !newHoldReason.trim() || !onSetLegalHold) return;

    setAdding(true);
    setAddError(null);

    const success = await onSetLegalHold(newHoldImageId.trim(), newHoldReason.trim());

    if (success) {
      setAddDialogOpen(false);
      setNewHoldImageId('');
      setNewHoldReason('');
      fetchLegalHolds();
    } else {
      setAddError('Failed to set legal hold. Please verify the image ID and try again.');
    }
    setAdding(false);
  };

  // Filter records by search (client-side)
  const filteredHolds = data?.items.filter((hold) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      hold.fileName.toLowerCase().includes(searchLower) ||
      `${hold.patient.firstName} ${hold.patient.lastName}`.toLowerCase().includes(searchLower) ||
      hold.legalHoldReason?.toLowerCase().includes(searchLower)
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
          <h3 className="text-lg font-semibold mb-2">Failed to load legal holds</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchLegalHolds}>
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
              <Scale className="h-5 w-5" />
              Legal Holds
              {data && data.total > 0 && (
                <Badge variant="secondary">{data.total}</Badge>
              )}
            </CardTitle>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search holds..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {onSetLegalHold && (
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Hold
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Info Alert */}
          <Alert className="mb-4">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Images under legal hold cannot be archived, modified, or deleted until the hold is
              removed. Always document the reason for setting or removing a legal hold.
            </AlertDescription>
          </Alert>

          {filteredHolds?.length === 0 ? (
            <div className="text-center py-8">
              <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No legal holds</h3>
              <p className="text-muted-foreground">
                {search
                  ? 'No holds match your search'
                  : 'No images are currently under legal hold'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Hold Set By</TableHead>
                      <TableHead>Date Set</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHolds?.map((hold) => (
                      <TableRow key={hold.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileImage className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{hold.fileName}</p>
                              <p className="text-xs text-muted-foreground">{hold.category}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <PhiProtected fakeData={getFakeName()}>
                            {hold.patient.firstName} {hold.patient.lastName}
                          </PhiProtected>
                        </TableCell>
                        <TableCell>
                          {hold.legalHoldSetBy ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {hold.legalHoldSetBy.firstName} {hold.legalHoldSetBy.lastName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(hold.legalHoldSetAt), 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground line-clamp-2">
                            {hold.legalHoldReason || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {onRemoveLegalHold && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveClick(hold)}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Remove
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
                    {data.total} holds
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

      {/* Remove Hold Confirmation Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Legal Hold</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the legal hold from the image. The image will then be subject to
              normal retention policies and may be archived or deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedHold && (
            <div className="py-4 space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium">{selectedHold.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  Patient:{' '}
                  <PhiProtected fakeData={getFakeName()}>
                    {selectedHold.patient.firstName} {selectedHold.patient.lastName}
                  </PhiProtected>
                </p>
                {selectedHold.legalHoldReason && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Current reason: {selectedHold.legalHoldReason}
                  </p>
                )}
              </div>

              <FormField label="Reason for Removal" description="Document why the legal hold is being removed">
                <Textarea
                  placeholder="e.g., Litigation concluded, Case dismissed..."
                  value={removeReason}
                  onChange={(e) => setRemoveReason(e.target.value)}
                  rows={3}
                />
              </FormField>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing ? 'Removing...' : 'Remove Hold'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Legal Hold Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Legal Hold</DialogTitle>
            <DialogDescription>
              Place a legal hold on an image to prevent it from being archived, modified, or
              deleted. You must provide a reason for the hold.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {addError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{addError}</AlertDescription>
              </Alert>
            )}

            <FormField label="Image ID" required description="Enter the unique ID of the image">
              <Input
                placeholder="Image ID"
                value={newHoldImageId}
                onChange={(e) => setNewHoldImageId(e.target.value)}
              />
            </FormField>

            <FormField label="Reason for Legal Hold" required description="Document why this hold is being placed">
              <Textarea
                placeholder="e.g., Subject to pending litigation, Discovery request..."
                value={newHoldReason}
                onChange={(e) => setNewHoldReason(e.target.value)}
                rows={3}
              />
            </FormField>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} disabled={adding}>
              Cancel
            </Button>
            <Button
              onClick={handleAddLegalHold}
              disabled={adding || !newHoldImageId.trim() || !newHoldReason.trim()}
            >
              {adding ? 'Adding...' : 'Add Legal Hold'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
