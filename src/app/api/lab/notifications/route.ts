import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { z } from 'zod';
import { LabOrderStatus } from '@prisma/client';

/**
 * Patient notification schema for lab order status updates
 */
const sendNotificationSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  notificationType: z.enum([
    'ORDER_SUBMITTED',
    'ORDER_IN_PROGRESS',
    'ORDER_SHIPPED',
    'ORDER_READY_FOR_PICKUP',
    'ORDER_DELIVERED',
    'APPOINTMENT_REMINDER',
    'CUSTOM',
  ]),
  channel: z.enum(['EMAIL', 'SMS', 'BOTH']).optional().default('EMAIL'),
  customMessage: z.string().max(1000).optional().nullable(),
  scheduledFor: z.coerce.date().optional().nullable(),
});

const notificationQuerySchema = z.object({
  orderId: z.string().optional(),
  patientId: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * GET /api/lab/notifications
 * List lab-related patient notifications based on status changes
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);
    const clinicFilter = getClinicFilter(session);

    const queryResult = notificationQuerySchema.safeParse(
      Object.fromEntries(searchParams)
    );

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

    const { orderId, patientId, page, pageSize } = queryResult.data;

    // Get order IDs for the clinic/patient
    const orderIds = orderId
      ? [orderId]
      : await db.labOrder
          .findMany({
            where: withSoftDelete({
              ...clinicFilter,
              ...(patientId && { patientId }),
            }),
            select: { id: true },
          })
          .then((orders) => orders.map((o) => o.id));

    // Query status logs that represent notification-worthy events
    // These are statuses that typically trigger patient notifications
    const notifiableStatuses: LabOrderStatus[] = [
      LabOrderStatus.SUBMITTED,
      LabOrderStatus.IN_PROGRESS,
      LabOrderStatus.SHIPPED,
      LabOrderStatus.DELIVERED,
      LabOrderStatus.PATIENT_PICKUP,
      LabOrderStatus.PICKED_UP,
    ];

    const statusLogs = await db.labOrderStatusLog.findMany({
      where: {
        orderId: { in: orderIds },
        toStatus: { in: notifiableStatuses },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
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
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const total = await db.labOrderStatusLog.count({
      where: {
        orderId: { in: orderIds },
        toStatus: { in: notifiableStatuses },
      },
    });

    // Transform to notification format
    const formattedNotifications = statusLogs.map((log) => ({
      id: log.id,
      orderId: log.orderId,
      orderNumber: log.order?.orderNumber,
      patient: log.order?.patient,
      type: getNotificationType(log.toStatus),
      status: 'SENT',
      sentAt: log.createdAt,
      channel: 'EMAIL',
      message: log.notes || `Order status changed to ${log.toStatus}`,
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: formattedNotifications,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['lab:view'] }
);

/**
 * POST /api/lab/notifications
 * Send a notification to patient about their lab order
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();
    const clinicFilter = getClinicFilter(session);

    // Validate input
    const result = sendNotificationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid notification data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Get the order with patient info
    const order = await db.labOrder.findFirst({
      where: withSoftDelete({
        id: data.orderId,
        ...clinicFilter,
      }),
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        vendor: {
          select: { name: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Lab order not found',
          },
        },
        { status: 404 }
      );
    }

    // Build notification message
    const message = data.customMessage || buildNotificationMessage(data.notificationType, order);

    // Check if patient has contact info for the chosen channel
    const canSendEmail = order.patient?.email;
    const canSendSms = order.patient?.phone;
    const channels = data.channel === 'BOTH'
      ? ['EMAIL', 'SMS'].filter((c) => c === 'EMAIL' ? canSendEmail : canSendSms)
      : [data.channel];

    if (channels.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_CONTACT_INFO',
            message: `Patient does not have ${data.channel.toLowerCase()} contact information`,
          },
        },
        { status: 400 }
      );
    }

    // Record the notification event as a status log entry
    // In production, this would also queue the actual notification delivery
    const statusLog = await db.labOrderStatusLog.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: order.status,
        source: 'USER',
        notes: `Patient notification sent (${data.notificationType}): ${message.substring(0, 200)}`,
        changedBy: session.user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          notificationId: statusLog.id,
          orderId: order.id,
          orderNumber: order.orderNumber,
          patient: {
            id: order.patient?.id,
            name: `${order.patient?.firstName} ${order.patient?.lastName}`,
          },
          channels,
          message,
          status: data.scheduledFor ? 'SCHEDULED' : 'QUEUED',
          scheduledFor: data.scheduledFor,
        },
      },
      { status: 201 }
    );
  },
  { permissions: ['lab:track'] }
);

/**
 * Helper to map status to notification type
 */
function getNotificationType(status: LabOrderStatus): string {
  const mapping: Record<string, string> = {
    SUBMITTED: 'ORDER_SUBMITTED',
    IN_PROGRESS: 'ORDER_IN_PROGRESS',
    SHIPPED: 'ORDER_SHIPPED',
    DELIVERED: 'ORDER_DELIVERED',
    PATIENT_PICKUP: 'ORDER_READY_FOR_PICKUP',
    PICKED_UP: 'ORDER_PICKED_UP',
  };
  return mapping[status] || 'STATUS_UPDATE';
}

/**
 * Build notification message based on type
 */
function buildNotificationMessage(
  type: string,
  order: {
    orderNumber: string;
    vendor?: { name: string } | null;
    neededByDate?: Date | null;
  }
): string {
  const messages: Record<string, string> = {
    ORDER_SUBMITTED: `Your orthodontic appliance order (${order.orderNumber}) has been submitted to ${order.vendor?.name || 'the lab'}. We'll notify you when it's ready.`,
    ORDER_IN_PROGRESS: `Great news! Work has started on your orthodontic appliance (Order ${order.orderNumber}).`,
    ORDER_SHIPPED: `Your order (${order.orderNumber}) has been shipped and is on its way to our clinic.`,
    ORDER_READY_FOR_PICKUP: `Your orthodontic appliance (Order ${order.orderNumber}) is ready for pickup at the clinic. Please call to schedule an appointment.`,
    ORDER_DELIVERED: `Your order (${order.orderNumber}) has arrived at the clinic. We'll contact you soon to schedule your fitting appointment.`,
    APPOINTMENT_REMINDER: `Reminder: Your appointment to receive your orthodontic appliance (Order ${order.orderNumber}) is coming up. Please confirm your attendance.`,
    CUSTOM: '',
  };
  return messages[type] || `Update on your order ${order.orderNumber}`;
}
