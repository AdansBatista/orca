import { z } from 'zod';

// =============================================================================
// Enums (matching Prisma schema)
// =============================================================================

export const FormTypeEnum = z.enum([
  'PATIENT_INFO',
  'MEDICAL_HISTORY',
  'DENTAL_HISTORY',
  'INSURANCE',
  'CONSENT_TREATMENT',
  'CONSENT_PRIVACY',
  'CONSENT_PHOTO',
  'CONSENT_FINANCIAL',
  'CUSTOM',
]);

export const FormCategoryEnum = z.enum([
  'INTAKE',
  'CONSENT',
  'INSURANCE',
  'CLINICAL',
]);

export const FormSubmissionStatusEnum = z.enum([
  'PENDING',
  'COMPLETED',
  'REVIEWED',
  'ARCHIVED',
]);

// =============================================================================
// Form Field Schema
// =============================================================================

export const formFieldSchema = z.object({
  id: z.string(),
  type: z.enum([
    'text',
    'textarea',
    'number',
    'email',
    'phone',
    'date',
    'select',
    'multi_select',
    'checkbox',
    'radio',
    'signature',
    'file',
    'section_header',
    'paragraph',
  ]),
  label: z.string().min(1),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  required: z.boolean().default(false),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(),
      patternMessage: z.string().optional(),
    })
    .optional(),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .optional(),
  conditional: z
    .object({
      fieldId: z.string(),
      operator: z.enum(['equals', 'not_equals', 'contains', 'not_empty']),
      value: z.union([z.string(), z.boolean(), z.number()]).optional(),
    })
    .optional(),
  defaultValue: z.union([z.string(), z.boolean(), z.number(), z.array(z.string())]).optional(),
});

// =============================================================================
// Form Template Schemas
// =============================================================================

export const formSchemaDefinition = z.object({
  fields: z.array(formFieldSchema),
  settings: z
    .object({
      showProgressBar: z.boolean().default(true),
      allowSaveProgress: z.boolean().default(true),
      requireSignature: z.boolean().default(false),
      signatureLabel: z.string().optional(),
      confirmationMessage: z.string().optional(),
    })
    .optional(),
});

export const createFormTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  type: FormTypeEnum,
  category: FormCategoryEnum,
  schema: formSchemaDefinition,
  isActive: z.boolean().default(true),
  isRequired: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateFormTemplateSchema = createFormTemplateSchema.partial();

export const formTemplateQuerySchema = z.object({
  search: z.string().optional(),
  type: FormTypeEnum.optional(),
  category: FormCategoryEnum.optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// =============================================================================
// Form Submission Schemas
// =============================================================================

export const createFormSubmissionSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  leadId: z.string().optional().nullable(),
  patientId: z.string().optional().nullable(),
  responses: z.record(z.string(), z.unknown()),
  status: FormSubmissionStatusEnum.default('PENDING'),
});

export const updateFormSubmissionSchema = z.object({
  responses: z.record(z.string(), z.unknown()).optional(),
  status: FormSubmissionStatusEnum.optional(),
});

export const submitFormSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  responses: z.record(z.string(), z.unknown()),
  submittedBy: z.string().max(255).optional(),
  // Signature
  signatureData: z.string().optional(),
  signerName: z.string().max(200).optional(),
  signerRelation: z.string().max(100).optional(),
});

export const formSubmissionQuerySchema = z.object({
  templateId: z.string().optional(),
  leadId: z.string().optional(),
  patientId: z.string().optional(),
  status: FormSubmissionStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// =============================================================================
// Intake Token Schema (for public form access)
// =============================================================================

export const createIntakeTokenSchema = z.object({
  leadId: z.string().optional().nullable(),
  patientId: z.string().optional().nullable(),
  templateIds: z.array(z.string()).min(1, 'At least one template is required'),
  expiresAt: z.coerce.date().optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
});

// =============================================================================
// Type exports
// =============================================================================

export type FormField = z.infer<typeof formFieldSchema>;
export type FormSchemaDefinition = z.infer<typeof formSchemaDefinition>;
export type CreateFormTemplateInput = z.infer<typeof createFormTemplateSchema>;
export type UpdateFormTemplateInput = z.infer<typeof updateFormTemplateSchema>;
export type FormTemplateQuery = z.infer<typeof formTemplateQuerySchema>;
export type CreateFormSubmissionInput = z.infer<typeof createFormSubmissionSchema>;
export type UpdateFormSubmissionInput = z.infer<typeof updateFormSubmissionSchema>;
export type SubmitFormInput = z.infer<typeof submitFormSchema>;
export type FormSubmissionQuery = z.infer<typeof formSubmissionQuerySchema>;
export type CreateIntakeTokenInput = z.infer<typeof createIntakeTokenSchema>;
