/**
 * PHI Anonymization Service
 *
 * Strips or masks Protected Health Information (PHI) before sending
 * images and data to cloud AI services for HIPAA compliance.
 */

import type { PHIFields, AnonymizedImageData } from './types';
import { getAIConfig } from './config';

// =============================================================================
// PHI Patterns
// =============================================================================

/**
 * Regular expressions for detecting PHI in text/metadata
 */
const PHI_PATTERNS = {
  // Social Security Number patterns
  ssn: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,

  // Phone number patterns (various formats)
  phone: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,

  // Email pattern
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

  // Date of birth patterns (MM/DD/YYYY, YYYY-MM-DD, etc.)
  dob: /\b(?:0?[1-9]|1[0-2])[\/\-](?:0?[1-9]|[12]\d|3[01])[\/\-](?:19|20)\d{2}\b|\b(?:19|20)\d{2}[\/\-](?:0?[1-9]|1[0-2])[\/\-](?:0?[1-9]|[12]\d|3[01])\b/g,

  // Medical Record Number (common formats)
  mrn: /\bMRN[:\s#]*\d{4,10}\b/gi,

  // Street address patterns (simplified)
  address: /\b\d{1,5}\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct|circle|cir)[\s,]+[\w\s]+,?\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?\b/gi,

  // Patient ID patterns
  patientId: /\bpatient\s*(?:id|#|no\.?)[:\s]*[\w\-]+\b/gi,
};

/**
 * DICOM tags that contain PHI
 */
const PHI_DICOM_TAGS = [
  'PatientName',
  'PatientID',
  'PatientBirthDate',
  'PatientSex',
  'PatientAge',
  'PatientAddress',
  'PatientTelephoneNumbers',
  'OtherPatientIDs',
  'OtherPatientNames',
  'ResponsiblePerson',
  'InstitutionName',
  'InstitutionAddress',
  'ReferringPhysicianName',
  'PerformingPhysicianName',
  'OperatorsName',
  'PhysiciansOfRecord',
  'RequestingPhysician',
  'StudyID',
  'AccessionNumber',
];

// =============================================================================
// Anonymization Functions
// =============================================================================

/**
 * Anonymize text by replacing PHI patterns
 */
export function anonymizeText(text: string): { anonymized: string; fieldsFound: string[] } {
  const fieldsFound: string[] = [];
  let anonymized = text;

  // Replace SSN
  if (PHI_PATTERNS.ssn.test(text)) {
    anonymized = anonymized.replace(PHI_PATTERNS.ssn, '[REDACTED-SSN]');
    fieldsFound.push('ssn');
  }

  // Replace phone numbers
  if (PHI_PATTERNS.phone.test(text)) {
    anonymized = anonymized.replace(PHI_PATTERNS.phone, '[REDACTED-PHONE]');
    fieldsFound.push('phone');
  }

  // Replace email
  if (PHI_PATTERNS.email.test(text)) {
    anonymized = anonymized.replace(PHI_PATTERNS.email, '[REDACTED-EMAIL]');
    fieldsFound.push('email');
  }

  // Replace DOB
  if (PHI_PATTERNS.dob.test(text)) {
    anonymized = anonymized.replace(PHI_PATTERNS.dob, '[REDACTED-DOB]');
    fieldsFound.push('dateOfBirth');
  }

  // Replace MRN
  if (PHI_PATTERNS.mrn.test(text)) {
    anonymized = anonymized.replace(PHI_PATTERNS.mrn, '[REDACTED-MRN]');
    fieldsFound.push('mrn');
  }

  // Replace addresses
  if (PHI_PATTERNS.address.test(text)) {
    anonymized = anonymized.replace(PHI_PATTERNS.address, '[REDACTED-ADDRESS]');
    fieldsFound.push('address');
  }

  // Replace patient IDs
  if (PHI_PATTERNS.patientId.test(text)) {
    anonymized = anonymized.replace(PHI_PATTERNS.patientId, '[REDACTED-PATIENT-ID]');
    fieldsFound.push('patientId');
  }

  return { anonymized, fieldsFound };
}

/**
 * Anonymize metadata object by removing/masking PHI fields
 */
export function anonymizeMetadata(
  metadata: Record<string, unknown>
): { anonymized: Record<string, unknown>; anonymizedFields: string[] } {
  const anonymizedFields: string[] = [];
  const anonymized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    // Check if key matches known PHI DICOM tags
    const isPhiTag = PHI_DICOM_TAGS.some(
      (tag) => key.toLowerCase() === tag.toLowerCase()
    );

    if (isPhiTag) {
      anonymizedFields.push(key);
      // Replace with anonymized placeholder
      anonymized[key] = '[REDACTED]';
    } else if (typeof value === 'string') {
      // Check string values for embedded PHI
      const { anonymized: anonValue, fieldsFound } = anonymizeText(value);
      anonymized[key] = anonValue;
      if (fieldsFound.length > 0) {
        anonymizedFields.push(...fieldsFound.map(f => `${key}.${f}`));
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively anonymize nested objects
      const nested = anonymizeMetadata(value as Record<string, unknown>);
      anonymized[key] = nested.anonymized;
      anonymizedFields.push(...nested.anonymizedFields.map(f => `${key}.${f}`));
    } else {
      // Keep non-string, non-object values as-is
      anonymized[key] = value;
    }
  }

  return { anonymized, anonymizedFields };
}

/**
 * Anonymize image data and metadata for cloud AI processing
 */
export function anonymizeForAI(
  imageData: string,
  metadata?: Record<string, unknown>
): AnonymizedImageData {
  const config = getAIConfig();
  const anonymizedFields: string[] = [];

  // If PHI anonymization is disabled, return as-is
  if (!config.anonymizePHI) {
    return {
      imageData,
      metadata: metadata || {},
      anonymizedFields: [],
    };
  }

  // Anonymize metadata if provided
  let anonymizedMetadata: Record<string, unknown> = {};
  if (metadata) {
    const result = anonymizeMetadata(metadata);
    anonymizedMetadata = result.anonymized;
    anonymizedFields.push(...result.anonymizedFields);
  }

  // Note: For DICOM images with burned-in PHI, additional processing would be needed
  // This would require image manipulation which is complex and should be done
  // with specialized DICOM libraries. For now, we rely on metadata anonymization
  // and assume most modern systems don't burn PHI into the pixel data.

  return {
    imageData,
    metadata: anonymizedMetadata,
    anonymizedFields,
  };
}

/**
 * Create an anonymized patient reference for AI context
 * Instead of using real patient ID, we use a hash
 */
export function createAnonymousPatientRef(patientId: string): string {
  // Create a simple hash - in production, use a proper cryptographic hash
  let hash = 0;
  for (let i = 0; i < patientId.length; i++) {
    const char = patientId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `ANON-${Math.abs(hash).toString(16).toUpperCase().slice(0, 8)}`;
}

/**
 * Strip all identifying information from context data
 */
export function anonymizeContext(
  context: Record<string, unknown>
): Record<string, unknown> {
  const config = getAIConfig();

  if (!config.anonymizePHI) {
    return context;
  }

  const anonymized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(context)) {
    // Skip patient-identifying keys
    if (['patientId', 'patientName', 'patient', 'name'].includes(key.toLowerCase())) {
      continue;
    }

    // Keep clinical context (age, treatment type, etc.)
    if (typeof value === 'string') {
      const { anonymized: anonValue } = anonymizeText(value);
      anonymized[key] = anonValue;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      anonymized[key] = anonymizeContext(value as Record<string, unknown>);
    } else {
      anonymized[key] = value;
    }
  }

  return anonymized;
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Check if data appears to contain PHI
 */
export function containsPHI(data: string | Record<string, unknown>): boolean {
  if (typeof data === 'string') {
    return Object.values(PHI_PATTERNS).some(pattern => pattern.test(data));
  }

  // Check metadata object
  for (const value of Object.values(data)) {
    if (typeof value === 'string' && containsPHI(value)) {
      return true;
    }
    if (typeof value === 'object' && value !== null && containsPHI(value as Record<string, unknown>)) {
      return true;
    }
  }

  return false;
}

/**
 * Log anonymization activity (for audit purposes)
 */
export function logAnonymization(
  clinicId: string,
  operation: string,
  anonymizedFields: string[]
): void {
  // In production, this should write to an audit log
  console.log('[AI Anonymization]', {
    clinicId,
    operation,
    anonymizedFields,
    timestamp: new Date().toISOString(),
  });
}
