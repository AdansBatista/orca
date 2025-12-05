'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, Plus, Calendar } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
}

const createTaskFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  assigneeId: z.string().optional(),
  dueAt: z.string().optional(),
});

type CreateTaskFormData = z.infer<typeof createTaskFormSchema>;

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

export function CreateTaskDialog({
  open,
  onOpenChange,
  onComplete,
}: CreateTaskDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'NORMAL',
      assigneeId: '',
      dueAt: '',
    },
  });

  // Fetch staff for assignee dropdown
  useEffect(() => {
    if (open && staff.length === 0) {
      const fetchStaff = async () => {
        setLoadingStaff(true);
        try {
          const response = await fetch('/api/staff?status=active&pageSize=100');
          const result = await response.json();
          if (result.success) {
            setStaff(result.data.items || []);
          }
        } catch {
          // Silent fail - staff dropdown will be empty
        } finally {
          setLoadingStaff(false);
        }
      };
      fetchStaff();
    }
  }, [open, staff.length]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({
        title: '',
        description: '',
        priority: 'NORMAL',
        assigneeId: '',
        dueAt: '',
      });
      setError(null);
    }
  }, [open, reset]);

  const onSubmit = async (data: CreateTaskFormData) => {
    setSubmitting(true);
    setError(null);

    try {
      // Build payload - only include non-empty fields
      const payload: Record<string, unknown> = {
        title: data.title,
        priority: data.priority,
        type: 'MANUAL',
      };

      if (data.description?.trim()) {
        payload.description = data.description.trim();
      }

      if (data.assigneeId) {
        payload.assigneeId = data.assigneeId;
      }

      if (data.dueAt) {
        // Convert local datetime to ISO string
        payload.dueAt = new Date(data.dueAt).toISOString();
      }

      const response = await fetch('/api/ops/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create task');
      }

      toast.success('Task created successfully');
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary-500" />
            New Task
          </DialogTitle>
          <DialogDescription>
            Create a new operations task for your team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <FormField label="Title" required error={errors.title?.message}>
            <Input
              {...register('title')}
              placeholder="e.g., Call patient about appointment"
              autoFocus
            />
          </FormField>

          <FormField label="Description" error={errors.description?.message}>
            <Textarea
              {...register('description')}
              placeholder="Additional details about the task..."
              rows={3}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Priority" error={errors.priority?.message}>
              <Select
                value={watch('priority')}
                onValueChange={(v) => setValue('priority', v as CreateTaskFormData['priority'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Assignee" error={errors.assigneeId?.message}>
              <Select
                value={watch('assigneeId') || 'unassigned'}
                onValueChange={(v) => setValue('assigneeId', v === 'unassigned' ? '' : v)}
                disabled={loadingStaff}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingStaff ? 'Loading...' : 'Unassigned'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Due Date & Time" error={errors.dueAt?.message}>
            <div className="relative">
              <Input
                {...register('dueAt')}
                type="datetime-local"
                className="pl-10"
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
