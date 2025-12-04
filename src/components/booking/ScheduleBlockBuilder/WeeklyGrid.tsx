'use client';

import { useState, useCallback } from 'react';
import { DayColumn } from './DayColumn';
import {
  type ScheduleBlock,
  type AppointmentType,
  DAYS_OF_WEEK,
  GRID_CONFIG,
  generateId,
} from './types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface WeeklyGridProps {
  blocks: ScheduleBlock[];
  appointmentTypes: AppointmentType[];
  onChange: (blocks: ScheduleBlock[]) => void;
  startDay?: number; // 0=Sunday, 1=Monday
}

export function WeeklyGrid({
  blocks,
  appointmentTypes,
  onChange,
  startDay = 1, // Start with Monday by default
}: WeeklyGridProps) {
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copySourceDay, setCopySourceDay] = useState<number | null>(null);
  const [copyTargetDays, setCopyTargetDays] = useState<number[]>([]);

  // Reorder days to start with startDay
  const orderedDays = [
    ...DAYS_OF_WEEK.slice(startDay),
    ...DAYS_OF_WEEK.slice(0, startDay),
  ];

  // Get blocks for a specific day
  const getBlocksForDay = useCallback(
    (dayOfWeek: number) => blocks.filter((b) => b.dayOfWeek === dayOfWeek),
    [blocks]
  );

  // Check if a day is marked as day off
  const isDayOff = useCallback(
    (dayOfWeek: number): boolean => {
      const dayBlocks = getBlocksForDay(dayOfWeek);
      return (
        dayBlocks.length === 1 &&
        dayBlocks[0].isBlocked === true &&
        (dayBlocks[0].blockReason?.toLowerCase().includes('day off') ?? false)
      );
    },
    [getBlocksForDay]
  );

  // Update blocks for a specific day
  const handleDayBlocksChange = useCallback(
    (dayOfWeek: number, dayBlocks: ScheduleBlock[]) => {
      const otherBlocks = blocks.filter((b) => b.dayOfWeek !== dayOfWeek);
      onChange([...otherBlocks, ...dayBlocks]);
    },
    [blocks, onChange]
  );

  // Handle copy day
  const handleCopyDay = useCallback((sourceDay: number) => {
    setCopySourceDay(sourceDay);
    setCopyTargetDays([]);
    setCopyDialogOpen(true);
  }, []);

  // Execute copy
  const executeCopy = useCallback(() => {
    if (copySourceDay === null || copyTargetDays.length === 0) return;

    const sourceBlocks = getBlocksForDay(copySourceDay);
    const newBlocks = [...blocks];

    for (const targetDay of copyTargetDays) {
      // Remove existing blocks on target day
      const filtered = newBlocks.filter((b) => b.dayOfWeek !== targetDay);
      newBlocks.length = 0;
      newBlocks.push(...filtered);

      // Copy source blocks to target day with new IDs
      for (const block of sourceBlocks) {
        newBlocks.push({
          ...block,
          id: generateId(),
          dayOfWeek: targetDay,
        });
      }
    }

    onChange(newBlocks);
    setCopyDialogOpen(false);
  }, [copySourceDay, copyTargetDays, blocks, getBlocksForDay, onChange]);

  // Handle clear day
  const handleClearDay = useCallback(
    (dayOfWeek: number) => {
      handleDayBlocksChange(dayOfWeek, []);
    },
    [handleDayBlocksChange]
  );

  // Handle mark day off
  const handleMarkDayOff = useCallback(
    (dayOfWeek: number) => {
      if (isDayOff(dayOfWeek)) {
        // Remove day off
        handleDayBlocksChange(dayOfWeek, []);
      } else {
        // Mark as day off
        const dayOffBlock: ScheduleBlock = {
          id: generateId(),
          dayOfWeek,
          startTime: `${GRID_CONFIG.START_HOUR.toString().padStart(2, '0')}:00`,
          endTime: `${GRID_CONFIG.END_HOUR.toString().padStart(2, '0')}:00`,
          appointmentTypeIds: [],
          isBlocked: true,
          blockReason: 'Day Off',
        };
        handleDayBlocksChange(dayOfWeek, [dayOffBlock]);
      }
    },
    [isDayOff, handleDayBlocksChange]
  );

  // Generate time labels
  const totalSlots =
    ((GRID_CONFIG.END_HOUR - GRID_CONFIG.START_HOUR) * 60) / 30;
  const gridHeight = totalSlots * GRID_CONFIG.SLOT_HEIGHT;

  return (
    <>
      <div className="flex border rounded-lg overflow-hidden bg-background">
        {/* Time Labels */}
        <div className="flex flex-col shrink-0">
          <div className="h-10 border-b bg-muted/30" />
          <div
            className="relative w-14 border-r"
            style={{ height: `${gridHeight}px` }}
          >
            {Array.from({ length: totalSlots }).map((_, i) => {
              if (i % 2 !== 0) return null; // Only show hour labels
              const hour = GRID_CONFIG.START_HOUR + Math.floor(i / 2);
              const period = hour >= 12 ? 'PM' : 'AM';
              const displayHour = hour % 12 || 12;
              return (
                <div
                  key={i}
                  className="absolute right-2 text-[10px] text-muted-foreground -translate-y-1/2"
                  style={{ top: `${i * GRID_CONFIG.SLOT_HEIGHT}px` }}
                >
                  {displayHour}
                  {period}
                </div>
              );
            })}
          </div>
        </div>

        {/* Day Columns */}
        {orderedDays.map((day) => (
          <DayColumn
            key={day.value}
            dayOfWeek={day.value}
            blocks={getBlocksForDay(day.value)}
            appointmentTypes={appointmentTypes}
            onBlocksChange={(dayBlocks) =>
              handleDayBlocksChange(day.value, dayBlocks)
            }
            onCopyDay={() => handleCopyDay(day.value)}
            onClearDay={() => handleClearDay(day.value)}
            onMarkDayOff={() => handleMarkDayOff(day.value)}
            isDayOff={isDayOff(day.value)}
          />
        ))}
      </div>

      {/* Copy Day Dialog */}
      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy Day Schedule</DialogTitle>
            <DialogDescription>
              Copy{' '}
              {copySourceDay !== null
                ? DAYS_OF_WEEK.find((d) => d.value === copySourceDay)?.label
                : ''}{' '}
              blocks to other days
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {DAYS_OF_WEEK.filter((d) => d.value !== copySourceDay).map(
              (day) => (
                <div key={day.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`copy-${day.value}`}
                    checked={copyTargetDays.includes(day.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setCopyTargetDays([...copyTargetDays, day.value]);
                      } else {
                        setCopyTargetDays(
                          copyTargetDays.filter((d) => d !== day.value)
                        );
                      }
                    }}
                  />
                  <Label htmlFor={`copy-${day.value}`}>{day.label}</Label>
                </div>
              )
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={executeCopy}
              disabled={copyTargetDays.length === 0}
            >
              Copy to {copyTargetDays.length} day
              {copyTargetDays.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
