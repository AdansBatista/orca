'use client';

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize2,
  X,
  Calendar,
  DollarSign,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

import type { PresentationSlide, TreatmentOptionSlide } from './CasePresentationBuilder';

export interface CasePresentationData {
  id: string;
  title: string;
  description?: string;
  presentationType: string;
  slides: PresentationSlide[];
  treatmentOptions?: TreatmentOptionSlide[];
  patientName?: string;
  createdAt?: string;
}

interface CasePresentationViewerProps {
  presentation: CasePresentationData;
  onClose?: () => void;
  onAcceptPlan?: (optionId: string) => Promise<void>;
}

const slideTypeIcons: Record<string, typeof FileText> = {
  intro: FileText,
  diagnosis: FileText,
  treatment_option: FileText,
  comparison: FileText,
  timeline: Calendar,
  financial: DollarSign,
  photos: ImageIcon,
  custom: FileText,
};

export function CasePresentationViewer({
  presentation,
  onClose,
  onAcceptPlan,
}: CasePresentationViewerProps) {
  const visibleSlides = presentation.slides.filter((s) => s.isVisible);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [acceptingPlan, setAcceptingPlan] = useState(false);

  const currentSlide = visibleSlides[currentSlideIndex];
  const progress = ((currentSlideIndex + 1) / visibleSlides.length) * 100;

  const goToSlide = (index: number) => {
    if (index >= 0 && index < visibleSlides.length) {
      setCurrentSlideIndex(index);
    }
  };

  const nextSlide = () => {
    if (currentSlideIndex < visibleSlides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleAcceptPlan = async (optionId: string) => {
    if (!onAcceptPlan) return;
    setAcceptingPlan(true);
    try {
      await onAcceptPlan(optionId);
    } finally {
      setAcceptingPlan(false);
    }
  };

  // Auto-advance slides when playing
  useState(() => {
    if (isPlaying) {
      const timer = setInterval(() => {
        nextSlide();
      }, 5000);
      return () => clearInterval(timer);
    }
  });

  const renderSlideContent = (slide: PresentationSlide) => {
    const Icon = slideTypeIcons[slide.type] || FileText;

    switch (slide.type) {
      case 'treatment_option': {
        const optionId = slide.metadata?.optionId as string;
        const option = presentation.treatmentOptions?.find((o) => o.optionId === optionId);

        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Icon className="h-12 w-12 mx-auto text-primary opacity-50" />
              <h2 className="text-3xl font-bold">{slide.title}</h2>
              {slide.content && (
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {slide.content}
                </p>
              )}
            </div>

            {option && (
              <Card className="max-w-lg mx-auto">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{option.optionName}</CardTitle>
                    {option.isRecommended && (
                      <Badge variant="success">Recommended</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Appliance Type</p>
                      <p className="font-medium">{option.applianceType}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-medium">{option.duration} months</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Estimated Cost</p>
                      <p className="font-medium text-lg">
                        ${option.totalFee.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {option.features.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Features</p>
                      <ul className="space-y-1">
                        {option.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-success-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {onAcceptPlan && (
                    <Button
                      className="w-full"
                      onClick={() => handleAcceptPlan(option.optionId)}
                      disabled={acceptingPlan}
                    >
                      {acceptingPlan ? 'Accepting...' : 'Accept This Plan'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        );
      }

      case 'comparison': {
        const options = presentation.treatmentOptions || [];

        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Icon className="h-12 w-12 mx-auto text-primary opacity-50" />
              <h2 className="text-3xl font-bold">{slide.title}</h2>
              {slide.content && (
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {slide.content}
                </p>
              )}
            </div>

            {options.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
                {options.map((option) => (
                  <Card
                    key={option.optionId}
                    className={option.isRecommended ? 'ring-2 ring-primary' : ''}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle size="sm">{option.optionName}</CardTitle>
                        {option.isRecommended && (
                          <Badge variant="success" size="sm">Recommended</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{option.applianceType}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-medium">{option.duration} mo</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cost</span>
                        <span className="font-medium">${option.totalFee.toLocaleString()}</span>
                      </div>

                      {onAcceptPlan && (
                        <Button
                          size="sm"
                          variant={option.isRecommended ? 'default' : 'outline'}
                          className="w-full mt-2"
                          onClick={() => handleAcceptPlan(option.optionId)}
                          disabled={acceptingPlan}
                        >
                          Select
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      }

      case 'photos': {
        const imageUrls = slide.imageUrls || [];

        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Icon className="h-12 w-12 mx-auto text-primary opacity-50" />
              <h2 className="text-3xl font-bold">{slide.title}</h2>
              {slide.content && (
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {slide.content}
                </p>
              )}
            </div>

            {imageUrls.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
                {imageUrls.map((url, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-muted rounded-lg overflow-hidden"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-w-2xl mx-auto text-center py-12 text-muted-foreground">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No photos added to this slide</p>
              </div>
            )}
          </div>
        );
      }

      case 'financial': {
        const options = presentation.treatmentOptions || [];
        const recommendedOption = options.find((o) => o.isRecommended) || options[0];

        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Icon className="h-12 w-12 mx-auto text-primary opacity-50" />
              <h2 className="text-3xl font-bold">{slide.title}</h2>
              {slide.content && (
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {slide.content}
                </p>
              )}
            </div>

            {recommendedOption && (
              <Card className="max-w-lg mx-auto">
                <CardHeader>
                  <CardTitle size="sm">Treatment Investment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-1">Total Fee</p>
                    <p className="text-4xl font-bold">
                      ${recommendedOption.totalFee.toLocaleString()}
                    </p>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <p className="text-sm font-medium">Payment Options Available:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Full payment discount</li>
                      <li>• Monthly payment plans</li>
                      <li>• Insurance accepted</li>
                      <li>• Flexible financing options</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      }

      case 'timeline': {
        const recommendedOption = presentation.treatmentOptions?.find((o) => o.isRecommended);
        const duration = recommendedOption?.duration || 18;

        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Icon className="h-12 w-12 mx-auto text-primary opacity-50" />
              <h2 className="text-3xl font-bold">{slide.title}</h2>
              {slide.content && (
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {slide.content}
                </p>
              )}
            </div>

            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      Estimated Treatment Duration
                    </p>
                    <p className="text-3xl font-bold">{duration} months</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { phase: 'Initial Alignment', duration: '2-4 months', complete: 0 },
                      { phase: 'Space Closure', duration: '4-6 months', complete: 25 },
                      { phase: 'Detailing & Finishing', duration: '2-4 months', complete: 70 },
                      { phase: 'Retention', duration: 'Ongoing', complete: 95 },
                    ].map((phase, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{phase.phase}</p>
                          <p className="text-sm text-muted-foreground">{phase.duration}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      default:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Icon className="h-12 w-12 mx-auto text-primary opacity-50" />
              <h2 className="text-3xl font-bold">{slide.title}</h2>
              {slide.content && (
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto whitespace-pre-wrap">
                  {slide.content}
                </p>
              )}
            </div>
          </div>
        );
    }
  };

  const viewerContent = (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'h-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-lg font-semibold">{presentation.title}</h1>
          {presentation.patientName && (
            <p className="text-sm text-muted-foreground">
              For: {presentation.patientName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {currentSlideIndex + 1} / {visibleSlides.length}
          </Badge>
          <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          {onClose && !isFullscreen && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={progress} className="h-1 rounded-none" />

      {/* Slide Content */}
      <div className="flex-1 overflow-auto p-8">
        {currentSlide && renderSlideContent(currentSlide)}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between p-4 border-t bg-muted/30">
        <Button
          variant="outline"
          onClick={prevSlide}
          disabled={currentSlideIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={togglePlayPause}>
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          <div className="flex gap-1">
            {visibleSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentSlideIndex
                    ? 'bg-primary'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          onClick={nextSlide}
          disabled={currentSlideIndex === visibleSlides.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  return viewerContent;
}
