'use client';

/**
 * Treatment Phase Image Gallery
 *
 * Displays images linked to a specific treatment phase with
 * management capabilities.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  ImageIcon,
  Loader2,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { useTreatmentPhases, type TreatmentPhase } from '@/hooks/use-treatment-phases';
import { ImageCard } from '../ImageCard';
import type { PatientImage } from '../types';

// =============================================================================
// Types
// =============================================================================

interface TreatmentPhaseImageGalleryProps {
  phaseId: string;
  onImageClick?: (image: PatientImage) => void;
  onImageUnlink?: (imageId: string) => void;
  showPhaseInfo?: boolean;
  allowUnlink?: boolean;
  className?: string;
}

interface PhaseData {
  phase: {
    id: string;
    phaseNumber: number;
    phaseName: string;
    phaseType: string;
    status: string;
    treatmentPlan: {
      id: string;
      planName: string;
      planNumber: number;
      patientId: string;
      patient: {
        id: string;
        firstName: string;
        lastName: string;
      };
    };
  };
  images: {
    items: PatientImage[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// =============================================================================
// Constants
// =============================================================================

const PHASE_TYPE_LABELS: Record<string, string> = {
  INITIAL_ALIGNMENT: 'Initial Alignment',
  LEVELING: 'Leveling',
  SPACE_CLOSURE: 'Space Closure',
  FINISHING: 'Finishing',
  DETAILING: 'Detailing',
  RETENTION: 'Retention',
  OBSERVATION: 'Observation',
  CUSTOM: 'Custom',
};

const PHASE_STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: 'outline',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  SKIPPED: 'warning',
};

const PAGE_SIZE_OPTIONS = [12, 24, 48];

// =============================================================================
// Component
// =============================================================================

export function TreatmentPhaseImageGallery({
  phaseId,
  onImageClick,
  onImageUnlink,
  showPhaseInfo = true,
  allowUnlink = true,
  className,
}: TreatmentPhaseImageGalleryProps) {
  const [phaseData, setPhaseData] = useState<PhaseData | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'captureDate' | 'createdAt' | 'fileName'>('captureDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const { isLoading, error, fetchPhaseImages, unlinkImageFromPhase } = useTreatmentPhases();

  // Load phase images
  const loadPhaseImages = useCallback(async () => {
    const data = await fetchPhaseImages(phaseId, {
      page,
      pageSize,
      sortBy,
      sortOrder,
    });
    if (data) {
      setPhaseData(data as PhaseData);
    }
  }, [phaseId, page, pageSize, sortBy, sortOrder, fetchPhaseImages]);

  useEffect(() => {
    loadPhaseImages();
  }, [loadPhaseImages]);

  // Handle unlink
  const handleUnlink = async (imageId: string) => {
    const success = await unlinkImageFromPhase(imageId);
    if (success) {
      onImageUnlink?.(imageId);
      loadPhaseImages();
    }
  };

  // Pagination handlers
  const handleNextPage = () => {
    if (phaseData && page < phaseData.images.totalPages) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  if (isLoading && !phaseData) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center gap-2 py-12">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={loadPhaseImages}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!phaseData) {
    return null;
  }

  const { phase, images } = phaseData;

  return (
    <Card className={className}>
      {showPhaseInfo && (
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Phase {phase.phaseNumber}: {phase.phaseName}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {phase.treatmentPlan.planName} •{' '}
                {phase.treatmentPlan.patient.firstName}{' '}
                {phase.treatmentPlan.patient.lastName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  PHASE_STATUS_COLORS[phase.status] as
                    | 'outline'
                    | 'info'
                    | 'success'
                    | 'warning'
                }
              >
                {phase.status.replace('_', ' ')}
              </Badge>
              <Badge variant="soft-primary">
                {PHASE_TYPE_LABELS[phase.phaseType] || phase.phaseType}
              </Badge>
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className={cn(!showPhaseInfo && 'pt-6')}>
        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {images.total} image{images.total !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort */}
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(value) => {
                const [newSortBy, newSortOrder] = value.split('-') as [
                  typeof sortBy,
                  typeof sortOrder
                ];
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="captureDate-asc">Date (Oldest)</SelectItem>
                <SelectItem value="captureDate-desc">Date (Newest)</SelectItem>
                <SelectItem value="fileName-asc">Name (A-Z)</SelectItem>
                <SelectItem value="fileName-desc">Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>

            {/* View mode */}
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Images */}
        {images.items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              No images linked to this phase yet
            </p>
          </div>
        ) : (
          <>
            <div
              className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4'
                  : 'space-y-2'
              )}
            >
              {images.items.map((image) => (
                <ImageCard
                  key={image.id}
                  image={image}
                  variant={viewMode === 'grid' ? 'compact' : 'list'}
                  onClick={() => onImageClick?.(image)}
                  onUnlinkPhase={
                    allowUnlink ? () => handleUnlink(image.id) : undefined
                  }
                />
              ))}
            </div>

            {/* Pagination */}
            {images.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Show:</span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(parseInt(value));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handlePrevPage}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[100px] text-center">
                    Page {page} of {images.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleNextPage}
                    disabled={page >= images.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
