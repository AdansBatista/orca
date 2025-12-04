'use client';

import { useDraggable } from '@dnd-kit/core';
import { X, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type ScheduleBlock,
  type AppointmentType,
  type DragItem,
  timeToY,
  getBlockColor,
  getBlockLabel,
  formatTime,
  GRID_CONFIG,
  timeToMinutes,
} from './types';

interface BlockCardProps {
  block: ScheduleBlock;
  appointmentTypes: AppointmentType[];
  onClick: () => void;
  onDelete: () => void;
  onResizeStart: (edge: 'top' | 'bottom', e: React.MouseEvent) => void;
  isSelected?: boolean;
}

export function BlockCard({
  block,
  appointmentTypes,
  onClick,
  onDelete,
  onResizeStart,
  isSelected,
}: BlockCardProps) {
  const color = getBlockColor(block, appointmentTypes);
  const label = getBlockLabel(block, appointmentTypes);
  const top = timeToY(block.startTime);
  const height =
    ((timeToMinutes(block.endTime) - timeToMinutes(block.startTime)) / 30) *
    GRID_CONFIG.SLOT_HEIGHT;

  const dragItem: DragItem = {
    type: 'block',
    blockId: block.id,
    appointmentTypeIds: block.appointmentTypeIds,
    color,
    label,
  };

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `block-${block.id}`,
    data: dragItem,
  });

  const isSmall = height < 48;
  const isTiny = height < 32;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute left-1 right-1 rounded-md overflow-hidden',
        'border-2 transition-all',
        'group',
        isDragging && 'opacity-50 z-50',
        isSelected && 'ring-2 ring-primary ring-offset-1',
        block.isBlocked && 'bg-stripes'
      )}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        backgroundColor: block.isBlocked ? undefined : `${color}20`,
        borderColor: color,
      }}
    >
      {/* Resize handle - top */}
      <div
        className="absolute inset-x-0 top-0 h-2 cursor-ns-resize hover:bg-black/10 z-20"
        onMouseDown={(e) => {
          e.stopPropagation();
          onResizeStart('top', e);
        }}
      />

      {/* Clickable content area - NOT part of drag zone */}
      <div
        className={cn(
          'absolute inset-0 flex flex-col p-1 overflow-hidden cursor-pointer',
          isTiny ? 'justify-center' : 'justify-between'
        )}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        {/* Header with drag handle and delete */}
        {!isTiny && (
          <div className="flex items-start justify-between gap-1">
            <div className="flex items-center gap-1 min-w-0">
              {/* Drag handle - ONLY this element is draggable */}
              <div
                className="shrink-0 cursor-grab active:cursor-grabbing p-0.5 -m-0.5 rounded hover:bg-black/10"
                {...listeners}
                {...attributes}
                onClick={(e) => e.stopPropagation()} // Prevent click from firing when dragging
              >
                <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span
                className={cn(
                  'font-medium truncate',
                  isSmall ? 'text-[10px]' : 'text-xs'
                )}
                style={{ color }}
              >
                {label}
              </span>
            </div>
            <button
              type="button"
              className="h-5 w-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:bg-destructive/20 text-muted-foreground hover:text-destructive z-30"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDelete();
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Time display */}
        {!isTiny && (
          <div
            className={cn('text-muted-foreground', isSmall ? 'text-[9px]' : 'text-[10px]')}
          >
            {formatTime(block.startTime)} - {formatTime(block.endTime)}
          </div>
        )}

        {/* Tiny display - just color bar with drag capability */}
        {isTiny && (
          <div
            className="w-full h-1 rounded cursor-grab active:cursor-grabbing"
            style={{ backgroundColor: color }}
            {...listeners}
            {...attributes}
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>

      {/* Resize handle - bottom */}
      <div
        className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize hover:bg-black/10 z-20"
        onMouseDown={(e) => {
          e.stopPropagation();
          onResizeStart('bottom', e);
        }}
      />

      {/* Multiple types indicator */}
      {block.appointmentTypeIds.length > 1 && !isTiny && (
        <div className="absolute bottom-1 right-1 flex -space-x-1 pointer-events-none">
          {block.appointmentTypeIds.slice(0, 3).map((typeId, i) => {
            const type = appointmentTypes.find((t) => t.id === typeId);
            if (!type) return null;
            return (
              <div
                key={typeId}
                className="w-2 h-2 rounded-full border border-background"
                style={{ backgroundColor: type.color, zIndex: 3 - i }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
