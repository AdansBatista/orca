'use client';

import Link from 'next/link';
import type { StaffProfile, Credential, Certification } from '@prisma/client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName, getFakeEmail } from '@/lib/fake-data';

interface StaffCardProps {
  staff: StaffProfile & {
    credentials?: Pick<Credential, 'id' | 'type' | 'name' | 'expirationDate' | 'status'>[];
    certifications?: Pick<Certification, 'id' | 'type' | 'name' | 'expirationDate' | 'status'>[];
  };
}

const statusVariants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'ghost'> = {
  ACTIVE: 'success',
  ON_LEAVE: 'warning',
  TERMINATED: 'error',
  SUSPENDED: 'error',
  PENDING: 'info',
};

const employmentTypeLabels: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  PRN: 'PRN',
  TEMP: 'Temporary',
};

const providerTypeLabels: Record<string, string> = {
  ORTHODONTIST: 'Orthodontist',
  GENERAL_DENTIST: 'General Dentist',
  ORAL_SURGEON: 'Oral Surgeon',
  PERIODONTIST: 'Periodontist',
  ENDODONTIST: 'Endodontist',
  HYGIENIST: 'Hygienist',
  DENTAL_ASSISTANT: 'Dental Assistant',
  EFDA: 'EFDA',
  OTHER: 'Other',
};

export function StaffCard({ staff }: StaffCardProps) {
  const initials = `${staff.firstName[0]}${staff.lastName[0]}`.toUpperCase();
  const fullName = `${staff.firstName} ${staff.lastName}`;

  // Check for expiring credentials (within 90 days)
  const expiringCredentials = staff.credentials?.filter((c) => {
    if (!c.expirationDate) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(c.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
  });

  const expiredCredentials = staff.credentials?.filter((c) => {
    if (!c.expirationDate) return false;
    return new Date(c.expirationDate) < new Date();
  });

  return (
    <Link href={`/staff/${staff.id}`}>
      <Card variant="default" interactive className="h-full">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary-100 text-primary-700 font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground truncate">
                  <PhiProtected fakeData={getFakeName()}>
                    {fullName}
                  </PhiProtected>
                </h3>
                <Badge
                  variant={statusVariants[staff.status] || 'ghost'}
                  size="sm"
                  dot
                >
                  {staff.status.replace('_', ' ')}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {staff.title || (staff.isProvider && staff.providerType
                  ? providerTypeLabels[staff.providerType]
                  : 'Staff Member')}
              </p>

              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span>{employmentTypeLabels[staff.employmentType] || staff.employmentType}</span>
                {staff.department && (
                  <>
                    <span>•</span>
                    <span>{staff.department}</span>
                  </>
                )}
              </div>

              {/* Email */}
              <p className="text-sm text-muted-foreground mt-1 truncate">
                <PhiProtected fakeData={getFakeEmail()}>
                  {staff.email}
                </PhiProtected>
              </p>

              {/* Provider badge */}
              {staff.isProvider && (
                <Badge variant="soft-primary" size="sm" className="mt-2">
                  Provider
                </Badge>
              )}

              {/* Credential alerts */}
              {(expiredCredentials?.length ?? 0) > 0 && (
                <Badge variant="error" size="sm" className="mt-2 ml-1">
                  {expiredCredentials?.length} Expired
                </Badge>
              )}
              {(expiringCredentials?.length ?? 0) > 0 && (
                <Badge variant="warning" size="sm" className="mt-2 ml-1">
                  {expiringCredentials?.length} Expiring Soon
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
