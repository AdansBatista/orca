'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import type { PackageType, PackageStatus } from '@prisma/client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDaysUntilExpiration } from '@/lib/sterilization/qr-code';

interface PackageData {
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
}

interface PackageTableViewProps {
  packages: PackageData[];
  compact?: boolean;
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

export function PackageTableView({ packages, compact = false }: PackageTableViewProps) {
  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="font-semibold">Package #</TableHead>
            <TableHead className="font-semibold">Type</TableHead>
            {!compact && (
              <TableHead className="font-semibold">Contents</TableHead>
            )}
            <TableHead className="font-semibold text-center">Items</TableHead>
            <TableHead className="font-semibold">Sterilized</TableHead>
            <TableHead className="font-semibold">Expires</TableHead>
            {!compact && (
              <TableHead className="font-semibold">Cycle</TableHead>
            )}
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {packages.map((pkg) => {
            const sterilizedDate = new Date(pkg.sterilizedDate);
            const expirationDate = new Date(pkg.expirationDate);
            const now = new Date();
            const isExpired = expirationDate < now && pkg.status === 'STERILE';
            const daysUntilExpiration = getDaysUntilExpiration(sterilizedDate, 30);
            const isExpiringSoon = daysUntilExpiration > 0 && daysUntilExpiration <= 7 && pkg.status === 'STERILE';
            const displayStatus = isExpired ? 'EXPIRED' : pkg.status;

            return (
              <TableRow key={pkg.id} className="group">
                <TableCell className="font-medium">
                  <Link
                    href={`/resources/sterilization/packages/${pkg.id}`}
                    className="hover:text-primary-600 hover:underline"
                  >
                    {pkg.packageNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{packageTypeLabels[pkg.packageType]}</span>
                </TableCell>
                {!compact && (
                  <TableCell>
                    <div className="text-sm max-w-[200px]">
                      {pkg.cassetteName ? (
                        <span className="font-medium">{pkg.cassetteName}</span>
                      ) : (
                        <span className="text-muted-foreground truncate block">
                          {pkg.instrumentNames.slice(0, 2).join(', ')}
                          {pkg.instrumentNames.length > 2 && ` +${pkg.instrumentNames.length - 2}`}
                        </span>
                      )}
                    </div>
                  </TableCell>
                )}
                <TableCell className="text-center">
                  <Badge variant="outline" size="sm">
                    {pkg.itemCount}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{format(sterilizedDate, 'MMM d, yyyy')}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className={`text-sm ${isExpired ? 'text-error-600' : isExpiringSoon ? 'text-warning-600' : ''}`}>
                      {format(expirationDate, 'MMM d, yyyy')}
                    </span>
                    {isExpiringSoon && (
                      <AlertTriangle className="h-3 w-3 text-warning-500" />
                    )}
                  </div>
                </TableCell>
                {!compact && (
                  <TableCell>
                    {pkg.cycle ? (
                      <Link
                        href={`/resources/sterilization/${pkg.cycle.id}`}
                        className="text-sm text-primary-600 hover:underline"
                      >
                        {pkg.cycle.cycleNumber}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant={statusVariants[displayStatus]} size="sm" dot>
                    {statusLabels[displayStatus]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/resources/sterilization/packages/${pkg.id}`}>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// Compact table variant with fewer columns
export function PackageTableViewCompact({ packages }: { packages: PackageData[] }) {
  return <PackageTableView packages={packages} compact />;
}
