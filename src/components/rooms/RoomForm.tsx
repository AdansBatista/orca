'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { AlertCircle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  createRoomSchema,
  type CreateRoomInput,
} from '@/lib/validations/room';

interface RoomFormProps {
  initialData?: Partial<CreateRoomInput>;
  roomId?: string;
  mode: 'create' | 'edit';
}

const roomTypeOptions = [
  { value: 'OPERATORY', label: 'Operatory' },
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'X_RAY', label: 'X-Ray' },
  { value: 'STERILIZATION', label: 'Sterilization' },
  { value: 'LAB', label: 'Lab' },
  { value: 'STORAGE', label: 'Storage' },
  { value: 'RECEPTION', label: 'Reception' },
  { value: 'OFFICE', label: 'Office' },
];

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'RENOVATION', label: 'Renovation' },
];

const capabilityOptions = [
  { value: 'XRAY', label: 'X-Ray' },
  { value: 'ORTHO', label: 'Orthodontics' },
  { value: 'SCANNING', label: '3D Scanning' },
  { value: 'IMPRESSIONS', label: 'Impressions' },
  { value: 'PHOTOGRAPHY', label: 'Photography' },
  { value: 'RETAINERS', label: 'Retainer Fabrication' },
  { value: 'BONDING', label: 'Bonding' },
  { value: 'DEBONDING', label: 'Debonding' },
  { value: 'ADJUSTMENTS', label: 'Adjustments' },
  { value: 'CONSULTATIONS', label: 'Consultations' },
];

export function RoomForm({ initialData, roomId, mode }: RoomFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateRoomInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createRoomSchema) as any,
    defaultValues: {
      roomType: 'OPERATORY',
      status: 'ACTIVE',
      isAvailable: true,
      capacity: 1,
      capabilities: [],
      ...initialData,
    },
  });

  const selectedCapabilities = watch('capabilities') || [];

  const toggleCapability = (capability: string) => {
    const current = selectedCapabilities;
    const updated = current.includes(capability)
      ? current.filter((c) => c !== capability)
      : [...current, capability];
    setValue('capabilities', updated);
  };

  const onSubmit = async (data: CreateRoomInput) => {
    setSubmitting(true);
    setError(null);

    try {
      const url = mode === 'edit'
        ? `/api/resources/rooms/${roomId}`
        : '/api/resources/rooms';
      const method = mode === 'edit' ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save room');
      }

      router.push(`/resources/rooms/${result.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Room Name" required error={errors.name?.message}>
            <Input {...register('name')} placeholder="e.g., Operatory 1" />
          </FormField>

          <FormField label="Room Number" required error={errors.roomNumber?.message}>
            <Input
              {...register('roomNumber')}
              placeholder="OP-01"
              className="uppercase"
            />
          </FormField>

          <FormField label="Room Type" required error={errors.roomType?.message}>
            <Select
              value={watch('roomType') || 'OPERATORY'}
              onValueChange={(v) => setValue('roomType', v as CreateRoomInput['roomType'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roomTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Status" required error={errors.status?.message}>
            <Select
              value={watch('status') || 'ACTIVE'}
              onValueChange={(v) => setValue('status', v as CreateRoomInput['status'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="flex items-center gap-3 md:col-span-2">
            <Switch
              id="isAvailable"
              checked={watch('isAvailable')}
              onCheckedChange={(checked) => setValue('isAvailable', checked)}
            />
            <Label htmlFor="isAvailable">Available for scheduling</Label>
          </div>
        </CardContent>
      </Card>

      {/* Physical Details */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Physical Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Floor" error={errors.floor?.message}>
            <Input {...register('floor')} placeholder="e.g., Ground, 1st, 2nd" />
          </FormField>

          <FormField label="Wing" error={errors.wing?.message}>
            <Input {...register('wing')} placeholder="e.g., East Wing, North" />
          </FormField>

          <FormField label="Square Feet" error={errors.squareFeet?.message}>
            <Input
              {...register('squareFeet', { valueAsNumber: true })}
              type="number"
              min="1"
              placeholder="120"
            />
          </FormField>

          <FormField label="Capacity" error={errors.capacity?.message}>
            <Input
              {...register('capacity', { valueAsNumber: true })}
              type="number"
              min="1"
              placeholder="1"
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Select the procedures and capabilities available in this room.
          </p>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {capabilityOptions.map((opt) => (
              <div key={opt.value} className="flex items-center gap-2">
                <Checkbox
                  id={`cap-${opt.value}`}
                  checked={selectedCapabilities.includes(opt.value)}
                  onCheckedChange={() => toggleCapability(opt.value)}
                />
                <Label htmlFor={`cap-${opt.value}`} className="font-normal cursor-pointer">
                  {opt.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Setup Notes" error={errors.setupNotes?.message}>
            <Textarea
              {...register('setupNotes')}
              placeholder="Special setup instructions for this room..."
              rows={3}
            />
          </FormField>

          <FormField label="General Notes" error={errors.notes?.message}>
            <Textarea
              {...register('notes')}
              placeholder="Additional notes about this room..."
              rows={3}
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitting ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Room'}
        </Button>
      </div>
    </form>
  );
}
