'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, Grid3X3 } from 'lucide-react';
import type { StaffShift, StaffProfile } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';
import { MonthView } from './MonthView';

type ShiftWithStaff = StaffShift & {
  staffProfile?: Pick<StaffProfile, 'id' | 'firstName' | 'lastName' | 'title'>;
};

type ViewMode = 'week' | 'month';

interface ScheduleCalendarProps {
  staffProfileId?: string;
  locationId?: string;
  onShiftClick?: (shift: ShiftWithStaff) => void;
  onAddShift?: (date: Date) => void;
  defaultView?: ViewMode;
}

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  CONFIRMED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  COMPLETED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  NO_SHOW: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  SWAP_PENDING: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

export function ScheduleCalendar({
  staffProfileId,
  locationId,
  onShiftClick,
  onAddShift,
  defaultView = 'week',
}: ScheduleCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<ShiftWithStaff[]>([]);
  const [loading, setLoading] = useState(true);

  // Get start and end of the week
  const weekStart = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
  }, [currentDate]);

  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [weekStart]);

  // Generate array of dates for the week
  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [weekStart]);

  // Fetch shifts for the week
  useEffect(() => {
    const fetchShifts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('startDate', weekStart.toISOString());
        params.set('endDate', weekEnd.toISOString());
        if (staffProfileId) params.set('staffProfileId', staffProfileId);
        if (locationId) params.set('locationId', locationId);

        const response = await fetch(`/api/staff/schedules?${params.toString()}`);
        const result = await response.json();

        if (result.success) {
          setShifts(result.data.items);
        }
      } catch (error) {
        console.error('Failed to fetch shifts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
  }, [weekStart, weekEnd, staffProfileId, locationId]);

  // Group shifts by date
  const shiftsByDate = useMemo(() => {
    const grouped: Record<string, ShiftWithStaff[]> = {};
    shifts.forEach((shift) => {
      const dateKey = new Date(shift.shiftDate).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(shift);
    });
    return grouped;
  }, [shifts]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // View toggle component shared by both views
  const viewToggle = (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      <Button
        variant={viewMode === 'week' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('week')}
      >
        <Grid3X3 className="h-4 w-4 mr-1" />
        Week
      </Button>
      <Button
        variant={viewMode === 'month' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('month')}
      >
        <Calendar className="h-4 w-4 mr-1" />
        Month
      </Button>
    </div>
  );

  // Render month view
  if (viewMode === 'month') {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          {viewToggle}
        </div>
        <MonthView
          staffProfileId={staffProfileId}
          locationId={locationId}
          onShiftClick={onShiftClick}
          onDayClick={onAddShift}
        />
      </div>
    );
  }

  // Render week view
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Week of {weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </CardTitle>
          <div className="flex items-center gap-4">
            {viewToggle}

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {/* Headers */}
            {weekDates.map((date, index) => (
              <div
                key={`header-${index}`}
                className={`text-center p-2 rounded-t-lg ${
                  isToday(date) ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
              >
                <div className="text-xs font-medium">{daysOfWeek[index]}</div>
                <div className="text-lg font-semibold">{date.getDate()}</div>
              </div>
            ))}

            {/* Day columns */}
            {weekDates.map((date, index) => {
              const dateKey = date.toDateString();
              const dayShifts = shiftsByDate[dateKey] || [];

              return (
                <div
                  key={`day-${index}`}
                  className={`min-h-[200px] border rounded-b-lg p-2 space-y-1 ${
                    isToday(date) ? 'border-primary' : 'border-border'
                  }`}
                >
                  {dayShifts.map((shift) => (
                    <button
                      key={shift.id}
                      onClick={() => onShiftClick?.(shift)}
                      className={`w-full text-left p-2 rounded text-xs ${statusColors[shift.status]} hover:opacity-80 transition-opacity`}
                    >
                      <div className="font-medium truncate">
                        {shift.staffProfile ? (
                          <PhiProtected fakeData={getFakeName()}>
                            {shift.staffProfile.firstName} {shift.staffProfile.lastName.charAt(0)}.
                          </PhiProtected>
                        ) : (
                          'Unknown'
                        )}
                      </div>
                      <div className="text-[10px] opacity-80">
                        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                      </div>
                    </button>
                  ))}

                  {onAddShift && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 text-xs"
                      onClick={() => onAddShift(date)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
