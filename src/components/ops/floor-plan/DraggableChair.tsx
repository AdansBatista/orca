'use client';

import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { Armchair, Bell, Clock, User } from 'lucide-react';
import type { Chair } from '@/types/floor-plan';
import { gridToPixels, getChairDisplayColors, calculateTimeElapsed, isExtendedWait } from '@/lib/utils/floor-plan';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';
import { cn } from '@/lib/utils';

interface DraggableChairProps {
  chair: Chair;
  cellSize: number;
  editMode: boolean;
  onClick?: (chair: Chair) => void;
  onDoubleClick?: (chair: Chair) => void;
}

export function DraggableChair({
  chair,
  cellSize,
  editMode,
  onClick,
  onDoubleClick,
}: DraggableChairProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `chair:${chair.id}`,
    disabled: !editMode,
  });

  const position = chair.position;
  if (!position) return null;

  const colors = chair.status ? getChairDisplayColors(chair.status) : {
    bg: 'bg-muted',
    border: 'border-border',
    text: 'text-muted-foreground',
    icon: 'text-muted-foreground',
  };

  const status = chair.status;
  const timeElapsed = status?.seatedAt ? calculateTimeElapsed(status.seatedAt) : null;
  const isWaitingTooLong = status?.subStage === 'READY_FOR_DOCTOR' && timeElapsed && isExtendedWait(status.seatedAt);

  const style = {
    position: 'absolute' as const,
    left: gridToPixels(position.x, cellSize),
    top: gridToPixels(position.y, cellSize),
    width: cellSize * 2, // Chairs are 2x2 grid cells
    height: cellSize * 2,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${position.rotation}deg)`
      : `rotate(${position.rotation}deg)`,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...(editMode ? listeners : {})}
      {...(editMode ? attributes : {})}
      initial={false}
      animate={{
        scale: isDragging ? 1.05 : 1,
        opacity: isDragging ? 0.8 : 1,
      }}
      whileHover={!editMode ? { scale: 1.02 } : undefined}
      onClick={() => !editMode && onClick?.(chair)}
      onDoubleClick={() => !editMode && onDoubleClick?.(chair)}
      className={cn(
        'relative rounded-xl border-2 p-2 transition-all',
        'cursor-pointer select-none',
        colors.bg,
        colors.border,
        isDragging && 'shadow-2xl ring-4 ring-primary/20',
        editMode && 'hover:ring-2 hover:ring-primary/50',
        !editMode && 'hover:shadow-lg',
        isWaitingTooLong && 'ring-2 ring-warning-500 ring-offset-2 animate-pulse-subtle'
      )}
    >
      {/* Status indicator dot */}
      <div
        className={cn(
          'absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background',
          colors.border,
          colors.pulse && 'animate-pulse'
        )}
      />

      {/* Chair content */}
      <div className="flex flex-col h-full justify-between">
        {/* Header */}
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <div className={cn('text-xs font-semibold truncate', colors.text)}>
              {chair.name}
            </div>
            {status?.patient && (
              <PhiProtected fakeData={getFakeName()}>
                <div className="text-[10px] truncate text-muted-foreground">
                  {status.patient.firstName} {status.patient.lastName}
                </div>
              </PhiProtected>
            )}
          </div>
          <Armchair className={cn('h-4 w-4 flex-shrink-0', colors.icon)} />
        </div>

        {/* Middle - Status info */}
        <div className="flex-1 flex flex-col justify-center gap-1">
          {/* Sub-stage badge */}
          {status?.subStage && (
            <Badge
              variant={status.subStage === 'READY_FOR_DOCTOR' ? 'warning' : 'outline'}
              size="sm"
              className="text-[9px] px-1 py-0"
              dot={status.subStage === 'READY_FOR_DOCTOR'}
            >
              {formatSubStage(status.subStage)}
            </Badge>
          )}

          {/* Time elapsed */}
          {timeElapsed !== null && timeElapsed > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{timeElapsed}m</span>
            </div>
          )}

          {/* Ready for doctor indicator */}
          {status?.subStage === 'READY_FOR_DOCTOR' && (
            <div className="flex items-center gap-1 text-[10px] text-warning-600 font-medium">
              <Bell className="h-3 w-3" />
              <span>Ready</span>
            </div>
          )}
        </div>

        {/* Footer - Provider */}
        {status?.provider && (
          <div className="flex items-center gap-1">
            <Avatar className="h-4 w-4">
              <AvatarFallback className="text-[8px]">
                {status.provider.firstName[0]}{status.provider.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-[9px] text-muted-foreground truncate">
              Dr. {status.provider.lastName}
            </span>
          </div>
        )}

        {/* Block reason */}
        {status?.occupancyStatus === 'BLOCKED' && status.blockReason && (
          <div className="text-[9px] text-error-600 truncate mt-1">
            {status.blockReason}
          </div>
        )}
      </div>

      {/* Edit mode indicator */}
      {editMode && (
        <div className="absolute bottom-1 right-1 text-[8px] text-muted-foreground font-mono">
          ({position.x}, {position.y})
        </div>
      )}
    </motion.div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatSubStage(subStage: string): string {
  const labels: Record<string, string> = {
    SETUP: 'Setup',
    ASSISTANT_WORKING: 'Assistant',
    READY_FOR_DOCTOR: 'Ready',
    DOCTOR_CHECKING: 'Doctor',
    FINISHING: 'Finishing',
    CLEANING: 'Cleaning',
  };
  return labels[subStage] || subStage;
}
