'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Search, AlertTriangle, ArrowRightLeft, Package, Building2 } from 'lucide-react';

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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

// Form validation schema
const transferItemSchema = z.object({
  itemId: z.string().min(1, 'Item is required'),
  itemName: z.string().optional(),
  itemSku: z.string().optional(),
  availableStock: z.number().optional(),
  lotId: z.string().optional().nullable(),
  requestedQuantity: z.number().int().positive('Quantity must be positive'),
});

const transferFormSchema = z.object({
  toClinicId: z.string().min(1, 'Destination clinic is required'),
  reason: z.string().min(1, 'Reason is required').max(500),
  notes: z.string().max(1000).optional().nullable(),
  isUrgent: z.boolean().default(false),
  urgentReason: z.string().max(500).optional().nullable(),
  items: z.array(transferItemSchema).min(1, 'At least one item is required'),
});

type TransferFormInput = z.infer<typeof transferFormSchema>;

interface ClinicOption {
  id: string;
  name: string;
  code: string;
}

interface InventoryItemOption {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  availableStock: number;
  reservedStock: number;
  unitOfMeasure: string;
}

interface TransferRequestFormProps {
  mode?: 'create' | 'edit';
  transferId?: string;
}

export function TransferRequestForm({ mode = 'create' }: TransferRequestFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Async data
  const [clinics, setClinics] = useState<ClinicOption[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(false);

  // Item selection
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [items, setItems] = useState<InventoryItemOption[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemSearch, setItemSearch] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<TransferFormInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(transferFormSchema) as any,
    defaultValues: {
      toClinicId: '',
      reason: '',
      notes: '',
      isUrgent: false,
      urgentReason: '',
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const isUrgent = watch('isUrgent');
  const selectedItems = watch('items');

  // Fetch clinics
  useEffect(() => {
    const fetchClinics = async () => {
      setLoadingClinics(true);
      try {
        const response = await fetch('/api/clinics?status=ACTIVE&pageSize=100');
        const result = await response.json();
        if (result.success) {
          // Filter out current clinic (user's clinic) - transfers to other clinics
          setClinics(result.data.items || result.data || []);
        }
      } catch {
        // Silent fail
      } finally {
        setLoadingClinics(false);
      }
    };
    fetchClinics();
  }, []);

  // Fetch inventory items
  const fetchItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const params = new URLSearchParams({
        status: 'ACTIVE',
        pageSize: '50',
      });
      if (itemSearch) params.set('search', itemSearch);

      const response = await fetch(`/api/resources/inventory?${params}`);
      const result = await response.json();
      if (result.success) {
        setItems(result.data.items || []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoadingItems(false);
    }
  }, [itemSearch]);

  useEffect(() => {
    if (itemDialogOpen) {
      fetchItems();
    }
  }, [itemDialogOpen, fetchItems]);

  // Add item to transfer
  const addItem = (item: InventoryItemOption) => {
    // Check if already added
    if (selectedItems.some((i) => i.itemId === item.id)) {
      return;
    }

    append({
      itemId: item.id,
      itemName: item.name,
      itemSku: item.sku,
      availableStock: item.availableStock,
      requestedQuantity: 1,
    });
    setItemDialogOpen(false);
  };

  const onSubmit = async (data: TransferFormInput) => {
    setSubmitting(true);
    setError(null);

    try {
      // Validate quantities against available stock
      const invalidItems = data.items.filter((item) => {
        return item.availableStock !== undefined && item.requestedQuantity > item.availableStock;
      });

      if (invalidItems.length > 0) {
        setError('One or more items have quantities exceeding available stock');
        setSubmitting(false);
        return;
      }

      const response = await fetch('/api/resources/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toClinicId: data.toClinicId,
          reason: data.reason,
          notes: data.notes,
          isUrgent: data.isUrgent,
          urgentReason: data.urgentReason,
          items: data.items.map((item) => ({
            itemId: item.itemId,
            lotId: item.lotId || null,
            requestedQuantity: item.requestedQuantity,
          })),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create transfer request');
      }

      router.push(`/resources/transfers/${result.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const totalItems = selectedItems.reduce((sum, item) => sum + item.requestedQuantity, 0);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Transfer Details */}
      <Card>
        <CardHeader>
          <CardTitle size="sm" className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Transfer Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Destination Clinic" required error={errors.toClinicId?.message}>
            <Select
              value={watch('toClinicId') || ''}
              onValueChange={(v) => setValue('toClinicId', v)}
              disabled={loadingClinics}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingClinics ? 'Loading...' : 'Select destination clinic...'} />
              </SelectTrigger>
              <SelectContent>
                {clinics.map((clinic) => (
                  <SelectItem key={clinic.id} value={clinic.id}>
                    {clinic.name} ({clinic.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Reason for Transfer" required error={errors.reason?.message}>
            <Input
              {...register('reason')}
              placeholder="e.g., Stock shortage at destination clinic, Consolidation, etc."
            />
          </FormField>

          <FormField label="Notes" error={errors.notes?.message}>
            <Textarea
              {...register('notes')}
              placeholder="Additional notes or special instructions..."
              rows={2}
            />
          </FormField>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Switch
                id="isUrgent"
                checked={isUrgent}
                onCheckedChange={(checked) => setValue('isUrgent', checked)}
              />
              <Label htmlFor="isUrgent" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning-600" />
                Urgent Transfer
              </Label>
            </div>

            {isUrgent && (
              <FormField label="Urgent Reason" error={errors.urgentReason?.message}>
                <Input
                  {...register('urgentReason')}
                  placeholder="Why is this transfer urgent?"
                />
              </FormField>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items to Transfer */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle size="sm" className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Items to Transfer
              {selectedItems.length > 0 && (
                <Badge variant="soft-primary">{selectedItems.length} items</Badge>
              )}
            </CardTitle>
            <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Select Inventory Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or SKU..."
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {loadingItems ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : items.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No items found. Try a different search.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right">Available</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => {
                          const alreadyAdded = selectedItems.some((i) => i.itemId === item.id);
                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">{item.category}</p>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant={item.availableStock > 10 ? 'success' : item.availableStock > 0 ? 'warning' : 'error'}
                                >
                                  {item.availableStock} {item.unitOfMeasure}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addItem(item)}
                                  disabled={alreadyAdded || item.availableStock === 0}
                                >
                                  {alreadyAdded ? 'Added' : 'Add'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {errors.items?.message && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errors.items.message}</AlertDescription>
            </Alert>
          )}

          {fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ArrowRightLeft className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No items added yet.</p>
              <p className="text-sm">Click "Add Item" to select items for transfer.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="text-right w-32">Quantity</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const item = selectedItems[index];
                  const isOverStock = item?.availableStock !== undefined && item.requestedQuantity > item.availableStock;

                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <p className="font-medium">{item?.itemName}</p>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item?.itemSku}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={isOverStock ? 'error' : 'soft-primary'}>
                          {item?.availableStock ?? '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="1"
                          max={item?.availableStock}
                          {...register(`items.${index}.requestedQuantity`, { valueAsNumber: true })}
                          className={`w-24 text-right ${isOverStock ? 'border-error-500' : ''}`}
                        />
                        {errors.items?.[index]?.requestedQuantity && (
                          <p className="text-xs text-error-500 mt-1">
                            {errors.items[index]?.requestedQuantity?.message}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-error-600 hover:text-error-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {fields.length > 0 && (
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <p className="text-muted-foreground">
                Total: <span className="font-semibold text-foreground">{totalItems} units</span> across{' '}
                <span className="font-semibold text-foreground">{fields.length} items</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || fields.length === 0}>
          {submitting ? 'Creating...' : 'Create Transfer Request'}
        </Button>
      </div>
    </form>
  );
}
