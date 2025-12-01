'use client';

import { format, parseISO } from 'date-fns';
import { AlertTriangle, Users, Clock, Calendar } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { StatsRow } from '@/components/layout';

interface CoverageGap {
  date: string;
  dayOfWeek: number;
  timeSlot: string | null;
  requirementId: string;
  requirementName: string;
  locationId: string;
  department: string | null;
  providerType: string | null;
  required: number;
  scheduled: number;
  gap: number;
  isCritical: boolean;
  priority: number;
}

interface CoverageStatus {
  date: string;
  gaps: CoverageGap[];
  totalGaps: number;
  criticalGaps: number;
}

interface CoverageGapSummary {
  totalDays: number;
  daysWithGaps: number;
  totalGaps: number;
  criticalGaps: number;
}

interface CoverageGapsListProps {
  gaps: CoverageStatus[];
  summary: CoverageGapSummary;
  isLoading?: boolean;
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CoverageGapsList({
  gaps,
  summary,
  isLoading,
}: CoverageGapsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-8 bg-muted rounded w-12 mb-2" />
                <div className="h-4 bg-muted rounded w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-6 bg-muted rounded w-1/3 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <StatsRow>
        <StatCard accentColor="primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Days</p>
              <p className="text-lg font-bold">{summary.totalDays}</p>
            </div>
            <Calendar className="h-5 w-5 text-primary-500" />
          </div>
        </StatCard>
        <StatCard accentColor={summary.daysWithGaps > 0 ? 'warning' : 'success'}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Days with Gaps</p>
              <p className="text-lg font-bold">{summary.daysWithGaps}</p>
            </div>
            <Calendar className={`h-5 w-5 ${summary.daysWithGaps > 0 ? 'text-warning-500' : 'text-success-500'}`} />
          </div>
        </StatCard>
        <StatCard accentColor={summary.totalGaps > 0 ? 'warning' : 'success'}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Gaps</p>
              <p className="text-lg font-bold">{summary.totalGaps}</p>
            </div>
            <Users className={`h-5 w-5 ${summary.totalGaps > 0 ? 'text-warning-500' : 'text-success-500'}`} />
          </div>
        </StatCard>
        <StatCard accentColor={summary.criticalGaps > 0 ? 'error' : 'success'}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Critical Gaps</p>
              <p className="text-lg font-bold">{summary.criticalGaps}</p>
            </div>
            <AlertTriangle className={`h-5 w-5 ${summary.criticalGaps > 0 ? 'text-error-500' : 'text-success-500'}`} />
          </div>
        </StatCard>
      </StatsRow>

      {/* Gap Details */}
      {gaps.length === 0 ? (
        <Card variant="ghost">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-success mb-4" />
            <p className="text-lg font-medium text-success">All Coverage Met</p>
            <p className="text-sm text-muted-foreground mt-1">
              No staffing gaps detected for the selected period
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {gaps.map((dayGaps) => (
            <Card key={dayGaps.date} className={dayGaps.criticalGaps > 0 ? 'border-destructive/50' : ''}>
              <CardHeader compact>
                <div className="flex items-center justify-between">
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(parseISO(dayGaps.date), 'EEEE, MMM d, yyyy')}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={dayGaps.criticalGaps > 0 ? 'destructive' : 'warning'}>
                      {dayGaps.totalGaps} gap{dayGaps.totalGaps !== 1 ? 's' : ''}
                    </Badge>
                    {dayGaps.criticalGaps > 0 && (
                      <Badge variant="destructive" dot>
                        {dayGaps.criticalGaps} critical
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent compact>
                <div className="space-y-2">
                  {dayGaps.gaps
                    .sort((a, b) => {
                      // Sort by critical first, then by priority
                      if (a.isCritical !== b.isCritical) return a.isCritical ? -1 : 1;
                      return b.priority - a.priority;
                    })
                    .map((gap, idx) => (
                      <div
                        key={`${gap.requirementId}-${idx}`}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          gap.isCritical ? 'bg-destructive/10' : 'bg-warning/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            gap.isCritical ? 'bg-destructive/20 text-destructive' : 'bg-warning/20 text-warning'
                          }`}>
                            {gap.isCritical ? (
                              <AlertTriangle className="h-4 w-4" />
                            ) : (
                              <Users className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{gap.requirementName}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {gap.timeSlot && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {gap.timeSlot}
                                </span>
                              )}
                              {gap.department && (
                                <Badge variant="outline" className="text-xs">
                                  {gap.department}
                                </Badge>
                              )}
                              {gap.providerType && (
                                <Badge variant="outline" className="text-xs">
                                  {gap.providerType}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            gap.isCritical ? 'text-destructive' : 'text-warning'
                          }`}>
                            -{gap.gap} staff
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {gap.scheduled} of {gap.required} scheduled
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
