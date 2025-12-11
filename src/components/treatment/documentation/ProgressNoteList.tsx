'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface ProgressNote {
  id: string;
  noteDate: string;
  noteType: string;
  status: string;
  chiefComplaint: string | null;
  createdAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  };
  treatmentPlan?: {
    id: string;
    planNumber: string;
    planName: string;
  } | null;
  _count: {
    procedures: number;
    findings: number;
  };
}

interface PaginatedResponse {
  items: ProgressNote[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const noteTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'INITIAL_EXAM', label: 'Initial Exam' },
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'RECORDS_APPOINTMENT', label: 'Records' },
  { value: 'BONDING', label: 'Bonding' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'DEBOND', label: 'Debond' },
  { value: 'RETENTION_CHECK', label: 'Retention Check' },
  { value: 'OBSERVATION', label: 'Observation' },
  { value: 'GENERAL', label: 'General' },
];

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_SIGNATURE', label: 'Pending Signature' },
  { value: 'SIGNED', label: 'Signed' },
  { value: 'PENDING_COSIGN', label: 'Pending Co-sign' },
  { value: 'COSIGNED', label: 'Co-signed' },
  { value: 'AMENDED', label: 'Amended' },
];

const noteTypeLabels: Record<string, string> = {
  INITIAL_EXAM: 'Initial Exam',
  CONSULTATION: 'Consultation',
  RECORDS_APPOINTMENT: 'Records',
  BONDING: 'Bonding',
  ADJUSTMENT: 'Adjustment',
  EMERGENCY: 'Emergency',
  DEBOND: 'Debond',
  RETENTION_CHECK: 'Retention Check',
  OBSERVATION: 'Observation',
  GENERAL: 'General',
};

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'info'> = {
  DRAFT: 'secondary',
  PENDING_SIGNATURE: 'warning',
  SIGNED: 'success',
  PENDING_COSIGN: 'info',
  COSIGNED: 'success',
  AMENDED: 'default',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_SIGNATURE: 'Pending Signature',
  SIGNED: 'Signed',
  PENDING_COSIGN: 'Pending Co-sign',
  COSIGNED: 'Co-signed',
  AMENDED: 'Amended',
};

export function ProgressNoteList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [noteType, setNoteType] = useState(searchParams.get('noteType') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Fetch progress notes data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (noteType) params.set('noteType', noteType);
      if (status) params.set('status', status);
      params.set('page', String(page));
      params.set('pageSize', '20');

      try {
        const response = await fetch(`/api/progress-notes?${params.toString()}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch progress notes');
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search, noteType, status, page]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (noteType) params.set('noteType', noteType);
    if (status) params.set('status', status);
    if (page > 1) params.set('page', String(page));

    const query = params.toString();
    router.replace(query ? `/treatment/documentation/notes?${query}` : '/treatment/documentation/notes', { scroll: false });
  }, [search, noteType, status, page, router]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setNoteType('');
    setStatus('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Progress Notes</h1>
          <p className="text-muted-foreground">
            Clinical documentation in SOAP format
          </p>
        </div>
        <Link href="/treatment/documentation/notes/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card variant="ghost">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Note Type Filter */}
            <Select value={noteType} onValueChange={(v) => { setNoteType(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Note Type" />
              </SelectTrigger>
              <SelectContent>
                {noteTypeOptions.map((opt) => (
                  <SelectItem key={opt.value || 'all'} value={opt.value || 'all'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value || 'all'} value={opt.value || 'all'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(search || noteType || status) && (
              <Button variant="ghost" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>{error}</p>
          </CardContent>
        </Card>
      ) : data?.items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No progress notes found</h3>
            <p className="text-muted-foreground mb-4">
              {search || noteType || status
                ? 'Try adjusting your filters'
                : 'Get started by creating your first progress note'}
            </p>
            <Link href="/treatment/documentation/notes/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Progress Note
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader compact>
            <CardTitle size="sm">
              {data?.total} progress note{data?.total !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent compact className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((note) => (
                  <TableRow
                    key={note.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/treatment/documentation/notes/${note.id}`)}
                  >
                    <TableCell>
                      <span className="font-medium">
                        {format(new Date(note.noteDate), 'MMM d, yyyy')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <PhiProtected fakeData={getFakeName()}>
                        <span className="font-medium">
                          {note.patient.firstName} {note.patient.lastName}
                        </span>
                      </PhiProtected>
                      {note.chiefComplaint && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {note.chiefComplaint}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {noteTypeLabels[note.noteType] || note.noteType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        Dr. {note.provider.firstName} {note.provider.lastName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[note.status] || 'secondary'}>
                        {statusLabels[note.status] || note.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {note._count.procedures > 0 && (
                          <span>{note._count.procedures} proc</span>
                        )}
                        {note._count.findings > 0 && (
                          <span>{note._count.findings} find</span>
                        )}
                        {note._count.procedures === 0 && note._count.findings === 0 && (
                          <span>—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of {data.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === data.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
