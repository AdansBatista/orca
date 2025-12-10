'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  Building2,
  Phone,
  Mail,
  ChevronRight,
  MapPin,
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
  city: string | null;
  state: string | null;
  status: string;
  totalReferrals: number;
  referralsThisYear: number;
  lastReferralDate: string | null;
  createdAt: string;
}

interface PaginatedResponse {
  items: ReferringProvider[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'PREFERRED', label: 'Preferred' },
];

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'GENERAL_DENTIST', label: 'General Dentist' },
  { value: 'PEDIATRIC_DENTIST', label: 'Pediatric Dentist' },
  { value: 'ORAL_SURGEON', label: 'Oral Surgeon' },
  { value: 'PERIODONTIST', label: 'Periodontist' },
  { value: 'ENDODONTIST', label: 'Endodontist' },
  { value: 'PROSTHODONTIST', label: 'Prosthodontist' },
  { value: 'OTHER', label: 'Other' },
];

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

export function ReferrersList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Fetch referrers data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (type) params.set('type', type);
      params.set('page', String(page));
      params.set('pageSize', '20');

      try {
        const response = await fetch(`/api/referrers?${params.toString()}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch referrers');
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search, status, type, page]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (type) params.set('type', type);
    if (page > 1) params.set('page', String(page));

    const query = params.toString();
    router.replace(query ? `/crm/referrers?${query}` : '/crm/referrers', { scroll: false });
  }, [search, status, type, page, router]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setType('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-end">
        <Link href="/crm/referrers/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Referrer
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
                placeholder="Search by name, practice..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Type Filter */}
            <Select value={type} onValueChange={(v) => { setType(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value || 'all'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
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

            {/* Clear Filters */}
            {(search || status || type) && (
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
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No referrers found</h3>
            <p className="text-muted-foreground mb-4">
              {search || status || type
                ? 'Try adjusting your filters'
                : 'Get started by adding your first referring provider'}
            </p>
            <Link href="/crm/referrers/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Referrer
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader compact>
            <CardTitle size="sm">
              {data?.total} referrer{data?.total !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent compact className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Practice</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Referrals</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((referrer) => (
                  <TableRow
                    key={referrer.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/crm/referrers/${referrer.id}`)}
                  >
                    <TableCell>
                      <PhiProtected fakeData={getFakeName()}>
                        <div>
                          <span className="font-medium">
                            Dr. {referrer.firstName} {referrer.lastName}
                          </span>
                          {referrer.credentials && (
                            <span className="text-muted-foreground">, {referrer.credentials}</span>
                          )}
                        </div>
                      </PhiProtected>
                      <p className="text-xs text-muted-foreground">
                        {typeLabels[referrer.type] || referrer.type}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{referrer.practiceName}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        {referrer.phone && (
                          <PhiProtected fakeData={getFakePhone()}>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3 w-3" /> {referrer.phone}
                            </span>
                          </PhiProtected>
                        )}
                        {referrer.email && (
                          <PhiProtected fakeData={getFakeEmail()}>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3 w-3" /> {referrer.email}
                            </span>
                          </PhiProtected>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {referrer.city && referrer.state ? (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {referrer.city}, {referrer.state}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">{referrer.totalReferrals} total</p>
                        <p className="text-xs text-muted-foreground">
                          {referrer.referralsThisYear} this year
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[referrer.status] || 'secondary'}>
                        {referrer.status}
                      </Badge>
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
