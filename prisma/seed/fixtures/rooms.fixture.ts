/**
 * Room and Chair fixture data for seeding
 *
 * Layout based on typical orthodontic clinic:
 * - Main Treatment Room: Open bay with 5 treatment chairs (like Dolphin software setup)
 * - Consultation Room: For X-rays, new patient assessments, treatment plan presentations
 *
 * Workflow:
 * 1. Patient checks in at front desk
 * 2. Assistant calls patient to chair in Main Treatment Room
 * 3. Assistant works on patient (wire changes, adjustments, etc.)
 * 4. When ready for orthodontist, assistant "calls" the doctor
 * 5. Orthodontist sees which chair is calling and goes to that patient
 * 6. New patients go to Consultation Room for X-rays and treatment plan presentation
 */

export const SAMPLE_ROOMS = [
  // ============================================================================
  // MAIN TREATMENT ROOM - Open bay with 5 chairs (like Dolphin setup)
  // This is where most patient appointments happen - adjustments, wire changes, etc.
  // All chairs are in one big room, orthodontist can see all patients
  // ============================================================================
  {
    name: 'Main Treatment Room',
    roomNumber: 'TREATMENT',
    roomType: 'OPERATORY' as const,
    floor: '1st Floor',
    wing: 'Main',
    squareFeet: 800,
    capacity: 5,
    capabilities: [
      'ORTHO',
      'BONDING',
      'DEBONDING',
      'ADJUSTMENTS',
      'WIRE_CHANGES',
      'RETAINERS',
      'EMERGENCIES',
    ],
    setupNotes:
      'Open bay layout with 5 treatment chairs. Central workstation for orthodontist. ' +
      'Dolphin integration at each chair. Call system for assistants to notify doctor.',
    notes: 'Primary treatment area - most appointments happen here',
  },

  // ============================================================================
  // CONSULTATION ROOM - For new patients, X-rays, treatment plan presentations
  // This is where the doctor presents treatment plans and closes deals
  // ============================================================================
  {
    name: 'Consultation Room',
    roomNumber: 'CONSULT',
    roomType: 'CONSULTATION' as const,
    floor: '1st Floor',
    wing: 'Front',
    squareFeet: 200,
    capacity: 4,
    capabilities: [
      'CONSULTATION',
      'TREATMENT_PLANNING',
      'PANORAMIC',
      'CEPH',
      'SCANNING',
      'NEW_PATIENT_ASSESSMENT',
    ],
    setupNotes:
      'X-ray equipment (panoramic, ceph). Large display for treatment presentations. ' +
      'Comfortable seating for patient and family. iTero scanner station.',
    notes:
      'New patient exams, X-rays, treatment plan presentations, case acceptance discussions',
  },

  // ============================================================================
  // SUPPORTING ROOMS
  // ============================================================================
  {
    name: 'Sterilization',
    roomNumber: 'STERIL',
    roomType: 'STERILIZATION' as const,
    floor: '1st Floor',
    wing: 'Back',
    squareFeet: 120,
    capacity: 2,
    capabilities: ['STERILIZATION', 'INSTRUMENT_PROCESSING'],
    setupNotes: 'Dirty to clean workflow. Autoclave and ultrasonic cleaner.',
  },
  {
    name: 'Reception',
    roomNumber: 'RECEPTION',
    roomType: 'RECEPTION' as const,
    floor: '1st Floor',
    wing: 'Front',
    squareFeet: 300,
    capacity: 12,
    capabilities: ['CHECK_IN', 'WAITING', 'CHECKOUT'],
    notes: 'Front desk and patient waiting area',
  },
];

// ============================================================================
// TREATMENT CHAIRS - 5 chairs in the Main Treatment Room
// These represent the "bays" where patients sit during regular appointments
// Similar to how Dolphin shows patient flow per chair
// ============================================================================
export const SAMPLE_CHAIRS = [
  {
    roomNumber: 'TREATMENT',
    name: 'Chair 1',
    chairNumber: 'CH-1',
    manufacturer: 'A-dec',
    modelNumber: 'A-dec 500',
    serialNumber: 'AD500-2022-001',
    features: ['PROGRAMMABLE', 'LED_LIGHT', 'TOUCHPAD', 'DOLPHIN_INTEGRATION'],
    hasDeliveryUnit: true,
    hasSuction: true,
    hasLight: true,
    notes: 'Near entrance - good for quick appointments',
  },
  {
    roomNumber: 'TREATMENT',
    name: 'Chair 2',
    chairNumber: 'CH-2',
    manufacturer: 'A-dec',
    modelNumber: 'A-dec 500',
    serialNumber: 'AD500-2022-002',
    features: ['PROGRAMMABLE', 'LED_LIGHT', 'TOUCHPAD', 'DOLPHIN_INTEGRATION'],
    hasDeliveryUnit: true,
    hasSuction: true,
    hasLight: true,
  },
  {
    roomNumber: 'TREATMENT',
    name: 'Chair 3',
    chairNumber: 'CH-3',
    manufacturer: 'A-dec',
    modelNumber: 'A-dec 500',
    serialNumber: 'AD500-2022-003',
    features: ['PROGRAMMABLE', 'LED_LIGHT', 'TOUCHPAD', 'DOLPHIN_INTEGRATION'],
    hasDeliveryUnit: true,
    hasSuction: true,
    hasLight: true,
    notes: 'Center chair - primary for orthodontist',
  },
  {
    roomNumber: 'TREATMENT',
    name: 'Chair 4',
    chairNumber: 'CH-4',
    manufacturer: 'A-dec',
    modelNumber: 'A-dec 500',
    serialNumber: 'AD500-2022-004',
    features: ['PROGRAMMABLE', 'LED_LIGHT', 'TOUCHPAD', 'DOLPHIN_INTEGRATION'],
    hasDeliveryUnit: true,
    hasSuction: true,
    hasLight: true,
  },
  {
    roomNumber: 'TREATMENT',
    name: 'Chair 5',
    chairNumber: 'CH-5',
    manufacturer: 'A-dec',
    modelNumber: 'A-dec 500',
    serialNumber: 'AD500-2022-005',
    features: ['PROGRAMMABLE', 'LED_LIGHT', 'TOUCHPAD', 'DOLPHIN_INTEGRATION'],
    hasDeliveryUnit: true,
    hasSuction: true,
    hasLight: true,
    notes: 'Near sterilization - good for longer procedures',
  },
];

export const ROOM_CAPABILITIES = [
  'ORTHO',
  'BONDING',
  'DEBONDING',
  'ADJUSTMENTS',
  'SCANNING',
  'RETAINERS',
  'CONSULTATION',
  'TREATMENT_PLANNING',
  'PANORAMIC',
  'CEPH',
  'CBCT',
  'STERILIZATION',
  'INSTRUMENT_PROCESSING',
  'RETAINER_FABRICATION',
  '3D_PRINTING',
  'MODEL_WORK',
  'CHECK_IN',
  'WAITING',
];
