'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Grid,
  List,
  Search,
  Filter,
  SlidersHorizontal,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageCard } from './ImageCard';
import { cn } from '@/lib/utils';

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

interface PaginatedResponse {
  items: PatientImage[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ImageGalleryProps {
  patientId: string;
  onImageSelect?: (image: PatientImage) => void;
  onImageView?: (image: PatientImage) => void;
  onImageEdit?: (image: PatientImage) => void;
  onImageDelete?: (image: PatientImage) => void;
  selectable?: boolean;
  multiSelect?: boolean;
  selectedIds?: string[];
  className?: string;
}

const IMAGE_CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'EXTRAORAL_PHOTO', label: 'Extraoral Photo' },
  { value: 'INTRAORAL_PHOTO', label: 'Intraoral Photo' },
  { value: 'PANORAMIC_XRAY', label: 'Panoramic X-Ray' },
  { value: 'CEPHALOMETRIC_XRAY', label: 'Cephalometric X-Ray' },
  { value: 'PERIAPICAL_XRAY', label: 'Periapical X-Ray' },
  { value: 'CBCT', label: 'CBCT' },
  { value: 'SCAN_3D', label: '3D Scan' },
  { value: 'OTHER', label: 'Other' },
];

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
  { value: 'captureDate-desc', label: 'Capture Date (Newest)' },
  { value: 'captureDate-asc', label: 'Capture Date (Oldest)' },
  { value: 'fileName-asc', label: 'Name (A-Z)' },
  { value: 'fileName-desc', label: 'Name (Z-A)' },
];

export function ImageGallery({
  patientId,
  onImageSelect,
  onImageView,
  onImageEdit,
  onImageDelete,
  selectable = false,
  multiSelect = false,
  selectedIds = [],
  className,
}: ImageGalleryProps) {
  const router = useRouter();

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('createdAt-desc');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Selection state (for internal management if not controlled)
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);
  const effectiveSelectedIds = selectable ? selectedIds : internalSelectedIds;

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const [sortField, sortOrder] = sortBy.split('-');

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      params.set('sortBy', sortField);
      params.set('sortOrder', sortOrder);
      params.set('page', String(page));
      params.set('pageSize', '20');

      try {
        const response = await fetch(`/api/patients/${patientId}/images?${params.toString()}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch images');
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId, search, category, sortBy, page]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setPage(1);
  };

  const handleImageClick = (image: PatientImage) => {
    if (selectable) {
      if (multiSelect) {
        const newSelection = effectiveSelectedIds.includes(image.id)
          ? effectiveSelectedIds.filter((id) => id !== image.id)
          : [...effectiveSelectedIds, image.id];
        onImageSelect?.(image);
        setInternalSelectedIds(newSelection);
      } else {
        onImageSelect?.(image);
        setInternalSelectedIds([image.id]);
      }
    } else {
      onImageView?.(image);
    }
  };

  const handleView = (image: PatientImage) => {
    if (onImageView) {
      onImageView(image);
    } else {
      // Default: navigate to viewer
      router.push(`/imaging/viewer/${image.id}`);
    }
  };

  const handleEdit = (image: PatientImage) => {
    onImageEdit?.(image);
  };

  const handleDelete = (image: PatientImage) => {
    onImageDelete?.(image);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search images..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category filter */}
        <Select value={category} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {IMAGE_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value || 'all'}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View mode */}
        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="rounded-r-none"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="rounded-l-none"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
              : 'space-y-2'
          )}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="aspect-square" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>{error}</p>
          </CardContent>
        </Card>
      ) : data?.items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No images found</h3>
            <p className="text-muted-foreground">
              {search || category
                ? 'Try adjusting your filters'
                : "Upload images to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Image grid/list */}
          <div
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
                : 'space-y-2'
            )}
          >
            {data?.items.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                selected={effectiveSelectedIds.includes(image.id)}
                onSelect={handleImageClick}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of {data.total}{' '}
                images
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === data.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
