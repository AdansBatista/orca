'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Users,
  Lock,
  Edit,
  Trash2,
  ChevronRight,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName, getFakeEmail } from '@/lib/fake-data';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Assignment {
  id: string;
  assignedAt: string;
  user: User;
  staffProfileId: string | null;
  clinic: {
    id: string;
    name: string;
  };
}

interface Role {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isSystem: boolean;
  permissions: string[];
  assignmentCount: number;
  assignments?: Assignment[];
}

interface RoleDetailProps {
  roleId: string;
}

export function RoleDetail({ roleId }: RoleDetailProps) {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch role data
  useEffect(() => {
    const fetchRole = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/roles/${roleId}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch role');
        }

        setRole(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [roleId]);

  const handleDelete = async () => {
    if (!role) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete role');
      }

      toast.success('Role deleted successfully');
      router.push('/staff/roles');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete role');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Group permissions by category
  const groupPermissions = (permissions: string[]) => {
    const groups: Record<string, string[]> = {};
    for (const perm of permissions) {
      const [category] = perm.split(':');
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(perm);
    }
    return groups;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !role) {
    return (
      <Card variant="ghost">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-warning-500 mb-4" />
          <h3 className="font-semibold text-foreground mb-1">
            {error || 'Role not found'}
          </h3>
          <p className="text-muted-foreground mb-4">
            The role you're looking for doesn't exist or you don't have access.
          </p>
          <Link href="/staff/roles">
            <Button variant="outline">Back to Roles</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const permissionGroups = groupPermissions(role.permissions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            {role.isSystem ? (
              <Lock className="h-6 w-6" />
            ) : (
              <Shield className="h-6 w-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{role.name}</h1>
              {role.isSystem && (
                <Badge variant="soft-primary">System Role</Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {role.description || `Role code: ${role.code}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/staff/roles/${role.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          {!role.isSystem && (
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={role.assignmentCount > 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {role.permissions.length}
                </p>
                <p className="text-sm text-muted-foreground">Permissions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-100 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {role.assignmentCount}
                </p>
                <p className="text-sm text-muted-foreground">Users Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          {role.permissions.length === 0 ? (
            <p className="text-muted-foreground">
              No permissions assigned to this role.
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(permissionGroups).map(([category, perms]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-foreground capitalize mb-2">
                    {category}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {perms.map((perm) => (
                      <Badge key={perm} variant="outline">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assigned Users */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Assigned Users</CardTitle>
          {role.assignmentCount > 10 && (
            <span className="text-sm text-muted-foreground">
              Showing 10 of {role.assignmentCount}
            </span>
          )}
        </CardHeader>
        <CardContent>
          {!role.assignments || role.assignments.length === 0 ? (
            <p className="text-muted-foreground">
              No users are currently assigned this role.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {role.assignments.map((assignment) => {
                // Only link to staff profile if one exists, otherwise just display info
                const hasStaffProfile = !!assignment.staffProfileId;
                const content = (
                  <>
                    <div>
                      <p className="font-medium text-foreground">
                        <PhiProtected fakeData={getFakeName()}>
                          {assignment.user.firstName} {assignment.user.lastName}
                        </PhiProtected>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <PhiProtected fakeData={getFakeEmail()}>
                          {assignment.user.email}
                        </PhiProtected>
                      </p>
                    </div>
                    {hasStaffProfile && (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </>
                );

                if (hasStaffProfile) {
                  return (
                    <Link
                      key={assignment.id}
                      href={`/staff/${assignment.staffProfileId}`}
                      className="flex items-center justify-between py-3 hover:bg-muted/50 -mx-4 px-4 transition-colors"
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between py-3 -mx-4 px-4"
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role "{role.name}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
