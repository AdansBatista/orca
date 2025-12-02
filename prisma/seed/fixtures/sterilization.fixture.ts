/**
 * Sterilization & Compliance fixture data for seeding
 */

import type {
  SterilizationCycleType,
  CycleStatus,
  LoadItemType,
  BiologicalTestResult,
  ChemicalIndicatorClass,
  ChemicalIndicatorResult,
  InstrumentSetCategory,
  InstrumentSetStatus,
  ComplianceLogType,
  ValidationType,
  ValidationResult,
} from '@prisma/client';

// =============================================================================
// Instrument Set Fixtures
// =============================================================================

export interface InstrumentSetFixture {
  name: string;
  setNumber: string;
  barcode?: string;
  description?: string;
  instrumentCount: number;
  category: InstrumentSetCategory;
  expirationDays?: number;
  maxUses?: number;
}

export const SAMPLE_INSTRUMENT_SETS: InstrumentSetFixture[] = [
  {
    name: 'Ortho Bonding Set A',
    setNumber: 'SET-001',
    barcode: 'SET001BAR',
    description: 'Bracket bonding instruments including light cure, bracket tweezers, and placement tools',
    instrumentCount: 8,
    category: 'BONDING',
    expirationDays: 30,
    maxUses: 100,
  },
  {
    name: 'Ortho Bonding Set B',
    setNumber: 'SET-002',
    barcode: 'SET002BAR',
    description: 'Backup bonding set with identical instruments',
    instrumentCount: 8,
    category: 'BONDING',
    expirationDays: 30,
    maxUses: 100,
  },
  {
    name: 'Wire Adjustment Set 1',
    setNumber: 'SET-003',
    barcode: 'SET003BAR',
    description: 'Wire cutters, distal end cutters, Weingart utility pliers, bird beak pliers',
    instrumentCount: 6,
    category: 'ADJUSTMENT',
    expirationDays: 30,
    maxUses: 150,
  },
  {
    name: 'Wire Adjustment Set 2',
    setNumber: 'SET-004',
    barcode: 'SET004BAR',
    description: 'Backup wire adjustment set',
    instrumentCount: 6,
    category: 'ADJUSTMENT',
    expirationDays: 30,
    maxUses: 150,
  },
  {
    name: 'Debond Set 1',
    setNumber: 'SET-005',
    barcode: 'SET005BAR',
    description: 'Bracket removal pliers, adhesive removal instruments, polishing tools',
    instrumentCount: 5,
    category: 'DEBONDING',
    expirationDays: 30,
    maxUses: 75,
  },
  {
    name: 'Band Seating Set',
    setNumber: 'SET-006',
    barcode: 'SET006BAR',
    description: 'Band seater, band pusher, band remover, separator pliers',
    instrumentCount: 4,
    category: 'ORTHODONTIC',
    expirationDays: 30,
    maxUses: 100,
  },
  {
    name: 'Impression Tray Set',
    setNumber: 'SET-007',
    barcode: 'SET007BAR',
    description: 'Assorted impression trays - small, medium, large',
    instrumentCount: 12,
    category: 'IMPRESSION',
    expirationDays: 60,
    maxUses: 200,
  },
  {
    name: 'Alginate Mixing Set',
    setNumber: 'SET-008',
    barcode: 'SET008BAR',
    description: 'Mixing bowls and spatulas for impression material',
    instrumentCount: 4,
    category: 'IMPRESSION',
    expirationDays: 60,
    maxUses: 500,
  },
  {
    name: 'Hygiene Exam Set',
    setNumber: 'SET-009',
    barcode: 'SET009BAR',
    description: 'Mirror, explorer, cotton pliers for routine exams',
    instrumentCount: 3,
    category: 'HYGIENE',
    expirationDays: 14,
    maxUses: 100,
  },
  {
    name: 'General Ortho Set',
    setNumber: 'SET-010',
    barcode: 'SET010BAR',
    description: 'Basic orthodontic instruments for general procedures',
    instrumentCount: 10,
    category: 'GENERAL',
    expirationDays: 30,
    maxUses: 100,
  },
];

// =============================================================================
// Sterilization Cycle Parameters by Type
// =============================================================================

export interface CycleParameters {
  cycleType: SterilizationCycleType;
  temperature: number;     // in Celsius
  pressure: number;        // in PSI
  exposureTime: number;    // in minutes
  dryingTime: number;      // in minutes
}

export const CYCLE_PARAMETERS: CycleParameters[] = [
  {
    cycleType: 'STEAM_GRAVITY',
    temperature: 121,
    pressure: 15,
    exposureTime: 30,
    dryingTime: 15,
  },
  {
    cycleType: 'STEAM_PREVACUUM',
    temperature: 132,
    pressure: 27,
    exposureTime: 4,
    dryingTime: 20,
  },
  {
    cycleType: 'STEAM_FLASH',
    temperature: 132,
    pressure: 27,
    exposureTime: 3,
    dryingTime: 0,
  },
  {
    cycleType: 'DRY_HEAT',
    temperature: 170,
    pressure: 0,
    exposureTime: 60,
    dryingTime: 0,
  },
];

// =============================================================================
// Biological Indicator Brands
// =============================================================================

export const BI_BRANDS = [
  '3M Attest',
  'Mesa Labs',
  'Steris',
  'Crosstex',
  'Getinge',
];

export const BI_READER_TYPES = [
  '3M Attest 490',
  '3M Attest 390',
  'Mesa PCD',
  'Manual Incubator',
];

// =============================================================================
// Compliance Log Templates
// =============================================================================

export interface ComplianceLogTemplate {
  logType: ComplianceLogType;
  title: string;
  description?: string;
  action?: string;
}

export const COMPLIANCE_LOG_TEMPLATES: ComplianceLogTemplate[] = [
  {
    logType: 'WEEKLY_BI_TEST',
    title: 'Weekly Biological Indicator Test',
    description: 'Routine weekly spore test performed to validate sterilization efficacy',
    action: 'Ran biological indicator in routine sterilization cycle',
  },
  {
    logType: 'MONTHLY_AUDIT',
    title: 'Monthly Sterilization Audit',
    description: 'Monthly review of sterilization logs, equipment maintenance, and compliance',
    action: 'Reviewed all sterilization records for the month',
  },
  {
    logType: 'EQUIPMENT_VALIDATION',
    title: 'Autoclave Annual Validation',
    description: 'Annual validation testing of autoclave equipment per manufacturer requirements',
    action: 'Performed full validation cycle with test packs',
  },
];

// =============================================================================
// Chemical Indicator Classes
// =============================================================================

export const CHEMICAL_INDICATOR_INFO: Record<ChemicalIndicatorClass, { name: string; description: string }> = {
  CLASS_1: {
    name: 'Process Indicator',
    description: 'Autoclave tape - indicates exposure to sterilization process',
  },
  CLASS_2: {
    name: 'Bowie-Dick Test',
    description: 'Tests air removal efficiency in prevacuum sterilizers',
  },
  CLASS_3: {
    name: 'Single-Parameter',
    description: 'Responds to one critical parameter (usually temperature)',
  },
  CLASS_4: {
    name: 'Multi-Parameter',
    description: 'Responds to two or more critical parameters',
  },
  CLASS_5: {
    name: 'Integrating Indicator',
    description: 'Responds to all critical parameters; correlates with BI results',
  },
  CLASS_6: {
    name: 'Emulating Indicator',
    description: 'Cycle-specific indicator for particular sterilization cycle types',
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate a random lot number for biological indicators
 */
export function generateBILotNumber(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `LOT${year}${month}${random}`;
}

/**
 * Get random cycle parameters for a cycle type
 */
export function getCycleParameters(cycleType: SterilizationCycleType): CycleParameters {
  const params = CYCLE_PARAMETERS.find((p) => p.cycleType === cycleType);
  return params || CYCLE_PARAMETERS[0];
}

/**
 * Get a random BI brand
 */
export function getRandomBIBrand(): string {
  return BI_BRANDS[Math.floor(Math.random() * BI_BRANDS.length)];
}

/**
 * Get a random BI reader type
 */
export function getRandomBIReader(): string {
  return BI_READER_TYPES[Math.floor(Math.random() * BI_READER_TYPES.length)];
}

// =============================================================================
// Equipment Validation Fixtures
// =============================================================================

export interface ValidationScheduleFixture {
  validationType: ValidationType;
  frequencyDays: number;
  reminderDays: number;
  description: string;
}

export const VALIDATION_SCHEDULES: ValidationScheduleFixture[] = [
  {
    validationType: 'BOWIE_DICK_TEST',
    frequencyDays: 1,
    reminderDays: 1,
    description: 'Daily Bowie-Dick test for prevacuum sterilizers',
  },
  {
    validationType: 'CALIBRATION',
    frequencyDays: 365,
    reminderDays: 30,
    description: 'Annual temperature and pressure calibration',
  },
  {
    validationType: 'ANNUAL_VALIDATION',
    frequencyDays: 365,
    reminderDays: 60,
    description: 'Comprehensive annual validation per manufacturer guidelines',
  },
  {
    validationType: 'PREVENTIVE_MAINTENANCE',
    frequencyDays: 90,
    reminderDays: 14,
    description: 'Quarterly preventive maintenance',
  },
  {
    validationType: 'LEAK_RATE_TEST',
    frequencyDays: 30,
    reminderDays: 7,
    description: 'Monthly vacuum leak rate test',
  },
];

export interface ValidationRecordTemplate {
  validationType: ValidationType;
  performedBy: string;
  vendorName?: string;
  certificatePrefix: string;
  parameters: Record<string, unknown>;
}

export const VALIDATION_TEMPLATES: ValidationRecordTemplate[] = [
  {
    validationType: 'BOWIE_DICK_TEST',
    performedBy: 'Sterilization Technician',
    certificatePrefix: 'BD',
    parameters: {
      testType: 'Bowie-Dick',
      steamPenetration: true,
      airRemoval: true,
    },
  },
  {
    validationType: 'CALIBRATION',
    performedBy: 'Authorized Service Tech',
    vendorName: 'Medical Equipment Services',
    certificatePrefix: 'CAL',
    parameters: {
      temperatureDeviation: '±1°C',
      pressureDeviation: '±0.5 PSI',
      timerAccuracy: '±2 seconds',
    },
  },
  {
    validationType: 'ANNUAL_VALIDATION',
    performedBy: 'Certified Validation Specialist',
    vendorName: 'Sterilizer Validation Corp',
    certificatePrefix: 'VAL',
    parameters: {
      iqCompleted: true,
      oqCompleted: true,
      pqCompleted: true,
      documentationReviewed: true,
    },
  },
  {
    validationType: 'PREVENTIVE_MAINTENANCE',
    performedBy: 'Equipment Technician',
    vendorName: 'Healthcare Equipment Services',
    certificatePrefix: 'PM',
    parameters: {
      gasketInspection: 'Pass',
      doorSealCheck: 'Pass',
      filterReplacement: true,
      chamberCleaning: true,
    },
  },
  {
    validationType: 'LEAK_RATE_TEST',
    performedBy: 'Sterilization Technician',
    certificatePrefix: 'LRT',
    parameters: {
      vacuumLevel: '-27 inHg',
      leakRate: '<10 mbar/min',
      testDuration: '10 minutes',
    },
  },
];

/**
 * Generate a certificate number for a validation
 */
export function generateValidationCertNumber(prefix: string): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${year}-${random}`;
}

/**
 * Get validation template by type
 */
export function getValidationTemplate(type: ValidationType): ValidationRecordTemplate | undefined {
  return VALIDATION_TEMPLATES.find((t) => t.validationType === type);
}

/**
 * Get validation schedule by type
 */
export function getValidationSchedule(type: ValidationType): ValidationScheduleFixture | undefined {
  return VALIDATION_SCHEDULES.find((s) => s.validationType === type);
}
