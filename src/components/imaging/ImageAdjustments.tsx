'use client';

import { useState, useCallback } from 'react';
import {
  Sun,
  Contrast,
  Droplets,
  RotateCcw,
  Palette,
  CircleOff,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export interface ImageAdjustmentsState {
  brightness: number; // 0-200, default 100
  contrast: number; // 0-200, default 100
  saturation: number; // 0-200, default 100
  invert: boolean;
  grayscale: boolean;
}

const DEFAULT_ADJUSTMENTS: ImageAdjustmentsState = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  invert: false,
  grayscale: false,
};

interface ImageAdjustmentsProps {
  value: ImageAdjustmentsState;
  onChange: (adjustments: ImageAdjustmentsState) => void;
  className?: string;
  compact?: boolean;
}

export function ImageAdjustments({
  value,
  onChange,
  className,
  compact = false,
}: ImageAdjustmentsProps) {
  const handleSliderChange = useCallback(
    (key: keyof ImageAdjustmentsState, val: number[]) => {
      onChange({ ...value, [key]: val[0] });
    },
    [value, onChange]
  );

  const handleToggle = useCallback(
    (key: 'invert' | 'grayscale') => {
      onChange({ ...value, [key]: !value[key] });
    },
    [value, onChange]
  );

  const handleReset = useCallback(() => {
    onChange(DEFAULT_ADJUSTMENTS);
  }, [onChange]);

  const hasChanges =
    value.brightness !== 100 ||
    value.contrast !== 100 ||
    value.saturation !== 100 ||
    value.invert ||
    value.grayscale;

  const content = (
    <div className={cn('space-y-4', className)}>
      {/* Brightness */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-xs">
            <Sun className="h-3.5 w-3.5" />
            Brightness
          </Label>
          <span className="text-xs text-muted-foreground">{value.brightness}%</span>
        </div>
        <Slider
          value={[value.brightness]}
          onValueChange={(val) => handleSliderChange('brightness', val)}
          min={0}
          max={200}
          step={5}
        />
      </div>

      {/* Contrast */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-xs">
            <Contrast className="h-3.5 w-3.5" />
            Contrast
          </Label>
          <span className="text-xs text-muted-foreground">{value.contrast}%</span>
        </div>
        <Slider
          value={[value.contrast]}
          onValueChange={(val) => handleSliderChange('contrast', val)}
          min={0}
          max={200}
          step={5}
        />
      </div>

      {/* Saturation */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-xs">
            <Droplets className="h-3.5 w-3.5" />
            Saturation
          </Label>
          <span className="text-xs text-muted-foreground">{value.saturation}%</span>
        </div>
        <Slider
          value={[value.saturation]}
          onValueChange={(val) => handleSliderChange('saturation', val)}
          min={0}
          max={200}
          step={5}
        />
      </div>

      <Separator />

      {/* Toggles */}
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-xs cursor-pointer">
          <CircleOff className="h-3.5 w-3.5" />
          Invert Colors
        </Label>
        <Switch
          checked={value.invert}
          onCheckedChange={() => handleToggle('invert')}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-xs cursor-pointer">
          <Palette className="h-3.5 w-3.5" />
          Grayscale
        </Label>
        <Switch
          checked={value.grayscale}
          onCheckedChange={() => handleToggle('grayscale')}
        />
      </div>

      {/* Reset Button */}
      {hasChanges && (
        <>
          <Separator />
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="w-full"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-2" />
            Reset to Default
          </Button>
        </>
      )}
    </div>
  );

  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'text-white h-8 w-8',
              hasChanges && 'text-primary-400'
            )}
          >
            <Sun className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-64"
          side="top"
          align="center"
        >
          <div className="text-sm font-medium mb-3">Image Adjustments</div>
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  return content;
}

/**
 * Generate CSS filter string from adjustments
 */
export function getFilterStyle(adjustments: ImageAdjustmentsState): string {
  const filters: string[] = [];

  if (adjustments.brightness !== 100) {
    filters.push(`brightness(${adjustments.brightness / 100})`);
  }
  if (adjustments.contrast !== 100) {
    filters.push(`contrast(${adjustments.contrast / 100})`);
  }
  if (adjustments.saturation !== 100) {
    filters.push(`saturate(${adjustments.saturation / 100})`);
  }
  if (adjustments.invert) {
    filters.push('invert(1)');
  }
  if (adjustments.grayscale) {
    filters.push('grayscale(1)');
  }

  return filters.length > 0 ? filters.join(' ') : 'none';
}

export { DEFAULT_ADJUSTMENTS };
