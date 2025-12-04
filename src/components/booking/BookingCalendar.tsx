'use client';

import { useCallback, useRef, useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DateSelectArg, DatesSetArg, EventDropArg, EventInput, EventMountArg } from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';

import { Loader2, AlertCircle } from 'lucide-react';

import '@/styles/fullcalendar.css';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
 * Booking zone extended props
 */
export interface BookingZoneExtendedProps {
  type: 'booking-zone';
  templateId: string;
  templateName: string;
  appointmentTypeIds: string[];
  appointmentTypeNames: string[];
  isBlocked: boolean;
  blockReason: string | null;
  label: string | null;
}

/**
 * Booking zone event type (background event)
 */
export interface BookingZoneEvent {
  id: string;
  start: string;
  end: string;
  display: 'background';
  backgroundColor: string;
  borderColor: string;
  extendedProps: BookingZoneExtendedProps;
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
  onDateSelect?: (startTime: Date, endTime: Date, zone?: BookingZoneExtendedProps) => void;
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
  /** Whether to show booking zones as background events */
  showZones?: boolean;
  /** Callback when booking zone mismatch occurs */
  onZoneMismatch?: (zone: BookingZoneExtendedProps, selectedTypeId: string) => void;
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
  showZones = true,
  onZoneMismatch,
}: BookingCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [zones, setZones] = useState<BookingZoneEvent[]>([]);
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

      // Fetch appointments and zones in parallel
      const [eventsResponse, zonesResponse] = await Promise.all([
        fetch(`/api/booking/calendar?${params}`),
        showZones ? fetch(`/api/booking/calendar/zones?${params}`) : Promise.resolve(null),
      ]);

      const eventsResult = await eventsResponse.json();

      if (eventsResult.success) {
        setEvents(eventsResult.data);
      } else {
        setError(eventsResult.error?.message || 'Failed to load appointments');
      }

      // Handle zones
      if (zonesResponse) {
        const zonesResult = await zonesResponse.json();
        if (zonesResult.success) {
          setZones(zonesResult.data);
        }
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Calendar fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [providerIds, showZones]);

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
   * Find the zone that contains a specific time slot
   */
  const findZoneForTime = useCallback((start: Date, end: Date): BookingZoneExtendedProps | undefined => {
    // Find a zone that overlaps with the selected time
    for (const zone of zones) {
      const zoneStart = new Date(zone.start);
      const zoneEnd = new Date(zone.end);

      // Check if the selected time falls within this zone
      if (start >= zoneStart && end <= zoneEnd) {
        return zone.extendedProps;
      }
    }
    return undefined;
  }, [zones]);

  /**
   * Handle date selection (for creating new appointments)
   */
  const handleDateSelect = useCallback((arg: DateSelectArg) => {
    // Find the zone for this time slot
    const zone = findZoneForTime(arg.start, arg.end);
    onDateSelect?.(arg.start, arg.end, zone);
    // Clear the selection
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.unselect();
  }, [onDateSelect, findZoneForTime]);

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

  /**
   * Add tooltips to booking zone background events
   */
  const handleEventDidMount = useCallback((arg: EventMountArg) => {
    const extendedProps = arg.event.extendedProps;

    // Only add tooltip to booking zones (background events)
    if (extendedProps?.type === 'booking-zone') {
      const zoneProps = extendedProps as BookingZoneExtendedProps;

      // Build tooltip text
      let tooltipText = '';
      if (zoneProps.isBlocked) {
        tooltipText = zoneProps.blockReason || 'Blocked';
      } else if (zoneProps.label) {
        tooltipText = zoneProps.label;
      } else if (zoneProps.appointmentTypeNames.length > 0) {
        tooltipText = zoneProps.appointmentTypeNames.join(', ');
      } else {
        tooltipText = 'Open slot';
      }

      // Add template name
      tooltipText += `\nTemplate: ${zoneProps.templateName}`;

      // Set native title attribute for hover tooltip
      arg.el.setAttribute('title', tooltipText);
      arg.el.style.cursor = 'help';
    }
  }, []);

  /**
   * Get unique zone types for legend
   */
  const zoneLegend = useMemo(() => {
    if (!showZones || zones.length === 0) return [];

    const legendItems = new Map<string, { label: string; color: string; count: number }>();

    for (const zone of zones) {
      const props = zone.extendedProps;
      let key: string;
      let label: string;

      if (props.isBlocked) {
        key = props.blockReason || 'Blocked';
        label = props.blockReason || 'Blocked';
      } else if (props.appointmentTypeNames.length > 0) {
        key = props.appointmentTypeNames.join(', ');
        label = props.appointmentTypeNames.join(', ');
      } else if (props.label) {
        key = props.label;
        label = props.label;
      } else {
        key = 'Open';
        label = 'Open slot';
      }

      const existing = legendItems.get(key);
      if (existing) {
        existing.count++;
      } else {
        legendItems.set(key, {
          label,
          color: zone.borderColor,
          count: 1,
        });
      }
    }

    return Array.from(legendItems.values()).slice(0, 6); // Limit to 6 items
  }, [zones, showZones]);

  /**
   * Combine regular events with zone background events
   */
  const allEvents = useMemo((): EventInput[] => {
    const combined: EventInput[] = [...events];

    if (showZones) {
      for (const zone of zones) {
        combined.push({
          id: zone.id,
          start: zone.start,
          end: zone.end,
          display: 'background',
          backgroundColor: zone.backgroundColor,
          borderColor: zone.borderColor,
          extendedProps: zone.extendedProps,
        });
      }
    }

    return combined;
  }, [events, zones, showZones]);

  return (
    <TooltipProvider>
      <div className="booking-calendar relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Zone Legend */}
        {zoneLegend.length > 0 && (
          <div className="flex items-center gap-4 mb-3 px-1 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">Booking Zones:</span>
            {zoneLegend.map((item, idx) => (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 cursor-help">
                    <div
                      className="w-3 h-3 rounded-sm border-l-[3px]"
                      style={{
                        backgroundColor: `${item.color}50`,
                        borderColor: item.color,
                      }}
                    />
                    <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                      {item.label}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.count} time slot{item.count !== 1 ? 's' : ''} this week
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}
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
        events={allEvents}
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
        eventDidMount={handleEventDidMount}
      />
      </div>
    </TooltipProvider>
  );
}
