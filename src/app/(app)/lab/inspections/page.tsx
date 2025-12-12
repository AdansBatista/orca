'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ClipboardCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Calendar,
  Package,
  ChevronRight,
  RefreshCw,
  Clock,
  Eye,
  Camera,
  MessageSquare,
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

interface Inspection {
  id: string;
  result: string;
  checklist: Record<string, boolean> | null;
  notes: string | null;
  inspectedAt: string | null;
  createdAt: string;
  order: {
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
  orderItem: {
    id: string;
    productName: string;
    arch: string | null;
  };
}

interface InspectionStats {
  pending: number;
  passed: number;
  failed: number;
  total: number;
}

const inspectionResultConfig: Record<string, { color: 'success' | 'warning' | 'destructive' | 'secondary'; label: string; icon: typeof CheckCircle }> = {
  PASS: { color: 'success', label: 'Pass', icon: CheckCircle },
  PASS_WITH_NOTES: { color: 'warning', label: 'Pass with Notes', icon: CheckCircle },
  FAIL_REMAKE: { color: 'destructive', label: 'Fail - Remake', icon: XCircle },
  FAIL_ADJUSTMENT: { color: 'warning', label: 'Fail - Adjustment', icon: AlertCircle },
  PENDING: { color: 'secondary', label: 'Pending', icon: Clock },
};

// Standard inspection checklist items
const standardChecklist = [
  { key: 'fit', label: 'Fit is acceptable' },
  { key: 'function', label: 'Functions as designed' },
  { key: 'appearance', label: 'Appearance is acceptable' },
  { key: 'material', label: 'Material quality is good' },
  { key: 'labeling', label: 'Labeling is correct' },
  { key: 'packaging', label: 'Packaging is intact' },
];

function InspectionsSkeleton() {
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

export default function InspectionsPage() {
  const router = useRouter();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<InspectionStats>({
    pending: 0,
    passed: 0,
    failed: 0,
    total: 0,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // New Inspection Dialog
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newInspection, setNewInspection] = useState({
    orderId: '',
    orderItemId: '',
    result: 'PENDING',
    checklist: {} as Record<string, boolean>,
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch inspections
  useEffect(() => {
    const fetchInspections = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/lab/inspections');
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch inspections');
        }

        const data = result.data;
        setInspections(data);

        // Calculate stats
        const pending = data.filter((i: Inspection) => i.result === 'PENDING').length;
        const passed = data.filter((i: Inspection) => ['PASS', 'PASS_WITH_NOTES'].includes(i.result)).length;
        const failed = data.filter((i: Inspection) => ['FAIL_REMAKE', 'FAIL_ADJUSTMENT'].includes(i.result)).length;

        setStats({
          pending,
          passed,
          failed,
          total: data.length,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchInspections();
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

  const handleCreateInspection = async () => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/lab/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: newInspection.orderId,
          orderItemId: newInspection.orderItemId,
          result: newInspection.result,
          checklist: newInspection.checklist,
          notes: newInspection.notes || null,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create inspection');
      }

      // Refresh list
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create inspection');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter inspections
  const filteredInspections = inspections.filter((inspection) => {
    // Tab filter
    if (activeTab === 'pending' && inspection.result !== 'PENDING') {
      return false;
    }
    if (activeTab === 'passed' && !['PASS', 'PASS_WITH_NOTES'].includes(inspection.result)) {
      return false;
    }
    if (activeTab === 'failed' && !['FAIL_REMAKE', 'FAIL_ADJUSTMENT'].includes(inspection.result)) {
      return false;
    }

    // Result filter
    if (resultFilter && inspection.result !== resultFilter) {
      return false;
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesOrder = inspection.order.orderNumber.toLowerCase().includes(searchLower);
      const matchesProduct = inspection.orderItem.productName.toLowerCase().includes(searchLower);
      const matchesPatient = `${inspection.order.patient.firstName} ${inspection.order.patient.lastName}`.toLowerCase().includes(searchLower);
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
          title="Quality Inspections"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Lab', href: '/lab' },
            { label: 'Inspections' },
          ]}
        />
        <PageContent density="comfortable">
          <InspectionsSkeleton />
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Quality Inspections"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Lab', href: '/lab' },
          { label: 'Inspections' },
        ]}
        actions={
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4" />
            New Inspection
          </Button>
        }
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
            <StatCard accentColor="secondary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
            </StatCard>

            <StatCard accentColor="success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Passed</p>
                  <p className="text-2xl font-bold">{stats.passed}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-success-600" />
              </div>
            </StatCard>

            <StatCard accentColor="error">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold">{stats.failed}</p>
                </div>
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
            </StatCard>

            <StatCard accentColor="primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Inspections</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <ClipboardCheck className="h-5 w-5 text-primary-600" />
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

                <Select value={resultFilter} onValueChange={setResultFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Results</SelectItem>
                    {Object.entries(inspectionResultConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(search || resultFilter) && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearch('');
                      setResultFilter('');
                    }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Inspections Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">
                Pending
                {stats.pending > 0 && (
                  <Badge variant="warning" size="sm" className="ml-2">
                    {stats.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="passed">Passed ({stats.passed})</TabsTrigger>
              <TabsTrigger value="failed">
                Failed
                {stats.failed > 0 && (
                  <Badge variant="destructive" size="sm" className="ml-2">
                    {stats.failed}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <Card variant="bento">
                <CardContent className="p-0">
                  {filteredInspections.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No inspections found</p>
                      <p className="text-sm">
                        {search || resultFilter
                          ? 'Try adjusting your filters'
                          : 'Create an inspection when lab items arrive'}
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Lab</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Inspected</TableHead>
                          <TableHead className="w-[40px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInspections.map((inspection) => {
                          const ResultIcon = inspectionResultConfig[inspection.result]?.icon || Clock;

                          return (
                            <TableRow
                              key={inspection.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => router.push(`/lab/orders/${inspection.order.id}`)}
                            >
                              <TableCell>
                                <p className="font-mono text-sm font-medium text-primary-600">
                                  {inspection.order.orderNumber}
                                </p>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">{inspection.orderItem.productName}</p>
                                  {inspection.orderItem.arch && (
                                    <Badge variant="outline" size="sm">
                                      {inspection.orderItem.arch}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs bg-gradient-primary text-white">
                                      {getInitials(inspection.order.patient.firstName, inspection.order.patient.lastName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <PhiProtected fakeData={getFakeName()}>
                                    <span className="text-sm">
                                      {inspection.order.patient.firstName} {inspection.order.patient.lastName}
                                    </span>
                                  </PhiProtected>
                                </div>
                              </TableCell>
                              <TableCell>
                                {inspection.order.vendor ? (
                                  <Badge variant="outline" size="sm">
                                    {inspection.order.vendor.code}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={inspectionResultConfig[inspection.result]?.color || 'secondary'}
                                  size="sm"
                                >
                                  <ResultIcon className="h-3 w-3 mr-1" />
                                  {inspectionResultConfig[inspection.result]?.label || inspection.result}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(inspection.inspectedAt || inspection.createdAt)}
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

      {/* New Inspection Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Inspection</DialogTitle>
            <DialogDescription>
              Record a quality inspection for a received lab item
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Order ID" required>
                <Input
                  placeholder="Order ID"
                  value={newInspection.orderId}
                  onChange={(e) => setNewInspection({ ...newInspection, orderId: e.target.value })}
                />
              </FormField>

              <FormField label="Item ID" required>
                <Input
                  placeholder="Order Item ID"
                  value={newInspection.orderItemId}
                  onChange={(e) => setNewInspection({ ...newInspection, orderItemId: e.target.value })}
                />
              </FormField>
            </div>

            <FormField label="Inspection Result">
              <Select
                value={newInspection.result}
                onValueChange={(v) => setNewInspection({ ...newInspection, result: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(inspectionResultConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <div>
              <p className="text-sm font-medium mb-3">Checklist</p>
              <div className="space-y-2 p-4 bg-muted/50 rounded-xl">
                {standardChecklist.map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={newInspection.checklist[item.key] || false}
                      onChange={(e) =>
                        setNewInspection({
                          ...newInspection,
                          checklist: {
                            ...newInspection.checklist,
                            [item.key]: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-border"
                    />
                    <span className="text-sm">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <FormField label="Notes">
              <Textarea
                placeholder="Add inspection notes..."
                value={newInspection.notes}
                onChange={(e) => setNewInspection({ ...newInspection, notes: e.target.value })}
                rows={3}
              />
            </FormField>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateInspection}
              disabled={submitting || !newInspection.orderId || !newInspection.orderItemId}
            >
              {submitting ? 'Saving...' : 'Save Inspection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
