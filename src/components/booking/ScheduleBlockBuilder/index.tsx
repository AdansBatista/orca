'use client';

import { useCallback, useState, useRef } from 'react';
import { Wand2 } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  type DragStartEvent,
  type DragEndEvent,
  type DragMoveEvent,
} from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TypePalette } from './TypePalette';
import { WeeklyGrid } from './WeeklyGrid';
import { type ScheduleBlock, type AppointmentType, type DragItem, generateId, GRID_CONFIG, timeToMinutes, yToTime } from './types';

export type { ScheduleBlock, AppointmentType } from './types';

interface ScheduleBlockBuilderProps {
  blocks: ScheduleBlock[];
  appointmentTypes: AppointmentType[];
  onChange: (blocks: ScheduleBlock[]) => void;
}

// Preset templates
const PRESETS = {
  standardDay: {
    name: 'Standard Clinical Day',
    description: '8am-12pm mixed, lunch, 1pm-5pm mixed',
    generate: (day: number, types: AppointmentType[]): ScheduleBlock[] => {
      const blocks: ScheduleBlock[] = [];
      const typeIds = types.filter((t) => t.isActive).map((t) => t.id);

      if (typeIds.length > 0) {
        // Morning block
        blocks.push({
          id: generateId(),
          dayOfWeek: day,
          startTime: '08:00',
          endTime: '12:00',
          appointmentTypeIds: typeIds.slice(0, 3), // First 3 types
          isBlocked: false,
        });
      }

      // Lunch
      blocks.push({
        id: generateId(),
        dayOfWeek: day,
        startTime: '12:00',
        endTime: '13:00',
        appointmentTypeIds: [],
        isBlocked: true,
        blockReason: 'Lunch',
      });

      if (typeIds.length > 0) {
        // Afternoon block
        blocks.push({
          id: generateId(),
          dayOfWeek: day,
          startTime: '13:00',
          endTime: '17:00',
          appointmentTypeIds: typeIds.slice(0, 3),
          isBlocked: false,
        });
      }

      return blocks;
    },
  },
  newPatientFocus: {
    name: 'New Patient Focus',
    description: 'Morning: new patients, Afternoon: follow-ups',
    generate: (day: number, types: AppointmentType[]): ScheduleBlock[] => {
      const blocks: ScheduleBlock[] = [];
      const newPatientType = types.find(
        (t) =>
          t.isActive &&
          (t.name.toLowerCase().includes('new') ||
            t.name.toLowerCase().includes('consult'))
      );
      const followUpTypes = types.filter(
        (t) => t.isActive && t.id !== newPatientType?.id
      );

      if (newPatientType) {
        blocks.push({
          id: generateId(),
          dayOfWeek: day,
          startTime: '08:00',
          endTime: '12:00',
          appointmentTypeIds: [newPatientType.id],
          isBlocked: false,
          label: 'New Patients',
        });
      }

      blocks.push({
        id: generateId(),
        dayOfWeek: day,
        startTime: '12:00',
        endTime: '13:00',
        appointmentTypeIds: [],
        isBlocked: true,
        blockReason: 'Lunch',
      });

      if (followUpTypes.length > 0) {
        blocks.push({
          id: generateId(),
          dayOfWeek: day,
          startTime: '13:00',
          endTime: '17:00',
          appointmentTypeIds: followUpTypes.slice(0, 3).map((t) => t.id),
          isBlocked: false,
          label: 'Follow-ups',
        });
      }

      return blocks;
    },
  },
  adjustmentDay: {
    name: 'Adjustment Heavy',
    description: 'Full day of adjustments with scan breaks',
    generate: (day: number, types: AppointmentType[]): ScheduleBlock[] => {
      const blocks: ScheduleBlock[] = [];
      const adjustmentType = types.find(
        (t) =>
          t.isActive &&
          (t.name.toLowerCase().includes('adjust') ||
            t.name.toLowerCase().includes('check'))
      );
      const scanType = types.find(
        (t) => t.isActive && t.name.toLowerCase().includes('scan')
      );

      if (adjustmentType) {
        blocks.push({
          id: generateId(),
          dayOfWeek: day,
          startTime: '08:00',
          endTime: '10:00',
          appointmentTypeIds: [adjustmentType.id],
          isBlocked: false,
        });
      }

      if (scanType) {
        blocks.push({
          id: generateId(),
          dayOfWeek: day,
          startTime: '10:00',
          endTime: '11:00',
          appointmentTypeIds: [scanType.id],
          isBlocked: false,
          label: 'Scan Block',
        });
      }

      if (adjustmentType) {
        blocks.push({
          id: generateId(),
          dayOfWeek: day,
          startTime: '11:00',
          endTime: '12:00',
          appointmentTypeIds: [adjustmentType.id],
          isBlocked: false,
        });
      }

      blocks.push({
        id: generateId(),
        dayOfWeek: day,
        startTime: '12:00',
        endTime: '13:00',
        appointmentTypeIds: [],
        isBlocked: true,
        blockReason: 'Lunch',
      });

      if (adjustmentType) {
        blocks.push({
          id: generateId(),
          dayOfWeek: day,
          startTime: '13:00',
          endTime: '17:00',
          appointmentTypeIds: [adjustmentType.id],
          isBlocked: false,
        });
      }

      return blocks;
    },
  },
  standardWeek: {
    name: 'Standard Week',
    description: 'Mon-Thu clinical, Fri off',
    generate: (_day: number, types: AppointmentType[]): ScheduleBlock[] => {
      const blocks: ScheduleBlock[] = [];
      const typeIds = types.filter((t) => t.isActive).map((t) => t.id);

      // Monday through Thursday
      for (let d = 1; d <= 4; d++) {
        if (typeIds.length > 0) {
          blocks.push({
            id: generateId(),
            dayOfWeek: d,
            startTime: '08:00',
            endTime: '12:00',
            appointmentTypeIds: typeIds.slice(0, 3),
            isBlocked: false,
          });
        }

        blocks.push({
          id: generateId(),
          dayOfWeek: d,
          startTime: '12:00',
          endTime: '13:00',
          appointmentTypeIds: [],
          isBlocked: true,
          blockReason: 'Lunch',
        });

        if (typeIds.length > 0) {
          blocks.push({
            id: generateId(),
            dayOfWeek: d,
            startTime: '13:00',
            endTime: '17:00',
            appointmentTypeIds: typeIds.slice(0, 3),
            isBlocked: false,
          });
        }
      }

      // Friday off
      blocks.push({
        id: generateId(),
        dayOfWeek: 5,
        startTime: `${GRID_CONFIG.START_HOUR.toString().padStart(2, '0')}:00`,
        endTime: `${GRID_CONFIG.END_HOUR.toString().padStart(2, '0')}:00`,
        appointmentTypeIds: [],
        isBlocked: true,
        blockReason: 'Day Off',
      });

      return blocks;
    },
  },
};

export function ScheduleBlockBuilder({
  blocks,
  appointmentTypes,
  onChange,
}: ScheduleBlockBuilderProps) {
  const [activeDragItem, setActiveDragItem] = useState<DragItem | null>(null);
  // Track current mouse Y position relative to the current drop target
  const dropPositionRef = useRef<{ dayOfWeek: number; y: number } | null>(null);

  // Configure sensors with activation constraint to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  );

  // Apply a preset template
  const applyPreset = useCallback(
    (presetKey: keyof typeof PRESETS, replaceAll: boolean = false) => {
      const preset = PRESETS[presetKey];
      const newBlocks = preset.generate(1, appointmentTypes); // Day 1 (Monday) for single day presets

      if (replaceAll || presetKey === 'standardWeek') {
        onChange(newBlocks);
      } else {
        // Add to existing blocks
        onChange([...blocks, ...newBlocks]);
      }
    },
    [appointmentTypes, blocks, onChange]
  );

  // Get blocks for a specific day
  const getBlocksForDay = useCallback(
    (dayOfWeek: number) => blocks.filter((b) => b.dayOfWeek === dayOfWeek),
    [blocks]
  );

  // Update blocks for a specific day
  const handleDayBlocksChange = useCallback(
    (dayOfWeek: number, dayBlocks: ScheduleBlock[]) => {
      const otherBlocks = blocks.filter((b) => b.dayOfWeek !== dayOfWeek);
      onChange([...otherBlocks, ...dayBlocks]);
    },
    [blocks, onChange]
  );

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const dragItem = event.active.data.current as DragItem;
    setActiveDragItem(dragItem);
    dropPositionRef.current = null;
  }, []);

  // Handle drag move to track cursor position in real-time
  const handleDragMove = useCallback((event: DragMoveEvent) => {
    if (event.over) {
      const dropData = event.over.data.current as { dayOfWeek: number } | undefined;
      if (dropData) {
        // Get the droppable element's rect
        const overRect = event.over.rect;
        // Get current pointer position from the delta
        const currentY = event.activatorEvent instanceof PointerEvent
          ? event.activatorEvent.clientY + event.delta.y
          : 0;
        // Calculate relative Y position within the droppable
        const relativeY = currentY - overRect.top;
        // Snap to 30-minute slots
        const snappedY = Math.floor(relativeY / GRID_CONFIG.SLOT_HEIGHT) * GRID_CONFIG.SLOT_HEIGHT;
        const clampedY = Math.max(0, Math.min(snappedY, (GRID_CONFIG.END_HOUR - GRID_CONFIG.START_HOUR) * 2 * GRID_CONFIG.SLOT_HEIGHT - GRID_CONFIG.SLOT_HEIGHT));

        dropPositionRef.current = { dayOfWeek: dropData.dayOfWeek, y: clampedY };
      }
    }
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const dropPosition = dropPositionRef.current;
      setActiveDragItem(null);
      dropPositionRef.current = null;

      const { active, over } = event;
      if (!over) return;

      const dragItem = active.data.current as DragItem;
      const dropData = over.data.current as { dayOfWeek: number } | undefined;

      if (!dropData) return;
      const targetDayOfWeek = dropData.dayOfWeek;

      // Handle dropping from palette
      if (
        dragItem.type === 'appointment-type' ||
        dragItem.type === 'blocked' ||
        dragItem.type === 'day-off'
      ) {
        const existingBlocks = getBlocksForDay(targetDayOfWeek);

        // For day-off, replace all blocks with a single day-off block
        if (dragItem.type === 'day-off') {
          const dayOffBlock: ScheduleBlock = {
            id: generateId(),
            dayOfWeek: targetDayOfWeek,
            startTime: `${GRID_CONFIG.START_HOUR.toString().padStart(2, '0')}:00`,
            endTime: `${GRID_CONFIG.END_HOUR.toString().padStart(2, '0')}:00`,
            appointmentTypeIds: [],
            isBlocked: true,
            blockReason: 'Day Off',
          };
          handleDayBlocksChange(targetDayOfWeek, [dayOffBlock]);
          return;
        }

        // Calculate start time from drop position, or use first available slot
        let startTime: string;
        let endTime: string;

        if (dropPosition !== null && dropPosition.y >= 0) {
          // Use the drop position
          startTime = yToTime(dropPosition.y);
          // Default to 2 hours duration
          const startMinutes = timeToMinutes(startTime);
          const endMinutes = Math.min(startMinutes + 120, GRID_CONFIG.END_HOUR * 60);
          endTime = yToTime(((endMinutes - GRID_CONFIG.START_HOUR * 60) / 30) * GRID_CONFIG.SLOT_HEIGHT);
        } else {
          // Fallback: find first available slot
          startTime = `${GRID_CONFIG.START_HOUR.toString().padStart(2, '0')}:00`;
          endTime = `${(GRID_CONFIG.START_HOUR + 2).toString().padStart(2, '0')}:00`;
        }

        // Check for overlaps and adjust if needed
        const sortedBlocks = [...existingBlocks].sort(
          (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
        );

        // Check if our desired position overlaps with existing blocks
        const startMins = timeToMinutes(startTime);
        const endMins = timeToMinutes(endTime);

        let hasOverlap = false;
        for (const block of sortedBlocks) {
          const blockStart = timeToMinutes(block.startTime);
          const blockEnd = timeToMinutes(block.endTime);
          if (startMins < blockEnd && endMins > blockStart) {
            hasOverlap = true;
            break;
          }
        }

        // If overlap, try to find next available slot
        if (hasOverlap) {
          startTime = `${GRID_CONFIG.START_HOUR.toString().padStart(2, '0')}:00`;
          endTime = `${(GRID_CONFIG.START_HOUR + 2).toString().padStart(2, '0')}:00`;

          for (const block of sortedBlocks) {
            if (timeToMinutes(startTime) < timeToMinutes(block.startTime)) {
              endTime = block.startTime;
              break;
            }
            startTime = block.endTime;
            const newEndMinutes = Math.min(timeToMinutes(startTime) + 120, GRID_CONFIG.END_HOUR * 60);
            const hours = Math.floor(newEndMinutes / 60);
            const mins = newEndMinutes % 60;
            endTime = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
          }
        }

        // Validate time
        if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
          return; // No room
        }

        const newBlock: ScheduleBlock = {
          id: generateId(),
          dayOfWeek: targetDayOfWeek,
          startTime,
          endTime,
          appointmentTypeIds:
            dragItem.type === 'appointment-type' && dragItem.appointmentTypeId
              ? [dragItem.appointmentTypeId]
              : [],
          isBlocked: dragItem.type === 'blocked',
          blockReason: dragItem.type === 'blocked' ? 'Blocked' : undefined,
        };

        handleDayBlocksChange(targetDayOfWeek, [...existingBlocks, newBlock]);
        return;
      }

      // Handle moving existing block
      if (dragItem.type === 'block' && dragItem.blockId) {
        const block = blocks.find((b) => b.id === dragItem.blockId);
        if (!block) return;

        // If same day, don't change anything
        if (block.dayOfWeek === targetDayOfWeek) return;

        // Move block to new day
        const updatedBlocks = blocks.map((b) =>
          b.id === dragItem.blockId ? { ...b, dayOfWeek: targetDayOfWeek } : b
        );
        onChange(updatedBlocks);
      }
    },
    [blocks, getBlocksForDay, handleDayBlocksChange, onChange]
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {/* Palette and Presets */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <TypePalette appointmentTypes={appointmentTypes} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Wand2 className="h-4 w-4 mr-2" />
                Quick Fill
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {Object.entries(PRESETS).map(([key, preset]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() =>
                    applyPreset(key as keyof typeof PRESETS, true)
                  }
                >
                  <div>
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {preset.description}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Weekly Grid */}
        <WeeklyGrid
          blocks={blocks}
          appointmentTypes={appointmentTypes}
          onChange={onChange}
          startDay={1} // Start with Monday
        />

        {/* Summary */}
        <div className="text-sm text-muted-foreground">
          {blocks.length} block{blocks.length !== 1 ? 's' : ''} configured
          {' | '}
          {blocks.filter((b) => b.isBlocked).length} blocked
          {' | '}
          {
            new Set(blocks.flatMap((b) => b.appointmentTypeIds)).size
          }{' '}
          appointment type{new Set(blocks.flatMap((b) => b.appointmentTypeIds)).size !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Drag Overlay - follows cursor during drag */}
      <DragOverlay dropAnimation={null}>
        {activeDragItem && (
          <div
            className="px-3 py-2 rounded-md border-2 shadow-lg text-sm font-medium bg-background pointer-events-none"
            style={{
              backgroundColor: `${activeDragItem.color}20`,
              borderColor: activeDragItem.color,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {activeDragItem.label}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
