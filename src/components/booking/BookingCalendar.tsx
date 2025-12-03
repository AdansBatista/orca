'use client';

import { useCallback, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DateSelectArg, DatesSetArg, EventDropArg } from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';

import '@/styles/fullcalendar.css';

/**
 * Calendar event extended props
 */
export interface CalendarEventExtendedProps {
  appointmentId: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  appointmentTypeId: string;
  appointmentTypeName: string;
  appointmentTypeCode: string;
  status: string;
  confirmationStatus: string;
  chairId: string | null;
  chairName: string | null;
  roomId: string | null;
  roomName: string | null;
  duration: number;
  notes: string | null;
}

/**
 * Calendar event type
 */
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: CalendarEventExtendedProps;
}

/**
 * Props for the BookingCalendar component
 */
interface BookingCalendarProps {
  /** Provider IDs to filter appointments by */
  providerIds?: string[];
  /** Callback when an event is clicked */
  onEventClick?: (appointmentId: string, event: CalendarEvent) => void;
  /** Callback when a date/time is selected for creating an appointment */
  onDateSelect?: (startTime: Date, endTime: Date) => void;
  /** Callback when an event is dragged/dropped (for rescheduling) */
  onEventDrop?: (appointmentId: string, newStart: Date, newEnd: Date) => Promise<boolean>;
  /** Callback when an event is resized */
  onEventResize?: (appointmentId: string, newStart: Date, newEnd: Date) => Promise<boolean>;
  /** Initial view mode */
  initialView?: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth';
  /** Whether to allow editing (drag, resize) */
  editable?: boolean;
  /** Business hours config */
  businessHours?: {
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
  };
  /** Slot duration in minutes */
  slotDuration?: number;
  /** Initial date to display */
  initialDate?: Date;
}

/**
 * BookingCalendar - FullCalendar wrapper for appointment scheduling
 *
 * Displays appointments in day/week/month views with support for:
 * - Event clicking (view details)
 * - Date selection (create appointments)
 * - Drag and drop (reschedule)
 * - Resize events (change duration)
 */
export function BookingCalendar({
  providerIds,
  onEventClick,
  onDateSelect,
  onEventDrop,
  onEventResize,
  initialView = 'timeGridWeek',
  editable = false,
  businessHours = {
    daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
    startTime: '08:00',
    endTime: '18:00',
  },
  slotDuration = 15,
  initialDate,
}: BookingCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch events from the calendar API
   */
  const fetchEvents = useCallback(async (start: Date, end: Date) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });

      if (providerIds && providerIds.length > 0) {
        params.set('providerIds', providerIds.join(','));
      }

      const response = await fetch(`/api/booking/calendar?${params}`);
      const result = await response.json();

      if (result.success) {
        setEvents(result.data);
      } else {
        setError(result.error?.message || 'Failed to load appointments');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Calendar fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [providerIds]);

  /**
   * Handle date range changes (when user navigates)
   */
  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    fetchEvents(arg.start, arg.end);
  }, [fetchEvents]);

  /**
   * Handle event click
   */
  const handleEventClick = useCallback((arg: EventClickArg) => {
    const event = arg.event;
    const extendedProps = event.extendedProps as CalendarEventExtendedProps;
    const calendarEvent: CalendarEvent = {
      id: event.id,
      title: event.title,
      start: event.start?.toISOString() || '',
      end: event.end?.toISOString() || '',
      allDay: event.allDay,
      backgroundColor: event.backgroundColor,
      borderColor: event.borderColor,
      textColor: event.textColor,
      extendedProps,
    };
    onEventClick?.(extendedProps.appointmentId, calendarEvent);
  }, [onEventClick]);

  /**
   * Handle date selection (for creating new appointments)
   */
  const handleDateSelect = useCallback((arg: DateSelectArg) => {
    onDateSelect?.(arg.start, arg.end);
    // Clear the selection
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.unselect();
  }, [onDateSelect]);

  /**
   * Handle event drop (drag and drop rescheduling)
   */
  const handleEventDrop = useCallback(async (arg: EventDropArg) => {
    if (!onEventDrop) {
      arg.revert();
      return;
    }

    const extendedProps = arg.event.extendedProps as CalendarEventExtendedProps;
    const appointmentId = extendedProps.appointmentId;
    const newStart = arg.event.start;
    const newEnd = arg.event.end;

    if (!newStart || !newEnd) {
      arg.revert();
      return;
    }

    const success = await onEventDrop(appointmentId, newStart, newEnd);
    if (!success) {
      arg.revert();
    }
  }, [onEventDrop]);

  /**
   * Handle event resize
   */
  const handleEventResize = useCallback(async (arg: EventResizeDoneArg) => {
    if (!onEventResize) {
      arg.revert();
      return;
    }

    const extendedProps = arg.event.extendedProps as CalendarEventExtendedProps;
    const appointmentId = extendedProps.appointmentId;
    const newStart = arg.event.start;
    const newEnd = arg.event.end;

    if (!newStart || !newEnd) {
      arg.revert();
      return;
    }

    const success = await onEventResize(appointmentId, newStart, newEnd);
    if (!success) {
      arg.revert();
    }
  }, [onEventResize]);

  return (
    <div className="booking-calendar relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md mb-4">
          {error}
        </div>
      )}

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={initialView}
        initialDate={initialDate}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        editable={editable}
        selectable={!!onDateSelect}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        businessHours={businessHours}
        slotDuration={`00:${slotDuration.toString().padStart(2, '0')}:00`}
        slotLabelInterval="01:00:00"
        slotMinTime="06:00:00"
        slotMaxTime="21:00:00"
        allDaySlot={false}
        nowIndicator={true}
        eventClick={handleEventClick}
        select={handleDateSelect}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        datesSet={handleDatesSet}
        height="auto"
        aspectRatio={1.8}
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short',
        }}
        eventDisplay="block"
        eventOverlap={false}
        slotEventOverlap={false}
      />
    </div>
  );
}
