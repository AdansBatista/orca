'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Image as ImageIcon,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Download,
  Tag,
  Calendar,
  User,
  Layers,
  Unlink,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ImageTag {
  id: string;
  name: string;
  color?: string | null;
  category: string;
}

interface TreatmentPhaseInfo {
  id: string;
  phaseNumber: number;
  phaseName: string;
  phaseType: string;
  status: string;
}

interface TreatmentPlanInfo {
  id: string;
  planName: string;
  planNumber?: number;
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
  treatmentPhase?: TreatmentPhaseInfo | null;
  treatmentPlan?: TreatmentPlanInfo | null;
  tags: ImageTag[];
  createdAt: string;
}

interface ImageCardProps {
  image: PatientImage;
  variant?: 'default' | 'compact' | 'list';
  selected?: boolean;
  onSelect?: (image: PatientImage) => void;
  onClick?: (image: PatientImage) => void;
  onView?: (image: PatientImage) => void;
  onEdit?: (image: PatientImage) => void;
  onDelete?: (image: PatientImage) => void;
  onUnlinkPhase?: () => void;
  showActions?: boolean;
  showPhase?: boolean;
  className?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  EXTRAORAL_PHOTO: 'Extraoral',
  INTRAORAL_PHOTO: 'Intraoral',
  PANORAMIC_XRAY: 'Panoramic',
  CEPHALOMETRIC_XRAY: 'Ceph',
  PERIAPICAL_XRAY: 'Periapical',
  CBCT: 'CBCT',
  SCAN_3D: '3D Scan',
  OTHER: 'Other',
};

const CATEGORY_COLORS: Record<string, string> = {
  EXTRAORAL_PHOTO: 'bg-blue-500/10 text-blue-700',
  INTRAORAL_PHOTO: 'bg-green-500/10 text-green-700',
  PANORAMIC_XRAY: 'bg-purple-500/10 text-purple-700',
  CEPHALOMETRIC_XRAY: 'bg-pink-500/10 text-pink-700',
  PERIAPICAL_XRAY: 'bg-orange-500/10 text-orange-700',
  CBCT: 'bg-cyan-500/10 text-cyan-700',
  SCAN_3D: 'bg-indigo-500/10 text-indigo-700',
  OTHER: 'bg-gray-500/10 text-gray-700',
};

const PHASE_STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: 'outline',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  SKIPPED: 'warning',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageCard({
  image,
  variant = 'default',
  selected,
  onSelect,
  onClick,
  onView,
  onEdit,
  onDelete,
  onUnlinkPhase,
  showActions = true,
  showPhase = true,
  className,
}: ImageCardProps) {
  const [imageError, setImageError] = useState(false);

  const displayUrl = image.thumbnailUrl || image.fileUrl;

  const handleClick = () => {
    onClick?.(image);
    onSelect?.(image);
  };

  // List variant
  if (variant === 'list') {
    return (
      <Card
        className={cn(
          'group overflow-hidden cursor-pointer transition-all',
          selected && 'ring-2 ring-primary',
          className
        )}
        onClick={handleClick}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-4">
            {/* Thumbnail */}
            <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
              {imageError ? (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={displayUrl}
                  alt={image.fileName}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{image.fileName}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={cn('text-xs', CATEGORY_COLORS[image.category])}>
                  {CATEGORY_LABELS[image.category] || image.category}
                </Badge>
                {showPhase && image.treatmentPhase && (
                  <Badge
                    variant={PHASE_STATUS_COLORS[image.treatmentPhase.status] as 'outline' | 'info' | 'success' | 'warning'}
                    size="sm"
                    className="gap-1"
                  >
                    <Layers className="h-3 w-3" />
                    Phase {image.treatmentPhase.phaseNumber}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                {image.captureDate && (
                  <span>{format(new Date(image.captureDate), 'MMM d, yyyy')}</span>
                )}
                <span>{formatFileSize(image.fileSize)}</span>
              </div>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex items-center gap-1">
                {onUnlinkPhase && image.treatmentPhase && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnlinkPhase();
                          }}
                        >
                          <Unlink className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Unlink from phase</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView?.(image)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit?.(image)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={image.fileUrl} download={image.fileName}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete?.(image)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default and compact variants
  return (
    <Card
      className={cn(
        'group relative overflow-hidden cursor-pointer transition-all',
        selected && 'ring-2 ring-primary',
        className
      )}
      onClick={handleClick}
    >
      <CardContent className="p-0">
        {/* Image */}
        <div className="aspect-square relative bg-muted overflow-hidden">
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={displayUrl}
              alt={image.fileName}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          )}

          {/* Selection indicator */}
          {selected && (
            <div className="absolute top-2 left-2">
              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Category badge */}
          <div className="absolute top-2 right-2">
            <Badge className={cn('text-xs', CATEGORY_COLORS[image.category])}>
              {CATEGORY_LABELS[image.category] || image.category}
            </Badge>
          </div>

          {/* Hover overlay with actions */}
          {showActions && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onView?.(image);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View full size</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="secondary" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView?.(image)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit?.(image)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={image.fileUrl} download={image.fileName}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </DropdownMenuItem>
                  {onUnlinkPhase && image.treatmentPhase && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onUnlinkPhase}>
                        <Unlink className="h-4 w-4 mr-2" />
                        Unlink from Phase
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete?.(image)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Phase badge overlay */}
          {showPhase && image.treatmentPhase && (
            <div className="absolute bottom-2 left-2 right-2">
              <Badge
                variant={PHASE_STATUS_COLORS[image.treatmentPhase.status] as 'outline' | 'info' | 'success' | 'warning'}
                size="sm"
                className="gap-1 shadow-sm"
              >
                <Layers className="h-3 w-3" />
                {image.treatmentPlan?.planName ? `${image.treatmentPlan.planName} - ` : ''}
                Phase {image.treatmentPhase.phaseNumber}
              </Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div className={cn('p-3 space-y-2', variant === 'compact' && 'p-2 space-y-1')}>
          {/* Filename */}
          <p className={cn('font-medium truncate', variant === 'compact' ? 'text-xs' : 'text-sm')} title={image.fileName}>
            {image.fileName}
          </p>

          {/* Metadata - hidden in compact mode */}
          {variant !== 'compact' && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {image.captureDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(image.captureDate), 'MMM d, yyyy')}
                </span>
              )}
              {image.capturedBy && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {image.capturedBy.firstName[0]}.{image.capturedBy.lastName}
                </span>
              )}
            </div>
          )}

          {/* Tags - hidden in compact mode */}
          {variant !== 'compact' && image.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <Tag className="h-3 w-3 text-muted-foreground" />
              {image.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-xs px-1.5 py-0"
                  style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
                >
                  {tag.name}
                </Badge>
              ))}
              {image.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  +{image.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Protocol slot - hidden in compact mode */}
          {variant !== 'compact' && image.protocolSlot && (
            <p className="text-xs text-muted-foreground">
              {image.protocol?.name} - {image.protocolSlot.name}
            </p>
          )}

          {/* File size - hidden in compact mode */}
          {variant !== 'compact' && (
            <p className="text-xs text-muted-foreground">{formatFileSize(image.fileSize)}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
