'use client';

import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import type { Room } from '@/types/floor-plan';
import { gridToPixels } from '@/lib/utils/floor-plan';
import { cn } from '@/lib/utils';

interface DraggableRoomProps {
  room: Room;
  cellSize: number;
  editMode: boolean;
  children?: React.ReactNode;
}

export function DraggableRoom({ room, cellSize, editMode, children }: DraggableRoomProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `room:${room.id}`,
    disabled: !editMode,
  });

  const boundary = room.boundary;
  if (!boundary) return null;

  const style = {
    position: 'absolute' as const,
    left: gridToPixels(boundary.x, cellSize),
    top: gridToPixels(boundary.y, cellSize),
    width: gridToPixels(boundary.width, cellSize),
    height: gridToPixels(boundary.height, cellSize),
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${boundary.rotation}deg)`
      : `rotate(${boundary.rotation}deg)`,
    zIndex: isDragging ? 999 : 0,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...(editMode ? listeners : {})}
      {...(editMode ? attributes : {})}
      initial={false}
      animate={{
        opacity: isDragging ? 0.6 : 1,
      }}
      className={cn(
        'relative rounded-2xl border-2 border-dashed border-border/50',
        'bg-muted/20',
        editMode && 'cursor-move hover:border-primary/50 hover:bg-muted/30',
        isDragging && 'ring-4 ring-primary/20'
      )}
    >
      {/* Room label */}
      <div className="absolute top-2 left-2 px-2 py-1 bg-background/90 backdrop-blur rounded-md text-xs font-medium text-foreground border">
        {room.name}
      </div>

      {/* Room number badge */}
      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-muted border flex items-center justify-center text-[10px] font-semibold">
        {room.roomNumber}
      </div>

      {/* Edit mode coordinates */}
      {editMode && (
        <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground font-mono bg-background/90 backdrop-blur px-2 py-1 rounded">
          ({boundary.x}, {boundary.y}) {boundary.width}×{boundary.height}
        </div>
      )}

      {/* Children (chairs inside the room) */}
      {children}
    </motion.div>
  );
}
