'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  Building2,
  Calendar,
  Package,
  FileText,
  CheckCircle,
  XCircle,
  Truck,
  Clock,
} from 'lucide-react';
import type { PurchaseOrder, Supplier, PurchaseOrderItem, InventoryItem } from '@prisma/client';

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

type PurchaseOrderItemWithDetails = PurchaseOrderItem & {
  item?: Pick<InventoryItem, 'id' | 'name' | 'sku'>;
};

type PurchaseOrderWithRelations = PurchaseOrder & {
  supplier?: Pick<Supplier, 'id' | 'name' | 'code' | 'email' | 'phone'>;
  items?: PurchaseOrderItemWithDetails[];
  _count?: {
    items: number;
  };
};

interface PurchaseOrderDetailProps {
  orderId: string;
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'default' | 'info'; icon: typeof Clock }> = {
  DRAFT: { label: 'Draft', variant: 'default', icon: FileText },
  SUBMITTED: { label: 'Submitted', variant: 'info', icon: Clock },
  APPROVED: { label: 'Approved', variant: 'success', icon: CheckCircle },
  ORDERED: { label: 'Ordered', variant: 'warning', icon: ShoppingCart },
  PARTIALLY_RECEIVED: { label: 'Partial', variant: 'warning', icon: Truck },
  RECEIVED: { label: 'Received', variant: 'success', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', variant: 'error', icon: XCircle },
};

export function PurchaseOrderDetail({ orderId }: PurchaseOrderDetailProps) {
  const router = useRouter();
  const [order, setOrder] = useState<PurchaseOrderWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'submit' | 'cancel' | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/resources/purchase-orders/${orderId}`);
      const result = await response.json();
      if (result.success) {
        setOrder(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch purchase order');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleAction = async () => {
    if (!actionType) return;
    setProcessing(true);
    try {
      const endpoint = actionType === 'cancel'
        ? `/api/resources/purchase-orders/${orderId}`
        : `/api/resources/purchase-orders/${orderId}/${actionType}`;

      const response = await fetch(endpoint, {
        method: actionType === 'cancel' ? 'DELETE' : 'POST',
      });
      const result = await response.json();

      if (result.success) {
        if (actionType === 'cancel') {
          router.push('/resources/purchase-orders');
        } else {
          fetchOrder();
        }
      } else {
        setError(result.error?.message || `Failed to ${actionType} order`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setProcessing(false);
      setActionDialogOpen(false);
      setActionType(null);
    }
  };

  const openActionDialog = (type: 'approve' | 'submit' | 'cancel') => {
    setActionType(type);
    setActionDialogOpen(true);
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

  if (error || !order) {
    return (
      <Card variant="ghost">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-error-500 mx-auto mb-2" />
          <p className="text-error-600">{error || 'Purchase order not found'}</p>
          <Button variant="outline" onClick={fetchOrder} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const status = statusConfig[order.status] || statusConfig.DRAFT;
  const StatusIcon = status.icon;
  const itemCount = order.items?.length || order._count?.items || 0;
  const totalReceived = order.items?.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0) || 0;
  const totalOrdered = order.items?.reduce((sum, item) => sum + item.orderedQuantity, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/resources/purchase-orders">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {order.status === 'DRAFT' && (
            <Button variant="outline" size="sm" onClick={() => openActionDialog('submit')}>
              Submit Order
            </Button>
          )}
          {order.status === 'SUBMITTED' && (
            <Button variant="default" size="sm" onClick={() => openActionDialog('approve')}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
          )}
          {['DRAFT', 'SUBMITTED'].includes(order.status) && (
            <Button variant="destructive" size="sm" onClick={() => openActionDialog('cancel')}>
              <XCircle className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
          {order.status === 'APPROVED' && (
            <Button variant="default" size="sm" asChild>
              <Link href={`/resources/purchase-orders/${orderId}/receive`}>
                <Truck className="h-4 w-4 mr-1" />
                Receive Items
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Title & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold">{order.poNumber}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant={status.variant} className="flex items-center gap-1">
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
            {order.supplier && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {order.supplier.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatsRow>
        <StatCard accentColor="primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <p className="text-xl font-bold">${Number(order.totalAmount).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                Subtotal: ${Number(order.subtotal).toFixed(2)}
              </p>
            </div>
            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
          </div>
        </StatCard>
        <StatCard accentColor="accent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Items</p>
              <p className="text-xl font-bold">{itemCount}</p>
              <p className="text-xs text-muted-foreground">{totalOrdered} units total</p>
            </div>
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
        </StatCard>
        <StatCard accentColor={totalReceived >= totalOrdered ? 'success' : 'warning'}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Received</p>
              <p className="text-xl font-bold">{totalReceived} / {totalOrdered}</p>
              <p className="text-xs text-muted-foreground">
                {totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0}% complete
              </p>
            </div>
            <Truck className="h-8 w-8 text-muted-foreground" />
          </div>
        </StatCard>
        <StatCard accentColor="secondary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Expected Date</p>
              <p className="text-xl font-bold">
                {order.expectedDate
                  ? new Date(order.expectedDate).toLocaleDateString()
                  : 'Not set'}
              </p>
              <p className="text-xs text-muted-foreground">
                Ordered: {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '-'}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
        </StatCard>
      </StatsRow>

      {/* Order Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle size="sm">Supplier Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {order.supplier ? (
              <>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{order.supplier.name}</span>
                  <span className="text-xs text-muted-foreground">({order.supplier.code})</span>
                </div>
                {order.supplier.email && (
                  <p className="text-muted-foreground">{order.supplier.email}</p>
                )}
                {order.supplier.phone && (
                  <p className="text-muted-foreground">{order.supplier.phone}</p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">No supplier information</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle size="sm">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">Order Date:</span>
                <p>{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Expected:</span>
                <p>{order.expectedDate ? new Date(order.expectedDate).toLocaleDateString() : '-'}</p>
              </div>
              {order.receivedDate && (
                <div>
                  <span className="text-muted-foreground">Received:</span>
                  <p>{new Date(order.receivedDate).toLocaleDateString()}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Payment Terms:</span>
                <p>{order.paymentTerms || 'Not specified'}</p>
              </div>
            </div>
            {order.notes && (
              <div className="pt-2 border-t">
                <span className="text-muted-foreground">Notes:</span>
                <p>{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          {order.items && order.items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Ordered</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right">Line Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.item ? (
                        <Link
                          href={`/resources/inventory/${item.item.id}`}
                          className="text-primary-600 hover:underline"
                        >
                          {item.item.name}
                        </Link>
                      ) : (
                        <span>{item.description}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.item?.sku || item.sku}
                    </TableCell>
                    <TableCell className="text-right">
                      ${Number(item.unitPrice).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">{item.orderedQuantity}</TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        (item.receivedQuantity || 0) >= item.orderedQuantity
                          ? 'text-success-600'
                          : (item.receivedQuantity || 0) > 0
                            ? 'text-warning-600'
                            : 'text-muted-foreground'
                      )}>
                        {item.receivedQuantity || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${Number(item.lineTotal).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === 'RECEIVED' ? 'success' :
                          item.status === 'PARTIALLY_RECEIVED' ? 'warning' : 'default'
                        }
                        className="text-xs"
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">No items in this order</p>
          )}

          {/* Order Totals */}
          {order.items && order.items.length > 0 && (
            <div className="mt-4 pt-4 border-t flex justify-end">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>${Number(order.subtotal).toFixed(2)}</span>
                </div>
                {order.taxAmount && Number(order.taxAmount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax:</span>
                    <span>${Number(order.taxAmount).toFixed(2)}</span>
                  </div>
                )}
                {order.shippingAmount && Number(order.shippingAmount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping:</span>
                    <span>${Number(order.shippingAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-1 border-t">
                  <span>Total:</span>
                  <span>${Number(order.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approve Purchase Order'}
              {actionType === 'submit' && 'Submit Purchase Order'}
              {actionType === 'cancel' && 'Cancel Purchase Order'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' && `Approve order ${order.poNumber}? This will allow receiving items.`}
              {actionType === 'submit' && `Submit order ${order.poNumber} for approval?`}
              {actionType === 'cancel' && `Cancel order ${order.poNumber}? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'cancel' ? 'destructive' : 'default'}
              onClick={handleAction}
              disabled={processing}
            >
              {processing ? 'Processing...' : actionType === 'cancel' ? 'Cancel Order' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
