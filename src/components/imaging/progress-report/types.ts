// Progress Report Types

export type ReportType = 'INITIAL' | 'PROGRESS' | 'FINAL' | 'COMPARISON';

export type SectionType =
  | 'HEADER'
  | 'SUMMARY'
  | 'IMAGES'
  | 'COLLAGE'
  | 'COMPARISON'
  | 'MEASUREMENTS'
  | 'NOTES'
  | 'TIMELINE';

export interface ReportSection {
  id: string;
  type: SectionType;
  title?: string;
  content?: string;
  // For image/collage sections
  imageIds?: string[];
  collageId?: string;
  // For comparison sections
  beforeImageId?: string;
  afterImageId?: string;
  // For measurements sections
  measurementIds?: string[];
  // Layout options
  layout?: 'full' | 'half' | 'third' | 'quarter';
  order: number;
}

export interface ProgressReportData {
  id?: string;
  patientId: string;
  title: string;
  reportType: ReportType;
  reportDate: Date;
  sections: ReportSection[];
  summary?: string;
  notes?: string;
  treatmentPlanId?: string;
  appointmentId?: string;
  visibleToPatient: boolean;
}

export interface PatientImageData {
  id: string;
  fileName: string;
  thumbnailUrl: string | null;
  fileUrl: string;
  category: string;
  capturedAt: Date | null;
  createdAt: Date;
}

export interface ReportTemplateSection {
  type: SectionType;
  title: string;
  description: string;
  required?: boolean;
  defaultContent?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  reportType: ReportType;
  sections: ReportTemplateSection[];
}

// Default report templates
export const DEFAULT_REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'initial-records',
    name: 'Initial Records Report',
    description: 'Document initial patient presentation with photos and x-rays',
    reportType: 'INITIAL',
    sections: [
      {
        type: 'HEADER',
        title: 'Patient Information',
        description: 'Basic patient details and date',
        required: true,
      },
      {
        type: 'SUMMARY',
        title: 'Chief Complaint',
        description: 'Patient\'s main concerns and goals',
        required: true,
      },
      {
        type: 'IMAGES',
        title: 'Extraoral Photos',
        description: 'Frontal, profile, and smile photos',
        required: true,
      },
      {
        type: 'IMAGES',
        title: 'Intraoral Photos',
        description: 'Upper, lower, and buccal views',
        required: true,
      },
      {
        type: 'IMAGES',
        title: 'Radiographs',
        description: 'Panoramic and cephalometric x-rays',
        required: false,
      },
      {
        type: 'NOTES',
        title: 'Clinical Findings',
        description: 'Initial observations and diagnosis',
        required: true,
      },
    ],
  },
  {
    id: 'progress-update',
    name: 'Progress Update Report',
    description: 'Document treatment progress with before/after comparisons',
    reportType: 'PROGRESS',
    sections: [
      {
        type: 'HEADER',
        title: 'Progress Report',
        description: 'Patient name and treatment phase',
        required: true,
      },
      {
        type: 'SUMMARY',
        title: 'Treatment Summary',
        description: 'Current phase and progress overview',
        required: true,
      },
      {
        type: 'COMPARISON',
        title: 'Before & After Comparison',
        description: 'Side-by-side comparison of progress',
        required: true,
      },
      {
        type: 'TIMELINE',
        title: 'Treatment Timeline',
        description: 'Visual timeline of treatment milestones',
        required: false,
      },
      {
        type: 'MEASUREMENTS',
        title: 'Measurements',
        description: 'Key measurements and changes',
        required: false,
      },
      {
        type: 'NOTES',
        title: 'Clinical Notes',
        description: 'Observations and next steps',
        required: true,
      },
    ],
  },
  {
    id: 'final-results',
    name: 'Final Results Report',
    description: 'Document completed treatment with full comparison',
    reportType: 'FINAL',
    sections: [
      {
        type: 'HEADER',
        title: 'Treatment Completion Report',
        description: 'Final documentation',
        required: true,
      },
      {
        type: 'SUMMARY',
        title: 'Treatment Summary',
        description: 'Overview of completed treatment',
        required: true,
      },
      {
        type: 'COLLAGE',
        title: 'Before & After Gallery',
        description: 'Complete before and after photo series',
        required: true,
      },
      {
        type: 'COMPARISON',
        title: 'Key Comparisons',
        description: 'Highlight most significant changes',
        required: true,
      },
      {
        type: 'MEASUREMENTS',
        title: 'Final Measurements',
        description: 'Final vs initial measurements',
        required: false,
      },
      {
        type: 'NOTES',
        title: 'Final Assessment',
        description: 'Outcomes and recommendations',
        required: true,
      },
    ],
  },
  {
    id: 'comparison-only',
    name: 'Quick Comparison',
    description: 'Simple before/after comparison for sharing',
    reportType: 'COMPARISON',
    sections: [
      {
        type: 'HEADER',
        title: 'Treatment Comparison',
        description: 'Patient name and dates',
        required: true,
      },
      {
        type: 'COMPARISON',
        title: 'Before & After',
        description: 'Side-by-side comparison',
        required: true,
      },
      {
        type: 'NOTES',
        title: 'Notes',
        description: 'Optional comments',
        required: false,
      },
    ],
  },
];

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  INITIAL: 'Initial Records',
  PROGRESS: 'Progress Update',
  FINAL: 'Final Results',
  COMPARISON: 'Comparison',
};

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  HEADER: 'Header',
  SUMMARY: 'Summary',
  IMAGES: 'Image Gallery',
  COLLAGE: 'Collage',
  COMPARISON: 'Before/After',
  MEASUREMENTS: 'Measurements',
  NOTES: 'Notes',
  TIMELINE: 'Timeline',
};
