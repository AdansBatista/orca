'use client';

import {
  Pencil,
  Minus,
  MoveRight,
  Circle,
  Square,
  Type,
  Hexagon,
  MousePointer,
  Trash2,
  Undo,
  Redo,
  Eye,
  EyeOff,
  Save,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export type AnnotationTool =
  | 'select'
  | 'freehand'
  | 'line'
  | 'arrow'
  | 'circle'
  | 'rectangle'
  | 'text'
  | 'polygon';

export interface AnnotationStyle {
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  fillOpacity: number;
}

interface AnnotationToolbarProps {
  activeTool: AnnotationTool;
  onToolChange: (tool: AnnotationTool) => void;
  style: AnnotationStyle;
  onStyleChange: (style: AnnotationStyle) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onSave: () => void;
  annotationsVisible: boolean;
  onToggleVisibility: () => void;
  hasSelection: boolean;
  isSaving?: boolean;
  className?: string;
}

const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#ffffff', // white
  '#000000', // black
];

const TOOLS: {
  id: AnnotationTool;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}[] = [
  { id: 'select', icon: MousePointer, label: 'Select' },
  { id: 'freehand', icon: Pencil, label: 'Freehand' },
  { id: 'line', icon: Minus, label: 'Line' },
  { id: 'arrow', icon: MoveRight, label: 'Arrow' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'rectangle', icon: Square, label: 'Rectangle' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'polygon', icon: Hexagon, label: 'Polygon' },
];

export function AnnotationToolbar({
  activeTool,
  onToolChange,
  style,
  onStyleChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDelete,
  onSave,
  annotationsVisible,
  onToggleVisibility,
  hasSelection,
  isSaving = false,
  className,
}: AnnotationToolbarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'flex items-center gap-1 p-2 bg-black/70 rounded-lg backdrop-blur-sm',
          className
        )}
      >
        {/* Tools */}
        {TOOLS.map((tool) => (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8 text-white hover:bg-white/20',
                  activeTool === tool.id && 'bg-white/30'
                )}
                onClick={() => onToolChange(tool.id)}
              >
                <tool.icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{tool.label}</TooltipContent>
          </Tooltip>
        ))}

        <Separator orientation="vertical" className="h-6 bg-white/20 mx-1" />

        {/* Color picker */}
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                >
                  <div
                    className="h-5 w-5 rounded-full border-2 border-white"
                    style={{ backgroundColor: style.strokeColor }}
                  />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Color</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-auto p-3" align="center">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Stroke Color</p>
                <div className="flex flex-wrap gap-1">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      className={cn(
                        'h-6 w-6 rounded-full border-2 transition-transform',
                        style.strokeColor === color
                          ? 'border-primary scale-110'
                          : 'border-transparent hover:scale-105'
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() =>
                        onStyleChange({ ...style, strokeColor: color })
                      }
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Fill Color</p>
                <div className="flex flex-wrap gap-1">
                  <button
                    className={cn(
                      'h-6 w-6 rounded-full border-2 transition-transform',
                      style.fillOpacity === 0
                        ? 'border-primary scale-110'
                        : 'border-transparent hover:scale-105'
                    )}
                    style={{
                      background:
                        'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                      backgroundSize: '8px 8px',
                      backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                    }}
                    onClick={() => onStyleChange({ ...style, fillOpacity: 0 })}
                  />
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      className={cn(
                        'h-6 w-6 rounded-full border-2 transition-transform',
                        style.fillColor === color && style.fillOpacity > 0
                          ? 'border-primary scale-110'
                          : 'border-transparent hover:scale-105'
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() =>
                        onStyleChange({
                          ...style,
                          fillColor: color,
                          fillOpacity: 0.3,
                        })
                      }
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Stroke Width: {style.strokeWidth}px
                </p>
                <Slider
                  value={[style.strokeWidth]}
                  onValueChange={([value]) =>
                    onStyleChange({ ...style, strokeWidth: value })
                  }
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6 bg-white/20 mx-1" />

        {/* Undo/Redo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20 disabled:opacity-30"
              onClick={onUndo}
              disabled={!canUndo}
            >
              <Undo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Undo</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20 disabled:opacity-30"
              onClick={onRedo}
              disabled={!canRedo}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Redo</TooltipContent>
        </Tooltip>

        {/* Delete */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20 disabled:opacity-30"
              onClick={onDelete}
              disabled={!hasSelection}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Delete Selected</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 bg-white/20 mx-1" />

        {/* Visibility toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={onToggleVisibility}
            >
              {annotationsVisible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {annotationsVisible ? 'Hide Annotations' : 'Show Annotations'}
          </TooltipContent>
        </Tooltip>

        {/* Save */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={onSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Save Annotations</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export const DEFAULT_ANNOTATION_STYLE: AnnotationStyle = {
  strokeColor: '#ef4444',
  strokeWidth: 2,
  fillColor: '#ef4444',
  fillOpacity: 0,
};
