'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Image as ImageIcon,
  FileText,
  CreditCard,
  Clock,
  User,
  Upload,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName, getFakeEmail, getFakePhone, getFakeDOB } from '@/lib/fake-data';
import { format } from 'date-fns';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: patientId } = use(params);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatient = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/patients/${patientId}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch patient');
        }

        setPatient(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [patientId]);

  const calculateAge = (dateOfBirth: string | null): string => {
    if (!dateOfBirth) return '-';
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} years`;
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Patient Details"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Patients', href: '/patients' },
            { label: 'Loading...' },
          ]}
        />
        <PageContent density="comfortable">
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </PageContent>
      </>
    );
  }

  if (error || !patient) {
    return (
      <>
        <PageHeader
          title="Patient Details"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Patients', href: '/patients' },
            { label: 'Error' },
          ]}
        />
        <PageContent density="comfortable">
          <Card variant="ghost">
            <CardContent className="p-8 text-center">
              <p className="text-destructive">{error || 'Patient not found'}</p>
              <Link href="/patients">
                <Button variant="outline" className="mt-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Patients
                </Button>
              </Link>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={
          <PhiProtected fakeData={getFakeName()}>
            {patient.firstName} {patient.lastName}
          </PhiProtected>
        }
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Patients', href: '/patients' },
          { label: `${patient.firstName} ${patient.lastName}` },
        ]}
        actions={
          <Link href="/patients">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        }
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Patient Info Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                {/* Avatar */}
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-10 w-10 text-primary" />
                </div>

                {/* Details */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-semibold">
                      <PhiProtected fakeData={getFakeName()}>
                        {patient.firstName} {patient.lastName}
                      </PhiProtected>
                    </h2>
                    <Badge variant={patient.isActive ? 'success' : 'secondary'}>
                      {patient.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {patient.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <PhiProtected fakeData={getFakeEmail()}>
                            {patient.email}
                          </PhiProtected>
                        </span>
                      </div>
                    )}
                    {patient.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <PhiProtected fakeData={getFakePhone()}>
                            {patient.phone}
                          </PhiProtected>
                        </span>
                      </div>
                    )}
                    {patient.dateOfBirth && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <PhiProtected fakeData={getFakeDOB()}>
                            {format(new Date(patient.dateOfBirth), 'MMM d, yyyy')} ({calculateAge(patient.dateOfBirth)})
                          </PhiProtected>
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Patient since {format(new Date(patient.createdAt), 'MMM yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href={`/patients/${patientId}/images`}>
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors h-full">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                  <ImageIcon className="h-8 w-8 text-primary" />
                  <span className="font-medium">Images</span>
                  <span className="text-xs text-muted-foreground">View gallery</span>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/patients/${patientId}/images/upload`}>
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors h-full">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                  <Upload className="h-8 w-8 text-accent" />
                  <span className="font-medium">Upload</span>
                  <span className="text-xs text-muted-foreground">Add images</span>
                </CardContent>
              </Card>
            </Link>

            <Card className="cursor-not-allowed opacity-50 h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <span className="font-medium">Treatment</span>
                <span className="text-xs text-muted-foreground">Coming soon</span>
              </CardContent>
            </Card>

            <Card className="cursor-not-allowed opacity-50 h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
                <span className="font-medium">Billing</span>
                <span className="text-xs text-muted-foreground">Coming soon</span>
              </CardContent>
            </Card>
          </div>

          {/* Notes placeholder */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm">Patient Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Patient notes and additional details will be displayed here.
                This feature is coming soon.
              </p>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </>
  );
}
