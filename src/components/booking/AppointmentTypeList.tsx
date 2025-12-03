'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, Calendar, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppointmentTypeCard } from './AppointmentTypeCard';
import { AppointmentTypeForm, type AppointmentTypeFormRef } from './AppointmentTypeForm';
import { toast } from 'sonner';

interface AppointmentType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  defaultDuration: number;
  color: string;
  icon: string | null;
  requiresChair: boolean;
  requiresRoom: boolean;
  prepTime: number;
  cleanupTime: number;
  isActive: boolean;
  allowOnline: boolean;
  sortOrder: number;
  _count?: {
    appointments: number;
  };
}

interface PaginatedResponse {
  items: AppointmentType[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

export function AppointmentTypeList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [isActive, setIsActive] = useState(searchParams.get('isActive') || '');

  // Form dialog state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<AppointmentType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<AppointmentTypeFormRef>(null);

  // Fetch appointment types
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (isActive) params.set('isActive', isActive);
    params.set('pageSize', '100'); // Show all types

    try {
      const response = await fetch(`/api/booking/appointment-types?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch appointment types');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [search, isActive]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (isActive) params.set('isActive', isActive);

    const query = params.toString();
    router.replace(query ? `/booking/settings/appointment-types?${query}` : '/booking/settings/appointment-types', { scroll: false });
  }, [search, isActive, router]);

  // Handle edit
  const handleEdit = async (id: string) => {
    setEditingId(id);
    try {
      const response = await fetch(`/api/booking/appointment-types/${id}`);
      const result = await response.json();
      if (result.success) {
        setEditingType(result.data);
        setShowForm(true);
      } else {
        toast.error(result.error?.message || 'Failed to load appointment type');
      }
    } catch {
      toast.error('Failed to load appointment type');
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/booking/appointment-types/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Appointment type deleted');
        fetchData();
      } else {
        toast.error(result.error?.message || 'Failed to delete');
      }
    } catch {
      toast.error('Failed to delete appointment type');
    }
  };

  // Handle form submit
  const handleFormSubmit = async (formData: Partial<AppointmentType>) => {
    const isEdit = !!editingId;
    const url = isEdit
      ? `/api/booking/appointment-types/${editingId}`
      : '/api/booking/appointment-types';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (result.success) {
        toast.success(isEdit ? 'Appointment type updated' : 'Appointment type created');
        setShowForm(false);
        setEditingId(null);
        setEditingType(null);
        fetchData();
      } else {
        toast.error(result.error?.message || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save appointment type');
    }
  };

  // Handle form close
  const handleFormClose = () => {
    setShowForm(false);
    setEditingId(null);
    setEditingType(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointment Types</h1>
          <p className="text-muted-foreground">
            Configure the types of appointments available for booking
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Type
        </Button>
      </div>

      {/* Filters */}
      <Card variant="ghost">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status filter */}
            <Select value={isActive} onValueChange={(v) => setIsActive(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value || 'all'} value={opt.value || 'all'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card variant="ghost">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-error-500 mb-4" />
            <p className="text-error-600">{error}</p>
            <Button variant="outline" onClick={fetchData} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : data?.items.length === 0 ? (
        <Card variant="ghost">
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-foreground mb-1">No appointment types found</h3>
            <p className="text-muted-foreground mb-4">
              {search || isActive
                ? 'Try adjusting your filters'
                : 'Get started by creating your first appointment type'}
            </p>
            {!search && !isActive && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Appointment Type
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((type) => (
            <AppointmentTypeCard
              key={type.id}
              appointmentType={type}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={handleFormClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Appointment Type' : 'New Appointment Type'}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <AppointmentTypeForm
              ref={formRef}
              initialData={editingType}
              onSubmit={handleFormSubmit}
              onCancel={handleFormClose}
              hideFooter
              onSubmittingChange={setIsSubmitting}
            />
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleFormClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={() => formRef.current?.submit()} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
