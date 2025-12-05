'use client';

import { Clock, Minimize2, Maximize2, Settings2, Calendar, CalendarDays, CalendarRange, CalendarOff, CalendarX2, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';

interface CalendarViewSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slotDuration: number;
  onSlotDurationChange: (duration: number) => void;
  density: 'condensed' | 'regular';
  onDensityChange: (density: 'condensed' | 'regular') => void;
  currentView: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth';
  onViewChange: (view: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth') => void;
  weekendDisplay: 'normal' | 'narrow' | 'hidden';
  onWeekendDisplayChange: (display: 'normal' | 'narrow' | 'hidden') => void;
}

const TIME_INTERVALS = [
  { value: 15, label: '15 minutes', short: '15m' },
  { value: 30, label: '30 minutes', short: '30m' },
  { value: 60, label: '1 hour', short: '1h' },
];

const DENSITY_OPTIONS = [
  {
    value: 'condensed' as const,
    label: 'Condensed',
    icon: Minimize2,
    description: 'Compact view, fits more on screen'
  },
  {
    value: 'regular' as const,
    label: 'Regular',
    icon: Maximize2,
    description: 'Comfortable spacing, easier to read'
  },
];

const VIEW_TYPES = [
  {
    value: 'timeGridDay' as const,
    label: 'Day',
    icon: Calendar,
    description: 'Single day view'
  },
  {
    value: 'timeGridWeek' as const,
    label: 'Week',
    icon: CalendarRange,
    description: '7-day week view'
  },
  {
    value: 'dayGridMonth' as const,
    label: 'Month',
    icon: CalendarDays,
    description: 'Monthly overview'
  },
];

const WEEKEND_DISPLAY_OPTIONS = [
  {
    value: 'normal' as const,
    label: 'Normal',
    icon: Eye,
    description: 'Show weekends at full width'
  },
  {
    value: 'narrow' as const,
    label: 'Narrow',
    icon: CalendarOff,
    description: 'Show weekends at reduced width'
  },
  {
    value: 'hidden' as const,
    label: 'Hidden',
    icon: CalendarX2,
    description: 'Hide weekends completely'
  },
];

export function CalendarViewSettingsDialog({
  open,
  onOpenChange,
  slotDuration,
  onSlotDurationChange,
  density,
  onDensityChange,
  currentView,
  onViewChange,
  weekendDisplay,
  onWeekendDisplayChange,
}: CalendarViewSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Calendar View Settings
          </DialogTitle>
          <DialogDescription>
            Customize how the calendar displays appointments and time slots
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* View Type Settings */}
          <Card variant="ghost">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-semibold">Calendar View</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Choose between day, week, or month view
              </p>
              <div className="grid grid-cols-3 gap-2">
                {VIEW_TYPES.map((viewType) => {
                  const Icon = viewType.icon;
                  return (
                    <Button
                      key={viewType.value}
                      variant={currentView === viewType.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onViewChange(viewType.value)}
                    >
                      <Icon className="h-3.5 w-3.5 mr-1.5" />
                      {viewType.label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Time Interval Settings */}
          <Card variant="ghost">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-semibold">Time Interval</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Choose how time slots are divided on the calendar
              </p>
              <div className="grid grid-cols-3 gap-2">
                {TIME_INTERVALS.map((interval) => (
                  <Button
                    key={interval.value}
                    variant={slotDuration === interval.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onSlotDurationChange(interval.value)}
                  >
                    {interval.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Density Settings */}
          <Card variant="ghost">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Maximize2 className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-semibold">View Density</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Adjust spacing to see more or less information at once
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DENSITY_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.value}
                      variant={density === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onDensityChange(option.value)}
                    >
                      <Icon className="h-3.5 w-3.5 mr-1.5" />
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Weekend Display Settings */}
          <Card variant="ghost">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CalendarOff className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-semibold">Weekend Display</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Control how weekends and days-off appear in the calendar
              </p>
              <div className="grid grid-cols-3 gap-2">
                {WEEKEND_DISPLAY_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.value}
                      variant={weekendDisplay === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onWeekendDisplayChange(option.value)}
                    >
                      <Icon className="h-3.5 w-3.5 mr-1.5" />
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
