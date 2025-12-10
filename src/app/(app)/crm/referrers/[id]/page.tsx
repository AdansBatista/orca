'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  Mail,
  Printer,
  MapPin,
  Edit,
  MoreVertical,
  Send,
  Users,
  Calendar,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';

import { PageHeader, PageContent, DashboardGrid } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName, getFakeEmail, getFakePhone } from '@/lib/fake-data';

interface ReferringProvider {
  id: string;
  type: string;
  practiceName: string;
  firstName: string;
  lastName: string;
  credentials: string | null;
  email: string | null;
  phone: string | null;
  fax: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  status: string;
  notes: string | null;
  totalReferrals: number;
  referralsThisYear: number;
  lastReferralDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ReferralLead {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  stage: string;
  createdAt: string;
  convertedAt: string | null;
}

const typeLabels: Record<string, string> = {
  GENERAL_DENTIST: 'General Dentist',
  PEDIATRIC_DENTIST: 'Pediatric Dentist',
  ORAL_SURGEON: 'Oral Surgeon',
  PERIODONTIST: 'Periodontist',
  ENDODONTIST: 'Endodontist',
  PROSTHODONTIST: 'Prosthodontist',
  OTHER: 'Other',
};

const statusBadgeVariant: Record<string, 'default' | 'success' | 'secondary' | 'destructive'> = {
  ACTIVE: 'success',
  INACTIVE: 'secondary',
  PREFERRED: 'default',
};

const stageBadgeVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
  INQUIRY: 'secondary',
  CONTACTED: 'info',
  CONSULTATION_SCHEDULED: 'warning',
  CONSULTATION_COMPLETED: 'default',
  PENDING_DECISION: 'warning',
  TREATMENT_ACCEPTED: 'success',
  TREATMENT_STARTED: 'success',
  LOST: 'destructive',
};

export default function ReferrerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [referrer, setReferrer] = useState<ReferringProvider | null>(null);
  const [referrals, setReferrals] = useState<ReferralLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReferrer = async () => {
      setLoading(true);
      setError(null);

      try {
        const [referrerRes, referralsRes] = await Promise.all([
          fetch(`/api/referrers/${resolvedParams.id}`),
          fetch(`/api/referrers/${resolvedParams.id}/referrals`),
        ]);

        const referrerResult = await referrerRes.json();
        const referralsResult = await referralsRes.json();

        if (!referrerResult.success) {
          throw new Error(referrerResult.error?.message || 'Failed to fetch referrer');
        }

        setReferrer(referrerResult.data);
        if (referralsResult.success) {
          setReferrals(referralsResult.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchReferrer();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <>
        <PageHeader
          title="Loading..."
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'CRM', href: '/crm' },
            { label: 'Referrers', href: '/crm/referrers' },
            { label: '...' },
          ]}
        />
        <PageContent density="comfortable">
          <div className="space-y-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-64" />
          </div>
        </PageContent>
      </>
    );
  }

  if (error || !referrer) {
    return (
      <>
        <PageHeader
          title="Referrer Not Found"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'CRM', href: '/crm' },
            { label: 'Referrers', href: '/crm/referrers' },
            { label: 'Error' },
          ]}
        />
        <PageContent density="comfortable">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">{error || 'Referrer not found'}</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push('/crm/referrers')}>
                Back to Referrers
              </Button>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  const conversionRate = referrals.length > 0
    ? Math.round((referrals.filter((r) => r.status === 'CONVERTED').length / referrals.length) * 100)
    : 0;

  return (
    <>
      <PageHeader
        title={referrer.practiceName}
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'CRM', href: '/crm' },
          { label: 'Referrers', href: '/crm/referrers' },
          { label: referrer.practiceName },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button variant="outline">
              <Send className="h-4 w-4 mr-2" />
              Send Letter
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Provider
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  Deactivate Provider
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />
      <PageContent density="comfortable">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard accentColor="primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Referrals</p>
                <p className="text-2xl font-bold">{referrer.totalReferrals}</p>
              </div>
              <Users className="h-8 w-8 text-primary-500" />
            </div>
          </StatCard>
          <StatCard accentColor="accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">This Year</p>
                <p className="text-2xl font-bold">{referrer.referralsThisYear}</p>
              </div>
              <Calendar className="h-8 w-8 text-accent-500" />
            </div>
          </StatCard>
          <StatCard accentColor="success">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{conversionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success-500" />
            </div>
          </StatCard>
          <StatCard accentColor="warning">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Last Referral</p>
                <p className="text-lg font-bold">
                  {referrer.lastReferralDate
                    ? format(new Date(referrer.lastReferralDate), 'MMM d')
                    : 'Never'}
                </p>
              </div>
              <FileText className="h-8 w-8 text-warning-500" />
            </div>
          </StatCard>
        </div>

        <DashboardGrid>
          <DashboardGrid.TwoThirds>
            {/* Referral History */}
            <Card>
              <CardHeader compact>
                <CardTitle size="sm">Referral History</CardTitle>
                <CardDescription>All patients referred by this provider</CardDescription>
              </CardHeader>
              <CardContent compact className="p-0">
                {referrals.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No referrals yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Referred</TableHead>
                        <TableHead>Converted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referrals.map((lead) => (
                        <TableRow
                          key={lead.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => router.push(`/crm/leads/${lead.id}`)}
                        >
                          <TableCell>
                            <PhiProtected fakeData={getFakeName()}>
                              <span className="font-medium">
                                {lead.firstName} {lead.lastName}
                              </span>
                            </PhiProtected>
                          </TableCell>
                          <TableCell>
                            <Badge variant={stageBadgeVariant[lead.stage] || 'secondary'}>
                              {lead.stage.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(lead.createdAt), 'MMM d, yyyy')}
                            </span>
                          </TableCell>
                          <TableCell>
                            {lead.convertedAt ? (
                              <span className="text-sm text-success-600">
                                {format(new Date(lead.convertedAt), 'MMM d, yyyy')}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </DashboardGrid.TwoThirds>

          <DashboardGrid.OneThird>
            {/* Provider Info */}
            <Card>
              <CardHeader compact>
                <div className="flex items-center justify-between">
                  <CardTitle size="sm">Provider Details</CardTitle>
                  <Badge variant={statusBadgeVariant[referrer.status] || 'secondary'}>
                    {referrer.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent compact className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Provider</p>
                  <PhiProtected fakeData={getFakeName()}>
                    <p className="font-medium">
                      Dr. {referrer.firstName} {referrer.lastName}
                      {referrer.credentials && `, ${referrer.credentials}`}
                    </p>
                  </PhiProtected>
                  <p className="text-sm text-muted-foreground">
                    {typeLabels[referrer.type] || referrer.type}
                  </p>
                </div>

                {referrer.phone && (
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <PhiProtected fakeData={getFakePhone()}>
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {referrer.phone}
                      </p>
                    </PhiProtected>
                  </div>
                )}

                {referrer.fax && (
                  <div>
                    <p className="text-xs text-muted-foreground">Fax</p>
                    <PhiProtected fakeData={getFakePhone()}>
                      <p className="flex items-center gap-2">
                        <Printer className="h-4 w-4 text-muted-foreground" />
                        {referrer.fax}
                      </p>
                    </PhiProtected>
                  </div>
                )}

                {referrer.email && (
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <PhiProtected fakeData={getFakeEmail()}>
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {referrer.email}
                      </p>
                    </PhiProtected>
                  </div>
                )}

                {(referrer.address || referrer.city) && (
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        {referrer.address && <p>{referrer.address}</p>}
                        {referrer.city && (
                          <p>
                            {referrer.city}
                            {referrer.state && `, ${referrer.state}`}
                            {referrer.zipCode && ` ${referrer.zipCode}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {referrer.notes && (
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm">Notes</CardTitle>
                </CardHeader>
                <CardContent compact>
                  <p className="text-sm text-muted-foreground">{referrer.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card variant="ghost">
              <CardHeader compact>
                <CardTitle size="sm">Timeline</CardTitle>
              </CardHeader>
              <CardContent compact className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Added</span>
                  <span>{format(new Date(referrer.createdAt), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{format(new Date(referrer.updatedAt), 'MMM d, yyyy')}</span>
                </div>
              </CardContent>
            </Card>
          </DashboardGrid.OneThird>
        </DashboardGrid>
      </PageContent>
    </>
  );
}
