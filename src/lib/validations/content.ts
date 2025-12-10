import { z } from 'zod';

// Content status
export const contentStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

// Delivery method
export const deliveryMethodSchema = z.enum(['EMAIL', 'PORTAL', 'SMS_LINK', 'IN_APP']);

// Create article schema
export const createArticleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z.string().min(1).max(200).optional(), // Auto-generated if not provided
  summary: z.string().max(500).optional(),
  body: z.string().min(1, 'Content body is required'),
  featuredImage: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional(),
  treatmentTypes: z.array(z.string()).optional(),
  treatmentPhases: z.array(z.string()).optional(),
  ageGroups: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  status: contentStatusSchema.optional(),
  expiresAt: z.string().datetime().optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
});

// Update article schema
export const updateArticleSchema = createArticleSchema.partial();

// Publish article schema
export const publishArticleSchema = z.object({
  publishedAt: z.string().datetime().optional(),
});

// Deliver content schema
export const deliverContentSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  method: deliveryMethodSchema,
  message: z.string().max(500).optional(), // Optional personal message
});

// Create FAQ schema
export const createFAQSchema = z.object({
  question: z.string().min(1, 'Question is required').max(500),
  answer: z.string().min(1, 'Answer is required'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
  isFeatured: z.boolean().optional(),
});

// Update FAQ schema
export const updateFAQSchema = createFAQSchema.partial();

// Create category schema
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().max(300).optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

// Query schemas
export const articleQuerySchema = z.object({
  category: z.string().optional(),
  status: contentStatusSchema.optional(),
  tag: z.string().optional(),
  treatmentType: z.string().optional(),
  treatmentPhase: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export const faqQuerySchema = z.object({
  category: z.string().optional(),
  isFeatured: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
});

// Default categories
export const CONTENT_CATEGORIES = [
  { slug: 'getting-started', name: 'Getting Started', icon: 'rocket' },
  { slug: 'braces-care', name: 'Braces Care', icon: 'smile' },
  { slug: 'aligner-care', name: 'Aligner Care', icon: 'layers' },
  { slug: 'oral-hygiene', name: 'Oral Hygiene', icon: 'droplet' },
  { slug: 'diet-eating', name: 'Diet & Eating', icon: 'utensils' },
  { slug: 'emergencies', name: 'Emergencies', icon: 'alert-triangle' },
  { slug: 'appointments', name: 'Appointments', icon: 'calendar' },
  { slug: 'compliance', name: 'Compliance', icon: 'check-circle' },
  { slug: 'retention', name: 'Retention', icon: 'shield' },
  { slug: 'general', name: 'General Orthodontics', icon: 'book' },
] as const;

// Treatment types
export const TREATMENT_TYPES = [
  'braces',
  'aligners',
  'expanders',
  'retainers',
  'spacers',
] as const;

// Treatment phases
export const TREATMENT_PHASES = [
  'pre-treatment',
  'bonding',
  'active',
  'finishing',
  'debonding',
  'retention',
] as const;

// Age groups
export const AGE_GROUPS = ['child', 'teen', 'adult'] as const;

export type ContentStatus = z.infer<typeof contentStatusSchema>;
export type DeliveryMethod = z.infer<typeof deliveryMethodSchema>;
export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type CreateFAQInput = z.infer<typeof createFAQSchema>;
