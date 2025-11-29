/**
 * Orthodontic-specific reference data
 * Based on actual clinical practice and CDT codes
 */

// ============================================================================
// APPOINTMENT TYPES
// ============================================================================

export const APPOINTMENT_TYPES = [
  {
    code: 'NEW_PATIENT_EXAM',
    name: 'New Patient Exam',
    description: 'Initial consultation and examination',
    duration: 60, // minutes
    color: '#4F46E5', // Indigo
    category: 'consultation',
    requiresDoctor: true,
    defaultFee: 150,
  },
  {
    code: 'RECORDS',
    name: 'Records Appointment',
    description: 'Photos, X-rays, and impressions/scans',
    duration: 45,
    color: '#7C3AED', // Purple
    category: 'diagnostic',
    requiresDoctor: false,
    defaultFee: 350,
  },
  {
    code: 'CONSULT_REVIEW',
    name: 'Consultation Review',
    description: 'Review records and present treatment options',
    duration: 30,
    color: '#6366F1', // Indigo light
    category: 'consultation',
    requiresDoctor: true,
    defaultFee: 0,
  },
  {
    code: 'BONDING',
    name: 'Bonding',
    description: 'Initial bracket/appliance placement',
    duration: 90,
    color: '#2563EB', // Blue
    category: 'procedure',
    requiresDoctor: true,
    defaultFee: 0, // Included in treatment fee
  },
  {
    code: 'ADJUSTMENT',
    name: 'Adjustment',
    description: 'Regular adjustment appointment',
    duration: 20,
    color: '#059669', // Green
    category: 'treatment',
    requiresDoctor: false,
    defaultFee: 0, // Included in treatment fee
  },
  {
    code: 'EMERGENCY',
    name: 'Emergency',
    description: 'Emergency appointment (broken bracket, poking wire)',
    duration: 15,
    color: '#DC2626', // Red
    category: 'emergency',
    requiresDoctor: false,
    defaultFee: 0,
  },
  {
    code: 'REPAIR',
    name: 'Repair',
    description: 'Repair appointment (rebond, replace bracket)',
    duration: 20,
    color: '#F59E0B', // Amber
    category: 'treatment',
    requiresDoctor: false,
    defaultFee: 50,
  },
  {
    code: 'DEBOND',
    name: 'Debond',
    description: 'Bracket removal and retainer delivery',
    duration: 60,
    color: '#D97706', // Orange
    category: 'procedure',
    requiresDoctor: true,
    defaultFee: 0, // Included in treatment fee
  },
  {
    code: 'RETAINER_CHECK',
    name: 'Retainer Check',
    description: 'Post-treatment retainer check',
    duration: 15,
    color: '#0891B2', // Cyan
    category: 'retention',
    requiresDoctor: false,
    defaultFee: 0,
  },
  {
    code: 'RETAINER_DELIVERY',
    name: 'Retainer Delivery',
    description: 'New or replacement retainer delivery',
    duration: 20,
    color: '#0891B2',
    category: 'retention',
    requiresDoctor: false,
    defaultFee: 250,
  },
  {
    code: 'ALIGNER_DELIVERY',
    name: 'Aligner Delivery',
    description: 'New aligner set delivery and IPR if needed',
    duration: 30,
    color: '#8B5CF6', // Violet
    category: 'treatment',
    requiresDoctor: false,
    defaultFee: 0,
  },
  {
    code: 'ALIGNER_CHECK',
    name: 'Aligner Check',
    description: 'Aligner progress check',
    duration: 15,
    color: '#8B5CF6',
    category: 'treatment',
    requiresDoctor: false,
    defaultFee: 0,
  },
] as const;

// ============================================================================
// TREATMENT TYPES
// ============================================================================

export const TREATMENT_TYPES = [
  {
    code: 'COMPREHENSIVE',
    name: 'Comprehensive Treatment',
    description: 'Full orthodontic treatment',
    typicalDurationMonths: 24,
    minFee: 5000,
    maxFee: 7500,
    cdtCode: 'D8080',
  },
  {
    code: 'LIMITED',
    name: 'Limited Treatment',
    description: 'Limited orthodontic treatment addressing specific concerns',
    typicalDurationMonths: 12,
    minFee: 2500,
    maxFee: 4000,
    cdtCode: 'D8070',
  },
  {
    code: 'PHASE_I',
    name: 'Phase I (Early/Interceptive)',
    description: 'Early treatment for young patients',
    typicalDurationMonths: 12,
    minFee: 3000,
    maxFee: 4500,
    cdtCode: 'D8070',
  },
  {
    code: 'PHASE_II',
    name: 'Phase II',
    description: 'Second phase of two-phase treatment',
    typicalDurationMonths: 18,
    minFee: 4500,
    maxFee: 6500,
    cdtCode: 'D8080',
  },
  {
    code: 'INVISALIGN',
    name: 'Invisalign',
    description: 'Clear aligner treatment with Invisalign system',
    typicalDurationMonths: 18,
    minFee: 5500,
    maxFee: 8000,
    cdtCode: 'D8080',
  },
  {
    code: 'CLEAR_ALIGNER',
    name: 'Clear Aligner',
    description: 'Clear aligner treatment (non-Invisalign)',
    typicalDurationMonths: 18,
    minFee: 4500,
    maxFee: 7000,
    cdtCode: 'D8080',
  },
  {
    code: 'SURGICAL',
    name: 'Surgical Orthodontics',
    description: 'Orthodontic treatment with orthognathic surgery',
    typicalDurationMonths: 30,
    minFee: 8000,
    maxFee: 12000,
    cdtCode: 'D8080',
  },
  {
    code: 'RETENTION_ONLY',
    name: 'Retention Only',
    description: 'Retention phase management only',
    typicalDurationMonths: 0,
    minFee: 500,
    maxFee: 1500,
    cdtCode: 'D8680',
  },
] as const;

// ============================================================================
// BRACKET SYSTEMS
// ============================================================================

export const BRACKET_SYSTEMS = [
  {
    code: 'DAMON_Q',
    name: 'Damon Q',
    manufacturer: 'Ormco',
    type: 'self_ligating',
    material: 'metal',
  },
  {
    code: 'DAMON_CLEAR',
    name: 'Damon Clear',
    manufacturer: 'Ormco',
    type: 'self_ligating',
    material: 'ceramic',
  },
  {
    code: 'CLARITY',
    name: 'Clarity Advanced',
    manufacturer: '3M',
    type: 'conventional',
    material: 'ceramic',
  },
  {
    code: 'VICTORY',
    name: 'Victory Series',
    manufacturer: '3M',
    type: 'conventional',
    material: 'metal',
  },
  {
    code: 'EMPOWER',
    name: 'Empower',
    manufacturer: 'American Orthodontics',
    type: 'self_ligating',
    material: 'metal',
  },
  {
    code: 'EMPOWER_CLEAR',
    name: 'Empower Clear',
    manufacturer: 'American Orthodontics',
    type: 'self_ligating',
    material: 'ceramic',
  },
  {
    code: 'INCOGNITO',
    name: 'Incognito',
    manufacturer: '3M',
    type: 'lingual',
    material: 'gold',
  },
  {
    code: 'SPEED',
    name: 'Speed System',
    manufacturer: 'Strite Industries',
    type: 'self_ligating',
    material: 'metal',
  },
] as const;

// ============================================================================
// WIRE PROGRESSIONS
// ============================================================================

export const WIRE_PROGRESSIONS = [
  // Initial alignment phase
  { sequence: 1, size: '.014', material: 'NiTi', phase: 'initial', arch: 'both' },
  { sequence: 2, size: '.016', material: 'NiTi', phase: 'initial', arch: 'both' },

  // Leveling phase
  { sequence: 3, size: '.016x.022', material: 'NiTi', phase: 'leveling', arch: 'both' },
  { sequence: 4, size: '.017x.025', material: 'NiTi', phase: 'leveling', arch: 'both' },
  { sequence: 5, size: '.018x.025', material: 'NiTi', phase: 'leveling', arch: 'both' },

  // Working phase
  { sequence: 6, size: '.019x.025', material: 'NiTi', phase: 'working', arch: 'both' },
  { sequence: 7, size: '.019x.025', material: 'SS', phase: 'working', arch: 'both' },

  // Finishing phase
  { sequence: 8, size: '.019x.025', material: 'TMA', phase: 'finishing', arch: 'both' },
  { sequence: 9, size: '.017x.025', material: 'TMA', phase: 'finishing', arch: 'both' },
] as const;

// ============================================================================
// CDT PROCEDURE CODES
// ============================================================================

export const CDT_PROCEDURE_CODES = [
  // Diagnostic
  { code: 'D0210', name: 'Intraoral - complete series', category: 'diagnostic', fee: 150 },
  { code: 'D0220', name: 'Intraoral - periapical first radiographic image', category: 'diagnostic', fee: 35 },
  { code: 'D0230', name: 'Intraoral - periapical each additional', category: 'diagnostic', fee: 25 },
  { code: 'D0330', name: 'Panoramic radiographic image', category: 'diagnostic', fee: 125 },
  { code: 'D0340', name: 'Cephalometric radiographic image', category: 'diagnostic', fee: 100 },
  { code: 'D0350', name: 'Oral/facial photographic images', category: 'diagnostic', fee: 50 },
  { code: 'D0470', name: 'Diagnostic casts', category: 'diagnostic', fee: 75 },

  // Orthodontic treatment
  { code: 'D8010', name: 'Limited orthodontic treatment - primary dentition', category: 'treatment', fee: 2500 },
  { code: 'D8020', name: 'Limited orthodontic treatment - transitional dentition', category: 'treatment', fee: 3000 },
  { code: 'D8030', name: 'Limited orthodontic treatment - adolescent dentition', category: 'treatment', fee: 3500 },
  { code: 'D8040', name: 'Limited orthodontic treatment - adult dentition', category: 'treatment', fee: 4000 },
  { code: 'D8070', name: 'Comprehensive orthodontic treatment - transitional', category: 'treatment', fee: 4500 },
  { code: 'D8080', name: 'Comprehensive orthodontic treatment - adolescent', category: 'treatment', fee: 5500 },
  { code: 'D8090', name: 'Comprehensive orthodontic treatment - adult', category: 'treatment', fee: 6000 },

  // Periodic visits
  { code: 'D8670', name: 'Periodic orthodontic treatment visit', category: 'adjustment', fee: 0 },

  // Retention
  { code: 'D8680', name: 'Orthodontic retention', category: 'retention', fee: 500 },
  { code: 'D8681', name: 'Removable orthodontic retainer adjustment', category: 'retention', fee: 50 },

  // Repairs
  { code: 'D8691', name: 'Repair of orthodontic appliance - maxillary', category: 'repair', fee: 75 },
  { code: 'D8692', name: 'Repair of orthodontic appliance - mandibular', category: 'repair', fee: 75 },
  { code: 'D8693', name: 'Rebonding or recementing; and target of bracket', category: 'repair', fee: 50 },

  // Appliances
  { code: 'D8210', name: 'Removable appliance therapy', category: 'appliance', fee: 750 },
  { code: 'D8220', name: 'Fixed appliance therapy', category: 'appliance', fee: 500 },
] as const;

// ============================================================================
// CHIEF COMPLAINTS
// ============================================================================

export const CHIEF_COMPLAINTS = [
  'Crowding',
  'Spacing',
  'Overbite',
  'Underbite',
  'Crossbite',
  'Open bite',
  'Crooked teeth',
  'Protruding teeth',
  'Teeth not fitting together properly',
  'Jaw pain',
  'TMJ issues',
  'Difficulty chewing',
  'Speech issues',
  'Aesthetic concerns',
  'Previous orthodontic relapse',
] as const;

// ============================================================================
// INSURANCE PROVIDERS
// ============================================================================

export const INSURANCE_PROVIDERS = [
  { code: 'DELTA', name: 'Delta Dental', orthoMaxBenefit: 1500 },
  { code: 'METLIFE', name: 'MetLife', orthoMaxBenefit: 2000 },
  { code: 'CIGNA', name: 'Cigna', orthoMaxBenefit: 1500 },
  { code: 'AETNA', name: 'Aetna', orthoMaxBenefit: 2500 },
  { code: 'GUARDIAN', name: 'Guardian', orthoMaxBenefit: 1500 },
  { code: 'UNITED', name: 'United Healthcare', orthoMaxBenefit: 2000 },
  { code: 'HUMANA', name: 'Humana', orthoMaxBenefit: 1500 },
  { code: 'BCBS', name: 'Blue Cross Blue Shield', orthoMaxBenefit: 2000 },
  { code: 'PRINCIPAL', name: 'Principal Financial', orthoMaxBenefit: 1500 },
  { code: 'SUN_LIFE', name: 'Sun Life', orthoMaxBenefit: 1500 },
] as const;

// ============================================================================
// REFERRAL SOURCES
// ============================================================================

export const REFERRAL_SOURCES = [
  { code: 'DENTIST', name: 'General Dentist', category: 'professional' },
  { code: 'PEDIATRIC_DENTIST', name: 'Pediatric Dentist', category: 'professional' },
  { code: 'PATIENT', name: 'Patient Referral', category: 'word_of_mouth' },
  { code: 'FAMILY', name: 'Family Member', category: 'word_of_mouth' },
  { code: 'FRIEND', name: 'Friend', category: 'word_of_mouth' },
  { code: 'GOOGLE', name: 'Google Search', category: 'digital' },
  { code: 'FACEBOOK', name: 'Facebook', category: 'digital' },
  { code: 'INSTAGRAM', name: 'Instagram', category: 'digital' },
  { code: 'WEBSITE', name: 'Practice Website', category: 'digital' },
  { code: 'YELP', name: 'Yelp', category: 'digital' },
  { code: 'INSURANCE_LIST', name: 'Insurance Provider List', category: 'other' },
  { code: 'DRIVE_BY', name: 'Drove by Office', category: 'other' },
  { code: 'OTHER', name: 'Other', category: 'other' },
] as const;
