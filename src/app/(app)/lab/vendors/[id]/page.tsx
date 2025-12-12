'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Edit,
  Trash2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Package,
  FileText,
  TrendingUp,
  Clock,
  AlertCircle,
  ChevronRight,
  Plus,
  MoreHorizontal,
  ExternalLink,
  CreditCard,
  Truck,
  Star,
  ArrowLeft,
  CheckCircle,
  Users,
  Save,
  Loader2,
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormField } from '@/components/ui/form-field';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  ListItem,
  ListItemTitle,
  ListItemDescription,
} from '@/components/ui/list-item';
import { PageHeader, PageContent, DashboardGrid, StatsRow } from '@/components/layout';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface LabVendor {
  id: string;
  name: string;
  code: string;
  legalName: string | null;
  taxId: string | null;
  website: string | null;
  accountNumber: string | null;
  status: string;
  primaryPhone: string | null;
  primaryEmail: string | null;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  } | null;
  portalUrl: string | null;
  apiEndpoint: string | null;
  capabilities: string[];
  specialties: string[];
  defaultCarrier: string | null;
  shippingAccountNumber: string | null;
  paymentTerms: number | null;
  billingEmail: string | null;
  createdAt: string;
  updatedAt: string;
  contacts: Array<{
    id: string;
    name: string;
    title: string | null;
    phone: string | null;
    email: string | null;
    role: string;
    isPrimary: boolean;
  }>;
  products: Array<{
    id: string;
    name: string;
    category: string;
    standardTurnaround: number;
    isActive: boolean;
  }>;
  _count: {
    orders: number;
    products: number;
    contracts: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    orderDate: string;
    totalCost: number;
    patient: {
      firstName: string;
      lastName: string;
    };
  }>;
}

const statusConfig: Record<string, { color: 'success' | 'warning' | 'destructive' | 'secondary'; label: string }> = {
  ACTIVE: { color: 'success', label: 'Active' },
  INACTIVE: { color: 'secondary', label: 'Inactive' },
  SUSPENDED: { color: 'destructive', label: 'Suspended' },
  PENDING: { color: 'warning', label: 'Pending' },
};

const capabilityLabels: Record<string, string> = {
  RETAINER: 'Retainers',
  APPLIANCE: 'Appliances',
  ALIGNER: 'Aligners',
  INDIRECT_BONDING: 'Indirect Bonding',
  ARCHWIRE: 'Archwires',
  MODEL: 'Models',
  SURGICAL: 'Surgical',
  OTHER: 'Other',
};

const carrierLabels: Record<string, string> = {
  FEDEX: 'FedEx',
  UPS: 'UPS',
  USPS: 'USPS',
  DHL: 'DHL',
  LAB_COURIER: 'Lab Courier',
  OTHER: 'Other',
};

const contactRoleLabels: Record<string, string> = {
  PRIMARY: 'Primary',
  BILLING: 'Billing',
  TECHNICAL: 'Technical',
  SHIPPING: 'Shipping',
  EMERGENCY: 'Emergency',
};

function VendorDetailSkeleton() {
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
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  );
}

export default function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [vendor, setVendor] = useState<LabVendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    code: '',
    status: '',
    primaryPhone: '',
    primaryEmail: '',
    website: '',
    paymentTerms: '',
  });

  // Fetch vendor data
  useEffect(() => {
    const fetchVendor = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/lab/vendors/${resolvedParams.id}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch vendor');
        }

        setVendor(result.data);
        setEditForm({
          name: result.data.name,
          code: result.data.code,
          status: result.data.status,
          primaryPhone: result.data.primaryPhone || '',
          primaryEmail: result.data.primaryEmail || '',
          website: result.data.website || '',
          paymentTerms: result.data.paymentTerms?.toString() || '30',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchVendor();
  }, [resolvedParams.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/lab/vendors/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          code: editForm.code,
          status: editForm.status,
          primaryPhone: editForm.primaryPhone || null,
          primaryEmail: editForm.primaryEmail || null,
          website: editForm.website || null,
          paymentTerms: editForm.paymentTerms ? parseInt(editForm.paymentTerms) : null,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update vendor');
      }

      setVendor(result.data);
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
      const response = await fetch(`/api/lab/vendors/${resolvedParams.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete vendor');
      }

      router.push('/lab/vendors');
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

  const formatAddress = (address: LabVendor['address']) => {
    if (!address) return null;
    const parts = [address.street, address.city, address.state, address.zip, address.country].filter(Boolean);
    return parts.join(', ');
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Vendor Details"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Lab', href: '/lab' },
            { label: 'Vendors', href: '/lab/vendors' },
            { label: 'Loading...' },
          ]}
        />
        <PageContent density="comfortable">
          <VendorDetailSkeleton />
        </PageContent>
      </>
    );
  }

  if (error || !vendor) {
    return (
      <>
        <PageHeader
          title="Vendor Details"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Lab', href: '/lab' },
            { label: 'Vendors', href: '/lab/vendors' },
            { label: 'Error' },
          ]}
        />
        <PageContent density="comfortable">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Vendor not found'}</AlertDescription>
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

  return (
    <>
      <PageHeader
        title={vendor.name}
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Lab', href: '/lab' },
          { label: 'Vendors', href: '/lab/vendors' },
          { label: vendor.name },
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
                <Button asChild>
                  <Link href={`/lab/orders/new?vendorId=${vendor.id}`}>
                    <Plus className="h-4 w-4" />
                    New Order
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {vendor.portalUrl && (
                      <DropdownMenuItem asChild>
                        <a href={vendor.portalUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Lab Portal
                        </a>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href={`/lab/products/new?vendorId=${vendor.id}`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Vendor
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
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-gradient-accent text-white text-2xl">
                    {vendor.code}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-4">
                        <FormField label="Name">
                          <Input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        </FormField>
                        <FormField label="Code">
                          <Input
                            value={editForm.code}
                            onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                          />
                        </FormField>
                        <FormField label="Status">
                          <Select
                            value={editForm.status}
                            onValueChange={(v) => setEditForm({ ...editForm, status: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusConfig).map(([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  {config.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold">{vendor.name}</h2>
                        <Badge variant={statusConfig[vendor.status]?.color || 'secondary'} size="lg">
                          {statusConfig[vendor.status]?.label || vendor.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-mono">{vendor.code}</span>
                        {vendor.website && (
                          <a
                            href={vendor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary-600 hover:underline"
                          >
                            <Globe className="h-3 w-3" />
                            Website
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {vendor.accountNumber && (
                          <span>Account: {vendor.accountNumber}</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Row */}
          <StatsRow>
            <StatCard accentColor="primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{vendor._count.orders}</p>
                </div>
                <Package className="h-5 w-5 text-primary-600" />
              </div>
            </StatCard>

            <StatCard accentColor="accent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Products</p>
                  <p className="text-2xl font-bold">{vendor._count.products}</p>
                </div>
                <FileText className="h-5 w-5 text-accent-600" />
              </div>
            </StatCard>

            <StatCard accentColor="success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Contracts</p>
                  <p className="text-2xl font-bold">{vendor._count.contracts}</p>
                </div>
                <FileText className="h-5 w-5 text-success-600" />
              </div>
            </StatCard>

            <StatCard accentColor="warning">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Payment Terms</p>
                  <p className="text-2xl font-bold">{vendor.paymentTerms || 30} days</p>
                </div>
                <CreditCard className="h-5 w-5 text-warning-600" />
              </div>
            </StatCard>
          </StatsRow>

          <DashboardGrid>
            {/* Main Content */}
            <DashboardGrid.TwoThirds>
              <Tabs defaultValue="products" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="products">Products ({vendor.products.length})</TabsTrigger>
                  <TabsTrigger value="orders">Recent Orders</TabsTrigger>
                  <TabsTrigger value="contacts">Contacts ({vendor.contacts.length})</TabsTrigger>
                </TabsList>

                {/* Products Tab */}
                <TabsContent value="products">
                  <Card variant="bento">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Products</CardTitle>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/lab/products/new?vendorId=${vendor.id}`}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Product
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {vendor.products.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No products configured</p>
                          <p className="text-sm">Add products that this lab produces</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Turnaround</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {vendor.products.map((product) => (
                              <TableRow
                                key={product.id}
                                className="cursor-pointer"
                                onClick={() => router.push(`/lab/products/${product.id}`)}
                              >
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" size="sm">
                                    {capabilityLabels[product.category] || product.category}
                                  </Badge>
                                </TableCell>
                                <TableCell>{product.standardTurnaround} days</TableCell>
                                <TableCell>
                                  <Badge variant={product.isActive ? 'success' : 'secondary'} size="sm" dot>
                                    {product.isActive ? 'Active' : 'Inactive'}
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

                {/* Orders Tab */}
                <TabsContent value="orders">
                  <Card variant="bento">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Recent Orders</CardTitle>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/lab/orders?vendorId=${vendor.id}`}>
                            View All
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {vendor.recentOrders?.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No orders yet</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {vendor.recentOrders?.map((order) => (
                            <ListItem
                              key={order.id}
                              variant="bordered"
                              showArrow
                              onClick={() => router.push(`/lab/orders/${order.id}`)}
                              trailing={
                                <span className="font-medium">${order.totalCost.toFixed(2)}</span>
                              }
                            >
                              <ListItemTitle className="font-mono text-sm">
                                {order.orderNumber}
                              </ListItemTitle>
                              <ListItemDescription>
                                <PhiProtected fakeData={getFakeName()}>
                                  {order.patient.firstName} {order.patient.lastName}
                                </PhiProtected>
                                {' '}&bull; {formatDate(order.orderDate)}
                              </ListItemDescription>
                            </ListItem>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Contacts Tab */}
                <TabsContent value="contacts">
                  <Card variant="bento">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Contacts</CardTitle>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Contact
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {vendor.contacts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No contacts added</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {vendor.contacts.map((contact) => (
                            <div
                              key={contact.id}
                              className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl"
                            >
                              <Avatar className="h-12 w-12">
                                <AvatarFallback className="bg-gradient-primary text-white">
                                  {contact.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{contact.name}</p>
                                  {contact.isPrimary && (
                                    <Badge variant="soft-primary" size="sm">
                                      <Star className="h-3 w-3 mr-1" />
                                      Primary
                                    </Badge>
                                  )}
                                  <Badge variant="outline" size="sm">
                                    {contactRoleLabels[contact.role] || contact.role}
                                  </Badge>
                                </div>
                                {contact.title && (
                                  <p className="text-sm text-muted-foreground">{contact.title}</p>
                                )}
                                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                  {contact.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {contact.phone}
                                    </span>
                                  )}
                                  {contact.email && (
                                    <span className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {contact.email}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
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
              {/* Contact Info */}
              <Card variant="bento">
                <CardHeader compact>
                  <CardTitle size="sm">Contact Information</CardTitle>
                </CardHeader>
                <CardContent compact className="space-y-3">
                  {isEditing ? (
                    <>
                      <FormField label="Phone">
                        <Input
                          value={editForm.primaryPhone}
                          onChange={(e) => setEditForm({ ...editForm, primaryPhone: e.target.value })}
                          placeholder="(555) 123-4567"
                        />
                      </FormField>
                      <FormField label="Email">
                        <Input
                          type="email"
                          value={editForm.primaryEmail}
                          onChange={(e) => setEditForm({ ...editForm, primaryEmail: e.target.value })}
                          placeholder="orders@example.com"
                        />
                      </FormField>
                      <FormField label="Website">
                        <Input
                          value={editForm.website}
                          onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                          placeholder="https://example.com"
                        />
                      </FormField>
                    </>
                  ) : (
                    <>
                      {vendor.primaryPhone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {vendor.primaryPhone}
                        </div>
                      )}
                      {vendor.primaryEmail && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {vendor.primaryEmail}
                        </div>
                      )}
                      {formatAddress(vendor.address) && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span>{formatAddress(vendor.address)}</span>
                        </div>
                      )}
                      {!vendor.primaryPhone && !vendor.primaryEmail && !formatAddress(vendor.address) && (
                        <p className="text-sm text-muted-foreground">No contact info added</p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Capabilities */}
              <Card variant="bento">
                <CardHeader compact>
                  <CardTitle size="sm">Capabilities</CardTitle>
                </CardHeader>
                <CardContent compact>
                  {vendor.capabilities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No capabilities set</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {vendor.capabilities.map((cap) => (
                        <Badge key={cap} variant="soft-primary">
                          {capabilityLabels[cap] || cap}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {vendor.specialties.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Specialties</p>
                      <div className="flex flex-wrap gap-1">
                        {vendor.specialties.map((spec, i) => (
                          <Badge key={i} variant="outline" size="sm">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Shipping & Billing */}
              <Card variant="bento">
                <CardHeader compact>
                  <CardTitle size="sm">Shipping & Billing</CardTitle>
                </CardHeader>
                <CardContent compact className="space-y-3 text-sm">
                  {isEditing ? (
                    <FormField label="Payment Terms (Days)">
                      <Input
                        type="number"
                        value={editForm.paymentTerms}
                        onChange={(e) => setEditForm({ ...editForm, paymentTerms: e.target.value })}
                      />
                    </FormField>
                  ) : (
                    <>
                      {vendor.defaultCarrier && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Default Carrier</span>
                          <span className="flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            {carrierLabels[vendor.defaultCarrier] || vendor.defaultCarrier}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Payment Terms</span>
                        <span>{vendor.paymentTerms || 30} days</span>
                      </div>
                      {vendor.billingEmail && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Billing Email</span>
                          <span className="text-xs">{vendor.billingEmail}</span>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Integration */}
              {(vendor.portalUrl || vendor.apiEndpoint) && (
                <Card variant="bento">
                  <CardHeader compact>
                    <CardTitle size="sm">Integration</CardTitle>
                  </CardHeader>
                  <CardContent compact className="space-y-2">
                    {vendor.portalUrl && (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <a href={vendor.portalUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Lab Portal
                        </a>
                      </Button>
                    )}
                    {vendor.apiEndpoint && (
                      <p className="text-xs text-muted-foreground">
                        API: {vendor.apiEndpoint}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </DashboardGrid.OneThird>
          </DashboardGrid>
        </div>
      </PageContent>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vendor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {vendor.name}? This will also remove all associated
              products and fee schedules. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete Vendor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
