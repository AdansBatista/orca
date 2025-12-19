import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { LabOrderStatus, ShipmentStatus, RemakeStatus, LabContractStatus } from '@prisma/client';

/**
 * GET /api/lab/alerts
 * Get active alerts for lab orders
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const clinicFilter = getClinicFilter(session);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const threeDaysOut = new Date(today);
    threeDaysOut.setDate(threeDaysOut.getDate() + 3);

    // Statuses that indicate order is not yet complete
    const incompleteStatuses: LabOrderStatus[] = [
      LabOrderStatus.DRAFT,
      LabOrderStatus.SUBMITTED,
      LabOrderStatus.ACKNOWLEDGED,
      LabOrderStatus.IN_PROGRESS,
      LabOrderStatus.COMPLETED,
      LabOrderStatus.SHIPPED,
      LabOrderStatus.REMAKE_REQUESTED,
      LabOrderStatus.ON_HOLD,
    ];

    // Get orders that need attention
    const [overdueOrders, dueTodayOrders, approachingDueOrders, delayedShipments] = await Promise.all([
      // Overdue orders (neededByDate passed, not yet delivered)
      db.labOrder.findMany({
        where: withSoftDelete({
          ...clinicFilter,
          neededByDate: { lt: today },
          status: { in: incompleteStatuses },
        }),
        include: {
          patient: {
            select: { id: true, firstName: true, lastName: true },
          },
          vendor: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: { neededByDate: 'asc' },
        take: 50,
      }),

      // Due today
      db.labOrder.findMany({
        where: withSoftDelete({
          ...clinicFilter,
          neededByDate: { gte: today, lt: tomorrow },
          status: { in: incompleteStatuses },
        }),
        include: {
          patient: {
            select: { id: true, firstName: true, lastName: true },
          },
          vendor: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: { neededByDate: 'asc' },
      }),

      // Approaching due (next 3 days)
      db.labOrder.findMany({
        where: withSoftDelete({
          ...clinicFilter,
          neededByDate: { gte: tomorrow, lt: threeDaysOut },
          status: { in: incompleteStatuses },
        }),
        include: {
          patient: {
            select: { id: true, firstName: true, lastName: true },
          },
          vendor: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: { neededByDate: 'asc' },
      }),

      // Delayed shipments (estimatedDelivery passed, not delivered)
      db.labShipment.findMany({
        where: {
          ...clinicFilter,
          estimatedDelivery: { lt: today },
          status: { notIn: [ShipmentStatus.DELIVERED, ShipmentStatus.RETURNED] },
        },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              patient: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
        },
        orderBy: { estimatedDelivery: 'asc' },
      }),
    ]);

    // Get pending remake approvals
    const pendingRemakes = await db.remakeRequest.findMany({
      where: {
        ...clinicFilter,
        status: RemakeStatus.REQUESTED,
        requiresApproval: true,
        approvedAt: null,
      },
      include: {
        originalItem: {
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                patient: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
          },
        },
      },
      take: 20,
    });

    // Get expiring contracts (next 30 days)
    const thirtyDaysOut = new Date(today);
    thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);

    const expiringContracts = await db.labContract.findMany({
      where: {
        ...clinicFilter,
        deletedAt: null,
        status: LabContractStatus.ACTIVE,
        endDate: { gte: today, lte: thirtyDaysOut },
      },
      include: {
        vendor: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { endDate: 'asc' },
    });

    // Build alerts list
    type AlertType = {
      id: string;
      type: string;
      severity: 'CRITICAL' | 'WARNING' | 'INFO';
      title: string;
      message: string;
      orderId?: string | null;
      orderNumber?: string | null;
      patient?: { id: string; firstName: string; lastName: string } | null;
      vendor?: { id: string; name: string; code: string } | null;
      dueDate?: Date | null;
      createdAt?: Date | null;
      shipmentId?: string;
      trackingNumber?: string | null;
      remakeId?: string;
      estimatedCost?: number | null;
      contractId?: string;
      expiryDate?: Date | null;
    };

    const alerts: AlertType[] = [
      ...overdueOrders.map((order) => ({
        id: `overdue-${order.id}`,
        type: 'OVERDUE' as const,
        severity: 'CRITICAL' as const,
        title: `Order ${order.orderNumber} is overdue`,
        message: `Needed by ${order.neededByDate?.toLocaleDateString()} - Status: ${order.status}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        patient: order.patient,
        vendor: order.vendor,
        dueDate: order.neededByDate,
        createdAt: order.neededByDate,
      })),
      ...dueTodayOrders.map((order) => ({
        id: `due-today-${order.id}`,
        type: 'DUE_TODAY' as const,
        severity: 'WARNING' as const,
        title: `Order ${order.orderNumber} is due today`,
        message: `Status: ${order.status}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        patient: order.patient,
        vendor: order.vendor,
        dueDate: order.neededByDate,
        createdAt: order.neededByDate,
      })),
      ...approachingDueOrders.map((order) => ({
        id: `approaching-${order.id}`,
        type: 'APPROACHING_DUE' as const,
        severity: 'INFO' as const,
        title: `Order ${order.orderNumber} due soon`,
        message: `Due ${order.neededByDate?.toLocaleDateString()} - Status: ${order.status}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        patient: order.patient,
        vendor: order.vendor,
        dueDate: order.neededByDate,
        createdAt: order.neededByDate,
      })),
      ...delayedShipments.map((shipment) => ({
        id: `delayed-${shipment.id}`,
        type: 'SHIPMENT_DELAYED' as const,
        severity: 'WARNING' as const,
        title: `Shipment delayed for order ${shipment.order?.orderNumber}`,
        message: `Expected ${shipment.estimatedDelivery?.toLocaleDateString()} via ${shipment.carrier}`,
        orderId: shipment.order?.id,
        orderNumber: shipment.order?.orderNumber,
        patient: shipment.order?.patient,
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
        createdAt: shipment.estimatedDelivery,
      })),
      ...pendingRemakes.map((remake) => ({
        id: `remake-${remake.id}`,
        type: 'REMAKE_APPROVAL' as const,
        severity: 'WARNING' as const,
        title: `Remake request pending approval`,
        message: `Order ${remake.originalItem?.order?.orderNumber} - ${remake.reason}`,
        orderId: remake.originalItem?.order?.id,
        orderNumber: remake.originalItem?.order?.orderNumber,
        patient: remake.originalItem?.order?.patient,
        remakeId: remake.id,
        estimatedCost: remake.estimatedCost,
        createdAt: remake.createdAt,
      })),
      ...expiringContracts.map((contract) => ({
        id: `contract-${contract.id}`,
        type: 'CONTRACT_EXPIRING' as const,
        severity: 'INFO' as const,
        title: `Contract "${contract.name}" expiring soon`,
        message: `Expires ${contract.endDate?.toLocaleDateString()} - ${contract.vendor?.name}`,
        contractId: contract.id,
        vendor: contract.vendor,
        expiryDate: contract.endDate,
        createdAt: contract.endDate,
      })),
    ];

    // Sort by severity and date
    const severityOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };
    alerts.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    });

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        summary: {
          critical: alerts.filter((a) => a.severity === 'CRITICAL').length,
          warning: alerts.filter((a) => a.severity === 'WARNING').length,
          info: alerts.filter((a) => a.severity === 'INFO').length,
          total: alerts.length,
        },
      },
    });
  },
  { permissions: ['lab:view'] }
);
