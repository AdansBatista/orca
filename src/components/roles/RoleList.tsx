'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { RoleCard } from './RoleCard';

interface Role {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isSystem: boolean;
  permissions: string[];
  assignmentCount: number;
}

interface PaginatedResponse {
  items: Role[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function RoleList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [includeSystem, setIncludeSystem] = useState(
    searchParams.get('includeSystem') !== 'false'
  );
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Fetch roles data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('includeSystem', String(includeSystem));
      params.set('page', String(page));
      params.set('pageSize', '50');

      try {
        const response = await fetch(`/api/roles?${params.toString()}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch roles');
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search, includeSystem, page]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (!includeSystem) params.set('includeSystem', 'false');
    if (page > 1) params.set('page', String(page));

    const query = params.toString();
    router.replace(query ? `/staff/roles?${query}` : '/staff/roles', {
      scroll: false,
    });
  }, [search, includeSystem, page, router]);

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  // Separate system and custom roles
  const systemRoles = data?.items.filter((r) => r.isSystem) || [];
  const customRoles = data?.items.filter((r) => !r.isSystem) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Roles & Permissions
          </h1>
          <p className="text-muted-foreground">
            Manage system roles and custom role definitions
          </p>
        </div>
        <Link href="/staff/roles/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card variant="ghost">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Include system roles toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="include-system"
                checked={includeSystem}
                onCheckedChange={(checked) => {
                  setIncludeSystem(checked);
                  setPage(1);
                }}
              />
              <Label htmlFor="include-system" className="text-sm">
                Show system roles
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : error ? (
        <Card variant="ghost">
          <CardContent className="p-8 text-center">
            <p className="text-error-600">{error}</p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : data?.items.length === 0 ? (
        <Card variant="ghost">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-foreground mb-1">
              No roles found
            </h3>
            <p className="text-muted-foreground mb-4">
              {search
                ? 'Try adjusting your search'
                : 'Get started by creating your first custom role'}
            </p>
            {!search && (
              <Link href="/staff/roles/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Role
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* System roles section */}
          {systemRoles.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                System Roles
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {systemRoles.map((role) => (
                  <RoleCard key={role.id} role={role} />
                ))}
              </div>
            </div>
          )}

          {/* Custom roles section */}
          {customRoles.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Custom Roles
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {customRoles.map((role) => (
                  <RoleCard key={role.id} role={role} />
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(data.page - 1) * data.pageSize + 1} to{' '}
                {Math.min(data.page * data.pageSize, data.total)} of{' '}
                {data.total} roles
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
      )}
    </div>
  );
}
