'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Package, Calendar, Clock, AlertTriangle } from 'lucide-react';
import type { PackageType, PackageStatus } from '@prisma/client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDaysUntilExpiration } from '@/lib/sterilization/qr-code';

interface PackageCardProps {
  pkg: {
    id: string;
    packageNumber: string;
    packageType: PackageType;
    status: PackageStatus;
    sterilizedDate: Date | string;
    expirationDate: Date | string;
    instrumentNames: string[];
    itemCount: number;
    cassetteName?: string | null;
    cycle?: {
      id: string;
      cycleNumber: string;
      cycleType: string;
    };
    _count?: {
      usages: number;
    };
  };
}

const packageTypeLabels: Record<PackageType, string> = {
  CASSETTE_FULL: 'Full Cassette',
  CASSETTE_EXAM: 'Exam Cassette',
  POUCH: 'Pouch',
  WRAPPED: 'Wrapped',
  INDIVIDUAL: 'Individual',
};

const statusVariants: Record<PackageStatus, 'success' | 'warning' | 'error' | 'secondary' | 'info'> = {
  STERILE: 'success',
  USED: 'secondary',
  EXPIRED: 'error',
  COMPROMISED: 'warning',
  RECALLED: 'error',
};

const statusLabels: Record<PackageStatus, string> = {
  STERILE: 'Sterile',
  USED: 'Used',
  EXPIRED: 'Expired',
  COMPROMISED: 'Compromised',
  RECALLED: 'Recalled',
};

export function PackageCard({ pkg }: PackageCardProps) {
  const sterilizedDate = new Date(pkg.sterilizedDate);
  const expirationDate = new Date(pkg.expirationDate);
  const now = new Date();
  const isExpired = expirationDate < now && pkg.status === 'STERILE';
  const daysUntilExpiration = getDaysUntilExpiration(sterilizedDate, 30);
  const isExpiringSoon = daysUntilExpiration > 0 && daysUntilExpiration <= 7 && pkg.status === 'STERILE';

  const displayStatus = isExpired ? 'EXPIRED' : pkg.status;

  return (
    <Link href={`/resources/sterilization/packages/${pkg.id}`}>
      <Card
        variant="bento"
        interactive
        className={isExpiringSoon ? 'border-warning-300' : isExpired ? 'border-error-300' : ''}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
                <Package className="h-4 w-4 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">{pkg.packageNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {packageTypeLabels[pkg.packageType]}
                </p>
              </div>
            </div>
            <Badge variant={statusVariants[displayStatus]} size="sm" dot>
              {statusLabels[displayStatus]}
            </Badge>
          </div>

          {/* Instruments */}
          <div className="text-sm">
            {pkg.cassetteName ? (
              <p className="font-medium">{pkg.cassetteName}</p>
            ) : (
              <p className="text-muted-foreground">
                {pkg.instrumentNames.slice(0, 2).join(', ')}
                {pkg.instrumentNames.length > 2 && ` +${pkg.instrumentNames.length - 2} more`}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{pkg.itemCount} item{pkg.itemCount !== 1 ? 's' : ''}</p>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(sterilizedDate, 'MMM d')}</span>
            </div>
            <div className={`flex items-center gap-1 ${isExpiringSoon ? 'text-warning-600' : isExpired ? 'text-error-600' : ''}`}>
              <Clock className="h-3 w-3" />
              <span>
                {isExpired
                  ? 'Expired'
                  : isExpiringSoon
                    ? `${daysUntilExpiration}d left`
                    : format(expirationDate, 'MMM d')}
              </span>
            </div>
          </div>

          {/* Warning for expiring soon */}
          {isExpiringSoon && (
            <div className="flex items-center gap-1 text-xs text-warning-600">
              <AlertTriangle className="h-3 w-3" />
              <span>Expiring soon</span>
            </div>
          )}

          {/* Cycle info */}
          {pkg.cycle && (
            <div className="text-xs text-muted-foreground border-t pt-2">
              Cycle: {pkg.cycle.cycleNumber}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
