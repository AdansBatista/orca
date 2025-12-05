'use client';

import { useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { GridConfig, Chair, Room } from '@/types/floor-plan';
import { gridToPixels } from '@/lib/utils/floor-plan';
import { cn } from '@/lib/utils';

interface FloorPlanCanvasProps {
  gridConfig: GridConfig;
  rooms: Room[];
  chairs: Chair[];
  editMode: boolean;
  zoom: number;
  onChairDragEnd?: (chairId: string, position: { x: number; y: number }) => void;
  onRoomDragEnd?: (roomId: string, position: { x: number; y: number }) => void;
  onChairClick?: (chair: Chair) => void;
  children?: React.ReactNode;
  className?: string;
}

export function FloorPlanCanvas({
  gridConfig,
  rooms,
  chairs,
  editMode,
  zoom = 100,
  onChairDragEnd,
  onRoomDragEnd,
  onChairClick,
  children,
  className,
}: FloorPlanCanvasProps) {
  // Configure sensors for drag and drop
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: editMode ? 5 : 999999, // Only allow drag in edit mode
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  // Calculate canvas dimensions
  const canvasWidth = gridToPixels(gridConfig.columns, gridConfig.cellSize);
  const canvasHeight = gridToPixels(gridConfig.rows, gridConfig.cellSize);

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta } = event;

      if (!editMode) return;

      const id = active.id.toString();
      const [type, itemId] = id.split(':');

      // Convert delta to grid units
      const deltaX = Math.round(delta.x / gridConfig.cellSize);
      const deltaY = Math.round(delta.y / gridConfig.cellSize);

      if (deltaX === 0 && deltaY === 0) return;

      if (type === 'chair') {
        const chair = chairs.find((c) => c.id === itemId);
        if (chair && chair.position && onChairDragEnd) {
          onChairDragEnd(itemId, {
            x: chair.position.x + deltaX,
            y: chair.position.y + deltaY,
          });
        }
      } else if (type === 'room') {
        const room = rooms.find((r) => r.id === itemId);
        if (room && room.boundary && onRoomDragEnd) {
          onRoomDragEnd(itemId, {
            x: room.boundary.x + deltaX,
            y: room.boundary.y + deltaY,
          });
        }
      }
    },
    [editMode, chairs, rooms, gridConfig.cellSize, onChairDragEnd, onRoomDragEnd]
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div
        className={cn(
          'relative bg-muted/30 border-2 border-border rounded-xl overflow-auto transition-all',
          editMode && 'ring-2 ring-primary/20',
          className
        )}
        style={{
          width: '100%',
          height: '600px',
          minHeight: '400px',
        }}
      >
        {/* Scrollable canvas container */}
        <div className="relative p-8 overflow-auto h-full">
          {/* Canvas with zoom */}
          <div
            className="relative mx-auto"
            style={{
              width: canvasWidth,
              height: canvasHeight,
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left',
            }}
          >
            {/* Grid background */}
            {editMode && <GridBackground gridConfig={gridConfig} />}

            {/* Grid labels (coordinates) */}
            {editMode && <GridLabels gridConfig={gridConfig} />}

            {/* Canvas content */}
            <div className="relative w-full h-full">
              {children}
            </div>

            {/* Overlay for drag preview */}
            <DragOverlay>
              {/* Drag preview will be rendered here */}
            </DragOverlay>
          </div>
        </div>

        {/* Edit mode indicator */}
        {editMode && (
          <div className="absolute top-2 left-2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
            Edit Mode
          </div>
        )}

        {/* Zoom indicator */}
        <div className="absolute bottom-2 right-2 px-3 py-1 bg-background/90 backdrop-blur border text-xs font-medium rounded-full">
          {zoom}%
        </div>
      </div>
    </DndContext>
  );
}

// =============================================================================
// GRID BACKGROUND
// =============================================================================

function GridBackground({ gridConfig }: { gridConfig: GridConfig }) {
  const { columns, rows, cellSize } = gridConfig;
  const width = gridToPixels(columns, cellSize);
  const height = gridToPixels(rows, cellSize);

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="grid"
          width={cellSize}
          height={cellSize}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-border/50"
          />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="url(#grid)" />

      {/* Major grid lines every 5 cells */}
      {Array.from({ length: Math.floor(columns / 5) + 1 }).map((_, i) => (
        <line
          key={`v${i}`}
          x1={i * 5 * cellSize}
          y1={0}
          x2={i * 5 * cellSize}
          y2={height}
          stroke="currentColor"
          strokeWidth="1"
          className="text-border/80"
        />
      ))}
      {Array.from({ length: Math.floor(rows / 5) + 1 }).map((_, i) => (
        <line
          key={`h${i}`}
          x1={0}
          y1={i * 5 * cellSize}
          x2={width}
          y2={i * 5 * cellSize}
          stroke="currentColor"
          strokeWidth="1"
          className="text-border/80"
        />
      ))}
    </svg>
  );
}

// =============================================================================
// GRID LABELS
// =============================================================================

function GridLabels({ gridConfig }: { gridConfig: GridConfig }) {
  const { columns, rows, cellSize } = gridConfig;

  return (
    <>
      {/* Column labels (top) */}
      <div className="absolute -top-6 left-0 right-0 flex">
        {Array.from({ length: columns }).map((_, i) => {
          if (i % 5 !== 0) return null;
          return (
            <div
              key={`col-${i}`}
              className="text-xs text-muted-foreground font-mono"
              style={{
                position: 'absolute',
                left: gridToPixels(i, cellSize),
                width: cellSize,
                textAlign: 'center',
              }}
            >
              {i}
            </div>
          );
        })}
      </div>

      {/* Row labels (left) */}
      <div className="absolute -left-8 top-0 bottom-0">
        {Array.from({ length: rows }).map((_, i) => {
          if (i % 5 !== 0) return null;
          return (
            <div
              key={`row-${i}`}
              className="text-xs text-muted-foreground font-mono"
              style={{
                position: 'absolute',
                top: gridToPixels(i, cellSize),
                height: cellSize,
                lineHeight: `${cellSize}px`,
                textAlign: 'right',
                width: '24px',
              }}
            >
              {i}
            </div>
          );
        })}
      </div>
    </>
  );
}
