'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ClipboardList,
  Plus,
  Search,
  Calendar,
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

interface ProcedureRecord {
  id: string;
  procedureCode: string;
  procedureName: string;
  description: string | null;
  toothNumbers: number[];
  quadrant: string | null;
  arch: string | null;
  performedAt: string;
  duration: number | null;
  status: string;
  notes: string | null;
  progressNote: {
    id: string;
    noteDate: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  performedBy: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  };
}

const statusLabels: Record<string, string> = {
  PLANNED: 'Planned',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DEFERRED: 'Deferred',
};

const statusVariants: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'secondary'> = {
  PLANNED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'secondary',
  DEFERRED: 'secondary',
};

function ProceduresListPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [procedures, setProcedures] = useState<ProcedureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');

  const fetchProcedures = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status && status !== 'all') params.set('status', status);
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());
      params.set('sortBy', 'performedAt');
      params.set('sortOrder', 'desc');

      const res = await fetch(`/api/procedures?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setProcedures(data.data.items);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Error fetching procedures:', error);
    } finally {
      setLoading(false);
    }
  }, [search, status, page, pageSize]);

  useEffect(() => {
    fetchProcedures();
  }, [fetchProcedures]);

  const totalPages = Math.ceil(total / pageSize);

  const formatTeeth = (teeth: number[]) => {
    if (teeth.length === 0) return 'N/A';
    return teeth.sort((a, b) => a - b).join(', ');
  };

  return (
    <>
      <PageHeader
        title="Procedure Records"
        description="ADA procedure documentation"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Documentation', href: '/treatment/documentation' },
          { label: 'Procedures' },
        ]}
        actions={
          <Button onClick={() => router.push('/treatment/documentation/notes/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Progress Note
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
                    placeholder="Search by code, name, or patient..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
              </div>
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
            ) : procedures.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No procedure records found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Procedures are documented within progress notes
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push('/treatment/documentation/notes/new')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Progress Note
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {procedures.map((procedure) => (
                  <ListItem
                    key={procedure.id}
                    showArrow
                    className="px-4"
                    onClick={() => router.push(`/treatment/documentation/notes/${procedure.progressNote.id}`)}
                    leading={
                      <div className="p-2 rounded-lg bg-muted">
                        <ClipboardList className="h-5 w-5 text-primary" />
                      </div>
                    }
                    trailing={
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={statusVariants[procedure.status] || 'secondary'}>
                          {statusLabels[procedure.status] || procedure.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {procedure.procedureCode}
                        </span>
                      </div>
                    }
                  >
                    <ListItemTitle>
                      {procedure.procedureName}
                    </ListItemTitle>
                    <ListItemDescription>
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <PhiProtected fakeData={getFakeName()}>
                          {procedure.progressNote.patient.firstName} {procedure.progressNote.patient.lastName}
                        </PhiProtected>
                        {procedure.toothNumbers.length > 0 && (
                          <span>Teeth: {formatTeeth(procedure.toothNumbers)}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(procedure.performedAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {procedure.performedBy.title ? `${procedure.performedBy.title} ` : 'Dr. '}
                          {procedure.performedBy.lastName}
                        </span>
                        {procedure.duration && (
                          <span className="text-muted-foreground">{procedure.duration} min</span>
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

function ProceduresListPageLoading() {
  return (
    <>
      <PageHeader
        title="Procedure Records"
        description="ADA procedure documentation"
        compact
      />
      <PageContent>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
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

export default function ProceduresListPage() {
  return (
    <Suspense fallback={<ProceduresListPageLoading />}>
      <ProceduresListPageContent />
    </Suspense>
  );
}
