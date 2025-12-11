'use client';

import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Axis3D,
  Play,
  Pause,
  Box,
  Sparkles,
  Eye,
  Scissors,
  ChevronDown,
  Palette,
  Info,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

import type {
  ViewerState,
  ViewPreset,
  RenderMode,
  MaterialPreset,
  LoadedModel,
} from './types';
import {
  VIEW_PRESET_POSITIONS,
  MATERIAL_PRESETS,
} from './types';
import { getModelStats } from './loaders';

interface Model3DToolbarProps {
  viewerState: ViewerState;
  model: LoadedModel | null;
  onViewPreset: (preset: ViewPreset) => void;
  onRenderModeChange: (mode: RenderMode) => void;
  onMaterialPresetChange: (preset: MaterialPreset) => void;
  onToggleGrid: () => void;
  onToggleAxes: () => void;
  onToggleAutoRotate: () => void;
  onToggleClipping: () => void;
  onClippingPositionChange: (position: number) => void;
  onClippingAxisChange: (axis: 'x' | 'y' | 'z') => void;
  onResetView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onExport?: () => void;
}

const VIEW_PRESETS: { id: ViewPreset; label: string }[] = [
  { id: 'FRONT', label: 'Front' },
  { id: 'BACK', label: 'Back' },
  { id: 'LEFT', label: 'Left' },
  { id: 'RIGHT', label: 'Right' },
  { id: 'TOP', label: 'Top' },
  { id: 'BOTTOM', label: 'Bottom' },
  { id: 'ISOMETRIC', label: 'Isometric' },
];

const RENDER_MODES: { id: RenderMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'SOLID', label: 'Solid', icon: Box },
  { id: 'WIREFRAME', label: 'Wireframe', icon: Grid3X3 },
  { id: 'POINTS', label: 'Points', icon: Sparkles },
];

const MATERIAL_PRESET_OPTIONS: { id: MaterialPreset; label: string }[] = [
  { id: 'DEFAULT', label: 'Default' },
  { id: 'TEETH_WHITE', label: 'Teeth (White)' },
  { id: 'GUMS_PINK', label: 'Gums (Pink)' },
  { id: 'METALLIC', label: 'Metallic' },
  { id: 'TRANSPARENT', label: 'Transparent' },
];

export function Model3DToolbar({
  viewerState,
  model,
  onViewPreset,
  onRenderModeChange,
  onMaterialPresetChange,
  onToggleGrid,
  onToggleAxes,
  onToggleAutoRotate,
  onToggleClipping,
  onClippingPositionChange,
  onClippingAxisChange,
  onResetView,
  onZoomIn,
  onZoomOut,
  onExport,
}: Model3DToolbarProps) {
  const stats = model ? getModelStats(model) : null;

  return (
    <div className="flex items-center gap-2 p-2 bg-background border-b">
      {/* View Presets */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Eye className="h-4 w-4" />
            View
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Camera Presets</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {VIEW_PRESETS.map((preset) => (
            <DropdownMenuItem
              key={preset.id}
              onClick={() => onViewPreset(preset.id)}
            >
              {preset.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6" />

      {/* Render Mode */}
      <div className="flex items-center gap-1">
        {RENDER_MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = viewerState.renderMode === mode.id;
          return (
            <Tooltip key={mode.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="icon-sm"
                  onClick={() => onRenderModeChange(mode.id)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{mode.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Material Preset */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Palette className="h-4 w-4" />
            Material
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Material Presets</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {MATERIAL_PRESET_OPTIONS.map((preset) => (
            <DropdownMenuItem
              key={preset.id}
              onClick={() => onMaterialPresetChange(preset.id)}
            >
              <div
                className="w-4 h-4 rounded-full mr-2 border"
                style={{ backgroundColor: MATERIAL_PRESETS[preset.id].color }}
              />
              {preset.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6" />

      {/* Display Options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Grid3X3 className="h-4 w-4" />
            Display
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuCheckboxItem
            checked={viewerState.showGrid}
            onCheckedChange={onToggleGrid}
          >
            Show Grid
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={viewerState.showAxes}
            onCheckedChange={onToggleAxes}
          >
            Show Axes
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={viewerState.autoRotate}
            onCheckedChange={onToggleAutoRotate}
          >
            Auto Rotate
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clipping Plane */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={viewerState.clippingEnabled ? 'default' : 'ghost'}
            size="sm"
            className="gap-2"
          >
            <Scissors className="h-4 w-4" />
            Clip
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Clipping Plane</Label>
              <Button
                variant={viewerState.clippingEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={onToggleClipping}
              >
                {viewerState.clippingEnabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>

            {viewerState.clippingEnabled && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Axis</Label>
                  <div className="flex gap-1">
                    {(['x', 'y', 'z'] as const).map((axis) => (
                      <Button
                        key={axis}
                        variant={viewerState.clippingAxis === axis ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onClippingAxisChange(axis)}
                        className="flex-1"
                      >
                        {axis.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Position</Label>
                  <Slider
                    value={[viewerState.clippingPosition * 100]}
                    onValueChange={([v]) => onClippingPositionChange(v / 100)}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="h-6" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={onZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom Out</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={onZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom In</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={onResetView}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset View</TooltipContent>
        </Tooltip>
      </div>

      {/* Auto Rotate Toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={viewerState.autoRotate ? 'default' : 'ghost'}
            size="icon-sm"
            onClick={onToggleAutoRotate}
          >
            {viewerState.autoRotate ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {viewerState.autoRotate ? 'Stop Rotation' : 'Auto Rotate'}
        </TooltipContent>
      </Tooltip>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Model Info */}
      {stats && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Info className="h-4 w-4" />
              Info
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Model Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format</span>
                  <Badge variant="outline">{stats.format}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vertices</span>
                  <span>{stats.vertices}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Faces</span>
                  <span>{stats.faces}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size</span>
                  <span className="text-xs">{stats.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vertex Colors</span>
                  <span>{stats.hasColors ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
