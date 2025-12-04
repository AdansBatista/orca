'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Clock,
  CalendarClock,
  LayoutTemplate,
  MoreHorizontal,
  Trash2,
  Copy,
  CheckCircle,
  Pencil,
  Calendar,
  CalendarRange,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type ScheduleBlock, type AppointmentType } from '@/components/booking/ScheduleBlockBuilder';
import { ApplyTemplateDialog } from '@/components/booking/ApplyTemplateDialog';

interface BookingTemplate {
  id: string;
  name: string;
  description: string | null;
  templateType: string;
  isActive: boolean;
  isDefault: boolean;
  slots: ScheduleBlock[];
  blocks?: ScheduleBlock[];
  version: number;
  provider: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  _count: {
    applications: number;
  };
  createdAt: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

// Mini preview component for template cards
function TemplatePreview({
  blocks,
  appointmentTypes,
}: {
  blocks: ScheduleBlock[];
  appointmentTypes: AppointmentType[];
}) {
  // Get blocks grouped by day
  const blocksByDay: Record<number, ScheduleBlock[]> = {};
  for (const block of blocks) {
    if (!blocksByDay[block.dayOfWeek]) {
      blocksByDay[block.dayOfWeek] = [];
    }
    blocksByDay[block.dayOfWeek].push(block);
  }

  const getBlockColor = (block: ScheduleBlock) => {
    if (block.color) return block.color;
    if (block.isBlocked) return '#6B7280';
    if (block.appointmentTypeIds?.length > 0) {
      const type = appointmentTypes.find(
        (t) => t.id === block.appointmentTypeIds[0]
      );
      return type?.color || '#3B82F6';
    }
    return '#3B82F6';
  };

  const isDayOff = (dayBlocks: ScheduleBlock[]) => {
    return (
      dayBlocks.length === 1 &&
      dayBlocks[0].isBlocked &&
      dayBlocks[0].blockReason?.toLowerCase().includes('day off')
    );
  };

  return (
    <div className="grid grid-cols-7 gap-0.5 h-16">
      {DAYS_OF_WEEK.map((day) => {
        const dayBlocks = blocksByDay[day.value] || [];
        const isOff = isDayOff(dayBlocks);

        return (
          <div
            key={day.value}
            className="flex flex-col gap-0.5 rounded overflow-hidden bg-muted/30"
          >
            <div className="text-[8px] text-center text-muted-foreground font-medium py-0.5 bg-muted/50">
              {day.label}
            </div>
            <div className="flex-1 flex flex-col gap-px px-0.5 pb-0.5">
              {isOff ? (
                <div className="flex-1 bg-destructive/20 rounded-sm bg-stripes" />
              ) : dayBlocks.length > 0 ? (
                dayBlocks.slice(0, 3).map((block, i) => (
                  <div
                    key={i}
                    className="h-2 rounded-sm"
                    style={{ backgroundColor: `${getBlockColor(block)}60` }}
                  />
                ))
              ) : (
                <div className="flex-1" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface Provider {
  id: string;
  firstName: string;
  lastName: string;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<BookingTemplate[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  // Apply template dialog state
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [templateToApply, setTemplateToApply] = useState<BookingTemplate | null>(null);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/booking/templates?pageSize=50');
      const result = await response.json();
      if (result.success) {
        setTemplates(result.data.items || []);
      }
    } catch {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch appointment types and providers
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await fetch(
          '/api/booking/appointment-types?isActive=true&pageSize=50'
        );
        const result = await response.json();
        if (result.success) {
          setAppointmentTypes(result.data.items || []);
        }
      } catch {
        // Silent fail
      }
    };

    const fetchProviders = async () => {
      try {
        const response = await fetch('/api/staff?isProvider=true&pageSize=50');
        const result = await response.json();
        if (result.success) {
          setProviders(result.data.items || []);
        }
      } catch {
        // Silent fail
      }
    };

    fetchTypes();
    fetchProviders();
    fetchTemplates();
  }, [fetchTemplates]);

  // Handle apply template
  const handleApplyTemplate = async (data: {
    templateId: string;
    providerId?: string;
    startDate: Date;
    endDate: Date;
    overrideExisting: boolean;
  }) => {
    const response = await fetch('/api/booking/template-applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: data.templateId,
        providerId: data.providerId,
        appliedDate: data.startDate.toISOString(),
        dateRangeStart: data.startDate.toISOString(),
        dateRangeEnd: data.endDate.toISOString(),
        overrideExisting: data.overrideExisting,
      }),
    });
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to apply template');
    }

    toast.success('Template applied successfully');
    fetchTemplates(); // Refresh to update usage count
  };

  // Open apply dialog
  const openApplyDialog = (template: BookingTemplate) => {
    setTemplateToApply(template);
    setApplyDialogOpen(true);
  };

  // Delete template
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template? This cannot be undone.')) return;

    try {
      const response = await fetch(`/api/booking/templates/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        toast.success(
          result.data.deactivated ? 'Template deactivated' : 'Template deleted'
        );
        fetchTemplates();
      } else {
        toast.error(result.error?.message || 'Failed to delete template');
      }
    } catch {
      toast.error('Failed to delete template');
    }
  };

  // Duplicate template - creates a copy and navigates to editor
  const handleDuplicate = async (template: BookingTemplate) => {
    try {
      const blocks = template.blocks || template.slots || [];
      const payload = {
        name: `${template.name} (Copy)`,
        description: template.description || '',
        templateType: template.templateType,
        isActive: true,
        isDefault: false,
        blocks: blocks.map((b) => ({
          ...b,
          id: Math.random().toString(36).substring(2, 11),
        })),
        slots: blocks.map((b) => ({
          ...b,
          id: Math.random().toString(36).substring(2, 11),
        })),
      };

      const response = await fetch('/api/booking/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (result.success) {
        toast.success('Template duplicated');
        router.push(`/booking/settings/templates/${result.data.id}`);
      } else {
        toast.error(result.error?.message || 'Failed to duplicate template');
      }
    } catch {
      toast.error('Failed to duplicate template');
    }
  };

  return (
    <>
      <PageHeader
        title="Booking Settings"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Booking', href: '/booking' },
          { label: 'Settings' },
        ]}
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Settings Navigation */}
          <Tabs value="templates" className="w-full">
            <TabsList>
              <TabsTrigger value="appointment-types" asChild>
                <Link
                  href="/booking/settings/appointment-types"
                  className="flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Appointment Types
                </Link>
              </TabsTrigger>
              <TabsTrigger value="provider-schedules" asChild>
                <Link
                  href="/booking/settings/provider-schedules"
                  className="flex items-center gap-2"
                >
                  <CalendarClock className="h-4 w-4" />
                  Provider Schedules
                </Link>
              </TabsTrigger>
              <TabsTrigger value="templates" asChild>
                <Link
                  href="/booking/settings/templates"
                  className="flex items-center gap-2"
                >
                  <LayoutTemplate className="h-4 w-4" />
                  Schedule Templates
                </Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Schedule Templates</h2>
              <p className="text-sm text-muted-foreground">
                Create visual booking zone templates to guide front desk
                scheduling
              </p>
            </div>
            <Button asChild>
              <Link href="/booking/settings/templates/new">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Link>
            </Button>
          </div>

          {/* Templates Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <LayoutTemplate className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-foreground mb-1">
                  No templates
                </h3>
                <p className="text-muted-foreground mb-4">
                  Create your first schedule template to guide booking zones
                </p>
                <Button asChild>
                  <Link href="/booking/settings/templates/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => {
                const blocks = template.blocks || template.slots || [];

                return (
                  <Card key={template.id} variant="bento" interactive>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          <CardTitle className="text-base">
                            {template.name}
                          </CardTitle>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/booking/settings/templates/${template.id}`}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicate(template)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openApplyDialog(template)}
                            >
                              <CalendarRange className="h-4 w-4 mr-2" />
                              Apply to Calendar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(template.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {template.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      )}

                      {/* Mini Preview */}
                      <TemplatePreview
                        blocks={blocks}
                        appointmentTypes={appointmentTypes}
                      />

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{blocks.length} blocks</Badge>
                        {template.isDefault && (
                          <Badge variant="success">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                        {!template.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        <span>Used {template._count.applications} times</span>
                        {template.provider && (
                          <span className="ml-2">
                            | {template.provider.firstName}{' '}
                            {template.provider.lastName}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </PageContent>

      {/* Apply Template Dialog */}
      {templateToApply && (
        <ApplyTemplateDialog
          open={applyDialogOpen}
          onOpenChange={setApplyDialogOpen}
          templateId={templateToApply.id}
          templateName={templateToApply.name}
          providers={providers}
          onApply={handleApplyTemplate}
        />
      )}
    </>
  );
}
