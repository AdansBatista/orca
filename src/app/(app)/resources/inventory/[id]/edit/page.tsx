'use client';

import { use, useState, useEffect } from 'react';
import { PageHeader, PageContent } from '@/components/layout';
import { InventoryForm } from '@/components/inventory';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CreateInventoryItemInput } from '@/lib/validations/inventory';

interface EditInventoryItemPageProps {
  params: Promise<{ id: string }>;
}

export default function EditInventoryItemPage({ params }: EditInventoryItemPageProps) {
  const { id } = use(params);
  const [initialData, setInitialData] = useState<Partial<CreateInventoryItemInput> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/resources/inventory/${id}`);
        const result = await response.json();
        if (result.success) {
          // Map the item data to form input format
          const item = result.data;
          setInitialData({
            name: item.name,
            sku: item.sku,
            barcode: item.barcode,
            upc: item.upc,
            category: item.category,
            subcategory: item.subcategory,
            brand: item.brand,
            manufacturer: item.manufacturer,
            description: item.description,
            specifications: item.specifications,
            size: item.size,
            color: item.color,
            material: item.material,
            supplierId: item.supplierId,
            supplierSku: item.supplierSku,
            alternateSupplierIds: item.alternateSupplierIds,
            unitCost: Number(item.unitCost),
            lastCost: item.lastCost ? Number(item.lastCost) : undefined,
            averageCost: item.averageCost ? Number(item.averageCost) : undefined,
            unitOfMeasure: item.unitOfMeasure,
            unitsPerPackage: item.unitsPerPackage,
            packageDescription: item.packageDescription,
            currentStock: item.currentStock,
            reservedStock: item.reservedStock,
            reorderPoint: item.reorderPoint,
            reorderQuantity: item.reorderQuantity,
            safetyStock: item.safetyStock,
            maxStock: item.maxStock,
            leadTimeDays: item.leadTimeDays,
            trackLots: item.trackLots,
            trackExpiry: item.trackExpiry,
            trackSerial: item.trackSerial,
            storageLocation: item.storageLocation,
            storageRequirements: item.storageRequirements,
            status: item.status,
            isOrderable: item.isOrderable,
            msdsUrl: item.msdsUrl,
            imageUrl: item.imageUrl,
            documents: item.documents,
          });
        } else {
          setError(result.error?.message || 'Failed to fetch item');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  if (loading) {
    return (
      <>
        <PageHeader
          title="Edit Inventory Item"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Resources', href: '/resources' },
            { label: 'Inventory', href: '/resources/inventory' },
            { label: 'Edit Item' },
          ]}
        />
        <PageContent density="comfortable">
          <div className="space-y-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </PageContent>
      </>
    );
  }

  if (error || !initialData) {
    return (
      <>
        <PageHeader
          title="Edit Inventory Item"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Resources', href: '/resources' },
            { label: 'Inventory', href: '/resources/inventory' },
            { label: 'Edit Item' },
          ]}
        />
        <PageContent density="comfortable">
          <Card variant="ghost">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-error-500 mx-auto mb-2" />
              <p className="text-error-600">{error || 'Item not found'}</p>
              <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Inventory Item"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Resources', href: '/resources' },
          { label: 'Inventory', href: '/resources/inventory' },
          { label: 'Edit Item' },
        ]}
      />
      <PageContent density="comfortable">
        <InventoryForm mode="edit" itemId={id} initialData={initialData} />
      </PageContent>
    </>
  );
}
