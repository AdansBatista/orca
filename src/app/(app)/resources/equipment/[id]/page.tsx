'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  MoreHorizontal,
  Trash2,
  AlertTriangle,
  Package,
  Wrench,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  Shield,
  FileText,
  Plus,
} from 'lucide-react';
import type { Equipment, EquipmentType, Supplier, MaintenanceRecord, RepairRecord, Room } from '@prisma/client';

import { PageHeader, PageContent, DashboardGrid } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MaintenanceForm } from '@/components/equipment/MaintenanceForm';
import { RepairForm } from '@/components/equipment/RepairForm';

type EquipmentWithRelations = Equipment & {
  type: Pick<EquipmentType, 'id' | 'name' | 'code'>;
  vendor?: Pick<Supplier, 'id' | 'name' | 'code'> | null;
  room?: Pick<Room, 'id' | 'name' | 'roomNumber'> | null;
  maintenanceRecords?: MaintenanceRecord[];
  repairRecords?: RepairRecord[];
};

const statusVariants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'ghost'> = {
  ACTIVE: 'success',
  IN_REPAIR: 'warning',
  OUT_OF_SERVICE: 'error',
  RETIRED: 'ghost',
  DISPOSED: 'ghost',
};

const conditionVariants: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  EXCELLENT: 'success',
  GOOD: 'success',
  FAIR: 'warning',
  POOR: 'error',
};

const categoryLabels: Record<string, string> = {
  DIAGNOSTIC: 'Diagnostic',
  TREATMENT: 'Treatment',
  DIGITAL: 'Digital',
  CHAIR: 'Chair',
  STERILIZATION: 'Sterilization',
  SAFETY: 'Safety',
  OTHER: 'Other',
};

const maintenanceTypeLabels: Record<string, string> = {
  PREVENTIVE: 'Preventive',
  CALIBRATION: 'Calibration',
  INSPECTION: 'Inspection',
  CLEANING: 'Cleaning',
  CERTIFICATION: 'Certification',
  OTHER: 'Other',
};

const maintenanceStatusVariants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'ghost'> = {
  SCHEDULED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'ghost',
  OVERDUE: 'error',
};

const repairStatusLabels: Record<string, string> = {
  REPORTED: 'Reported',
  DIAGNOSED: 'Diagnosed',
  AWAITING_PARTS: 'Awaiting Parts',
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANNOT_REPAIR: 'Cannot Repair',
  CANCELLED: 'Cancelled',
};

const repairStatusVariants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'ghost'> = {
  REPORTED: 'info',
  DIAGNOSED: 'info',
  AWAITING_PARTS: 'warning',
  SCHEDULED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANNOT_REPAIR: 'error',
  CANCELLED: 'ghost',
};

const severityVariants: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  LOW: 'info',
  MEDIUM: 'warning',
  HIGH: 'error',
  CRITICAL: 'error',
};

function formatDate(date: Date | string | null): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const equipmentId = params.id as string;

  const [equipment, setEquipment] = useState<EquipmentWithRelations | null>(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [repairRecords, setRepairRecords] = useState<RepairRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [maintenanceFormOpen, setMaintenanceFormOpen] = useState(false);
  const [repairFormOpen, setRepairFormOpen] = useState(false);

  const fetchEquipment = useCallback(async () => {
    try {
      const response = await fetch(`/api/resources/equipment/${equipmentId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch equipment');
      }

      setEquipment(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [equipmentId]);

  const fetchMaintenanceRecords = useCallback(async () => {
    try {
      const response = await fetch(`/api/resources/equipment/${equipmentId}/maintenance?pageSize=10`);
      const result = await response.json();
      if (result.success) {
        setMaintenanceRecords(result.data.items || []);
      }
    } catch {
      // Silent fail
    }
  }, [equipmentId]);

  const fetchRepairRecords = useCallback(async () => {
    try {
      const response = await fetch(`/api/resources/equipment/${equipmentId}/repairs?pageSize=10`);
      const result = await response.json();
      if (result.success) {
        setRepairRecords(result.data.items || []);
      }
    } catch {
      // Silent fail
    }
  }, [equipmentId]);

  useEffect(() => {
    fetchEquipment();
    fetchMaintenanceRecords();
    fetchRepairRecords();
  }, [fetchEquipment, fetchMaintenanceRecords, fetchRepairRecords]);

  const handleRefresh = useCallback(() => {
    fetchMaintenanceRecords();
    fetchRepairRecords();
  }, [fetchMaintenanceRecords, fetchRepairRecords]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/resources/equipment/${equipmentId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete equipment');
      }

      router.push('/resources/equipment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Equipment Details"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Resources', href: '/resources' },
            { label: 'Equipment', href: '/resources/equipment' },
            { label: 'Loading...' },
          ]}
        />
        <PageContent density="comfortable">
          <LoadingSkeleton />
        </PageContent>
      </>
    );
  }

  if (error || !equipment) {
    return (
      <>
        <PageHeader
          title="Equipment Details"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Resources', href: '/resources' },
            { label: 'Equipment', href: '/resources/equipment' },
            { label: 'Error' },
          ]}
        />
        <PageContent density="comfortable">
          <Card variant="ghost" className="border-error-200 bg-error-50">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-error-600 mb-4" />
              <h3 className="font-semibold text-error-900 mb-2">Failed to load equipment</h3>
              <p className="text-error-700 mb-4">{error || 'Equipment not found'}</p>
              <div className="flex justify-center gap-3">
                <Link href="/resources/equipment">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Equipment
                  </Button>
                </Link>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </div>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  const isWarrantyExpiring = equipment.warrantyExpiry &&
    new Date(equipment.warrantyExpiry) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  const isWarrantyExpired = equipment.warrantyExpiry &&
    new Date(equipment.warrantyExpiry) < new Date();
  const isMaintenanceDue = equipment.nextMaintenanceDate &&
    new Date(equipment.nextMaintenanceDate) < new Date();

  return (
    <>
      <PageHeader
        title="Equipment Details"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Equipment', href: '/resources/equipment' },
          { label: equipment.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/resources/equipment/${equipmentId}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Print Details</DropdownMenuItem>
                <DropdownMenuItem>Export Data</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Equipment Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-primary-100 dark:bg-primary-900/30">
                  <Package className="h-8 w-8 text-primary-600" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl font-bold text-foreground">{equipment.name}</h2>
                    <Badge variant={statusVariants[equipment.status] || 'ghost'} dot>
                      {equipment.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant={conditionVariants[equipment.condition] || 'info'}>
                      {equipment.condition}
                    </Badge>
                  </div>

                  <p className="text-muted-foreground mt-1">
                    {equipment.type.name}
                    {equipment.manufacturer && ` • ${equipment.manufacturer}`}
                    {equipment.modelNumber && ` ${equipment.modelNumber}`}
                  </p>

                  <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4" />
                      #{equipment.equipmentNumber}
                    </span>
                    {equipment.serialNumber && (
                      <span className="flex items-center gap-1.5">
                        S/N: {equipment.serialNumber}
                      </span>
                    )}
                    {equipment.room && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {equipment.room.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline">{categoryLabels[equipment.category]}</Badge>
                    {isMaintenanceDue && (
                      <Badge variant="error" dot>Maintenance Due</Badge>
                    )}
                    {isWarrantyExpired && (
                      <Badge variant="error">Warranty Expired</Badge>
                    )}
                    {isWarrantyExpiring && !isWarrantyExpired && (
                      <Badge variant="warning">Warranty Expiring Soon</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <DashboardGrid>
            {/* Purchase & Warranty */}
            <DashboardGrid.Half>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Purchase & Warranty
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Purchase Date</p>
                      <p className="text-sm font-medium">{formatDate(equipment.purchaseDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Purchase Price</p>
                      <p className="text-sm font-medium">{formatCurrency(equipment.purchasePrice as number | null)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Vendor</p>
                      <p className="text-sm font-medium">
                        {equipment.vendor ? (
                          <Link href={`/resources/suppliers/${equipment.vendor.id}`} className="text-primary hover:underline">
                            {equipment.vendor.name}
                          </Link>
                        ) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Warranty Expiry</p>
                      <p className={`text-sm font-medium ${isWarrantyExpired ? 'text-error-600' : isWarrantyExpiring ? 'text-warning-600' : ''}`}>
                        {formatDate(equipment.warrantyExpiry)}
                      </p>
                    </div>
                  </div>
                  {equipment.warrantyNotes && (
                    <div>
                      <p className="text-xs text-muted-foreground">Warranty Notes</p>
                      <p className="text-sm">{equipment.warrantyNotes}</p>
                    </div>
                  )}
                  {equipment.hasExtendedWarranty && (
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-success-600" />
                      <span className="text-sm text-success-600">
                        Extended warranty until {formatDate(equipment.extendedWarrantyExpiry)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </DashboardGrid.Half>

            {/* Maintenance */}
            <DashboardGrid.Half>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Maintenance Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Maintenance Interval</p>
                      <p className="text-sm font-medium">
                        {equipment.maintenanceIntervalDays
                          ? `Every ${equipment.maintenanceIntervalDays} days`
                          : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Next Maintenance</p>
                      <p className={`text-sm font-medium ${isMaintenanceDue ? 'text-error-600' : ''}`}>
                        {formatDate(equipment.nextMaintenanceDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Last Maintenance</p>
                      <p className="text-sm font-medium">{formatDate(equipment.lastMaintenanceDate)}</p>
                    </div>
                  </div>
                  {isMaintenanceDue && (
                    <div className="flex items-center gap-2 text-error-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">Maintenance is overdue!</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </DashboardGrid.Half>

            {/* Depreciation */}
            <DashboardGrid.Half>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Depreciation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Method</p>
                      <p className="text-sm font-medium">
                        {equipment.depreciationMethod?.replace('_', ' ') || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Useful Life</p>
                      <p className="text-sm font-medium">
                        {equipment.usefulLifeMonths
                          ? `${equipment.usefulLifeMonths} months`
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Salvage Value</p>
                      <p className="text-sm font-medium">{formatCurrency(equipment.salvageValue as number | null)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DashboardGrid.Half>

            {/* Location & Notes */}
            <DashboardGrid.Half>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location & Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned Room</p>
                    <p className="text-sm font-medium">
                      {equipment.room ? (
                        <Link href={`/resources/rooms/${equipment.room.id}`} className="text-primary hover:underline">
                          {equipment.room.name} ({equipment.room.roomNumber})
                        </Link>
                      ) : 'Not assigned'}
                    </p>
                  </div>
                  {equipment.locationNotes && (
                    <div>
                      <p className="text-xs text-muted-foreground">Location Notes</p>
                      <p className="text-sm">{equipment.locationNotes}</p>
                    </div>
                  )}
                  {equipment.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground">Notes</p>
                      <p className="text-sm">{equipment.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </DashboardGrid.Half>

            {/* Maintenance History */}
            <DashboardGrid.FullWidth>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Maintenance History
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setMaintenanceFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Record
                  </Button>
                </CardHeader>
                <CardContent>
                  {maintenanceRecords.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No maintenance records found
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {maintenanceRecords.map((record) => (
                        <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {maintenanceTypeLabels[record.maintenanceType] || record.maintenanceType}
                              </span>
                              <Badge variant={maintenanceStatusVariants[record.status] || 'ghost'} className="text-xs">
                                {record.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {record.description || 'No description'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {formatDate(record.scheduledDate || record.completedDate)}
                            </p>
                            {record.totalCost && (
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(record.totalCost as number)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </DashboardGrid.FullWidth>

            {/* Repair History */}
            <DashboardGrid.FullWidth>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Repair History
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setRepairFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Report Issue
                  </Button>
                </CardHeader>
                <CardContent>
                  {repairRecords.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No repair records found
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {repairRecords.map((record) => (
                        <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant={severityVariants[record.severity] || 'info'} className="text-xs">
                                {record.severity}
                              </Badge>
                              <Badge variant={repairStatusVariants[record.status] || 'ghost'} className="text-xs">
                                {repairStatusLabels[record.status] || record.status}
                              </Badge>
                            </div>
                            <p className="text-sm mt-1">{record.issueDescription}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatDate(record.createdAt)}</p>
                            {record.totalCost && (
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(record.totalCost as number)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </DashboardGrid.FullWidth>
          </DashboardGrid>
        </div>
      </PageContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Equipment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{equipment.name}&quot;? This action will soft-delete the equipment record. You can restore it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Maintenance Form Modal */}
      <MaintenanceForm
        open={maintenanceFormOpen}
        onOpenChange={setMaintenanceFormOpen}
        equipmentId={equipmentId}
        mode="create"
        onSuccess={handleRefresh}
      />

      {/* Repair Form Modal */}
      <RepairForm
        open={repairFormOpen}
        onOpenChange={setRepairFormOpen}
        equipmentId={equipmentId}
        mode="create"
        onSuccess={handleRefresh}
      />
    </>
  );
}
