'use client';

import { useState, useCallback } from 'react';
import {
  Plus,
  Save,
  Eye,
  Download,
  Share2,
  GripVertical,
  Trash2,
  FileText,
  ImageIcon,
  Columns,
  ArrowLeft,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BeforeAfterPairSelector } from './BeforeAfterPairSelector';
import { PresentationViewer } from './PresentationViewer';
import type {
  PresentationData,
  PresentationSlide,
  PresentationLayout,
  BeforeAfterPair,
} from './types';
import { LAYOUT_LABELS } from './types';

interface PatientImage {
  id: string;
  fileName: string;
  thumbnailUrl: string | null;
  fileUrl: string;
  category: string;
  capturedAt: Date | null;
  createdAt: Date;
}

interface PresentationBuilderProps {
  patientId: string;
  patientName: string;
  patientImages: PatientImage[];
  initialData?: Partial<PresentationData>;
  onSave: (data: PresentationData) => Promise<void>;
  onExport: (format: 'PDF' | 'PNG') => Promise<void>;
  onBack?: () => void;
  className?: string;
}

function generateId(): string {
  return `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function PresentationBuilder({
  patientId,
  patientName,
  patientImages,
  initialData,
  onSave,
  onExport,
  onBack,
  className,
}: PresentationBuilderProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [slides, setSlides] = useState<PresentationSlide[]>(
    initialData?.slides || [
      {
        id: generateId(),
        type: 'before-after',
        layout: 'slider',
        pairs: [],
        order: 0,
      },
    ]
  );
  const [showDates, setShowDates] = useState(initialData?.showDates ?? true);
  const [showLabels, setShowLabels] = useState(initialData?.showLabels ?? true);
  const [autoPlay, setAutoPlay] = useState(initialData?.autoPlay ?? false);

  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(
    slides[0]?.id || null
  );
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedSlide = slides.find((s) => s.id === selectedSlideId);

  const handleAddSlide = useCallback((type: PresentationSlide['type']) => {
    const newSlide: PresentationSlide = {
      id: generateId(),
      type,
      order: slides.length,
      ...(type === 'before-after' && { layout: 'slider' as PresentationLayout, pairs: [] }),
      ...(type === 'text' && { title: '', content: '' }),
    };
    setSlides((prev) => [...prev, newSlide]);
    setSelectedSlideId(newSlide.id);
  }, [slides.length]);

  const handleDeleteSlide = useCallback(
    (slideId: string) => {
      setSlides((prev) => prev.filter((s) => s.id !== slideId));
      if (selectedSlideId === slideId) {
        setSelectedSlideId(slides[0]?.id || null);
      }
    },
    [selectedSlideId, slides]
  );

  const handleUpdateSlide = useCallback(
    (slideId: string, updates: Partial<PresentationSlide>) => {
      setSlides((prev) =>
        prev.map((s) => (s.id === slideId ? { ...s, ...updates } : s))
      );
    },
    []
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave({
        patientId,
        title: title || `${patientName} - Treatment Presentation`,
        description,
        slides,
        showDates,
        showLabels,
        autoPlay,
        autoPlayInterval: 5,
        isPublic: false,
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    patientId,
    patientName,
    title,
    description,
    slides,
    showDates,
    showLabels,
    autoPlay,
    onSave,
  ]);

  const presentationData: PresentationData = {
    patientId,
    title: title || 'Untitled Presentation',
    description,
    slides,
    showDates,
    showLabels,
    autoPlay,
    autoPlayInterval: 5,
    isPublic: false,
  };

  return (
    <>
      <div className={cn('flex h-full', className)}>
        {/* Slide List Sidebar */}
        <div className="w-48 border-r bg-muted/30 p-2 flex flex-col">
          <div className="mb-4">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setSelectedSlideId(slide.id)}
                className={cn(
                  'w-full p-2 rounded-md text-left transition-colors',
                  selectedSlideId === slide.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 opacity-50" />
                  <span className="text-sm truncate flex-1">
                    {index + 1}. {getSlideLabel(slide)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Add Slide
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleAddSlide('before-after')}>
                <Columns className="h-4 w-4 mr-2" />
                Before/After
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddSlide('text')}>
                <FileText className="h-4 w-4 mr-2" />
                Text Slide
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddSlide('single-image')}>
                <ImageIcon className="h-4 w-4 mr-2" />
                Single Image
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main Editor */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Title */}
          <div className="mb-6">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`${patientName} - Treatment Presentation`}
              className="text-lg font-semibold"
            />
          </div>

          {/* Slide Editor */}
          {selectedSlide && (
            <Card>
              <CardHeader compact className="flex flex-row items-center justify-between">
                <CardTitle size="sm" className="flex items-center gap-2">
                  <Badge variant="outline">{getSlideLabel(selectedSlide)}</Badge>
                </CardTitle>
                {slides.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSlide(selectedSlide.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>{renderSlideEditor(selectedSlide)}</CardContent>
            </Card>
          )}
        </div>

        {/* Settings Sidebar */}
        <div className="w-64 border-l bg-muted/30 p-4 flex flex-col">
          <Card className="mb-4">
            <CardHeader compact>
              <CardTitle size="sm">Settings</CardTitle>
            </CardHeader>
            <CardContent compact className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="showDates" className="text-sm">
                  Show Dates
                </Label>
                <Switch
                  id="showDates"
                  checked={showDates}
                  onCheckedChange={setShowDates}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showLabels" className="text-sm">
                  Show Labels
                </Label>
                <Switch
                  id="showLabels"
                  checked={showLabels}
                  onCheckedChange={setShowLabels}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="autoPlay" className="text-sm">
                  Auto Play
                </Label>
                <Switch
                  id="autoPlay"
                  checked={autoPlay}
                  onCheckedChange={setAutoPlay}
                />
              </div>
            </CardContent>
          </Card>

          <div className="mt-auto space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onExport('PDF')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button className="w-full" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl h-[80vh] p-0">
          <PresentationViewer
            presentation={presentationData}
            onExport={onExport}
            className="h-full"
          />
        </DialogContent>
      </Dialog>
    </>
  );

  function renderSlideEditor(slide: PresentationSlide) {
    switch (slide.type) {
      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm mb-1">Title</Label>
              <Input
                value={slide.title || ''}
                onChange={(e) =>
                  handleUpdateSlide(slide.id, { title: e.target.value })
                }
                placeholder="Slide title"
              />
            </div>
            <div>
              <Label className="text-sm mb-1">Content</Label>
              <Textarea
                value={slide.content || ''}
                onChange={(e) =>
                  handleUpdateSlide(slide.id, { content: e.target.value })
                }
                placeholder="Slide content"
                rows={4}
              />
            </div>
          </div>
        );

      case 'single-image':
        return (
          <div className="space-y-4">
            <Label className="text-sm">Select Image</Label>
            <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
              {patientImages.map((image) => (
                <button
                  key={image.id}
                  onClick={() =>
                    handleUpdateSlide(slide.id, {
                      imageId: image.id,
                      imageUrl: image.fileUrl,
                    })
                  }
                  className={cn(
                    'aspect-square rounded-md overflow-hidden border-2 transition-all',
                    slide.imageId === image.id
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-transparent hover:border-muted-foreground/50'
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.thumbnailUrl || image.fileUrl}
                    alt={image.fileName}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        );

      case 'before-after':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm mb-1">Layout</Label>
              <Select
                value={slide.layout || 'slider'}
                onValueChange={(v) =>
                  handleUpdateSlide(slide.id, {
                    layout: v as PresentationLayout,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(LAYOUT_LABELS) as [
                      PresentationLayout,
                      string
                    ][]
                  ).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm mb-2">Image Pairs</Label>
              <BeforeAfterPairSelector
                pairs={slide.pairs || []}
                patientImages={patientImages}
                onUpdate={(pairs) => handleUpdateSlide(slide.id, { pairs })}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  }
}

function getSlideLabel(slide: PresentationSlide): string {
  switch (slide.type) {
    case 'text':
      return slide.title || 'Text';
    case 'single-image':
      return 'Image';
    case 'before-after':
      return 'Before/After';
    case 'collage':
      return 'Collage';
    default:
      return 'Slide';
  }
}
