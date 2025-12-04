'use client';

import { useState, useCallback, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { BlockCard } from './BlockCard';
import { BlockEditPopover } from './BlockEditPopover';
import {
  type ScheduleBlock,
  type AppointmentType,
  GRID_CONFIG,
  DAYS_OF_WEEK,
  timeToY,
  yToTime,
  timeToMinutes,
  generateId,
} from './types';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Copy, Trash2, CalendarOff } from 'lucide-react';

interface DayColumnProps {
  dayOfWeek: number;
  blocks: ScheduleBlock[];
  appointmentTypes: AppointmentType[];
  onBlocksChange: (blocks: ScheduleBlock[]) => void;
  onCopyDay: () => void;
  onClearDay: () => void;
  onMarkDayOff: () => void;
  isDayOff: boolean;
}

export function DayColumn({
  dayOfWeek,
  blocks,
  appointmentTypes,
  onBlocksChange,
  onCopyDay,
  onClearDay,
  onMarkDayOff,
  isDayOff,
}: DayColumnProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createStart, setCreateStart] = useState<number | null>(null);
  const [createEnd, setCreateEnd] = useState<number | null>(null);
  const columnRef = useRef<HTMLDivElement>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dayOfWeek}`,
    data: { dayOfWeek },
  });

  const dayInfo = DAYS_OF_WEEK.find((d) => d.value === dayOfWeek);
  const totalSlots =
    ((GRID_CONFIG.END_HOUR - GRID_CONFIG.START_HOUR) * 60) / 30;
  const gridHeight = totalSlots * GRID_CONFIG.SLOT_HEIGHT;

  // Handle mouse down to start creating a block
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Only left click
      const rect = columnRef.current?.getBoundingClientRect();
      if (!rect) return;

      const y = e.clientY - rect.top;
      const snappedY =
        Math.floor(y / GRID_CONFIG.SLOT_HEIGHT) * GRID_CONFIG.SLOT_HEIGHT;

      setIsCreating(true);
      setCreateStart(snappedY);
      setCreateEnd(snappedY + GRID_CONFIG.SLOT_HEIGHT);
    },
    []
  );

  // Handle mouse move while creating
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isCreating || createStart === null) return;
      const rect = columnRef.current?.getBoundingClientRect();
      if (!rect) return;

      const y = e.clientY - rect.top;
      const snappedY =
        Math.ceil(y / GRID_CONFIG.SLOT_HEIGHT) * GRID_CONFIG.SLOT_HEIGHT;
      const clampedY = Math.max(
        createStart + GRID_CONFIG.SLOT_HEIGHT,
        Math.min(snappedY, gridHeight)
      );
      setCreateEnd(clampedY);
    },
    [isCreating, createStart, gridHeight]
  );

  // Handle mouse up to finish creating
  const handleMouseUp = useCallback(() => {
    if (!isCreating || createStart === null || createEnd === null) {
      setIsCreating(false);
      setCreateStart(null);
      setCreateEnd(null);
      return;
    }

    const startTime = yToTime(createStart);
    const endTime = yToTime(createEnd);

    // Check for overlaps
    const hasOverlap = blocks.some((block) => {
      const blockStart = timeToMinutes(block.startTime);
      const blockEnd = timeToMinutes(block.endTime);
      const newStart = timeToMinutes(startTime);
      const newEnd = timeToMinutes(endTime);
      return newStart < blockEnd && newEnd > blockStart;
    });

    if (!hasOverlap && createEnd > createStart) {
      const newBlock: ScheduleBlock = {
        id: generateId(),
        dayOfWeek,
        startTime,
        endTime,
        appointmentTypeIds: [],
        isBlocked: false,
      };
      onBlocksChange([...blocks, newBlock]);
      setEditingBlockId(newBlock.id);
    }

    setIsCreating(false);
    setCreateStart(null);
    setCreateEnd(null);
  }, [isCreating, createStart, createEnd, blocks, dayOfWeek, onBlocksChange]);

  // Handle block update
  const handleBlockUpdate = useCallback(
    (blockId: string, updates: Partial<ScheduleBlock>) => {
      onBlocksChange(
        blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b))
      );
    },
    [blocks, onBlocksChange]
  );

  // Handle block delete
  const handleBlockDelete = useCallback(
    (blockId: string) => {
      onBlocksChange(blocks.filter((b) => b.id !== blockId));
      if (selectedBlockId === blockId) setSelectedBlockId(null);
      if (editingBlockId === blockId) setEditingBlockId(null);
    },
    [blocks, onBlocksChange, selectedBlockId, editingBlockId]
  );

  // Handle block resize
  const handleResizeStart = useCallback(
    (blockId: string, edge: 'top' | 'bottom', e: React.MouseEvent) => {
      e.preventDefault();
      const block = blocks.find((b) => b.id === blockId);
      if (!block) return;

      const startY = e.clientY;
      const originalTop = timeToY(block.startTime);
      const originalBottom = timeToY(block.endTime);

      const handleMouseMove = (moveE: MouseEvent) => {
        const deltaY = moveE.clientY - startY;

        if (edge === 'top') {
          const newTop = Math.max(
            0,
            Math.min(
              originalBottom - GRID_CONFIG.SLOT_HEIGHT,
              Math.round((originalTop + deltaY) / GRID_CONFIG.SLOT_HEIGHT) *
                GRID_CONFIG.SLOT_HEIGHT
            )
          );
          handleBlockUpdate(blockId, { startTime: yToTime(newTop) });
        } else {
          const newBottom = Math.max(
            originalTop + GRID_CONFIG.SLOT_HEIGHT,
            Math.min(
              gridHeight,
              Math.round((originalBottom + deltaY) / GRID_CONFIG.SLOT_HEIGHT) *
                GRID_CONFIG.SLOT_HEIGHT
            )
          );
          handleBlockUpdate(blockId, { endTime: yToTime(newBottom) });
        }
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [blocks, gridHeight, handleBlockUpdate]
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="flex flex-col">
          {/* Day Header */}
          <div
            className={cn(
              'h-10 flex items-center justify-center border-b bg-muted/30 font-medium text-sm',
              isDayOff && 'bg-destructive/10 text-destructive'
            )}
          >
            {dayInfo?.short}
            {isDayOff && (
              <CalendarOff className="w-3 h-3 ml-1" />
            )}
          </div>

          {/* Time Grid */}
          <div
            ref={(node) => {
              columnRef.current = node;
              setNodeRef(node);
            }}
            className={cn(
              'relative border-r',
              isOver && 'bg-primary/5',
              isDayOff && 'bg-destructive/5'
            )}
            style={{
              width: `${GRID_CONFIG.DAY_WIDTH}px`,
              height: `${gridHeight}px`,
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              if (isCreating) handleMouseUp();
            }}
          >
            {/* Hour lines */}
            {Array.from({ length: totalSlots }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'absolute inset-x-0 border-t',
                  i % 2 === 0 ? 'border-border' : 'border-border/30'
                )}
                style={{ top: `${i * GRID_CONFIG.SLOT_HEIGHT}px` }}
              />
            ))}

            {/* Day Off Overlay */}
            {isDayOff && (
              <div className="absolute inset-0 bg-stripes pointer-events-none opacity-30" />
            )}

            {/* Blocks */}
            {blocks.map((block) => {
              const isEditing = editingBlockId === block.id;
              const blockCard = (
                <BlockCard
                  key={block.id}
                  block={block}
                  appointmentTypes={appointmentTypes}
                  onClick={() => setEditingBlockId(block.id)}
                  onDelete={() => handleBlockDelete(block.id)}
                  onResizeStart={(edge, e) =>
                    handleResizeStart(block.id, edge, e)
                  }
                  isSelected={selectedBlockId === block.id}
                />
              );

              return (
                <BlockEditPopover
                  key={block.id}
                  block={block}
                  appointmentTypes={appointmentTypes}
                  open={isEditing}
                  onOpenChange={(open) => {
                    if (!open) setEditingBlockId(null);
                  }}
                  onUpdate={(updates) => handleBlockUpdate(block.id, updates)}
                  onDelete={() => handleBlockDelete(block.id)}
                >
                  {blockCard}
                </BlockEditPopover>
              );
            })}

            {/* Creating Preview */}
            {isCreating && createStart !== null && createEnd !== null && (
              <div
                className="absolute left-1 right-1 bg-primary/20 border-2 border-primary border-dashed rounded-md"
                style={{
                  top: `${createStart}px`,
                  height: `${createEnd - createStart}px`,
                }}
              />
            )}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onCopyDay}>
          <Copy className="w-4 h-4 mr-2" />
          Copy to other days...
        </ContextMenuItem>
        <ContextMenuItem onClick={onClearDay}>
          <Trash2 className="w-4 h-4 mr-2" />
          Clear all blocks
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onMarkDayOff}>
          <CalendarOff className="w-4 h-4 mr-2" />
          {isDayOff ? 'Remove Day Off' : 'Mark as Day Off'}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
