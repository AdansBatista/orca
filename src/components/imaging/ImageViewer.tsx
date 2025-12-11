'use client';

import { useState, useRef, useCallback } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { format } from 'date-fns';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Download,
  ChevronLeft,
  ChevronRight,
  Info,
  Tag,
  Calendar,
  User,
  FileImage,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  ImageAdjustments,
  getFilterStyle,
  DEFAULT_ADJUSTMENTS,
  type ImageAdjustmentsState,
} from './ImageAdjustments';

interface ImageTag {
  id: string;
  name: string;
  color?: string | null;
  category: string;
}

interface PatientImage {
  id: string;
  fileName: string;
  fileUrl: string;
  thumbnailUrl?: string | null;
  fileSize: number;
  mimeType: string;
  category: string;
  subcategory?: string | null;
  captureDate?: string | null;
  qualityScore?: number | null;
  visibleToPatient: boolean;
  description?: string | null;
  notes?: string | null;
  capturedBy?: {
    firstName: string;
    lastName: string;
  } | null;
  createdBy?: {
    firstName: string;
    lastName: string;
  } | null;
  protocol?: {
    name: string;
  } | null;
  protocolSlot?: {
    name: string;
  } | null;
  tags: ImageTag[];
  createdAt: string;
}

interface ImageViewerProps {
  image: PatientImage | null;
  images?: PatientImage[];
  open: boolean;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  showNavigation?: boolean;
}

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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageViewer({
  image,
  images = [],
  open,
  onClose,
  onPrevious,
  onNext,
  showNavigation = true,
}: ImageViewerProps) {
  const [rotation, setRotation] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [adjustments, setAdjustments] = useState<ImageAdjustmentsState>(DEFAULT_ADJUSTMENTS);
  const transformRef = useRef<{ resetTransform: () => void } | null>(null);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleReset = useCallback(() => {
    setRotation(0);
    setAdjustments(DEFAULT_ADJUSTMENTS);
    transformRef.current?.resetTransform();
  }, []);

  const handleDownload = useCallback(() => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = image.fileUrl;
    link.download = image.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [image]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && onPrevious) {
        onPrevious();
      } else if (e.key === 'ArrowRight' && onNext) {
        onNext();
      }
    },
    [onClose, onPrevious, onNext]
  );

  const currentIndex = images.findIndex((img) => img.id === image?.id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  if (!open || !image) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white">
            <X className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-white font-medium">{image.fileName}</h2>
            <p className="text-sm text-white/60">
              {CATEGORY_LABELS[image.category] || image.category}
              {image.subcategory && ` • ${image.subcategory}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowInfo(!showInfo)}
            className={cn('text-white', showInfo && 'bg-white/20')}
          >
            <Info className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDownload} className="text-white">
            <Download className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Image area */}
        <div className="flex-1 relative">
          {/* Navigation buttons */}
          {showNavigation && images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={onPrevious}
                disabled={!hasPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white bg-black/50 hover:bg-black/70 disabled:opacity-30"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onNext}
                disabled={!hasNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white bg-black/50 hover:bg-black/70 disabled:opacity-30"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Image with zoom/pan */}
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={8}
            centerOnInit
          >
            {({ zoomIn, zoomOut, resetTransform }: { zoomIn: () => void; zoomOut: () => void; resetTransform: () => void }) => {
              // Store reset function for external access
              transformRef.current = { resetTransform };

              return (
                <>
                  {/* Zoom controls */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-black/50 rounded-lg p-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => zoomOut()}
                      className="text-white h-8 w-8"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => zoomIn()}
                      className="text-white h-8 w-8"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-6 bg-white/20" />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRotate}
                      className="text-white h-8 w-8"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleReset}
                      className="text-white h-8 w-8"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-6 bg-white/20" />
                    <ImageAdjustments
                      value={adjustments}
                      onChange={setAdjustments}
                      compact
                    />
                  </div>

                  {/* Image */}
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
                      src={image.fileUrl}
                      alt={image.fileName}
                      className="max-w-full max-h-full object-contain transition-[filter] duration-200"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        filter: getFilterStyle(adjustments),
                      }}
                      draggable={false}
                    />
                  </TransformComponent>
                </>
              );
            }}
          </TransformWrapper>

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Info panel */}
        {showInfo && (
          <div className="w-80 border-l border-white/10 bg-black/50 overflow-y-auto">
            <div className="p-4 space-y-6">
              <div>
                <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                  <FileImage className="h-4 w-4" />
                  File Details
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-white/60">Name</dt>
                    <dd className="text-white truncate max-w-[180px]" title={image.fileName}>
                      {image.fileName}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-white/60">Size</dt>
                    <dd className="text-white">{formatFileSize(image.fileSize)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-white/60">Type</dt>
                    <dd className="text-white">{image.mimeType}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-white/60">Category</dt>
                    <dd className="text-white">{CATEGORY_LABELS[image.category]}</dd>
                  </div>
                  {image.subcategory && (
                    <div className="flex justify-between">
                      <dt className="text-white/60">Subcategory</dt>
                      <dd className="text-white">{image.subcategory}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <Separator className="bg-white/10" />

              <div>
                <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Dates
                </h3>
                <dl className="space-y-2 text-sm">
                  {image.captureDate && (
                    <div className="flex justify-between">
                      <dt className="text-white/60">Captured</dt>
                      <dd className="text-white">
                        {format(new Date(image.captureDate), 'MMM d, yyyy')}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-white/60">Uploaded</dt>
                    <dd className="text-white">
                      {format(new Date(image.createdAt), 'MMM d, yyyy')}
                    </dd>
                  </div>
                </dl>
              </div>

              {(image.capturedBy || image.createdBy) && (
                <>
                  <Separator className="bg-white/10" />

                  <div>
                    <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      People
                    </h3>
                    <dl className="space-y-2 text-sm">
                      {image.capturedBy && (
                        <div className="flex justify-between">
                          <dt className="text-white/60">Captured by</dt>
                          <dd className="text-white">
                            {image.capturedBy.firstName} {image.capturedBy.lastName}
                          </dd>
                        </div>
                      )}
                      {image.createdBy && (
                        <div className="flex justify-between">
                          <dt className="text-white/60">Uploaded by</dt>
                          <dd className="text-white">
                            {image.createdBy.firstName} {image.createdBy.lastName}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </>
              )}

              {image.tags.length > 0 && (
                <>
                  <Separator className="bg-white/10" />

                  <div>
                    <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {image.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="border-white/30 text-white"
                          style={
                            tag.color
                              ? { borderColor: tag.color, color: tag.color }
                              : undefined
                          }
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {(image.description || image.notes) && (
                <>
                  <Separator className="bg-white/10" />

                  <div>
                    <h3 className="text-white font-medium mb-3">Notes</h3>
                    {image.description && (
                      <p className="text-sm text-white/80 mb-2">{image.description}</p>
                    )}
                    {image.notes && (
                      <p className="text-sm text-white/60">{image.notes}</p>
                    )}
                  </div>
                </>
              )}

              {image.protocol && (
                <>
                  <Separator className="bg-white/10" />

                  <div>
                    <h3 className="text-white font-medium mb-3">Protocol</h3>
                    <p className="text-sm text-white">
                      {image.protocol.name}
                      {image.protocolSlot && ` • ${image.protocolSlot.name}`}
                    </p>
                  </div>
                </>
              )}

              {image.qualityScore !== null && image.qualityScore !== undefined && (
                <>
                  <Separator className="bg-white/10" />

                  <div>
                    <h3 className="text-white font-medium mb-3">Quality Score</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            image.qualityScore >= 80
                              ? 'bg-green-500'
                              : image.qualityScore >= 60
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          )}
                          style={{ width: `${image.qualityScore}%` }}
                        />
                      </div>
                      <span className="text-white text-sm">{image.qualityScore}%</span>
                    </div>
                  </div>
                </>
              )}

              <Separator className="bg-white/10" />

              <div className="flex items-center gap-2">
                <Badge variant={image.visibleToPatient ? 'success' : 'secondary'}>
                  {image.visibleToPatient ? 'Visible to Patient' : 'Staff Only'}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
