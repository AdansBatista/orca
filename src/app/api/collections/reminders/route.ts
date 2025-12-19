import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  reminderQuerySchema,
  sendReminderSchema,
  batchSendRemindersSchema,
} from '@/lib/validations/collections';

/**
 * Calculate days overdue based on aging bucket amounts
 * Returns the highest aging bucket with a balance > 0
 */
function getDaysOverdueFromAging(aging30: number, aging60: number, aging90: number, aging120Plus: number): number {
  if (aging120Plus > 0) return 120;
  if (aging90 > 0) return 90;
  if (aging60 > 0) return 60;
  if (aging30 > 0) return 30;
  return 0;
}

/**
 * GET /api/collections/reminders
 * List sent reminders
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      accountId: searchParams.get('accountId') ?? undefined,
      reminderType: searchParams.get('reminderType') ?? undefined,
      channel: searchParams.get('channel') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      paymentReceived: searchParams.get('paymentReceived') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = reminderQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: queryResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const {
      accountId,
      reminderType,
      channel,
      fromDate,
      toDate,
      paymentReceived,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = getClinicFilter(session);

    if (accountId) where.accountId = accountId;
    if (reminderType) where.reminderType = reminderType;
    if (channel) where.channel = channel;
    if (paymentReceived !== undefined) where.paymentReceived = paymentReceived;

    if (fromDate || toDate) {
      where.sentAt = {};
      if (fromDate) (where.sentAt as Record<string, unknown>).gte = fromDate;
      if (toDate) (where.sentAt as Record<string, unknown>).lte = toDate;
    }

    // Get total count
    const total = await db.paymentReminder.count({ where });

    // Get paginated results
    const reminders = await db.paymentReminder.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Get account details
    const accountIds = [...new Set(reminders.map(r => r.accountId))];
    const accounts = await db.patientAccount.findMany({
      where: { id: { in: accountIds } },
      select: {
        id: true,
        accountNumber: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    const accountMap = new Map(accounts.map(a => [a.id, a]));

    const remindersWithAccounts = reminders.map(r => ({
      ...r,
      account: accountMap.get(r.accountId),
    }));

    // Get effectiveness stats
    const [totalSent, withPayment] = await Promise.all([
      db.paymentReminder.count({ where: getClinicFilter(session) }),
      db.paymentReminder.count({
        where: { ...getClinicFilter(session), paymentReceived: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: remindersWithAccounts,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        stats: {
          totalSent,
          withPayment,
          conversionRate: totalSent > 0 ? Math.round((withPayment / totalSent) * 100 * 10) / 10 : 0,
        },
      },
    });
  },
  { permissions: ['collections:read'] }
);

/**
 * POST /api/collections/reminders
 * Send a reminder (action: send or batch)
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'send';
    const body = await req.json();

    const { ipAddress, userAgent } = getRequestMeta(req);

    if (action === 'batch') {
      // Batch send reminders
      const result = batchSendRemindersSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid batch data',
              details: result.error.flatten(),
            },
          },
          { status: 400 }
        );
      }

      const data = result.data;

      // Find eligible accounts
      const where: Record<string, unknown> = withSoftDelete({
        clinicId: session.user.clinicId,
        currentBalance: { gt: 0 },
      });

      if (data.minBalance) {
        where.currentBalance = { gte: data.minBalance };
      }

      const accounts = await db.patientAccount.findMany({
        where,
        select: {
          id: true,
          accountNumber: true,
          currentBalance: true,
          aging30: true,
          aging60: true,
          aging90: true,
          aging120Plus: true,
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
        take: data.maxAccountsToSend,
      });

      // Filter by days overdue
      const eligibleAccounts = accounts.filter(account => {
        const daysOverdue = getDaysOverdueFromAging(
          account.aging30,
          account.aging60,
          account.aging90,
          account.aging120Plus
        );

        if (data.minDaysOverdue && daysOverdue < data.minDaysOverdue) return false;
        if (data.maxDaysOverdue && daysOverdue > data.maxDaysOverdue) return false;

        // Check channel availability
        if (data.channel === 'EMAIL' && !account.patient.email) return false;
        if (data.channel === 'SMS' && !account.patient.phone) return false;

        return true;
      });

      // Create reminders
      const remindersToCreate = eligibleAccounts.map(account => {
        const daysOverdue = getDaysOverdueFromAging(
          account.aging30,
          account.aging60,
          account.aging90,
          account.aging120Plus
        );
        const sentTo = data.channel === 'EMAIL'
          ? account.patient.email
          : account.patient.phone;

        return {
          clinicId: session.user.clinicId,
          accountId: account.id,
          reminderType: data.reminderType,
          templateId: data.templateId,
          daysOverdue,
          channel: data.channel,
          sentTo: sentTo || '',
          sentAt: new Date(),
          paymentReceived: false,
        };
      });

      if (remindersToCreate.length > 0) {
        await db.paymentReminder.createMany({
          data: remindersToCreate,
        });
      }

      await logAudit(session, {
        action: 'CREATE',
        entity: 'PaymentReminder',
        entityId: 'batch',
        details: {
          action: 'batch',
          reminderType: data.reminderType,
          channel: data.channel,
          count: remindersToCreate.length,
        },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        data: {
          sent: remindersToCreate.length,
          skipped: accounts.length - remindersToCreate.length,
        },
      });
    }

    // Single reminder
    const result = sendReminderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid reminder data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify account exists
    const account = await db.patientAccount.findFirst({
      where: withSoftDelete({
        id: data.accountId,
        clinicId: session.user.clinicId,
      }),
      select: {
        id: true,
        currentBalance: true,
        aging30: true,
        aging60: true,
        aging90: true,
        aging120Plus: true,
        patient: {
          select: {
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Patient account not found',
          },
        },
        { status: 404 }
      );
    }

    // Determine recipient
    let sentTo = '';
    if (data.channel === 'EMAIL') {
      sentTo = account.patient.email || '';
      if (!sentTo) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NO_EMAIL',
              message: 'Patient has no email address',
            },
          },
          { status: 400 }
        );
      }
    } else if (data.channel === 'SMS') {
      sentTo = account.patient.phone || '';
      if (!sentTo) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NO_PHONE',
              message: 'Patient has no phone number',
            },
          },
          { status: 400 }
        );
      }
    }

    const daysOverdue = getDaysOverdueFromAging(
      account.aging30,
      account.aging60,
      account.aging90,
      account.aging120Plus
    );

    // Create the reminder
    const reminder = await db.paymentReminder.create({
      data: {
        clinicId: session.user.clinicId,
        accountId: data.accountId,
        reminderType: data.reminderType,
        templateId: data.templateId,
        daysOverdue,
        channel: data.channel,
        sentTo,
        sentAt: new Date(),
        subject: data.subject,
        body: data.body,
        paymentLinkId: data.includePaymentLink ? undefined : null, // Would generate link if needed
        paymentReceived: false,
      },
    });

    // TODO: Actually send the reminder via email/SMS service
    // This would integrate with a notification service

    await logAudit(session, {
      action: 'CREATE',
      entity: 'PaymentReminder',
      entityId: reminder.id,
      details: {
        accountId: data.accountId,
        reminderType: data.reminderType,
        channel: data.channel,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: reminder },
      { status: 201 }
    );
  },
  { permissions: ['collections:manage'] }
);
