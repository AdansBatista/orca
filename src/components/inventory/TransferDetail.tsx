'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRightLeft,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  Building2,
  Calendar,
  Package,
  CheckCircle,
  XCircle,
  Truck,
  Clock,
  AlertCircle,
} from 'lucide-react';
import type { InventoryTransfer, Clinic, TransferItem, InventoryItem } from '@prisma/client';

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
import { TransferTracker } from './TransferTracker';

type TransferItemWithDetails = TransferItem & {
  item?: Pick<InventoryItem, 'id' | 'name' | 'sku'>;
};

type TransferWithRelations = InventoryTransfer & {
  fromClinic?: Pick<Clinic, 'id' | 'name'>;
  toClinic?: Pick<Clinic, 'id' | 'name'>;
  items?: TransferItemWithDetails[];
};

interface TransferDetailProps {
  transferId: string;
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'default' | 'info'; icon: typeof Clock }> = {
  REQUESTED: { label: 'Requested', variant: 'default', icon: Clock },
  APPROVED: { label: 'Approved', variant: 'info', icon: CheckCircle },
  REJECTED: { label: 'Rejected', variant: 'error', icon: XCircle },
  PREPARING: { label: 'Preparing', variant: 'warning', icon: Package },
  IN_TRANSIT: { label: 'In Transit', variant: 'warning', icon: Truck },
  RECEIVED: { label: 'Received', variant: 'success', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', variant: 'error', icon: XCircle },
};

export function TransferDetail({ transferId }: TransferDetailProps) {
  const router = useRouter();
  const [transfer, setTransfer] = useState<TransferWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'ship' | 'receive' | 'cancel' | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchTransfer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/resources/transfers/${transferId}`);
      const result = await response.json();
      if (result.success) {
        setTransfer(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch transfer');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [transferId]);

  useEffect(() => {
    fetchTransfer();
  }, [fetchTransfer]);

  const handleAction = async () => {
    if (!actionType) return;
    setProcessing(true);
    try {
      const endpoint = `/api/resources/transfers/${transferId}/${actionType}`;
      const response = await fetch(endpoint, {
        method: 'POST',
      });
      const result = await response.json();

      if (result.success) {
        fetchTransfer();
      } else {
        setError(result.error?.message || `Failed to ${actionType} transfer`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setProcessing(false);
      setActionDialogOpen(false);
      setActionType(null);
    }
  };

  const openActionDialog = (type: 'approve' | 'reject' | 'ship' | 'receive' | 'cancel') => {
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

  if (error || !transfer) {
    return (
      <Card variant="ghost">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-error-500 mx-auto mb-2" />
          <p className="text-error-600">{error || 'Transfer not found'}</p>
          <Button variant="outline" onClick={fetchTransfer} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const status = statusConfig[transfer.status] || statusConfig.REQUESTED;
  const StatusIcon = status.icon;
  const itemCount = transfer.items?.length || 0;
  const totalRequested = transfer.items?.reduce((sum, item) => sum + item.requestedQuantity, 0) || 0;
  const totalReceived = transfer.items?.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/resources/transfers">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {transfer.status === 'REQUESTED' && (
            <>
              <Button variant="default" size="sm" onClick={() => openActionDialog('approve')}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button variant="destructive" size="sm" onClick={() => openActionDialog('reject')}>
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </>
          )}
          {transfer.status === 'APPROVED' && (
            <Button variant="default" size="sm" onClick={() => openActionDialog('ship')}>
              <Truck className="h-4 w-4 mr-1" />
              Mark as Shipped
            </Button>
          )}
          {transfer.status === 'IN_TRANSIT' && (
            <Button variant="default" size="sm" onClick={() => openActionDialog('receive')}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Receive Items
            </Button>
          )}
          {['REQUESTED', 'APPROVED'].includes(transfer.status) && (
            <Button variant="outline" size="sm" onClick={() => openActionDialog('cancel')}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Title & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ArrowRightLeft className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold">{transfer.transferNumber}</h1>
            {transfer.isUrgent && (
              <Badge variant="warning" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Urgent
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant={status.variant} className="flex items-center gap-1">
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Transfer Tracker */}
      <TransferTracker
        status={transfer.status}
        transferNumber={transfer.transferNumber}
        fromClinic={transfer.fromClinic?.name || 'Unknown'}
        toClinic={transfer.toClinic?.name || 'Unknown'}
        requestedDate={transfer.requestedDate}
        approvedDate={transfer.approvedDate}
        shippedDate={transfer.shippedDate}
        receivedDate={transfer.receivedDate}
        isUrgent={transfer.isUrgent}
        trackingNumber={transfer.trackingNumber}
        carrierName={transfer.carrierName}
        compact
      />

      {/* Stats */}
      <StatsRow>
        <StatCard accentColor="primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">From</p>
              <p className="text-lg font-bold">{transfer.fromClinic?.name}</p>
              <p className="text-xs text-muted-foreground">Origin Clinic</p>
            </div>
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
        </StatCard>
        <StatCard accentColor="accent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">To</p>
              <p className="text-lg font-bold">{transfer.toClinic?.name}</p>
              <p className="text-xs text-muted-foreground">Destination Clinic</p>
            </div>
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
        </StatCard>
        <StatCard accentColor="secondary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Items</p>
              <p className="text-xl font-bold">{itemCount}</p>
              <p className="text-xs text-muted-foreground">{totalRequested} units total</p>
            </div>
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
        </StatCard>
        <StatCard accentColor={totalReceived >= totalRequested && transfer.status === 'RECEIVED' ? 'success' : 'warning'}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Received</p>
              <p className="text-xl font-bold">{totalReceived} / {totalRequested}</p>
              <p className="text-xs text-muted-foreground">
                {totalRequested > 0 ? Math.round((totalReceived / totalRequested) * 100) : 0}% complete
              </p>
            </div>
            <Truck className="h-8 w-8 text-muted-foreground" />
          </div>
        </StatCard>
      </StatsRow>

      {/* Transfer Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle size="sm">Transfer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Reason:</span>
              <p>{transfer.reason}</p>
            </div>
            {transfer.notes && (
              <div>
                <span className="text-muted-foreground">Notes:</span>
                <p>{transfer.notes}</p>
              </div>
            )}
            {transfer.isUrgent && transfer.urgentReason && (
              <div className="p-2 bg-warning-100 dark:bg-warning-900/30 rounded">
                <span className="text-warning-700 dark:text-warning-400 text-xs font-medium">Urgent Reason:</span>
                <p className="text-warning-800 dark:text-warning-300">{transfer.urgentReason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle size="sm">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">Requested:</span>
                <p className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(transfer.requestedDate).toLocaleDateString()}
                </p>
              </div>
              {transfer.approvedDate && (
                <div>
                  <span className="text-muted-foreground">Approved:</span>
                  <p>{new Date(transfer.approvedDate).toLocaleDateString()}</p>
                </div>
              )}
              {transfer.shippedDate && (
                <div>
                  <span className="text-muted-foreground">Shipped:</span>
                  <p>{new Date(transfer.shippedDate).toLocaleDateString()}</p>
                </div>
              )}
              {transfer.receivedDate && (
                <div>
                  <span className="text-muted-foreground">Received:</span>
                  <p>{new Date(transfer.receivedDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
            {transfer.trackingNumber && (
              <div className="pt-2 border-t">
                <span className="text-muted-foreground">Tracking:</span>
                <p className="font-mono">{transfer.trackingNumber}</p>
                {transfer.carrierName && (
                  <p className="text-xs text-muted-foreground">{transfer.carrierName}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transfer Items */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Transfer Items</CardTitle>
        </CardHeader>
        <CardContent>
          {transfer.items && transfer.items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Requested</TableHead>
                  <TableHead className="text-right">Approved</TableHead>
                  <TableHead className="text-right">Shipped</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfer.items.map((item) => (
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
                        <span className="text-muted-foreground">Unknown Item</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.item?.sku || '-'}
                    </TableCell>
                    <TableCell className="text-right">{item.requestedQuantity}</TableCell>
                    <TableCell className="text-right">
                      {item.approvedQuantity ?? '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.shippedQuantity ?? '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        (item.receivedQuantity || 0) >= item.requestedQuantity
                          ? 'text-success-600'
                          : (item.receivedQuantity || 0) > 0
                            ? 'text-warning-600'
                            : 'text-muted-foreground'
                      )}>
                        {item.receivedQuantity ?? '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === 'RECEIVED' ? 'success' :
                          item.status === 'SHIPPED' ? 'warning' :
                          item.status === 'APPROVED' ? 'info' : 'default'
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
            <p className="text-muted-foreground text-center py-8">No items in this transfer</p>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approve Transfer'}
              {actionType === 'reject' && 'Reject Transfer'}
              {actionType === 'ship' && 'Mark as Shipped'}
              {actionType === 'receive' && 'Receive Items'}
              {actionType === 'cancel' && 'Cancel Transfer'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' && `Approve transfer ${transfer.transferNumber}?`}
              {actionType === 'reject' && `Reject transfer ${transfer.transferNumber}?`}
              {actionType === 'ship' && `Mark transfer ${transfer.transferNumber} as shipped?`}
              {actionType === 'receive' && `Confirm receipt of transfer ${transfer.transferNumber}?`}
              {actionType === 'cancel' && `Cancel transfer ${transfer.transferNumber}? This cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'reject' || actionType === 'cancel' ? 'destructive' : 'default'}
              onClick={handleAction}
              disabled={processing}
            >
              {processing ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
