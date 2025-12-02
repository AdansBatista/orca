'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import type { Equipment } from '@prisma/client';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EquipmentForm } from '@/components/equipment/EquipmentForm';
import type { CreateEquipmentInput } from '@/lib/validations/equipment';

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

export default function EditEquipmentPage() {
  const params = useParams();
  const equipmentId = params.id as string;

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEquipment = async () => {
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
    };

    fetchEquipment();
  }, [equipmentId]);

  if (loading) {
    return (
      <>
        <PageHeader
          title="Edit Equipment"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Resources', href: '/resources' },
            { label: 'Equipment', href: '/resources/equipment' },
            { label: 'Loading...' },
          ]}
        />
        <PageContent density="comfortable" className="max-w-4xl">
          <LoadingSkeleton />
        </PageContent>
      </>
    );
  }

  if (error || !equipment) {
    return (
      <>
        <PageHeader
          title="Edit Equipment"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Resources', href: '/resources' },
            { label: 'Equipment', href: '/resources/equipment' },
            { label: 'Error' },
          ]}
        />
        <PageContent density="comfortable" className="max-w-4xl">
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

  // Convert equipment data to form input format
  const initialData: Partial<CreateEquipmentInput> = {
    name: equipment.name,
    equipmentNumber: equipment.equipmentNumber,
    typeId: equipment.typeId,
    category: equipment.category as CreateEquipmentInput['category'],
    serialNumber: equipment.serialNumber,
    modelNumber: equipment.modelNumber,
    barcode: equipment.barcode,
    manufacturer: equipment.manufacturer,
    roomId: equipment.roomId,
    locationNotes: equipment.locationNotes,
    status: equipment.status as CreateEquipmentInput['status'],
    condition: equipment.condition as CreateEquipmentInput['condition'],
    purchaseDate: equipment.purchaseDate,
    purchasePrice: equipment.purchasePrice as number | undefined,
    vendorId: equipment.vendorId,
    purchaseOrderNumber: equipment.purchaseOrderNumber,
    warrantyExpiry: equipment.warrantyExpiry,
    warrantyNotes: equipment.warrantyNotes,
    hasExtendedWarranty: equipment.hasExtendedWarranty,
    extendedWarrantyExpiry: equipment.extendedWarrantyExpiry,
    usefulLifeMonths: equipment.usefulLifeMonths,
    salvageValue: equipment.salvageValue as number | undefined,
    depreciationMethod: equipment.depreciationMethod as CreateEquipmentInput['depreciationMethod'],
    maintenanceIntervalDays: equipment.maintenanceIntervalDays,
    nextMaintenanceDate: equipment.nextMaintenanceDate,
    notes: equipment.notes,
  };

  return (
    <>
      <PageHeader
        title="Edit Equipment"
        description={`Editing ${equipment.name}`}
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Equipment', href: '/resources/equipment' },
          { label: equipment.name, href: `/resources/equipment/${equipmentId}` },
          { label: 'Edit' },
        ]}
      />
      <PageContent density="comfortable" className="max-w-4xl">
        <EquipmentForm
          mode="edit"
          equipmentId={equipmentId}
          initialData={initialData}
        />
      </PageContent>
    </>
  );
}
