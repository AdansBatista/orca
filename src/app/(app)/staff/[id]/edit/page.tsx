'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import type { StaffProfile } from '@prisma/client';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StaffProfileForm } from '@/components/staff';

function LoadingSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function EditStaffPage() {
  const params = useParams();
  const staffId = params.id as string;

  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await fetch(`/api/staff/${staffId}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch staff');
        }

        setStaff(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [staffId]);

  if (loading) {
    return (
      <>
        <PageHeader
          title="Edit Staff"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Staff', href: '/staff' },
            { label: 'Loading...' },
            { label: 'Edit' },
          ]}
        />
        <PageContent density="comfortable">
          <LoadingSkeleton />
        </PageContent>
      </>
    );
  }

  if (error || !staff) {
    return (
      <>
        <PageHeader
          title="Edit Staff"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Staff', href: '/staff' },
            { label: 'Error' },
          ]}
        />
        <PageContent density="comfortable">
          <Card variant="ghost" className="border-error-200 bg-error-50 max-w-4xl">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-error-600 mb-4" />
              <h3 className="font-semibold text-error-900 mb-2">Failed to load staff profile</h3>
              <p className="text-error-700 mb-4">{error || 'Staff member not found'}</p>
              <div className="flex justify-center gap-3">
                <Link href="/staff">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Staff
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

  const fullName = `${staff.firstName} ${staff.lastName}`;

  return (
    <>
      <PageHeader
        title={`Edit ${fullName}`}
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Staff', href: '/staff' },
          { label: fullName, href: `/staff/${staffId}` },
          { label: 'Edit' },
        ]}
      />
      <PageContent density="comfortable" className="max-w-4xl">
        <StaffProfileForm
          mode="edit"
          staffId={staffId}
          initialData={{
            employeeNumber: staff.employeeNumber,
            firstName: staff.firstName,
            lastName: staff.lastName,
            middleName: staff.middleName || undefined,
            preferredName: staff.preferredName || undefined,
            email: staff.email,
            phone: staff.phone || undefined,
            mobilePhone: staff.mobilePhone || undefined,
            dateOfBirth: staff.dateOfBirth || undefined,
            address: staff.address || undefined,
            city: staff.city || undefined,
            state: staff.state || undefined,
            postalCode: staff.postalCode || undefined,
            country: staff.country,
            employmentType: staff.employmentType as 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'PRN' | 'TEMP',
            status: staff.status as 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'SUSPENDED' | 'PENDING',
            hireDate: staff.hireDate,
            department: staff.department || undefined,
            title: staff.title || undefined,
            isProvider: staff.isProvider,
            providerType: staff.providerType as 'ORTHODONTIST' | 'GENERAL_DENTIST' | 'ORAL_SURGEON' | 'PERIODONTIST' | 'ENDODONTIST' | 'HYGIENIST' | 'DENTAL_ASSISTANT' | 'EFDA' | 'OTHER' | undefined,
            npiNumber: staff.npiNumber || undefined,
            deaNumber: staff.deaNumber || undefined,
            stateLicenseNumber: staff.stateLicenseNumber || undefined,
            notes: staff.notes || undefined,
          }}
        />
      </PageContent>
    </>
  );
}
