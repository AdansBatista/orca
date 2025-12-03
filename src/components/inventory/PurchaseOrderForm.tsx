'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Search, AlertTriangle, ShoppingCart, Building2 } from 'lucide-react';

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
const orderItemSchema = z.object({
  itemId: z.string().min(1, 'Item is required'),
  itemName: z.string().optional(),
  itemSku: z.string().optional(),
  unitPrice: z.number().positive('Price must be positive'),
  orderedQuantity: z.number().int().positive('Quantity must be positive'),
});

const purchaseOrderFormSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  expectedDate: z.string().optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
});

type PurchaseOrderFormInput = z.infer<typeof purchaseOrderFormSchema>;

interface SupplierOption {
  id: string;
  name: string;
  code: string;
}

interface InventoryItemOption {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitCost: number;
  unitOfMeasure: string;
  reorderQuantity: number;
}

interface PurchaseOrderFormProps {
  mode?: 'create' | 'edit';
  orderId?: string;
}

export function PurchaseOrderForm({ mode = 'create' }: PurchaseOrderFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Async data
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

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
  } = useForm<PurchaseOrderFormInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(purchaseOrderFormSchema) as any,
    defaultValues: {
      supplierId: '',
      expectedDate: '',
      paymentTerms: 'Net 30',
      notes: '',
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const selectedItems = watch('items');

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoadingSuppliers(true);
      try {
        const response = await fetch('/api/resources/suppliers?status=ACTIVE&pageSize=100');
        const result = await response.json();
        if (result.success) {
          setSuppliers(result.data.items || result.data || []);
        }
      } catch {
        // Silent fail
      } finally {
        setLoadingSuppliers(false);
      }
    };
    fetchSuppliers();
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

  // Add item to order
  const addItem = (item: InventoryItemOption) => {
    // Check if already added
    if (selectedItems.some((i) => i.itemId === item.id)) {
      return;
    }

    append({
      itemId: item.id,
      itemName: item.name,
      itemSku: item.sku,
      unitPrice: Number(item.unitCost) || 0,
      orderedQuantity: item.reorderQuantity || 1,
    });
    setItemDialogOpen(false);
  };

  const onSubmit = async (data: PurchaseOrderFormInput) => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/resources/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: data.supplierId,
          expectedDate: data.expectedDate || null,
          paymentTerms: data.paymentTerms,
          notes: data.notes,
          items: data.items.map((item) => ({
            itemId: item.itemId,
            orderedQuantity: item.orderedQuantity,
            unitPrice: item.unitPrice,
          })),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create purchase order');
      }

      router.push(`/resources/purchase-orders/${result.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateSubtotal = () => {
    return selectedItems.reduce((sum, item) => sum + (item.unitPrice * item.orderedQuantity), 0);
  };

  const totalItems = selectedItems.reduce((sum, item) => sum + item.orderedQuantity, 0);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle size="sm" className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Order Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Supplier" required error={errors.supplierId?.message}>
            <Select
              value={watch('supplierId') || ''}
              onValueChange={(v) => setValue('supplierId', v)}
              disabled={loadingSuppliers}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingSuppliers ? 'Loading...' : 'Select supplier...'} />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name} ({supplier.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Expected Delivery Date" error={errors.expectedDate?.message}>
              <Input
                type="date"
                {...register('expectedDate')}
              />
            </FormField>

            <FormField label="Payment Terms" error={errors.paymentTerms?.message}>
              <Select
                value={watch('paymentTerms') || 'Net 30'}
                onValueChange={(v) => setValue('paymentTerms', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Net 15">Net 15</SelectItem>
                  <SelectItem value="Net 30">Net 30</SelectItem>
                  <SelectItem value="Net 45">Net 45</SelectItem>
                  <SelectItem value="Net 60">Net 60</SelectItem>
                  <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                  <SelectItem value="Prepaid">Prepaid</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Notes" error={errors.notes?.message}>
            <Textarea
              {...register('notes')}
              placeholder="Additional notes or special instructions..."
              rows={2}
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle size="sm" className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Order Items
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
                          <TableHead className="text-right">Unit Cost</TableHead>
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
                                ${Number(item.unitCost).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addItem(item)}
                                  disabled={alreadyAdded}
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
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No items added yet.</p>
              <p className="text-sm">Click &quot;Add Item&quot; to select items for this order.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right w-32">Unit Price</TableHead>
                  <TableHead className="text-right w-32">Quantity</TableHead>
                  <TableHead className="text-right w-32">Line Total</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const item = selectedItems[index];
                  const lineTotal = (item?.unitPrice || 0) * (item?.orderedQuantity || 0);

                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <p className="font-medium">{item?.itemName}</p>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item?.itemSku}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                          className="w-24 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="1"
                          {...register(`items.${index}.orderedQuantity`, { valueAsNumber: true })}
                          className="w-24 text-right"
                        />
                        {errors.items?.[index]?.orderedQuantity && (
                          <p className="text-xs text-error-500 mt-1">
                            {errors.items[index]?.orderedQuantity?.message}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${lineTotal.toFixed(2)}
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
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="text-xl font-bold">${calculateSubtotal().toFixed(2)}</p>
              </div>
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
          {submitting ? 'Creating...' : 'Create Purchase Order'}
        </Button>
      </div>
    </form>
  );
}
