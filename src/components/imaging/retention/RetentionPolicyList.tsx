'use client';

/**
 * RetentionPolicyList Component
 *
 * Displays and manages image retention policies with CRUD operations.
 */

import { useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Check,
  Shield,
  Clock,
  Archive,
  Bell,
  Image as ImageIcon,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { cn } from '@/lib/utils';
import type { RetentionPolicy } from '@/hooks/use-retention';

const CATEGORY_LABELS: Record<string, string> = {
  EXTRAORAL_PHOTO: 'Extraoral',
  INTRAORAL_PHOTO: 'Intraoral',
  PANORAMIC_XRAY: 'Panoramic',
  CEPHALOMETRIC_XRAY: 'Ceph',
  PERIAPICAL_XRAY: 'Periapical',
  CBCT: 'CBCT',
  SCAN_3D: '3D Scan',
  OTHER: 'Other',
};

interface RetentionPolicyListProps {
  policies: RetentionPolicy[];
  loading?: boolean;
  error?: string | null;
  onCreatePolicy: () => void;
  onEditPolicy: (policy: RetentionPolicy) => void;
  onSetDefault: (policyId: string) => Promise<void>;
  onToggleActive: (policy: RetentionPolicy) => Promise<void>;
  onDeletePolicy: (policyId: string) => Promise<boolean>;
}

export function RetentionPolicyList({
  policies,
  loading = false,
  error,
  onCreatePolicy,
  onEditPolicy,
  onSetDefault,
  onToggleActive,
  onDeletePolicy,
}: RetentionPolicyListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<RetentionPolicy | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (policy: RetentionPolicy) => {
    setPolicyToDelete(policy);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!policyToDelete) return;

    setDeleting(true);
    const success = await onDeletePolicy(policyToDelete.id);
    setDeleting(false);

    if (success) {
      setDeleteDialogOpen(false);
      setPolicyToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (policies.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No retention policies</h3>
          <p className="text-muted-foreground mb-4">
            Create retention policies to manage image storage and comply with regulations.
          </p>
          <Button onClick={onCreatePolicy}>
            <Plus className="h-4 w-4 mr-2" />
            Create Policy
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {policies.map((policy) => (
          <Card
            key={policy.id}
            className={cn('relative', !policy.isActive && 'opacity-60')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                    {policy.name}
                    {policy.isDefault && (
                      <Badge variant="soft-primary">Default</Badge>
                    )}
                    {!policy.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </CardTitle>
                  {policy.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {policy.description}
                    </p>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditPolicy(policy)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {!policy.isDefault && (
                      <DropdownMenuItem onClick={() => onSetDefault(policy.id)}>
                        <Check className="h-4 w-4 mr-2" />
                        Set as Default
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onToggleActive(policy)}>
                      {policy.isActive ? 'Deactivate' : 'Activate'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDeleteClick(policy)}
                      disabled={policy.imageCount > 0 || policy.isDefault}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent>
              {/* Retention settings */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>
                    Retain for <strong className="text-foreground">{policy.retentionYears}</strong> years
                    {policy.retentionForMinorsYears && (
                      <span className="ml-1">
                        (minors: {policy.retentionForMinorsYears}+ years after 21)
                      </span>
                    )}
                  </span>
                </div>

                {policy.archiveAfterYears && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Archive className="h-4 w-4 flex-shrink-0" />
                    <span>
                      Archive after <strong className="text-foreground">{policy.archiveAfterYears}</strong> years
                    </span>
                  </div>
                )}

                {policy.notifyBeforeArchive && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Bell className="h-4 w-4 flex-shrink-0" />
                    <span>
                      Notify <strong className="text-foreground">{policy.notifyBeforeArchive}</strong> days before archival
                    </span>
                  </div>
                )}

                {policy.autoExtendOnAccess && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="h-4 w-4 flex-shrink-0" />
                    <span>Auto-extend on access</span>
                  </div>
                )}
              </div>

              {/* Categories */}
              {policy.imageCategories.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">Applies to:</p>
                  <div className="flex flex-wrap gap-1">
                    {policy.imageCategories.map((cat) => (
                      <Badge key={cat} variant="outline" className="text-xs">
                        {CATEGORY_LABELS[cat] || cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {policy.imageCategories.length === 0 && (
                <div className="mt-4">
                  <Badge variant="soft-primary" className="text-xs">
                    All image categories
                  </Badge>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ImageIcon className="h-4 w-4" />
                  {policy.imageCount} images
                </span>
                <span className="text-xs">
                  Created by {policy.createdBy.firstName} {policy.createdBy.lastName}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Retention Policy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the policy &quot;{policyToDelete?.name}&quot;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
