import { db } from '@/lib/db';

/**
 * Generate a unique account number for a patient account
 * Format: ACC-YYYY-NNNNN (e.g., ACC-2024-00001)
 */
export async function generateAccountNumber(clinicId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ACC-${year}-`;

  // Get the highest account number for this year
  const lastAccount = await db.patientAccount.findFirst({
    where: {
      clinicId,
      accountNumber: { startsWith: prefix },
    },
    orderBy: { accountNumber: 'desc' },
    select: { accountNumber: true },
  });

  let nextNumber = 1;
  if (lastAccount?.accountNumber) {
    const lastNumber = parseInt(lastAccount.accountNumber.replace(prefix, ''), 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(5, '0')}`;
}

/**
 * Generate a unique invoice number
 * Format: INV-YYYY-NNNNN (e.g., INV-2024-00001)
 */
export async function generateInvoiceNumber(clinicId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const lastInvoice = await db.invoice.findFirst({
    where: {
      clinicId,
      invoiceNumber: { startsWith: prefix },
    },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true },
  });

  let nextNumber = 1;
  if (lastInvoice?.invoiceNumber) {
    const lastNumber = parseInt(lastInvoice.invoiceNumber.replace(prefix, ''), 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(5, '0')}`;
}

/**
 * Generate a unique payment plan number
 * Format: PLN-YYYY-NNNNN (e.g., PLN-2024-00001)
 */
export async function generatePlanNumber(clinicId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PLN-${year}-`;

  const lastPlan = await db.paymentPlan.findFirst({
    where: {
      clinicId,
      planNumber: { startsWith: prefix },
    },
    orderBy: { planNumber: 'desc' },
    select: { planNumber: true },
  });

  let nextNumber = 1;
  if (lastPlan?.planNumber) {
    const lastNumber = parseInt(lastPlan.planNumber.replace(prefix, ''), 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(5, '0')}`;
}

/**
 * Generate a unique payment number
 * Format: PAY-YYYY-NNNNN (e.g., PAY-2024-00001)
 */
export async function generatePaymentNumber(clinicId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PAY-${year}-`;

  const lastPayment = await db.payment.findFirst({
    where: {
      clinicId,
      paymentNumber: { startsWith: prefix },
    },
    orderBy: { paymentNumber: 'desc' },
    select: { paymentNumber: true },
  });

  let nextNumber = 1;
  if (lastPayment?.paymentNumber) {
    const lastNumber = parseInt(lastPayment.paymentNumber.replace(prefix, ''), 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(5, '0')}`;
}

/**
 * Generate a unique estimate number
 * Format: EST-YYYY-NNNNN (e.g., EST-2024-00001)
 */
export async function generateEstimateNumber(clinicId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `EST-${year}-`;

  const lastEstimate = await db.treatmentEstimate.findFirst({
    where: {
      clinicId,
      estimateNumber: { startsWith: prefix },
    },
    orderBy: { estimateNumber: 'desc' },
    select: { estimateNumber: true },
  });

  let nextNumber = 1;
  if (lastEstimate?.estimateNumber) {
    const lastNumber = parseInt(lastEstimate.estimateNumber.replace(prefix, ''), 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(5, '0')}`;
}

/**
 * Generate a unique statement number
 * Format: STM-YYYY-NNNNN (e.g., STM-2024-00001)
 */
export async function generateStatementNumber(clinicId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `STM-${year}-`;

  const lastStatement = await db.statement.findFirst({
    where: {
      clinicId,
      statementNumber: { startsWith: prefix },
    },
    orderBy: { statementNumber: 'desc' },
    select: { statementNumber: true },
  });

  let nextNumber = 1;
  if (lastStatement?.statementNumber) {
    const lastNumber = parseInt(lastStatement.statementNumber.replace(prefix, ''), 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(5, '0')}`;
}

/**
 * Generate a unique refund number
 * Format: REF-YYYY-NNNNN (e.g., REF-2024-00001)
 */
export async function generateRefundNumber(clinicId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `REF-${year}-`;

  const lastRefund = await db.refund.findFirst({
    where: {
      clinicId,
      refundNumber: { startsWith: prefix },
    },
    orderBy: { refundNumber: 'desc' },
    select: { refundNumber: true },
  });

  let nextNumber = 1;
  if (lastRefund?.refundNumber) {
    const lastNumber = parseInt(lastRefund.refundNumber.replace(prefix, ''), 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(5, '0')}`;
}

/**
 * Generate a unique receipt number
 * Format: RCT-YYYY-NNNNN (e.g., RCT-2024-00001)
 */
export async function generateReceiptNumber(clinicId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `RCT-${year}-`;

  const lastReceipt = await db.receipt.findFirst({
    where: {
      clinicId,
      receiptNumber: { startsWith: prefix },
    },
    orderBy: { receiptNumber: 'desc' },
    select: { receiptNumber: true },
  });

  let nextNumber = 1;
  if (lastReceipt?.receiptNumber) {
    const lastNumber = parseInt(lastReceipt.receiptNumber.replace(prefix, ''), 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(5, '0')}`;
}

/**
 * Generate a unique payment link code
 * Format: Random alphanumeric string (URL-safe)
 */
export function generatePaymentLinkCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Calculate invoice totals from line items
 * Returns subtotal, adjustments, insuranceAmount, patientAmount, and balance
 */
export function calculateInvoiceTotals(items: {
  quantity: number;
  unitPrice: number;
  discount?: number;
  insuranceAmount?: number;
  patientAmount?: number;
}[]): {
  subtotal: number;
  adjustments: number;
  insuranceAmount: number;
  patientAmount: number;
  balance: number;
} {
  let subtotal = 0;
  let adjustments = 0;
  let insuranceAmount = 0;
  let patientAmount = 0;

  for (const item of items) {
    const lineSubtotal = item.quantity * item.unitPrice;
    subtotal += lineSubtotal;
    adjustments += item.discount || 0;
    insuranceAmount += item.insuranceAmount || 0;
    patientAmount += item.patientAmount || (lineSubtotal - (item.discount || 0) - (item.insuranceAmount || 0));
  }

  // Balance starts as patientAmount (what patient owes)
  const balance = patientAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    adjustments: Math.round(adjustments * 100) / 100,
    insuranceAmount: Math.round(insuranceAmount * 100) / 100,
    patientAmount: Math.round(patientAmount * 100) / 100,
    balance: Math.round(balance * 100) / 100,
  };
}

/**
 * Calculate payment plan amounts
 */
export function calculatePaymentPlanAmounts(
  totalAmount: number,
  downPayment: number,
  numberOfPayments: number
): {
  financedAmount: number;
  monthlyPayment: number;
  remainingBalance: number;
} {
  const financedAmount = totalAmount - downPayment;
  const monthlyPayment = Math.round((financedAmount / numberOfPayments) * 100) / 100;

  return {
    financedAmount: Math.round(financedAmount * 100) / 100,
    monthlyPayment,
    remainingBalance: Math.round(financedAmount * 100) / 100,
  };
}

/**
 * Update account balances after a transaction
 * Recalculates currentBalance, insuranceBalance, patientBalance based on invoices and payments
 */
export async function updateAccountBalance(
  accountId: string,
  clinicId: string,
  userId: string
): Promise<void> {
  // Get all non-void/non-draft invoices for the account
  const invoices = await db.invoice.findMany({
    where: {
      accountId,
      clinicId,
      status: { notIn: ['DRAFT', 'VOID'] },
      deletedAt: null,
    },
    select: {
      subtotal: true,
      adjustments: true,
      insuranceAmount: true,
      patientAmount: true,
      balance: true,
      dueDate: true,
    },
  });

  // Calculate totals from invoices
  let totalBalance = 0;
  let insuranceBalance = 0;
  let patientBalance = 0;

  // Aging buckets
  let aging30 = 0;
  let aging60 = 0;
  let aging90 = 0;
  let aging120Plus = 0;

  const now = new Date();

  for (const invoice of invoices) {
    totalBalance += invoice.balance;
    insuranceBalance += invoice.insuranceAmount;
    patientBalance += invoice.patientAmount;

    // Calculate aging based on due date
    if (invoice.balance > 0 && invoice.dueDate) {
      const daysPastDue = Math.floor(
        (now.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysPastDue <= 30) {
        // Current or under 30 days - not aged
      } else if (daysPastDue <= 60) {
        aging30 += invoice.balance;
      } else if (daysPastDue <= 90) {
        aging60 += invoice.balance;
      } else if (daysPastDue <= 120) {
        aging90 += invoice.balance;
      } else {
        aging120Plus += invoice.balance;
      }
    }
  }

  // Get credit balance for the account
  const credits = await db.creditBalance.aggregate({
    where: {
      accountId,
      clinicId,
      status: 'AVAILABLE',
    },
    _sum: {
      remainingAmount: true,
    },
  });

  const creditBalance = credits._sum.remainingAmount || 0;

  // Update account
  await db.patientAccount.update({
    where: { id: accountId },
    data: {
      currentBalance: Math.round(totalBalance * 100) / 100,
      insuranceBalance: Math.round(insuranceBalance * 100) / 100,
      patientBalance: Math.round(patientBalance * 100) / 100,
      creditBalance: Math.round(creditBalance * 100) / 100,
      aging30: Math.round(aging30 * 100) / 100,
      aging60: Math.round(aging60 * 100) / 100,
      aging90: Math.round(aging90 * 100) / 100,
      aging120Plus: Math.round(aging120Plus * 100) / 100,
      updatedBy: userId,
    },
  });
}
