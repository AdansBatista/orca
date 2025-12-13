'use client';

import { useState, useEffect } from 'react';
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
import {
  createEquipmentSchema,
  type CreateEquipmentInput,
} from '@/lib/validations/equipment';

interface EquipmentFormProps {
  initialData?: Partial<CreateEquipmentInput>;
  equipmentId?: string;
  mode: 'create' | 'edit';
}

interface EquipmentTypeOption {
  id: string;
  name: string;
  code: string;
  category: string;
  defaultMaintenanceIntervalDays: number | null;
}

interface SupplierOption {
  id: string;
  name: string;
  code: string;
}

interface RoomOption {
  id: string;
  name: string;
  roomNumber: string;
}

const categoryOptions = [
  { value: 'DIAGNOSTIC', label: 'Diagnostic' },
  { value: 'TREATMENT', label: 'Treatment' },
  { value: 'DIGITAL', label: 'Digital' },
  { value: 'CHAIR', label: 'Chair' },
  { value: 'STERILIZATION', label: 'Sterilization' },
  { value: 'SAFETY', label: 'Safety' },
  { value: 'OTHER', label: 'Other' },
];

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'IN_REPAIR', label: 'In Repair' },
  { value: 'OUT_OF_SERVICE', label: 'Out of Service' },
  { value: 'RETIRED', label: 'Retired' },
  { value: 'DISPOSED', label: 'Disposed' },
];

const conditionOptions = [
  { value: 'EXCELLENT', label: 'Excellent' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'POOR', label: 'Poor' },
];

const depreciationOptions = [
  { value: 'STRAIGHT_LINE', label: 'Straight Line' },
  { value: 'DECLINING_BALANCE', label: 'Declining Balance' },
  { value: 'NONE', label: 'None' },
];

export function EquipmentForm({ initialData, equipmentId, mode }: EquipmentFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Async data for selects
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentTypeOption[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Fetch equipment types
  useEffect(() => {
    const fetchTypes = async () => {
      setLoadingTypes(true);
      try {
        const response = await fetch('/api/resources/equipment/types?pageSize=100');
        const result = await response.json();
        if (result.success) {
          setEquipmentTypes(result.data.items || []);
        }
      } catch {
        // Silent fail
      } finally {
        setLoadingTypes(false);
      }
    };
    fetchTypes();
  }, []);

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoadingSuppliers(true);
      try {
        const response = await fetch('/api/resources/suppliers?status=ACTIVE&pageSize=100');
        const result = await response.json();
        if (result.success) {
          setSuppliers(result.data.items || []);
        }
      } catch {
        // Silent fail
      } finally {
        setLoadingSuppliers(false);
      }
    };
    fetchSuppliers();
  }, []);

  // Fetch rooms
  useEffect(() => {
    const fetchRooms = async () => {
      setLoadingRooms(true);
      try {
        const response = await fetch('/api/resources/rooms?status=ACTIVE&pageSize=100');
        const result = await response.json();
        if (result.success) {
          setRooms(result.data.items || []);
        }
      } catch {
        // Silent fail
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateEquipmentInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createEquipmentSchema) as any,
    defaultValues: {
      status: 'ACTIVE',
      condition: 'GOOD',
      depreciationMethod: 'STRAIGHT_LINE',
      hasExtendedWarranty: false,
      ...initialData,
      purchaseDate: initialData?.purchaseDate
        ? new Date(initialData.purchaseDate)
        : undefined,
      warrantyExpiry: initialData?.warrantyExpiry
        ? new Date(initialData.warrantyExpiry)
        : undefined,
      nextMaintenanceDate: initialData?.nextMaintenanceDate
        ? new Date(initialData.nextMaintenanceDate)
        : undefined,
    },
  });

  const hasExtendedWarranty = watch('hasExtendedWarranty');
  const selectedTypeId = watch('typeId');

  // Auto-fill category when type is selected
  useEffect(() => {
    if (selectedTypeId) {
      const selectedType = equipmentTypes.find((t) => t.id === selectedTypeId);
      if (selectedType) {
        setValue('category', selectedType.category as CreateEquipmentInput['category']);
        if (selectedType.defaultMaintenanceIntervalDays && !initialData?.maintenanceIntervalDays) {
          setValue('maintenanceIntervalDays', selectedType.defaultMaintenanceIntervalDays);
        }
      }
    }
  }, [selectedTypeId, equipmentTypes, setValue, initialData?.maintenanceIntervalDays]);

  const onSubmit = async (data: CreateEquipmentInput) => {
    setSubmitting(true);
    setError(null);

    try {
      const url = mode === 'edit'
        ? `/api/resources/equipment/${equipmentId}`
        : '/api/resources/equipment';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save equipment');
      }

      router.push(`/resources/equipment/${result.data.id}`);
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
          <FormField label="Equipment Name" required error={errors.name?.message}>
            <Input {...register('name')} placeholder="e.g., iTero Element 5D" />
          </FormField>

          <FormField label="Equipment Number" required error={errors.equipmentNumber?.message}>
            <Input
              {...register('equipmentNumber')}
              placeholder="EQ-DIA-001"
              className="uppercase"
            />
          </FormField>

          <FormField label="Equipment Type" required error={errors.typeId?.message}>
            <Select
              value={watch('typeId') || ''}
              onValueChange={(v) => setValue('typeId', v)}
              disabled={loadingTypes}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingTypes ? 'Loading...' : 'Select type...'} />
              </SelectTrigger>
              <SelectContent>
                {equipmentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name} ({type.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Category" required error={errors.category?.message}>
            <Select
              value={watch('category') || ''}
              onValueChange={(v) => setValue('category', v as CreateEquipmentInput['category'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Manufacturer" error={errors.manufacturer?.message}>
            <Input {...register('manufacturer')} placeholder="e.g., Align Technology" />
          </FormField>

          <FormField label="Model Number" error={errors.modelNumber?.message}>
            <Input {...register('modelNumber')} placeholder="e.g., Element 5D" />
          </FormField>

          <FormField label="Serial Number" error={errors.serialNumber?.message}>
            <Input {...register('serialNumber')} placeholder="e.g., SN123456789" />
          </FormField>

          <FormField label="Barcode" error={errors.barcode?.message}>
            <Input {...register('barcode')} placeholder="Optional barcode" />
          </FormField>
        </CardContent>
      </Card>

      {/* Status & Location */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Status & Location</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Status" required error={errors.status?.message}>
            <Select
              value={watch('status') || 'ACTIVE'}
              onValueChange={(v) => setValue('status', v as CreateEquipmentInput['status'])}
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

          <FormField label="Condition" required error={errors.condition?.message}>
            <Select
              value={watch('condition') || 'GOOD'}
              onValueChange={(v) => setValue('condition', v as CreateEquipmentInput['condition'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {conditionOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Room Assignment" error={errors.roomId?.message}>
            <Select
              value={watch('roomId') || 'none'}
              onValueChange={(v) => setValue('roomId', v === 'none' ? null : v)}
              disabled={loadingRooms}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingRooms ? 'Loading...' : 'Select room...'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not assigned</SelectItem>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name} ({room.roomNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Location Notes" error={errors.locationNotes?.message} className="md:col-span-2">
            <Textarea
              {...register('locationNotes')}
              placeholder="e.g., Located on mobile cart, Operatory 1"
              rows={2}
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Purchase & Warranty */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Purchase & Warranty</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Purchase Date" error={errors.purchaseDate?.message}>
            <Input {...register('purchaseDate')} type="date" />
          </FormField>

          <FormField label="Purchase Price ($)" error={errors.purchasePrice?.message}>
            <Input
              {...register('purchasePrice', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
            />
          </FormField>

          <FormField label="Vendor/Supplier" error={errors.vendorId?.message}>
            <Select
              value={watch('vendorId') || 'none'}
              onValueChange={(v) => setValue('vendorId', v === 'none' ? null : v)}
              disabled={loadingSuppliers}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingSuppliers ? 'Loading...' : 'Select vendor...'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No vendor</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Purchase Order Number" error={errors.purchaseOrderNumber?.message}>
            <Input {...register('purchaseOrderNumber')} placeholder="PO-12345" />
          </FormField>

          <FormField label="Warranty Expiry" error={errors.warrantyExpiry?.message}>
            <Input {...register('warrantyExpiry')} type="date" />
          </FormField>

          <FormField label="Warranty Notes" error={errors.warrantyNotes?.message}>
            <Input {...register('warrantyNotes')} placeholder="e.g., 3-year parts and labor" />
          </FormField>

          <div className="flex items-center gap-3 md:col-span-2">
            <Switch
              id="hasExtendedWarranty"
              checked={hasExtendedWarranty}
              onCheckedChange={(checked) => setValue('hasExtendedWarranty', checked)}
            />
            <Label htmlFor="hasExtendedWarranty">Has extended warranty</Label>
          </div>

          {hasExtendedWarranty && (
            <FormField label="Extended Warranty Expiry" error={errors.extendedWarrantyExpiry?.message}>
              <Input {...register('extendedWarrantyExpiry')} type="date" />
            </FormField>
          )}
        </CardContent>
      </Card>

      {/* Depreciation */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Depreciation</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <FormField label="Depreciation Method" error={errors.depreciationMethod?.message}>
            <Select
              value={watch('depreciationMethod') || 'STRAIGHT_LINE'}
              onValueChange={(v) => setValue('depreciationMethod', v as CreateEquipmentInput['depreciationMethod'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {depreciationOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Useful Life (Months)" error={errors.usefulLifeMonths?.message}>
            <Input
              {...register('usefulLifeMonths', { valueAsNumber: true })}
              type="number"
              min="1"
              placeholder="e.g., 60"
            />
          </FormField>

          <FormField label="Salvage Value ($)" error={errors.salvageValue?.message}>
            <Input
              {...register('salvageValue', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Maintenance</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Maintenance Interval (Days)" error={errors.maintenanceIntervalDays?.message}>
            <Input
              {...register('maintenanceIntervalDays', { valueAsNumber: true })}
              type="number"
              min="1"
              placeholder="e.g., 90"
            />
          </FormField>

          <FormField label="Next Maintenance Date" error={errors.nextMaintenanceDate?.message}>
            <Input {...register('nextMaintenanceDate')} type="date" />
          </FormField>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField error={errors.notes?.message}>
            <Textarea
              {...register('notes')}
              placeholder="Additional notes about this equipment..."
              rows={4}
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
          {submitting ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Equipment'}
        </Button>
      </div>
    </form>
  );
}
