'use client';

/**
 * RetentionDashboard Component
 *
 * Dashboard showing retention compliance statistics and storage usage.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Archive,
  AlertTriangle,
  Clock,
  Scale,
  HardDrive,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, StatCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsRow } from '@/components/layout';
import type { RetentionReportSummary, StorageReportSummary } from '@/hooks/use-retention';

interface StorageBreakdown {
  category?: string;
  status?: string;
  label?: string;
  imageCount: number;
  totalSize: number;
  archivedCount?: number;
  percentage: number;
}

interface RetentionDashboardProps {
  onNavigateToExpiring?: () => void;
  onNavigateToArchived?: () => void;
  onNavigateToLegalHold?: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function RetentionDashboard({
  onNavigateToExpiring,
  onNavigateToArchived,
  onNavigateToLegalHold,
}: RetentionDashboardProps) {
  const [retentionSummary, setRetentionSummary] = useState<RetentionReportSummary | null>(null);
  const [storageSummary, setStorageSummary] = useState<StorageReportSummary | null>(null);
  const [storageBreakdown, setStorageBreakdown] = useState<StorageBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch retention report and storage report in parallel
      const [retentionRes, storageRes] = await Promise.all([
        fetch('/api/imaging/retention/report?status=all'),
        fetch('/api/imaging/retention/storage?groupBy=category'),
      ]);

      const [retentionData, storageData] = await Promise.all([
        retentionRes.json(),
        storageRes.json(),
      ]);

      if (retentionData.success) {
        setRetentionSummary(retentionData.data.summary);
      }

      if (storageData.success) {
        setStorageSummary(storageData.data.summary);
        setStorageBreakdown(storageData.data.breakdown || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-warning-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load dashboard</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <StatsRow>
        <StatCard accentColor="primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Images</p>
                <p className="text-2xl font-bold">{retentionSummary?.totalImages ?? 0}</p>
              </div>
              <HardDrive className="h-8 w-8 text-primary-500 opacity-80" />
            </div>
          </CardContent>
        </StatCard>

        <StatCard accentColor="success">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compliance Rate</p>
                <p className="text-2xl font-bold">
                  {retentionSummary?.complianceRate?.toFixed(1) ?? 0}%
                </p>
              </div>
              <Shield className="h-8 w-8 text-success-500 opacity-80" />
            </div>
          </CardContent>
        </StatCard>

        <StatCard accentColor="warning">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold">{retentionSummary?.expiringSoonCount ?? 0}</p>
              </div>
              <Clock className="h-8 w-8 text-warning-500 opacity-80" />
            </div>
            {onNavigateToExpiring && retentionSummary?.expiringSoonCount ? (
              <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={onNavigateToExpiring}>
                View expiring images
              </Button>
            ) : null}
          </CardContent>
        </StatCard>

        <StatCard accentColor="secondary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Legal Holds</p>
                <p className="text-2xl font-bold">{retentionSummary?.legalHoldCount ?? 0}</p>
              </div>
              <Scale className="h-8 w-8 text-secondary-500 opacity-80" />
            </div>
            {onNavigateToLegalHold && retentionSummary?.legalHoldCount ? (
              <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={onNavigateToLegalHold}>
                Manage holds
              </Button>
            ) : null}
          </CardContent>
        </StatCard>
      </StatsRow>

      {/* Detailed Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Retention Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Retention Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active (with policy)</span>
                <Badge variant="success">
                  {(retentionSummary?.totalImages ?? 0) -
                    (retentionSummary?.noRetentionPolicyCount ?? 0) -
                    (retentionSummary?.archivedCount ?? 0)}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">No policy assigned</span>
                <Badge variant="warning">{retentionSummary?.noRetentionPolicyCount ?? 0}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Archived</span>
                <Badge variant="secondary">{retentionSummary?.archivedCount ?? 0}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Expired</span>
                <Badge variant="destructive">{retentionSummary?.expiredCount ?? 0}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Legal hold</span>
                <Badge variant="outline">{retentionSummary?.legalHoldCount ?? 0}</Badge>
              </div>
            </div>

            {/* Compliance Progress */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Compliance Progress</span>
                <span className="text-sm text-muted-foreground">
                  {retentionSummary?.complianceRate?.toFixed(1) ?? 0}%
                </span>
              </div>
              <Progress value={retentionSummary?.complianceRate ?? 0} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Images with retention policy assigned vs total images
              </p>
            </div>

            {onNavigateToArchived && (
              <Button variant="outline" className="w-full" onClick={onNavigateToArchived}>
                <Archive className="h-4 w-4 mr-2" />
                View Archived Images
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Storage Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Total Storage */}
            <div className="text-center py-4 border-b">
              <p className="text-3xl font-bold">{formatBytes(storageSummary?.totalSize ?? 0)}</p>
              <p className="text-sm text-muted-foreground">Total storage used</p>
            </div>

            {/* Hot vs Cold Storage */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-primary-50 dark:bg-primary-950">
                <TrendingUp className="h-6 w-6 mx-auto text-primary-500 mb-1" />
                <p className="text-lg font-semibold">{formatBytes(storageSummary?.hotStorageSize ?? 0)}</p>
                <p className="text-xs text-muted-foreground">Hot Storage</p>
                <Badge variant="soft-primary" className="mt-1">
                  {storageSummary?.hotStoragePercentage ?? 0}%
                </Badge>
              </div>

              <div className="text-center p-3 rounded-lg bg-secondary-50 dark:bg-secondary-950">
                <Archive className="h-6 w-6 mx-auto text-secondary-500 mb-1" />
                <p className="text-lg font-semibold">{formatBytes(storageSummary?.coldStorageSize ?? 0)}</p>
                <p className="text-xs text-muted-foreground">Cold Storage</p>
                <Badge variant="secondary" className="mt-1">
                  {storageSummary?.coldStoragePercentage ?? 0}%
                </Badge>
              </div>
            </div>

            {/* Storage by Category */}
            {storageBreakdown.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Storage by Category</h4>
                <div className="space-y-2">
                  {storageBreakdown.slice(0, 5).map((item) => (
                    <div key={item.category} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.category}</span>
                      <div className="flex items-center gap-2">
                        <span>{formatBytes(item.totalSize)}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.percentage}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      {((retentionSummary?.expiringSoonCount ?? 0) > 0 ||
        (retentionSummary?.noRetentionPolicyCount ?? 0) > 0) && (
        <Card variant="ghost" className="border-warning-200 bg-warning-50 dark:bg-warning-950">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-warning-900 dark:text-warning-100">
                  Action Required
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-warning-800 dark:text-warning-200">
                  {(retentionSummary?.expiringSoonCount ?? 0) > 0 && (
                    <li>
                      {retentionSummary?.expiringSoonCount} images are expiring within 90 days
                    </li>
                  )}
                  {(retentionSummary?.noRetentionPolicyCount ?? 0) > 0 && (
                    <li>
                      {retentionSummary?.noRetentionPolicyCount} images have no retention policy
                      assigned
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
