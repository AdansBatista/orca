'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Truck,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  ExternalLink,
  Calendar,
  MapPin,
  ChevronRight,
  RefreshCw,
  PackageCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
} from '@/components/ui/list-item';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader, PageContent, DashboardGrid, StatsRow } from '@/components/layout';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface Shipment {
  id: string;
  carrier: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  status: string;
  shippedAt: string | null;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    neededByDate: string | null;
    patient: {
      firstName: string;
      lastName: string;
    };
    vendor: {
      name: string;
      code: string;
    } | null;
    items: Array<{
      productName: string;
    }>;
  };
}

interface TrackingStats {
  inTransit: number;
  arrivingToday: number;
  delayed: number;
  awaitingPickup: number;
}

const shipmentStatusConfig: Record<string, { color: 'success' | 'warning' | 'info' | 'destructive' | 'secondary'; label: string; icon: typeof Package }> = {
  PENDING: { color: 'secondary', label: 'Pending', icon: Clock },
  LABEL_CREATED: { color: 'info', label: 'Label Created', icon: Package },
  PICKED_UP: { color: 'info', label: 'Picked Up', icon: Truck },
  IN_TRANSIT: { color: 'warning', label: 'In Transit', icon: Truck },
  OUT_FOR_DELIVERY: { color: 'info', label: 'Out for Delivery', icon: Truck },
  DELIVERED: { color: 'success', label: 'Delivered', icon: CheckCircle },
  EXCEPTION: { color: 'destructive', label: 'Exception', icon: AlertCircle },
  RETURNED: { color: 'destructive', label: 'Returned', icon: RefreshCw },
};

const carrierLabels: Record<string, string> = {
  FEDEX: 'FedEx',
  UPS: 'UPS',
  USPS: 'USPS',
  DHL: 'DHL',
  LAB_COURIER: 'Lab Courier',
  OTHER: 'Other',
};

function TrackingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TrackingPage() {
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TrackingStats>({
    inTransit: 0,
    arrivingToday: 0,
    delayed: 0,
    awaitingPickup: 0,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Fetch shipments
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch orders with shipments
        const params = new URLSearchParams();
        params.set('pageSize', '100');

        // Only fetch orders that have shipments (shipped status and beyond)
        const statuses = ['SHIPPED', 'DELIVERED', 'RECEIVED', 'PATIENT_PICKUP'];
        params.set('statuses', statuses.join(','));

        const response = await fetch(`/api/lab/orders?${params.toString()}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch tracking data');
        }

        // Extract shipments from orders
        const allShipments: Shipment[] = [];
        const today = new Date().toDateString();
        let inTransit = 0;
        let arrivingToday = 0;
        let delayed = 0;
        let awaitingPickup = 0;

        // Fetch shipments for each order
        for (const order of result.data.items) {
          const shipmentResponse = await fetch(`/api/lab/orders/${order.id}/shipments`);
          const shipmentResult = await shipmentResponse.json();

          if (shipmentResult.success && shipmentResult.data.length > 0) {
            for (const shipment of shipmentResult.data) {
              allShipments.push({
                ...shipment,
                order,
              });

              // Calculate stats
              if (['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(shipment.status)) {
                inTransit++;
                if (shipment.estimatedDelivery && new Date(shipment.estimatedDelivery).toDateString() === today) {
                  arrivingToday++;
                }
                if (shipment.estimatedDelivery && new Date(shipment.estimatedDelivery) < new Date() && shipment.status !== 'DELIVERED') {
                  delayed++;
                }
              }
            }
          }

          if (order.status === 'PATIENT_PICKUP') {
            awaitingPickup++;
          }
        }

        setShipments(allShipments);
        setStats({ inTransit, arrivingToday, delayed, awaitingPickup });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const isDelayed = (shipment: Shipment) => {
    if (!shipment.estimatedDelivery || shipment.status === 'DELIVERED') return false;
    return new Date(shipment.estimatedDelivery) < new Date();
  };

  const isArrivingToday = (shipment: Shipment) => {
    if (!shipment.estimatedDelivery || shipment.status === 'DELIVERED') return false;
    return new Date(shipment.estimatedDelivery).toDateString() === new Date().toDateString();
  };

  // Filter shipments
  const filteredShipments = shipments.filter((shipment) => {
    // Tab filter
    if (activeTab === 'in-transit' && !['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(shipment.status)) {
      return false;
    }
    if (activeTab === 'delivered' && shipment.status !== 'DELIVERED') {
      return false;
    }
    if (activeTab === 'delayed' && !isDelayed(shipment)) {
      return false;
    }

    // Status filter
    if (statusFilter && shipment.status !== statusFilter) {
      return false;
    }

    // Carrier filter
    if (carrierFilter && shipment.carrier !== carrierFilter) {
      return false;
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesOrder = shipment.order.orderNumber.toLowerCase().includes(searchLower);
      const matchesTracking = shipment.trackingNumber?.toLowerCase().includes(searchLower);
      const matchesPatient = `${shipment.order.patient.firstName} ${shipment.order.patient.lastName}`.toLowerCase().includes(searchLower);
      if (!matchesOrder && !matchesTracking && !matchesPatient) {
        return false;
      }
    }

    return true;
  });

  if (loading) {
    return (
      <>
        <PageHeader
          title="Shipment Tracking"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Lab', href: '/lab' },
            { label: 'Tracking' },
          ]}
        />
        <PageContent density="comfortable">
          <TrackingSkeleton />
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Shipment Tracking"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Lab', href: '/lab' },
          { label: 'Tracking' },
        ]}
        actions={
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Stats Row */}
          <StatsRow>
            <StatCard accentColor="warning">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">In Transit</p>
                  <p className="text-2xl font-bold">{stats.inTransit}</p>
                </div>
                <Truck className="h-5 w-5 text-warning-600" />
              </div>
            </StatCard>

            <StatCard accentColor="accent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Arriving Today</p>
                  <p className="text-2xl font-bold">{stats.arrivingToday}</p>
                </div>
                <Calendar className="h-5 w-5 text-accent-600" />
              </div>
            </StatCard>

            <StatCard accentColor="error">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Delayed</p>
                  <p className="text-2xl font-bold">{stats.delayed}</p>
                </div>
                <AlertCircle className="h-5 w-5 text-error-600" />
              </div>
            </StatCard>

            <StatCard accentColor="success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Awaiting Pickup</p>
                  <p className="text-2xl font-bold">{stats.awaitingPickup}</p>
                </div>
                <PackageCheck className="h-5 w-5 text-success-600" />
              </div>
            </StatCard>
          </StatsRow>

          {/* Filters */}
          <Card variant="ghost">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders, tracking numbers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={carrierFilter} onValueChange={setCarrierFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Carriers</SelectItem>
                    {Object.entries(carrierLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.entries(shipmentStatusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(search || carrierFilter || statusFilter) && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearch('');
                      setCarrierFilter('');
                      setStatusFilter('');
                    }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shipments Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({shipments.length})</TabsTrigger>
              <TabsTrigger value="in-transit">In Transit ({stats.inTransit})</TabsTrigger>
              <TabsTrigger value="delivered">Delivered</TabsTrigger>
              <TabsTrigger value="delayed">
                Delayed
                {stats.delayed > 0 && (
                  <Badge variant="destructive" size="sm" className="ml-2">
                    {stats.delayed}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <Card variant="bento">
                <CardContent className="p-0">
                  {filteredShipments.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No shipments found</p>
                      <p className="text-sm">
                        {search || carrierFilter || statusFilter
                          ? 'Try adjusting your filters'
                          : 'Shipments will appear here once orders are shipped'}
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Carrier</TableHead>
                          <TableHead>Tracking</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Est. Delivery</TableHead>
                          <TableHead className="w-[40px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredShipments.map((shipment) => {
                          const StatusIcon = shipmentStatusConfig[shipment.status]?.icon || Package;
                          const delayed = isDelayed(shipment);
                          const arriving = isArrivingToday(shipment);

                          return (
                            <TableRow
                              key={shipment.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => router.push(`/lab/orders/${shipment.order.id}`)}
                            >
                              <TableCell>
                                <div>
                                  <p className="font-mono text-sm font-medium text-primary-600">
                                    {shipment.order.orderNumber}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {shipment.order.items[0]?.productName}
                                    {shipment.order.items.length > 1 && ` +${shipment.order.items.length - 1} more`}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs bg-gradient-primary text-white">
                                      {getInitials(shipment.order.patient.firstName, shipment.order.patient.lastName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <PhiProtected fakeData={getFakeName()}>
                                    <span className="text-sm">
                                      {shipment.order.patient.firstName} {shipment.order.patient.lastName}
                                    </span>
                                  </PhiProtected>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" size="sm">
                                  {carrierLabels[shipment.carrier] || shipment.carrier}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {shipment.trackingNumber ? (
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs">{shipment.trackingNumber}</span>
                                    {shipment.trackingUrl && (
                                      <a
                                        href={shipment.trackingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-primary-600 hover:text-primary-700"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={shipmentStatusConfig[shipment.status]?.color || 'secondary'}
                                  size="sm"
                                  dot
                                >
                                  {shipmentStatusConfig[shipment.status]?.label || shipment.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className={delayed ? 'text-destructive' : arriving ? 'text-info-600 font-medium' : ''}>
                                    {formatDate(shipment.estimatedDelivery)}
                                  </span>
                                  {delayed && (
                                    <Badge variant="destructive" size="sm">
                                      Delayed
                                    </Badge>
                                  )}
                                  {arriving && !delayed && (
                                    <Badge variant="info" size="sm">
                                      Today
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PageContent>
    </>
  );
}
