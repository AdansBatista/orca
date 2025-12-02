'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SupplierForm } from '@/components/suppliers/SupplierForm';
import type { CreateSupplierInput } from '@/lib/validations/equipment';

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
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4].map((i) => (
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
    </div>
  );
}

export default function EditSupplierPage() {
  const params = useParams();
  const supplierId = params.id as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSupplier = async () => {
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
    };

    fetchSupplier();
  }, [supplierId]);

  if (loading) {
    return (
      <>
        <PageHeader
          title="Edit Supplier"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Resources', href: '/resources' },
            { label: 'Suppliers', href: '/resources/suppliers' },
            { label: 'Loading...' },
          ]}
        />
        <PageContent density="comfortable" className="max-w-4xl">
          <LoadingSkeleton />
        </PageContent>
      </>
    );
  }

  if (error || !supplier) {
    return (
      <>
        <PageHeader
          title="Edit Supplier"
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

  // Convert supplier data to form input format
  const initialData: Partial<CreateSupplierInput> = {
    name: supplier.name,
    code: supplier.code,
    status: supplier.status as CreateSupplierInput['status'],
    contactName: supplier.contactName,
    email: supplier.email,
    phone: supplier.phone,
    fax: supplier.fax,
    website: supplier.website,
    address: supplier.address,
    city: supplier.city,
    state: supplier.state,
    postalCode: supplier.postalCode,
    country: supplier.country,
    accountNumber: supplier.accountNumber,
    paymentTerms: supplier.paymentTerms,
    orderMethod: supplier.orderMethod as CreateSupplierInput['orderMethod'],
    minimumOrder: supplier.minimumOrder as number | undefined,
    freeShippingThreshold: supplier.freeShippingThreshold as number | undefined,
    defaultLeadTimeDays: supplier.defaultLeadTimeDays as number | undefined,
    taxExempt: supplier.taxExempt,
    isPreferred: supplier.isPreferred,
    notes: supplier.notes,
  };

  return (
    <>
      <PageHeader
        title="Edit Supplier"
        description={`Editing ${supplier.name}`}
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Suppliers', href: '/resources/suppliers' },
          { label: supplier.name, href: `/resources/suppliers/${supplierId}` },
          { label: 'Edit' },
        ]}
      />
      <PageContent density="comfortable" className="max-w-4xl">
        <SupplierForm
          mode="edit"
          supplierId={supplierId}
          initialData={initialData}
        />
      </PageContent>
    </>
  );
}
