'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, DoorOpen, AlertTriangle, CheckCircle, Wrench } from 'lucide-react';
import type { Room, RoomType, RoomStatus } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { StatsRow } from '@/components/layout';
import { RoomCard } from './RoomCard';

type RoomWithCounts = Room & {
  _count: {
    chairs: number;
    roomEquipment: number;
  };
};

interface PaginatedResponse {
  items: RoomWithCounts[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const roomTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'OPERATORY', label: 'Operatory' },
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'X_RAY', label: 'X-Ray' },
  { value: 'STERILIZATION', label: 'Sterilization' },
  { value: 'LAB', label: 'Lab' },
  { value: 'STORAGE', label: 'Storage' },
  { value: 'RECEPTION', label: 'Reception' },
  { value: 'OFFICE', label: 'Office' },
];

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'RENOVATION', label: 'Renovation' },
];

export function RoomList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    operatories: number;
    withChairs: number;
  } | null>(null);

  // Filter state from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [roomType, setRoomType] = useState(searchParams.get('roomType') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Fetch rooms data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roomType) params.set('roomType', roomType);
      if (status) params.set('status', status);
      params.set('page', String(page));
      params.set('pageSize', '20');

      try {
        const response = await fetch(`/api/resources/rooms?${params.toString()}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch rooms');
        }

        setData(result.data);

        // Calculate stats from data
        if (!stats) {
          const allResponse = await fetch('/api/resources/rooms?pageSize=1000');
          const allResult = await allResponse.json();
          if (allResult.success) {
            const allItems = allResult.data.items as RoomWithCounts[];
            setStats({
              total: allResult.data.total,
              active: allItems.filter((r) => r.status === 'ACTIVE').length,
              operatories: allItems.filter((r) => r.roomType === 'OPERATORY').length,
              withChairs: allItems.filter((r) => r._count.chairs > 0).length,
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search, roomType, status, page, stats]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (roomType) params.set('roomType', roomType);
    if (status) params.set('status', status);
    if (page > 1) params.set('page', String(page));

    const query = params.toString();
    router.replace(query ? `/resources/rooms?${query}` : '/resources/rooms', { scroll: false });
  }, [search, roomType, status, page, router]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rooms & Operatories</h1>
          <p className="text-muted-foreground">
            Manage treatment rooms, operatories, and equipment assignments
          </p>
        </div>
        <Link href="/resources/rooms/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Room
          </Button>
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <StatsRow>
          <StatCard accentColor="primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Rooms</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30 p-2">
                <DoorOpen className="h-4 w-4 text-primary-600" />
              </div>
            </div>
          </StatCard>
          <StatCard accentColor="success">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-xl font-bold">{stats.active}</p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-success-100 dark:bg-success-900/30 p-2">
                <CheckCircle className="h-4 w-4 text-success-600" />
              </div>
            </div>
          </StatCard>
          <StatCard accentColor="accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Operatories</p>
                <p className="text-xl font-bold">{stats.operatories}</p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-accent-100 dark:bg-accent-900/30 p-2">
                <DoorOpen className="h-4 w-4 text-accent-600" />
              </div>
            </div>
          </StatCard>
          <StatCard accentColor="secondary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">With Chairs</p>
                <p className="text-xl font-bold">{stats.withChairs}</p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-secondary-100 dark:bg-secondary-900/30 p-2">
                <Wrench className="h-4 w-4 text-secondary-600" />
              </div>
            </div>
          </StatCard>
        </StatsRow>
      )}

      {/* Filters */}
      <Card variant="ghost">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or room number..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Room Type filter */}
            <Select value={roomType} onValueChange={(v) => { setRoomType(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Room Type" />
              </SelectTrigger>
              <SelectContent>
                {roomTypeOptions.map((opt) => (
                  <SelectItem key={opt.value || 'all'} value={opt.value || 'all'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
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
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-3 w-40" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card variant="ghost">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-error-500 mb-4" />
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
            <DoorOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-foreground mb-1">No rooms found</h3>
            <p className="text-muted-foreground mb-4">
              {search || roomType || status
                ? 'Try adjusting your filters'
                : 'Get started by adding your first room'}
            </p>
            {!search && !roomType && !status && (
              <Link href="/resources/rooms/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Room
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Room grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.items.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((data.page - 1) * data.pageSize) + 1} to{' '}
                {Math.min(data.page * data.pageSize, data.total)} of {data.total} rooms
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
        </>
      )}
    </div>
  );
}
