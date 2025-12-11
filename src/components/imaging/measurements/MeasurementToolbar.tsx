'use client';

import {
  Ruler,
  Triangle,
  Pentagon,
  Settings2,
  Trash2,
  Eye,
  EyeOff,
  Save,
  MousePointer,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type MeasurementTool = 'select' | 'linear' | 'angle' | 'area' | 'calibrate';

export interface CalibrationSettings {
  pixelsPerMm: number;
  isCalibrated: boolean;
}

interface MeasurementToolbarProps {
  activeTool: MeasurementTool;
  onToolChange: (tool: MeasurementTool) => void;
  calibration: CalibrationSettings;
  onCalibrationChange: (calibration: CalibrationSettings) => void;
  onDelete: () => void;
  onSave: () => void;
  measurementsVisible: boolean;
  onToggleVisibility: () => void;
  hasSelection: boolean;
  isSaving?: boolean;
  className?: string;
}

const TOOLS: {
  id: MeasurementTool;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}[] = [
  { id: 'select', icon: MousePointer, label: 'Select', description: 'Select and edit measurements' },
  { id: 'linear', icon: Ruler, label: 'Linear', description: 'Measure distance between 2 points' },
  { id: 'angle', icon: Triangle, label: 'Angle', description: 'Measure angle between 3 points' },
  { id: 'area', icon: Pentagon, label: 'Area', description: 'Measure polygon area' },
];

export function MeasurementToolbar({
  activeTool,
  onToolChange,
  calibration,
  onCalibrationChange,
  onDelete,
  onSave,
  measurementsVisible,
  onToggleVisibility,
  hasSelection,
  isSaving = false,
  className,
}: MeasurementToolbarProps) {
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
            <TooltipContent side="bottom">
              <p className="font-medium">{tool.label}</p>
              <p className="text-xs text-muted-foreground">{tool.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        <Separator orientation="vertical" className="h-6 bg-white/20 mx-1" />

        {/* Calibration */}
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8 text-white hover:bg-white/20',
                    calibration.isCalibrated && 'text-green-400'
                  )}
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Calibration</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-72" align="center">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Measurement Calibration</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Set the scale to convert pixels to millimeters for accurate measurements.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pixels-per-mm">Pixels per mm</Label>
                <Input
                  id="pixels-per-mm"
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={calibration.pixelsPerMm}
                  onChange={(e) =>
                    onCalibrationChange({
                      ...calibration,
                      pixelsPerMm: parseFloat(e.target.value) || 1,
                      isCalibrated: true,
                    })
                  }
                />
              </div>

              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">How to calibrate:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Use Linear tool to measure a known distance</li>
                  <li>Note the pixel value shown</li>
                  <li>Divide pixels by the known mm value</li>
                  <li>Enter result above</li>
                </ol>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm">
                  Status:{' '}
                  <span className={calibration.isCalibrated ? 'text-green-600' : 'text-amber-600'}>
                    {calibration.isCalibrated ? 'Calibrated' : 'Not calibrated'}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onCalibrationChange({
                      pixelsPerMm: 1,
                      isCalibrated: false,
                    })
                  }
                >
                  Reset
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6 bg-white/20 mx-1" />

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

        {/* Visibility toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={onToggleVisibility}
            >
              {measurementsVisible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {measurementsVisible ? 'Hide Measurements' : 'Show Measurements'}
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
          <TooltipContent side="bottom">Save Measurements</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export const DEFAULT_CALIBRATION: CalibrationSettings = {
  pixelsPerMm: 1,
  isCalibrated: false,
};
