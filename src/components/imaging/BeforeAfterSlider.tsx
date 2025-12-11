'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

import { cn } from '@/lib/utils';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  initialPosition?: number; // 0-100, default 50
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
  initialPosition = 50,
  orientation = 'horizontal',
  className,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();

      let newPosition: number;
      if (orientation === 'horizontal') {
        newPosition = ((clientX - rect.left) / rect.width) * 100;
      } else {
        newPosition = ((clientY - rect.top) / rect.height) * 100;
      }

      // Clamp between 0 and 100
      newPosition = Math.max(0, Math.min(100, newPosition));
      setPosition(newPosition);
    },
    [orientation]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      updatePosition(e.clientX, e.clientY);
    },
    [updatePosition]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setIsDragging(true);
      const touch = e.touches[0];
      updatePosition(touch.clientX, touch.clientY);
    },
    [updatePosition]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updatePosition(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      updatePosition(touch.clientX, touch.clientY);
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, updatePosition]);

  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden select-none cursor-ew-resize',
        !isHorizontal && 'cursor-ns-resize',
        className
      )}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* After image (full, in background) */}
      <div className="w-full h-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={afterImage}
          alt={afterLabel}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Before image (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={
          isHorizontal
            ? { clipPath: `inset(0 ${100 - position}% 0 0)` }
            : { clipPath: `inset(0 0 ${100 - position}% 0)` }
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Slider handle */}
      <div
        className={cn(
          'absolute bg-white shadow-lg transition-transform duration-75',
          isDragging && 'scale-110',
          isHorizontal
            ? 'top-0 bottom-0 w-1 -translate-x-1/2'
            : 'left-0 right-0 h-1 -translate-y-1/2'
        )}
        style={
          isHorizontal
            ? { left: `${position}%` }
            : { top: `${position}%` }
        }
      >
        {/* Handle grip */}
        <div
          className={cn(
            'absolute bg-white rounded-full shadow-lg flex items-center justify-center',
            isHorizontal
              ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10'
              : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10'
          )}
        >
          <GripVertical
            className={cn(
              'h-5 w-5 text-muted-foreground',
              !isHorizontal && 'rotate-90'
            )}
          />
        </div>
      </div>

      {/* Labels */}
      <div
        className={cn(
          'absolute px-3 py-1 bg-black/60 text-white text-sm rounded',
          isHorizontal ? 'top-4 left-4' : 'top-4 left-4'
        )}
      >
        {beforeLabel}
      </div>
      <div
        className={cn(
          'absolute px-3 py-1 bg-black/60 text-white text-sm rounded',
          isHorizontal ? 'top-4 right-4' : 'bottom-4 left-4'
        )}
      >
        {afterLabel}
      </div>
    </div>
  );
}
