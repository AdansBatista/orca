'use client';

import Link from 'next/link';
import {
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

import { DashboardGrid } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

interface SupplierDetailProps {
  supplier: Supplier;
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

export function SupplierDetail({ supplier }: SupplierDetailProps) {
  const hasAddress = supplier.address || supplier.city || supplier.state || supplier.postalCode || supplier.country;

  return (
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
              <Link href={`/resources/equipment?vendorId=${supplier.id}`}>
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
  );
}
