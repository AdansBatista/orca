/**
 * Billing seeder - Seeds billing data for ALL clinics
 *
 * Seeds the Patient Billing sub-area including:
 * - Patient accounts
 * - Invoices with line items
 * - Payment plans with scheduled payments
 * - Treatment estimates
 * - Statements
 *
 * @see docs/areas/billing-insurance/sub-areas/patient-billing/README.md
 */

import { addDays, subDays, addMonths } from 'date-fns';
import {
  PaymentPlanStatus,
  EstimateStatus,
  StatementDeliveryMethod,
} from '@prisma/client';
import type { SeedContext } from '../types';
import { withSoftDelete } from '../utils/soft-delete';
import {
  getRandomProcedures,
  pickRandomInvoiceStatus,
  getRandomPaymentPlanTemplate,
  calculateDueDate,
  calculatePlanEndDate,
  generateAccountNumber,
  generateInvoiceNumber,
  generatePlanNumber,
  generateEstimateNumber,
  generateStatementNumber,
} from '../fixtures/billing.fixture';

// Number of records to create per clinic
const ACCOUNTS_PER_CLINIC = 15;
const INVOICES_PER_CLINIC = 20;
const PAYMENT_PLANS_PER_CLINIC = 5;
const ESTIMATES_PER_CLINIC = 8;
const STATEMENTS_PER_CLINIC = 10;

/**
 * Seed billing data for ALL clinics.
 */
export async function seedBilling(ctx: SeedContext): Promise<void> {
  const { db, idTracker, logger } = ctx;
  const clinicIds = idTracker.getAll('Clinic');

  logger.startArea('Billing');

  if (clinicIds.length === 0) {
    logger.warn('No clinics found, skipping billing seeding');
    logger.endArea('Billing', 0);
    return;
  }

  let totalCreated = 0;

  for (let clinicIndex = 0; clinicIndex < clinicIds.length; clinicIndex++) {
    const clinicId = clinicIds[clinicIndex];
    const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
    logger.info(`Seeding billing for clinic ${clinicIndex + 1}/${clinicIds.length}: ${clinic?.name || clinicId}`);

    // Get admin user for createdBy
    const adminUser = await db.user.findFirst({
      where: { clinicId, role: { in: ['clinic_admin', 'super_admin', 'billing'] } },
    });

    // Get patients for this clinic
    const patients = await db.patient.findMany({
      where: withSoftDelete({ clinicId }),
      take: ACCOUNTS_PER_CLINIC,
    });

    if (patients.length === 0) {
      logger.warn(`  No patients found for clinic ${clinicId}, skipping`);
      continue;
    }

    // Seed Patient Accounts
    const accountCount = await seedPatientAccounts(ctx, clinicId, clinicIndex, patients, adminUser?.id);
    totalCreated += accountCount;

    // Get created accounts
    const accounts = await db.patientAccount.findMany({
      where: withSoftDelete({ clinicId }),
      include: { patient: true },
    });

    // Seed Invoices
    const invoiceCount = await seedInvoices(ctx, clinicId, clinicIndex, accounts, adminUser?.id);
    totalCreated += invoiceCount;

    // Seed Payment Plans
    const planCount = await seedPaymentPlans(ctx, clinicId, clinicIndex, accounts, adminUser?.id);
    totalCreated += planCount;

    // Seed Treatment Estimates
    const estimateCount = await seedEstimates(ctx, clinicId, clinicIndex, accounts, adminUser?.id);
    totalCreated += estimateCount;

    // Seed Statements
    const statementCount = await seedStatements(ctx, clinicId, clinicIndex, accounts, adminUser?.id);
    totalCreated += statementCount;
  }

  logger.success(`Total billing records created: ${totalCreated} across ${clinicIds.length} clinics`);
  logger.endArea('Billing', totalCreated);
}

/**
 * Seed patient accounts
 */
async function seedPatientAccounts(
  ctx: SeedContext,
  clinicId: string,
  clinicIndex: number,
  patients: Array<{ id: string; firstName: string; lastName: string }>,
  createdBy?: string
): Promise<number> {
  const { db, idTracker, logger } = ctx;
  let created = 0;

  for (let i = 0; i < patients.length; i++) {
    const patient = patients[i];

    // Check if account already exists
    const existing = await db.patientAccount.findFirst({
      where: withSoftDelete({ clinicId, patientId: patient.id }),
    });

    if (!existing) {
      const account = await db.patientAccount.create({
        data: {
          clinicId,
          patientId: patient.id,
          accountNumber: generateAccountNumber(clinicIndex, i),
          accountType: 'INDIVIDUAL',
          currentBalance: 0,
          insuranceBalance: 0,
          patientBalance: 0,
          creditBalance: 0,
          aging30: 0,
          aging60: 0,
          aging90: 0,
          aging120Plus: 0,
          status: 'ACTIVE',
          createdBy,
          deletedAt: null,
        },
      });
      idTracker.add('PatientAccount', account.id, clinicId);
      created++;
    } else {
      idTracker.add('PatientAccount', existing.id, clinicId);
    }
  }

  logger.info(`  Created ${created} patient accounts`);
  return created;
}

/**
 * Seed invoices with line items
 */
async function seedInvoices(
  ctx: SeedContext,
  clinicId: string,
  clinicIndex: number,
  accounts: Array<{ id: string; patientId: string }>,
  createdBy?: string
): Promise<number> {
  const { db, idTracker, logger } = ctx;
  let created = 0;

  const invoiceCount = Math.min(INVOICES_PER_CLINIC, accounts.length * 2);

  for (let i = 0; i < invoiceCount; i++) {
    const account = accounts[i % accounts.length];
    const status = pickRandomInvoiceStatus();
    const invoiceDate = subDays(new Date(), Math.floor(Math.random() * 90));
    const dueDate = calculateDueDate(invoiceDate, status);
    const procedures = getRandomProcedures(Math.floor(Math.random() * 3) + 1);

    // Calculate totals
    let subtotal = 0;
    const items = procedures.map((proc) => {
      const quantity = 1;
      const lineTotal = proc.unitPrice * quantity;
      const insuranceAmount = Math.random() > 0.5 ? Math.round(lineTotal * 0.5) : 0;
      const patientAmount = lineTotal - insuranceAmount;
      subtotal += lineTotal;

      return {
        procedureCode: proc.procedureCode,
        description: proc.description,
        quantity,
        unitPrice: proc.unitPrice,
        discount: 0,
        total: lineTotal,
        insuranceAmount,
        patientAmount,
        toothNumbers: [],
      };
    });

    const insuranceAmount = items.reduce((sum, item) => sum + (item.insuranceAmount || 0), 0);
    const patientAmount = subtotal - insuranceAmount;

    // Calculate paid amount based on status
    let paidAmount = 0;
    if (status === 'PAID') {
      paidAmount = patientAmount;
    } else if (status === 'PARTIAL') {
      paidAmount = Math.round(patientAmount * (0.3 + Math.random() * 0.4));
    }

    const balance = patientAmount - paidAmount;

    const invoice = await db.invoice.create({
      data: {
        clinicId,
        accountId: account.id,
        patientId: account.patientId,
        invoiceNumber: generateInvoiceNumber(clinicIndex, i),
        invoiceDate,
        dueDate,
        subtotal,
        adjustments: 0,
        insuranceAmount,
        patientAmount,
        paidAmount,
        balance,
        status,
        createdBy,
        updatedBy: createdBy,
        deletedAt: null,
        items: {
          create: items,
        },
      },
    });

    idTracker.add('Invoice', invoice.id, clinicId);
    created++;
  }

  // Update account balances
  for (const account of accounts) {
    await updateAccountBalance(db, account.id, clinicId, createdBy);
  }

  logger.info(`  Created ${created} invoices`);
  return created;
}

/**
 * Seed payment plans
 */
async function seedPaymentPlans(
  ctx: SeedContext,
  clinicId: string,
  clinicIndex: number,
  accounts: Array<{ id: string; patientId: string }>,
  createdBy?: string
): Promise<number> {
  const { db, idTracker, logger } = ctx;
  let created = 0;

  const planCount = Math.min(PAYMENT_PLANS_PER_CLINIC, accounts.length);
  const shuffledAccounts = [...accounts].sort(() => Math.random() - 0.5);

  for (let i = 0; i < planCount; i++) {
    const account = shuffledAccounts[i];
    const template = getRandomPaymentPlanTemplate();

    const downPayment = Math.round(template.totalAmount * template.downPaymentPercent / 100);
    const financedAmount = template.totalAmount - downPayment;
    const monthlyPayment = Math.round((financedAmount / template.numberOfPayments) * 100) / 100;

    const startDate = subDays(new Date(), Math.floor(Math.random() * 60));
    const endDate = calculatePlanEndDate(startDate, template.numberOfPayments);

    // Determine plan status and completed payments
    const statuses: PaymentPlanStatus[] = [
      PaymentPlanStatus.ACTIVE,
      PaymentPlanStatus.ACTIVE,
      PaymentPlanStatus.ACTIVE,
      PaymentPlanStatus.PENDING,
      PaymentPlanStatus.COMPLETED,
      PaymentPlanStatus.PAUSED,
    ];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    let completedPayments = 0;
    if (status === PaymentPlanStatus.COMPLETED) {
      completedPayments = template.numberOfPayments;
    } else if (status === PaymentPlanStatus.ACTIVE) {
      completedPayments = Math.floor(Math.random() * (template.numberOfPayments / 2));
    }

    const remainingBalance = financedAmount - (completedPayments * monthlyPayment);

    const plan = await db.paymentPlan.create({
      data: {
        clinicId,
        accountId: account.id,
        planNumber: generatePlanNumber(clinicIndex, i),
        totalAmount: template.totalAmount,
        downPayment,
        financedAmount,
        numberOfPayments: template.numberOfPayments,
        monthlyPayment,
        completedPayments,
        remainingBalance: Math.max(0, remainingBalance),
        startDate,
        endDate,
        nextPaymentDate: status === PaymentPlanStatus.ACTIVE ? addMonths(startDate, completedPayments + 1) : null,
        autoPayEnabled: Math.random() > 0.5,
        notes: template.description,
        status,
        createdBy,
        updatedBy: createdBy,
        deletedAt: null,
      },
    });

    idTracker.add('PaymentPlan', plan.id, clinicId);
    created++;

    // Create scheduled payments
    for (let j = 0; j < template.numberOfPayments; j++) {
      const scheduledDate = addMonths(startDate, j + 1);
      const paymentStatus = j < completedPayments ? 'COMPLETED' : 'PENDING';

      await db.scheduledPayment.create({
        data: {
          clinicId,
          paymentPlanId: plan.id,
          scheduledDate,
          amount: monthlyPayment,
          status: paymentStatus,
          processedAt: paymentStatus === 'COMPLETED' ? scheduledDate : null,
        },
      });
    }
  }

  logger.info(`  Created ${created} payment plans`);
  return created;
}

/**
 * Seed treatment estimates
 */
async function seedEstimates(
  ctx: SeedContext,
  clinicId: string,
  clinicIndex: number,
  accounts: Array<{ id: string; patientId: string }>,
  createdBy?: string
): Promise<number> {
  const { db, idTracker, logger } = ctx;
  let created = 0;

  const estimateCount = Math.min(ESTIMATES_PER_CLINIC, accounts.length);
  const shuffledAccounts = [...accounts].sort(() => Math.random() - 0.5);

  const treatmentDescriptions = [
    'Comprehensive orthodontic treatment with metal braces',
    'Clear aligner therapy - full treatment',
    'Limited orthodontic treatment - upper arch only',
    'Interceptive orthodontic treatment',
    'Adult comprehensive treatment with ceramic braces',
    'Invisalign comprehensive treatment',
    'Phase I orthodontic treatment',
    'Retention and monitoring',
  ];

  for (let i = 0; i < estimateCount; i++) {
    const account = shuffledAccounts[i];
    const totalCost = 3500 + Math.floor(Math.random() * 4000);
    const insuranceEstimate = Math.random() > 0.3 ? Math.round(totalCost * (0.3 + Math.random() * 0.3)) : 0;
    const patientEstimate = totalCost - insuranceEstimate;

    const estimateDate = subDays(new Date(), Math.floor(Math.random() * 30));
    const expirationDate = addDays(estimateDate, 60);

    const statuses: EstimateStatus[] = [
      EstimateStatus.DRAFT,
      EstimateStatus.PRESENTED,
      EstimateStatus.PRESENTED,
      EstimateStatus.ACCEPTED,
      EstimateStatus.DECLINED,
      EstimateStatus.EXPIRED,
    ];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const estimate = await db.treatmentEstimate.create({
      data: {
        clinicId,
        accountId: account.id,
        patientId: account.patientId,
        estimateNumber: generateEstimateNumber(clinicIndex, i),
        estimateDate,
        validUntil: expirationDate,
        notes: treatmentDescriptions[i % treatmentDescriptions.length],
        totalCost: totalCost,
        insuranceEstimate,
        patientEstimate,
        status,
        presentedAt: status !== EstimateStatus.DRAFT ? addDays(estimateDate, 1) : null,
        acceptedAt: status === EstimateStatus.ACCEPTED ? addDays(estimateDate, 7) : null,
        declinedAt: status === EstimateStatus.DECLINED ? addDays(estimateDate, 5) : null,
      },
    });

    idTracker.add('TreatmentEstimate', estimate.id, clinicId);
    created++;
  }

  logger.info(`  Created ${created} treatment estimates`);
  return created;
}

/**
 * Seed statements
 */
async function seedStatements(
  ctx: SeedContext,
  clinicId: string,
  clinicIndex: number,
  accounts: Array<{ id: string; patientId: string }>,
  createdBy?: string
): Promise<number> {
  const { db, idTracker, logger } = ctx;
  let created = 0;

  const statementCount = Math.min(STATEMENTS_PER_CLINIC, accounts.length);
  const shuffledAccounts = [...accounts].sort(() => Math.random() - 0.5);

  for (let i = 0; i < statementCount; i++) {
    const account = shuffledAccounts[i];

    // Calculate period (monthly statements)
    const periodEnd = subDays(new Date(), Math.floor(Math.random() * 30));
    const periodStart = subDays(periodEnd, 30);
    const statementDate = addDays(periodEnd, 1);
    const dueDate = addDays(statementDate, 30);

    // Generate realistic amounts
    const previousBalance = Math.floor(Math.random() * 2000);
    const newCharges = Math.floor(Math.random() * 500);
    const payments = Math.floor(Math.random() * (previousBalance / 2));
    const adjustments = Math.random() > 0.8 ? Math.floor(Math.random() * 50) : 0;
    const currentBalance = previousBalance + newCharges - payments - adjustments;
    const amountDue = Math.max(0, currentBalance);

    // Pick a random delivery method to determine sent/viewed status
    const deliveryMethods: StatementDeliveryMethod[] = [
      StatementDeliveryMethod.EMAIL,
      StatementDeliveryMethod.EMAIL,
      StatementDeliveryMethod.PORTAL,
      StatementDeliveryMethod.PRINT,
    ];
    const deliveryMethod = deliveryMethods[Math.floor(Math.random() * deliveryMethods.length)];

    // Randomly determine if statement was sent/viewed
    const wasSent = Math.random() > 0.3;
    const wasViewed = wasSent && Math.random() > 0.5;

    const statement = await db.statement.create({
      data: {
        clinicId,
        accountId: account.id,
        statementNumber: generateStatementNumber(clinicIndex, i),
        statementDate,
        periodStart,
        periodEnd,
        previousBalance,
        newCharges,
        payments,
        adjustments,
        currentBalance,
        amountDue,
        dueDate,
        deliveryMethod,
        sentAt: wasSent ? addDays(statementDate, 1) : null,
        viewedAt: wasViewed ? addDays(statementDate, 3) : null,
        createdBy,
      },
    });

    idTracker.add('Statement', statement.id, clinicId);
    created++;
  }

  logger.info(`  Created ${created} statements`);
  return created;
}

/**
 * Update account balance from invoices
 */
async function updateAccountBalance(
  db: SeedContext['db'],
  accountId: string,
  clinicId: string,
  userId?: string
): Promise<void> {
  const invoices = await db.invoice.findMany({
    where: {
      accountId,
      clinicId,
      status: { notIn: ['DRAFT', 'VOID'] },
      deletedAt: null,
    },
    select: {
      balance: true,
      insuranceAmount: true,
      patientAmount: true,
      dueDate: true,
    },
  });

  let currentBalance = 0;
  let insuranceBalance = 0;
  let patientBalance = 0;
  let aging30 = 0;
  let aging60 = 0;
  let aging90 = 0;
  let aging120Plus = 0;

  const now = new Date();

  for (const invoice of invoices) {
    currentBalance += invoice.balance;
    insuranceBalance += invoice.insuranceAmount;
    patientBalance += invoice.patientAmount;

    if (invoice.balance > 0 && invoice.dueDate) {
      const daysPastDue = Math.floor(
        (now.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysPastDue > 120) {
        aging120Plus += invoice.balance;
      } else if (daysPastDue > 90) {
        aging90 += invoice.balance;
      } else if (daysPastDue > 60) {
        aging60 += invoice.balance;
      } else if (daysPastDue > 30) {
        aging30 += invoice.balance;
      }
    }
  }

  await db.patientAccount.update({
    where: { id: accountId },
    data: {
      currentBalance: Math.round(currentBalance * 100) / 100,
      insuranceBalance: Math.round(insuranceBalance * 100) / 100,
      patientBalance: Math.round(patientBalance * 100) / 100,
      aging30: Math.round(aging30 * 100) / 100,
      aging60: Math.round(aging60 * 100) / 100,
      aging90: Math.round(aging90 * 100) / 100,
      aging120Plus: Math.round(aging120Plus * 100) / 100,
      updatedBy: userId,
    },
  });
}

/**
 * Clear billing data
 */
export async function clearBilling(ctx: SeedContext): Promise<void> {
  const { db, logger } = ctx;

  logger.info('Clearing billing data...');

  // Clear in dependency order (reverse of creation)
  await db.scheduledPayment.deleteMany({});
  await db.paymentPlan.deleteMany({});
  await db.invoiceItem.deleteMany({});
  await db.invoice.deleteMany({});
  await db.treatmentEstimate.deleteMany({});
  await db.statement.deleteMany({});
  await db.patientAccount.deleteMany({});

  logger.info('  Billing data cleared');
}
