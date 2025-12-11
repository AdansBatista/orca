'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Save,
  Download,
  RotateCcw,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CollagePreview } from './CollagePreview';
import type {
  CollageSlot,
  CollageLayout,
  SlotAssignment,
  CollageTemplateData,
} from './types';

const CATEGORY_LABELS: Record<string, string> = {
  EXTRAORAL_PHOTO: 'Extraoral Photo',
  INTRAORAL_PHOTO: 'Intraoral Photo',
  PANORAMIC_XRAY: 'Panoramic X-Ray',
  CEPHALOMETRIC_XRAY: 'Cephalometric X-Ray',
  PERIAPICAL_XRAY: 'Periapical X-Ray',
  CBCT: 'CBCT',
  SCAN_3D: '3D Scan',
  OTHER: 'Other',
};

interface PatientImage {
  id: string;
  fileName: string;
  fileUrl: string;
  thumbnailUrl: string | null;
  category: string;
  subcategory: string | null;
  captureDate: string | null;
  createdAt: string;
}

interface CollageEditorProps {
  template: CollageTemplateData;
  patientId: string;
  initialAssignments?: Record<string, SlotAssignment>;
  onSave?: (data: {
    title: string;
    assignments: Record<string, SlotAssignment>;
  }) => Promise<void>;
  onExport?: (format: 'PNG' | 'JPG' | 'PDF') => Promise<void>;
  className?: string;
}

export function CollageEditor({
  template,
  patientId,
  initialAssignments = {},
  onSave,
  onExport,
  className,
}: CollageEditorProps) {
  const [title, setTitle] = useState(`${template.name} - ${new Date().toLocaleDateString()}`);
  const [assignments, setAssignments] = useState<Record<string, SlotAssignment>>(initialAssignments);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Image picker state
  const [availableImages, setAvailableImages] = useState<PatientImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('__all__');

  const collageRef = useRef<HTMLDivElement>(null);

  // Get the slot being edited
  const currentSlot = selectedSlot
    ? template.slots.find((s) => s.id === selectedSlot)
    : null;

  // Load patient images
  const loadImages = useCallback(async () => {
    setIsLoadingImages(true);
    try {
      const params = new URLSearchParams();
      params.set('patientId', patientId);
      if (categoryFilter && categoryFilter !== '__all__') params.set('category', categoryFilter);
      params.set('pageSize', '100');

      const response = await fetch(`/api/images?${params}`);
      const data = await response.json();

      if (data.success && data.data?.items) {
        setAvailableImages(data.data.items);
      }
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setIsLoadingImages(false);
    }
  }, [patientId, categoryFilter]);

  // Handle slot selection
  const handleSlotClick = useCallback((slotId: string) => {
    setSelectedSlot(slotId);
    setShowImagePicker(true);
    // Set category filter based on slot's expected category
    const slot = template.slots.find((s) => s.id === slotId);
    if (slot?.category) {
      setCategoryFilter(slot.category);
    } else {
      setCategoryFilter('__all__');
    }
  }, [template.slots]);

  // Handle image selection
  const handleImageSelect = useCallback((image: PatientImage) => {
    if (!selectedSlot) return;

    setAssignments((prev) => ({
      ...prev,
      [selectedSlot]: {
        slotId: selectedSlot,
        imageId: image.id,
        imageUrl: image.fileUrl,
        thumbnailUrl: image.thumbnailUrl || undefined,
        label: image.subcategory || CATEGORY_LABELS[image.category] || undefined,
      },
    }));
    setShowImagePicker(false);
    setSelectedSlot(null);
  }, [selectedSlot]);

  // Handle image removal
  const handleRemoveImage = useCallback((slotId: string) => {
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  }, []);

  // Handle reset
  const handleReset = useCallback(() => {
    setAssignments({});
    setTitle(`${template.name} - ${new Date().toLocaleDateString()}`);
  }, [template.name]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave({ title, assignments });
    } catch (error) {
      console.error('Failed to save collage:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave, title, assignments]);

  // Handle export
  const handleExport = useCallback(async (format: 'PNG' | 'JPG' | 'PDF') => {
    if (!onExport) return;
    setIsExporting(true);
    try {
      await onExport(format);
    } catch (error) {
      console.error('Failed to export collage:', error);
    } finally {
      setIsExporting(false);
    }
  }, [onExport]);

  // Check if required slots are filled
  const requiredSlots = template.slots.filter((s) => s.required);
  const filledRequiredSlots = requiredSlots.filter((s) => assignments[s.id]);
  const isComplete = filledRequiredSlots.length === requiredSlots.length;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex-1 max-w-md">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Collage title..."
            className="text-lg font-medium"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('PNG')}
            disabled={isExporting || Object.keys(assignments).length === 0}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !isComplete}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collage preview */}
        <div className="flex-1 p-6 overflow-auto bg-muted/30">
          <div ref={collageRef} className="max-w-4xl mx-auto">
            <CollagePreview
              layout={template.layout}
              slots={template.slots}
              assignments={assignments}
              aspectRatio={template.aspectRatio}
              background={template.background}
              padding={template.padding}
              gap={template.gap}
              showLabels
              interactive
              selectedSlot={selectedSlot}
              onSlotClick={handleSlotClick}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l bg-background overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Template info */}
            <div>
              <h3 className="font-medium mb-2">Template</h3>
              <Card variant="ghost">
                <CardContent className="p-3">
                  <p className="font-medium text-sm">{template.name}</p>
                  {template.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {template.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {template.layout.rows}×{template.layout.cols}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {template.aspectRatio}
                    </Badge>
                    <Badge variant="soft-primary" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Slot assignments */}
            <div>
              <h3 className="font-medium mb-2">
                Slots ({Object.keys(assignments).length}/{template.slots.length})
              </h3>
              <div className="space-y-2">
                {template.slots.map((slot) => {
                  const assignment = assignments[slot.id];
                  return (
                    <div
                      key={slot.id}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-lg border transition-colors cursor-pointer',
                        assignment ? 'bg-muted/50' : 'bg-background',
                        selectedSlot === slot.id && 'ring-2 ring-primary'
                      )}
                      onClick={() => handleSlotClick(slot.id)}
                    >
                      {assignment ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={assignment.thumbnailUrl || assignment.imageUrl}
                            alt={slot.label || 'Slot image'}
                            className="w-12 h-12 rounded object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {slot.label || `Slot ${slot.id}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {assignment.label || 'Image assigned'}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(slot.id);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {slot.label || `Slot ${slot.id}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {slot.required ? (
                                <span className="text-destructive">Required</span>
                              ) : (
                                'Click to add image'
                              )}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Completion status */}
            {requiredSlots.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Status</h3>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Required slots</span>
                    <span className="text-sm font-medium">
                      {filledRequiredSlots.length}/{requiredSlots.length}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        isComplete ? 'bg-success-500' : 'bg-primary'
                      )}
                      style={{
                        width: `${(filledRequiredSlots.length / requiredSlots.length) * 100}%`,
                      }}
                    />
                  </div>
                  {isComplete && (
                    <p className="text-xs text-success-600 mt-2">
                      All required slots filled!
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Picker Dialog */}
      <Dialog
        open={showImagePicker}
        onOpenChange={(open) => {
          setShowImagePicker(open);
          if (!open) setSelectedSlot(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Select Image for: {currentSlot?.label || selectedSlot}
            </DialogTitle>
            <DialogDescription>
              Choose an image from the patient&apos;s gallery
            </DialogDescription>
          </DialogHeader>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-4">
            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value);
                loadImages();
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Categories</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadImages} disabled={isLoadingImages}>
              {isLoadingImages ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Refresh'
              )}
            </Button>
          </div>

          {/* Image Grid */}
          <div className="overflow-y-auto max-h-[50vh]">
            {isLoadingImages ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : availableImages.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No images found. Click &quot;Refresh&quot; to load images.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {availableImages.map((image) => {
                  const isUsed = Object.values(assignments).some(
                    (a) => a.imageId === image.id
                  );
                  return (
                    <div
                      key={image.id}
                      className={cn(
                        'relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all',
                        isUsed
                          ? 'border-muted opacity-50'
                          : 'border-transparent hover:border-primary'
                      )}
                      onClick={() => !isUsed && handleImageSelect(image)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.thumbnailUrl || image.fileUrl}
                        alt={image.fileName}
                        className="w-full aspect-square object-cover"
                      />
                      {isUsed && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Badge>In Use</Badge>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-xs text-white truncate">
                          {CATEGORY_LABELS[image.category] || image.category}
                        </p>
                        {image.captureDate && (
                          <p className="text-xs text-white/70 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(image.captureDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
