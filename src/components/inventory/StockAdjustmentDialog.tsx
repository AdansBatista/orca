'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, Plus, Minus } from 'lucide-react';
import type { InventoryItem, InventoryLot } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem & { lots?: InventoryLot[] };
  mode: 'add' | 'remove';
  onComplete: () => void;
}

const adjustmentSchema = z.object({
  quantity: z.number().int().positive('Quantity must be positive'),
  reason: z.string().min(1, 'Reason is required').max(500),
  notes: z.string().max(1000).optional(),
  lotId: z.string().optional(),
});

const usageSchema = z.object({
  quantity: z.number().int().positive('Quantity must be positive'),
  lotId: z.string().optional(),
  patientId: z.string().optional(),
  appointmentId: z.string().optional(),
  procedureId: z.string().optional(),
  providerId: z.string().optional(),
  notes: z.string().max(500).optional(),
});

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;
type UsageFormData = z.infer<typeof usageSchema>;

const adjustmentReasons = [
  { value: 'COUNT_CORRECTION', label: 'Count Correction' },
  { value: 'RECEIVED', label: 'Received Shipment' },
  { value: 'FOUND', label: 'Found Stock' },
  { value: 'RETURNED', label: 'Returned by Patient' },
  { value: 'TRANSFER_IN', label: 'Transfer In' },
];

const removalReasons = [
  { value: 'USED', label: 'Used in Treatment' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'LOST', label: 'Lost/Missing' },
  { value: 'RETURNED_TO_SUPPLIER', label: 'Returned to Supplier' },
  { value: 'TRANSFER_OUT', label: 'Transfer Out' },
  { value: 'COUNT_CORRECTION', label: 'Count Correction' },
];

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  item,
  mode,
  onComplete,
}: StockAdjustmentDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lots, setLots] = useState<InventoryLot[]>(item.lots || []);
  const [loadingLots, setLoadingLots] = useState(false);
  const [usePatientUsage, setUsePatientUsage] = useState(false);

  const isRemove = mode === 'remove';
  const schema = isRemove && usePatientUsage ? usageSchema : adjustmentSchema;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AdjustmentFormData | UsageFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      quantity: 1,
      reason: '',
      notes: '',
    },
  });

  const quantity = watch('quantity') || 0;
  const selectedLotId = watch('lotId');

  // Fetch lots if item tracks lots
  useEffect(() => {
    if (open && item.trackLots && lots.length === 0) {
      const fetchLots = async () => {
        setLoadingLots(true);
        try {
          const response = await fetch(`/api/resources/inventory/${item.id}/lots?status=AVAILABLE`);
          const result = await response.json();
          if (result.success) {
            setLots(result.data.items || []);
          }
        } catch {
          // Silent fail
        } finally {
          setLoadingLots(false);
        }
      };
      fetchLots();
    }
  }, [open, item.trackLots, item.id, lots.length]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({
        quantity: 1,
        reason: '',
        notes: '',
      });
      setError(null);
      setUsePatientUsage(false);
    }
  }, [open, reset]);

  const onSubmit = async (data: AdjustmentFormData | UsageFormData) => {
    setSubmitting(true);
    setError(null);

    // Validate removal quantity
    if (isRemove) {
      const availableStock = selectedLotId
        ? lots.find((l) => l.id === selectedLotId)?.currentQuantity || 0
        : item.currentStock;

      if (quantity > availableStock) {
        setError(`Insufficient stock. Available: ${availableStock}`);
        setSubmitting(false);
        return;
      }
    }

    try {
      let url: string;
      let body: Record<string, unknown>;

      if (isRemove && usePatientUsage) {
        // Use the usage endpoint for patient treatment
        url = `/api/resources/inventory/${item.id}/use`;
        body = data;
      } else {
        // Use the adjustment endpoint
        url = `/api/resources/inventory/${item.id}/adjust`;
        const adjustData = data as AdjustmentFormData;
        body = {
          quantity: isRemove ? -Math.abs(adjustData.quantity) : Math.abs(adjustData.quantity),
          reason: adjustData.reason,
          notes: adjustData.notes,
          lotId: adjustData.lotId,
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to adjust stock');
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const reasons = isRemove ? removalReasons : adjustmentReasons;
  const newStock = isRemove ? item.currentStock - quantity : item.currentStock + quantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isRemove ? (
              <Minus className="h-5 w-5 text-error-500" />
            ) : (
              <Plus className="h-5 w-5 text-success-500" />
            )}
            {isRemove ? 'Remove Stock' : 'Add Stock'}
          </DialogTitle>
          <DialogDescription>
            {item.name} ({item.sku})
            <br />
            Current stock: <strong>{item.currentStock}</strong> {item.unitOfMeasure.toLowerCase()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isRemove && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="usePatientUsage"
                checked={usePatientUsage}
                onChange={(e) => setUsePatientUsage(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="usePatientUsage" className="text-sm">
                Record as patient treatment usage
              </label>
            </div>
          )}

          <FormField label="Quantity" required error={(errors as { quantity?: { message?: string } }).quantity?.message}>
            <Input
              {...register('quantity', { valueAsNumber: true })}
              type="number"
              min="1"
              max={isRemove ? item.currentStock : undefined}
              placeholder="Enter quantity"
            />
          </FormField>

          {!usePatientUsage && (
            <FormField label="Reason" required error={(errors as { reason?: { message?: string } }).reason?.message}>
              <Select
                value={watch('reason') as string || ''}
                onValueChange={(v) => setValue('reason' as keyof (AdjustmentFormData | UsageFormData), v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent>
                  {reasons.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}

          {item.trackLots && lots.length > 0 && (
            <FormField label="Lot" error={(errors as { lotId?: { message?: string } }).lotId?.message}>
              <Select
                value={selectedLotId || 'auto'}
                onValueChange={(v) => setValue('lotId', v === 'auto' ? undefined : v)}
                disabled={loadingLots}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingLots ? 'Loading...' : 'Auto (FIFO)'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (FIFO)</SelectItem>
                  {lots.map((lot) => (
                    <SelectItem key={lot.id} value={lot.id}>
                      {lot.lotNumber} - Qty: {lot.currentQuantity}
                      {lot.expirationDate && ` (Exp: ${new Date(lot.expirationDate).toLocaleDateString()})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}

          <FormField label="Notes" error={(errors as { notes?: { message?: string } }).notes?.message}>
            <Textarea
              {...register('notes')}
              placeholder="Optional notes..."
              rows={2}
            />
          </FormField>

          {/* Preview */}
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <div className="flex justify-between">
              <span>Current stock:</span>
              <span>{item.currentStock}</span>
            </div>
            <div className="flex justify-between">
              <span>{isRemove ? 'Removing:' : 'Adding:'}</span>
              <span className={isRemove ? 'text-error-600' : 'text-success-600'}>
                {isRemove ? '-' : '+'}{quantity}
              </span>
            </div>
            <div className="flex justify-between font-medium border-t border-border mt-2 pt-2">
              <span>New stock:</span>
              <span className={newStock < item.reorderPoint ? 'text-warning-600' : ''}>
                {newStock}
              </span>
            </div>
            {newStock < item.reorderPoint && newStock > 0 && (
              <p className="text-xs text-warning-600 mt-1">
                ⚠️ Below reorder point ({item.reorderPoint})
              </p>
            )}
            {newStock <= 0 && isRemove && (
              <p className="text-xs text-error-600 mt-1">
                ⚠️ This will result in zero or negative stock
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || (isRemove && quantity > item.currentStock)}
              variant={isRemove ? 'destructive' : 'default'}
            >
              {submitting ? 'Processing...' : isRemove ? 'Remove Stock' : 'Add Stock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
