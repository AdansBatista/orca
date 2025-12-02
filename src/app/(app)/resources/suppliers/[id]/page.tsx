'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Trash2,
  AlertTriangle,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  CreditCard,
  Truck,
  Star,
  Package,
} from 'lucide-react';

import { PageHeader, PageContent, DashboardGrid } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Supplier {
  id: string;
  code: string;
  name: string;
  status: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  fax: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  accountNumber: string | null;
  paymentTerms: string | null;
  orderMethod: string | null;
  minimumOrder: number | null;
  freeShippingThreshold: number | null;
  defaultLeadTimeDays: number | null;
  taxExempt: boolean;
  isPreferred: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    equipment: number;
  };
}

function LoadingSkeleton() {
  return (
    <DashboardGrid>
      <DashboardGrid.TwoThirds className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-40" />
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </DashboardGrid.TwoThirds>
      <DashboardGrid.OneThird>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </DashboardGrid.OneThird>
    </DashboardGrid>
  );
}

function getStatusVariant(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'INACTIVE':
      return 'secondary';
    case 'ON_HOLD':
      return 'warning';
    case 'BLOCKED':
      return 'destructive';
    default:
      return 'secondary';
  }
}

function getOrderMethodLabel(method: string | null) {
  const labels: Record<string, string> = {
    EMAIL: 'Email',
    PORTAL: 'Online Portal',
    PHONE: 'Phone',
    FAX: 'Fax',
    EDI: 'EDI',
  };
  return method ? labels[method] || method : 'Not specified';
}

function formatCurrency(amount: number | null) {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = params.id as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSupplier = useCallback(async () => {
    try {
      const response = await fetch(`/api/resources/suppliers/${supplierId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch supplier');
      }

      setSupplier(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    fetchSupplier();
  }, [fetchSupplier]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/resources/suppliers/${supplierId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete supplier');
      }

      router.push('/resources/suppliers');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete supplier');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Supplier Details"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Resources', href: '/resources' },
            { label: 'Suppliers', href: '/resources/suppliers' },
            { label: 'Loading...' },
          ]}
        />
        <PageContent density="comfortable">
          <LoadingSkeleton />
        </PageContent>
      </>
    );
  }

  if (error || !supplier) {
    return (
      <>
        <PageHeader
          title="Supplier Details"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Resources', href: '/resources' },
            { label: 'Suppliers', href: '/resources/suppliers' },
            { label: 'Error' },
          ]}
        />
        <PageContent density="comfortable" className="max-w-4xl">
          <Card variant="ghost" className="border-error-200 bg-error-50">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-error-600 mb-4" />
              <h3 className="font-semibold text-error-900 mb-2">Failed to load supplier</h3>
              <p className="text-error-700 mb-4">{error || 'Supplier not found'}</p>
              <div className="flex justify-center gap-3">
                <Link href="/resources/suppliers">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Suppliers
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

  const hasAddress = supplier.address || supplier.city || supplier.state || supplier.postalCode || supplier.country;

  return (
    <>
      <PageHeader
        title={supplier.name}
        description={`Supplier Code: ${supplier.code}`}
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Suppliers', href: '/resources/suppliers' },
          { label: supplier.name },
        ]}
        actions={
          <div className="flex gap-2">
            <Link href={`/resources/suppliers/${supplierId}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &ldquo;{supplier.name}&rdquo;? This action cannot
                    be undone. Any equipment linked to this supplier will be unlinked.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-error-600 hover:bg-error-700">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />
      <PageContent density="comfortable">
        <DashboardGrid>
          <DashboardGrid.TwoThirds className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle size="sm" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Supplier Name</p>
                  <p className="font-medium">{supplier.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Supplier Code</p>
                  <p className="font-medium font-mono">{supplier.code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusVariant(supplier.status)} className="mt-1">
                    {supplier.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Number</p>
                  <p className="font-medium">{supplier.accountNumber || '—'}</p>
                </div>
                {supplier.isPreferred && (
                  <div className="md:col-span-2">
                    <Badge variant="warning" className="gap-1">
                      <Star className="h-3 w-3" />
                      Preferred Supplier
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle size="sm" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Contact Name</p>
                  <p className="font-medium">{supplier.contactName || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  {supplier.email ? (
                    <a href={`mailto:${supplier.email}`} className="font-medium text-primary-600 hover:underline">
                      {supplier.email}
                    </a>
                  ) : (
                    <p className="font-medium">—</p>
                  )}
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    {supplier.phone ? (
                      <a href={`tel:${supplier.phone}`} className="font-medium text-primary-600 hover:underline">
                        {supplier.phone}
                      </a>
                    ) : (
                      <p className="font-medium">—</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fax</p>
                  <p className="font-medium">{supplier.fax || '—'}</p>
                </div>
                <div className="md:col-span-2 flex items-start gap-2">
                  <Globe className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Website</p>
                    {supplier.website ? (
                      <a
                        href={supplier.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary-600 hover:underline"
                      >
                        {supplier.website}
                      </a>
                    ) : (
                      <p className="font-medium">—</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            {hasAddress && (
              <Card>
                <CardHeader>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <address className="not-italic">
                    {supplier.address && <p>{supplier.address}</p>}
                    {(supplier.city || supplier.state || supplier.postalCode) && (
                      <p>
                        {[supplier.city, supplier.state, supplier.postalCode].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {supplier.country && <p>{supplier.country}</p>}
                  </address>
                </CardContent>
              </Card>
            )}

            {/* Order Settings */}
            <Card>
              <CardHeader>
                <CardTitle size="sm" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Order Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Order Method</p>
                  <p className="font-medium">{getOrderMethodLabel(supplier.orderMethod)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lead Time</p>
                  <p className="font-medium">
                    {supplier.defaultLeadTimeDays ? `${supplier.defaultLeadTimeDays} days` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Minimum Order</p>
                  <p className="font-medium">{formatCurrency(supplier.minimumOrder)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Free Shipping Threshold</p>
                  <p className="font-medium">{formatCurrency(supplier.freeShippingThreshold)}</p>
                </div>
                <div className="flex items-start gap-2">
                  <CreditCard className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Terms</p>
                    <p className="font-medium">{supplier.paymentTerms || '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tax Exempt</p>
                  <Badge variant={supplier.taxExempt ? 'success' : 'secondary'}>
                    {supplier.taxExempt ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {supplier.notes && (
              <Card>
                <CardHeader>
                  <CardTitle size="sm">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{supplier.notes}</p>
                </CardContent>
              </Card>
            )}
          </DashboardGrid.TwoThirds>

          <DashboardGrid.OneThird className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle size="sm" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Related Equipment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-primary-600">
                    {supplier._count?.equipment ?? 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Equipment Items</p>
                </div>
                {(supplier._count?.equipment ?? 0) > 0 && (
                  <Link href={`/resources/equipment?vendorId=${supplierId}`}>
                    <Button variant="outline" className="w-full mt-2">
                      View Equipment
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card variant="ghost">
              <CardHeader>
                <CardTitle size="sm">Record Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(supplier.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{new Date(supplier.updatedAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </DashboardGrid.OneThird>
        </DashboardGrid>
      </PageContent>
    </>
  );
}
