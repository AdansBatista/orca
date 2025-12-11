// Before/After Presentation Types

export type PresentationLayout = 'slider' | 'side-by-side' | 'stacked' | 'grid';

export interface BeforeAfterPair {
  id: string;
  beforeImageId: string;
  beforeImageUrl: string;
  beforeThumbnailUrl?: string;
  afterImageId: string;
  afterImageUrl: string;
  afterThumbnailUrl?: string;
  label?: string;
  description?: string;
  beforeDate?: Date;
  afterDate?: Date;
}

export interface PresentationSlide {
  id: string;
  type: 'before-after' | 'single-image' | 'text' | 'collage';
  // For before-after type
  pairs?: BeforeAfterPair[];
  layout?: PresentationLayout;
  // For single-image type
  imageId?: string;
  imageUrl?: string;
  // For text type
  title?: string;
  content?: string;
  // For collage type
  collageId?: string;
  // Common
  order: number;
}

export interface PresentationData {
  id?: string;
  patientId: string;
  title: string;
  description?: string;
  slides: PresentationSlide[];
  // Settings
  showDates: boolean;
  showLabels: boolean;
  autoPlay: boolean;
  autoPlayInterval: number; // seconds
  // Sharing
  isPublic: boolean;
  shareToken?: string;
  expiresAt?: Date;
  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PresentationTemplate {
  id: string;
  name: string;
  description: string;
  slideCount: number;
  defaultLayout: PresentationLayout;
  slides: Omit<PresentationSlide, 'id' | 'order'>[];
}

// Default presentation templates
export const DEFAULT_PRESENTATION_TEMPLATES: PresentationTemplate[] = [
  {
    id: 'simple-before-after',
    name: 'Simple Before/After',
    description: 'A single before/after comparison slide',
    slideCount: 1,
    defaultLayout: 'slider',
    slides: [
      { type: 'before-after', layout: 'slider', pairs: [] },
    ],
  },
  {
    id: 'treatment-journey',
    name: 'Treatment Journey',
    description: 'Title slide followed by multiple comparison stages',
    slideCount: 4,
    defaultLayout: 'side-by-side',
    slides: [
      { type: 'text', title: 'Treatment Journey', content: '' },
      { type: 'before-after', layout: 'side-by-side', pairs: [] },
      { type: 'before-after', layout: 'side-by-side', pairs: [] },
      { type: 'before-after', layout: 'side-by-side', pairs: [] },
    ],
  },
  {
    id: 'progress-gallery',
    name: 'Progress Gallery',
    description: 'Grid view of all progress photos over time',
    slideCount: 2,
    defaultLayout: 'grid',
    slides: [
      { type: 'text', title: 'Treatment Progress', content: '' },
      { type: 'before-after', layout: 'grid', pairs: [] },
    ],
  },
  {
    id: 'full-presentation',
    name: 'Full Presentation',
    description: 'Complete presentation with intro, progress, and results',
    slideCount: 5,
    defaultLayout: 'slider',
    slides: [
      { type: 'text', title: 'Patient Treatment', content: 'A journey to a perfect smile' },
      { type: 'single-image' },
      { type: 'before-after', layout: 'slider', pairs: [] },
      { type: 'before-after', layout: 'side-by-side', pairs: [] },
      { type: 'text', title: 'Results', content: 'Thank you!' },
    ],
  },
];

export const LAYOUT_LABELS: Record<PresentationLayout, string> = {
  slider: 'Interactive Slider',
  'side-by-side': 'Side by Side',
  stacked: 'Stacked (Vertical)',
  grid: 'Grid View',
};
