'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  Users,
  Phone,
  Mail,
  ChevronRight,
  Calendar,
} from 'lucide-react';

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
import { ListItem, ListItemTitle, ListItemDescription } from '@/components/ui/list-item';
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
import { format } from 'date-fns';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  source: string;
  status: string;
  stage: string;
  primaryConcern: string | null;
  treatmentInterest: string | null;
  createdAt: string;
  updatedAt: string;
  consultationDate: string | null;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  _count: {
    activities: number;
    tasks: number;
    formSubmissions: number;
  };
}

interface PaginatedResponse {
  items: Lead[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'NEW', label: 'New' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'CONVERTED', label: 'Converted' },
  { value: 'LOST', label: 'Lost' },
];

const stageOptions = [
  { value: '', label: 'All Stages' },
  { value: 'INQUIRY', label: 'Inquiry' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'CONSULTATION_SCHEDULED', label: 'Consultation Scheduled' },
  { value: 'CONSULTATION_COMPLETED', label: 'Consultation Completed' },
  { value: 'PENDING_DECISION', label: 'Pending Decision' },
  { value: 'TREATMENT_ACCEPTED', label: 'Treatment Accepted' },
  { value: 'TREATMENT_STARTED', label: 'Treatment Started' },
  { value: 'LOST', label: 'Lost' },
];

const sourceOptions = [
  { value: '', label: 'All Sources' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'PHONE_CALL', label: 'Phone Call' },
  { value: 'WALK_IN', label: 'Walk-in' },
  { value: 'REFERRAL_DENTIST', label: 'Dentist Referral' },
  { value: 'REFERRAL_PATIENT', label: 'Patient Referral' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media' },
  { value: 'GOOGLE_ADS', label: 'Google Ads' },
  { value: 'INSURANCE_DIRECTORY', label: 'Insurance Directory' },
  { value: 'OTHER', label: 'Other' },
];

const stageBadgeVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info' | 'soft-primary'> = {
  INQUIRY: 'secondary',
  CONTACTED: 'info',
  CONSULTATION_SCHEDULED: 'warning',
  CONSULTATION_COMPLETED: 'soft-primary',
  PENDING_DECISION: 'warning',
  TREATMENT_ACCEPTED: 'success',
  TREATMENT_STARTED: 'success',
  LOST: 'destructive',
};

const stageLabels: Record<string, string> = {
  INQUIRY: 'Inquiry',
  CONTACTED: 'Contacted',
  CONSULTATION_SCHEDULED: 'Scheduled',
  CONSULTATION_COMPLETED: 'Consulted',
  PENDING_DECISION: 'Pending',
  TREATMENT_ACCEPTED: 'Accepted',
  TREATMENT_STARTED: 'Started',
  LOST: 'Lost',
};

const sourceLabels: Record<string, string> = {
  WEBSITE: 'Website',
  PHONE_CALL: 'Phone',
  WALK_IN: 'Walk-in',
  REFERRAL_DENTIST: 'Dentist',
  REFERRAL_PATIENT: 'Patient',
  SOCIAL_MEDIA: 'Social',
  GOOGLE_ADS: 'Google',
  INSURANCE_DIRECTORY: 'Insurance',
  OTHER: 'Other',
};

export function LeadList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [stage, setStage] = useState(searchParams.get('stage') || '');
  const [source, setSource] = useState(searchParams.get('source') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Fetch leads data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (stage) params.set('stage', stage);
      if (source) params.set('source', source);
      params.set('page', String(page));
      params.set('pageSize', '20');

      try {
        const response = await fetch(`/api/leads?${params.toString()}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch leads');
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search, status, stage, source, page]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (stage) params.set('stage', stage);
    if (source) params.set('source', source);
    if (page > 1) params.set('page', String(page));

    const query = params.toString();
    router.replace(query ? `/crm/leads?${query}` : '/crm/leads', { scroll: false });
  }, [search, status, stage, source, page, router]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setStage('');
    setSource('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground">
            Manage prospective patients and track conversions
          </p>
        </div>
        <Link href="/crm/leads/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
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
                placeholder="Search by name, phone, email..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value || 'all'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Stage Filter */}
            <Select value={stage} onValueChange={(v) => { setStage(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                {stageOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value || 'all'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Source Filter */}
            <Select value={source} onValueChange={(v) => { setSource(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                {sourceOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value || 'all'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(search || status || stage || source) && (
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
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No leads found</h3>
            <p className="text-muted-foreground mb-4">
              {search || status || stage || source
                ? 'Try adjusting your filters'
                : 'Get started by adding your first lead'}
            </p>
            <Link href="/crm/leads/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader compact>
            <CardTitle size="sm">
              {data?.total} lead{data?.total !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent compact className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((lead) => (
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
                      {lead.primaryConcern && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {lead.primaryConcern}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        <PhiProtected fakeData={getFakePhone()}>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" /> {lead.phone}
                          </span>
                        </PhiProtected>
                        {lead.email && (
                          <PhiProtected fakeData={getFakeEmail()}>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3 w-3" /> {lead.email}
                            </span>
                          </PhiProtected>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {sourceLabels[lead.source] || lead.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={stageBadgeVariant[lead.stage] || 'default'}>
                        {stageLabels[lead.stage] || lead.stage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {lead.assignedTo ? (
                        <span className="text-sm">
                          {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(lead.createdAt), 'MMM d, yyyy')}
                      </span>
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
