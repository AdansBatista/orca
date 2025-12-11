'use client';

import { useState, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize,
  Minimize,
  Download,
  Share2,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BeforeAfterSlider } from '../BeforeAfterSlider';
import type { PresentationData, PresentationSlide, BeforeAfterPair, PresentationLayout } from './types';

interface PresentationViewerProps {
  presentation: PresentationData;
  onExport?: (format: 'PDF' | 'PNG') => void;
  onShare?: () => void;
  className?: string;
}

export function PresentationViewer({
  presentation,
  onExport,
  onShare,
  className,
}: PresentationViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const slides = presentation.slides;
  const totalSlides = slides.length;

  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentSlide(index);
    }
  }, [totalSlides]);

  const nextSlide = useCallback(() => {
    goToSlide(currentSlide + 1);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide - 1);
  }, [currentSlide, goToSlide]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const slide = slides[currentSlide];

  const renderSlideContent = (slide: PresentationSlide) => {
    switch (slide.type) {
      case 'text':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            {slide.title && (
              <h1 className="text-4xl font-bold mb-4">{slide.title}</h1>
            )}
            {slide.content && (
              <p className="text-xl text-muted-foreground max-w-2xl">
                {slide.content}
              </p>
            )}
          </div>
        );

      case 'single-image':
        return slide.imageUrl ? (
          <div className="flex items-center justify-center h-full p-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.imageUrl}
              alt="Slide image"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No image selected
          </div>
        );

      case 'before-after':
        return renderBeforeAfterLayout(slide.pairs || [], slide.layout || 'slider');

      default:
        return null;
    }
  };

  const renderBeforeAfterLayout = (
    pairs: BeforeAfterPair[],
    layout: PresentationLayout
  ) => {
    if (pairs.length === 0 || !pairs[0].beforeImageUrl || !pairs[0].afterImageUrl) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No images selected for this comparison
        </div>
      );
    }

    switch (layout) {
      case 'slider':
        return (
          <div className="p-8 h-full">
            <BeforeAfterSlider
              beforeImage={pairs[0].beforeImageUrl}
              afterImage={pairs[0].afterImageUrl}
              beforeLabel={
                presentation.showDates && pairs[0].beforeDate
                  ? `Before (${formatDate(pairs[0].beforeDate)})`
                  : pairs[0].label || 'Before'
              }
              afterLabel={
                presentation.showDates && pairs[0].afterDate
                  ? `After (${formatDate(pairs[0].afterDate)})`
                  : 'After'
              }
              className="w-full h-full rounded-lg"
            />
          </div>
        );

      case 'side-by-side':
        return (
          <div className="flex items-center justify-center h-full p-8 gap-4">
            {pairs.map((pair) => (
              <div key={pair.id} className="flex-1 flex gap-4 max-w-4xl">
                <div className="flex-1 space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pair.beforeImageUrl}
                    alt="Before"
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <p className="text-center text-sm">
                    Before
                    {presentation.showDates && pair.beforeDate && (
                      <span className="text-muted-foreground">
                        {' '}
                        ({formatDate(pair.beforeDate)})
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex-1 space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pair.afterImageUrl}
                    alt="After"
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <p className="text-center text-sm">
                    After
                    {presentation.showDates && pair.afterDate && (
                      <span className="text-muted-foreground">
                        {' '}
                        ({formatDate(pair.afterDate)})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'stacked':
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 gap-4 overflow-auto">
            {pairs.map((pair) => (
              <div key={pair.id} className="space-y-4 max-w-2xl w-full">
                {pair.label && (
                  <h3 className="text-lg font-semibold text-center">{pair.label}</h3>
                )}
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pair.beforeImageUrl}
                    alt="Before"
                    className="w-full rounded-lg"
                  />
                  <p className="text-center text-sm">
                    Before
                    {presentation.showDates && pair.beforeDate && (
                      <span className="text-muted-foreground">
                        {' '}
                        ({formatDate(pair.beforeDate)})
                      </span>
                    )}
                  </p>
                </div>
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pair.afterImageUrl}
                    alt="After"
                    className="w-full rounded-lg"
                  />
                  <p className="text-center text-sm">
                    After
                    {presentation.showDates && pair.afterDate && (
                      <span className="text-muted-foreground">
                        {' '}
                        ({formatDate(pair.afterDate)})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'grid':
        return (
          <div className="p-8 overflow-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {pairs.flatMap((pair) => [
                <div key={`${pair.id}-before`} className="space-y-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pair.beforeThumbnailUrl || pair.beforeImageUrl}
                    alt="Before"
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <p className="text-xs text-center text-muted-foreground">
                    Before
                    {presentation.showDates && pair.beforeDate && (
                      <> - {formatDate(pair.beforeDate)}</>
                    )}
                  </p>
                </div>,
                <div key={`${pair.id}-after`} className="space-y-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pair.afterThumbnailUrl || pair.afterImageUrl}
                    alt="After"
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <p className="text-xs text-center text-muted-foreground">
                    After
                    {presentation.showDates && pair.afterDate && (
                      <> - {formatDate(pair.afterDate)}</>
                    )}
                  </p>
                </div>,
              ])}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div
      className={cn(
        'flex flex-col bg-black text-white',
        isFullscreen ? 'fixed inset-0 z-50' : 'rounded-lg overflow-hidden',
        className
      )}
    >
      {/* Title Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/50">
        <h2 className="text-sm font-medium truncate">{presentation.title}</h2>
        <div className="flex items-center gap-2">
          {onShare && (
            <Button variant="ghost" size="sm" onClick={onShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          )}
          {onExport && (
            <Button variant="ghost" size="sm" onClick={() => onExport('PDF')}>
              <Download className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Slide Content */}
      <div className="flex-1 bg-gradient-to-b from-gray-900 to-black">
        {renderSlideContent(slide)}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={prevSlide}
          disabled={currentSlide === 0}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-4">
          {presentation.autoPlay && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPlaying((p) => !p)}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          )}
          <div className="flex items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  currentSlide === index
                    ? 'bg-white w-4'
                    : 'bg-white/40 hover:bg-white/60'
                )}
              />
            ))}
          </div>
          <span className="text-sm text-white/60">
            {currentSlide + 1} / {totalSlides}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={nextSlide}
          disabled={currentSlide === totalSlides - 1}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
