'use client';

import { useState } from 'react';
import {
  MousePointer2,
  Target,
  Ruler,
  Move,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  RotateCcw,
  Download,
  Settings,
  ChevronDown,
  CheckCircle2,
  Circle,
  Hash,
  Type,
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
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import type {
  CephTool,
  CephToolState,
  CephAnalysisPreset,
  CephLandmark,
  PlacedLandmark,
} from './types';
import {
  ANALYSIS_PRESETS,
  CEPH_LANDMARKS,
  getRequiredLandmarks,
  getAnalysisCompletion,
  LANDMARK_COLORS,
  type LandmarkCategory,
} from './types';

interface CephToolbarProps {
  toolState: CephToolState;
  onToolChange: (tool: CephTool) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onToggleLabels: () => void;
  onToggleLines: () => void;
  onToggleMeasurements: () => void;
  selectedPreset: CephAnalysisPreset | null;
  onPresetChange: (preset: CephAnalysisPreset) => void;
  placedLandmarks: PlacedLandmark[];
  onLandmarkSelect: (landmark: CephLandmark | null) => void;
  onExport?: () => void;
  onCalibrate?: () => void;
}

const TOOL_ICONS: Record<CephTool, React.ComponentType<{ className?: string }>> = {
  SELECT: MousePointer2,
  PLACE: Target,
  CALIBRATE: Ruler,
  PAN: Move,
  ZOOM: ZoomIn,
};

const TOOL_LABELS: Record<CephTool, string> = {
  SELECT: 'Select',
  PLACE: 'Place Landmark',
  CALIBRATE: 'Calibrate',
  PAN: 'Pan',
  ZOOM: 'Zoom',
};

const CATEGORY_ORDER: LandmarkCategory[] = [
  'CRANIAL_BASE',
  'MAXILLA',
  'MANDIBLE',
  'DENTAL',
  'SOFT_TISSUE',
];

const CATEGORY_LABELS: Record<LandmarkCategory, string> = {
  CRANIAL_BASE: 'Cranial Base',
  MAXILLA: 'Maxilla',
  MANDIBLE: 'Mandible',
  DENTAL: 'Dental',
  SOFT_TISSUE: 'Soft Tissue',
};

export function CephToolbar({
  toolState,
  onToolChange,
  onZoomIn,
  onZoomOut,
  onResetView,
  onToggleLabels,
  onToggleLines,
  onToggleMeasurements,
  selectedPreset,
  onPresetChange,
  placedLandmarks,
  onLandmarkSelect,
  onExport,
  onCalibrate,
}: CephToolbarProps) {
  const [landmarkMenuOpen, setLandmarkMenuOpen] = useState(false);

  const requiredLandmarks = selectedPreset
    ? getRequiredLandmarks(selectedPreset.id)
    : CEPH_LANDMARKS.filter((l) => l.isRequired);

  const completion = selectedPreset
    ? getAnalysisCompletion(selectedPreset.id, placedLandmarks)
    : 0;

  const placedIds = new Set(placedLandmarks.map((l) => l.landmarkId));

  const groupedLandmarks = CATEGORY_ORDER.reduce(
    (acc, category) => {
      acc[category] = requiredLandmarks.filter((l) => l.category === category);
      return acc;
    },
    {} as Record<LandmarkCategory, CephLandmark[]>
  );

  return (
    <div className="flex items-center gap-2 p-2 bg-background border-b">
      {/* Analysis Preset Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            {selectedPreset?.name || 'Select Analysis'}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Analysis Type</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {ANALYSIS_PRESETS.map((preset) => (
            <DropdownMenuItem
              key={preset.id}
              onClick={() => onPresetChange(preset)}
              className="flex flex-col items-start gap-1"
            >
              <div className="flex items-center gap-2">
                {selectedPreset?.id === preset.id && (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                )}
                <span className="font-medium">{preset.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {preset.description}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6" />

      {/* Tool Selection */}
      <div className="flex items-center gap-1">
        {(['SELECT', 'PLACE', 'PAN'] as CephTool[]).map((tool) => {
          const Icon = TOOL_ICONS[tool];
          const isActive = toolState.activeTool === tool;
          return (
            <Tooltip key={tool}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="icon-sm"
                  onClick={() => onToolChange(tool)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{TOOL_LABELS[tool]}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Landmark Selector (when in PLACE mode) */}
      {toolState.activeTool === 'PLACE' && (
        <>
          <DropdownMenu open={landmarkMenuOpen} onOpenChange={setLandmarkMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Target className="h-4 w-4" />
                {toolState.placingLandmarkId
                  ? CEPH_LANDMARKS.find(
                      (l) => l.id === toolState.placingLandmarkId
                    )?.name || 'Select Landmark'
                  : 'Select Landmark'}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-72 max-h-96 overflow-auto"
            >
              {CATEGORY_ORDER.map((category) => {
                const landmarks = groupedLandmarks[category];
                if (landmarks.length === 0) return null;

                return (
                  <div key={category}>
                    <DropdownMenuLabel
                      className="flex items-center gap-2"
                      style={{ color: LANDMARK_COLORS[category] }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: LANDMARK_COLORS[category] }}
                      />
                      {CATEGORY_LABELS[category]}
                    </DropdownMenuLabel>
                    {landmarks.map((landmark) => {
                      const isPlaced = placedIds.has(landmark.id);
                      return (
                        <DropdownMenuItem
                          key={landmark.id}
                          onClick={() => {
                            onLandmarkSelect(landmark);
                            setLandmarkMenuOpen(false);
                          }}
                          className="flex items-center gap-2"
                        >
                          {isPlaced ? (
                            <CheckCircle2
                              className="h-4 w-4"
                              style={{ color: LANDMARK_COLORS[category] }}
                            />
                          ) : (
                            <Circle
                              className="h-4 w-4 text-muted-foreground"
                            />
                          )}
                          <span className="font-mono text-xs w-8">
                            {landmark.abbreviation}
                          </span>
                          <span className="flex-1 truncate">{landmark.name}</span>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                  </div>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6" />
        </>
      )}

      {/* Calibrate Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={toolState.activeTool === 'CALIBRATE' ? 'default' : 'ghost'}
            size="icon-sm"
            onClick={onCalibrate}
          >
            <Ruler className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Calibrate (set scale)</TooltipContent>
      </Tooltip>

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

        <span className="text-xs text-muted-foreground w-12 text-center">
          {Math.round(toolState.zoomLevel * 100)}%
        </span>

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

      <Separator orientation="vertical" className="h-6" />

      {/* Display Options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Eye className="h-4 w-4" />
            Display
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuCheckboxItem
            checked={toolState.showLabels}
            onCheckedChange={onToggleLabels}
          >
            <Type className="h-4 w-4 mr-2" />
            Show Labels
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={toolState.showLines}
            onCheckedChange={onToggleLines}
          >
            <Hash className="h-4 w-4 mr-2" />
            Show Reference Lines
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={toolState.showMeasurements}
            onCheckedChange={onToggleMeasurements}
          >
            <Ruler className="h-4 w-4 mr-2" />
            Show Measurements
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Completion Badge */}
      {selectedPreset && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Completion:</span>
          <Badge
            variant={
              completion === 100
                ? 'success'
                : completion >= 50
                  ? 'warning'
                  : 'secondary'
            }
          >
            {completion}%
          </Badge>
        </div>
      )}

      {/* Export Button */}
      {onExport && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export Analysis</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
