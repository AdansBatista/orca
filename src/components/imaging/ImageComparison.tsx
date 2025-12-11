'use client';

import { useState, useCallback } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import {
  Grid2X2,
  Columns,
  SplitSquareHorizontal,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { BeforeAfterSlider } from './BeforeAfterSlider';

type ComparisonMode = 'side-by-side' | 'grid' | 'slider';

interface ComparisonImage {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  label?: string;
  captureDate?: string | null;
}

interface ImageComparisonProps {
  images: ComparisonImage[];
  mode?: ComparisonMode;
  onModeChange?: (mode: ComparisonMode) => void;
  syncZoom?: boolean;
  className?: string;
  onClose?: () => void;
  showControls?: boolean;
}

export function ImageComparison({
  images,
  mode: initialMode = 'side-by-side',
  onModeChange,
  syncZoom = false,
  className,
  onClose,
  showControls = true,
}: ImageComparisonProps) {
  const [mode, setMode] = useState<ComparisonMode>(initialMode);

  const handleModeChange = useCallback(
    (value: string) => {
      if (value) {
        const newMode = value as ComparisonMode;
        setMode(newMode);
        onModeChange?.(newMode);
      }
    },
    [onModeChange]
  );

  // For slider mode, we need exactly 2 images
  const canUseSlider = images.length === 2;

  // For grid mode, we support 2-4 images
  const gridCols = images.length <= 2 ? 2 : images.length <= 4 ? 2 : 3;

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Control bar */}
      {showControls && (
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-4">
            <ToggleGroup
              type="single"
              value={mode}
              onValueChange={handleModeChange}
            >
              <ToggleGroupItem
                value="side-by-side"
                aria-label="Side by side"
                title="Side by side"
              >
                <Columns className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="grid"
                aria-label="Grid view"
                title="Grid view"
              >
                <Grid2X2 className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="slider"
                aria-label="Slider"
                title="Before/After slider"
                disabled={!canUseSlider}
              >
                <SplitSquareHorizontal className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>

            <Badge variant="outline" className="text-xs">
              {images.length} images
            </Badge>
          </div>

          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Comparison content */}
      <div className="flex-1 overflow-hidden">
        {mode === 'slider' && canUseSlider ? (
          <BeforeAfterSlider
            beforeImage={images[0].url}
            afterImage={images[1].url}
            beforeLabel={images[0].label || 'Before'}
            afterLabel={images[1].label || 'After'}
            className="w-full h-full"
          />
        ) : mode === 'side-by-side' ? (
          <div className="flex h-full">
            {images.slice(0, 2).map((image, index) => (
              <ComparisonPanel
                key={image.id}
                image={image}
                className="flex-1"
                showBorder={index > 0}
              />
            ))}
          </div>
        ) : (
          <div
            className="grid h-full"
            style={{
              gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
              gridTemplateRows: `repeat(${Math.ceil(images.length / gridCols)}, 1fr)`,
            }}
          >
            {images.slice(0, 4).map((image, index) => (
              <ComparisonPanel
                key={image.id}
                image={image}
                showBorder={index > 0}
                compact
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ComparisonPanelProps {
  image: ComparisonImage;
  className?: string;
  showBorder?: boolean;
  compact?: boolean;
}

function ComparisonPanel({
  image,
  className,
  showBorder = false,
  compact = false,
}: ComparisonPanelProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden',
        showBorder && 'border-l',
        className
      )}
    >
      {/* Label */}
      {image.label && (
        <div className="absolute top-2 left-2 z-10">
          <Badge variant="secondary" className="bg-black/60 text-white border-0">
            {image.label}
          </Badge>
        </div>
      )}

      {/* Image with zoom/pan */}
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={8}
        centerOnInit
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Zoom controls */}
            {!compact && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-black/50 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => zoomOut()}
                  className="text-white h-7 w-7"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => zoomIn()}
                  className="text-white h-7 w-7"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => resetTransform()}
                  className="text-white h-7 w-7"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            <TransformComponent
              wrapperStyle={{
                width: '100%',
                height: '100%',
              }}
              contentStyle={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.label || 'Comparison image'}
                className="max-w-full max-h-full object-contain"
                draggable={false}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      {/* Date label */}
      {image.captureDate && (
        <div className="absolute bottom-2 right-2 z-10">
          <Badge variant="outline" className="bg-black/60 text-white border-white/20 text-xs">
            {new Date(image.captureDate).toLocaleDateString()}
          </Badge>
        </div>
      )}
    </div>
  );
}

export type { ComparisonMode, ComparisonImage };
