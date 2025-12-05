'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Settings, Plus, Filter, RefreshCw, List, Settings2, ChevronLeft, ChevronRight } from 'lucide-react';
import type FullCalendar from '@fullcalendar/react';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
} from '@/components/ui/sheet';
import { BookingCalendar, CalendarEvent } from '@/components/booking';
import { CalendarViewSettingsDialog } from '@/components/booking/CalendarViewSettingsDialog';
import { AppointmentQuickView } from '@/components/booking/AppointmentQuickView';
import { toast } from 'sonner';

interface Provider {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
}

export default function BookingPage() {
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [calendarKey, setCalendarKey] = useState(0); // Force calendar refresh

  // View controls state
  const [slotDuration, setSlotDuration] = useState(15);
  const [density, setDensity] = useState<'condensed' | 'regular'>('regular');
  const [showViewSettings, setShowViewSettings] = useState(false);
  const [currentView, setCurrentView] = useState<'timeGridDay' | 'timeGridWeek' | 'dayGridMonth'>('timeGridWeek');
  const [weekendDisplay, setWeekendDisplay] = useState<'normal' | 'narrow' | 'hidden'>('normal');

  // Ref to access calendar API
  const calendarRef = useRef<FullCalendar>(null);

  // Fetch providers on mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch('/api/staff?isProvider=true&status=ACTIVE&pageSize=50');
        const result = await response.json();
        if (result.success) {
          setProviders(result.data.items || []);
        }
      } catch {
        toast.error('Failed to load providers');
      } finally {
        setLoadingProviders(false);
      }
    };
    fetchProviders();
  }, []);

  // Refresh calendar data
  const handleRefreshCalendar = useCallback(() => {
    setCalendarKey((prev) => prev + 1);
  }, []);

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
    if (selectedProvider && selectedProvider !== 'all') {
      params.set('provider', selectedProvider);
    }
    window.location.href = `/booking/appointments/new?${params}`;
  }, [selectedProvider]);

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

  // Handle status change from quick view - refresh calendar
  const handleStatusChange = useCallback(() => {
    handleRefreshCalendar();
  }, [handleRefreshCalendar]);

  // Navigation handlers for calendar
  const handlePrevious = useCallback(() => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.prev();
  }, []);

  const handleNext = useCallback(() => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.next();
  }, []);

  const handleToday = useCallback(() => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.today();
  }, []);

  // Get provider IDs for filtering
  const providerIds = selectedProvider && selectedProvider !== 'all' ? [selectedProvider] : undefined;

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
            <Link href="/booking/appointments">
              <Button variant="outline" size="sm">
                <List className="h-4 w-4 mr-2" />
                List View
              </Button>
            </Link>
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
          {/* Filters and View Controls - Single Row */}
          <Card variant="ghost">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Provider Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Filter:</span>
                  <Select
                    value={selectedProvider}
                    onValueChange={setSelectedProvider}
                    disabled={loadingProviders}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={loadingProviders ? 'Loading...' : 'All Providers'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Providers</SelectItem>
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.firstName} {provider.lastName}
                          {provider.title && ` - ${provider.title}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleRefreshCalendar}
                    title="Refresh calendar"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={handlePrevious}
                    title="Previous"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToday}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={handleNext}
                    title="Next"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* View Settings Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowViewSettings(true)}
                  className="ml-auto"
                >
                  <Settings2 className="h-4 w-4 mr-2" />
                  View Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card>
            <CardContent className="p-0">
              <BookingCalendar
                key={calendarKey}
                ref={calendarRef}
                providerIds={providerIds}
                onEventClick={handleEventClick}
                onDateSelect={handleDateSelect}
                onEventDrop={handleEventDrop}
                onEventResize={handleEventResize}
                editable={true}
                initialView="timeGridWeek"
                slotDuration={slotDuration}
                density={density}
                currentView={currentView}
                onViewChange={setCurrentView}
                hideHeader={true}
                weekendDisplay={weekendDisplay}
              />
            </CardContent>
          </Card>
        </div>
      </PageContent>

      {/* View Settings Dialog */}
      <CalendarViewSettingsDialog
        open={showViewSettings}
        onOpenChange={setShowViewSettings}
        slotDuration={slotDuration}
        onSlotDurationChange={setSlotDuration}
        density={density}
        onDensityChange={setDensity}
        currentView={currentView}
        onViewChange={setCurrentView}
        weekendDisplay={weekendDisplay}
        onWeekendDisplayChange={setWeekendDisplay}
      />

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
              onStatusChange={handleStatusChange}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
