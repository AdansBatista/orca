'use client';

import Link from 'next/link';
import { Wrench, AlertTriangle, CheckCircle, Clock, Package } from 'lucide-react';
import type { Equipment, EquipmentType, Supplier } from '@prisma/client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type EquipmentWithRelations = Equipment & {
  type: Pick<EquipmentType, 'id' | 'name' | 'code'>;
  vendor?: Pick<Supplier, 'id' | 'name'> | null;
};

interface EquipmentCardProps {
  equipment: EquipmentWithRelations;
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'default'; icon: typeof CheckCircle }> = {
  ACTIVE: { label: 'Active', variant: 'success', icon: CheckCircle },
  IN_REPAIR: { label: 'In Repair', variant: 'warning', icon: Wrench },
  OUT_OF_SERVICE: { label: 'Out of Service', variant: 'error', icon: AlertTriangle },
  RETIRED: { label: 'Retired', variant: 'default', icon: Package },
  DISPOSED: { label: 'Disposed', variant: 'default', icon: Package },
};

const conditionConfig: Record<string, { label: string; color: string }> = {
  EXCELLENT: { label: 'Excellent', color: 'text-success-600' },
  GOOD: { label: 'Good', color: 'text-primary-600' },
  FAIR: { label: 'Fair', color: 'text-warning-600' },
  POOR: { label: 'Poor', color: 'text-error-600' },
  CRITICAL: { label: 'Critical', color: 'text-error-700' },
};

const categoryConfig: Record<string, { label: string; variant: 'info' | 'soft-accent' | 'soft-primary' | 'success' | 'warning' | 'error' | 'ghost' }> = {
  DIAGNOSTIC: { label: 'Diagnostic', variant: 'info' },
  TREATMENT: { label: 'Treatment', variant: 'soft-accent' },
  DIGITAL: { label: 'Digital', variant: 'soft-primary' },
  CHAIR: { label: 'Chair', variant: 'success' },
  STERILIZATION: { label: 'Sterilization', variant: 'warning' },
  SAFETY: { label: 'Safety', variant: 'error' },
  OTHER: { label: 'Other', variant: 'ghost' },
};

export function EquipmentCard({ equipment }: EquipmentCardProps) {
  const status = statusConfig[equipment.status] || statusConfig.ACTIVE;
  const StatusIcon = status.icon;
  const condition = conditionConfig[equipment.condition] || conditionConfig.GOOD;
  const category = categoryConfig[equipment.category] || categoryConfig.OTHER;

  // Check if maintenance is overdue or upcoming
  const isMaintenanceOverdue = equipment.nextMaintenanceDate && new Date(equipment.nextMaintenanceDate) < new Date();
  const isMaintenanceSoon = equipment.nextMaintenanceDate && !isMaintenanceOverdue &&
    new Date(equipment.nextMaintenanceDate) < new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

  return (
    <Link href={`/resources/equipment/${equipment.id}`}>
      <Card interactive className="h-full">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Equipment Name & Number */}
              <h3 className="font-semibold text-foreground truncate">{equipment.name}</h3>
              <p className="text-sm text-muted-foreground">{equipment.equipmentNumber}</p>

              {/* Type & Category */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant={category.variant} size="sm">
                  {category.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {equipment.type.name}
                </span>
              </div>

              {/* Location */}
              {equipment.locationNotes && (
                <p className="text-xs text-muted-foreground mt-2 truncate">
                  {equipment.locationNotes}
                </p>
              )}

              {/* Maintenance Alert */}
              {isMaintenanceOverdue && (
                <div className="flex items-center gap-1 text-xs text-error-600 mt-2">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Maintenance overdue</span>
                </div>
              )}
              {isMaintenanceSoon && !isMaintenanceOverdue && (
                <div className="flex items-center gap-1 text-xs text-warning-600 mt-2">
                  <Clock className="h-3 w-3" />
                  <span>Maintenance due soon</span>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className="flex flex-col items-end gap-2">
              <Badge variant={status.variant} className="gap-1">
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
              <span className={`text-xs font-medium ${condition.color}`}>
                {condition.label}
              </span>
            </div>
          </div>

          {/* Manufacturer & Model */}
          {(equipment.manufacturer || equipment.modelNumber) && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground truncate">
                {equipment.manufacturer}
                {equipment.manufacturer && equipment.modelNumber && ' • '}
                {equipment.modelNumber}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
