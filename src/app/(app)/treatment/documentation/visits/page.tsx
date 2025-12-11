'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ClipboardList,
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ListItem, ListItemTitle, ListItemDescription } from '@/components/ui/list-item';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';
import { Pagination } from '@/components/ui/pagination';

interface VisitRecord {
  id: string;
  visitDate: string;
  visitType: string;
  status: string;
  chiefComplaint: string | null;
  visitSummary: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  treatmentDuration: number | null;
  completedAt: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  primaryProvider: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  };
  treatmentPlan: {
    id: string;
    planNumber: string;
  } | null;
  _count?: {
    procedures: number;
    findings: number;
    measurements: number;
  };
}

const visitTypeLabels: Record<string, string> = {
  INITIAL_EXAM: 'Initial Exam',
  PROGRESS: 'Progress',
  ADJUSTMENT: 'Adjustment',
  EMERGENCY: 'Emergency',
  CONSULTATION: 'Consultation',
  RECORDS: 'Records',
  DEBOND: 'Debond',
  RETENTION: 'Retention',
  OTHER: 'Other',
};

const statusLabels: Record<string, string> = {
  IN_PROGRESS: 'In Progress',
  COMPLETE: 'Complete',
  INCOMPLETE: 'Incomplete',
  CANCELLED: 'Cancelled',
};

const statusVariants: Record<string, 'warning' | 'success' | 'secondary' | 'destructive'> = {
  IN_PROGRESS: 'warning',
  COMPLETE: 'success',
  INCOMPLETE: 'secondary',
  CANCELLED: 'destructive',
};

const statusIcons: Record<string, React.ReactNode> = {
  IN_PROGRESS: <Clock className="h-4 w-4" />,
  COMPLETE: <CheckCircle className="h-4 w-4" />,
  INCOMPLETE: <AlertCircle className="h-4 w-4" />,
  CANCELLED: <XCircle className="h-4 w-4" />,
};

function VisitRecordsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [visitType, setVisitType] = useState(searchParams.get('visitType') || 'all');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (visitType && visitType !== 'all') params.set('visitType', visitType);
      if (status && status !== 'all') params.set('status', status);
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());
      params.set('sortBy', 'visitDate');
      params.set('sortOrder', 'desc');

      const res = await fetch(`/api/visit-records?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setVisits(data.data.items);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setLoading(false);
    }
  }, [search, visitType, status, page, pageSize]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const totalPages = Math.ceil(total / pageSize);

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <PageHeader
        title="Visit Records"
        description="View and manage patient visit documentation"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Documentation', href: '/treatment/documentation' },
          { label: 'Visits' },
        ]}
        actions={
          <Button onClick={() => router.push('/treatment/documentation/notes/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Visit
          </Button>
        }
      />

      <PageContent>
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by patient name..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={visitType} onValueChange={(value) => { setVisitType(value); setPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Visit Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(visitTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : visits.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No visit records found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Visit records are created when documenting patient visits
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push('/treatment/documentation/notes/new')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Visit
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {visits.map((visit) => (
                  <ListItem
                    key={visit.id}
                    showArrow
                    className="px-4"
                    onClick={() => router.push(`/treatment/documentation/visits/${visit.id}`)}
                    leading={
                      <div className={`p-2 rounded-lg ${
                        visit.status === 'COMPLETE' ? 'bg-success-100' :
                        visit.status === 'IN_PROGRESS' ? 'bg-warning-100' :
                        visit.status === 'CANCELLED' ? 'bg-destructive-100' :
                        'bg-muted'
                      }`}>
                        {statusIcons[visit.status] || <ClipboardList className="h-5 w-5" />}
                      </div>
                    }
                    trailing={
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={statusVariants[visit.status] || 'secondary'}>
                          {statusLabels[visit.status] || visit.status}
                        </Badge>
                        {visit.treatmentDuration && (
                          <span className="text-xs text-muted-foreground">
                            {formatDuration(visit.treatmentDuration)}
                          </span>
                        )}
                      </div>
                    }
                  >
                    <ListItemTitle>
                      <span className="flex items-center gap-2">
                        <PhiProtected fakeData={getFakeName()}>
                          {visit.patient.firstName} {visit.patient.lastName}
                        </PhiProtected>
                        <Badge variant="outline">
                          {visitTypeLabels[visit.visitType] || visit.visitType}
                        </Badge>
                      </span>
                    </ListItemTitle>
                    <ListItemDescription>
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(visit.visitDate).toLocaleDateString()}
                        </span>
                        {visit.checkInTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(visit.checkInTime)}
                            {visit.checkOutTime && ` - ${formatTime(visit.checkOutTime)}`}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <PhiProtected fakeData={getFakeName()}>
                            {visit.primaryProvider.title ? `${visit.primaryProvider.title} ` : ''}
                            {visit.primaryProvider.lastName}
                          </PhiProtected>
                        </span>
                        {visit.treatmentPlan && (
                          <span className="text-muted-foreground">
                            Plan: {visit.treatmentPlan.planNumber}
                          </span>
                        )}
                        {visit._count && (
                          <span className="text-muted-foreground">
                            {visit._count.procedures > 0 && `${visit._count.procedures} proc`}
                            {visit._count.findings > 0 && ` · ${visit._count.findings} findings`}
                            {visit._count.measurements > 0 && ` · ${visit._count.measurements} meas`}
                          </span>
                        )}
                      </span>
                    </ListItemDescription>
                  </ListItem>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </PageContent>
    </>
  );
}

function VisitRecordsPageLoading() {
  return (
    <>
      <PageHeader
        title="Visit Records"
        description="View and manage patient visit documentation"
        compact
      />
      <PageContent>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-[160px]" />
              <Skeleton className="h-10 w-[150px]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-72" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </PageContent>
    </>
  );
}

export default function VisitRecordsPage() {
  return (
    <Suspense fallback={<VisitRecordsPageLoading />}>
      <VisitRecordsPageContent />
    </Suspense>
  );
}
