'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { CalendarRange, Trash2, AlertCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ListItem, ListItemTitle, ListItemDescription } from '@/components/ui/list-item';

interface TemplateApplication {
  id: string;
  appliedDate: string;
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
  overrideExisting: boolean;
  slotsCreated: number;
  slotsSkipped: number;
  appliedAt: string;
  provider: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  template: {
    id: string;
    name: string;
    color: string | null;
  };
}

interface ManageTemplateApplicationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  templateName: string;
  onApplicationsChange?: () => void;
}

export function ManageTemplateApplicationsDialog({
  open,
  onOpenChange,
  templateId,
  templateName,
  onApplicationsChange,
}: ManageTemplateApplicationsDialogProps) {
  const [applications, setApplications] = useState<TemplateApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch applications for this template
  const fetchApplications = useCallback(async () => {
    if (!open) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/booking/template-applications?templateId=${templateId}`
      );
      const result = await response.json();

      if (result.success) {
        setApplications(result.data || []);
      } else {
        toast.error('Failed to load applications');
      }
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [templateId, open]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Delete a specific application
  const handleDelete = async (id: string) => {
    if (!confirm('Remove this template application? This cannot be undone.')) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/booking/template-applications/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        toast.success('Template application removed');
        // Remove from local state
        setApplications((prev) => prev.filter((app) => app.id !== id));
        // Notify parent
        onApplicationsChange?.();
      } else {
        toast.error(result.error?.message || 'Failed to remove application');
      }
    } catch {
      toast.error('Failed to remove application');
    } finally {
      setDeleting(null);
    }
  };

  // Delete all applications for this template
  const handleDeleteAll = async () => {
    if (
      !confirm(
        `Remove ALL applications of "${templateName}" from the calendar? This cannot be undone.`
      )
    ) {
      return;
    }

    setDeleting('all');
    try {
      const response = await fetch(
        `/api/booking/template-applications?templateId=${templateId}`,
        {
          method: 'DELETE',
        }
      );
      const result = await response.json();

      if (result.success) {
        toast.success(
          `Removed ${result.data.deletedCount} template application(s)`
        );
        setApplications([]);
        onApplicationsChange?.();
      } else {
        toast.error(result.error?.message || 'Failed to remove applications');
      }
    } catch {
      toast.error('Failed to remove applications');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-primary" />
            Manage Template Applications
          </DialogTitle>
          <DialogDescription>
            View and remove applications of &quot;{templateName}&quot; from the
            calendar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                This template has not been applied to any dates yet.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">
                  {applications.length} application
                  {applications.length !== 1 ? 's' : ''} found
                </p>
                {applications.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteAll}
                    disabled={deleting === 'all'}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    {deleting === 'all' ? 'Removing...' : 'Remove All'}
                  </Button>
                )}
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {applications.map((app) => {
                  const isDeleting = deleting === app.id;
                  const dateRange =
                    app.dateRangeStart && app.dateRangeEnd
                      ? `${format(new Date(app.dateRangeStart), 'MMM d')} - ${format(new Date(app.dateRangeEnd), 'MMM d, yyyy')}`
                      : format(new Date(app.appliedDate), 'MMM d, yyyy');

                  return (
                    <ListItem
                      key={app.id}
                      variant="bordered"
                      leading={
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: app.template.color
                              ? `${app.template.color}20`
                              : 'rgb(var(--primary) / 0.1)',
                          }}
                        >
                          <Calendar
                            className="h-5 w-5"
                            style={{
                              color: app.template.color || 'rgb(var(--primary))',
                            }}
                          />
                        </div>
                      }
                      trailing={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(app.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      }
                    >
                      <ListItemTitle>{dateRange}</ListItemTitle>
                      <ListItemDescription>
                        <div className="flex items-center gap-2 flex-wrap">
                          {app.provider && (
                            <Badge variant="outline" className="text-xs">
                              {app.provider.firstName} {app.provider.lastName}
                            </Badge>
                          )}
                          <span className="text-xs">
                            {app.slotsCreated} slot
                            {app.slotsCreated !== 1 ? 's' : ''} created
                          </span>
                          {app.slotsSkipped > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({app.slotsSkipped} skipped)
                            </span>
                          )}
                        </div>
                      </ListItemDescription>
                    </ListItem>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
