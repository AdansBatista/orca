'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  MoreVertical,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateTaskDialog } from '@/components/ops/CreateTaskDialog';
import { toast } from 'sonner';

interface OpsTask {
  id: string;
  type: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueAt: string | null;
  completedAt: string | null;
  assignee: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  createdAt: string;
}

const TASK_TYPE_LABELS: Record<string, string> = {
  MANUAL: 'Manual',
  AI_GENERATED: 'AI Generated',
  SYSTEM: 'System',
};

const STATUS_CONFIG = {
  PENDING: {
    icon: Circle,
    color: 'text-muted-foreground',
    badge: 'ghost' as const,
    label: 'Pending',
  },
  IN_PROGRESS: {
    icon: Clock,
    color: 'text-primary-600',
    badge: 'soft-primary' as const,
    label: 'In Progress',
  },
  COMPLETED: {
    icon: CheckCircle2,
    color: 'text-success-600',
    badge: 'success' as const,
    label: 'Completed',
  },
  CANCELLED: {
    icon: Circle,
    color: 'text-muted-foreground',
    badge: 'ghost' as const,
    label: 'Cancelled',
  },
};

const PRIORITY_CONFIG = {
  LOW: { badge: 'ghost' as const, label: 'Low' },
  NORMAL: { badge: 'outline' as const, label: 'Normal' },
  HIGH: { badge: 'warning' as const, label: 'High' },
  URGENT: { badge: 'error' as const, label: 'Urgent' },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<OpsTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [refreshKey, setRefreshKey] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter === 'pending') {
        params.set('status', 'PENDING,IN_PROGRESS');
      } else if (filter === 'completed') {
        params.set('status', 'COMPLETED');
      }

      const response = await fetch(`/api/ops/tasks?${params}`);
      const result = await response.json();
      if (result.success) {
        setTasks(result.data.items || []);
      }
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchTasks();
  }, [fetchTasks, refreshKey]);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Update task status
  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/ops/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Task updated');
        fetchTasks();
      } else {
        toast.error(result.error?.message || 'Failed to update task');
      }
    } catch {
      toast.error('Failed to update task');
    }
  };

  // Check if task is overdue
  const isOverdue = (task: OpsTask): boolean => {
    if (!task.dueAt || task.status === 'COMPLETED' || task.status === 'CANCELLED') {
      return false;
    }
    return new Date(task.dueAt) < new Date();
  };

  // Format due time
  const formatDueTime = (dueAt: string | null): string | null => {
    if (!dueAt) return null;
    const due = new Date(dueAt);
    const now = new Date();
    const diffMinutes = Math.floor((due.getTime() - now.getTime()) / 60000);

    if (diffMinutes < 0) {
      return `${Math.abs(diffMinutes)}m overdue`;
    }
    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    }
    return due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group tasks by priority
  const urgentTasks = tasks.filter((t) => t.priority === 'URGENT');
  const highTasks = tasks.filter((t) => t.priority === 'HIGH');
  const normalTasks = tasks.filter((t) => t.priority === 'NORMAL' || t.priority === 'LOW');

  return (
    <>
      <PageHeader
        title="Operations Tasks"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Operations', href: '/ops' },
          { label: 'Tasks' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/ops">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Ops
              </Button>
            </Link>
            <Button variant="default" size="sm" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        }
      />

      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Filter Tabs */}
          <div className="flex items-center justify-between">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList>
                <TabsTrigger value="pending">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="text-sm text-muted-foreground">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-lg font-medium">No tasks</p>
              <p className="text-sm">
                {filter === 'pending'
                  ? 'All tasks are complete'
                  : 'No tasks found'}
              </p>
            </div>
          )}

          {/* Task Lists */}
          {!loading && tasks.length > 0 && (
            <div className="space-y-6">
              {/* Urgent Tasks */}
              {urgentTasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-error-600 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Urgent ({urgentTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {urgentTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isOverdue={isOverdue(task)}
                        formatDueTime={formatDueTime}
                        onUpdateStatus={updateTaskStatus}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* High Priority Tasks */}
              {highTasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-warning-600 mb-3">
                    High Priority ({highTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {highTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isOverdue={isOverdue(task)}
                        formatDueTime={formatDueTime}
                        onUpdateStatus={updateTaskStatus}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Normal Tasks */}
              {normalTasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {urgentTasks.length > 0 || highTasks.length > 0
                      ? `Other Tasks (${normalTasks.length})`
                      : `Tasks (${normalTasks.length})`}
                  </h3>
                  <div className="space-y-2">
                    {normalTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isOverdue={isOverdue(task)}
                        formatDueTime={formatDueTime}
                        onUpdateStatus={updateTaskStatus}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </PageContent>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onComplete={() => {
          setCreateDialogOpen(false);
          handleRefresh();
        }}
      />
    </>
  );
}

// Task Card Component
interface TaskCardProps {
  task: OpsTask;
  isOverdue: boolean;
  formatDueTime: (dueAt: string | null) => string | null;
  onUpdateStatus: (taskId: string, newStatus: string) => void;
}

function TaskCard({ task, isOverdue, formatDueTime, onUpdateStatus }: TaskCardProps) {
  const statusConfig = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG];
  const priorityConfig = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
  const StatusIcon = statusConfig?.icon || Circle;
  const dueTime = formatDueTime(task.dueAt);

  return (
    <Card variant="compact" className={isOverdue ? 'border-error-400' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Status Toggle */}
          <button
            onClick={() =>
              onUpdateStatus(
                task.id,
                task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
              )
            }
            className="flex-shrink-0 mt-0.5"
          >
            <StatusIcon className={`h-5 w-5 ${statusConfig?.color}`} />
          </button>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`font-medium ${
                  task.status === 'COMPLETED'
                    ? 'line-through text-muted-foreground'
                    : ''
                }`}
              >
                {task.title}
              </span>
              <Badge variant="outline" size="sm">
                {TASK_TYPE_LABELS[task.type] || task.type}
              </Badge>
              {priorityConfig && task.priority !== 'NORMAL' && (
                <Badge variant={priorityConfig.badge} size="sm">
                  {priorityConfig.label}
                </Badge>
              )}
            </div>

            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {/* Assignee */}
              {task.assignee && (
                <div className="flex items-center gap-1">
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-[8px]">
                      {task.assignee.firstName[0]}
                      {task.assignee.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    {task.assignee.firstName} {task.assignee.lastName[0]}.
                  </span>
                </div>
              )}

              {/* Due Time */}
              {dueTime && (
                <div
                  className={`flex items-center gap-1 ${
                    isOverdue ? 'text-error-600' : ''
                  }`}
                >
                  {isOverdue && <AlertTriangle className="h-3 w-3" />}
                  <Clock className="h-3 w-3" />
                  <span>{dueTime}</span>
                </div>
              )}

            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Edit Task</DropdownMenuItem>
              <DropdownMenuSeparator />
              {task.status !== 'IN_PROGRESS' && (
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(task.id, 'IN_PROGRESS')}
                >
                  Mark In Progress
                </DropdownMenuItem>
              )}
              {task.status !== 'COMPLETED' && (
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(task.id, 'COMPLETED')}
                >
                  Mark Complete
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-error-600"
                onClick={() => onUpdateStatus(task.id, 'CANCELLED')}
              >
                Cancel Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
