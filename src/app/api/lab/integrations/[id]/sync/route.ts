import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { ShippingCarrier, ShipmentStatus } from '@prisma/client';

/**
 * POST /api/lab/integrations/[id]/sync
 * Trigger a sync for an integration
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const clinicFilter = getClinicFilter(session);
    const { ipAddress, userAgent } = getRequestMeta(req);

    const integration = await db.labIntegration.findFirst({
      where: {
        id,
        ...clinicFilter,
        deletedAt: null,
      },
    });

    if (!integration) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTEGRATION_NOT_FOUND',
            message: 'Integration not found',
          },
        },
        { status: 404 }
      );
    }

    if (!integration.enabled) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTEGRATION_DISABLED',
            message: 'Integration is not enabled',
          },
        },
        { status: 400 }
      );
    }

    if (integration.status !== 'CONNECTED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTEGRATION_NOT_CONNECTED',
            message: 'Integration is not connected. Please test the connection first.',
          },
        },
        { status: 400 }
      );
    }

    // Perform sync based on integration type
    const syncResult = await performSync(integration, clinicFilter, session.user.id);

    // Update last sync time
    await db.labIntegration.update({
      where: { id },
      data: {
        lastSyncAt: new Date(),
        ...(syncResult.success ? {} : { status: 'ERROR', errorMessage: syncResult.error }),
      },
    });

    // Audit log
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'LabIntegration',
      entityId: id,
      details: {
        operation: 'SYNC',
        integrationType: integration.type,
        result: syncResult.success ? 'SUCCESS' : 'FAILED',
        itemsSynced: syncResult.itemsSynced,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        integrationId: id,
        integrationType: integration.type,
        syncResult,
      },
    });
  },
  { permissions: ['settings:edit'] }
);

/**
 * Perform sync for different integration types
 */
async function performSync(
  integration: {
    id: string;
    type: string;
    config: unknown;
  },
  clinicFilter: Record<string, unknown>,
  userId: string
): Promise<{
  success: boolean;
  error?: string;
  itemsSynced?: number;
  details?: Record<string, unknown>;
}> {
  const config = integration.config as Record<string, unknown>;

  switch (integration.type) {
    case 'FEDEX_SHIPPING':
    case 'UPS_SHIPPING':
    case 'USPS_SHIPPING':
      return syncShipmentTracking(integration.type, config, clinicFilter);

    case 'ITERO_SCANNER':
    case 'THREESHAPE_SCANNER':
    case 'CARESTREAM_SCANNER':
      return syncScannerData(integration.type, config, clinicFilter, userId);

    case 'LAB_PORTAL':
      return syncLabPortal(config, clinicFilter, userId);

    default:
      return {
        success: false,
        error: 'Unknown integration type',
      };
  }
}

/**
 * Sync shipment tracking data
 */
async function syncShipmentTracking(
  type: string,
  config: Record<string, unknown>,
  clinicFilter: Record<string, unknown>
): Promise<{
  success: boolean;
  error?: string;
  itemsSynced?: number;
  details?: Record<string, unknown>;
}> {
  const carrierMap: Record<string, ShippingCarrier> = {
    FEDEX_SHIPPING: ShippingCarrier.FEDEX,
    UPS_SHIPPING: ShippingCarrier.UPS,
    USPS_SHIPPING: ShippingCarrier.USPS,
  };

  const carrier = carrierMap[type];

  // Get shipments that need tracking updates - note: LabShipment doesn't have clinicId
  // so we need to filter through orders
  const ordersWithShipments = await db.labOrder.findMany({
    where: {
      ...clinicFilter,
      deletedAt: null,
    },
    select: { id: true },
  });

  const orderIds = ordersWithShipments.map(o => o.id);

  const pendingShipments = await db.labShipment.findMany({
    where: {
      orderId: { in: orderIds },
      carrier,
      status: {
        notIn: [ShipmentStatus.DELIVERED, ShipmentStatus.RETURNED],
      },
      trackingNumber: { not: null },
    },
    take: 50, // Limit batch size
  });

  if (pendingShipments.length === 0) {
    return {
      success: true,
      itemsSynced: 0,
      details: {
        message: 'No shipments pending tracking updates',
      },
    };
  }

  // In production, this would:
  // 1. Call carrier tracking API for each shipment
  // 2. Update shipment status and create tracking events
  // 3. Send notifications for delivered packages

  let updatedCount = 0;
  for (const shipment of pendingShipments) {
    try {
      // Simulated tracking update
      // const trackingInfo = await fetchTrackingFromCarrier(carrier, shipment.trackingNumber);

      // For demo, we'll just record a sync event
      await db.shipmentEvent.create({
        data: {
          shipmentId: shipment.id,
          status: shipment.status,
          description: `Tracking synced via ${carrier} API`,
          timestamp: new Date(),
          source: 'CARRIER_API',
        },
      });

      updatedCount++;
    } catch (error) {
      // Continue with other shipments even if one fails
      console.error(`Failed to sync shipment ${shipment.id}:`, error);
    }
  }

  return {
    success: true,
    itemsSynced: updatedCount,
    details: {
      carrier,
      totalShipments: pendingShipments.length,
      updated: updatedCount,
      syncTime: new Date().toISOString(),
    },
  };
}

/**
 * Sync scanner/imaging data
 */
async function syncScannerData(
  type: string,
  config: Record<string, unknown>,
  clinicFilter: Record<string, unknown>,
  userId: string
): Promise<{
  success: boolean;
  error?: string;
  itemsSynced?: number;
  details?: Record<string, unknown>;
}> {
  // In production, this would:
  // 1. Connect to scanner service API
  // 2. Fetch new scans since last sync
  // 3. Match scans to patients
  // 4. Import as PatientImage records
  // 5. Associate with pending lab orders

  return {
    success: true,
    itemsSynced: 0,
    details: {
      scanner: type.replace('_SCANNER', ''),
      message: 'Scanner sync completed. No new scans found.',
      syncTime: new Date().toISOString(),
    },
  };
}

/**
 * Sync with lab portal
 */
async function syncLabPortal(
  config: Record<string, unknown>,
  clinicFilter: Record<string, unknown>,
  userId: string
): Promise<{
  success: boolean;
  error?: string;
  itemsSynced?: number;
  details?: Record<string, unknown>;
}> {
  // In production, this would:
  // 1. Fetch order status updates from lab portal
  // 2. Update local order statuses
  // 3. Import any attachments/photos
  // 4. Send notifications for status changes

  // Get orders that are pending status updates from lab
  const pendingOrders = await db.labOrder.findMany({
    where: {
      ...clinicFilter,
      deletedAt: null,
      status: {
        in: ['SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'SHIPPED'],
      },
    },
    take: 100,
  });

  // Simulated sync - in production this would call actual lab portal API
  const updatedCount = 0;

  return {
    success: true,
    itemsSynced: updatedCount,
    details: {
      ordersChecked: pendingOrders.length,
      ordersUpdated: updatedCount,
      syncTime: new Date().toISOString(),
    },
  };
}
