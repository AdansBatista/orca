'use client';

import { useState, useCallback, useMemo } from 'react';
import { Plus, X, ImageIcon, Calendar, ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import type { BeforeAfterPair } from './types';

interface PatientImage {
  id: string;
  fileName: string;
  thumbnailUrl: string | null;
  fileUrl: string;
  category: string;
  capturedAt: Date | null;
  createdAt: Date;
}

interface BeforeAfterPairSelectorProps {
  pairs: BeforeAfterPair[];
  patientImages: PatientImage[];
  onUpdate: (pairs: BeforeAfterPair[]) => void;
  maxPairs?: number;
  className?: string;
}

export function BeforeAfterPairSelector({
  pairs,
  patientImages,
  onUpdate,
  maxPairs = 10,
  className,
}: BeforeAfterPairSelectorProps) {
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [editingPairId, setEditingPairId] = useState<string | null>(null);
  const [pickingFor, setPickingFor] = useState<'before' | 'after'>('before');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = useMemo(() => {
    const cats = new Set(patientImages.map((img) => img.category));
    return Array.from(cats);
  }, [patientImages]);

  const filteredImages = useMemo(() => {
    if (categoryFilter === 'all') return patientImages;
    return patientImages.filter((img) => img.category === categoryFilter);
  }, [patientImages, categoryFilter]);

  const sortedImages = useMemo(() => {
    return [...filteredImages].sort((a, b) => {
      const dateA = a.capturedAt || a.createdAt;
      const dateB = b.capturedAt || b.createdAt;
      return dateA.getTime() - dateB.getTime();
    });
  }, [filteredImages]);

  const handleAddPair = useCallback(() => {
    const newPair: BeforeAfterPair = {
      id: `pair-${Date.now()}`,
      beforeImageId: '',
      beforeImageUrl: '',
      afterImageId: '',
      afterImageUrl: '',
    };
    onUpdate([...pairs, newPair]);
    setEditingPairId(newPair.id);
    setPickingFor('before');
    setShowImagePicker(true);
  }, [pairs, onUpdate]);

  const handleRemovePair = useCallback(
    (pairId: string) => {
      onUpdate(pairs.filter((p) => p.id !== pairId));
    },
    [pairs, onUpdate]
  );

  const handleImageSelect = useCallback(
    (image: PatientImage) => {
      const updatedPairs = pairs.map((pair) => {
        if (pair.id !== editingPairId) return pair;

        if (pickingFor === 'before') {
          return {
            ...pair,
            beforeImageId: image.id,
            beforeImageUrl: image.fileUrl,
            beforeThumbnailUrl: image.thumbnailUrl || undefined,
            beforeDate: image.capturedAt || image.createdAt,
          };
        } else {
          return {
            ...pair,
            afterImageId: image.id,
            afterImageUrl: image.fileUrl,
            afterThumbnailUrl: image.thumbnailUrl || undefined,
            afterDate: image.capturedAt || image.createdAt,
          };
        }
      });

      onUpdate(updatedPairs);

      // Auto-advance to after selection
      if (pickingFor === 'before') {
        setPickingFor('after');
      } else {
        setShowImagePicker(false);
        setEditingPairId(null);
      }
    },
    [pairs, editingPairId, pickingFor, onUpdate]
  );

  const handleEditPair = useCallback(
    (pairId: string, position: 'before' | 'after') => {
      setEditingPairId(pairId);
      setPickingFor(position);
      setShowImagePicker(true);
    },
    []
  );

  const handleLabelChange = useCallback(
    (pairId: string, label: string) => {
      onUpdate(
        pairs.map((p) => (p.id === pairId ? { ...p, label } : p))
      );
    },
    [pairs, onUpdate]
  );

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Existing Pairs */}
      {pairs.map((pair, index) => (
        <div
          key={pair.id}
          className="relative border rounded-lg p-4 bg-card"
        >
          <div className="absolute top-2 right-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemovePair(pair.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-3">
            <Input
              value={pair.label || ''}
              onChange={(e) => handleLabelChange(pair.id, e.target.value)}
              placeholder={`Comparison ${index + 1} label (optional)`}
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Before Image */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Before</p>
              {pair.beforeImageId ? (
                <button
                  onClick={() => handleEditPair(pair.id, 'before')}
                  className="relative w-full aspect-square rounded-md overflow-hidden border hover:ring-2 hover:ring-primary transition-all"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pair.beforeThumbnailUrl || pair.beforeImageUrl}
                    alt="Before"
                    className="w-full h-full object-cover"
                  />
                  {pair.beforeDate && (
                    <div className="absolute bottom-1 left-1 flex items-center gap-1 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">
                      <Calendar className="h-3 w-3" />
                      {formatDate(pair.beforeDate)}
                    </div>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => handleEditPair(pair.id, 'before')}
                  className="w-full aspect-square rounded-md border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-muted/50 flex flex-col items-center justify-center transition-colors"
                >
                  <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground">Select Before</span>
                </button>
              )}
            </div>

            {/* Arrow */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>

            {/* After Image */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">After</p>
              {pair.afterImageId ? (
                <button
                  onClick={() => handleEditPair(pair.id, 'after')}
                  className="relative w-full aspect-square rounded-md overflow-hidden border hover:ring-2 hover:ring-primary transition-all"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pair.afterThumbnailUrl || pair.afterImageUrl}
                    alt="After"
                    className="w-full h-full object-cover"
                  />
                  {pair.afterDate && (
                    <div className="absolute bottom-1 left-1 flex items-center gap-1 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">
                      <Calendar className="h-3 w-3" />
                      {formatDate(pair.afterDate)}
                    </div>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => handleEditPair(pair.id, 'after')}
                  className="w-full aspect-square rounded-md border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-muted/50 flex flex-col items-center justify-center transition-colors"
                >
                  <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground">Select After</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Add Pair Button */}
      {pairs.length < maxPairs && (
        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={handleAddPair}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Before/After Pair
        </Button>
      )}

      {/* Image Picker Dialog */}
      <Dialog open={showImagePicker} onOpenChange={setShowImagePicker}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Select {pickingFor === 'before' ? 'Before' : 'After'} Image
            </DialogTitle>
            <DialogDescription>
              Choose an image for the {pickingFor === 'before' ? 'before' : 'after'}{' '}
              state. Images are sorted by date (oldest first).
            </DialogDescription>
          </DialogHeader>

          {/* Category Filter */}
          <div className="flex items-center gap-2 py-2">
            <span className="text-sm text-muted-foreground">Category:</span>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            {sortedImages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No images available
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {sortedImages.map((image) => {
                  const isCurrentBefore =
                    pairs.find((p) => p.id === editingPairId)?.beforeImageId ===
                    image.id;
                  const isCurrentAfter =
                    pairs.find((p) => p.id === editingPairId)?.afterImageId ===
                    image.id;

                  return (
                    <button
                      key={image.id}
                      onClick={() => handleImageSelect(image)}
                      className={cn(
                        'relative aspect-square rounded-md overflow-hidden border-2 transition-all',
                        isCurrentBefore || isCurrentAfter
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
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                        <p className="text-white text-xs truncate">
                          {image.capturedAt
                            ? formatDate(image.capturedAt)
                            : formatDate(image.createdAt)}
                        </p>
                      </div>
                      {isCurrentBefore && (
                        <Badge className="absolute top-1 left-1 text-xs">
                          Before
                        </Badge>
                      )}
                      {isCurrentAfter && (
                        <Badge className="absolute top-1 left-1 text-xs">
                          After
                        </Badge>
                      )}
                    </button>
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
