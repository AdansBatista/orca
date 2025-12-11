'use client';

import { useState, useCallback } from 'react';
import {
  GripVertical,
  Trash2,
  ImageIcon,
  FileText,
  Ruler,
  Clock,
  Plus,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { ReportSection, SectionType, PatientImageData } from './types';
import { SECTION_TYPE_LABELS } from './types';

interface ReportSectionEditorProps {
  section: ReportSection;
  patientImages: PatientImageData[];
  onUpdate: (section: ReportSection) => void;
  onDelete: () => void;
  className?: string;
}

const SECTION_ICONS: Record<SectionType, React.ReactNode> = {
  HEADER: <FileText className="h-4 w-4" />,
  SUMMARY: <FileText className="h-4 w-4" />,
  IMAGES: <ImageIcon className="h-4 w-4" />,
  COLLAGE: <ImageIcon className="h-4 w-4" />,
  COMPARISON: <ImageIcon className="h-4 w-4" />,
  MEASUREMENTS: <Ruler className="h-4 w-4" />,
  NOTES: <FileText className="h-4 w-4" />,
  TIMELINE: <Clock className="h-4 w-4" />,
};

export function ReportSectionEditor({
  section,
  patientImages,
  onUpdate,
  onDelete,
  className,
}: ReportSectionEditorProps) {
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePickerMode, setImagePickerMode] = useState<'single' | 'multiple' | 'before' | 'after'>('multiple');

  const handleTitleChange = useCallback(
    (title: string) => {
      onUpdate({ ...section, title });
    },
    [section, onUpdate]
  );

  const handleContentChange = useCallback(
    (content: string) => {
      onUpdate({ ...section, content });
    },
    [section, onUpdate]
  );

  const handleImageSelect = useCallback(
    (imageId: string) => {
      if (imagePickerMode === 'before') {
        onUpdate({ ...section, beforeImageId: imageId });
      } else if (imagePickerMode === 'after') {
        onUpdate({ ...section, afterImageId: imageId });
      } else if (imagePickerMode === 'multiple') {
        const currentIds = section.imageIds || [];
        if (currentIds.includes(imageId)) {
          onUpdate({ ...section, imageIds: currentIds.filter((id) => id !== imageId) });
        } else {
          onUpdate({ ...section, imageIds: [...currentIds, imageId] });
        }
      }

      if (imagePickerMode !== 'multiple') {
        setShowImagePicker(false);
      }
    },
    [section, onUpdate, imagePickerMode]
  );

  const handleRemoveImage = useCallback(
    (imageId: string) => {
      const currentIds = section.imageIds || [];
      onUpdate({ ...section, imageIds: currentIds.filter((id) => id !== imageId) });
    },
    [section, onUpdate]
  );

  const renderContent = () => {
    switch (section.type) {
      case 'HEADER':
      case 'SUMMARY':
      case 'NOTES':
        return (
          <div className="space-y-3">
            <Input
              value={section.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Section title"
              className="font-medium"
            />
            <Textarea
              value={section.content || ''}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder={
                section.type === 'HEADER'
                  ? 'Enter header information...'
                  : section.type === 'SUMMARY'
                  ? 'Enter summary...'
                  : 'Enter notes...'
              }
              rows={section.type === 'NOTES' ? 4 : 2}
            />
          </div>
        );

      case 'IMAGES':
        return (
          <div className="space-y-3">
            <Input
              value={section.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Section title (e.g., Extraoral Photos)"
            />
            <div className="flex flex-wrap gap-2">
              {(section.imageIds || []).map((imageId) => {
                const image = patientImages.find((img) => img.id === imageId);
                if (!image) return null;
                return (
                  <div
                    key={imageId}
                    className="relative group w-20 h-20 rounded-md overflow-hidden border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.thumbnailUrl || image.fileUrl}
                      alt={image.fileName}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemoveImage(imageId)}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
              <button
                onClick={() => {
                  setImagePickerMode('multiple');
                  setShowImagePicker(true);
                }}
                className="w-20 h-20 rounded-md border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-muted/50 flex items-center justify-center transition-colors"
              >
                <Plus className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        );

      case 'COMPARISON':
        return (
          <div className="space-y-3">
            <Input
              value={section.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Comparison title"
            />
            <div className="grid grid-cols-2 gap-4">
              {/* Before Image */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Before</p>
                {section.beforeImageId ? (
                  <div className="relative group aspect-square rounded-md overflow-hidden border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        patientImages.find((img) => img.id === section.beforeImageId)
                          ?.thumbnailUrl ||
                        patientImages.find((img) => img.id === section.beforeImageId)
                          ?.fileUrl ||
                        ''
                      }
                      alt="Before"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => onUpdate({ ...section, beforeImageId: undefined })}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setImagePickerMode('before');
                      setShowImagePicker(true);
                    }}
                    className="aspect-square w-full rounded-md border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-muted/50 flex flex-col items-center justify-center transition-colors"
                  >
                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground">Select Before</span>
                  </button>
                )}
              </div>

              {/* After Image */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">After</p>
                {section.afterImageId ? (
                  <div className="relative group aspect-square rounded-md overflow-hidden border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        patientImages.find((img) => img.id === section.afterImageId)
                          ?.thumbnailUrl ||
                        patientImages.find((img) => img.id === section.afterImageId)
                          ?.fileUrl ||
                        ''
                      }
                      alt="After"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => onUpdate({ ...section, afterImageId: undefined })}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setImagePickerMode('after');
                      setShowImagePicker(true);
                    }}
                    className="aspect-square w-full rounded-md border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-muted/50 flex flex-col items-center justify-center transition-colors"
                  >
                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground">Select After</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      case 'TIMELINE':
        return (
          <div className="space-y-3">
            <Input
              value={section.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Timeline title"
            />
            <div className="p-4 bg-muted/50 rounded-md text-center text-sm text-muted-foreground">
              Timeline section will display treatment milestones automatically
            </div>
          </div>
        );

      case 'MEASUREMENTS':
        return (
          <div className="space-y-3">
            <Input
              value={section.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Measurements title"
            />
            <div className="p-4 bg-muted/50 rounded-md text-center text-sm text-muted-foreground">
              Measurements section will pull from image measurements
            </div>
          </div>
        );

      case 'COLLAGE':
        return (
          <div className="space-y-3">
            <Input
              value={section.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Collage title"
            />
            <div className="p-4 bg-muted/50 rounded-md text-center text-sm text-muted-foreground">
              Select a collage to include in this section
              <Button variant="outline" size="sm" className="mt-2" disabled>
                Select Collage
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Card className={cn('group', className)}>
        <CardHeader compact className="flex flex-row items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
          <div className="flex items-center gap-2 flex-1">
            {SECTION_ICONS[section.type]}
            <Badge variant="outline" className="text-xs">
              {SECTION_TYPE_LABELS[section.type]}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </CardHeader>
        <CardContent compact>{renderContent()}</CardContent>
      </Card>

      {/* Image Picker Dialog */}
      <Dialog open={showImagePicker} onOpenChange={setShowImagePicker}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {imagePickerMode === 'before'
                ? 'Select Before Image'
                : imagePickerMode === 'after'
                ? 'Select After Image'
                : 'Select Images'}
            </DialogTitle>
            <DialogDescription>
              {imagePickerMode === 'multiple'
                ? 'Click images to add/remove them from the selection'
                : 'Click an image to select it'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            {patientImages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No images available for this patient
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {patientImages.map((image) => {
                  const isSelected =
                    imagePickerMode === 'multiple'
                      ? (section.imageIds || []).includes(image.id)
                      : imagePickerMode === 'before'
                      ? section.beforeImageId === image.id
                      : section.afterImageId === image.id;

                  return (
                    <button
                      key={image.id}
                      onClick={() => handleImageSelect(image.id)}
                      className={cn(
                        'relative aspect-square rounded-md overflow-hidden border-2 transition-all',
                        isSelected
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
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            ✓
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                        <p className="text-white text-xs truncate">{image.category}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {imagePickerMode === 'multiple' && (
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setShowImagePicker(false)}>Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
