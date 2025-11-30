'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  UserCog,
  MoreHorizontal,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import type { StaffProfile, Credential, Certification, EmergencyContact } from '@prisma/client';

import { PageHeader, PageContent, DashboardGrid } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName, getFakeEmail, getFakePhone, getFakeAddress } from '@/lib/fake-data';
import { CredentialsList, CertificationsList } from '@/components/staff';

type StaffWithRelations = StaffProfile & {
  credentials: Credential[];
  certifications: Certification[];
  emergencyContacts: EmergencyContact[];
};

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

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const staffId = params.id as string;

  const [staff, setStaff] = useState<StaffWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchStaff = useCallback(async () => {
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
  }, [staffId]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete staff');
      }

      router.push('/staff');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Staff Profile"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Staff', href: '/staff' },
            { label: 'Loading...' },
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
          title="Staff Profile"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Staff', href: '/staff' },
            { label: 'Error' },
          ]}
        />
        <PageContent density="comfortable">
          <Card variant="ghost" className="border-error-200 bg-error-50">
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

  const initials = `${staff.firstName[0]}${staff.lastName[0]}`.toUpperCase();
  const fullName = `${staff.firstName} ${staff.lastName}`;
  const address = [staff.address, staff.city, staff.state, staff.postalCode]
    .filter(Boolean)
    .join(', ');

  return (
    <>
      <PageHeader
        title="Staff Profile"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Staff', href: '/staff' },
          { label: fullName },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/staff/${staffId}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Print Profile</DropdownMenuItem>
                <DropdownMenuItem>Export Data</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-2xl bg-primary-100 text-primary-700 font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl font-bold text-foreground">
                      <PhiProtected fakeData={getFakeName()}>
                        {fullName}
                      </PhiProtected>
                    </h2>
                    <Badge
                      variant={statusVariants[staff.status] || 'ghost'}
                      dot
                    >
                      {staff.status.replace('_', ' ')}
                    </Badge>
                    {staff.isProvider && (
                      <Badge variant="soft-primary">Provider</Badge>
                    )}
                  </div>

                  <p className="text-muted-foreground mt-1">
                    {staff.title || (staff.isProvider && staff.providerType
                      ? providerTypeLabels[staff.providerType]
                      : 'Staff Member')}
                    {staff.department && ` • ${staff.department}`}
                  </p>

                  <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4" />
                      <PhiProtected fakeData={getFakeEmail()}>
                        {staff.email}
                      </PhiProtected>
                    </span>
                    {staff.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-4 w-4" />
                        <PhiProtected fakeData={getFakePhone()}>
                          {staff.phone}
                        </PhiProtected>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline">
                      {employmentTypeLabels[staff.employmentType]}
                    </Badge>
                    <Badge variant="outline">
                      #{staff.employeeNumber}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <DashboardGrid>
            {/* Contact Information */}
            <DashboardGrid.Half>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle size="sm">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        <PhiProtected fakeData={getFakeEmail()}>
                          {staff.email}
                        </PhiProtected>
                      </p>
                    </div>
                  </div>

                  {staff.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">
                          <PhiProtected fakeData={getFakePhone()}>
                            {staff.phone}
                          </PhiProtected>
                        </p>
                      </div>
                    </div>
                  )}

                  {staff.mobilePhone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Mobile</p>
                        <p className="text-sm text-muted-foreground">
                          <PhiProtected fakeData={getFakePhone()}>
                            {staff.mobilePhone}
                          </PhiProtected>
                        </p>
                      </div>
                    </div>
                  )}

                  {address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Address</p>
                        <p className="text-sm text-muted-foreground">
                          <PhiProtected fakeData={getFakeAddress()}>
                            {address}
                          </PhiProtected>
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </DashboardGrid.Half>

            {/* Employment Information */}
            <DashboardGrid.Half>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle size="sm">Employment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Hire Date</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(staff.hireDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building2 className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Employment Type</p>
                      <p className="text-sm text-muted-foreground">
                        {employmentTypeLabels[staff.employmentType]}
                      </p>
                    </div>
                  </div>

                  {staff.department && (
                    <div className="flex items-start gap-3">
                      <Building2 className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Department</p>
                        <p className="text-sm text-muted-foreground">{staff.department}</p>
                      </div>
                    </div>
                  )}

                  {staff.isProvider && staff.providerType && (
                    <div className="flex items-start gap-3">
                      <UserCog className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Provider Type</p>
                        <p className="text-sm text-muted-foreground">
                          {providerTypeLabels[staff.providerType]}
                        </p>
                      </div>
                    </div>
                  )}

                  {staff.npiNumber && (
                    <div className="flex items-start gap-3">
                      <UserCog className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">NPI Number</p>
                        <p className="text-sm text-muted-foreground">{staff.npiNumber}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </DashboardGrid.Half>

            {/* Credentials */}
            <DashboardGrid.Half>
              <CredentialsList
                staffProfileId={staff.id}
                credentials={staff.credentials}
                canEdit={true}
                onUpdate={fetchStaff}
              />
            </DashboardGrid.Half>

            {/* Certifications */}
            <DashboardGrid.Half>
              <CertificationsList
                staffProfileId={staff.id}
                certifications={staff.certifications}
                canEdit={true}
                onUpdate={fetchStaff}
              />
            </DashboardGrid.Half>

            {/* Emergency Contacts */}
            <DashboardGrid.FullWidth>
              <Card>
                <CardHeader>
                  <CardTitle size="sm">Emergency Contacts</CardTitle>
                </CardHeader>
                <CardContent>
                  {staff.emergencyContacts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No emergency contacts on file
                    </p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {staff.emergencyContacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                <PhiProtected fakeData={getFakeName()}>
                                  {contact.name}
                                </PhiProtected>
                              </span>
                              {contact.isPrimary && (
                                <Badge variant="soft-primary" size="sm">Primary</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {contact.relationship}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              <PhiProtected fakeData={getFakePhone()}>
                                {contact.phone}
                              </PhiProtected>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </DashboardGrid.FullWidth>

            {/* Notes */}
            {staff.notes && (
              <DashboardGrid.FullWidth>
                <Card>
                  <CardHeader>
                    <CardTitle size="sm">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {staff.notes}
                    </p>
                  </CardContent>
                </Card>
              </DashboardGrid.FullWidth>
            )}
          </DashboardGrid>
        </div>
      </PageContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this staff member? This action will soft-delete the
              record, which can be restored by an administrator if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
