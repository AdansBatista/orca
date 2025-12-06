'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, StatCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatsRow } from '@/components/layout';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DayData {
  date: string;
  dayOfWeek: string;
  isToday: boolean;
  isWeekend: boolean;
  appointments: Array<{
    id: string;
    startTime: string;
    status: string;
    patient: { firstName: string; lastName: string };
    provider: { firstName: string; lastName: string };
    appointmentType: { name: string; color: string | null } | null;
  }>;
  stats: {
    scheduled: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  hourlyDensity: Record<number, number>;
}

interface WeekData {
  weekStart: string;
  weekEnd: string;
  days: DayData[];
  weekSummary: {
    totalScheduled: number;
    totalCompleted: number;
    totalCancelled: number;
    totalNoShow: number;
    completionRate: number;
  };
  dailyTrends: Array<{
    date: string;
    dayOfWeek: string;
    scheduled: number;
    completed: number;
  }>;
  providerStats: Array<{
    provider: { id: string; firstName: string; lastName: string };
    scheduled: number;
    completed: number;
    cancelled: number;
  }>;
}

interface WeekViewProps {
  onDateSelect?: (date: string) => void;
}

export function WeekView({ onDateSelect }: WeekViewProps) {
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const fetchWeekData = useCallback(async () => {
    setLoading(true);
    try {
      const weekStartStr = currentWeekStart.toISOString().split('T')[0];
      const res = await fetch(`/api/ops/dashboard/week?weekStart=${weekStartStr}`);
      const data = await res.json();

      if (data.success) {
        setWeekData(data.data);
      } else {
        toast.error('Failed to load week data');
      }
    } catch {
      toast.error('Failed to load week data');
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart]);

  useEffect(() => {
    fetchWeekData();
  }, [fetchWeekData]);

  const goToPreviousWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const goToNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const goToCurrentWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  const formatDateRange = () => {
    if (!weekData) return '';
    const start = new Date(weekData.weekStart);
    const end = new Date(weekData.weekEnd);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const isCurrentWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const thisMonday = new Date(now);
    thisMonday.setDate(diff);
    thisMonday.setHours(0, 0, 0, 0);
    return currentWeekStart.getTime() === thisMonday.getTime();
  };

  // Calculate max appointments for scaling
  const maxAppointments = weekData?.days.reduce((max, day) => Math.max(max, day.stats.scheduled), 0) || 1;

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {!isCurrentWeek() && (
            <Button variant="ghost" size="sm" onClick={goToCurrentWeek}>
              Today
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{formatDateRange()}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : weekData ? (
        <>
          {/* Week Summary Stats */}
          <StatsRow>
            <StatCard accentColor="primary">
              <div>
                <p className="text-xs text-muted-foreground">Scheduled</p>
                <p className="text-xl font-bold">{weekData.weekSummary.totalScheduled}</p>
              </div>
            </StatCard>
            <StatCard accentColor="success">
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-xl font-bold">{weekData.weekSummary.totalCompleted}</p>
              </div>
            </StatCard>
            <StatCard accentColor="warning">
              <div>
                <p className="text-xs text-muted-foreground">Cancelled</p>
                <p className="text-xl font-bold">{weekData.weekSummary.totalCancelled}</p>
              </div>
            </StatCard>
            <StatCard accentColor="accent">
              <div>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
                <p className="text-xl font-bold">{weekData.weekSummary.completionRate}%</p>
              </div>
            </StatCard>
          </StatsRow>

          {/* 7-Day Calendar View */}
          <Card>
            <CardHeader>
              <CardTitle size="sm">Weekly Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weekData.days.map((day) => {
                  const barHeight = maxAppointments > 0
                    ? (day.stats.scheduled / maxAppointments) * 100
                    : 0;

                  return (
                    <button
                      key={day.date}
                      onClick={() => onDateSelect?.(day.date)}
                      className={cn(
                        'p-3 rounded-lg border transition-all hover:border-primary',
                        day.isToday && 'border-primary bg-primary/5',
                        day.isWeekend && 'bg-muted/30',
                        !day.isToday && !day.isWeekend && 'border-border'
                      )}
                    >
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">{day.dayOfWeek}</p>
                        <p className={cn(
                          'text-lg font-medium',
                          day.isToday && 'text-primary'
                        )}>
                          {new Date(day.date).getDate()}
                        </p>
                      </div>

                      {/* Mini bar chart */}
                      <div className="h-16 flex items-end justify-center mt-2">
                        <div
                          className={cn(
                            'w-8 rounded-t transition-all',
                            day.stats.scheduled === 0 && 'bg-muted',
                            day.stats.scheduled > 0 && day.stats.scheduled <= 10 && 'bg-success-500',
                            day.stats.scheduled > 10 && day.stats.scheduled <= 20 && 'bg-warning-500',
                            day.stats.scheduled > 20 && 'bg-error-500'
                          )}
                          style={{ height: `${Math.max(4, barHeight)}%` }}
                        />
                      </div>

                      <div className="text-center mt-2">
                        <p className="text-sm font-medium">{day.stats.scheduled}</p>
                        <p className="text-xs text-muted-foreground">appts</p>
                      </div>

                      {/* Completion status */}
                      {day.stats.completed > 0 && (
                        <div className="mt-1">
                          <Badge variant="success" size="sm" className="text-xs">
                            {day.stats.completed} done
                          </Badge>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Daily Trends Comparison */}
          <Card>
            <CardHeader>
              <CardTitle size="sm">Day-over-Day Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weekData.dailyTrends.map((day, index) => {
                  const prevDay = index > 0 ? weekData.dailyTrends[index - 1] : null;
                  const diff = prevDay ? day.scheduled - prevDay.scheduled : 0;

                  return (
                    <div key={day.date} className="flex items-center gap-4">
                      <div className="w-12 text-sm text-muted-foreground">
                        {day.dayOfWeek}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-6 bg-primary/80 rounded"
                            style={{
                              width: `${maxAppointments > 0 ? (day.scheduled / maxAppointments) * 100 : 0}%`,
                              minWidth: day.scheduled > 0 ? '20px' : '0',
                            }}
                          />
                          <span className="text-sm font-medium">{day.scheduled}</span>
                        </div>
                      </div>
                      <div className="w-20 text-right">
                        {diff !== 0 && (
                          <span className={cn(
                            'text-xs flex items-center justify-end gap-1',
                            diff > 0 && 'text-success-600',
                            diff < 0 && 'text-error-600'
                          )}>
                            {diff > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {Math.abs(diff)}
                          </span>
                        )}
                        {diff === 0 && prevDay && (
                          <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                            <Minus className="h-3 w-3" />
                            Same
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Provider Stats */}
          {weekData.providerStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle size="sm">Provider Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {weekData.providerStats.map((stat) => (
                    <div
                      key={stat.provider.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div>
                        <p className="font-medium">
                          Dr. {stat.provider.firstName} {stat.provider.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {stat.scheduled} scheduled this week
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-medium text-success-600">{stat.completed}</p>
                          <p className="text-xs text-muted-foreground">Done</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-error-600">{stat.cancelled}</p>
                          <p className="text-xs text-muted-foreground">Cancelled</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          No data available for this week
        </div>
      )}
    </div>
  );
}
