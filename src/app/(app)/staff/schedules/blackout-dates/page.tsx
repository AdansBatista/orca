'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import type { BlackoutDate } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout';
import { BlackoutDateForm } from '@/components/staff/scheduling/BlackoutDateForm';
import { BlackoutDateList } from '@/components/staff/scheduling/BlackoutDateList';

export default function BlackoutDatesPage() {
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBlackout, setEditingBlackout] = useState<BlackoutDate | undefined>();

  const fetchBlackoutDates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/staff/blackout-dates');
      const result = await response.json();
      if (result.success) {
        setBlackoutDates(result.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch blackout dates:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlackoutDates();
  }, [fetchBlackoutDates]);

  const handleCreate = async (data: Record<string, unknown>) => {
    const response = await fetch('/api/staff/blackout-dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (result.success) {
      await fetchBlackoutDates();
    } else {
      throw new Error(result.error?.message || 'Failed to create blackout date');
    }
  };

  const handleUpdate = async (data: Record<string, unknown>) => {
    if (!editingBlackout) return;

    const response = await fetch(`/api/staff/blackout-dates/${editingBlackout.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (result.success) {
      await fetchBlackoutDates();
    } else {
      throw new Error(result.error?.message || 'Failed to update blackout date');
    }
  };

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/staff/blackout-dates/${id}`, {
      method: 'DELETE',
    });

    const result = await response.json();
    if (result.success) {
      await fetchBlackoutDates();
    } else {
      throw new Error(result.error?.message || 'Failed to delete blackout date');
    }
  };

  const handleEdit = (blackoutDate: BlackoutDate) => {
    setEditingBlackout(blackoutDate);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingBlackout(undefined);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blackout Dates"
        description="Manage periods when time-off requests are blocked or restricted"
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchBlackoutDates}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Blackout Date
          </Button>
        </div>
      </PageHeader>

      <BlackoutDateList
        blackoutDates={blackoutDates}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      <BlackoutDateForm
        blackoutDate={editingBlackout}
        open={showForm}
        onOpenChange={handleCloseForm}
        onSubmit={editingBlackout ? handleUpdate : handleCreate}
      />
    </div>
  );
}
