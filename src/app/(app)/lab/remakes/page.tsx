'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Calendar,
  Package,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  Truck,
  Shield,
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
import { FormField } from '@/components/ui/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader, PageContent, StatsRow } from '@/components/layout';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface RemakeRequest {
  id: string;
  reason: string;
  reasonDetails: string | null;
  status: string;
  isWarrantyClaim: boolean;
  costResponsibility: string;
  estimatedCost: number | null;
  actualCost: number | null;
  requiresApproval: boolean;
  approvedAt: string | null;
  approvedBy: string | null;
  createdAt: string;
  originalOrder: {
    id: string;
    orderNumber: string;
    patient: {
      firstName: string;
      lastName: string;
    };
    vendor: {
      name: string;
      code: string;
    } | null;
  };
  originalItem: {
    id: string;
    productName: string;
    arch: string | null;
  };
  newOrder?: {
    id: string;
    orderNumber: string;
  } | null;
}

interface RemakeStats {
  requested: number;
  inProgress: number;
  completed: number;
  pendingApproval: number;
}

const remakeStatusConfig: Record<string, { color: 'success' | 'warning' | 'info' | 'destructive' | 'secondary'; label: string }> = {
  REQUESTED: { color: 'warning', label: 'Requested' },
  ACKNOWLEDGED: { color: 'info', label: 'Acknowledged' },
  IN_PROGRESS: { color: 'info', label: 'In Progress' },
  SHIPPED: { color: 'info', label: 'Shipped' },
  RECEIVED: { color: 'success', label: 'Received' },
  INSPECTED: { color: 'success', label: 'Inspected' },
  COMPLETED: { color: 'success', label: 'Completed' },
  CANCELLED: { color: 'destructive', label: 'Cancelled' },
};

const remakeReasonLabels: Record<string, string> = {
  FIT_ISSUE: 'Fit Issue',
  DESIGN_ISSUE: 'Design Issue',
  MATERIAL_DEFECT: 'Material Defect',
  SHIPPING_DAMAGE: 'Shipping Damage',
  WRONG_PATIENT: 'Wrong Patient',
  SPECIFICATION_ERROR: 'Specification Error',
  OTHER: 'Other',
};

const costResponsibilityLabels: Record<string, { label: string; color: 'success' | 'warning' | 'info' | 'secondary' }> = {
  LAB: { label: 'Lab', color: 'success' },
  CLINIC: { label: 'Clinic', color: 'warning' },
  PATIENT: { label: 'Patient', color: 'info' },
  WARRANTY: { label: 'Warranty', color: 'secondary' },
};

function RemakesSkeleton() {
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

export default function RemakesPage() {
  const router = useRouter();
  const [remakes, setRemakes] = useState<RemakeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<RemakeStats>({
    requested: 0,
    inProgress: 0,
    completed: 0,
    pendingApproval: 0,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Approval Dialog
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedRemake, setSelectedRemake] = useState<RemakeRequest | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approving, setApproving] = useState(false);

  // Fetch remakes
  useEffect(() => {
    const fetchRemakes = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/lab/remakes');
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch remake requests');
        }

        const data = result.data;
        setRemakes(data);

        // Calculate stats
        const requested = data.filter((r: RemakeRequest) => r.status === 'REQUESTED').length;
        const inProgress = data.filter((r: RemakeRequest) => ['ACKNOWLEDGED', 'IN_PROGRESS', 'SHIPPED'].includes(r.status)).length;
        const completed = data.filter((r: RemakeRequest) => ['RECEIVED', 'INSPECTED', 'COMPLETED'].includes(r.status)).length;
        const pendingApproval = data.filter((r: RemakeRequest) => r.requiresApproval && !r.approvedAt).length;

        setStats({
          requested,
          inProgress,
          completed,
          pendingApproval,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRemakes();
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

  const handleApprove = async (approved: boolean) => {
    if (!selectedRemake) return;

    setApproving(true);
    try {
      const response = await fetch(`/api/lab/remakes/${selectedRemake.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved,
          notes: approvalNotes || null,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to process approval');
      }

      // Refresh list
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process approval');
    } finally {
      setApproving(false);
      setShowApprovalDialog(false);
      setSelectedRemake(null);
      setApprovalNotes('');
    }
  };

  const openApprovalDialog = (remake: RemakeRequest) => {
    setSelectedRemake(remake);
    setShowApprovalDialog(true);
  };

  // Filter remakes
  const filteredRemakes = remakes.filter((remake) => {
    // Tab filter
    if (activeTab === 'pending' && remake.status !== 'REQUESTED') {
      return false;
    }
    if (activeTab === 'in-progress' && !['ACKNOWLEDGED', 'IN_PROGRESS', 'SHIPPED'].includes(remake.status)) {
      return false;
    }
    if (activeTab === 'completed' && !['RECEIVED', 'INSPECTED', 'COMPLETED'].includes(remake.status)) {
      return false;
    }
    if (activeTab === 'approval' && (!remake.requiresApproval || remake.approvedAt)) {
      return false;
    }

    // Status filter
    if (statusFilter && remake.status !== statusFilter) {
      return false;
    }

    // Reason filter
    if (reasonFilter && remake.reason !== reasonFilter) {
      return false;
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesOrder = remake.originalOrder.orderNumber.toLowerCase().includes(searchLower);
      const matchesProduct = remake.originalItem.productName.toLowerCase().includes(searchLower);
      const matchesPatient = `${remake.originalOrder.patient.firstName} ${remake.originalOrder.patient.lastName}`.toLowerCase().includes(searchLower);
      if (!matchesOrder && !matchesProduct && !matchesPatient) {
        return false;
      }
    }

    return true;
  });

  if (loading) {
    return (
      <>
        <PageHeader
          title="Remake Requests"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Lab', href: '/lab' },
            { label: 'Remakes' },
          ]}
        />
        <PageContent density="comfortable">
          <RemakesSkeleton />
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Remake Requests"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Lab', href: '/lab' },
          { label: 'Remakes' },
        ]}
      />

      <PageContent density="comfortable">
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stats Row */}
          <StatsRow>
            <StatCard accentColor="warning">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Requested</p>
                  <p className="text-2xl font-bold">{stats.requested}</p>
                </div>
                <Clock className="h-5 w-5 text-warning-600" />
              </div>
            </StatCard>

            <StatCard accentColor="primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                </div>
                <RefreshCw className="h-5 w-5 text-primary-600" />
              </div>
            </StatCard>

            <StatCard accentColor="success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-success-600" />
              </div>
            </StatCard>

            <StatCard accentColor="error">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending Approval</p>
                  <p className="text-2xl font-bold">{stats.pendingApproval}</p>
                </div>
                <AlertCircle className="h-5 w-5 text-error-600" />
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
                    placeholder="Search orders, products, patients..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={reasonFilter} onValueChange={setReasonFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reasons</SelectItem>
                    {Object.entries(remakeReasonLabels).map(([key, label]) => (
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
                    {Object.entries(remakeStatusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(search || reasonFilter || statusFilter) && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearch('');
                      setReasonFilter('');
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

          {/* Remakes Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({remakes.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.requested})</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress ({stats.inProgress})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
              <TabsTrigger value="approval">
                Needs Approval
                {stats.pendingApproval > 0 && (
                  <Badge variant="destructive" size="sm" className="ml-2">
                    {stats.pendingApproval}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <Card variant="bento">
                <CardContent className="p-0">
                  {filteredRemakes.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No remake requests found</p>
                      <p className="text-sm">
                        {search || reasonFilter || statusFilter
                          ? 'Try adjusting your filters'
                          : 'Remake requests will appear here when items fail inspection'}
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Original Order</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Cost</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Requested</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRemakes.map((remake) => (
                          <TableRow
                            key={remake.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => router.push(`/lab/orders/${remake.originalOrder.id}`)}
                          >
                            <TableCell>
                              <div>
                                <p className="font-mono text-sm font-medium text-primary-600">
                                  {remake.originalOrder.orderNumber}
                                </p>
                                {remake.originalOrder.vendor && (
                                  <Badge variant="outline" size="sm">
                                    {remake.originalOrder.vendor.code}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{remake.originalItem.productName}</p>
                                {remake.originalItem.arch && (
                                  <Badge variant="outline" size="sm">
                                    {remake.originalItem.arch}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs bg-gradient-primary text-white">
                                    {getInitials(remake.originalOrder.patient.firstName, remake.originalOrder.patient.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                                <PhiProtected fakeData={getFakeName()}>
                                  <span className="text-sm">
                                    {remake.originalOrder.patient.firstName} {remake.originalOrder.patient.lastName}
                                  </span>
                                </PhiProtected>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{remakeReasonLabels[remake.reason] || remake.reason}</span>
                                {remake.isWarrantyClaim && (
                                  <Badge variant="soft-primary" size="sm">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Warranty
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <Badge
                                  variant={costResponsibilityLabels[remake.costResponsibility]?.color || 'secondary'}
                                  size="sm"
                                >
                                  {costResponsibilityLabels[remake.costResponsibility]?.label || remake.costResponsibility}
                                </Badge>
                                {remake.estimatedCost && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Est: ${remake.estimatedCost.toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={remakeStatusConfig[remake.status]?.color || 'secondary'}
                                size="sm"
                                dot
                              >
                                {remakeStatusConfig[remake.status]?.label || remake.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(remake.createdAt)}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              {remake.requiresApproval && !remake.approvedAt && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openApprovalDialog(remake)}
                                >
                                  Review
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PageContent>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Remake Request</DialogTitle>
            <DialogDescription>
              Approve or deny this remake request
            </DialogDescription>
          </DialogHeader>

          {selectedRemake && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-xl space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order</span>
                  <span className="font-mono">{selectedRemake.originalOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Product</span>
                  <span>{selectedRemake.originalItem.productName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reason</span>
                  <span>{remakeReasonLabels[selectedRemake.reason] || selectedRemake.reason}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Est. Cost</span>
                  <span>${selectedRemake.estimatedCost?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cost Responsibility</span>
                  <Badge variant={costResponsibilityLabels[selectedRemake.costResponsibility]?.color || 'secondary'} size="sm">
                    {costResponsibilityLabels[selectedRemake.costResponsibility]?.label || selectedRemake.costResponsibility}
                  </Badge>
                </div>
              </div>

              {selectedRemake.reasonDetails && (
                <div>
                  <p className="text-sm font-medium mb-1">Details</p>
                  <p className="text-sm text-muted-foreground">{selectedRemake.reasonDetails}</p>
                </div>
              )}

              <FormField label="Notes (Optional)">
                <Textarea
                  placeholder="Add approval notes..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows={3}
                />
              </FormField>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleApprove(false)}
              disabled={approving}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Deny
            </Button>
            <Button
              onClick={() => handleApprove(true)}
              disabled={approving}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {approving ? 'Processing...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
