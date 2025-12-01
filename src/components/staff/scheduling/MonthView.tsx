'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { StaffShift, StaffProfile } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

type ShiftWithStaff = StaffShift & {
  staffProfile?: Pick<StaffProfile, 'id' | 'firstName' | 'lastName' | 'title'>;
};

interface MonthViewProps {
  staffProfileId?: string;
  locationId?: string;
  onShiftClick?: (shift: ShiftWithStaff) => void;
  onDayClick?: (date: Date) => void;
}

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-500',
  CONFIRMED: 'bg-green-500',
  IN_PROGRESS: 'bg-yellow-500',
  COMPLETED: 'bg-gray-500',
  CANCELLED: 'bg-red-500',
  NO_SHOW: 'bg-red-500',
  SWAP_PENDING: 'bg-orange-500',
};

export function MonthView({
  staffProfileId,
  locationId,
  onShiftClick,
  onDayClick,
}: MonthViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<ShiftWithStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get first and last day of the month display (includes padding for full weeks)
  const { monthStart, monthEnd, displayStart, displayEnd } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    // Start from the Sunday of the week containing the first day
    const displayStart = new Date(monthStart);
    displayStart.setDate(displayStart.getDate() - displayStart.getDay());

    // End on the Saturday of the week containing the last day
    const displayEnd = new Date(monthEnd);
    displayEnd.setDate(displayEnd.getDate() + (6 - displayEnd.getDay()));

    return { monthStart, monthEnd, displayStart, displayEnd };
  }, [currentDate]);

  // Generate array of dates for the display grid
  const calendarDates = useMemo(() => {
    const dates: Date[] = [];
    const current = new Date(displayStart);

    while (current <= displayEnd) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }, [displayStart, displayEnd]);

  // Fetch shifts for the month
  useEffect(() => {
    const fetchShifts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('startDate', displayStart.toISOString());
        params.set('endDate', displayEnd.toISOString());
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
  }, [displayStart, displayEnd, staffProfileId, locationId]);

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

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const handleDayClick = (date: Date) => {
    const dateKey = date.toDateString();
    const dayShifts = shiftsByDate[dateKey] || [];

    if (dayShifts.length > 0) {
      setSelectedDate(date);
    } else if (onDayClick) {
      onDayClick(date);
    }
  };

  const selectedDayShifts = selectedDate
    ? shiftsByDate[selectedDate.toDateString()] || []
    : [];

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {daysOfWeek.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDates.map((date, index) => {
                const dateKey = date.toDateString();
                const dayShifts = shiftsByDate[dateKey] || [];
                const shiftCount = dayShifts.length;

                // Count by status
                const statusCounts: Record<string, number> = {};
                dayShifts.forEach((shift) => {
                  statusCounts[shift.status] = (statusCounts[shift.status] || 0) + 1;
                });

                return (
                  <button
                    key={index}
                    onClick={() => handleDayClick(date)}
                    className={`
                      min-h-[80px] p-2 rounded-lg border text-left transition-colors
                      ${isCurrentMonth(date) ? 'bg-background' : 'bg-muted/30 text-muted-foreground'}
                      ${isToday(date) ? 'border-primary border-2' : 'border-border'}
                      ${shiftCount > 0 ? 'hover:bg-accent cursor-pointer' : ''}
                    `}
                  >
                    <div className={`text-sm font-medium ${isToday(date) ? 'text-primary' : ''}`}>
                      {date.getDate()}
                    </div>

                    {shiftCount > 0 && (
                      <div className="mt-1 space-y-1">
                        {/* Show shift dots */}
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(statusCounts).map(([status, count]) => (
                            <div key={status} className="flex items-center gap-0.5">
                              <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
                              <span className="text-[10px] text-muted-foreground">{count}</span>
                            </div>
                          ))}
                        </div>

                        {/* Show total count */}
                        <Badge variant="soft-secondary" className="text-[10px]">
                          {shiftCount} shift{shiftCount !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day detail dialog */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDate?.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {selectedDayShifts.map((shift) => (
              <button
                key={shift.id}
                onClick={() => {
                  setSelectedDate(null);
                  onShiftClick?.(shift);
                }}
                className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {shift.staffProfile ? (
                        <PhiProtected fakeData={getFakeName()}>
                          {shift.staffProfile.firstName} {shift.staffProfile.lastName}
                        </PhiProtected>
                      ) : (
                        'Unknown Staff'
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                    </div>
                    {shift.staffProfile?.title && (
                      <div className="text-xs text-muted-foreground">
                        {shift.staffProfile.title}
                      </div>
                    )}
                  </div>
                  <Badge
                    variant={
                      shift.status === 'COMPLETED' ? 'success' :
                      shift.status === 'CANCELLED' ? 'destructive' :
                      shift.status === 'CONFIRMED' ? 'success' :
                      'info'
                    }
                  >
                    {shift.status.replace('_', ' ')}
                  </Badge>
                </div>
              </button>
            ))}

            {selectedDayShifts.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No shifts scheduled for this day
              </p>
            )}
          </div>

          {onDayClick && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                if (selectedDate) {
                  onDayClick(selectedDate);
                  setSelectedDate(null);
                }
              }}
            >
              Add Shift
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
