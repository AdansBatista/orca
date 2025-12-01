'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import type { ScheduleTemplate } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout';
import { ScheduleTemplateForm } from '@/components/staff/scheduling/ScheduleTemplateForm';
import { ScheduleTemplateList } from '@/components/staff/scheduling/ScheduleTemplateList';

export default function ScheduleTemplatesPage() {
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ScheduleTemplate | undefined>();

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/staff/schedule-templates?pageSize=100');
      const result = await response.json();
      if (result.success) {
        setTemplates(result.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch schedule templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreate = async (data: Record<string, unknown>) => {
    const response = await fetch('/api/staff/schedule-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (result.success) {
      await fetchTemplates();
    } else {
      throw new Error(result.error?.message || 'Failed to create schedule template');
    }
  };

  const handleUpdate = async (data: Record<string, unknown>) => {
    if (!editingTemplate) return;

    const response = await fetch(`/api/staff/schedule-templates/${editingTemplate.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (result.success) {
      await fetchTemplates();
    } else {
      throw new Error(result.error?.message || 'Failed to update schedule template');
    }
  };

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/staff/schedule-templates/${id}`, {
      method: 'DELETE',
    });

    const result = await response.json();
    if (result.success) {
      await fetchTemplates();
    } else {
      throw new Error(result.error?.message || 'Failed to delete schedule template');
    }
  };

  const handleEdit = (template: ScheduleTemplate) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTemplate(undefined);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule Templates"
        description="Define reusable shift patterns that can be assigned as default schedules for staff members"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Staff', href: '/staff' },
          { label: 'Schedules', href: '/staff/schedules' },
          { label: 'Templates' },
        ]}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchTemplates}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Template
          </Button>
        </div>
      </PageHeader>

      <ScheduleTemplateList
        templates={templates}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      <ScheduleTemplateForm
        template={editingTemplate}
        open={showForm}
        onOpenChange={handleCloseForm}
        onSubmit={editingTemplate ? handleUpdate : handleCreate}
      />
    </div>
  );
}
