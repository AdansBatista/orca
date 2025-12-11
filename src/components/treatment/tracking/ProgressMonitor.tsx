'use client';

import { useMemo } from 'react';
import { format, differenceInDays, differenceInMonths } from 'date-fns';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  CheckCircle,
  AlertTriangle,
  ThumbsUp,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export interface ProgressSnapshot {
  id: string;
  snapshotDate: Date;
  percentComplete: number;
  currentPhase?: string;
  clinicalProgress?: string;
  complianceScore?: number;
  status: string;
}

interface ProgressMonitorProps {
  snapshots: ProgressSnapshot[];
  currentProgress: number;
  treatmentStartDate?: Date;
  estimatedEndDate?: Date;
  targetProgress?: number;
  complianceScore?: number;
}

export function ProgressMonitor({
  snapshots,
  currentProgress,
  treatmentStartDate,
  estimatedEndDate,
  targetProgress,
  complianceScore,
}: ProgressMonitorProps) {
  // Sort snapshots by date
  const sortedSnapshots = useMemo(() => {
    return [...snapshots].sort(
      (a, b) => new Date(b.snapshotDate).getTime() - new Date(a.snapshotDate).getTime()
    );
  }, [snapshots]);

  // Calculate progress trend
  const progressTrend = useMemo(() => {
    if (sortedSnapshots.length < 2) return { trend: 'stable' as const, change: 0 };

    const recent = sortedSnapshots[0].percentComplete;
    const previous = sortedSnapshots[1].percentComplete;
    const change = recent - previous;

    return {
      trend: change > 2 ? 'up' as const : change < -2 ? 'down' as const : 'stable' as const,
      change,
    };
  }, [sortedSnapshots]);

  // Calculate expected progress based on time elapsed
  const expectedProgress = useMemo(() => {
    if (!treatmentStartDate || !estimatedEndDate) return null;

    const start = new Date(treatmentStartDate);
    const end = new Date(estimatedEndDate);
    const today = new Date();

    const totalDays = differenceInDays(end, start);
    const elapsedDays = differenceInDays(today, start);

    if (totalDays <= 0) return 100;
    return Math.min(100, Math.round((elapsedDays / totalDays) * 100));
  }, [treatmentStartDate, estimatedEndDate]);

  // Determine if on track
  const onTrackStatus = useMemo(() => {
    if (expectedProgress === null) return null;

    const diff = currentProgress - expectedProgress;
    if (diff >= -5) return 'on-track';
    if (diff >= -15) return 'slightly-behind';
    return 'behind';
  }, [currentProgress, expectedProgress]);

  // Calculate treatment duration
  const treatmentDuration = useMemo(() => {
    if (!treatmentStartDate) return null;

    const start = new Date(treatmentStartDate);
    const today = new Date();
    const months = differenceInMonths(today, start);
    const days = differenceInDays(today, start) % 30;

    return { months, days, totalDays: differenceInDays(today, start) };
  }, [treatmentStartDate]);

  // Calculate average progress per month
  const avgProgressPerMonth = useMemo(() => {
    if (!treatmentDuration || treatmentDuration.totalDays < 30) return null;
    return Math.round(currentProgress / (treatmentDuration.totalDays / 30));
  }, [currentProgress, treatmentDuration]);

  const getTrendIcon = () => {
    switch (progressTrend.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-success-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-error-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getOnTrackBadge = () => {
    switch (onTrackStatus) {
      case 'on-track':
        return (
          <Badge variant="success">
            <CheckCircle className="h-3 w-3 mr-1" />
            On Track
          </Badge>
        );
      case 'slightly-behind':
        return (
          <Badge variant="warning">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Slightly Behind
          </Badge>
        );
      case 'behind':
        return (
          <Badge variant="error">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Behind Schedule
          </Badge>
        );
      default:
        return null;
    }
  };

  const getComplianceBadge = (score?: number) => {
    if (score === undefined) return null;
    if (score >= 90) return <Badge variant="success">Excellent</Badge>;
    if (score >= 75) return <Badge variant="info">Good</Badge>;
    if (score >= 60) return <Badge variant="warning">Fair</Badge>;
    return <Badge variant="error">Poor</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle size="sm" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Progress Monitor
            </CardTitle>
            <CardDescription>Track treatment progress over time</CardDescription>
          </div>
          {getOnTrackBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Current Progress</span>
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className="text-2xl font-bold">{currentProgress}%</span>
            </div>
          </div>
          <Progress value={currentProgress} className="h-4" />
          {expectedProgress !== null && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Expected: {expectedProgress}%</span>
              <span>
                {currentProgress >= expectedProgress
                  ? `+${currentProgress - expectedProgress}% ahead`
                  : `${expectedProgress - currentProgress}% behind`}
              </span>
            </div>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-muted/30 text-center">
            <p className="text-2xl font-bold">{currentProgress}%</p>
            <p className="text-xs text-muted-foreground">Complete</p>
          </div>
          {treatmentDuration && (
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <p className="text-2xl font-bold">
                {treatmentDuration.months}
                <span className="text-sm font-normal text-muted-foreground">mo</span>
              </p>
              <p className="text-xs text-muted-foreground">In Treatment</p>
            </div>
          )}
          {avgProgressPerMonth !== null && (
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <p className="text-2xl font-bold">{avgProgressPerMonth}%</p>
              <p className="text-xs text-muted-foreground">Avg/Month</p>
            </div>
          )}
          {complianceScore !== undefined && (
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <p className="text-2xl font-bold">{complianceScore}%</p>
              <p className="text-xs text-muted-foreground">Compliance</p>
            </div>
          )}
        </div>

        {/* Compliance Score */}
        {complianceScore !== undefined && (
          <div className="p-4 rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium flex items-center gap-2">
                <ThumbsUp className="h-4 w-4" />
                Patient Compliance
              </span>
              {getComplianceBadge(complianceScore)}
            </div>
            <Progress value={complianceScore} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Based on appointment attendance, appliance wear time, and oral hygiene
            </p>
          </div>
        )}

        {/* Progress History */}
        {sortedSnapshots.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Progress History</h4>
            <div className="space-y-2">
              {sortedSnapshots.slice(0, 5).map((snapshot, idx) => {
                const prevSnapshot = sortedSnapshots[idx + 1];
                const change = prevSnapshot
                  ? snapshot.percentComplete - prevSnapshot.percentComplete
                  : null;

                return (
                  <div
                    key={snapshot.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(snapshot.snapshotDate), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {snapshot.currentPhase && (
                        <Badge variant="outline" size="sm">
                          {snapshot.currentPhase}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{snapshot.percentComplete}%</span>
                      {change !== null && (
                        <Badge
                          variant={change > 0 ? 'success' : change < 0 ? 'error' : 'secondary'}
                          size="sm"
                        >
                          {change > 0 ? '+' : ''}{change}%
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {sortedSnapshots.length > 5 && (
              <p className="text-xs text-center text-muted-foreground">
                Showing last 5 of {sortedSnapshots.length} snapshots
              </p>
            )}
          </div>
        )}

        {/* Progress Chart (Simple ASCII visualization) */}
        {sortedSnapshots.length >= 3 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Progress Trend</h4>
            <div className="h-24 flex items-end gap-1">
              {sortedSnapshots
                .slice(0, 12)
                .reverse()
                .map((snapshot, idx) => (
                  <div
                    key={snapshot.id}
                    className="flex-1 bg-primary-200 rounded-t transition-all hover:bg-primary-300"
                    style={{ height: `${snapshot.percentComplete}%` }}
                    title={`${format(new Date(snapshot.snapshotDate), 'MMM d')}: ${snapshot.percentComplete}%`}
                  />
                ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {sortedSnapshots.length > 0 &&
                  format(new Date(sortedSnapshots[sortedSnapshots.length - 1].snapshotDate), 'MMM yyyy')}
              </span>
              <span>
                {sortedSnapshots.length > 0 &&
                  format(new Date(sortedSnapshots[0].snapshotDate), 'MMM yyyy')}
              </span>
            </div>
          </div>
        )}

        {/* Latest Clinical Notes */}
        {sortedSnapshots[0]?.clinicalProgress && (
          <div className="p-3 rounded-lg bg-muted/30">
            <h4 className="text-sm font-medium mb-1">Latest Clinical Notes</h4>
            <p className="text-sm text-muted-foreground">
              {sortedSnapshots[0].clinicalProgress}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(sortedSnapshots[0].snapshotDate), 'MMMM d, yyyy')}
            </p>
          </div>
        )}

        {/* Treatment Timeline */}
        {treatmentStartDate && estimatedEndDate && (
          <div className="p-3 rounded-lg bg-muted/30">
            <h4 className="text-sm font-medium mb-2">Treatment Timeline</h4>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Started</p>
                <p className="font-medium">{format(new Date(treatmentStartDate), 'MMM d, yyyy')}</p>
              </div>
              <div className="flex-1 text-right">
                <p className="text-xs text-muted-foreground">Est. Completion</p>
                <p className="font-medium">{format(new Date(estimatedEndDate), 'MMM d, yyyy')}</p>
              </div>
            </div>
            {treatmentDuration && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {treatmentDuration.months} months, {treatmentDuration.days} days in treatment
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
