import { z } from 'zod';

// =============================================================================
// PATIENT BILLING - Accounts, Invoices, Payments, Statements
// =============================================================================

// -----------------------------------------------------------------------------
// Enums (matching Prisma schema exactly)
// -----------------------------------------------------------------------------

export const PatientAccountStatusEnum = z.enum([
  'ACTIVE',
  'SUSPENDED',
  'COLLECTIONS',
  'CLOSED',
  'SETTLED',
]);

export const AccountTypeEnum = z.enum([
  'INDIVIDUAL',
  'FAMILY',
  'GUARANTOR',
]);

export const InvoiceStatusEnum = z.enum([
  'DRAFT',
  'PENDING',
  'SENT',
  'PARTIAL',
  'PAID',
  'OVERDUE',
  'CANCELLED',
  'VOID',
]);

export const PaymentPlanStatusEnum = z.enum([
  'PENDING',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'DEFAULTED',
  'CANCELLED',
]);

export const StatementDeliveryMethodEnum = z.enum([
  'EMAIL',
  'PRINT',
  'PORTAL',
  'SMS',
]);

export const CreditSourceEnum = z.enum([
  'OVERPAYMENT',
  'INSURANCE_REFUND',
  'ADJUSTMENT',
  'PROMOTIONAL',
  'TRANSFER',
]);

export const CreditStatusEnum = z.enum([
  'AVAILABLE',
  'APPLIED',
  'EXPIRED',
  'REFUNDED',
]);

export const EstimateStatusEnum = z.enum([
  'DRAFT',
  'PRESENTED',
  'ACCEPTED',
  'DECLINED',
  'EXPIRED',
]);

// Payment enums
export const PaymentStatusEnum = z.enum([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
  'DISPUTED',
]);

export const PaymentTypeEnum = z.enum([
  'PATIENT',
  'INSURANCE',
  'THIRD_PARTY',
]);

export const PaymentMethodTypeEnum = z.enum([
  'CREDIT_CARD',
  'DEBIT_CARD',
  'ACH',
  'CASH',
  'CHECK',
  'E_TRANSFER',
  'WIRE',
  'OTHER',
]);

export const PaymentSourceTypeEnum = z.enum([
  'MANUAL',
  'INVOICE',
  'PAYMENT_PLAN',
  'PAYMENT_LINK',
  'PORTAL',
  'TERMINAL',
]);

export const PaymentGatewayEnum = z.enum([
  'STRIPE',
  'SQUARE',
  'MANUAL',
]);

export const TransactionTypeEnum = z.enum([
  'CHARGE',
  'CAPTURE',
  'VOID',
  'REFUND',
]);

export const CaptureMethodEnum = z.enum([
  'AUTOMATIC',
  'MANUAL',
]);

export const BankAccountTypeEnum = z.enum([
  'CHECKING',
  'SAVINGS',
]);

export const RefundReasonEnum = z.enum([
  'OVERPAYMENT',
  'DUPLICATE_PAYMENT',
  'TREATMENT_CANCELLED',
  'INSURANCE_ADJUSTMENT',
  'PATIENT_REQUEST',
  'BILLING_ERROR',
  'OTHER',
]);

export const RefundStatusEnum = z.enum([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]);

export const PaymentLinkStatusEnum = z.enum([
  'ACTIVE',
  'USED',
  'EXPIRED',
  'CANCELLED',
]);

export const ScheduledPaymentStatusEnum = z.enum([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'SKIPPED',
  'CANCELLED',
]);

export const SettlementStatusEnum = z.enum([
  'PENDING',
  'RECONCILED',
  'DISCREPANCY',
  'RESOLVED',
]);

// -----------------------------------------------------------------------------
// Patient Account Schemas
// -----------------------------------------------------------------------------

export const createPatientAccountSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  accountType: AccountTypeEnum.default('INDIVIDUAL'),
  guarantorId: z.string().optional().nullable(),
  familyGroupId: z.string().optional().nullable(),
  status: PatientAccountStatusEnum.default('ACTIVE'),
});

export const updatePatientAccountSchema = z.object({
  accountType: AccountTypeEnum.optional(),
  guarantorId: z.string().optional().nullable(),
  familyGroupId: z.string().optional().nullable(),
  status: PatientAccountStatusEnum.optional(),
});

export const patientAccountQuerySchema = z.object({
  search: z.string().optional(),
  patientId: z.string().optional(),
  guarantorId: z.string().optional(),
  familyGroupId: z.string().optional(),
  status: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    PatientAccountStatusEnum.optional()
  ),
  accountType: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    AccountTypeEnum.optional()
  ),
  hasOutstandingBalance: z.preprocess(
    (val) => (val === '' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  minBalance: z.coerce.number().optional(),
  maxBalance: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'currentBalance', 'accountNumber']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// -----------------------------------------------------------------------------
// Family Group Schemas
// -----------------------------------------------------------------------------

export const createFamilyGroupSchema = z.object({
  groupName: z.string().min(1, 'Group name is required').max(200),
  primaryGuarantorId: z.string().min(1, 'Primary guarantor is required'),
  consolidateStatements: z.boolean().default(true),
});

export const updateFamilyGroupSchema = z.object({
  groupName: z.string().min(1).max(200).optional(),
  primaryGuarantorId: z.string().optional(),
  consolidateStatements: z.boolean().optional(),
});

export const familyGroupQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'groupName']).default('groupName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// -----------------------------------------------------------------------------
// Invoice Schemas
// -----------------------------------------------------------------------------

export const invoiceItemSchema = z.object({
  procedureCode: z.string().min(1, 'Procedure code is required').max(20),
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).default(0),
  insuranceAmount: z.number().min(0).default(0),
  patientAmount: z.number().min(0),
  procedureId: z.string().optional().nullable(),
  toothNumbers: z.array(z.string()).optional(),
});

export const createInvoiceSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  patientId: z.string().min(1, 'Patient is required'),
  invoiceDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  treatmentPlanId: z.string().optional().nullable(),
  appointmentId: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  internalNotes: z.string().max(2000).optional().nullable(),
  status: InvoiceStatusEnum.default('DRAFT'),
});

export const updateInvoiceSchema = z.object({
  dueDate: z.coerce.date().optional(),
  status: InvoiceStatusEnum.optional(),
  notes: z.string().max(2000).optional().nullable(),
  internalNotes: z.string().max(2000).optional().nullable(),
});

export const invoiceQuerySchema = z.object({
  search: z.string().optional(),
  accountId: z.string().optional(),
  patientId: z.string().optional(),
  status: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    InvoiceStatusEnum.optional()
  ),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  dueBefore: z.coerce.date().optional(),
  dueAfter: z.coerce.date().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  overdue: z.preprocess(
    (val) => (val === '' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'invoiceDate', 'dueDate', 'subtotal', 'invoiceNumber', 'status']).default('invoiceDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const voidInvoiceSchema = z.object({
  voidReason: z.string().min(1, 'Void reason is required').max(500),
});

export const sendInvoiceSchema = z.object({
  deliveryMethod: StatementDeliveryMethodEnum,
  emailAddress: z.string().email().optional(),
  customMessage: z.string().max(2000).optional().nullable(),
});

// -----------------------------------------------------------------------------
// Payment Plan Schemas
// -----------------------------------------------------------------------------

export const createPaymentPlanSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  totalAmount: z.number().min(0, 'Total amount must be positive'),
  downPayment: z.number().min(0).default(0),
  numberOfPayments: z.number().int().min(1).max(120),
  monthlyPayment: z.number().min(0),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  autoPayEnabled: z.boolean().default(false),
  paymentMethodId: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  status: PaymentPlanStatusEnum.default('PENDING'),
});

export const updatePaymentPlanSchema = z.object({
  monthlyPayment: z.number().min(0).optional(),
  autoPayEnabled: z.boolean().optional(),
  paymentMethodId: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  status: PaymentPlanStatusEnum.optional(),
});

export const paymentPlanQuerySchema = z.object({
  search: z.string().optional(),
  accountId: z.string().optional(),
  status: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    PaymentPlanStatusEnum.optional()
  ),
  autoPayEnabled: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'startDate', 'totalAmount', 'remainingBalance', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const pausePaymentPlanSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500),
});

export const cancelPaymentPlanSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required').max(500),
});

// -----------------------------------------------------------------------------
// Statement Schemas
// -----------------------------------------------------------------------------

export const generateStatementSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  statementDate: z.coerce.date().optional(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  dueDate: z.coerce.date(),
  deliveryMethod: StatementDeliveryMethodEnum.default('EMAIL'),
});

export const sendStatementSchema = z.object({
  deliveryMethod: StatementDeliveryMethodEnum,
  emailAddress: z.string().email().optional(),
});

export const statementQuerySchema = z.object({
  accountId: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  deliveryMethod: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    StatementDeliveryMethodEnum.optional()
  ),
  sent: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  viewed: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['statementDate', 'createdAt', 'amountDue']).default('statementDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// -----------------------------------------------------------------------------
// Credit Balance Schemas
// -----------------------------------------------------------------------------

export const createCreditBalanceSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  amount: z.number().min(0.01, 'Amount must be positive'),
  source: CreditSourceEnum,
  description: z.string().max(500).optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
});

export const applyCreditSchema = z.object({
  creditId: z.string().min(1, 'Credit is required'),
  invoiceId: z.string().min(1, 'Invoice is required'),
  amount: z.number().min(0.01, 'Amount must be positive'),
});

export const transferCreditSchema = z.object({
  creditId: z.string().min(1, 'Credit is required'),
  toAccountId: z.string().min(1, 'Destination account is required'),
  amount: z.number().min(0.01, 'Amount must be positive'),
});

export const creditBalanceQuerySchema = z.object({
  accountId: z.string().optional(),
  status: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    CreditStatusEnum.optional()
  ),
  source: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    CreditSourceEnum.optional()
  ),
  expiringBefore: z.coerce.date().optional(),
  minAmount: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'amount', 'expiresAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// -----------------------------------------------------------------------------
// Treatment Estimate Schemas
// -----------------------------------------------------------------------------

export const estimateScenarioSchema = z.object({
  name: z.string().min(1, 'Scenario name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  totalCost: z.number().min(0),
  insuranceEstimate: z.number().min(0).default(0),
  patientEstimate: z.number().min(0),
  procedures: z.array(z.object({
    code: z.string(),
    description: z.string(),
    fee: z.number(),
    insuranceCoverage: z.number().optional(),
    patientPortion: z.number().optional(),
  })).optional(),
  isRecommended: z.boolean().default(false),
  isSelected: z.boolean().default(false),
});

export const createTreatmentEstimateSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  patientId: z.string().min(1, 'Patient is required'),
  treatmentPlanId: z.string().optional().nullable(),
  validUntil: z.coerce.date(),
  totalCost: z.number().min(0),
  insuranceEstimate: z.number().min(0).default(0),
  patientEstimate: z.number().min(0),
  downPayment: z.number().min(0).default(0),
  scenarios: z.array(estimateScenarioSchema).optional(),
  notes: z.string().max(2000).optional().nullable(),
  status: EstimateStatusEnum.default('DRAFT'),
});

export const updateTreatmentEstimateSchema = z.object({
  validUntil: z.coerce.date().optional(),
  totalCost: z.number().min(0).optional(),
  insuranceEstimate: z.number().min(0).optional(),
  patientEstimate: z.number().min(0).optional(),
  downPayment: z.number().min(0).optional(),
  documentUrl: z.string().url().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  status: EstimateStatusEnum.optional(),
  scenarios: z.array(estimateScenarioSchema).optional(),
});

export const treatmentEstimateQuerySchema = z.object({
  search: z.string().optional(),
  accountId: z.string().optional(),
  patientId: z.string().optional(),
  treatmentPlanId: z.string().optional(),
  status: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    EstimateStatusEnum.optional()
  ),
  expired: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'estimateNumber', 'status', 'validUntil']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const presentEstimateSchema = z.object({
  action: z.literal('present'),
  presentedBy: z.string().min(1, 'Presenter is required'),
});

export const acceptEstimateSchema = z.object({
  action: z.literal('accept'),
  selectedScenarioId: z.string().optional(),
});

export const declineEstimateSchema = z.object({
  action: z.literal('decline'),
  declineReason: z.string().max(500).optional(),
});

// -----------------------------------------------------------------------------
// Payment Schemas
// -----------------------------------------------------------------------------

export const createPaymentSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  patientId: z.string().min(1, 'Patient is required'),
  amount: z.number().min(0.01, 'Amount must be positive'),
  paymentDate: z.coerce.date(),
  paymentType: PaymentTypeEnum.default('PATIENT'),
  paymentMethodType: PaymentMethodTypeEnum,
  sourceType: PaymentSourceTypeEnum.default('MANUAL'),
  gateway: PaymentGatewayEnum.default('MANUAL'),
  description: z.string().max(500).optional().nullable(),

  // For card payments
  cardBrand: z.string().optional().nullable(),
  cardLast4: z.string().optional().nullable(),

  // For check payments
  checkNumber: z.string().max(50).optional().nullable(),

  // Allocation
  invoiceId: z.string().optional().nullable(),

  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const processCardPaymentSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  patientId: z.string().min(1, 'Patient is required'),
  amount: z.number().min(0.01, 'Amount must be positive'),
  paymentMethodId: z.string().optional().nullable(),
  savePaymentMethod: z.boolean().default(false),
  cardToken: z.string().optional(),
  invoiceId: z.string().optional().nullable(),
});

export const allocatePaymentSchema = z.object({
  allocations: z.array(z.object({
    invoiceId: z.string().min(1),
    amount: z.number().min(0.01),
  })).min(1, 'At least one allocation is required'),
});

export const paymentQuerySchema = z.object({
  search: z.string().optional(),
  accountId: z.string().optional(),
  patientId: z.string().optional(),
  invoiceId: z.string().optional(),
  status: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    PaymentStatusEnum.optional()
  ),
  paymentType: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    PaymentTypeEnum.optional()
  ),
  paymentMethodType: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    PaymentMethodTypeEnum.optional()
  ),
  sourceType: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    PaymentSourceTypeEnum.optional()
  ),
  gateway: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    PaymentGatewayEnum.optional()
  ),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['paymentDate', 'createdAt', 'amount', 'paymentNumber', 'status']).default('paymentDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// -----------------------------------------------------------------------------
// Payment Method Schemas
// -----------------------------------------------------------------------------

export const createPaymentMethodSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  type: PaymentMethodTypeEnum,
  gateway: PaymentGatewayEnum,
  gatewayCustomerId: z.string().optional().nullable(),
  gatewayMethodId: z.string().optional().nullable(),

  // Card details
  cardBrand: z.string().max(50).optional().nullable(),
  cardLast4: z.string().max(4).optional().nullable(),
  cardExpMonth: z.number().int().min(1).max(12).optional().nullable(),
  cardExpYear: z.number().int().min(2024).max(2100).optional().nullable(),

  // Bank account details
  bankName: z.string().max(100).optional().nullable(),
  bankLast4: z.string().max(4).optional().nullable(),
  bankAccountType: BankAccountTypeEnum.optional().nullable(),

  // Billing address
  billingName: z.string().max(200).optional().nullable(),
  billingStreet: z.string().max(500).optional().nullable(),
  billingCity: z.string().max(100).optional().nullable(),
  billingState: z.string().max(50).optional().nullable(),
  billingZip: z.string().max(20).optional().nullable(),
  billingCountry: z.string().max(50).default('CA'),
});

export const paymentMethodQuerySchema = z.object({
  patientId: z.string().optional(),
  type: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    PaymentMethodTypeEnum.optional()
  ),
  gateway: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    PaymentGatewayEnum.optional()
  ),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'type']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// -----------------------------------------------------------------------------
// Refund Schemas
// -----------------------------------------------------------------------------

export const createRefundSchema = z.object({
  paymentId: z.string().min(1, 'Payment is required'),
  amount: z.number().min(0.01, 'Amount must be positive'),
  reason: RefundReasonEnum,
  reasonDetails: z.string().max(1000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const refundQuerySchema = z.object({
  paymentId: z.string().optional(),
  accountId: z.string().optional(),
  status: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    RefundStatusEnum.optional()
  ),
  reason: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    RefundReasonEnum.optional()
  ),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'amount', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// -----------------------------------------------------------------------------
// Payment Link Schemas
// -----------------------------------------------------------------------------

export const createPaymentLinkSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  patientId: z.string().optional(),
  amount: z.number().min(0.01, 'Amount must be positive'),
  description: z.string().max(500).optional().nullable(),
  invoiceId: z.string().optional().nullable(),
  invoiceIds: z.array(z.string()).optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  allowPartial: z.boolean().default(false),
  minimumAmount: z.number().min(0.01).optional().nullable(),
});

export const paymentLinkQuerySchema = z.object({
  accountId: z.string().optional(),
  patientId: z.string().optional(),
  status: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    PaymentLinkStatusEnum.optional()
  ),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'expiresAt', 'amount', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// -----------------------------------------------------------------------------
// Scheduled Payment Schemas
// -----------------------------------------------------------------------------

export const schedulePaymentSchema = z.object({
  paymentPlanId: z.string().min(1, 'Payment plan is required'),
  scheduledDate: z.coerce.date(),
  amount: z.number().min(0.01, 'Amount must be positive'),
});

export const scheduledPaymentQuerySchema = z.object({
  paymentPlanId: z.string().optional(),
  accountId: z.string().optional(),
  status: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    ScheduledPaymentStatusEnum.optional()
  ),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  upcoming: z.preprocess(
    (val) => (val === '' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['scheduledDate', 'amount', 'status']).default('scheduledDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// -----------------------------------------------------------------------------
// Receipt Schemas
// -----------------------------------------------------------------------------

export const generateReceiptSchema = z.object({
  paymentId: z.string().min(1, 'Payment is required'),
  deliveryMethod: StatementDeliveryMethodEnum.optional(),
  emailAddress: z.string().email().optional(),
});

export const receiptQuerySchema = z.object({
  paymentId: z.string().optional(),
  accountId: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  sent: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'receiptNumber']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// -----------------------------------------------------------------------------
// Settlement Schemas
// -----------------------------------------------------------------------------

export const settlementQuerySchema = z.object({
  gateway: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    PaymentGatewayEnum.optional()
  ),
  status: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    SettlementStatusEnum.optional()
  ),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  hasDiscrepancy: z.preprocess(
    (val) => (val === '' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['settlementDate', 'depositDate', 'netAmount', 'status']).default('settlementDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// -----------------------------------------------------------------------------
// Aging Report Schemas
// -----------------------------------------------------------------------------

export const agingReportQuerySchema = z.object({
  accountId: z.string().optional(),
  asOfDate: z.coerce.date().optional(),
  includeZeroBalance: z.boolean().default(false),
  groupBy: z.enum(['account', 'patient']).default('account'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  sortBy: z.enum(['currentBalance', 'aging30', 'aging60', 'aging90', 'aging120Plus']).default('currentBalance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// -----------------------------------------------------------------------------
// Type Exports
// -----------------------------------------------------------------------------

export type CreatePatientAccountInput = z.infer<typeof createPatientAccountSchema>;
export type UpdatePatientAccountInput = z.infer<typeof updatePatientAccountSchema>;
export type PatientAccountQuery = z.infer<typeof patientAccountQuerySchema>;

export type CreateFamilyGroupInput = z.infer<typeof createFamilyGroupSchema>;
export type UpdateFamilyGroupInput = z.infer<typeof updateFamilyGroupSchema>;
export type FamilyGroupQuery = z.infer<typeof familyGroupQuerySchema>;

export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type InvoiceQuery = z.infer<typeof invoiceQuerySchema>;

export type CreatePaymentPlanInput = z.infer<typeof createPaymentPlanSchema>;
export type UpdatePaymentPlanInput = z.infer<typeof updatePaymentPlanSchema>;
export type PaymentPlanQuery = z.infer<typeof paymentPlanQuerySchema>;

export type GenerateStatementInput = z.infer<typeof generateStatementSchema>;
export type StatementQuery = z.infer<typeof statementQuerySchema>;

export type CreateCreditBalanceInput = z.infer<typeof createCreditBalanceSchema>;
export type ApplyCreditInput = z.infer<typeof applyCreditSchema>;
export type TransferCreditInput = z.infer<typeof transferCreditSchema>;
export type CreditBalanceQuery = z.infer<typeof creditBalanceQuerySchema>;

export type EstimateScenarioInput = z.infer<typeof estimateScenarioSchema>;
export type CreateTreatmentEstimateInput = z.infer<typeof createTreatmentEstimateSchema>;
export type UpdateTreatmentEstimateInput = z.infer<typeof updateTreatmentEstimateSchema>;
export type TreatmentEstimateQuery = z.infer<typeof treatmentEstimateQuerySchema>;

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type ProcessCardPaymentInput = z.infer<typeof processCardPaymentSchema>;
export type AllocatePaymentInput = z.infer<typeof allocatePaymentSchema>;
export type PaymentQuery = z.infer<typeof paymentQuerySchema>;

export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>;
export type PaymentMethodQuery = z.infer<typeof paymentMethodQuerySchema>;

export type CreateRefundInput = z.infer<typeof createRefundSchema>;
export type RefundQuery = z.infer<typeof refundQuerySchema>;

export type CreatePaymentLinkInput = z.infer<typeof createPaymentLinkSchema>;
export type PaymentLinkQuery = z.infer<typeof paymentLinkQuerySchema>;

export type SchedulePaymentInput = z.infer<typeof schedulePaymentSchema>;
export type ScheduledPaymentQuery = z.infer<typeof scheduledPaymentQuerySchema>;

export type GenerateReceiptInput = z.infer<typeof generateReceiptSchema>;
export type ReceiptQuery = z.infer<typeof receiptQuerySchema>;

export type SettlementQuery = z.infer<typeof settlementQuerySchema>;

export type AgingReportQuery = z.infer<typeof agingReportQuerySchema>;
