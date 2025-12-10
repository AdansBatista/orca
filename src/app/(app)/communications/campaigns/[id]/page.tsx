'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Zap,
  Save,
  Play,
  Pause,
  Pencil,
  Plus,
  Trash2,
  Mail,
  MessageSquare,
  Clock,
  GitBranch,
  AlertTriangle,
  RefreshCw,
  Send,
  Users,
  Eye,
  MousePointer,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Settings,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { PageHeader, PageContent, StatsRow } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, StatCard } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TRIGGER_EVENTS } from '@/lib/validations/campaigns';

// Types
interface CampaignStep {
  id: string;
  stepOrder: number;
  name: string;
  type: 'SEND' | 'WAIT' | 'CONDITION' | 'BRANCH';
  channel?: string | null;
  templateId?: string | null;
  template?: {
    id: string;
    name: string;
    category: string;
  } | null;
  waitDuration?: number | null;
  waitUntil?: string | null;
  condition?: Record<string, unknown> | null;
  branches?: Array<{ condition: Record<string, unknown>; nextStepId: string }> | null;
}

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  type: string;
  triggerType: string;
  triggerEvent: string | null;
  triggerSchedule: string | null;
  triggerRecurrence: Record<string, unknown> | null;
  status: string;
  audience: Record<string, unknown> | null;
  totalRecipients: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  steps: CampaignStep[];
  sendStats: {
    total: number;
    byStatus: Record<string, number>;
  };
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  category: string;
}

// Step type configuration
const STEP_TYPES = [
  { value: 'SEND', label: 'Send Message', icon: Send, color: 'bg-blue-500' },
  { value: 'WAIT', label: 'Wait', icon: Clock, color: 'bg-amber-500' },
  { value: 'CONDITION', label: 'Condition', icon: GitBranch, color: 'bg-purple-500' },
] as const;

const CHANNELS = [
  { value: 'EMAIL', label: 'Email', icon: Mail },
  { value: 'SMS', label: 'SMS', icon: MessageSquare },
] as const;

// Sortable step component
function SortableStepCard({
  step,
  isEditable,
  onEdit,
  onDelete,
}: {
  step: CampaignStep;
  isEditable: boolean;
  onEdit: (step: CampaignStep) => void;
  onDelete: (step: CampaignStep) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id, disabled: !isEditable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const stepConfig = STEP_TYPES.find((t) => t.value === step.type);
  const StepIcon = stepConfig?.icon || Zap;

  const getStepDescription = () => {
    switch (step.type) {
      case 'SEND':
        return step.template?.name || 'No template selected';
      case 'WAIT':
        if (step.waitDuration) {
          const hours = Math.floor(step.waitDuration / 60);
          const mins = step.waitDuration % 60;
          return hours > 0 ? `Wait ${hours}h ${mins}m` : `Wait ${mins} minutes`;
        }
        return step.waitUntil || 'Configure wait time';
      case 'CONDITION':
        return 'Branch based on condition';
      default:
        return '';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-stretch rounded-xl border border-border bg-card transition-all',
        isDragging && 'opacity-50 shadow-lg',
        'hover:border-primary/50'
      )}
    >
      {/* Drag handle */}
      {isEditable && (
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-center px-2 cursor-grab active:cursor-grabbing border-r border-border bg-muted/30 rounded-l-xl"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 p-4">
        <div className="flex items-start gap-3">
          {/* Step icon */}
          <div
            className={cn(
              'flex items-center justify-center h-10 w-10 rounded-lg text-white',
              stepConfig?.color || 'bg-gray-500'
            )}
          >
            <StepIcon className="h-5 w-5" />
          </div>

          {/* Step info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Step {step.stepOrder}</span>
              {step.channel && (
                <Badge variant="outline" size="sm">
                  {step.channel}
                </Badge>
              )}
            </div>
            <h4 className="font-medium truncate">{step.name}</h4>
            <p className="text-sm text-muted-foreground truncate">{getStepDescription()}</p>
          </div>

          {/* Actions */}
          {isEditable && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon-sm" onClick={() => onEdit(step)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(step)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Add step dialog
function AddStepDialog({
  open,
  onOpenChange,
  onAdd,
  templates,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (step: Partial<CampaignStep>) => Promise<void>;
  templates: MessageTemplate[];
}) {
  const [saving, setSaving] = useState(false);
  const [stepType, setStepType] = useState<'SEND' | 'WAIT' | 'CONDITION'>('SEND');
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [templateId, setTemplateId] = useState('');
  const [waitDuration, setWaitDuration] = useState(60);

  const handleSubmit = async () => {
    if (!name) {
      toast.error('Please enter a step name');
      return;
    }

    setSaving(true);
    try {
      const stepData: Partial<CampaignStep> = {
        name,
        type: stepType,
      };

      if (stepType === 'SEND') {
        if (!templateId) {
          toast.error('Please select a template');
          setSaving(false);
          return;
        }
        stepData.channel = channel;
        stepData.templateId = templateId;
      } else if (stepType === 'WAIT') {
        stepData.waitDuration = waitDuration;
      }

      await onAdd(stepData);
      // Reset form
      setName('');
      setStepType('SEND');
      setChannel('EMAIL');
      setTemplateId('');
      setWaitDuration(60);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Workflow Step</DialogTitle>
          <DialogDescription>Configure a new step in your campaign workflow</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Step Type */}
          <FormField label="Step Type" required>
            <div className="grid grid-cols-3 gap-2">
              {STEP_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setStepType(type.value as 'SEND' | 'WAIT' | 'CONDITION')}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all',
                      stepType === type.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className={cn('p-2 rounded-lg text-white', type.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </FormField>

          {/* Step Name */}
          <FormField label="Step Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Initial welcome email"
            />
          </FormField>

          {/* SEND step options */}
          {stepType === 'SEND' && (
            <>
              <FormField label="Channel" required>
                <Select value={channel} onValueChange={(v) => setChannel(v as 'EMAIL' | 'SMS')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map((ch) => {
                      const Icon = ch.icon;
                      return (
                        <SelectItem key={ch.value} value={ch.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {ch.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Message Template" required>
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No templates found
                      </div>
                    ) : (
                      templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          <div>
                            <span className="font-medium">{t.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">{t.category}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </FormField>
            </>
          )}

          {/* WAIT step options */}
          {stepType === 'WAIT' && (
            <FormField label="Wait Duration (minutes)" required>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={waitDuration}
                  onChange={(e) => setWaitDuration(parseInt(e.target.value) || 0)}
                  min={1}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">
                  = {Math.floor(waitDuration / 60)}h {waitDuration % 60}m
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setWaitDuration(60)}
                >
                  1 hour
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setWaitDuration(1440)}
                >
                  24 hours
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setWaitDuration(4320)}
                >
                  3 days
                </Button>
              </div>
            </FormField>
          )}

          {/* CONDITION step options */}
          {stepType === 'CONDITION' && (
            <Alert>
              <AlertDescription>
                Condition steps allow branching based on patient data. Configure conditions after
                adding the step.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Adding...' : 'Add Step'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main page component
export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Dialogs
  const [addStepOpen, setAddStepOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<CampaignStep | null>(null);
  const [deletingStep, setDeletingStep] = useState<CampaignStep | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch campaign
  const fetchCampaign = useCallback(async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      const result = await response.json();

      if (result.success) {
        setCampaign(result.data);
        setEditName(result.data.name);
        setEditDescription(result.data.description || '');
      } else {
        toast.error('Failed to load campaign');
      }
    } catch {
      toast.error('Failed to load campaign');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch('/api/templates?pageSize=100');
      const result = await response.json();
      if (result.success) {
        setTemplates(result.data.items || []);
      }
    } catch {
      console.error('Failed to load templates');
    }
  }, []);

  useEffect(() => {
    fetchCampaign();
    fetchTemplates();
  }, [fetchCampaign, fetchTemplates]);

  // Save campaign details
  const handleSaveDetails = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          description: editDescription || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Campaign updated');
        setCampaign((prev) =>
          prev ? { ...prev, name: editName, description: editDescription } : null
        );
        setIsEditing(false);
      } else {
        toast.error(result.error?.message || 'Failed to update campaign');
      }
    } catch {
      toast.error('Failed to update campaign');
    } finally {
      setSaving(false);
    }
  };

  // Activate/Pause campaign
  const handleToggleStatus = async () => {
    if (!campaign) return;

    const action = campaign.status === 'ACTIVE' ? 'pause' : 'activate';

    // Validate before activating
    if (action === 'activate' && campaign.steps.length === 0) {
      toast.error('Add at least one step before activating the campaign');
      return;
    }

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/${action}`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success(action === 'activate' ? 'Campaign activated' : 'Campaign paused');
        fetchCampaign();
      } else {
        toast.error(result.error?.message || `Failed to ${action} campaign`);
      }
    } catch {
      toast.error(`Failed to ${action} campaign`);
    }
  };

  // Add step
  const handleAddStep = async (stepData: Partial<CampaignStep>) => {
    const response = await fetch(`/api/campaigns/${campaignId}/steps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stepData),
    });

    const result = await response.json();

    if (result.success) {
      toast.success('Step added');
      fetchCampaign();
    } else {
      toast.error(result.error?.message || 'Failed to add step');
      throw new Error(result.error?.message);
    }
  };

  // Delete step
  const handleDeleteStep = async () => {
    if (!deletingStep) return;

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/steps/${deletingStep.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Step deleted');
        fetchCampaign();
      } else {
        toast.error(result.error?.message || 'Failed to delete step');
      }
    } finally {
      setDeletingStep(null);
    }
  };

  // Reorder steps
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !campaign) return;

    const oldIndex = campaign.steps.findIndex((s) => s.id === active.id);
    const newIndex = campaign.steps.findIndex((s) => s.id === over.id);

    const newSteps = arrayMove(campaign.steps, oldIndex, newIndex).map((s, i) => ({
      ...s,
      stepOrder: i + 1,
    }));

    // Optimistic update
    setCampaign({ ...campaign, steps: newSteps });

    // Save to server
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/steps`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepIds: newSteps.map((s) => s.id) }),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error('Failed to reorder steps');
        fetchCampaign(); // Revert
      }
    } catch {
      toast.error('Failed to reorder steps');
      fetchCampaign();
    }
  };

  const isEditable = campaign?.status === 'DRAFT';

  // Status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success" dot>Active</Badge>;
      case 'DRAFT':
        return <Badge variant="ghost">Draft</Badge>;
      case 'PAUSED':
        return <Badge variant="warning">Paused</Badge>;
      case 'COMPLETED':
        return <Badge variant="info">Completed</Badge>;
      default:
        return <Badge variant="ghost">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Loading..."
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Communications', href: '/communications' },
            { label: 'Campaigns', href: '/communications/campaigns' },
            { label: 'Loading...' },
          ]}
        />
        <PageContent>
          <div className="space-y-6 max-w-4xl">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </PageContent>
      </>
    );
  }

  if (!campaign) {
    return (
      <>
        <PageHeader
          title="Campaign Not Found"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Communications', href: '/communications' },
            { label: 'Campaigns', href: '/communications/campaigns' },
          ]}
        />
        <PageContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              The campaign you&apos;re looking for doesn&apos;t exist or has been deleted.
            </AlertDescription>
          </Alert>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={campaign.name}
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Communications', href: '/communications' },
          { label: 'Campaigns', href: '/communications/campaigns' },
          { label: campaign.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/communications/campaigns">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            {campaign.status === 'ACTIVE' ? (
              <Button variant="outline" size="sm" onClick={handleToggleStatus}>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            ) : ['DRAFT', 'PAUSED'].includes(campaign.status) ? (
              <Button size="sm" onClick={handleToggleStatus}>
                <Play className="h-4 w-4 mr-2" />
                {campaign.status === 'DRAFT' ? 'Activate' : 'Resume'}
              </Button>
            ) : null}
          </div>
        }
      />

      <PageContent density="comfortable">
        <Tabs defaultValue="workflow" className="space-y-6">
          <TabsList>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Workflow Tab */}
          <TabsContent value="workflow" className="space-y-6">
            {/* Status & Stats */}
            <StatsRow>
              <StatCard accentColor="primary">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(campaign.status)}</div>
                  </div>
                  <Zap className="h-8 w-8 text-primary/60" />
                </div>
              </StatCard>
              <StatCard accentColor="success">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Sent</p>
                    <p className="text-xl font-bold">{campaign.totalSent.toLocaleString()}</p>
                  </div>
                  <Send className="h-8 w-8 text-success/60" />
                </div>
              </StatCard>
              <StatCard accentColor="secondary">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Delivered</p>
                    <p className="text-xl font-bold">{campaign.totalDelivered.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground/60" />
                </div>
              </StatCard>
              <StatCard accentColor="accent">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Opened</p>
                    <p className="text-xl font-bold">
                      {campaign.totalOpened.toLocaleString()}
                      {campaign.totalDelivered > 0 && (
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          ({Math.round((campaign.totalOpened / campaign.totalDelivered) * 100)}%)
                        </span>
                      )}
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-accent/60" />
                </div>
              </StatCard>
            </StatsRow>

            {/* Workflow Steps */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <GitBranch className="h-5 w-5" />
                      Workflow Steps
                    </CardTitle>
                    <CardDescription>
                      {campaign.steps.length} step{campaign.steps.length !== 1 ? 's' : ''} in this
                      workflow
                    </CardDescription>
                  </div>
                  {isEditable && (
                    <Button onClick={() => setAddStepOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Step
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {campaign.steps.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="font-medium">No steps yet</p>
                    <p className="text-sm mb-4">Add steps to define your campaign workflow</p>
                    {isEditable && (
                      <Button onClick={() => setAddStepOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Step
                      </Button>
                    )}
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={campaign.steps.map((s) => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {campaign.steps.map((step, index) => (
                          <div key={step.id}>
                            {index > 0 && (
                              <div className="flex justify-center py-1">
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <SortableStepCard
                              step={step}
                              isEditable={isEditable}
                              onEdit={setEditingStep}
                              onDelete={setDeletingStep}
                            />
                          </div>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}

                {!isEditable && campaign.steps.length > 0 && (
                  <Alert className="mt-4">
                    <AlertDescription>
                      Workflow steps can only be modified when the campaign is in Draft status.
                      {campaign.status === 'ACTIVE' && ' Pause the campaign to make changes.'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Campaign Details</CardTitle>
                    <CardDescription>Basic information about this campaign</CardDescription>
                  </div>
                  {isEditable && !isEditing && (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <FormField label="Campaign Name" required>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Campaign name"
                      />
                    </FormField>
                    <FormField label="Description">
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Describe this campaign..."
                        rows={3}
                      />
                    </FormField>
                    <div className="flex items-center gap-2">
                      <Button onClick={handleSaveDetails} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setEditName(campaign.name);
                          setEditDescription(campaign.description || '');
                        }}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{campaign.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className={campaign.description ? '' : 'text-muted-foreground italic'}>
                        {campaign.description || 'No description'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <Badge variant="soft-primary">{campaign.type}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Trigger</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{campaign.triggerType}</Badge>
                        {campaign.triggerEvent && (
                          <span className="text-sm">{campaign.triggerEvent}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>Delivery and engagement metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Delivery Funnel */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Delivery Funnel</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Sent</span>
                        <span className="font-medium">{campaign.totalSent.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: '100%' }} />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Delivered</span>
                        <span className="font-medium">
                          {campaign.totalDelivered.toLocaleString()}
                          {campaign.totalSent > 0 && (
                            <span className="text-muted-foreground ml-1">
                              ({Math.round((campaign.totalDelivered / campaign.totalSent) * 100)}%)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-success"
                          style={{
                            width: `${campaign.totalSent > 0 ? (campaign.totalDelivered / campaign.totalSent) * 100 : 0}%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Opened</span>
                        <span className="font-medium">
                          {campaign.totalOpened.toLocaleString()}
                          {campaign.totalDelivered > 0 && (
                            <span className="text-muted-foreground ml-1">
                              ({Math.round((campaign.totalOpened / campaign.totalDelivered) * 100)}
                              %)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-info"
                          style={{
                            width: `${campaign.totalDelivered > 0 ? (campaign.totalOpened / campaign.totalDelivered) * 100 : 0}%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Clicked</span>
                        <span className="font-medium">
                          {campaign.totalClicked.toLocaleString()}
                          {campaign.totalOpened > 0 && (
                            <span className="text-muted-foreground ml-1">
                              ({Math.round((campaign.totalClicked / campaign.totalOpened) * 100)}%)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent"
                          style={{
                            width: `${campaign.totalOpened > 0 ? (campaign.totalClicked / campaign.totalOpened) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status Breakdown */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Send Status Breakdown</h4>
                    {campaign.sendStats.total === 0 ? (
                      <p className="text-sm text-muted-foreground">No sends yet</p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(campaign.sendStats.byStatus).map(([status, count]) => (
                          <div key={status} className="flex items-center justify-between">
                            <Badge
                              variant={
                                status === 'DELIVERED'
                                  ? 'success'
                                  : status === 'FAILED'
                                    ? 'destructive'
                                    : status === 'PENDING'
                                      ? 'warning'
                                      : 'ghost'
                              }
                            >
                              {status}
                            </Badge>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageContent>

      {/* Add Step Dialog */}
      <AddStepDialog
        open={addStepOpen}
        onOpenChange={setAddStepOpen}
        onAdd={handleAddStep}
        templates={templates}
      />

      {/* Delete Step Confirmation */}
      <ConfirmDialog
        open={!!deletingStep}
        onOpenChange={(open: boolean) => !open && setDeletingStep(null)}
        title="Delete Step"
        description={`Are you sure you want to delete "${deletingStep?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteStep}
      />
    </>
  );
}
