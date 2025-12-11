'use client';

import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Contrast,
  Move,
  Ruler,
  ChevronDown,
  Info,
  RefreshCw,
  Sun,
  Maximize,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
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

import type { ViewerState, LoadedDicomImage, DicomTool } from './types';
import { WINDOW_LEVEL_PRESETS, MODALITY_LABELS, formatFileSize } from './types';
import { formatDicomDate, formatPatientName } from './loader';

interface DicomToolbarProps {
  viewerState: ViewerState;
  image: LoadedDicomImage | null;
  onWindowLevelChange: (center: number, width: number) => void;
  onZoomChange: (zoom: number) => void;
  onRotate: (degrees: number) => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  onInvert: () => void;
  onResetView: () => void;
  onToolChange: (tool: DicomTool) => void;
  onFitToWindow: () => void;
}

const TOOLS: { id: DicomTool; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { id: 'windowLevel', icon: Contrast, label: 'Window/Level' },
  { id: 'pan', icon: Move, label: 'Pan' },
  { id: 'zoom', icon: ZoomIn, label: 'Zoom' },
  { id: 'measure', icon: Ruler, label: 'Measure' },
];

export function DicomToolbar({
  viewerState,
  image,
  onWindowLevelChange,
  onZoomChange,
  onRotate,
  onFlipHorizontal,
  onFlipVertical,
  onInvert,
  onResetView,
  onToolChange,
  onFitToWindow,
}: DicomToolbarProps) {
  const { windowCenter, windowWidth, zoom, rotation, invert, activeTool } = viewerState;

  return (
    <div className="flex items-center gap-2 p-2 bg-background border-b flex-wrap">
      {/* Tool Selection */}
      <div className="flex items-center gap-1">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="icon-sm"
                  onClick={() => onToolChange(tool.id)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{tool.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Window/Level Presets */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Contrast className="h-4 w-4" />
            W/L Presets
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Window/Level Presets</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {WINDOW_LEVEL_PRESETS.map((preset) => (
            <DropdownMenuItem
              key={preset.id}
              onClick={() => onWindowLevelChange(preset.windowCenter, preset.windowWidth)}
            >
              <div className="flex flex-col">
                <span>{preset.name}</span>
                <span className="text-xs text-muted-foreground">
                  C: {preset.windowCenter} W: {preset.windowWidth}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Window/Level Manual Adjustment */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Sun className="h-4 w-4" />
            W/L
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="start">
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Window / Level</h4>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>Window Center</Label>
                <span className="text-muted-foreground">{Math.round(windowCenter)}</span>
              </div>
              <Slider
                value={[windowCenter]}
                onValueChange={([v]) => onWindowLevelChange(v, windowWidth)}
                min={image ? image.minPixelValue : -1024}
                max={image ? image.maxPixelValue : 3071}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>Window Width</Label>
                <span className="text-muted-foreground">{Math.round(windowWidth)}</span>
              </div>
              <Slider
                value={[windowWidth]}
                onValueChange={([v]) => onWindowLevelChange(windowCenter, v)}
                min={1}
                max={image ? image.maxPixelValue - image.minPixelValue : 4095}
                step={1}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                if (image) {
                  onWindowLevelChange(image.windowCenter, image.windowWidth);
                }
              }}
            >
              Reset to Default
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="h-6" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={() => onZoomChange(zoom * 0.8)}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom Out</TooltipContent>
        </Tooltip>

        <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={() => onZoomChange(zoom * 1.25)}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom In</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={onFitToWindow}>
              <Maximize className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Fit to Window</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Rotation and Flip */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={() => onRotate(-90)}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Rotate Left</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={() => onRotate(90)}>
              <RotateCw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Rotate Right</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={viewerState.flipHorizontal ? 'default' : 'ghost'}
              size="icon-sm"
              onClick={onFlipHorizontal}
            >
              <FlipHorizontal className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Flip Horizontal</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={viewerState.flipVertical ? 'default' : 'ghost'}
              size="icon-sm"
              onClick={onFlipVertical}
            >
              <FlipVertical className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Flip Vertical</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Invert */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={invert ? 'default' : 'ghost'}
            size="sm"
            onClick={onInvert}
          >
            <Contrast className="h-4 w-4 mr-2" />
            Invert
          </Button>
        </TooltipTrigger>
        <TooltipContent>Invert Colors</TooltipContent>
      </Tooltip>

      {/* Reset */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" onClick={onResetView}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Reset View</TooltipContent>
      </Tooltip>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Image Info */}
      {image && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Info className="h-4 w-4" />
              Info
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">DICOM Information</h4>

              <div className="space-y-2 text-sm">
                {/* Patient Info */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Patient</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span>{formatPatientName(image.metadata.patientName)}</span>
                  </div>
                  {image.metadata.patientId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID</span>
                      <span>{image.metadata.patientId}</span>
                    </div>
                  )}
                </div>

                {/* Study Info */}
                <div className="space-y-1 pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Study</p>
                  {image.metadata.studyDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span>{formatDicomDate(image.metadata.studyDate)}</span>
                    </div>
                  )}
                  {image.metadata.studyDescription && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Description</span>
                      <span className="truncate max-w-32">{image.metadata.studyDescription}</span>
                    </div>
                  )}
                  {image.metadata.modality && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Modality</span>
                      <Badge variant="outline">
                        {MODALITY_LABELS[image.metadata.modality] || image.metadata.modality}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Image Info */}
                <div className="space-y-1 pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Image</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size</span>
                    <span>
                      {image.width} × {image.height}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bits</span>
                    <span>{image.bitsStored}-bit</span>
                  </div>
                  {image.pixelSpacing && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pixel Spacing</span>
                      <span>
                        {image.pixelSpacing[0].toFixed(3)} × {image.pixelSpacing[1].toFixed(3)} mm
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File Size</span>
                    <span>{formatFileSize(image.fileSize)}</span>
                  </div>
                </div>

                {/* Equipment Info */}
                {(image.metadata.manufacturer || image.metadata.institutionName) && (
                  <div className="space-y-1 pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Equipment</p>
                    {image.metadata.manufacturer && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Manufacturer</span>
                        <span className="truncate max-w-32">{image.metadata.manufacturer}</span>
                      </div>
                    )}
                    {image.metadata.institutionName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Institution</span>
                        <span className="truncate max-w-32">{image.metadata.institutionName}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
