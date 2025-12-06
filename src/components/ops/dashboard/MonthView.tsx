'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, StatCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatsRow } from '@/components/layout';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DayData {
  date: string;
  day: number;
  dayOfWeek: number;
  isToday: boolean;
  isWeekend: boolean;
  isPast: boolean;
  stats: {
    scheduled: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  status: 'empty' | 'light' | 'normal' | 'busy' | 'full';
}

interface MonthData {
  month: number;
  year: number;
  monthName: string;
  daysInMonth: number;
  days: DayData[];
  monthSummary: {
    totalScheduled: number;
    totalCompleted: number;
    totalCancelled: number;
    totalNoShow: number;
    avgPerDay: number;
    busiestDay: { date: string; count: number } | null;
    completionRate: number;
  };
  weeklyTrends: Array<{
    weekNumber: number;
    scheduled: number;
    completed: number;
  }>;
  providerStats: Array<{
    provider: { id: string; firstName: string; lastName: string };
    scheduled: number;
    completed: number;
    cancelled: number;
    avgPerDay: number;
  }>;
  appointmentTypeStats: Array<{
    type: { id: string; name: string; color: string | null };
    count: number;
    percentage: number;
  }>;
}

interface MonthViewProps {
  onDateSelect?: (date: string) => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_COLORS = {
  empty: 'bg-muted/50',
  light: 'bg-success-100 border-success-200',
  normal: 'bg-primary-100 border-primary-200',
  busy: 'bg-warning-100 border-warning-200',
  full: 'bg-error-100 border-error-200',
};

export function MonthView({ onDateSelect }: MonthViewProps) {
  const [monthData, setMonthData] = useState<MonthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const fetchMonthData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ops/dashboard/month?month=${currentMonth}&year=${currentYear}`);
      const data = await res.json();

      if (data.success) {
        setMonthData(data.data);
      } else {
        toast.error('Failed to load month data');
      }
    } catch {
      toast.error('Failed to load month data');
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    fetchMonthData();
  }, [fetchMonthData]);

  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date().getMonth() + 1);
    setCurrentYear(new Date().getFullYear());
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear();
  };

  // Calculate the first day offset for the calendar grid
  const getFirstDayOffset = () => {
    if (!monthData || monthData.days.length === 0) return 0;
    return monthData.days[0].dayOfWeek;
  };

  // Generate calendar grid cells
  const generateCalendarCells = () => {
    if (!monthData) return [];

    const cells: Array<DayData | null> = [];
    const firstDayOffset = getFirstDayOffset();

    // Add empty cells for days before the 1st
    for (let i = 0; i < firstDayOffset; i++) {
      cells.push(null);
    }

    // Add the actual days
    cells.push(...monthData.days);

    // Add empty cells to complete the last row
    const remainder = cells.length % 7;
    if (remainder > 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        cells.push(null);
      }
    }

    return cells;
  };

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {!isCurrentMonth() && (
            <Button variant="ghost" size="sm" onClick={goToCurrentMonth}>
              Today
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {monthData?.monthName} {currentYear}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : monthData ? (
        <>
          {/* Month Summary Stats */}
          <StatsRow>
            <StatCard accentColor="primary">
              <div>
                <p className="text-xs text-muted-foreground">Total Scheduled</p>
                <p className="text-xl font-bold">{monthData.monthSummary.totalScheduled}</p>
                <p className="text-xs text-muted-foreground">
                  ~{monthData.monthSummary.avgPerDay}/day
                </p>
              </div>
            </StatCard>
            <StatCard accentColor="success">
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-xl font-bold">{monthData.monthSummary.totalCompleted}</p>
                <p className="text-xs text-success-600">
                  {monthData.monthSummary.completionRate}% rate
                </p>
              </div>
            </StatCard>
            <StatCard accentColor="warning">
              <div>
                <p className="text-xs text-muted-foreground">Cancelled</p>
                <p className="text-xl font-bold">{monthData.monthSummary.totalCancelled}</p>
              </div>
            </StatCard>
            <StatCard accentColor="accent">
              <div>
                <p className="text-xs text-muted-foreground">Busiest Day</p>
                {monthData.monthSummary.busiestDay ? (
                  <>
                    <p className="text-xl font-bold">{monthData.monthSummary.busiestDay.count}</p>
                    <p className="text-xs text-muted-foreground">
                      on {new Date(monthData.monthSummary.busiestDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </>
                ) : (
                  <p className="text-xl font-bold">-</p>
                )}
              </div>
            </StatCard>
          </StatsRow>

          {/* Calendar Grid */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle size="sm">Monthly Calendar</CardTitle>
                {/* Legend */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-success-100 border border-success-200" />
                    <span>Light</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-primary-100 border border-primary-200" />
                    <span>Normal</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-warning-100 border border-warning-200" />
                    <span>Busy</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-error-100 border border-error-200" />
                    <span>Full</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAY_NAMES.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar cells */}
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarCells().map((cell, index) => (
                  <div
                    key={index}
                    className={cn(
                      'aspect-square p-1 rounded-lg border transition-all',
                      cell ? 'cursor-pointer hover:border-primary' : 'border-transparent',
                      cell && STATUS_COLORS[cell.status],
                      cell?.isToday && 'ring-2 ring-primary ring-offset-1',
                      cell?.isPast && 'opacity-60'
                    )}
                    onClick={() => cell && onDateSelect?.(cell.date)}
                  >
                    {cell && (
                      <div className="h-full flex flex-col">
                        <p className={cn(
                          'text-sm font-medium',
                          cell.isToday && 'text-primary'
                        )}>
                          {cell.day}
                        </p>
                        {cell.stats.scheduled > 0 && (
                          <p className="text-xs text-muted-foreground mt-auto">
                            {cell.stats.scheduled}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Trends */}
          {monthData.weeklyTrends.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle size="sm" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Weekly Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthData.weeklyTrends.map((week) => {
                    const maxScheduled = Math.max(...monthData.weeklyTrends.map((w) => w.scheduled));
                    const barWidth = maxScheduled > 0 ? (week.scheduled / maxScheduled) * 100 : 0;

                    return (
                      <div key={week.weekNumber} className="flex items-center gap-4">
                        <div className="w-16 text-sm text-muted-foreground">
                          Week {week.weekNumber}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-6 bg-primary/80 rounded"
                              style={{ width: `${barWidth}%`, minWidth: week.scheduled > 0 ? '20px' : '0' }}
                            />
                            <span className="text-sm font-medium">{week.scheduled}</span>
                          </div>
                        </div>
                        <div className="w-20 text-right text-sm">
                          <span className="text-success-600">{week.completed}</span>
                          <span className="text-muted-foreground"> done</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appointment Type Distribution */}
          {monthData.appointmentTypeStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle size="sm">Appointment Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {monthData.appointmentTypeStats.slice(0, 5).map((stat) => (
                    <div key={stat.type.id} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stat.type.color || '#94a3b8' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{stat.type.name}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {stat.count} ({stat.percentage}%)
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Provider Stats */}
          {monthData.providerStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle size="sm">Provider Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthData.providerStats.map((stat) => (
                    <div
                      key={stat.provider.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div>
                        <p className="font-medium">
                          Dr. {stat.provider.firstName} {stat.provider.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {stat.scheduled} scheduled (~{stat.avgPerDay}/day)
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="success">{stat.completed} done</Badge>
                        {stat.cancelled > 0 && (
                          <Badge variant="error">{stat.cancelled} cancelled</Badge>
                        )}
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
          No data available for this month
        </div>
      )}
    </div>
  );
}
