'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type ToothNotation = 'UNIVERSAL' | 'FDI' | 'PALMER';

export interface ToothData {
  toothNumber: number;
  status?: 'normal' | 'missing' | 'extracted' | 'impacted' | 'selected' | 'treated' | 'issue';
  bracket?: boolean;
  wire?: boolean;
  elastic?: boolean;
  note?: string;
  color?: string;
}

interface ToothChartProps {
  teeth?: ToothData[];
  notation?: ToothNotation;
  onToothClick?: (toothNumber: number) => void;
  onToothSelect?: (toothNumbers: number[]) => void;
  selectedTeeth?: number[];
  multiSelect?: boolean;
  showLabels?: boolean;
  showLegend?: boolean;
  highlightQuadrant?: 1 | 2 | 3 | 4;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  readOnly?: boolean;
  className?: string;
}

// Universal tooth numbering (1-32)
const universalUpperTeeth = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const universalLowerTeeth = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];

// FDI notation mapping
const fdiUpperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const fdiLowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// Palmer notation (quadrant + tooth number)
const palmerUpperTeeth = ['8┘', '7┘', '6┘', '5┘', '4┘', '3┘', '2┘', '1┘', '┌1', '┌2', '┌3', '┌4', '┌5', '┌6', '┌7', '┌8'];
const palmerLowerTeeth = ['8┐', '7┐', '6┐', '5┐', '4┐', '3┐', '2┐', '1┐', '└1', '└2', '└3', '└4', '└5', '└6', '└7', '└8'];

// Tooth names for tooltips
const toothNames: Record<number, string> = {
  // Upper right (1-8)
  1: 'Upper Right Third Molar', 2: 'Upper Right Second Molar', 3: 'Upper Right First Molar',
  4: 'Upper Right Second Premolar', 5: 'Upper Right First Premolar', 6: 'Upper Right Canine',
  7: 'Upper Right Lateral Incisor', 8: 'Upper Right Central Incisor',
  // Upper left (9-16)
  9: 'Upper Left Central Incisor', 10: 'Upper Left Lateral Incisor', 11: 'Upper Left Canine',
  12: 'Upper Left First Premolar', 13: 'Upper Left Second Premolar', 14: 'Upper Left First Molar',
  15: 'Upper Left Second Molar', 16: 'Upper Left Third Molar',
  // Lower left (17-24)
  17: 'Lower Left Third Molar', 18: 'Lower Left Second Molar', 19: 'Lower Left First Molar',
  20: 'Lower Left Second Premolar', 21: 'Lower Left First Premolar', 22: 'Lower Left Canine',
  23: 'Lower Left Lateral Incisor', 24: 'Lower Left Central Incisor',
  // Lower right (25-32)
  25: 'Lower Right Central Incisor', 26: 'Lower Right Lateral Incisor', 27: 'Lower Right Canine',
  28: 'Lower Right First Premolar', 29: 'Lower Right Second Premolar', 30: 'Lower Right First Molar',
  31: 'Lower Right Second Molar', 32: 'Lower Right Third Molar',
};

const statusColors: Record<string, string> = {
  normal: 'bg-muted hover:bg-muted/80',
  missing: 'bg-gray-300 text-gray-500',
  extracted: 'bg-gray-400 text-gray-600 line-through',
  impacted: 'bg-warning-100 text-warning-700',
  selected: 'bg-primary-500 text-white ring-2 ring-primary-300',
  treated: 'bg-success-100 text-success-700',
  issue: 'bg-error-100 text-error-700',
};

const sizeClasses = {
  sm: 'w-6 h-8 text-[10px]',
  md: 'w-8 h-10 text-xs',
  lg: 'w-10 h-12 text-sm',
};

export function ToothChart({
  teeth = [],
  notation = 'UNIVERSAL',
  onToothClick,
  onToothSelect,
  selectedTeeth = [],
  multiSelect = false,
  showLabels = true,
  showLegend = false,
  highlightQuadrant,
  size = 'md',
  interactive = true,
  readOnly = false,
  className,
}: ToothChartProps) {
  const [internalSelected, setInternalSelected] = useState<number[]>(selectedTeeth);

  const selected = onToothSelect ? selectedTeeth : internalSelected;

  const teethMap = useMemo(() => {
    const map = new Map<number, ToothData>();
    teeth.forEach((tooth) => map.set(tooth.toothNumber, tooth));
    return map;
  }, [teeth]);

  const getToothLabel = (universalNumber: number, index: number, isUpper: boolean): string => {
    switch (notation) {
      case 'FDI':
        return isUpper ? String(fdiUpperTeeth[index]) : String(fdiLowerTeeth[index]);
      case 'PALMER':
        return isUpper ? palmerUpperTeeth[index] : palmerLowerTeeth[index];
      default:
        return String(universalNumber);
    }
  };

  const handleToothClick = (toothNumber: number) => {
    if (readOnly || !interactive) return;

    if (onToothClick) {
      onToothClick(toothNumber);
    }

    if (multiSelect) {
      const newSelected = selected.includes(toothNumber)
        ? selected.filter((t) => t !== toothNumber)
        : [...selected, toothNumber];

      if (onToothSelect) {
        onToothSelect(newSelected);
      } else {
        setInternalSelected(newSelected);
      }
    } else {
      const newSelected = selected.includes(toothNumber) ? [] : [toothNumber];
      if (onToothSelect) {
        onToothSelect(newSelected);
      } else {
        setInternalSelected(newSelected);
      }
    }
  };

  const getQuadrant = (toothNumber: number): 1 | 2 | 3 | 4 => {
    if (toothNumber >= 1 && toothNumber <= 8) return 1;
    if (toothNumber >= 9 && toothNumber <= 16) return 2;
    if (toothNumber >= 17 && toothNumber <= 24) return 3;
    return 4;
  };

  const renderTooth = (universalNumber: number, index: number, isUpper: boolean) => {
    const toothData = teethMap.get(universalNumber);
    const isSelected = selected.includes(universalNumber);
    const quadrant = getQuadrant(universalNumber);
    const isHighlighted = !highlightQuadrant || highlightQuadrant === quadrant;

    const status = isSelected ? 'selected' : toothData?.status || 'normal';
    const label = getToothLabel(universalNumber, index, isUpper);

    const toothElement = (
      <button
        key={universalNumber}
        type="button"
        onClick={() => handleToothClick(universalNumber)}
        disabled={readOnly || !interactive}
        className={cn(
          'flex flex-col items-center justify-center rounded transition-all',
          sizeClasses[size],
          statusColors[status],
          interactive && !readOnly && 'cursor-pointer',
          !interactive || readOnly ? 'cursor-default' : '',
          !isHighlighted && 'opacity-40',
          toothData?.color && `bg-${toothData.color}-100`,
        )}
        style={toothData?.color ? { backgroundColor: toothData.color } : undefined}
      >
        {showLabels && <span className="font-medium">{label}</span>}
        {/* Appliance indicators */}
        <div className="flex gap-0.5">
          {toothData?.bracket && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500" title="Bracket" />
          )}
          {toothData?.wire && (
            <span className="w-1.5 h-1.5 rounded-full bg-secondary-500" title="Wire" />
          )}
          {toothData?.elastic && (
            <span className="w-1.5 h-1.5 rounded-full bg-accent-500" title="Elastic" />
          )}
        </div>
      </button>
    );

    if (toothData?.note || toothNames[universalNumber]) {
      return (
        <TooltipProvider key={universalNumber}>
          <Tooltip>
            <TooltipTrigger asChild>{toothElement}</TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{toothNames[universalNumber]}</p>
              {toothData?.note && <p className="text-xs text-muted-foreground">{toothData.note}</p>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return toothElement;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upper Arch */}
      <div className="space-y-1">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-muted-foreground">Right</span>
          <span className="text-xs font-medium">Upper Arch</span>
          <span className="text-xs text-muted-foreground">Left</span>
        </div>
        <div className="flex justify-center gap-0.5">
          {universalUpperTeeth.map((tooth, index) => renderTooth(tooth, index, true))}
        </div>
      </div>

      {/* Midline indicator */}
      <div className="flex justify-center">
        <div className="w-px h-4 bg-border" />
      </div>

      {/* Lower Arch */}
      <div className="space-y-1">
        <div className="flex justify-center gap-0.5">
          {universalLowerTeeth.map((tooth, index) => renderTooth(tooth, index, false))}
        </div>
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-muted-foreground">Right</span>
          <span className="text-xs font-medium">Lower Arch</span>
          <span className="text-xs text-muted-foreground">Left</span>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap justify-center gap-2 pt-2 border-t">
          <Badge variant="outline" size="sm" className="gap-1">
            <span className="w-2 h-2 rounded bg-muted" /> Normal
          </Badge>
          <Badge variant="outline" size="sm" className="gap-1">
            <span className="w-2 h-2 rounded bg-success-100" /> Treated
          </Badge>
          <Badge variant="outline" size="sm" className="gap-1">
            <span className="w-2 h-2 rounded bg-error-100" /> Issue
          </Badge>
          <Badge variant="outline" size="sm" className="gap-1">
            <span className="w-2 h-2 rounded bg-gray-300" /> Missing
          </Badge>
          <Badge variant="outline" size="sm" className="gap-1">
            <span className="w-2 h-2 rounded bg-primary-500" /> Selected
          </Badge>
        </div>
      )}

      {/* Selected teeth summary */}
      {selected.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Selected: {selected.sort((a, b) => a - b).join(', ')}
        </div>
      )}
    </div>
  );
}

// Utility functions for tooth number conversions
export function universalToFDI(universal: number): number {
  const index = universalUpperTeeth.indexOf(universal);
  if (index !== -1) return fdiUpperTeeth[index];
  const lowerIndex = universalLowerTeeth.indexOf(universal);
  if (lowerIndex !== -1) return fdiLowerTeeth[lowerIndex];
  return universal;
}

export function fdiToUniversal(fdi: number): number {
  const upperIndex = fdiUpperTeeth.indexOf(fdi);
  if (upperIndex !== -1) return universalUpperTeeth[upperIndex];
  const lowerIndex = fdiLowerTeeth.indexOf(fdi);
  if (lowerIndex !== -1) return universalLowerTeeth[lowerIndex];
  return fdi;
}

export function getToothName(universal: number): string {
  return toothNames[universal] || `Tooth ${universal}`;
}

export function getQuadrantTeeth(quadrant: 1 | 2 | 3 | 4): number[] {
  switch (quadrant) {
    case 1: return [1, 2, 3, 4, 5, 6, 7, 8];
    case 2: return [9, 10, 11, 12, 13, 14, 15, 16];
    case 3: return [17, 18, 19, 20, 21, 22, 23, 24];
    case 4: return [25, 26, 27, 28, 29, 30, 31, 32];
  }
}

export function getArchTeeth(arch: 'UPPER' | 'LOWER'): number[] {
  return arch === 'UPPER' ? universalUpperTeeth : universalLowerTeeth.slice().reverse();
}
