import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createPaymentMethodSchema,
  paymentMethodQuerySchema,
} from '@/lib/validations/billing';
import {
  attachPaymentMethod,
  listPaymentMethods,
  getPaymentMethod,
  createStripeCustomer,
  extractCardDetails,
} from '@/lib/payments/stripe';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/patients/[id]/payment-methods
 * List saved payment methods for a patient
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { id: patientId } = await params;
    const { searchParams } = new URL(req.url);

    // Verify patient exists and belongs to clinic
    const patient = await db.patient.findFirst({
      where: withSoftDelete({
        id: patientId,
        ...getClinicFilter(session),
      }),
    });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PATIENT_NOT_FOUND',
            message: 'Patient not found',
          },
        },
        { status: 404 }
      );
    }

    // Parse query params
    const rawParams = {
      type: searchParams.get('type') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    };

    const queryResult = paymentMethodQuerySchema.safeParse(rawParams);
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

    const { type, page, pageSize } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = withSoftDelete({
      patientId,
      clinicId: session.user.clinicId,
    });

    if (type) where.type = type;

    // Get total count
    const total = await db.paymentMethod.count({ where });

    // Get payment methods
    const paymentMethods = await db.paymentMethod.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: paymentMethods,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['payment:read'] }
);

/**
 * POST /api/patients/[id]/payment-methods
 * Add a new payment method for a patient
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { id: patientId } = await params;
    const body = await req.json();

    // Verify patient exists
    const patient = await db.patient.findFirst({
      where: withSoftDelete({
        id: patientId,
        ...getClinicFilter(session),
      }),
    });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PATIENT_NOT_FOUND',
            message: 'Patient not found',
          },
        },
        { status: 404 }
      );
    }

    // Validate input
    const result = createPaymentMethodSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid payment method data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Find existing Stripe customer ID from patient's existing payment methods
    const existingMethod = await db.paymentMethod.findFirst({
      where: {
        patientId,
        clinicId: session.user.clinicId,
        gateway: 'STRIPE',
        gatewayCustomerId: { not: null },
      },
      select: { gatewayCustomerId: true },
    });

    let stripeCustomerId = existingMethod?.gatewayCustomerId;

    // Create Stripe customer if not found
    if (!stripeCustomerId) {
      try {
        const stripeCustomer = await createStripeCustomer({
          email: patient.email || `patient_${patientId}@orca.local`,
          name: `${patient.firstName} ${patient.lastName}`,
          phone: patient.phone ?? undefined,
          metadata: {
            patientId,
            clinicId: session.user.clinicId,
          },
        });

        stripeCustomerId = stripeCustomer.id;
      } catch (error) {
        const stripeError = error as { message?: string };
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'STRIPE_CUSTOMER_FAILED',
              message: stripeError.message || 'Failed to create Stripe customer',
            },
          },
          { status: 400 }
        );
      }
    }

    // Attach payment method to customer
    try {
      const stripePaymentMethod = await attachPaymentMethod({
        customerId: stripeCustomerId,
        paymentMethodId: data.gatewayMethodId!,
        setAsDefault: data.isDefault,
      });

      // Extract card details
      const cardDetails = extractCardDetails(stripePaymentMethod);

      // If setting as default, unset other defaults
      if (data.isDefault) {
        await db.paymentMethod.updateMany({
          where: {
            patientId,
            clinicId: session.user.clinicId,
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }

      // Create payment method record
      const paymentMethod = await db.paymentMethod.create({
        data: {
          clinicId: session.user.clinicId,
          patientId,
          gateway: 'STRIPE',
          gatewayCustomerId: stripeCustomerId,
          gatewayMethodId: stripePaymentMethod.id,
          type: data.type,
          cardBrand: cardDetails?.brand,
          cardLast4: cardDetails?.last4,
          cardExpMonth: cardDetails?.expMonth,
          cardExpYear: cardDetails?.expYear,
          nickname: data.nickname,
          isDefault: data.isDefault || false,
          status: 'ACTIVE',
        },
      });

      // Audit log
      const { ipAddress, userAgent } = getRequestMeta(req);
      await logAudit(session, {
        action: 'CREATE',
        entity: 'PaymentMethod',
        entityId: paymentMethod.id,
        details: {
          patientId,
          type: paymentMethod.type,
          cardLast4: paymentMethod.cardLast4,
        },
        ipAddress,
        userAgent,
      });

      return NextResponse.json(
        { success: true, data: paymentMethod },
        { status: 201 }
      );
    } catch (error) {
      const stripeError = error as { message?: string };
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_METHOD_FAILED',
            message: stripeError.message || 'Failed to add payment method',
          },
        },
        { status: 400 }
      );
    }
  },
  { permissions: ['payment:create'] }
);
