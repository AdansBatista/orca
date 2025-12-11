'use client';

import { useMemo } from 'react';
import { ImageIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { CollageSlot, CollageLayout, SlotAssignment } from './types';

interface CollagePreviewProps {
  layout: CollageLayout;
  slots: CollageSlot[];
  assignments?: Record<string, SlotAssignment>;
  aspectRatio?: string;
  background?: string;
  padding?: number;
  gap?: number;
  showLabels?: boolean;
  interactive?: boolean;
  selectedSlot?: string | null;
  onSlotClick?: (slotId: string) => void;
  className?: string;
  scale?: number;
}

export function CollagePreview({
  layout,
  slots,
  assignments = {},
  aspectRatio = '16:9',
  background = '#ffffff',
  padding = 16,
  gap = 8,
  showLabels = true,
  interactive = false,
  selectedSlot,
  onSlotClick,
  className,
  scale = 1,
}: CollagePreviewProps) {
  // Calculate aspect ratio padding
  const aspectPadding = useMemo(() => {
    const [w, h] = aspectRatio.includes(':')
      ? aspectRatio.split(':').map(Number)
      : aspectRatio === 'A4'
      ? [210, 297]
      : aspectRatio === 'LETTER'
      ? [8.5, 11]
      : [16, 9];
    return (h / w) * 100;
  }, [aspectRatio]);

  // Generate grid template
  const gridTemplate = useMemo(() => {
    return {
      gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
      gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
      gap: `${gap * scale}px`,
      padding: `${padding * scale}px`,
    };
  }, [layout, gap, padding, scale]);

  return (
    <div
      className={cn('relative w-full overflow-hidden rounded-lg', className)}
      style={{
        paddingBottom: `${aspectPadding}%`,
        backgroundColor: background,
      }}
    >
      <div
        className="absolute inset-0 grid"
        style={gridTemplate}
      >
        {slots.map((slot) => {
          const assignment = assignments[slot.id];
          const isSelected = selectedSlot === slot.id;
          const isEmpty = !assignment;

          return (
            <div
              key={slot.id}
              className={cn(
                'relative overflow-hidden rounded-md transition-all',
                interactive && 'cursor-pointer',
                isSelected && 'ring-2 ring-primary ring-offset-2',
                isEmpty && 'bg-muted/50 border-2 border-dashed border-muted-foreground/30',
                interactive && isEmpty && 'hover:border-primary hover:bg-muted'
              )}
              style={{
                gridRow: `${slot.row + 1} / span ${slot.rowSpan}`,
                gridColumn: `${slot.col + 1} / span ${slot.colSpan}`,
              }}
              onClick={() => interactive && onSlotClick?.(slot.id)}
            >
              {assignment ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={assignment.thumbnailUrl || assignment.imageUrl}
                    alt={assignment.label || slot.label || 'Collage image'}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  {showLabels && (assignment.label || slot.label) && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <span className="text-white text-xs font-medium">
                        {assignment.label || slot.label}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                  {showLabels && slot.label && (
                    <span className="text-xs text-center px-2">{slot.label}</span>
                  )}
                  {slot.required && (
                    <span className="text-xs text-destructive mt-1">Required</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
