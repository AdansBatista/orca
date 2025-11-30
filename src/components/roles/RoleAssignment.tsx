'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Shield, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface Role {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isSystem: boolean;
  permissions: string[];
}

interface Assignment {
  id: string;
  assignedAt: string;
  role: Role;
  clinic: {
    id: string;
    name: string;
  };
}

interface RoleAssignmentProps {
  userId: string;
  userName: string;
}

export function RoleAssignment({ userId, userName }: RoleAssignmentProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch assignments and available roles
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch user's current role assignments
        const assignmentsResponse = await fetch(`/api/staff/${userId}/roles`);
        const assignmentsResult = await assignmentsResponse.json();

        if (!assignmentsResult.success) {
          throw new Error(
            assignmentsResult.error?.message || 'Failed to fetch role assignments'
          );
        }

        setAssignments(assignmentsResult.data.assignments);

        // Fetch all available roles
        const rolesResponse = await fetch('/api/roles?includeSystem=true');
        const rolesResult = await rolesResponse.json();

        if (rolesResult.success) {
          setAvailableRoles(rolesResult.data.items);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Get roles that aren't already assigned
  const unassignedRoles = availableRoles.filter(
    (role) => !assignments.some((a) => a.role.id === role.id)
  );

  const handleAddRole = async () => {
    if (!selectedRoleId) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/staff/${userId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: selectedRoleId }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to assign role');
      }

      // Add to local state
      setAssignments((prev) => [...prev, result.data]);
      setAddDialogOpen(false);
      setSelectedRoleId('');
      toast.success('Role assigned successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to assign role');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveRole = async () => {
    if (!selectedAssignment) return;

    setSaving(true);
    try {
      const response = await fetch(
        `/api/staff/${userId}/roles/${selectedAssignment.id}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to remove role');
      }

      // Remove from local state
      setAssignments((prev) =>
        prev.filter((a) => a.id !== selectedAssignment.id)
      );
      setRemoveDialogOpen(false);
      setSelectedAssignment(null);
      toast.success('Role removed successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove role');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Role Assignments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto text-warning-500 mb-2" />
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Role Assignments</CardTitle>
          {unassignedRoles.length > 0 && (
            <Button size="sm" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Role
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-6">
              <Shield className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No roles assigned</p>
              {unassignedRoles.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setAddDialogOpen(true)}
                >
                  Assign a Role
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {assignment.role.name}
                        </span>
                        {assignment.role.isSystem && (
                          <Badge variant="soft-primary" size="sm">
                            System
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {assignment.role.permissions.length} permissions
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setRemoveDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Role Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>
              Select a role to assign to {userName}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {unassignedRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex items-center gap-2">
                      <span>{role.name}</span>
                      {role.isSystem && (
                        <Badge variant="soft-primary" size="sm">
                          System
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddDialogOpen(false);
                setSelectedRoleId('');
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleAddRole} disabled={!selectedRoleId || saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Role Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Role Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the "{selectedAssignment?.role.name}"
              role from {userName}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRemoveDialogOpen(false);
                setSelectedAssignment(null);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveRole} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remove Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
