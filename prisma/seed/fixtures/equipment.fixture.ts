/**
 * Equipment-specific reference data for orthodontic practices
 * Based on common equipment found in orthodontic offices
 */

import type {
  EquipmentCategory,
  MaintenanceType,
  DepreciationMethod,
} from '@prisma/client';

// ============================================================================
// EQUIPMENT TYPES
// ============================================================================

export interface EquipmentTypeFixture {
  code: string;
  name: string;
  category: EquipmentCategory;
  description: string;
  defaultMaintenanceIntervalDays: number | null;
  maintenanceChecklist: string[];
  expectedLifespanYears: number;
  isSystem: boolean;
}

export const EQUIPMENT_TYPES: EquipmentTypeFixture[] = [
  // DIAGNOSTIC EQUIPMENT
  {
    code: 'INTRAORAL_SCANNER',
    name: 'Intraoral Scanner',
    category: 'DIAGNOSTIC',
    description: 'Digital intraoral scanning device for 3D impressions',
    defaultMaintenanceIntervalDays: 90,
    maintenanceChecklist: [
      'Clean scanner tip',
      'Calibrate scanner',
      'Update software',
      'Check USB/wireless connection',
      'Inspect scan wand for damage',
    ],
    expectedLifespanYears: 5,
    isSystem: true,
  },
  {
    code: 'CBCT_MACHINE',
    name: 'CBCT Machine',
    category: 'DIAGNOSTIC',
    description: 'Cone Beam Computed Tomography for 3D dental imaging',
    defaultMaintenanceIntervalDays: 180,
    maintenanceChecklist: [
      'Radiation safety check',
      'Calibration verification',
      'Clean sensors and detectors',
      'Check positioning guides',
      'Review image quality',
      'Backup patient data',
    ],
    expectedLifespanYears: 10,
    isSystem: true,
  },
  {
    code: 'PANORAMIC_XRAY',
    name: 'Panoramic X-Ray Machine',
    category: 'DIAGNOSTIC',
    description: 'Panoramic dental radiography unit',
    defaultMaintenanceIntervalDays: 180,
    maintenanceChecklist: [
      'Radiation safety inspection',
      'Image quality calibration',
      'Clean bite guide and chin rest',
      'Check positioning lights',
      'Test emergency stop',
    ],
    expectedLifespanYears: 12,
    isSystem: true,
  },
  {
    code: 'CEPHALOMETRIC_XRAY',
    name: 'Cephalometric X-Ray',
    category: 'DIAGNOSTIC',
    description: 'Lateral cephalometric radiography for orthodontic analysis',
    defaultMaintenanceIntervalDays: 180,
    maintenanceChecklist: [
      'Radiation output verification',
      'Ear rod alignment check',
      'Nasion positioner inspection',
      'Image clarity calibration',
    ],
    expectedLifespanYears: 12,
    isSystem: true,
  },

  // TREATMENT EQUIPMENT
  {
    code: 'CURING_LIGHT',
    name: 'LED Curing Light',
    category: 'TREATMENT',
    description: 'LED light for curing dental composites and bonding materials',
    defaultMaintenanceIntervalDays: 30,
    maintenanceChecklist: [
      'Check light intensity with radiometer',
      'Clean light guide',
      'Inspect fiber optic tip',
      'Test battery charge cycle',
      'Clean fan filter',
    ],
    expectedLifespanYears: 3,
    isSystem: true,
  },
  {
    code: 'BRACKET_POSITIONER',
    name: 'Bracket Positioning System',
    category: 'TREATMENT',
    description: 'Digital bracket positioning system for indirect bonding',
    defaultMaintenanceIntervalDays: 90,
    maintenanceChecklist: [
      'Software update',
      'Camera calibration',
      'Clean positioning guides',
    ],
    expectedLifespanYears: 5,
    isSystem: true,
  },

  // CHAIR EQUIPMENT
  {
    code: 'DENTAL_CHAIR',
    name: 'Dental Chair Unit',
    category: 'CHAIR',
    description: 'Patient treatment chair with delivery system',
    defaultMaintenanceIntervalDays: 90,
    maintenanceChecklist: [
      'Lubricate chair mechanisms',
      'Check hydraulic lift',
      'Inspect upholstery for tears',
      'Clean water lines',
      'Test chair controls',
      'Check foot pedal operation',
    ],
    expectedLifespanYears: 15,
    isSystem: true,
  },
  {
    code: 'DENTAL_LIGHT',
    name: 'Operatory Light',
    category: 'CHAIR',
    description: 'LED operatory light for patient treatment',
    defaultMaintenanceIntervalDays: 180,
    maintenanceChecklist: [
      'Clean light surface',
      'Check arm positioning',
      'Test dimmer controls',
      'Inspect mounting',
    ],
    expectedLifespanYears: 10,
    isSystem: true,
  },
  {
    code: 'AIR_COMPRESSOR',
    name: 'Dental Air Compressor',
    category: 'CHAIR',
    description: 'Oil-free air compressor for dental delivery systems',
    defaultMaintenanceIntervalDays: 90,
    maintenanceChecklist: [
      'Drain moisture from tank',
      'Check air pressure output',
      'Inspect filters',
      'Check belt tension',
      'Listen for unusual sounds',
      'Test safety valve',
    ],
    expectedLifespanYears: 10,
    isSystem: true,
  },
  {
    code: 'VACUUM_SYSTEM',
    name: 'Central Vacuum System',
    category: 'CHAIR',
    description: 'Central suction/vacuum system',
    defaultMaintenanceIntervalDays: 30,
    maintenanceChecklist: [
      'Clean filters',
      'Check suction power',
      'Inspect vacuum lines',
      'Clean separator',
    ],
    expectedLifespanYears: 15,
    isSystem: true,
  },

  // STERILIZATION EQUIPMENT
  {
    code: 'AUTOCLAVE',
    name: 'Steam Autoclave',
    category: 'STERILIZATION',
    description: 'Steam sterilizer for dental instruments',
    defaultMaintenanceIntervalDays: 7,
    maintenanceChecklist: [
      'Run biological indicator test',
      'Check door gasket',
      'Clean chamber',
      'Verify temperature/pressure',
      'Inspect water quality',
      'Log sterilization cycles',
    ],
    expectedLifespanYears: 10,
    isSystem: true,
  },
  {
    code: 'ULTRASONIC_CLEANER',
    name: 'Ultrasonic Cleaner',
    category: 'STERILIZATION',
    description: 'Ultrasonic cleaning unit for instrument pre-cleaning',
    defaultMaintenanceIntervalDays: 30,
    maintenanceChecklist: [
      'Change cleaning solution',
      'Clean tank',
      'Check transducer operation',
      'Inspect basket',
    ],
    expectedLifespanYears: 7,
    isSystem: true,
  },
  {
    code: 'INSTRUMENT_WASHER',
    name: 'Instrument Washer-Disinfector',
    category: 'STERILIZATION',
    description: 'Automated instrument washing and disinfection unit',
    defaultMaintenanceIntervalDays: 30,
    maintenanceChecklist: [
      'Clean spray arms',
      'Check detergent levels',
      'Inspect door seals',
      'Run test cycle',
    ],
    expectedLifespanYears: 10,
    isSystem: true,
  },

  // DIGITAL/LAB EQUIPMENT
  {
    code: '3D_PRINTER',
    name: '3D Printer',
    category: 'DIGITAL',
    description: '3D printer for orthodontic models and appliances',
    defaultMaintenanceIntervalDays: 30,
    maintenanceChecklist: [
      'Clean resin tank',
      'Check build platform',
      'Calibrate Z-axis',
      'Clean optical components',
      'Update firmware',
      'Replace FEP film if needed',
    ],
    expectedLifespanYears: 5,
    isSystem: true,
  },
  {
    code: 'MODEL_TRIMMER',
    name: 'Model Trimmer',
    category: 'DIGITAL',
    description: 'Plaster model trimmer for orthodontic study models',
    defaultMaintenanceIntervalDays: 90,
    maintenanceChecklist: [
      'Check grinding wheel',
      'Clean water tray',
      'Inspect table alignment',
      'Check motor bearings',
    ],
    expectedLifespanYears: 15,
    isSystem: true,
  },
  {
    code: 'RETAINER_FORMER',
    name: 'Vacuum Former',
    category: 'DIGITAL',
    description: 'Vacuum forming machine for retainers and aligners',
    defaultMaintenanceIntervalDays: 90,
    maintenanceChecklist: [
      'Check heating element',
      'Inspect vacuum pump',
      'Clean forming platform',
      'Test temperature controls',
    ],
    expectedLifespanYears: 10,
    isSystem: true,
  },
  {
    code: 'SPOT_WELDER',
    name: 'Spot Welder',
    category: 'DIGITAL',
    description: 'Resistance spot welder for orthodontic lab work',
    defaultMaintenanceIntervalDays: 90,
    maintenanceChecklist: [
      'Clean electrode tips',
      'Check welding power',
      'Inspect electrode alignment',
    ],
    expectedLifespanYears: 10,
    isSystem: true,
  },

  // PATIENT COMFORT
  {
    code: 'PATIENT_MONITOR',
    name: 'Patient Monitor',
    category: 'OTHER',
    description: 'Ceiling-mounted patient entertainment monitor',
    defaultMaintenanceIntervalDays: 365,
    maintenanceChecklist: [
      'Check mounting hardware',
      'Update software',
      'Clean screen',
    ],
    expectedLifespanYears: 7,
    isSystem: true,
  },
  {
    code: 'NITROUS_SYSTEM',
    name: 'Nitrous Oxide Delivery System',
    category: 'TREATMENT',
    description: 'Nitrous oxide/oxygen sedation delivery system',
    defaultMaintenanceIntervalDays: 90,
    maintenanceChecklist: [
      'Check tank levels',
      'Inspect delivery masks',
      'Test flowmeters',
      'Check scavenging system',
      'Verify connections',
    ],
    expectedLifespanYears: 15,
    isSystem: true,
  },
];

// ============================================================================
// SUPPLIER TYPES
// ============================================================================

export interface SupplierFixture {
  code: string;
  name: string;
  category: string;
  phone: string;
  email: string;
  website: string;
  description: string;
}

export const SUPPLIERS: SupplierFixture[] = [
  {
    code: 'HENRY_SCHEIN',
    name: 'Henry Schein Dental',
    category: 'GENERAL_SUPPLIES',
    phone: '1-800-372-4346',
    email: 'orders@henryschein.com',
    website: 'https://www.henryschein.com',
    description: 'Full-service dental distributor',
  },
  {
    code: 'PATTERSON',
    name: 'Patterson Dental',
    category: 'GENERAL_SUPPLIES',
    phone: '1-800-328-5536',
    email: 'orders@pattersondental.com',
    website: 'https://www.pattersondental.com',
    description: 'Dental supplies and equipment',
  },
  {
    code: 'ORMCO',
    name: 'Ormco Corporation',
    category: 'ORTHODONTIC_SUPPLIES',
    phone: '1-800-854-1741',
    email: 'support@ormco.com',
    website: 'https://www.ormco.com',
    description: 'Orthodontic brackets, wires, and supplies (Damon System)',
  },
  {
    code: '3M_ORAL',
    name: '3M Oral Care',
    category: 'ORTHODONTIC_SUPPLIES',
    phone: '1-800-634-2249',
    email: 'dental.orders@mmm.com',
    website: 'https://www.3m.com/3M/en_US/oral-care-us/',
    description: 'Brackets, bands, and dental materials (Clarity, Victory)',
  },
  {
    code: 'AMERICAN_ORTHO',
    name: 'American Orthodontics',
    category: 'ORTHODONTIC_SUPPLIES',
    phone: '1-800-558-7687',
    email: 'customer.service@americanortho.com',
    website: 'https://www.americanortho.com',
    description: 'Orthodontic brackets and appliances (Empower)',
  },
  {
    code: 'ALIGN_TECH',
    name: 'Align Technology',
    category: 'ALIGNER_SUPPLIES',
    phone: '1-888-822-5446',
    email: 'support@aligntech.com',
    website: 'https://www.aligntech.com',
    description: 'Invisalign and iTero scanner support',
  },
  {
    code: 'DENTSPLY',
    name: 'Dentsply Sirona',
    category: 'EQUIPMENT',
    phone: '1-800-877-0020',
    email: 'service@dentsplysirona.com',
    website: 'https://www.dentsplysirona.com',
    description: 'Dental equipment and imaging systems',
  },
  {
    code: 'CARESTREAM',
    name: 'Carestream Dental',
    category: 'IMAGING',
    phone: '1-800-944-6365',
    email: 'support@carestreamdental.com',
    website: 'https://www.carestreamdental.com',
    description: 'Dental imaging and software solutions',
  },
  {
    code: 'MIDMARK',
    name: 'Midmark Corporation',
    category: 'EQUIPMENT',
    phone: '1-800-643-6275',
    email: 'service@midmark.com',
    website: 'https://www.midmark.com',
    description: 'Dental chairs, cabinetry, and sterilization',
  },
  {
    code: 'A_DEC',
    name: 'A-dec Inc.',
    category: 'EQUIPMENT',
    phone: '1-800-547-1883',
    email: 'service@a-dec.com',
    website: 'https://www.a-dec.com',
    description: 'Dental chairs and delivery systems',
  },
  {
    code: 'FORMLABS',
    name: 'Formlabs Dental',
    category: 'DIGITAL',
    phone: '1-617-444-2462',
    email: 'dental@formlabs.com',
    website: 'https://dental.formlabs.com',
    description: '3D printers and dental resins',
  },
  {
    code: 'TUTTNAUER',
    name: 'Tuttnauer USA',
    category: 'STERILIZATION',
    phone: '1-800-624-5836',
    email: 'service@tuttnauerusa.com',
    website: 'https://tuttnauerusa.com',
    description: 'Autoclaves and sterilization equipment',
  },
];

// ============================================================================
// MAINTENANCE SCHEDULE TEMPLATES
// ============================================================================

export interface MaintenanceScheduleTemplate {
  equipmentTypeCode: string;
  maintenanceType: MaintenanceType;
  intervalDays: number;
  description: string;
  estimatedDuration: number; // minutes
  estimatedCost: number;
}

export const MAINTENANCE_SCHEDULES: MaintenanceScheduleTemplate[] = [
  // Autoclave - Weekly biological testing
  {
    equipmentTypeCode: 'AUTOCLAVE',
    maintenanceType: 'INSPECTION',
    intervalDays: 7,
    description: 'Weekly biological indicator (spore test) and inspection',
    estimatedDuration: 30,
    estimatedCost: 25,
  },
  // Autoclave - Monthly maintenance
  {
    equipmentTypeCode: 'AUTOCLAVE',
    maintenanceType: 'PREVENTIVE',
    intervalDays: 30,
    description: 'Monthly chamber cleaning and gasket inspection',
    estimatedDuration: 45,
    estimatedCost: 0,
  },
  // Autoclave - Annual certification
  {
    equipmentTypeCode: 'AUTOCLAVE',
    maintenanceType: 'CERTIFICATION',
    intervalDays: 365,
    description: 'Annual validation and certification',
    estimatedDuration: 120,
    estimatedCost: 350,
  },
  // Curing Light - Monthly check
  {
    equipmentTypeCode: 'CURING_LIGHT',
    maintenanceType: 'INSPECTION',
    intervalDays: 30,
    description: 'Monthly intensity test with radiometer',
    estimatedDuration: 10,
    estimatedCost: 0,
  },
  // X-Ray Equipment - Quarterly inspection
  {
    equipmentTypeCode: 'PANORAMIC_XRAY',
    maintenanceType: 'INSPECTION',
    intervalDays: 90,
    description: 'Quarterly radiation safety and image quality check',
    estimatedDuration: 60,
    estimatedCost: 150,
  },
  // X-Ray Equipment - Annual certification
  {
    equipmentTypeCode: 'PANORAMIC_XRAY',
    maintenanceType: 'CERTIFICATION',
    intervalDays: 365,
    description: 'Annual radiation physics survey and certification',
    estimatedDuration: 180,
    estimatedCost: 500,
  },
  // CBCT - Semi-annual inspection
  {
    equipmentTypeCode: 'CBCT_MACHINE',
    maintenanceType: 'PREVENTIVE',
    intervalDays: 180,
    description: 'Semi-annual calibration and preventive maintenance',
    estimatedDuration: 120,
    estimatedCost: 400,
  },
  // Dental Chair - Quarterly maintenance
  {
    equipmentTypeCode: 'DENTAL_CHAIR',
    maintenanceType: 'PREVENTIVE',
    intervalDays: 90,
    description: 'Quarterly lubrication and mechanical inspection',
    estimatedDuration: 45,
    estimatedCost: 75,
  },
  // Compressor - Quarterly drain and filter
  {
    equipmentTypeCode: 'AIR_COMPRESSOR',
    maintenanceType: 'PREVENTIVE',
    intervalDays: 90,
    description: 'Drain tank, check filters, inspect belts',
    estimatedDuration: 30,
    estimatedCost: 50,
  },
  // Vacuum - Monthly filter cleaning
  {
    equipmentTypeCode: 'VACUUM_SYSTEM',
    maintenanceType: 'PREVENTIVE',
    intervalDays: 30,
    description: 'Monthly filter cleaning and suction check',
    estimatedDuration: 20,
    estimatedCost: 0,
  },
  // Intraoral Scanner - Quarterly calibration
  {
    equipmentTypeCode: 'INTRAORAL_SCANNER',
    maintenanceType: 'CALIBRATION',
    intervalDays: 90,
    description: 'Quarterly calibration and software update',
    estimatedDuration: 30,
    estimatedCost: 0,
  },
  // 3D Printer - Monthly maintenance
  {
    equipmentTypeCode: '3D_PRINTER',
    maintenanceType: 'PREVENTIVE',
    intervalDays: 30,
    description: 'Monthly cleaning and calibration',
    estimatedDuration: 45,
    estimatedCost: 50,
  },
  // Ultrasonic - Monthly cleaning
  {
    equipmentTypeCode: 'ULTRASONIC_CLEANER',
    maintenanceType: 'PREVENTIVE',
    intervalDays: 30,
    description: 'Monthly tank cleaning and solution change',
    estimatedDuration: 20,
    estimatedCost: 25,
  },
];

// ============================================================================
// DEPRECIATION SETTINGS
// ============================================================================

export interface DepreciationSetting {
  category: EquipmentCategory;
  method: DepreciationMethod;
  lifespanYears: number;
  salvageValuePercent: number;
}

export const DEPRECIATION_SETTINGS: DepreciationSetting[] = [
  { category: 'DIAGNOSTIC', method: 'STRAIGHT_LINE', lifespanYears: 7, salvageValuePercent: 10 },
  { category: 'TREATMENT', method: 'STRAIGHT_LINE', lifespanYears: 5, salvageValuePercent: 5 },
  { category: 'CHAIR', method: 'STRAIGHT_LINE', lifespanYears: 10, salvageValuePercent: 10 },
  { category: 'STERILIZATION', method: 'STRAIGHT_LINE', lifespanYears: 7, salvageValuePercent: 5 },
  { category: 'DIGITAL', method: 'DECLINING_BALANCE', lifespanYears: 5, salvageValuePercent: 5 },
  { category: 'SAFETY', method: 'STRAIGHT_LINE', lifespanYears: 10, salvageValuePercent: 0 },
  { category: 'OTHER', method: 'STRAIGHT_LINE', lifespanYears: 5, salvageValuePercent: 0 },
];

// ============================================================================
// SAMPLE EQUIPMENT DATA
// ============================================================================

export interface SampleEquipment {
  typeCode: string;
  name: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  purchaseCost: number;
  warrantyYears: number;
  location: string;
}

export const SAMPLE_EQUIPMENT: SampleEquipment[] = [
  // Diagnostic
  {
    typeCode: 'INTRAORAL_SCANNER',
    name: 'iTero Element 5D',
    manufacturer: 'Align Technology',
    model: 'Element 5D',
    serialNumber: 'ITE5D-2023-001',
    purchaseCost: 45000,
    warrantyYears: 2,
    location: 'Op Room 1',
  },
  {
    typeCode: 'CBCT_MACHINE',
    name: 'CS 8100 3D CBCT',
    manufacturer: 'Carestream Dental',
    model: 'CS 8100 3D',
    serialNumber: 'CS8100-2022-156',
    purchaseCost: 85000,
    warrantyYears: 3,
    location: 'Imaging Room',
  },
  {
    typeCode: 'PANORAMIC_XRAY',
    name: 'Planmeca ProMax',
    manufacturer: 'Planmeca',
    model: 'ProMax 3D Mid',
    serialNumber: 'PM3DM-2021-089',
    purchaseCost: 65000,
    warrantyYears: 3,
    location: 'Imaging Room',
  },

  // Treatment
  {
    typeCode: 'CURING_LIGHT',
    name: 'Valo Grand Curing Light',
    manufacturer: 'Ultradent',
    model: 'Valo Grand',
    serialNumber: 'VALO-2023-234',
    purchaseCost: 800,
    warrantyYears: 2,
    location: 'Op Room 1',
  },
  {
    typeCode: 'CURING_LIGHT',
    name: 'Valo Grand Curing Light',
    manufacturer: 'Ultradent',
    model: 'Valo Grand',
    serialNumber: 'VALO-2023-235',
    purchaseCost: 800,
    warrantyYears: 2,
    location: 'Op Room 2',
  },
  {
    typeCode: 'CURING_LIGHT',
    name: 'Valo Grand Curing Light',
    manufacturer: 'Ultradent',
    model: 'Valo Grand',
    serialNumber: 'VALO-2023-236',
    purchaseCost: 800,
    warrantyYears: 2,
    location: 'Op Room 3',
  },

  // Chairs
  {
    typeCode: 'DENTAL_CHAIR',
    name: 'A-dec 500 Chair',
    manufacturer: 'A-dec',
    model: 'A-dec 500',
    serialNumber: 'ADEC500-2020-001',
    purchaseCost: 18000,
    warrantyYears: 5,
    location: 'Op Room 1',
  },
  {
    typeCode: 'DENTAL_CHAIR',
    name: 'A-dec 500 Chair',
    manufacturer: 'A-dec',
    model: 'A-dec 500',
    serialNumber: 'ADEC500-2020-002',
    purchaseCost: 18000,
    warrantyYears: 5,
    location: 'Op Room 2',
  },
  {
    typeCode: 'DENTAL_CHAIR',
    name: 'A-dec 500 Chair',
    manufacturer: 'A-dec',
    model: 'A-dec 500',
    serialNumber: 'ADEC500-2020-003',
    purchaseCost: 18000,
    warrantyYears: 5,
    location: 'Op Room 3',
  },
  {
    typeCode: 'AIR_COMPRESSOR',
    name: 'JUN-AIR Compressor',
    manufacturer: 'JUN-AIR',
    model: 'iQ6/20',
    serialNumber: 'JUNAIR-2019-045',
    purchaseCost: 4500,
    warrantyYears: 3,
    location: 'Mechanical Room',
  },
  {
    typeCode: 'VACUUM_SYSTEM',
    name: 'Ramvac Bison Dry Vacuum',
    manufacturer: 'DentalEZ',
    model: 'Bison 2.5HP',
    serialNumber: 'RAMVAC-2019-012',
    purchaseCost: 6500,
    warrantyYears: 3,
    location: 'Mechanical Room',
  },

  // Sterilization
  {
    typeCode: 'AUTOCLAVE',
    name: 'Tuttnauer EZ11Plus',
    manufacturer: 'Tuttnauer',
    model: 'EZ11Plus',
    serialNumber: 'TUTT-2022-078',
    purchaseCost: 8500,
    warrantyYears: 2,
    location: 'Sterilization Room',
  },
  {
    typeCode: 'ULTRASONIC_CLEANER',
    name: 'Biosonic UC125',
    manufacturer: 'Coltene',
    model: 'Biosonic UC125',
    serialNumber: 'BIO-2022-034',
    purchaseCost: 1200,
    warrantyYears: 1,
    location: 'Sterilization Room',
  },

  // Digital/Lab
  {
    typeCode: '3D_PRINTER',
    name: 'Form 3B+ Dental',
    manufacturer: 'Formlabs',
    model: 'Form 3B+',
    serialNumber: 'FL3B-2023-567',
    purchaseCost: 4500,
    warrantyYears: 1,
    location: 'Lab',
  },
  {
    typeCode: 'RETAINER_FORMER',
    name: 'Biostar VI Vacuum Former',
    manufacturer: 'Scheu Dental',
    model: 'Biostar VI',
    serialNumber: 'BSV6-2021-023',
    purchaseCost: 3200,
    warrantyYears: 2,
    location: 'Lab',
  },
];
