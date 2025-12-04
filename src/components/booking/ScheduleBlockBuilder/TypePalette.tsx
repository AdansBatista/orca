'use client';

import { useDraggable } from '@dnd-kit/core';
import { Ban, CalendarOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppointmentType, DragItem } from './types';

interface TypePaletteProps {
  appointmentTypes: AppointmentType[];
}

interface DraggableTypeCardProps {
  type: AppointmentType;
}

interface DraggableSpecialCardProps {
  variant: 'blocked' | 'day-off';
}

function DraggableTypeCard({ type }: DraggableTypeCardProps) {
  const dragItem: DragItem = {
    type: 'appointment-type',
    appointmentTypeId: type.id,
    appointmentTypeIds: [type.id],
    color: type.color,
    label: type.name,
  };

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type.id}`,
    data: dragItem,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-grab',
        'bg-background hover:bg-muted/50 transition-colors',
        'select-none touch-none',
        isDragging && 'opacity-50 cursor-grabbing'
      )}
      style={{
        borderColor: type.color,
        borderLeftWidth: '4px',
      }}
    >
      <span
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: type.color }}
      />
      <span className="text-sm font-medium truncate">{type.name}</span>
    </div>
  );
}

function DraggableSpecialCard({ variant }: DraggableSpecialCardProps) {
  const isBlocked = variant === 'blocked';
  const dragItem: DragItem = {
    type: variant,
    color: isBlocked ? '#6B7280' : '#EF4444',
    label: isBlocked ? 'Blocked Time' : 'Day Off',
  };

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${variant}`,
    data: dragItem,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-grab',
        'bg-background hover:bg-muted/50 transition-colors',
        'select-none touch-none',
        isBlocked ? 'border-muted-foreground/50' : 'border-destructive/50',
        isDragging && 'opacity-50 cursor-grabbing'
      )}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: isBlocked ? '#6B7280' : '#EF4444',
      }}
    >
      {isBlocked ? (
        <Ban className="w-4 h-4 text-muted-foreground shrink-0" />
      ) : (
        <CalendarOff className="w-4 h-4 text-destructive shrink-0" />
      )}
      <span className="text-sm font-medium">
        {isBlocked ? 'Blocked Time' : 'Day Off'}
      </span>
    </div>
  );
}

export function TypePalette({ appointmentTypes }: TypePaletteProps) {
  const activeTypes = appointmentTypes.filter((t) => t.isActive);

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-muted-foreground">
        Drag onto grid to create blocks
      </div>

      <div className="flex flex-wrap gap-2">
        {activeTypes.map((type) => (
          <DraggableTypeCard key={type.id} type={type} />
        ))}

        <DraggableSpecialCard variant="blocked" />
        <DraggableSpecialCard variant="day-off" />
      </div>
    </div>
  );
}
