/**
 * Lab Work Management Fixtures
 *
 * Reference data for lab vendors, products, inspections, and quality control.
 */

// ============================================================================
// Lab Vendor Configuration
// ============================================================================

export const LAB_VENDORS = [
  {
    name: 'Ortho Lab Solutions',
    code: 'OLS',
    legalName: 'Ortho Lab Solutions Inc.',
    taxId: '12-3456789',
    capabilities: ['RETAINER', 'APPLIANCE', 'MODEL'],
    website: 'https://ortholabsolutions.example.com',
    paymentTerms: 30,
    defaultShipping: 'GROUND',
    billingMethod: 'PER_ORDER',
    qualityRating: 4.5,
  },
  {
    name: 'Precision Orthodontics',
    code: 'PO',
    legalName: 'Precision Orthodontics LLC',
    taxId: '98-7654321',
    capabilities: ['APPLIANCE', 'INDIRECT_BONDING', 'ARCHWIRE'],
    website: 'https://precisionortho.example.com',
    paymentTerms: 30,
    defaultShipping: 'EXPRESS',
    billingMethod: 'MONTHLY',
    qualityRating: 4.8,
  },
  {
    name: 'Clear Aligner Co',
    code: 'CAC',
    legalName: 'Clear Aligner Company',
    taxId: '55-1234567',
    capabilities: ['ALIGNER', 'RETAINER'],
    website: 'https://clearalignerco.example.com',
    paymentTerms: 45,
    defaultShipping: 'EXPRESS',
    billingMethod: 'PER_CASE',
    qualityRating: 4.7,
  },
  {
    name: 'RetainerWorks',
    code: 'RW',
    legalName: 'RetainerWorks Corp',
    taxId: '33-9876543',
    capabilities: ['RETAINER', 'MODEL'],
    website: 'https://retainerworks.example.com',
    paymentTerms: 15,
    defaultShipping: 'GROUND',
    billingMethod: 'PER_ORDER',
    qualityRating: 4.2,
  },
] as const;

export type LabVendorFixture = (typeof LAB_VENDORS)[number];

// ============================================================================
// Lab Products Configuration
// ============================================================================

export const LAB_PRODUCTS = [
  // Retainers
  {
    name: 'Hawley Retainer',
    sku: 'RET-HAW-001',
    category: 'RETAINER',
    standardTurnaround: 7,
    rushTurnaround: 3,
    basePrice: 85,
    rushUpcharge: 50,
    description: 'Classic wire and acrylic retainer',
  },
  {
    name: 'Essix/Clear Retainer',
    sku: 'RET-ESS-001',
    category: 'RETAINER',
    standardTurnaround: 5,
    rushTurnaround: 2,
    basePrice: 65,
    rushUpcharge: 50,
    description: 'Vacuum-formed clear plastic retainer',
  },
  {
    name: 'Bonded/Fixed Retainer',
    sku: 'RET-FIX-001',
    category: 'RETAINER',
    standardTurnaround: 5,
    rushTurnaround: 2,
    basePrice: 95,
    rushUpcharge: 50,
    description: 'Permanent wire retainer bonded lingually',
  },
  {
    name: 'Vivera Retainers (Set of 4)',
    sku: 'RET-VIV-004',
    category: 'RETAINER',
    standardTurnaround: 14,
    rushTurnaround: 7,
    basePrice: 250,
    rushUpcharge: 75,
    description: 'Invisalign branded clear retainer set',
  },
  // Appliances
  {
    name: 'Rapid Palatal Expander (Hyrax)',
    sku: 'APP-RPE-001',
    category: 'APPLIANCE',
    standardTurnaround: 10,
    rushTurnaround: 5,
    basePrice: 325,
    rushUpcharge: 100,
    description: 'Skeletal expansion appliance',
  },
  {
    name: 'Herbst Appliance',
    sku: 'APP-HRB-001',
    category: 'APPLIANCE',
    standardTurnaround: 14,
    rushTurnaround: 7,
    basePrice: 495,
    rushUpcharge: 150,
    description: 'Fixed Class II corrector',
  },
  {
    name: 'Quad Helix',
    sku: 'APP-QHX-001',
    category: 'APPLIANCE',
    standardTurnaround: 7,
    rushTurnaround: 4,
    basePrice: 185,
    rushUpcharge: 75,
    description: 'Arch expansion appliance',
  },
  {
    name: 'Nance Holding Arch',
    sku: 'APP-NHA-001',
    category: 'APPLIANCE',
    standardTurnaround: 7,
    rushTurnaround: 3,
    basePrice: 145,
    rushUpcharge: 60,
    description: 'Space maintainer for upper arch',
  },
  {
    name: 'Lower Lingual Holding Arch',
    sku: 'APP-LHA-001',
    category: 'APPLIANCE',
    standardTurnaround: 7,
    rushTurnaround: 3,
    basePrice: 135,
    rushUpcharge: 60,
    description: 'Space maintainer for lower arch',
  },
  {
    name: 'Bite Plate (Anterior)',
    sku: 'APP-BPA-001',
    category: 'APPLIANCE',
    standardTurnaround: 7,
    rushTurnaround: 4,
    basePrice: 125,
    rushUpcharge: 50,
    description: 'Deep bite correction appliance',
  },
  // Aligners
  {
    name: 'Invisalign Full',
    sku: 'ALN-INV-FULL',
    category: 'ALIGNER',
    standardTurnaround: 21,
    rushTurnaround: 14,
    basePrice: 1500,
    rushUpcharge: 300,
    description: 'Comprehensive Invisalign treatment',
  },
  {
    name: 'Invisalign Lite',
    sku: 'ALN-INV-LITE',
    category: 'ALIGNER',
    standardTurnaround: 21,
    rushTurnaround: 14,
    basePrice: 950,
    rushUpcharge: 200,
    description: 'Limited Invisalign for mild cases',
  },
  // Other
  {
    name: 'Indirect Bonding Tray',
    sku: 'IND-TRY-001',
    category: 'INDIRECT_BONDING',
    standardTurnaround: 7,
    rushTurnaround: 3,
    basePrice: 125,
    rushUpcharge: 50,
    description: 'Custom bracket placement tray',
  },
  {
    name: 'Study Models',
    sku: 'MOD-STD-001',
    category: 'MODEL',
    standardTurnaround: 5,
    rushTurnaround: 2,
    basePrice: 45,
    rushUpcharge: 25,
    description: 'Stone or digital printed models',
  },
  {
    name: 'Custom Archwires (Robot-Bent)',
    sku: 'ARC-RBT-001',
    category: 'ARCHWIRE',
    standardTurnaround: 5,
    rushTurnaround: 2,
    basePrice: 35,
    rushUpcharge: 20,
    description: 'Precision bent archwires',
  },
] as const;

export type LabProductFixture = (typeof LAB_PRODUCTS)[number];

// ============================================================================
// Inspection Checklist Items
// ============================================================================

export const INSPECTION_CHECKLIST_ITEMS = [
  // Fit & Comfort
  { category: 'FIT', name: 'Appliance seats properly', weight: 10 },
  { category: 'FIT', name: 'No rough edges', weight: 8 },
  { category: 'FIT', name: 'Correct arch width', weight: 9 },
  { category: 'FIT', name: 'Proper tooth coverage', weight: 9 },
  // Aesthetics
  { category: 'AESTHETICS', name: 'Color match acceptable', weight: 5 },
  { category: 'AESTHETICS', name: 'Surface finish smooth', weight: 6 },
  { category: 'AESTHETICS', name: 'No visible defects', weight: 7 },
  // Structural
  { category: 'STRUCTURAL', name: 'Wire integrity intact', weight: 10 },
  { category: 'STRUCTURAL', name: 'Solder joints solid', weight: 9 },
  { category: 'STRUCTURAL', name: 'Acrylic thickness adequate', weight: 8 },
  { category: 'STRUCTURAL', name: 'No cracks or fractures', weight: 10 },
  // Functional
  { category: 'FUNCTIONAL', name: 'Clasps engage properly', weight: 9 },
  { category: 'FUNCTIONAL', name: 'Expansion screw operates', weight: 9 },
  { category: 'FUNCTIONAL', name: 'Springs have correct tension', weight: 8 },
  // Documentation
  { category: 'DOCUMENTATION', name: 'Prescription matches', weight: 10 },
  { category: 'DOCUMENTATION', name: 'Patient ID correct', weight: 10 },
  { category: 'DOCUMENTATION', name: 'Instructions included', weight: 5 },
] as const;

export type InspectionChecklistItem = (typeof INSPECTION_CHECKLIST_ITEMS)[number];

// ============================================================================
// Remake Reasons
// ============================================================================

export const REMAKE_REASONS = [
  { code: 'FIT_ISSUE', label: 'Fit Issue', category: 'QUALITY', responsibleParty: 'LAB' },
  { code: 'WRONG_SPEC', label: 'Wrong Specifications', category: 'ORDER', responsibleParty: 'CLINIC' },
  { code: 'DAMAGE_SHIPPING', label: 'Damaged in Shipping', category: 'SHIPPING', responsibleParty: 'CARRIER' },
  { code: 'MATERIAL_DEFECT', label: 'Material Defect', category: 'QUALITY', responsibleParty: 'LAB' },
  { code: 'COLOR_MISMATCH', label: 'Color Mismatch', category: 'QUALITY', responsibleParty: 'LAB' },
  { code: 'PATIENT_CHANGE', label: 'Patient Requirements Changed', category: 'CLINICAL', responsibleParty: 'CLINIC' },
  { code: 'BREAKAGE_NORMAL', label: 'Normal Wear Breakage', category: 'USAGE', responsibleParty: 'PATIENT' },
  { code: 'LOST_PATIENT', label: 'Lost by Patient', category: 'USAGE', responsibleParty: 'PATIENT' },
] as const;

export type RemakeReason = (typeof REMAKE_REASONS)[number];

// ============================================================================
// Shipment Carriers
// ============================================================================

export const SHIPPING_CARRIERS = [
  {
    code: 'FEDEX',
    name: 'FedEx',
    trackingUrlPattern: 'https://www.fedex.com/fedextrack/?trknbr={tracking}',
    avgTransitDays: 3,
  },
  {
    code: 'UPS',
    name: 'UPS',
    trackingUrlPattern: 'https://www.ups.com/track?tracknum={tracking}',
    avgTransitDays: 3,
  },
  {
    code: 'USPS',
    name: 'USPS',
    trackingUrlPattern: 'https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking}',
    avgTransitDays: 5,
  },
  {
    code: 'DHL',
    name: 'DHL',
    trackingUrlPattern: 'https://www.dhl.com/en/express/tracking.html?AWB={tracking}',
    avgTransitDays: 2,
  },
  {
    code: 'LOCAL',
    name: 'Local Courier',
    trackingUrlPattern: null,
    avgTransitDays: 1,
  },
] as const;

export type ShippingCarrier = (typeof SHIPPING_CARRIERS)[number];

// ============================================================================
// Order Statuses with workflow
// ============================================================================

export const ORDER_STATUSES = [
  { code: 'DRAFT', label: 'Draft', canEdit: true, isTerminal: false },
  { code: 'SUBMITTED', label: 'Submitted', canEdit: false, isTerminal: false },
  { code: 'ACKNOWLEDGED', label: 'Acknowledged', canEdit: false, isTerminal: false },
  { code: 'IN_PROGRESS', label: 'In Progress', canEdit: false, isTerminal: false },
  { code: 'QUALITY_CHECK', label: 'Quality Check', canEdit: false, isTerminal: false },
  { code: 'COMPLETED', label: 'Completed', canEdit: false, isTerminal: false },
  { code: 'SHIPPED', label: 'Shipped', canEdit: false, isTerminal: false },
  { code: 'DELIVERED', label: 'Delivered', canEdit: false, isTerminal: false },
  { code: 'RECEIVED', label: 'Received', canEdit: false, isTerminal: false },
  { code: 'INSPECTED', label: 'Inspected', canEdit: false, isTerminal: false },
  { code: 'PATIENT_PICKUP', label: 'Patient Pickup', canEdit: false, isTerminal: true },
  { code: 'CANCELLED', label: 'Cancelled', canEdit: false, isTerminal: true },
  { code: 'REMAKE_REQUESTED', label: 'Remake Requested', canEdit: false, isTerminal: false },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// ============================================================================
// Warranty Periods (months)
// ============================================================================

export const WARRANTY_PERIODS: Record<string, number> = {
  RETAINER: 6,
  APPLIANCE: 12,
  ALIGNER: 3,
  INDIRECT_BONDING: 1,
  ARCHWIRE: 0,
  MODEL: 0,
  SURGICAL: 6,
  OTHER: 3,
};

// ============================================================================
// Sample Attachment Types
// ============================================================================

export const ATTACHMENT_TYPES = [
  { type: 'STL', mimeType: 'model/stl', description: '3D Scan File' },
  { type: 'PHOTO', mimeType: 'image/jpeg', description: 'Clinical Photo' },
  { type: 'XRAY', mimeType: 'image/dicom', description: 'X-Ray Image' },
  { type: 'PRESCRIPTION', mimeType: 'application/pdf', description: 'Lab Prescription' },
  { type: 'NOTES', mimeType: 'text/plain', description: 'Additional Notes' },
] as const;

export type AttachmentType = (typeof ATTACHMENT_TYPES)[number];

// ============================================================================
// Contract Terms Templates
// ============================================================================

export const CONTRACT_TERMS = [
  {
    name: 'Standard Agreement',
    discountPercent: 0,
    minimumOrderValue: 0,
    paymentTermsDays: 30,
    autoRenew: true,
    durationMonths: 12,
  },
  {
    name: 'Volume Discount',
    discountPercent: 10,
    minimumOrderValue: 500,
    paymentTermsDays: 30,
    autoRenew: true,
    durationMonths: 12,
  },
  {
    name: 'Preferred Partner',
    discountPercent: 15,
    minimumOrderValue: 1000,
    paymentTermsDays: 45,
    autoRenew: true,
    durationMonths: 24,
  },
  {
    name: 'Trial Agreement',
    discountPercent: 5,
    minimumOrderValue: 0,
    paymentTermsDays: 15,
    autoRenew: false,
    durationMonths: 3,
  },
] as const;

export type ContractTerms = (typeof CONTRACT_TERMS)[number];

// ============================================================================
// Sample Message Templates
// ============================================================================

export const MESSAGE_TEMPLATES = [
  {
    type: 'ORDER_CONFIRMATION',
    subject: 'Order Confirmation - #{orderNumber}',
    body: 'Thank you for your order. We have received order #{orderNumber} and will begin processing shortly.',
  },
  {
    type: 'SHIPPING_NOTIFICATION',
    subject: 'Your Order Has Shipped - #{orderNumber}',
    body: 'Your order #{orderNumber} has shipped via {carrier}. Tracking: {trackingNumber}',
  },
  {
    type: 'QUALITY_ISSUE',
    subject: 'Quality Issue Report - Order #{orderNumber}',
    body: 'We have identified a quality issue with order #{orderNumber}. Issue: {issueDescription}. A remake has been initiated.',
  },
  {
    type: 'REMAKE_REQUEST',
    subject: 'Remake Request - Order #{orderNumber}',
    body: 'A remake has been requested for order #{orderNumber}. Reason: {reason}. Please confirm receipt.',
  },
] as const;

export type MessageTemplate = (typeof MESSAGE_TEMPLATES)[number];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a tracking number for a given carrier
 */
export function generateTrackingNumber(carrier: string): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

  switch (carrier) {
    case 'FEDEX':
      return `${Math.floor(Math.random() * 900000000000) + 100000000000}`;
    case 'UPS':
      return `1Z999${timestamp}${random}`;
    case 'USPS':
      return `9400111899223${timestamp}${random}`;
    case 'DHL':
      return `${Math.floor(Math.random() * 9000000000) + 1000000000}`;
    default:
      return `LOCAL-${timestamp}-${random}`;
  }
}

/**
 * Get warranty end date based on product category
 */
export function getWarrantyEndDate(category: string, startDate: Date): Date | null {
  const months = WARRANTY_PERIODS[category] || 0;
  if (months === 0) return null;

  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + months);
  return endDate;
}

/**
 * Get a random inspection checklist for a product category
 */
export function getInspectionChecklist(productCategory: string): typeof INSPECTION_CHECKLIST_ITEMS[number][] {
  // All items apply, but we could filter by category if needed
  return [...INSPECTION_CHECKLIST_ITEMS];
}

/**
 * Calculate inspection score from checklist results
 */
export function calculateInspectionScore(
  results: { itemName: string; passed: boolean }[]
): number {
  const items = INSPECTION_CHECKLIST_ITEMS;
  let totalWeight = 0;
  let passedWeight = 0;

  for (const result of results) {
    const item = items.find((i) => i.name === result.itemName);
    if (item) {
      totalWeight += item.weight;
      if (result.passed) {
        passedWeight += item.weight;
      }
    }
  }

  return totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 0;
}
