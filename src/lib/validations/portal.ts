/**
 * Portal Validation Schemas
 *
 * Zod schemas for patient portal authentication and operations.
 */

import { z } from 'zod';

// =============================================================================
// Authentication Schemas
// =============================================================================

/**
 * Request magic link
 */
export const requestMagicLinkSchema = z.object({
  email: z.string().email('Invalid email address'),
  clinicSlug: z.string().min(1, 'Clinic is required'),
});

/**
 * Verify magic link and create session
 */
export const verifyMagicLinkSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

/**
 * Login with email and password
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  clinicSlug: z.string().min(1, 'Clinic is required'),
});

/**
 * Register new portal account
 */
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  clinicSlug: z.string().min(1, 'Clinic is required'),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * Verify email
 */
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

/**
 * Request password reset
 */
export const requestPasswordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
  clinicSlug: z.string().min(1, 'Clinic is required'),
});

/**
 * Reset password with token
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * Change password (when logged in)
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// =============================================================================
// Profile Schemas
// =============================================================================

/**
 * Update profile
 */
export const updateProfileSchema = z.object({
  phone: z.string().optional(),
  preferredLanguage: z.enum(['en', 'fr', 'es']).optional(),
});

/**
 * Update notification preferences
 */
export const updateNotificationPreferencesSchema = z.object({
  smsEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  appointmentReminders: z.boolean().optional(),
  treatmentUpdates: z.boolean().optional(),
  billingNotifications: z.boolean().optional(),
  marketingMessages: z.boolean().optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
});

// =============================================================================
// Type Exports
// =============================================================================

export type RequestMagicLinkInput = z.infer<typeof requestMagicLinkSchema>;
export type VerifyMagicLinkInput = z.infer<typeof verifyMagicLinkSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>;
