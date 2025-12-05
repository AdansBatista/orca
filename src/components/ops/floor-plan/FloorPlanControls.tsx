'use client';

import { Edit3, Save, RotateCcw, Undo2, Redo2, ZoomIn, ZoomOut, Grid3x3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface FloorPlanControlsProps {
  editMode: boolean;
  onToggleEdit: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSave: () => void;
  onReset: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  className?: string;
}

export function FloorPlanControls({
  editMode,
  onToggleEdit,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onSave,
  onReset,
  isSaving,
  hasUnsavedChanges,
  className,
}: FloorPlanControlsProps) {
  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-2 flex-wrap', className)}>
        {/* Edit Mode Toggle */}
        <Button
          variant={editMode ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleEdit}
        >
          <Edit3 className="h-4 w-4 mr-2" />
          {editMode ? 'Exit Edit Mode' : 'Edit Layout'}
        </Button>

        {editMode && (
          <>
            <Separator orientation="vertical" className="h-6" />

            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={onUndo}
                    disabled={!canUndo}
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={onRedo}
                    disabled={!canRedo}
                  >
                    <Redo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Save & Reset */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onSave}
                    disabled={isSaving || !hasUnsavedChanges}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Layout
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save floor plan (Ctrl+S)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={onReset}
                    disabled={!hasUnsavedChanges}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset to saved layout</TooltipContent>
              </Tooltip>
            </div>

            {/* Unsaved changes indicator */}
            {hasUnsavedChanges && (
              <Badge variant="warning" size="sm">
                Unsaved Changes
              </Badge>
            )}
          </>
        )}

        <div className="flex-1" /> {/* Spacer */}

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onZoomOut}
                disabled={zoom <= 50}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out</TooltipContent>
          </Tooltip>

          <div className="px-2 text-sm font-medium min-w-[50px] text-center">
            {zoom}%
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onZoomIn}
                disabled={zoom >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In</TooltipContent>
          </Tooltip>
        </div>

        {/* Grid indicator */}
        {editMode && (
          <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-lg text-xs text-muted-foreground">
            <Grid3x3 className="h-3 w-3" />
            <span>Snap to Grid</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
