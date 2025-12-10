import { z } from 'zod';

// Survey status
export const surveyStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED', 'ARCHIVED']);

// Question types
export const questionTypeSchema = z.enum([
  'TEXT',
  'TEXTAREA',
  'SINGLE_CHOICE',
  'MULTIPLE_CHOICE',
  'RATING',
  'NPS',
  'YES_NO',
  'DATE',
  'EMAIL',
  'PHONE',
]);

// Survey question schema
export const surveyQuestionSchema = z.object({
  id: z.string(),
  type: questionTypeSchema,
  text: z.string().min(1, 'Question text is required'),
  description: z.string().optional(),
  required: z.boolean().default(false),
  // For choice questions
  options: z.array(z.string()).optional(),
  // For rating questions
  minRating: z.number().optional(),
  maxRating: z.number().optional(),
  ratingLabels: z
    .object({
      min: z.string().optional(),
      max: z.string().optional(),
    })
    .optional(),
  // Validation
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  // Display
  order: z.number().default(0),
});

// Create survey schema
export const createSurveySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  category: z.string().min(1, 'Category is required'),
  isAnonymous: z.boolean().optional(),
  allowMultiple: z.boolean().optional(),
  requiresAuth: z.boolean().optional(),
  questions: z.array(surveyQuestionSchema).min(1, 'At least one question is required'),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().optional(),
  thankYouMessage: z.string().max(500).optional(),
  status: surveyStatusSchema.optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

// Update survey schema
export const updateSurveySchema = createSurveySchema.partial();

// Query schema
export const surveyQuerySchema = z.object({
  category: z.string().optional(),
  status: surveyStatusSchema.optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

// Survey categories
export const SURVEY_CATEGORIES = [
  { slug: 'satisfaction', name: 'Patient Satisfaction', icon: 'smile' },
  { slug: 'nps', name: 'Net Promoter Score', icon: 'trending-up' },
  { slug: 'treatment', name: 'Treatment Feedback', icon: 'activity' },
  { slug: 'appointment', name: 'Appointment Experience', icon: 'calendar' },
  { slug: 'staff', name: 'Staff Feedback', icon: 'users' },
  { slug: 'exit', name: 'Exit Survey', icon: 'log-out' },
  { slug: 'general', name: 'General Feedback', icon: 'message-square' },
] as const;

// Question type labels and icons
export const QUESTION_TYPES = [
  { value: 'TEXT', label: 'Short Text', icon: 'type', description: 'Single line text input' },
  { value: 'TEXTAREA', label: 'Long Text', icon: 'align-left', description: 'Multi-line text area' },
  {
    value: 'SINGLE_CHOICE',
    label: 'Single Choice',
    icon: 'circle-dot',
    description: 'Choose one option',
  },
  {
    value: 'MULTIPLE_CHOICE',
    label: 'Multiple Choice',
    icon: 'check-square',
    description: 'Choose multiple options',
  },
  { value: 'RATING', label: 'Rating Scale', icon: 'star', description: 'Star or number rating' },
  { value: 'NPS', label: 'NPS Score', icon: 'gauge', description: 'Net Promoter Score (0-10)' },
  { value: 'YES_NO', label: 'Yes/No', icon: 'toggle-left', description: 'Boolean choice' },
  { value: 'DATE', label: 'Date', icon: 'calendar', description: 'Date picker' },
  { value: 'EMAIL', label: 'Email', icon: 'mail', description: 'Email address input' },
  { value: 'PHONE', label: 'Phone', icon: 'phone', description: 'Phone number input' },
] as const;

export type SurveyStatus = z.infer<typeof surveyStatusSchema>;
export type QuestionType = z.infer<typeof questionTypeSchema>;
export type SurveyQuestion = z.infer<typeof surveyQuestionSchema>;
export type CreateSurveyInput = z.infer<typeof createSurveySchema>;
export type UpdateSurveyInput = z.infer<typeof updateSurveySchema>;
