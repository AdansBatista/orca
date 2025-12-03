'use client';

import Link from 'next/link';
import { Package, AlertTriangle, AlertCircle, CheckCircle, Archive, Clock } from 'lucide-react';
import type { InventoryItem, Supplier } from '@prisma/client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

function getStockStatus(item: InventoryItemWithRelations): {
  status: 'OUT_OF_STOCK' | 'CRITICAL' | 'LOW' | 'NORMAL' | 'OVERSTOCKED';
  label: string;
  color: string;
} {
  if (item.currentStock === 0) {
    return { status: 'OUT_OF_STOCK', label: 'Out of Stock', color: 'text-error-600 bg-error-100 dark:bg-error-900/30' };
  }
  if (item.currentStock <= item.safetyStock) {
    return { status: 'CRITICAL', label: 'Critical', color: 'text-error-600 bg-error-100 dark:bg-error-900/30' };
  }
  if (item.currentStock <= item.reorderPoint) {
    return { status: 'LOW', label: 'Low Stock', color: 'text-warning-600 bg-warning-100 dark:bg-warning-900/30' };
  }
  if (item.maxStock && item.currentStock > item.maxStock) {
    return { status: 'OVERSTOCKED', label: 'Overstocked', color: 'text-info-600 bg-info-100 dark:bg-info-900/30' };
  }
  return { status: 'NORMAL', label: 'In Stock', color: 'text-success-600 bg-success-100 dark:bg-success-900/30' };
}

export function InventoryItemCard({ item }: InventoryItemCardProps) {
  const status = statusConfig[item.status] || statusConfig.ACTIVE;
  const StatusIcon = status.icon;
  const category = categoryConfig[item.category] || categoryConfig.OTHER;
  const stockStatus = getStockStatus(item);

  const hasActiveAlerts = (item._count?.reorderAlerts || 0) > 0;

  return (
    <Link href={`/resources/inventory/${item.id}`}>
      <Card className="hover:border-primary-300 transition-colors cursor-pointer h-full">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Item Name & SKU */}
              <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
              <p className="text-sm text-muted-foreground">{item.sku}</p>

              {/* Category & Brand */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={cn('text-xs px-2 py-0.5 rounded-full', category.color)}>
                  {category.label}
                </span>
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
              <span className={cn('font-medium px-1.5 py-0.5 rounded', stockStatus.color)}>
                {stockStatus.label}
              </span>
              <span className="text-muted-foreground">
                {item.currentStock} / {item.maxStock || item.reorderPoint * 2} {item.unitOfMeasure.toLowerCase()}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  stockStatus.status === 'OUT_OF_STOCK' ? 'bg-error-500' :
                  stockStatus.status === 'CRITICAL' ? 'bg-error-500' :
                  stockStatus.status === 'LOW' ? 'bg-warning-500' :
                  stockStatus.status === 'OVERSTOCKED' ? 'bg-info-500' :
                  'bg-success-500'
                )}
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
