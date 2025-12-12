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
  Globe,
  Package,
  ExternalLink,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface LabVendor {
  id: string;
  name: string;
  code: string;
  status: string;
  primaryEmail: string | null;
  primaryPhone: string | null;
  website: string | null;
  capabilities: string[];
  _count: {
    orders: number;
    products: number;
    contracts: number;
  };
  contacts: Array<{
    name: string;
    isPrimary: boolean;
  }>;
}

interface PaginatedResponse {
  items: LabVendor[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'PENDING', label: 'Pending' },
];

const capabilityOptions = [
  { value: '', label: 'All Categories' },
  { value: 'RETAINER', label: 'Retainers' },
  { value: 'APPLIANCE', label: 'Appliances' },
  { value: 'ALIGNER', label: 'Aligners' },
  { value: 'INDIRECT_BONDING', label: 'Indirect Bonding' },
  { value: 'ARCHWIRE', label: 'Archwires' },
  { value: 'MODEL', label: 'Models' },
  { value: 'SURGICAL', label: 'Surgical' },
  { value: 'OTHER', label: 'Other' },
];

const statusBadgeVariant: Record<string, 'success' | 'secondary' | 'destructive' | 'warning'> = {
  ACTIVE: 'success',
  INACTIVE: 'secondary',
  SUSPENDED: 'destructive',
  PENDING: 'warning',
};

const capabilityLabels: Record<string, string> = {
  RETAINER: 'Retainers',
  APPLIANCE: 'Appliances',
  ALIGNER: 'Aligners',
  INDIRECT_BONDING: 'Bonding',
  ARCHWIRE: 'Archwires',
  MODEL: 'Models',
  SURGICAL: 'Surgical',
  OTHER: 'Other',
};

export function VendorsList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [capability, setCapability] = useState(searchParams.get('hasCapability') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Fetch vendors data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (capability) params.set('hasCapability', capability);
      params.set('page', String(page));
      params.set('pageSize', '20');

      try {
        const response = await fetch(`/api/lab/vendors?${params.toString()}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch vendors');
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search, status, capability, page]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (capability) params.set('hasCapability', capability);
    if (page > 1) params.set('page', String(page));

    const query = params.toString();
    router.replace(query ? `/lab/vendors?${query}` : '/lab/vendors', { scroll: false });
  }, [search, status, capability, page, router]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setCapability('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-end">
        <Link href="/lab/vendors/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
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
                placeholder="Search vendors..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Capability Filter */}
            <Select value={capability} onValueChange={(v) => { setCapability(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {capabilityOptions.map((opt) => (
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
            {(search || status || capability) && (
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
            <h3 className="text-lg font-semibold mb-2">No vendors found</h3>
            <p className="text-muted-foreground mb-4">
              {search || status || capability
                ? 'Try adjusting your filters'
                : 'Get started by adding your first lab vendor'}
            </p>
            <Link href="/lab/vendors/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader compact>
            <CardTitle size="sm">
              {data?.total} vendor{data?.total !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent compact className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Capabilities</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((vendor) => (
                  <TableRow
                    key={vendor.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/lab/vendors/${vendor.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-accent text-white text-xs">
                            {vendor.code}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{vendor.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono">{vendor.code}</span>
                            {vendor.website && (
                              <a
                                href={vendor.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:text-primary-600"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Globe className="h-3 w-3" />
                                Website
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        {vendor.primaryPhone && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" /> {vendor.primaryPhone}
                          </span>
                        )}
                        {vendor.primaryEmail && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" /> {vendor.primaryEmail}
                          </span>
                        )}
                        {!vendor.primaryPhone && !vendor.primaryEmail && (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {vendor.capabilities.slice(0, 3).map((cap) => (
                          <Badge key={cap} variant="outline" size="sm">
                            {capabilityLabels[cap] || cap}
                          </Badge>
                        ))}
                        {vendor.capabilities.length > 3 && (
                          <Badge variant="soft-primary" size="sm">
                            +{vendor.capabilities.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        {vendor._count.orders}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{vendor._count.products}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[vendor.status] || 'secondary'} dot>
                        {vendor.status}
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
