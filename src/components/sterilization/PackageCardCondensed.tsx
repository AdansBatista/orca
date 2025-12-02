'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Package, Calendar, Clock, AlertTriangle } from 'lucide-react';
import type { PackageType, PackageStatus } from '@prisma/client';

import { Badge } from '@/components/ui/badge';
import { ListItem, ListItemTitle, ListItemDescription } from '@/components/ui/list-item';
import { getDaysUntilExpiration } from '@/lib/sterilization/qr-code';

interface PackageCardCondensedProps {
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

export function PackageCardCondensed({ pkg }: PackageCardCondensedProps) {
  const sterilizedDate = new Date(pkg.sterilizedDate);
  const expirationDate = new Date(pkg.expirationDate);
  const now = new Date();
  const isExpired = expirationDate < now && pkg.status === 'STERILE';
  const daysUntilExpiration = getDaysUntilExpiration(sterilizedDate, 30);
  const isExpiringSoon = daysUntilExpiration > 0 && daysUntilExpiration <= 7 && pkg.status === 'STERILE';

  const displayStatus = isExpired ? 'EXPIRED' : pkg.status;

  return (
    <Link href={`/resources/sterilization/packages/${pkg.id}`}>
      <ListItem
        variant="bordered"
        size="sm"
        showArrow
        className={isExpiringSoon ? 'border-warning-300' : isExpired ? 'border-error-300' : ''}
        leading={
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
            <Package className="h-4 w-4 text-primary-600" />
          </div>
        }
        trailing={
          <div className="flex items-center gap-3">
            {isExpiringSoon && (
              <div className="hidden sm:flex items-center gap-1 text-xs text-warning-600">
                <AlertTriangle className="h-3 w-3" />
                <span>{daysUntilExpiration}d</span>
              </div>
            )}
            <Badge variant={statusVariants[displayStatus]} size="sm" dot>
              {statusLabels[displayStatus]}
            </Badge>
          </div>
        }
      >
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <ListItemTitle>{pkg.packageNumber}</ListItemTitle>
            <ListItemDescription>
              {packageTypeLabels[pkg.packageType]}
              {pkg.cassetteName && ` - ${pkg.cassetteName}`}
              {' '}&bull;{' '}{pkg.itemCount} item{pkg.itemCount !== 1 ? 's' : ''}
            </ListItemDescription>
          </div>
          <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(sterilizedDate, 'MMM d')}</span>
            </div>
            <div className={`flex items-center gap-1 ${isExpiringSoon ? 'text-warning-600' : isExpired ? 'text-error-600' : ''}`}>
              <Clock className="h-3 w-3" />
              <span>{format(expirationDate, 'MMM d')}</span>
            </div>
          </div>
        </div>
      </ListItem>
    </Link>
  );
}
