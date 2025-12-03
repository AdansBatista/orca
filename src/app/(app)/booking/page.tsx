'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Settings, Plus, Filter, RefreshCw } from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { BookingCalendar, CalendarEvent } from '@/components/booking';
import { AppointmentQuickView } from '@/components/booking/AppointmentQuickView';
import { toast } from 'sonner';

export default function BookingPage() {
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);

  // Handle event click - show quick view
  const handleEventClick = useCallback((appointmentId: string, event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowQuickView(true);
  }, []);

  // Handle date selection - open new appointment form
  const handleDateSelect = useCallback((startTime: Date, endTime: Date) => {
    // Navigate to new appointment page with pre-filled times
    const params = new URLSearchParams({
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    });
    window.location.href = `/booking/appointments/new?${params}`;
  }, []);

  // Handle event drop (reschedule)
  const handleEventDrop = useCallback(async (
    appointmentId: string,
    newStart: Date,
    newEnd: Date
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/booking/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
        }),
      });
      const result = await response.json();

      if (result.success) {
        toast.success('Appointment rescheduled');
        return true;
      } else {
        toast.error(result.error?.message || 'Failed to reschedule');
        return false;
      }
    } catch {
      toast.error('Failed to reschedule appointment');
      return false;
    }
  }, []);

  // Handle event resize (change duration)
  const handleEventResize = useCallback(async (
    appointmentId: string,
    newStart: Date,
    newEnd: Date
  ): Promise<boolean> => {
    const duration = Math.round((newEnd.getTime() - newStart.getTime()) / (1000 * 60));
    try {
      const response = await fetch(`/api/booking/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
          duration,
        }),
      });
      const result = await response.json();

      if (result.success) {
        toast.success('Appointment duration updated');
        return true;
      } else {
        toast.error(result.error?.message || 'Failed to update duration');
        return false;
      }
    } catch {
      toast.error('Failed to update appointment');
      return false;
    }
  }, []);

  return (
    <>
      <PageHeader
        title="Booking Calendar"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Booking' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/booking/settings/appointment-types">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Link href="/booking/appointments/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </Button>
            </Link>
          </div>
        }
      />

      <PageContent density="comfortable">
        <div className="space-y-4">
          {/* Quick filters bar */}
          <Card variant="ghost">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filter:</span>
                  </div>
                  {/* Provider filter would go here - needs providers API */}
                  <Select value="all" onValueChange={() => {}}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="All Providers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Providers</SelectItem>
                      {/* Provider options would be populated from API */}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  {/* Legend */}
                  <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-sm bg-[#3B82F6]" />
                      <span>Scheduled</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-sm bg-[#F59E0B]" />
                      <span>In Progress</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-sm bg-[#10B981]" />
                      <span>Completed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-sm bg-[#9CA3AF]" />
                      <span>Cancelled</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card>
            <CardContent className="p-4">
              <BookingCalendar
                providerIds={selectedProviders.length > 0 ? selectedProviders : undefined}
                onEventClick={handleEventClick}
                onDateSelect={handleDateSelect}
                onEventDrop={handleEventDrop}
                onEventResize={handleEventResize}
                editable={true}
                initialView="timeGridWeek"
              />
            </CardContent>
          </Card>
        </div>
      </PageContent>

      {/* Appointment Quick View Sheet */}
      <Sheet open={showQuickView} onOpenChange={setShowQuickView}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Appointment Details</SheetTitle>
          </SheetHeader>
          {selectedEvent && (
            <AppointmentQuickView
              event={selectedEvent}
              onClose={() => setShowQuickView(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
