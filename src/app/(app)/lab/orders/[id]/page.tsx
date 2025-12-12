'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Upload,
  Phone,
  Mail,
  Calendar,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2,
  RefreshCw,
  Plus,
  ExternalLink,
  Zap,
  ClipboardCheck,
  PackageCheck,
  ArrowLeft,
  Send,
  Ban,
  Eye,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  StatCard,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  ListItem,
  ListItemTitle,
  ListItemDescription,
  ListActivity,
} from '@/components/ui/list-item';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormField } from '@/components/ui/form-field';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader, PageContent, DashboardGrid } from '@/components/layout';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName, getFakePhone, getFakeEmail } from '@/lib/fake-data';

interface LabOrder {
  id: string;
  orderNumber: string;
  status: string;
  priority: string;
  isRush: boolean;
  rushLevel: string | null;
  rushReason: string | null;
  orderDate: string;
  submittedAt: string | null;
  neededByDate: string | null;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  subtotal: number;
  rushUpcharge: number;
  shippingCost: number;
  totalCost: number;
  clinicNotes: string | null;
  labNotes: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
  vendor: {
    id: string;
    name: string;
    code: string;
    primaryPhone: string | null;
    primaryEmail: string | null;
  } | null;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    status: string;
    arch: string | null;
    notes: string | null;
  }>;
  shipments: Array<{
    id: string;
    carrier: string;
    trackingNumber: string | null;
    trackingUrl: string | null;
    status: string;
    shippedAt: string | null;
    estimatedDelivery: string | null;
    actualDelivery: string | null;
  }>;
  attachments: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    createdAt: string;
  }>;
  statusLogs: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    source: string;
    notes: string | null;
    createdAt: string;
  }>;
}

const statusConfig: Record<string, { color: 'success' | 'warning' | 'info' | 'destructive' | 'secondary'; label: string; icon: typeof Package }> = {
  DRAFT: { color: 'secondary', label: 'Draft', icon: FileText },
  SUBMITTED: { color: 'info', label: 'Submitted', icon: Send },
  ACKNOWLEDGED: { color: 'info', label: 'Acknowledged', icon: CheckCircle },
  IN_PROGRESS: { color: 'warning', label: 'In Progress', icon: RefreshCw },
  COMPLETED: { color: 'success', label: 'Completed', icon: CheckCircle },
  SHIPPED: { color: 'info', label: 'Shipped', icon: Truck },
  DELIVERED: { color: 'success', label: 'Delivered', icon: PackageCheck },
  RECEIVED: { color: 'success', label: 'Received', icon: ClipboardCheck },
  PATIENT_PICKUP: { color: 'success', label: 'Ready for Pickup', icon: Package },
  PICKED_UP: { color: 'success', label: 'Picked Up', icon: CheckCircle },
  CANCELLED: { color: 'destructive', label: 'Cancelled', icon: XCircle },
  REMAKE_REQUESTED: { color: 'warning', label: 'Remake Requested', icon: RefreshCw },
  ON_HOLD: { color: 'warning', label: 'On Hold', icon: AlertCircle },
};

const itemStatusConfig: Record<string, { color: 'success' | 'warning' | 'info' | 'secondary' | 'error'; label: string }> = {
  PENDING: { color: 'secondary', label: 'Pending' },
  IN_PROGRESS: { color: 'warning', label: 'In Progress' },
  COMPLETED: { color: 'success', label: 'Completed' },
  SHIPPED: { color: 'info', label: 'Shipped' },
  DELIVERED: { color: 'success', label: 'Delivered' },
  INSPECTED: { color: 'info', label: 'Inspected' },
  ACCEPTED: { color: 'success', label: 'Accepted' },
  REJECTED: { color: 'error', label: 'Rejected' },
};

function OrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<LabOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog states
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [newStatus, setNewStatus] = useState('');

  // Fetch order data
  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/lab/orders/${resolvedParams.id}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch order');
        }

        setOrder(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [resolvedParams.id]);

  const handleSubmitOrder = async () => {
    if (!order?.vendor) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/lab/orders/${order.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: order.vendor.id }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to submit order');
      }

      setOrder(result.data);
      setShowSubmitDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/lab/orders/${order?.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to cancel order');
      }

      setOrder(result.data);
      setShowCancelDialog(false);
      setCancelReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/lab/orders/${order?.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update status');
      }

      setOrder(result.data);
      setShowStatusDialog(false);
      setNewStatus('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Order Details"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Lab', href: '/lab' },
            { label: 'Orders', href: '/lab/orders' },
            { label: 'Loading...' },
          ]}
        />
        <PageContent density="comfortable">
          <OrderDetailSkeleton />
        </PageContent>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <PageHeader
          title="Order Details"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Lab', href: '/lab' },
            { label: 'Orders', href: '/lab/orders' },
            { label: 'Error' },
          ]}
        />
        <PageContent density="comfortable">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Order not found'}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </PageContent>
      </>
    );
  }

  const StatusIcon = statusConfig[order.status]?.icon || Package;
  const canSubmit = order.status === 'DRAFT' && order.vendor && order.items.length > 0;
  const canCancel = ['DRAFT', 'SUBMITTED', 'ACKNOWLEDGED'].includes(order.status);
  const canUpdateStatus = !['CANCELLED', 'PICKED_UP'].includes(order.status);

  return (
    <>
      <PageHeader
        title={order.orderNumber}
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Lab', href: '/lab' },
          { label: 'Orders', href: '/lab/orders' },
          { label: order.orderNumber },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {canSubmit && (
              <Button onClick={() => setShowSubmitDialog(true)}>
                <Send className="h-4 w-4" />
                Submit Order
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {order.status === 'DRAFT' && (
                  <DropdownMenuItem asChild>
                    <Link href={`/lab/orders/${order.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Order
                    </Link>
                  </DropdownMenuItem>
                )}
                {canUpdateStatus && (
                  <DropdownMenuItem onClick={() => setShowStatusDialog(true)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Update Status
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Create Inspection
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {canCancel && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Cancel Order
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Status Banner */}
          <Card variant="ghost" className="border-l-4" style={{ borderLeftColor: `var(--${statusConfig[order.status]?.color || 'secondary'})` }}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-${statusConfig[order.status]?.color || 'secondary'}-100`}>
                    <StatusIcon className={`h-6 w-6 text-${statusConfig[order.status]?.color || 'secondary'}-600`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusConfig[order.status]?.color || 'secondary'} size="lg">
                        {statusConfig[order.status]?.label || order.status}
                      </Badge>
                      {order.isRush && (
                        <Badge variant="destructive" size="lg">
                          <Zap className="h-3 w-3 mr-1" />
                          Rush
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Order placed {formatDate(order.orderDate)}
                      {order.submittedAt && ` • Submitted ${formatDate(order.submittedAt)}`}
                    </p>
                  </div>
                </div>
                {order.neededByDate && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Needed By</p>
                    <p className="font-semibold">{formatDate(order.neededByDate)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard accentColor="primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold">{order.items.length}</p>
                </div>
                <Package className="h-5 w-5 text-primary-600" />
              </div>
            </StatCard>

            <StatCard accentColor="accent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Subtotal</p>
                  <p className="text-2xl font-bold">${order.subtotal.toFixed(2)}</p>
                </div>
                <FileText className="h-5 w-5 text-accent-600" />
              </div>
            </StatCard>

            {order.isRush && (
              <StatCard accentColor="warning">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Rush Upcharge</p>
                    <p className="text-2xl font-bold">${order.rushUpcharge.toFixed(2)}</p>
                  </div>
                  <Zap className="h-5 w-5 text-warning-600" />
                </div>
              </StatCard>
            )}

            <StatCard accentColor="success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Cost</p>
                  <p className="text-2xl font-bold">${order.totalCost.toFixed(2)}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-success-600" />
              </div>
            </StatCard>
          </div>

          <DashboardGrid>
            {/* Main Content */}
            <DashboardGrid.TwoThirds>
              <Tabs defaultValue="items" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="items">Items ({order.items.length})</TabsTrigger>
                  <TabsTrigger value="tracking">Tracking</TabsTrigger>
                  <TabsTrigger value="attachments">Files ({order.attachments.length})</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                {/* Items Tab */}
                <TabsContent value="items">
                  <Card variant="bento">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Order Items</CardTitle>
                        {order.status === 'DRAFT' && (
                          <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Item
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {order.items.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No items in this order</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead>Arch</TableHead>
                              <TableHead className="text-center">Qty</TableHead>
                              <TableHead className="text-right">Unit Price</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {order.items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{item.productName}</p>
                                    {item.notes && (
                                      <p className="text-xs text-muted-foreground">{item.notes}</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {item.arch ? (
                                    <Badge variant="outline" size="sm">
                                      {item.arch}
                                    </Badge>
                                  ) : '—'}
                                </TableCell>
                                <TableCell className="text-center">{item.quantity}</TableCell>
                                <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-medium">${item.totalPrice.toFixed(2)}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={itemStatusConfig[item.status]?.color || 'secondary'}
                                    size="sm"
                                    dot
                                  >
                                    {itemStatusConfig[item.status]?.label || item.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tracking Tab */}
                <TabsContent value="tracking">
                  <Card variant="bento">
                    <CardHeader>
                      <CardTitle>Shipment Tracking</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {order.shipments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No shipments yet</p>
                          <p className="text-sm">Shipment info will appear here once the order is shipped</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {order.shipments.map((shipment) => (
                            <div key={shipment.id} className="p-4 bg-muted/50 rounded-xl">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-info-100 rounded-lg">
                                    <Truck className="h-5 w-5 text-info-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{shipment.carrier}</p>
                                    {shipment.trackingNumber && (
                                      <p className="text-sm font-mono text-muted-foreground">
                                        {shipment.trackingNumber}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Badge variant={shipment.status === 'DELIVERED' ? 'success' : 'info'}>
                                  {shipment.status}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Shipped</p>
                                  <p>{formatDate(shipment.shippedAt)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Est. Delivery</p>
                                  <p>{formatDate(shipment.estimatedDelivery)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Delivered</p>
                                  <p>{formatDate(shipment.actualDelivery)}</p>
                                </div>
                              </div>
                              {shipment.trackingUrl && (
                                <Button variant="outline" size="sm" className="mt-3" asChild>
                                  <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer">
                                    Track Package
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Attachments Tab */}
                <TabsContent value="attachments">
                  <Card variant="bento">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Files & Attachments</CardTitle>
                        <Button variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-1" />
                          Upload File
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {order.attachments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No files attached</p>
                          <p className="text-sm">Upload STL scans, photos, or documents</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {order.attachments.map((file) => (
                            <ListItem
                              key={file.id}
                              variant="bordered"
                              leading={
                                <div className="p-2 bg-muted rounded-lg">
                                  <FileText className="h-5 w-5 text-muted-foreground" />
                                </div>
                              }
                              trailing={
                                <Button variant="ghost" size="icon-sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              }
                            >
                              <ListItemTitle>{file.fileName}</ListItemTitle>
                              <ListItemDescription>
                                {file.fileType} • {formatFileSize(file.fileSize)} • {formatDate(file.createdAt)}
                              </ListItemDescription>
                            </ListItem>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history">
                  <Card variant="bento">
                    <CardHeader>
                      <CardTitle>Status History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {order.statusLogs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No history recorded</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {order.statusLogs.map((log, index) => (
                            <ListActivity
                              key={log.id}
                              indicatorColor={index === 0 ? 'primary' : 'info'}
                            >
                              <div className="flex items-center gap-2">
                                {log.fromStatus && (
                                  <>
                                    <Badge variant="outline" size="sm">
                                      {statusConfig[log.fromStatus]?.label || log.fromStatus}
                                    </Badge>
                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                  </>
                                )}
                                <Badge
                                  variant={statusConfig[log.toStatus]?.color || 'secondary'}
                                  size="sm"
                                >
                                  {statusConfig[log.toStatus]?.label || log.toStatus}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDateTime(log.createdAt)}
                                {log.notes && ` — ${log.notes}`}
                              </p>
                            </ListActivity>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </DashboardGrid.TwoThirds>

            {/* Sidebar */}
            <DashboardGrid.OneThird>
              {/* Patient Info */}
              <Card variant="bento">
                <CardHeader compact>
                  <CardTitle size="sm">Patient</CardTitle>
                </CardHeader>
                <CardContent compact>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-primary text-white">
                        {getInitials(order.patient.firstName, order.patient.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <PhiProtected fakeData={getFakeName()}>
                        <p className="font-semibold">
                          {order.patient.firstName} {order.patient.lastName}
                        </p>
                      </PhiProtected>
                      <Button variant="link" size="sm" className="h-auto p-0" asChild>
                        <Link href={`/patients/${order.patient.id}`}>View Profile</Link>
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    {order.patient.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <PhiProtected fakeData={getFakePhone()}>
                          {order.patient.phone}
                        </PhiProtected>
                      </div>
                    )}
                    {order.patient.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <PhiProtected fakeData={getFakeEmail()}>
                          {order.patient.email}
                        </PhiProtected>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Vendor Info */}
              {order.vendor ? (
                <Card variant="bento">
                  <CardHeader compact>
                    <CardTitle size="sm">Lab Vendor</CardTitle>
                  </CardHeader>
                  <CardContent compact>
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-accent text-white text-xs">
                          {order.vendor.code}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{order.vendor.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{order.vendor.code}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      {order.vendor.primaryPhone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {order.vendor.primaryPhone}
                        </div>
                      )}
                      {order.vendor.primaryEmail && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {order.vendor.primaryEmail}
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                      <Link href={`/lab/vendors/${order.vendor.id}`}>
                        View Vendor
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card variant="bento">
                  <CardHeader compact>
                    <CardTitle size="sm">Lab Vendor</CardTitle>
                  </CardHeader>
                  <CardContent compact>
                    <div className="text-center py-4 text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No vendor assigned</p>
                      <p className="text-xs">Select a vendor to submit this order</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              <Card variant="bento">
                <CardHeader compact>
                  <CardTitle size="sm">Notes</CardTitle>
                </CardHeader>
                <CardContent compact className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Clinic Notes</p>
                    <p className="text-sm">{order.clinicNotes || 'No clinic notes'}</p>
                  </div>
                  {order.labNotes && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Lab Notes</p>
                      <p className="text-sm">{order.labNotes}</p>
                    </div>
                  )}
                  {order.isRush && order.rushReason && (
                    <div>
                      <p className="text-xs font-medium text-warning-600 mb-1">Rush Reason</p>
                      <p className="text-sm">{order.rushReason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Key Dates */}
              <Card variant="bento">
                <CardHeader compact>
                  <CardTitle size="sm">Key Dates</CardTitle>
                </CardHeader>
                <CardContent compact>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Order Date</span>
                      <span>{formatDate(order.orderDate)}</span>
                    </div>
                    {order.submittedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Submitted</span>
                        <span>{formatDate(order.submittedAt)}</span>
                      </div>
                    )}
                    {order.neededByDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Needed By</span>
                        <span className="font-medium">{formatDate(order.neededByDate)}</span>
                      </div>
                    )}
                    {order.estimatedDelivery && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Est. Delivery</span>
                        <span>{formatDate(order.estimatedDelivery)}</span>
                      </div>
                    )}
                    {order.actualDelivery && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Delivered</span>
                        <span className="text-success-600">{formatDate(order.actualDelivery)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </DashboardGrid.OneThird>
          </DashboardGrid>
        </div>
      </PageContent>

      {/* Submit Order Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit this order to {order.vendor?.name}? Once submitted,
              you won't be able to edit the order items.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitOrder} disabled={actionLoading}>
              {actionLoading ? 'Submitting...' : 'Submit Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <FormField label="Cancellation Reason">
            <Textarea
              placeholder="Enter reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </FormField>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Order
            </Button>
            <Button variant="destructive" onClick={handleCancelOrder} disabled={actionLoading}>
              {actionLoading ? 'Cancelling...' : 'Cancel Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
            <DialogDescription>
              Change the status of this order.
            </DialogDescription>
          </DialogHeader>
          <FormField label="New Status">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key} disabled={key === order.status}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={actionLoading || !newStatus}>
              {actionLoading ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
