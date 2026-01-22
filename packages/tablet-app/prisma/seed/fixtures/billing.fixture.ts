/**
 * Billing fixture data for seeding
 *
 * Provides sample data for the Patient Billing sub-area including:
 * - Patient accounts
 * - Invoices with line items
 * - Payment plans
 * - Treatment estimates
 * - Statements
 *
 * @see docs/areas/billing-insurance/sub-areas/patient-billing/README.md
 */

import { addDays, subDays, addMonths } from 'date-fns';

// ============================================================================
// Invoice Item Templates
// ============================================================================

export interface InvoiceItemData {
  procedureCode: string;
  description: string;
  unitPrice: number;
  insuranceAmount?: number;
}

/**
 * Common orthodontic procedure codes and prices
 */
export const PROCEDURE_TEMPLATES: InvoiceItemData[] = [
  // Initial/Diagnostic
  { procedureCode: 'D0150', description: 'Comprehensive oral evaluation', unitPrice: 125.00 },
  { procedureCode: 'D0210', description: 'Intraoral - complete series of radiographs', unitPrice: 175.00 },
  { procedureCode: 'D0330', description: 'Panoramic radiographic image', unitPrice: 125.00 },
  { procedureCode: 'D0340', description: 'Cephalometric radiographic image', unitPrice: 85.00 },
  { procedureCode: 'D0350', description: '2D oral/facial photographic images', unitPrice: 50.00 },
  { procedureCode: 'D0470', description: 'Diagnostic casts', unitPrice: 75.00 },

  // Orthodontic Treatment
  { procedureCode: 'D8010', description: 'Limited orthodontic treatment - primary dentition', unitPrice: 2500.00 },
  { procedureCode: 'D8020', description: 'Limited orthodontic treatment - transitional', unitPrice: 3000.00 },
  { procedureCode: 'D8030', description: 'Limited orthodontic treatment - adolescent', unitPrice: 3500.00 },
  { procedureCode: 'D8040', description: 'Limited orthodontic treatment - adult', unitPrice: 4000.00 },
  { procedureCode: 'D8070', description: 'Comprehensive orthodontic treatment - transitional', unitPrice: 5500.00 },
  { procedureCode: 'D8080', description: 'Comprehensive orthodontic treatment - adolescent', unitPrice: 6000.00 },
  { procedureCode: 'D8090', description: 'Comprehensive orthodontic treatment - adult', unitPrice: 6500.00 },

  // Aligners
  { procedureCode: 'D8040A', description: 'Clear aligner therapy - limited', unitPrice: 4500.00 },
  { procedureCode: 'D8090A', description: 'Clear aligner therapy - comprehensive', unitPrice: 6000.00 },

  // Appliances
  { procedureCode: 'D8210', description: 'Removable appliance therapy', unitPrice: 750.00 },
  { procedureCode: 'D8220', description: 'Fixed appliance therapy', unitPrice: 1200.00 },
  { procedureCode: 'D8660', description: 'Pre-orthodontic treatment examination', unitPrice: 150.00 },
  { procedureCode: 'D8670', description: 'Periodic orthodontic treatment visit', unitPrice: 175.00 },
  { procedureCode: 'D8680', description: 'Orthodontic retention', unitPrice: 500.00 },
  { procedureCode: 'D8681', description: 'Removable orthodontic retainer adjustment', unitPrice: 75.00 },
  { procedureCode: 'D8695', description: 'Removal of fixed orthodontic appliances', unitPrice: 350.00 },

  // Emergency/Repairs
  { procedureCode: 'D9110', description: 'Emergency treatment', unitPrice: 125.00 },
  { procedureCode: 'D8691', description: 'Repair of orthodontic appliance', unitPrice: 100.00 },
  { procedureCode: 'D8692', description: 'Replacement of lost/broken retainer', unitPrice: 250.00 },
];

// ============================================================================
// Invoice Status Distribution
// ============================================================================

export type InvoiceStatusWeight = {
  status: 'DRAFT' | 'PENDING' | 'SENT' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'VOID';
  weight: number;
};

/**
 * Realistic distribution of invoice statuses
 */
export const INVOICE_STATUS_DISTRIBUTION: InvoiceStatusWeight[] = [
  { status: 'PAID', weight: 45 },
  { status: 'PENDING', weight: 15 },
  { status: 'SENT', weight: 12 },
  { status: 'PARTIAL', weight: 10 },
  { status: 'OVERDUE', weight: 8 },
  { status: 'DRAFT', weight: 7 },
  { status: 'VOID', weight: 3 },
];

// ============================================================================
// Payment Plan Templates
// ============================================================================

export interface PaymentPlanTemplate {
  totalAmount: number;
  downPaymentPercent: number;
  numberOfPayments: number;
  description: string;
}

/**
 * Common payment plan configurations for orthodontic treatment
 */
export const PAYMENT_PLAN_TEMPLATES: PaymentPlanTemplate[] = [
  { totalAmount: 5500, downPaymentPercent: 10, numberOfPayments: 18, description: 'Standard 18-month plan' },
  { totalAmount: 6000, downPaymentPercent: 15, numberOfPayments: 24, description: 'Extended 24-month plan' },
  { totalAmount: 4500, downPaymentPercent: 20, numberOfPayments: 12, description: 'Accelerated 12-month plan' },
  { totalAmount: 6500, downPaymentPercent: 10, numberOfPayments: 24, description: 'Adult comprehensive plan' },
  { totalAmount: 3500, downPaymentPercent: 25, numberOfPayments: 10, description: 'Limited treatment plan' },
  { totalAmount: 5000, downPaymentPercent: 0, numberOfPayments: 20, description: 'No down payment plan' },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Pick a random invoice status based on weight distribution
 */
export function pickRandomInvoiceStatus(): 'DRAFT' | 'PENDING' | 'SENT' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'VOID' {
  const totalWeight = INVOICE_STATUS_DISTRIBUTION.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of INVOICE_STATUS_DISTRIBUTION) {
    random -= item.weight;
    if (random <= 0) {
      return item.status;
    }
  }

  return 'PENDING';
}

/**
 * Get random procedures for an invoice
 */
export function getRandomProcedures(count: number = 3): InvoiceItemData[] {
  const shuffled = [...PROCEDURE_TEMPLATES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get a random payment plan template
 */
export function getRandomPaymentPlanTemplate(): PaymentPlanTemplate {
  return PAYMENT_PLAN_TEMPLATES[Math.floor(Math.random() * PAYMENT_PLAN_TEMPLATES.length)];
}

/**
 * Calculate due date based on invoice date and status
 */
export function calculateDueDate(invoiceDate: Date, status: string): Date {
  const daysUntilDue = 30; // Standard 30-day terms

  if (status === 'OVERDUE') {
    // Make it past due
    return subDays(new Date(), Math.floor(Math.random() * 60) + 1);
  }

  return addDays(invoiceDate, daysUntilDue);
}

/**
 * Calculate payment plan end date
 */
export function calculatePlanEndDate(startDate: Date, numberOfPayments: number): Date {
  return addMonths(startDate, numberOfPayments);
}

/**
 * Generate an invoice number
 */
export function generateInvoiceNumber(clinicIndex: number, invoiceIndex: number): string {
  const year = new Date().getFullYear();
  const clinicPrefix = clinicIndex === 0 ? '' : `C${clinicIndex + 1}-`;
  return `${clinicPrefix}INV-${year}-${String(invoiceIndex + 1).padStart(5, '0')}`;
}

/**
 * Generate an account number
 */
export function generateAccountNumber(clinicIndex: number, accountIndex: number): string {
  const year = new Date().getFullYear();
  const clinicPrefix = clinicIndex === 0 ? '' : `C${clinicIndex + 1}-`;
  return `${clinicPrefix}ACC-${year}-${String(accountIndex + 1).padStart(5, '0')}`;
}

/**
 * Generate a payment plan number
 */
export function generatePlanNumber(clinicIndex: number, planIndex: number): string {
  const year = new Date().getFullYear();
  const clinicPrefix = clinicIndex === 0 ? '' : `C${clinicIndex + 1}-`;
  return `${clinicPrefix}PLN-${year}-${String(planIndex + 1).padStart(5, '0')}`;
}

/**
 * Generate a statement number
 */
export function generateStatementNumber(clinicIndex: number, statementIndex: number): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const clinicPrefix = clinicIndex === 0 ? '' : `C${clinicIndex + 1}-`;
  return `${clinicPrefix}STM-${year}${month}-${String(statementIndex + 1).padStart(4, '0')}`;
}

/**
 * Generate an estimate number
 */
export function generateEstimateNumber(clinicIndex: number, estimateIndex: number): string {
  const year = new Date().getFullYear();
  const clinicPrefix = clinicIndex === 0 ? '' : `C${clinicIndex + 1}-`;
  return `${clinicPrefix}EST-${year}-${String(estimateIndex + 1).padStart(5, '0')}`;
}
