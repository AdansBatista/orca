'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  createInventoryItemSchema,
  type CreateInventoryItemInput,
} from '@/lib/validations/inventory';

interface InventoryFormProps {
  initialData?: Partial<CreateInventoryItemInput>;
  itemId?: string;
  mode: 'create' | 'edit';
}

interface SupplierOption {
  id: string;
  name: string;
  code: string;
}

const categoryOptions = [
  { value: 'BRACKETS', label: 'Brackets' },
  { value: 'WIRES', label: 'Wires' },
  { value: 'ELASTICS', label: 'Elastics' },
  { value: 'BANDS', label: 'Bands' },
  { value: 'BONDING', label: 'Bonding' },
  { value: 'IMPRESSION', label: 'Impression' },
  { value: 'RETAINERS', label: 'Retainers' },
  { value: 'INSTRUMENTS', label: 'Instruments' },
  { value: 'DISPOSABLES', label: 'Disposables' },
  { value: 'PPE', label: 'PPE' },
  { value: 'OFFICE_SUPPLIES', label: 'Office Supplies' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'OTHER', label: 'Other' },
];

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DISCONTINUED', label: 'Discontinued' },
  { value: 'BACKORDERED', label: 'Backordered' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
];

const unitOfMeasureOptions = [
  { value: 'EACH', label: 'Each' },
  { value: 'BOX', label: 'Box' },
  { value: 'PACK', label: 'Pack' },
  { value: 'CASE', label: 'Case' },
  { value: 'BAG', label: 'Bag' },
  { value: 'BOTTLE', label: 'Bottle' },
  { value: 'SYRINGE', label: 'Syringe' },
  { value: 'CARTRIDGE', label: 'Cartridge' },
  { value: 'KIT', label: 'Kit' },
  { value: 'SPOOL', label: 'Spool' },
  { value: 'SHEET', label: 'Sheet' },
  { value: 'CANISTER', label: 'Canister' },
  { value: 'PAIR', label: 'Pair' },
];

export function InventoryForm({ initialData, itemId, mode }: InventoryFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Async data for selects
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateInventoryItemInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createInventoryItemSchema) as any,
    defaultValues: {
      status: 'ACTIVE',
      unitOfMeasure: 'EACH',
      unitsPerPackage: 1,
      reorderPoint: 10,
      reorderQuantity: 20,
      safetyStock: 5,
      leadTimeDays: 7,
      trackLots: false,
      trackExpiry: true,
      trackSerial: false,
      isOrderable: true,
      currentStock: 0,
      reservedStock: 0,
      ...initialData,
    },
  });

  const trackLots = watch('trackLots');
  const trackExpiry = watch('trackExpiry');

  const onSubmit = async (data: CreateInventoryItemInput) => {
    setSubmitting(true);
    setError(null);

    try {
      const url = mode === 'edit'
        ? `/api/resources/inventory/${itemId}`
        : '/api/resources/inventory';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save inventory item');
      }

      router.push(`/resources/inventory/${result.data.id}`);
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
        <Card variant="ghost" className="border-error-200 bg-error-50">
          <CardContent className="p-4 text-error-700">{error}</CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Item Name" required error={errors.name?.message}>
            <Input {...register('name')} placeholder="e.g., 3M Clarity Metal Brackets MBT .022" />
          </FormField>

          <FormField label="SKU" required error={errors.sku?.message}>
            <Input
              {...register('sku')}
              placeholder="BRK-MTL-MBT-022"
              className="uppercase"
            />
          </FormField>

          <FormField label="Category" required error={errors.category?.message}>
            <Select
              value={watch('category') || ''}
              onValueChange={(v) => setValue('category', v as CreateInventoryItemInput['category'])}
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

          <FormField label="Status" required error={errors.status?.message}>
            <Select
              value={watch('status') || 'ACTIVE'}
              onValueChange={(v) => setValue('status', v as CreateInventoryItemInput['status'])}
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

          <FormField label="Barcode" error={errors.barcode?.message}>
            <Input {...register('barcode')} placeholder="Optional barcode" />
          </FormField>

          <FormField label="UPC" error={errors.upc?.message}>
            <Input {...register('upc')} placeholder="Universal Product Code" />
          </FormField>

          <FormField label="Description" error={errors.description?.message} className="md:col-span-2">
            <Textarea
              {...register('description')}
              placeholder="Item description..."
              rows={2}
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Classification */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Classification</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FormField label="Subcategory" error={errors.subcategory?.message}>
            <Input {...register('subcategory')} placeholder="e.g., Metal Brackets" />
          </FormField>

          <FormField label="Brand" error={errors.brand?.message}>
            <Input {...register('brand')} placeholder="e.g., 3M Unitek" />
          </FormField>

          <FormField label="Manufacturer" error={errors.manufacturer?.message}>
            <Input {...register('manufacturer')} placeholder="e.g., 3M" />
          </FormField>

          <FormField label="Material" error={errors.material?.message}>
            <Input {...register('material')} placeholder="e.g., Stainless Steel" />
          </FormField>

          <FormField label="Size" error={errors.size?.message}>
            <Input {...register('size')} placeholder="e.g., .022" />
          </FormField>

          <FormField label="Color" error={errors.color?.message}>
            <Input {...register('color')} placeholder="e.g., Clear" />
          </FormField>
        </CardContent>
      </Card>

      {/* Supplier Information */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Supplier Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Primary Supplier" error={errors.supplierId?.message}>
            <Select
              value={watch('supplierId') || 'none'}
              onValueChange={(v) => setValue('supplierId', v === 'none' ? null : v)}
              disabled={loadingSuppliers}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingSuppliers ? 'Loading...' : 'Select supplier...'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No supplier</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name} ({supplier.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Supplier SKU" error={errors.supplierSku?.message}>
            <Input {...register('supplierSku')} placeholder="Supplier's item code" />
          </FormField>
        </CardContent>
      </Card>

      {/* Pricing & Packaging */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Pricing & Packaging</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FormField label="Unit Cost ($)" required error={errors.unitCost?.message}>
            <Input
              {...register('unitCost', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
            />
          </FormField>

          <FormField label="Unit of Measure" error={errors.unitOfMeasure?.message}>
            <Select
              value={watch('unitOfMeasure') || 'EACH'}
              onValueChange={(v) => setValue('unitOfMeasure', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {unitOfMeasureOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Units per Package" error={errors.unitsPerPackage?.message}>
            <Input
              {...register('unitsPerPackage', { valueAsNumber: true })}
              type="number"
              min="1"
              placeholder="1"
            />
          </FormField>

          <FormField label="Package Description" error={errors.packageDescription?.message}>
            <Input {...register('packageDescription')} placeholder="e.g., Box of 10" />
          </FormField>
        </CardContent>
      </Card>

      {/* Stock & Reorder */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Stock Levels & Reorder Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {mode === 'create' && (
            <FormField label="Initial Stock" error={errors.currentStock?.message}>
              <Input
                {...register('currentStock', { valueAsNumber: true })}
                type="number"
                min="0"
                placeholder="0"
              />
            </FormField>
          )}

          <FormField label="Reorder Point" required error={errors.reorderPoint?.message}>
            <Input
              {...register('reorderPoint', { valueAsNumber: true })}
              type="number"
              min="0"
              placeholder="10"
            />
          </FormField>

          <FormField label="Reorder Quantity" required error={errors.reorderQuantity?.message}>
            <Input
              {...register('reorderQuantity', { valueAsNumber: true })}
              type="number"
              min="1"
              placeholder="20"
            />
          </FormField>

          <FormField label="Safety Stock" error={errors.safetyStock?.message}>
            <Input
              {...register('safetyStock', { valueAsNumber: true })}
              type="number"
              min="0"
              placeholder="5"
            />
          </FormField>

          <FormField label="Maximum Stock" error={errors.maxStock?.message}>
            <Input
              {...register('maxStock', { valueAsNumber: true })}
              type="number"
              min="0"
              placeholder="Optional max"
            />
          </FormField>

          <FormField label="Lead Time (Days)" error={errors.leadTimeDays?.message}>
            <Input
              {...register('leadTimeDays', { valueAsNumber: true })}
              type="number"
              min="0"
              placeholder="7"
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Tracking Options */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Tracking Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              id="trackLots"
              checked={trackLots}
              onCheckedChange={(checked) => setValue('trackLots', checked)}
            />
            <Label htmlFor="trackLots">Track by Lot/Batch Number</Label>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="trackExpiry"
              checked={trackExpiry}
              onCheckedChange={(checked) => setValue('trackExpiry', checked)}
            />
            <Label htmlFor="trackExpiry">Track Expiration Dates</Label>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="trackSerial"
              checked={watch('trackSerial')}
              onCheckedChange={(checked) => setValue('trackSerial', checked)}
            />
            <Label htmlFor="trackSerial">Track Serial Numbers</Label>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="isOrderable"
              checked={watch('isOrderable')}
              onCheckedChange={(checked) => setValue('isOrderable', checked)}
            />
            <Label htmlFor="isOrderable">Available for Ordering</Label>
          </div>
        </CardContent>
      </Card>

      {/* Storage */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Storage</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Storage Location" error={errors.storageLocation?.message}>
            <Input {...register('storageLocation')} placeholder="e.g., Cabinet A, Shelf 2" />
          </FormField>

          <FormField label="Storage Requirements" error={errors.storageRequirements?.message}>
            <Input {...register('storageRequirements')} placeholder="e.g., Refrigerate, Keep dry" />
          </FormField>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Documents & Media</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="MSDS URL" error={errors.msdsUrl?.message}>
            <Input {...register('msdsUrl')} type="url" placeholder="https://..." />
          </FormField>

          <FormField label="Image URL" error={errors.imageUrl?.message}>
            <Input {...register('imageUrl')} type="url" placeholder="https://..." />
          </FormField>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Item'}
        </Button>
      </div>
    </form>
  );
}
