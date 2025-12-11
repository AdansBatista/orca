'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  X,
  Calendar,
  Image as ImageIcon,
  Search,
  Filter,
  Loader2,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { ImageComparison, type ComparisonImage } from '@/components/imaging';
import { cn } from '@/lib/utils';

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
  patientId: string;
  patient?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

function ComparePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Selected images for comparison
  const [selectedImages, setSelectedImages] = useState<ComparisonImage[]>([]);

  // Image picker dialog
  const [showPicker, setShowPicker] = useState(false);
  const [availableImages, setAvailableImages] = useState<PatientImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters for picker
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('__all__');
  const [patientIdFilter, setPatientIdFilter] = useState('');

  // Load initial images from URL params
  useEffect(() => {
    const imageIds = searchParams.get('images')?.split(',').filter(Boolean);
    const patientId = searchParams.get('patientId');

    if (patientId) {
      setPatientIdFilter(patientId);
    }

    if (imageIds && imageIds.length > 0) {
      loadImagesById(imageIds);
    }
  }, [searchParams]);

  const loadImagesById = async (ids: string[]) => {
    try {
      const response = await fetch(`/api/images?ids=${ids.join(',')}`);
      const data = await response.json();

      if (data.success && data.data?.items) {
        setSelectedImages(
          data.data.items.map((img: PatientImage) => ({
            id: img.id,
            url: img.fileUrl,
            thumbnailUrl: img.thumbnailUrl,
            label: img.subcategory || CATEGORY_LABELS[img.category] || img.category,
            captureDate: img.captureDate,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load images:', error);
    }
  };

  const loadAvailableImages = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (patientIdFilter) params.set('patientId', patientIdFilter);
      if (categoryFilter && categoryFilter !== '__all__') params.set('category', categoryFilter);
      if (searchTerm) params.set('search', searchTerm);
      params.set('pageSize', '50');

      const response = await fetch(`/api/images?${params}`);
      const data = await response.json();

      if (data.success && data.data?.items) {
        setAvailableImages(data.data.items);
      }
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setIsLoading(false);
    }
  }, [patientIdFilter, categoryFilter, searchTerm]);

  useEffect(() => {
    if (showPicker) {
      loadAvailableImages();
    }
  }, [showPicker, loadAvailableImages]);

  const handleAddImage = (image: PatientImage) => {
    if (selectedImages.length >= 4) {
      return; // Max 4 images for comparison
    }

    const newImage: ComparisonImage = {
      id: image.id,
      url: image.fileUrl,
      thumbnailUrl: image.thumbnailUrl,
      label: image.subcategory || CATEGORY_LABELS[image.category] || image.category,
      captureDate: image.captureDate,
    };

    setSelectedImages((prev) => [...prev, newImage]);
    setShowPicker(false);

    // Update URL
    const newIds = [...selectedImages.map((i) => i.id), image.id];
    const params = new URLSearchParams(searchParams);
    params.set('images', newIds.join(','));
    router.replace(`/imaging/compare?${params}`);
  };

  const handleRemoveImage = (imageId: string) => {
    setSelectedImages((prev) => prev.filter((img) => img.id !== imageId));

    // Update URL
    const newIds = selectedImages.filter((i) => i.id !== imageId).map((i) => i.id);
    const params = new URLSearchParams(searchParams);
    if (newIds.length > 0) {
      params.set('images', newIds.join(','));
    } else {
      params.delete('images');
    }
    router.replace(`/imaging/compare?${params}`);
  };

  const isImageSelected = (imageId: string) => {
    return selectedImages.some((img) => img.id === imageId);
  };

  return (
    <>
      <PageHeader
        title="Compare Images"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Imaging', href: '/imaging' },
          { label: 'Compare' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPicker(true)}
              disabled={selectedImages.length >= 4}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Image ({selectedImages.length}/4)
            </Button>
          </div>
        }
      />

      <PageContent density="comfortable" className="h-[calc(100vh-130px)]">
        {selectedImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Images Selected</h3>
              <p className="text-muted-foreground mb-4">
                Select up to 4 images to compare side-by-side, in a grid, or with the
                before/after slider.
              </p>
              <Button onClick={() => setShowPicker(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Select Images
              </Button>
            </div>
          </div>
        ) : selectedImages.length === 1 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Card className="max-w-sm">
              <CardContent className="p-6 text-center">
                {/* Show the single selected image */}
                <div className="relative mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedImages[0].thumbnailUrl || selectedImages[0].url}
                    alt={selectedImages[0].label || 'Selected image'}
                    className="w-48 h-48 object-cover rounded-lg mx-auto"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => handleRemoveImage(selectedImages[0].id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Select at least one more image to compare
                </p>
                <Button onClick={() => setShowPicker(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Image
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Selected images strip */}
            <div className="flex items-center gap-2 mb-4 p-2 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground px-2">Comparing:</span>
              {selectedImages.map((img) => (
                <div key={img.id} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.thumbnailUrl || img.url}
                    alt={img.label || 'Comparison image'}
                    className="w-12 h-12 object-cover rounded-md"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveImage(img.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {selectedImages.length < 4 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-12 w-12 border-2 border-dashed"
                  onClick={() => setShowPicker(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Comparison component */}
            <div className="flex-1 border rounded-lg overflow-hidden">
              <ImageComparison images={selectedImages} showControls />
            </div>
          </div>
        )}
      </PageContent>

      {/* Image Picker Dialog */}
      <Dialog open={showPicker} onOpenChange={setShowPicker}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Select Image</DialogTitle>
            <DialogDescription>
              Choose an image to add to the comparison
            </DialogDescription>
          </DialogHeader>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
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
            <Button
              variant="outline"
              size="icon"
              onClick={loadAvailableImages}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Image Grid */}
          <div className="overflow-y-auto max-h-[50vh]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : availableImages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No images found. Try adjusting your filters.
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {availableImages.map((image) => {
                  const isSelected = isImageSelected(image.id);
                  return (
                    <div
                      key={image.id}
                      className={cn(
                        'relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all',
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-transparent hover:border-muted-foreground/30'
                      )}
                      onClick={() => !isSelected && handleAddImage(image)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.thumbnailUrl || image.fileUrl}
                        alt={image.fileName}
                        className={cn(
                          'w-full aspect-square object-cover',
                          isSelected && 'opacity-50'
                        )}
                      />
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                          <Badge variant="default">Selected</Badge>
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
    </>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ComparePageContent />
    </Suspense>
  );
}
