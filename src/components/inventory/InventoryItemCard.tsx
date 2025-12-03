'use client';

import Link from 'next/link';
import { Package, AlertTriangle, AlertCircle, CheckCircle, Archive, Clock } from 'lucide-react';
import type { InventoryItem, Supplier } from '@prisma/client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type InventoryItemWithRelations = InventoryItem & {
  supplier?: Pick<Supplier, 'id' | 'name' | 'code'> | null;
  _count?: {
    lots: number;
    stockMovements: number;
    reorderAlerts: number;
  };
};

interface InventoryItemCardProps {
  item: InventoryItemWithRelations;
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'default'; icon: typeof CheckCircle }> = {
  ACTIVE: { label: 'Active', variant: 'success', icon: CheckCircle },
  DISCONTINUED: { label: 'Discontinued', variant: 'error', icon: Archive },
  BACKORDERED: { label: 'Backordered', variant: 'warning', icon: Clock },
  INACTIVE: { label: 'Inactive', variant: 'default', icon: Package },
  PENDING_APPROVAL: { label: 'Pending', variant: 'warning', icon: Clock },
};

const categoryConfig: Record<string, { label: string; variant: 'info' | 'soft-accent' | 'soft-secondary' | 'soft-primary' | 'success' | 'warning' | 'error' | 'ghost' | 'secondary' }> = {
  BRACKETS: { label: 'Brackets', variant: 'info' },
  WIRES: { label: 'Wires', variant: 'soft-accent' },
  ELASTICS: { label: 'Elastics', variant: 'soft-secondary' },
  BANDS: { label: 'Bands', variant: 'soft-primary' },
  BONDING: { label: 'Bonding', variant: 'success' },
  IMPRESSION: { label: 'Impression', variant: 'warning' },
  RETAINERS: { label: 'Retainers', variant: 'info' },
  INSTRUMENTS: { label: 'Instruments', variant: 'soft-accent' },
  DISPOSABLES: { label: 'Disposables', variant: 'ghost' },
  PPE: { label: 'PPE', variant: 'error' },
  OFFICE_SUPPLIES: { label: 'Office', variant: 'warning' },
  CLEANING: { label: 'Cleaning', variant: 'success' },
  OTHER: { label: 'Other', variant: 'secondary' },
};

function getStockStatus(item: InventoryItemWithRelations): {
  status: 'OUT_OF_STOCK' | 'CRITICAL' | 'LOW' | 'NORMAL' | 'OVERSTOCKED';
  label: string;
  variant: 'error' | 'warning' | 'info' | 'success';
} {
  if (item.currentStock === 0) {
    return { status: 'OUT_OF_STOCK', label: 'Out of Stock', variant: 'error' };
  }
  if (item.currentStock <= item.safetyStock) {
    return { status: 'CRITICAL', label: 'Critical', variant: 'error' };
  }
  if (item.currentStock <= item.reorderPoint) {
    return { status: 'LOW', label: 'Low Stock', variant: 'warning' };
  }
  if (item.maxStock && item.currentStock > item.maxStock) {
    return { status: 'OVERSTOCKED', label: 'Overstocked', variant: 'info' };
  }
  return { status: 'NORMAL', label: 'In Stock', variant: 'success' };
}

export function InventoryItemCard({ item }: InventoryItemCardProps) {
  const status = statusConfig[item.status] || statusConfig.ACTIVE;
  const StatusIcon = status.icon;
  const category = categoryConfig[item.category] || categoryConfig.OTHER;
  const stockStatus = getStockStatus(item);

  const hasActiveAlerts = (item._count?.reorderAlerts || 0) > 0;

  return (
    <Link href={`/resources/inventory/${item.id}`}>
      <Card interactive className="h-full">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Item Name & SKU */}
              <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
              <p className="text-sm text-muted-foreground">{item.sku}</p>

              {/* Category & Brand */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant={category.variant} size="sm">
                  {category.label}
                </Badge>
                {item.brand && (
                  <span className="text-xs text-muted-foreground">
                    {item.brand}
                  </span>
                )}
              </div>

              {/* Supplier */}
              {item.supplier && (
                <p className="text-xs text-muted-foreground mt-2 truncate">
                  Supplier: {item.supplier.name}
                </p>
              )}

              {/* Alerts */}
              {hasActiveAlerts && stockStatus.status !== 'NORMAL' && (
                <div className="flex items-center gap-1 text-xs text-warning-600 mt-2">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Reorder needed</span>
                </div>
              )}
            </div>

            {/* Status & Stock */}
            <div className="flex flex-col items-end gap-2">
              <Badge variant={status.variant} className="gap-1">
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
            </div>
          </div>

          {/* Stock Level Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <Badge variant={stockStatus.variant} size="sm">
                {stockStatus.label}
              </Badge>
              <span className="text-muted-foreground">
                {item.currentStock} / {item.maxStock || item.reorderPoint * 2} {item.unitOfMeasure.toLowerCase()}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  stockStatus.status === 'OUT_OF_STOCK' ? 'bg-error-500' :
                  stockStatus.status === 'CRITICAL' ? 'bg-error-500' :
                  stockStatus.status === 'LOW' ? 'bg-warning-500' :
                  stockStatus.status === 'OVERSTOCKED' ? 'bg-info-500' :
                  'bg-success-500'
                }`}
                style={{
                  width: `${Math.min(100, (item.currentStock / (item.maxStock || item.reorderPoint * 2)) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Cost Info */}
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Unit Cost
            </span>
            <span className="text-sm font-medium">
              ${item.unitCost.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
