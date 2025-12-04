'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { FormField } from '@/components/ui/form-field';
import {
  ScheduleBlockBuilder,
  type ScheduleBlock,
  type AppointmentType,
} from '@/components/booking/ScheduleBlockBuilder';

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
}

export default function TemplateEditorPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;
  const isNew = templateId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    templateType: 'WEEK',
    isActive: true,
    isDefault: false,
    blocks: [] as ScheduleBlock[],
  });

  // Fetch appointment types
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
        toast.error('Failed to load appointment types');
      }
    };
    fetchTypes();
  }, []);

  // Fetch template if editing
  useEffect(() => {
    if (isNew) return;

    const fetchTemplate = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/booking/templates/${templateId}`);
        const result = await response.json();

        if (result.success) {
          const template: BookingTemplate = result.data;
          const blocks = template.blocks || template.slots || [];
          setFormData({
            name: template.name,
            description: template.description || '',
            templateType: template.templateType,
            isActive: template.isActive,
            isDefault: template.isDefault,
            blocks,
          });
        } else {
          toast.error('Template not found');
          router.push('/booking/settings/templates');
        }
      } catch {
        toast.error('Failed to load template');
        router.push('/booking/settings/templates');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId, isNew, router]);

  // Save template
  const handleSave = useCallback(async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    if (formData.blocks.length === 0) {
      toast.error('Please add at least one schedule block');
      return;
    }

    setSaving(true);
    try {
      const url = isNew
        ? '/api/booking/templates'
        : `/api/booking/templates/${templateId}`;
      const method = isNew ? 'POST' : 'PUT';

      const payload = {
        ...formData,
        slots: formData.blocks, // For backward compatibility
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (result.success) {
        toast.success(isNew ? 'Template created' : 'Template updated');
        router.push('/booking/settings/templates');
      } else {
        toast.error(result.error?.message || 'Failed to save template');
      }
    } catch {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  }, [formData, isNew, templateId, router]);

  // Handle blocks change
  const handleBlocksChange = useCallback((blocks: ScheduleBlock[]) => {
    setFormData((prev) => ({ ...prev, blocks }));
  }, []);

  if (loading) {
    return (
      <>
        <PageHeader
          title="Loading..."
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Booking', href: '/booking' },
            { label: 'Settings', href: '/booking/settings/templates' },
            { label: 'Template' },
          ]}
        />
        <PageContent>
          <div className="space-y-6">
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-20 w-full max-w-md" />
            <Skeleton className="h-[500px] w-full" />
          </div>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={isNew ? 'Create Template' : 'Edit Template'}
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Booking', href: '/booking' },
          { label: 'Settings', href: '/booking/settings/templates' },
          { label: isNew ? 'New Template' : formData.name || 'Edit' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/booking/settings/templates">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        }
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Template Name" required>
                  <Input
                    placeholder="e.g., Standard Week, Summer Schedule"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </FormField>

                <div className="flex items-center gap-6 pt-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isActive: checked })
                      }
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isDefault"
                      checked={formData.isDefault}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isDefault: checked })
                      }
                    />
                    <Label htmlFor="isDefault">Default template</Label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <FormField label="Description">
                    <Textarea
                      placeholder="Describe when to use this template..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={2}
                    />
                  </FormField>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Block Builder */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-lg">Weekly Schedule Blocks</h3>
                  <p className="text-sm text-muted-foreground">
                    Drag appointment types onto the grid to create booking zones.
                    Click blocks to edit. Right-click day headers for quick actions.
                  </p>
                </div>

                <ScheduleBlockBuilder
                  blocks={formData.blocks}
                  appointmentTypes={appointmentTypes}
                  onChange={handleBlocksChange}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </>
  );
}
