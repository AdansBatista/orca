'use client';

import { Clock, Minimize2, Maximize2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface CalendarViewControlsProps {
  slotDuration: number;
  onSlotDurationChange: (duration: number) => void;
  density: 'condensed' | 'regular';
  onDensityChange: (density: 'condensed' | 'regular') => void;
}

const TIME_INTERVALS = [
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 60, label: '1h' },
];

const DENSITY_OPTIONS = [
  { value: 'condensed' as const, label: 'Condensed', icon: Minimize2 },
  { value: 'regular' as const, label: 'Regular', icon: Maximize2 },
];

export function CalendarViewControls({
  slotDuration,
  onSlotDurationChange,
  density,
  onDensityChange,
}: CalendarViewControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Time Interval Controls */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Interval:</Label>
        </div>
        <div className="flex items-center gap-1">
          {TIME_INTERVALS.map((interval) => (
            <Button
              key={interval.value}
              variant={slotDuration === interval.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSlotDurationChange(interval.value)}
              className="min-w-[55px]"
            >
              {interval.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Separator */}
      <div className="h-6 w-px bg-border hidden xl:block" />

      {/* Density Controls */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">View:</Label>
        <div className="flex items-center gap-1">
          {DENSITY_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.value}
                variant={density === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onDensityChange(option.value)}
                className="min-w-[100px]"
              >
                <Icon className="h-3.5 w-3.5 mr-1.5" />
                {option.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
