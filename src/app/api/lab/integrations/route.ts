import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { z } from 'zod';

/**
 * Integration configuration schema
 */
const integrationConfigSchema = z.object({
  type: z.enum([
    'ITERO_SCANNER',
    'THREESHAPE_SCANNER',
    'CARESTREAM_SCANNER',
    'FEDEX_SHIPPING',
    'UPS_SHIPPING',
    'USPS_SHIPPING',
    'LAB_PORTAL',
  ]),
  name: z.string().min(1).max(100),
  enabled: z.boolean().optional().default(false),
  config: z.record(z.string(), z.unknown()).optional().default({}),
});

const updateIntegrationSchema = integrationConfigSchema.partial();

/**
 * GET /api/lab/integrations
 * List all configured integrations for the clinic
 */
export const GET = withAuth(
  async (req, session) => {
    const clinicFilter = getClinicFilter(session);

    // Get integration configurations from clinic settings or dedicated table
    // For now, return available integration types with their status
    const integrations = await db.labIntegration.findMany({
      where: {
        ...clinicFilter,
        deletedAt: null,
      },
      orderBy: { type: 'asc' },
    });

    // Return available integrations with their configuration status
    const availableIntegrations = [
      {
        type: 'ITERO_SCANNER',
        name: 'iTero Scanner Integration',
        description: 'Import digital impressions directly from iTero scanners',
        category: 'SCANNER',
        features: ['Auto-import scans', 'Attach to orders', 'Patient matching'],
      },
      {
        type: 'THREESHAPE_SCANNER',
        name: '3Shape Scanner Integration',
        description: 'Connect with 3Shape TRIOS scanners',
        category: 'SCANNER',
        features: ['Scan import', 'Order attachment', 'Case management'],
      },
      {
        type: 'CARESTREAM_SCANNER',
        name: 'Carestream Scanner Integration',
        description: 'Integrate with Carestream dental imaging',
        category: 'SCANNER',
        features: ['Image import', 'DICOM support'],
      },
      {
        type: 'FEDEX_SHIPPING',
        name: 'FedEx Shipping Integration',
        description: 'Automatic shipment tracking for FedEx packages',
        category: 'SHIPPING',
        features: ['Auto-tracking', 'Delivery notifications', 'Proof of delivery'],
      },
      {
        type: 'UPS_SHIPPING',
        name: 'UPS Shipping Integration',
        description: 'Track UPS shipments automatically',
        category: 'SHIPPING',
        features: ['Package tracking', 'Delivery alerts', 'Exception handling'],
      },
      {
        type: 'USPS_SHIPPING',
        name: 'USPS Shipping Integration',
        description: 'USPS package and mail tracking',
        category: 'SHIPPING',
        features: ['Tracking updates', 'Delivery confirmation'],
      },
      {
        type: 'LAB_PORTAL',
        name: 'Lab Portal Integration',
        description: 'Direct connection to lab vendor portals',
        category: 'LAB',
        features: ['Order submission', 'Status sync', 'Digital prescriptions'],
      },
    ];

    // Merge configured integrations with available ones
    const mergedIntegrations = availableIntegrations.map((available) => {
      const configured = integrations.find((i) => i.type === available.type);
      return {
        ...available,
        id: configured?.id,
        enabled: configured?.enabled ?? false,
        configured: !!configured,
        lastSyncAt: configured?.lastSyncAt,
        status: configured?.status ?? 'NOT_CONFIGURED',
        vendorId: configured?.vendorId,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        integrations: mergedIntegrations,
        summary: {
          total: availableIntegrations.length,
          configured: integrations.length,
          enabled: integrations.filter((i) => i.enabled).length,
        },
      },
    });
  },
  { permissions: ['lab:view'] }
);

/**
 * POST /api/lab/integrations
 * Configure a new integration
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();
    const clinicFilter = getClinicFilter(session);

    // Validate input
    const result = integrationConfigSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid integration configuration',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check if integration already exists
    const existing = await db.labIntegration.findFirst({
      where: {
        ...clinicFilter,
        type: data.type,
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTEGRATION_EXISTS',
            message: 'Integration of this type already configured',
          },
        },
        { status: 409 }
      );
    }

    // Create integration
    const integration = await db.labIntegration.create({
      data: {
        type: data.type,
        name: data.name,
        enabled: data.enabled,
        config: data.config as object,
        clinicId: session.user.clinicId,
        status: 'PENDING_SETUP',
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: integration,
      },
      { status: 201 }
    );
  },
  { permissions: ['settings:edit'] }
);
