'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package,
  Edit,
  Trash2,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Plus,
  Minus,
  History,
  Box,
  Calendar,
  Building2,
  BarChart3,
} from 'lucide-react';
import type { InventoryItem, Supplier, InventoryLot, StockMovement } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { StatsRow } from '@/components/layout';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { StockAdjustmentDialog } from './StockAdjustmentDialog';

type InventoryItemWithRelations = InventoryItem & {
  supplier?: Pick<Supplier, 'id' | 'name' | 'code'> | null;
  lots?: InventoryLot[];
  _count?: {
    lots: number;
    stockMovements: number;
    reorderAlerts: number;
  };
};

type StockMovementWithItem = StockMovement & {
  item?: { name: string; sku: string };
  lot?: { lotNumber: string } | null;
};

interface InventoryDetailProps {
  itemId: string;
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'default' }> = {
  ACTIVE: { label: 'Active', variant: 'success' },
  DISCONTINUED: { label: 'Discontinued', variant: 'error' },
  BACKORDERED: { label: 'Backordered', variant: 'warning' },
  INACTIVE: { label: 'Inactive', variant: 'default' },
  PENDING_APPROVAL: { label: 'Pending', variant: 'warning' },
};

const categoryConfig: Record<string, { label: string; color: string }> = {
  BRACKETS: { label: 'Brackets', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  WIRES: { label: 'Wires', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  ELASTICS: { label: 'Elastics', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400' },
  BANDS: { label: 'Bands', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' },
  BONDING: { label: 'Bonding', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  IMPRESSION: { label: 'Impression', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  RETAINERS: { label: 'Retainers', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' },
  INSTRUMENTS: { label: 'Instruments', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
  DISPOSABLES: { label: 'Disposables', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  PPE: { label: 'PPE', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  OFFICE_SUPPLIES: { label: 'Office', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  CLEANING: { label: 'Cleaning', color: 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-400' },
  OTHER: { label: 'Other', color: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400' },
};

function getStockStatus(item: InventoryItemWithRelations) {
  if (item.currentStock === 0) {
    return { label: 'Out of Stock', color: 'text-error-600 bg-error-100 dark:bg-error-900/30', status: 'critical' };
  }
  if (item.currentStock <= item.safetyStock) {
    return { label: 'Critical', color: 'text-error-600 bg-error-100 dark:bg-error-900/30', status: 'critical' };
  }
  if (item.currentStock <= item.reorderPoint) {
    return { label: 'Low Stock', color: 'text-warning-600 bg-warning-100 dark:bg-warning-900/30', status: 'low' };
  }
  if (item.maxStock && item.currentStock > item.maxStock) {
    return { label: 'Overstocked', color: 'text-info-600 bg-info-100 dark:bg-info-900/30', status: 'over' };
  }
  return { label: 'In Stock', color: 'text-success-600 bg-success-100 dark:bg-success-900/30', status: 'normal' };
}

export function InventoryDetail({ itemId }: InventoryDetailProps) {
  const router = useRouter();
  const [item, setItem] = useState<InventoryItemWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustMode, setAdjustMode] = useState<'add' | 'remove'>('add');

  // Stock movements
  const [movements, setMovements] = useState<StockMovementWithItem[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  // Lots
  const [lots, setLots] = useState<InventoryLot[]>([]);
  const [loadingLots, setLoadingLots] = useState(false);

  const fetchItem = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/resources/inventory/${itemId}`);
      const result = await response.json();
      if (result.success) {
        setItem(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch item');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  const fetchMovements = useCallback(async () => {
    setLoadingMovements(true);
    try {
      const response = await fetch(`/api/resources/inventory/${itemId}/movements?pageSize=20`);
      const result = await response.json();
      if (result.success) {
        setMovements(result.data.items || []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoadingMovements(false);
    }
  }, [itemId]);

  const fetchLots = useCallback(async () => {
    setLoadingLots(true);
    try {
      const response = await fetch(`/api/resources/inventory/${itemId}/lots`);
      const result = await response.json();
      if (result.success) {
        setLots(result.data.items || []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoadingLots(false);
    }
  }, [itemId]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/resources/inventory/${itemId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        router.push('/resources/inventory');
        router.refresh();
      } else {
        setError(result.error?.message || 'Failed to delete item');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const openAdjustDialog = (mode: 'add' | 'remove') => {
    setAdjustMode(mode);
    setAdjustDialogOpen(true);
  };

  const handleAdjustmentComplete = () => {
    setAdjustDialogOpen(false);
    fetchItem();
    fetchMovements();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <Card variant="ghost">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-error-500 mx-auto mb-2" />
          <p className="text-error-600">{error || 'Item not found'}</p>
          <Button variant="outline" onClick={fetchItem} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const status = statusConfig[item.status] || statusConfig.ACTIVE;
  const category = categoryConfig[item.category] || categoryConfig.OTHER;
  const stockStatus = getStockStatus(item);
  const inventoryValue = item.currentStock * Number(item.unitCost || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/resources/inventory">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => openAdjustDialog('add')}>
            <Plus className="h-4 w-4 mr-1" />
            Add Stock
          </Button>
          <Button variant="outline" size="sm" onClick={() => openAdjustDialog('remove')}>
            <Minus className="h-4 w-4 mr-1" />
            Use/Remove
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/resources/inventory/${itemId}/edit`}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Title & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold">{item.name}</h1>
          </div>
          <p className="text-muted-foreground">{item.sku}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={cn('text-xs px-2 py-0.5 rounded-full', category.color)}>
              {category.label}
            </span>
            <Badge variant={status.variant}>{status.label}</Badge>
            {item.brand && (
              <span className="text-xs text-muted-foreground">{item.brand}</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatsRow>
        <StatCard accentColor={stockStatus.status === 'critical' ? 'error' : stockStatus.status === 'low' ? 'warning' : 'success'}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Current Stock</p>
              <p className="text-xl font-bold">{item.currentStock} {item.unitOfMeasure.toLowerCase()}</p>
              <span className={cn('text-xs px-1.5 py-0.5 rounded', stockStatus.color)}>
                {stockStatus.label}
              </span>
            </div>
            <Box className="h-8 w-8 text-muted-foreground" />
          </div>
        </StatCard>
        <StatCard accentColor="primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Unit Cost</p>
              <p className="text-xl font-bold">${Number(item.unitCost).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">per {item.unitOfMeasure.toLowerCase()}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
        </StatCard>
        <StatCard accentColor="accent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Inventory Value</p>
              <p className="text-xl font-bold">${inventoryValue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{item.currentStock} × ${Number(item.unitCost).toFixed(2)}</p>
            </div>
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
        </StatCard>
        <StatCard accentColor="warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Reorder Point</p>
              <p className="text-xl font-bold">{item.reorderPoint}</p>
              <p className="text-xs text-muted-foreground">Safety: {item.safetyStock}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          </div>
        </StatCard>
      </StatsRow>

      {/* Tabs */}
      <Tabs defaultValue="details" onValueChange={(val) => {
        if (val === 'movements' && movements.length === 0) fetchMovements();
        if (val === 'lots' && lots.length === 0) fetchLots();
      }}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="movements">
            <History className="h-4 w-4 mr-1" />
            Movement History
          </TabsTrigger>
          {item.trackLots && (
            <TabsTrigger value="lots">
              <Box className="h-4 w-4 mr-1" />
              Lots
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="details" className="space-y-4 mt-4">
          {/* Item Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle size="sm">Item Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {item.description && (
                  <div>
                    <span className="text-muted-foreground">Description:</span>
                    <p>{item.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground">SKU:</span>
                    <p className="font-mono">{item.sku}</p>
                  </div>
                  {item.barcode && (
                    <div>
                      <span className="text-muted-foreground">Barcode:</span>
                      <p className="font-mono">{item.barcode}</p>
                    </div>
                  )}
                  {item.manufacturer && (
                    <div>
                      <span className="text-muted-foreground">Manufacturer:</span>
                      <p>{item.manufacturer}</p>
                    </div>
                  )}
                  {item.size && (
                    <div>
                      <span className="text-muted-foreground">Size:</span>
                      <p>{item.size}</p>
                    </div>
                  )}
                  {item.color && (
                    <div>
                      <span className="text-muted-foreground">Color:</span>
                      <p>{item.color}</p>
                    </div>
                  )}
                  {item.material && (
                    <div>
                      <span className="text-muted-foreground">Material:</span>
                      <p>{item.material}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle size="sm">Supplier & Ordering</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {item.supplier ? (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{item.supplier.name}</span>
                    <span className="text-xs text-muted-foreground">({item.supplier.code})</span>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No supplier assigned</p>
                )}
                {item.supplierSku && (
                  <div>
                    <span className="text-muted-foreground">Supplier SKU:</span>
                    <p className="font-mono">{item.supplierSku}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground">Lead Time:</span>
                    <p>{item.leadTimeDays} days</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reorder Qty:</span>
                    <p>{item.reorderQuantity}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Unit of Measure:</span>
                    <p>{item.unitOfMeasure}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Units/Package:</span>
                    <p>{item.unitsPerPackage}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle size="sm">Tracking Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Track Lots</span>
                  <Badge variant={item.trackLots ? 'success' : 'default'}>
                    {item.trackLots ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Track Expiration</span>
                  <Badge variant={item.trackExpiry ? 'success' : 'default'}>
                    {item.trackExpiry ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Track Serial Numbers</span>
                  <Badge variant={item.trackSerial ? 'success' : 'default'}>
                    {item.trackSerial ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Orderable</span>
                  <Badge variant={item.isOrderable ? 'success' : 'default'}>
                    {item.isOrderable ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle size="sm">Storage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {item.storageLocation && (
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <p>{item.storageLocation}</p>
                  </div>
                )}
                {item.storageRequirements && (
                  <div>
                    <span className="text-muted-foreground">Requirements:</span>
                    <p>{item.storageRequirements}</p>
                  </div>
                )}
                {!item.storageLocation && !item.storageRequirements && (
                  <p className="text-muted-foreground">No storage information specified</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="movements" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle size="sm">Recent Stock Movements</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingMovements ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : movements.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No movement history</p>
              ) : (
                <div className="space-y-2">
                  {movements.map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          movement.quantity > 0 ? 'bg-success-500' : 'bg-error-500'
                        )} />
                        <div>
                          <p className="text-sm font-medium">
                            {movement.movementType.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(movement.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          'font-mono font-medium',
                          movement.quantity > 0 ? 'text-success-600' : 'text-error-600'
                        )}>
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Stock: {movement.newStock}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {item.trackLots && (
          <TabsContent value="lots" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle size="sm">Lot Information</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingLots ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : lots.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No lots tracked</p>
                ) : (
                  <div className="space-y-2">
                    {lots.map((lot) => (
                      <div key={lot.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div>
                          <p className="font-mono font-medium">{lot.lotNumber}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {lot.expirationDate
                              ? `Expires: ${new Date(lot.expirationDate).toLocaleDateString()}`
                              : 'No expiration'
                            }
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{lot.currentQuantity}</p>
                          <Badge variant={lot.status === 'AVAILABLE' ? 'success' : 'default'} className="text-xs">
                            {lot.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Inventory Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{item.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <StockAdjustmentDialog
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
        item={item}
        mode={adjustMode}
        onComplete={handleAdjustmentComplete}
      />
    </div>
  );
}
