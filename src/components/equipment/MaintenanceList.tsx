'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Calendar, AlertTriangle, CheckCircle, Wrench } from 'lucide-react';
import type { MaintenanceRecord, Equipment, Supplier } from '@prisma/client';

import { StatsRow } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { cn } from '@/lib/utils';

type MaintenanceWithRelations = MaintenanceRecord & {
  equipment: Pick<Equipment, 'id' | 'name' | 'equipmentNumber' | 'locationNotes'>;
  vendor?: Pick<Supplier, 'id' | 'name'> | null;
};

interface MaintenanceResponse {
  items: MaintenanceWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'default' }> = {
  SCHEDULED: { label: 'Scheduled', variant: 'default' },
  IN_PROGRESS: { label: 'In Progress', variant: 'warning' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'default' },
  OVERDUE: { label: 'Overdue', variant: 'error' },
};

const typeConfig: Record<string, string> = {
  PREVENTIVE: 'Preventive',
  CORRECTIVE: 'Corrective',
  INSPECTION: 'Inspection',
  CALIBRATION: 'Calibration',
  CERTIFICATION: 'Certification',
  CLEANING: 'Cleaning',
  UPGRADE: 'Upgrade',
};

export function MaintenanceList() {
  const searchParams = useSearchParams();

  const [data, setData] = useState<MaintenanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [filter, setFilter] = useState(searchParams.get('filter') || 'upcoming');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (filter === 'overdue') params.set('overdue', 'true');
      if (filter === 'upcoming') params.set('upcoming', 'true');
      params.set('pageSize', '50');

      try {
        const response = await fetch(`/api/resources/maintenance?${params.toString()}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch maintenance schedule');
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status, filter]);

  // Group by date for better visualization
  const groupedByDate = data?.items.reduce((acc, record) => {
    const date = record.scheduledDate
      ? new Date(record.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      : 'Unscheduled';
    if (!acc[date]) acc[date] = [];
    acc[date].push(record);
    return acc;
  }, {} as Record<string, MaintenanceWithRelations[]>) || {};

  const overdueCount = data?.items.filter(r =>
    r.status === 'SCHEDULED' && r.scheduledDate && new Date(r.scheduledDate) < new Date()
  ).length || 0;

  const upcomingCount = data?.items.filter(r =>
    r.status === 'SCHEDULED' && r.scheduledDate && new Date(r.scheduledDate) >= new Date()
  ).length || 0;

  const inProgressCount = data?.items.filter(r => r.status === 'IN_PROGRESS').length || 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <StatsRow>
        <StatCard accentColor="error">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Overdue</p>
              <p className="text-xl font-bold">{overdueCount}</p>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-error-100 dark:bg-error-900/30 p-2">
              <AlertTriangle className="h-4 w-4 text-error-600" />
            </div>
          </div>
        </StatCard>
        <StatCard accentColor="primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Upcoming</p>
              <p className="text-xl font-bold">{upcomingCount}</p>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30 p-2">
              <Calendar className="h-4 w-4 text-primary-600" />
            </div>
          </div>
        </StatCard>
        <StatCard accentColor="warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">In Progress</p>
              <p className="text-xl font-bold">{inProgressCount}</p>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-warning-100 dark:bg-warning-900/30 p-2">
              <Wrench className="h-4 w-4 text-warning-600" />
            </div>
          </div>
        </StatCard>
        <StatCard accentColor="secondary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Scheduled</p>
              <p className="text-xl font-bold">{data?.total || 0}</p>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-secondary-100 dark:bg-secondary-900/30 p-2">
              <CheckCircle className="h-4 w-4 text-secondary-600" />
            </div>
          </div>
        </StatCard>
      </StatsRow>

      {/* Filters */}
      <Card variant="ghost">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Records</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
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
      ) : Object.keys(groupedByDate).length === 0 ? (
        <Card variant="ghost">
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-foreground mb-1">No maintenance records</h3>
            <p className="text-muted-foreground">
              {filter === 'overdue'
                ? 'No overdue maintenance - great job!'
                : 'No maintenance scheduled'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByDate).map(([date, records]) => (
            <Card key={date}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {date}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {records.map((record) => {
                  const statusInfo = statusConfig[record.status] || statusConfig.SCHEDULED;
                  const isOverdue = record.status === 'SCHEDULED' &&
                    record.scheduledDate &&
                    new Date(record.scheduledDate) < new Date();

                  return (
                    <Link
                      key={record.id}
                      href={`/resources/equipment/${record.equipmentId}`}
                      className="block"
                    >
                      <div className={cn(
                        "flex items-center justify-between p-3 rounded-lg transition-colors",
                        "hover:bg-muted/50",
                        isOverdue ? "bg-error-50 dark:bg-error-900/20" : "bg-muted/30"
                      )}>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            isOverdue ? "bg-error-100 dark:bg-error-900/30" : "bg-primary-100 dark:bg-primary-900/30"
                          )}>
                            <Wrench className={cn(
                              "h-4 w-4",
                              isOverdue ? "text-error-600" : "text-primary-600"
                            )} />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {record.equipment.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {record.equipment.equipmentNumber}
                              {record.equipment.locationNotes && ` • ${record.equipment.locationNotes}`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {typeConfig[record.maintenanceType] || record.maintenanceType}
                              {record.description && ` - ${record.description}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isOverdue ? (
                            <Badge variant="error">Overdue</Badge>
                          ) : (
                            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
