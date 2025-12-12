'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  Edit,
  Trash2,
  Clock,
  Zap,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  Save,
  Loader2,
  DollarSign,
  Building2,
  FileText,
  CheckCircle,
  MoreHorizontal,
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormField } from '@/components/ui/form-field';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PageHeader, PageContent, DashboardGrid, StatsRow } from '@/components/layout';

interface LabProduct {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  category: string;
  standardTurnaround: number;
  rushTurnaround: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  vendor: {
    id: string;
    name: string;
    code: string;
  } | null;
  feeSchedules: Array<{
    id: string;
    basePrice: number;
    rushUpchargePercent: number | null;
    effectiveDate: string;
    isActive: boolean;
  }>;
  _count: {
    orderItems: number;
  };
}

const categoryLabels: Record<string, string> = {
  RETAINER: 'Retainers',
  APPLIANCE: 'Appliances',
  ALIGNER: 'Aligners',
  INDIRECT_BONDING: 'Indirect Bonding',
  ARCHWIRE: 'Archwires',
  MODEL: 'Models',
  SURGICAL: 'Surgical',
  OTHER: 'Other',
};

const categoryOptions = Object.entries(categoryLabels).map(([value, label]) => ({ value, label }));

function ProductDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Skeleton className="h-64" />
        </div>
        <div>
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<LabProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    sku: '',
    category: '',
    standardTurnaround: '',
    rushTurnaround: '',
    isActive: true,
  });

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/lab/products/${resolvedParams.id}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch product');
        }

        setProduct(result.data);
        setEditForm({
          name: result.data.name,
          description: result.data.description || '',
          sku: result.data.sku || '',
          category: result.data.category,
          standardTurnaround: result.data.standardTurnaround.toString(),
          rushTurnaround: result.data.rushTurnaround?.toString() || '',
          isActive: result.data.isActive,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [resolvedParams.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/lab/products/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description || null,
          sku: editForm.sku || null,
          category: editForm.category,
          standardTurnaround: parseInt(editForm.standardTurnaround),
          rushTurnaround: editForm.rushTurnaround ? parseInt(editForm.rushTurnaround) : null,
          isActive: editForm.isActive,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update product');
      }

      setProduct(result.data);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/lab/products/${resolvedParams.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete product');
      }

      router.push('/lab/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCurrentPrice = () => {
    if (!product?.feeSchedules?.length) return null;
    const activeSchedule = product.feeSchedules.find((fs) => fs.isActive);
    return activeSchedule || product.feeSchedules[0];
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Product Details"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Lab', href: '/lab' },
            { label: 'Products', href: '/lab/products' },
            { label: 'Loading...' },
          ]}
        />
        <PageContent density="comfortable">
          <ProductDetailSkeleton />
        </PageContent>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <PageHeader
          title="Product Details"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Lab', href: '/lab' },
            { label: 'Products', href: '/lab/products' },
            { label: 'Error' },
          ]}
        />
        <PageContent density="comfortable">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Product not found'}</AlertDescription>
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

  const currentPrice = getCurrentPrice();

  return (
    <>
      <PageHeader
        title={product.name}
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Lab', href: '/lab' },
          { label: 'Products', href: '/lab/products' },
          { label: product.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/lab/orders/new?productId=${product.id}`}>
                        <Package className="h-4 w-4 mr-2" />
                        Create Order with Product
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Product
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        }
      />

      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Header Card */}
          <Card variant="ghost">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-primary rounded-xl">
                    <Package className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <FormField label="Product Name">
                          <Input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-64"
                          />
                        </FormField>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-2xl font-bold">{product.name}</h2>
                          <Badge variant={product.isActive ? 'success' : 'secondary'} size="lg" dot>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <Badge variant="soft-primary">
                            {categoryLabels[product.category] || product.category}
                          </Badge>
                          {product.sku && (
                            <span className="font-mono">SKU: {product.sku}</span>
                          )}
                          {product.vendor && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {product.vendor.name}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Row */}
          <StatsRow>
            <StatCard accentColor="primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Standard Turnaround</p>
                  <p className="text-2xl font-bold">
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editForm.standardTurnaround}
                        onChange={(e) => setEditForm({ ...editForm, standardTurnaround: e.target.value })}
                        className="w-20 h-8 text-lg"
                      />
                    ) : (
                      `${product.standardTurnaround} days`
                    )}
                  </p>
                </div>
                <Clock className="h-5 w-5 text-primary-600" />
              </div>
            </StatCard>

            <StatCard accentColor="warning">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Rush Turnaround</p>
                  <p className="text-2xl font-bold">
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editForm.rushTurnaround}
                        onChange={(e) => setEditForm({ ...editForm, rushTurnaround: e.target.value })}
                        placeholder="N/A"
                        className="w-20 h-8 text-lg"
                      />
                    ) : (
                      product.rushTurnaround ? `${product.rushTurnaround} days` : 'N/A'
                    )}
                  </p>
                </div>
                <Zap className="h-5 w-5 text-warning-600" />
              </div>
            </StatCard>

            <StatCard accentColor="success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Base Price</p>
                  <p className="text-2xl font-bold">
                    {currentPrice ? `$${currentPrice.basePrice.toFixed(2)}` : 'Not set'}
                  </p>
                </div>
                <DollarSign className="h-5 w-5 text-success-600" />
              </div>
            </StatCard>

            <StatCard accentColor="accent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{product._count.orderItems}</p>
                </div>
                <FileText className="h-5 w-5 text-accent-600" />
              </div>
            </StatCard>
          </StatsRow>

          <DashboardGrid>
            {/* Main Content */}
            <DashboardGrid.TwoThirds>
              <Card variant="bento">
                <CardHeader>
                  <CardTitle>Product Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <FormField label="Description">
                        <Textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          rows={3}
                          placeholder="Product description..."
                        />
                      </FormField>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="Category">
                          <Select
                            value={editForm.category}
                            onValueChange={(v) => setEditForm({ ...editForm, category: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categoryOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>

                        <FormField label="SKU">
                          <Input
                            value={editForm.sku}
                            onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                            placeholder="Product SKU"
                          />
                        </FormField>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                        <div>
                          <Label className="font-medium">Active Product</Label>
                          <p className="text-xs text-muted-foreground">
                            Inactive products cannot be added to orders
                          </p>
                        </div>
                        <Switch
                          checked={editForm.isActive}
                          onCheckedChange={(v) => setEditForm({ ...editForm, isActive: v })}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {product.description && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                          <p>{product.description}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Category</p>
                          <Badge variant="soft-primary">
                            {categoryLabels[product.category] || product.category}
                          </Badge>
                        </div>

                        {product.sku && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">SKU</p>
                            <p className="font-mono">{product.sku}</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Created</p>
                          <p>{formatDate(product.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Last Updated</p>
                          <p>{formatDate(product.updatedAt)}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </DashboardGrid.TwoThirds>

            {/* Sidebar */}
            <DashboardGrid.OneThird>
              {/* Vendor Info */}
              <Card variant="bento">
                <CardHeader compact>
                  <CardTitle size="sm">Lab Vendor</CardTitle>
                </CardHeader>
                <CardContent compact>
                  {product.vendor ? (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-accent rounded-lg">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{product.vendor.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{product.vendor.code}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Clinic-wide product (no specific vendor)
                    </p>
                  )}
                  {product.vendor && (
                    <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                      <Link href={`/lab/vendors/${product.vendor.id}`}>
                        View Vendor
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card variant="bento">
                <CardHeader compact>
                  <CardTitle size="sm">Pricing</CardTitle>
                </CardHeader>
                <CardContent compact>
                  {currentPrice ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Base Price</span>
                        <span className="font-semibold">${currentPrice.basePrice.toFixed(2)}</span>
                      </div>
                      {currentPrice.rushUpchargePercent && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Rush Upcharge</span>
                            <span>{currentPrice.rushUpchargePercent}%</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-sm text-warning-600 flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              Rush Price
                            </span>
                            <span className="font-semibold text-warning-600">
                              ${(currentPrice.basePrice * (1 + currentPrice.rushUpchargePercent / 100)).toFixed(2)}
                            </span>
                          </div>
                        </>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Effective since {formatDate(currentPrice.effectiveDate)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No pricing set</p>
                  )}
                </CardContent>
              </Card>

              {/* Turnaround */}
              <Card variant="bento">
                <CardHeader compact>
                  <CardTitle size="sm">Turnaround Times</CardTitle>
                </CardHeader>
                <CardContent compact>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Standard
                      </span>
                      <span className="font-medium">{product.standardTurnaround} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-warning-600 flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Rush
                      </span>
                      <span className="font-medium text-warning-600">
                        {product.rushTurnaround ? `${product.rushTurnaround} days` : 'Not available'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DashboardGrid.OneThird>
          </DashboardGrid>
        </div>
      </PageContent>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{product.name}"? This action cannot be undone.
              {product._count.orderItems > 0 && (
                <span className="block mt-2 text-warning-600">
                  Warning: This product has been used in {product._count.orderItems} orders.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
