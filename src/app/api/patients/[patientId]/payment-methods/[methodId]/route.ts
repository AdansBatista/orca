import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  detachPaymentMethod,
  setDefaultPaymentMethod,
} from '@/lib/payments/stripe';

interface RouteParams {
  params: Promise<{ patientId: string; methodId: string }>;
}

/**
 * GET /api/patients/[patientId]/payment-methods/[methodId]
 * Get a specific payment method
 */
export const GET = withAuth(
  async (req, session, { params }: RouteParams) => {
    const { patientId, methodId } = await params;

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

    const paymentMethod = await db.paymentMethod.findFirst({
      where: withSoftDelete({
        id: methodId,
        patientId,
        clinicId: session.user.clinicId,
      }),
    });

    if (!paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_METHOD_NOT_FOUND',
            message: 'Payment method not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: paymentMethod,
    });
  },
  { permissions: ['payment:read'] }
);

/**
 * PATCH /api/patients/[patientId]/payment-methods/[methodId]
 * Update a payment method (nickname, set as default)
 */
export const PATCH = withAuth(
  async (req, session, { params }: RouteParams) => {
    const { patientId, methodId } = await params;
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

    const paymentMethod = await db.paymentMethod.findFirst({
      where: withSoftDelete({
        id: methodId,
        patientId,
        clinicId: session.user.clinicId,
      }),
    });

    if (!paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_METHOD_NOT_FOUND',
            message: 'Payment method not found',
          },
        },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedBy: session.user.id,
    };

    // Update nickname
    if (body.nickname !== undefined) {
      updateData.nickname = body.nickname;
    }

    // Set as default
    if (body.isDefault === true) {
      // Update Stripe if applicable
      if (patient.stripeCustomerId && paymentMethod.gatewayPaymentMethodId) {
        try {
          await setDefaultPaymentMethod(
            patient.stripeCustomerId,
            paymentMethod.gatewayPaymentMethodId
          );
        } catch (error) {
          const stripeError = error as { message?: string };
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'STRIPE_UPDATE_FAILED',
                message: stripeError.message || 'Failed to update default in Stripe',
              },
            },
            { status: 400 }
          );
        }
      }

      // Unset other defaults
      await db.paymentMethod.updateMany({
        where: {
          patientId,
          clinicId: session.user.clinicId,
          isDefault: true,
          id: { not: methodId },
        },
        data: { isDefault: false },
      });

      updateData.isDefault = true;
    }

    const updatedMethod = await db.paymentMethod.update({
      where: { id: methodId },
      data: updateData,
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'PaymentMethod',
      entityId: paymentMethod.id,
      details: { changes: Object.keys(updateData) },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: updatedMethod,
    });
  },
  { permissions: ['payment:update'] }
);

/**
 * DELETE /api/patients/[patientId]/payment-methods/[methodId]
 * Remove a payment method
 */
export const DELETE = withAuth(
  async (req, session, { params }: RouteParams) => {
    const { patientId, methodId } = await params;

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

    const paymentMethod = await db.paymentMethod.findFirst({
      where: withSoftDelete({
        id: methodId,
        patientId,
        clinicId: session.user.clinicId,
      }),
    });

    if (!paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_METHOD_NOT_FOUND',
            message: 'Payment method not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if used in active payment plans
    const activePlans = await db.paymentPlan.count({
      where: {
        paymentMethodId: methodId,
        status: { in: ['ACTIVE', 'PENDING'] },
      },
    });

    if (activePlans > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_METHOD_IN_USE',
            message: 'Cannot remove payment method used by active payment plans',
          },
        },
        { status: 400 }
      );
    }

    // Detach from Stripe
    if (paymentMethod.gatewayPaymentMethodId) {
      try {
        await detachPaymentMethod(paymentMethod.gatewayPaymentMethodId);
      } catch (error) {
        // Log but don't fail if Stripe detach fails
        console.error('Failed to detach from Stripe:', error);
      }
    }

    // Soft delete
    await db.paymentMethod.update({
      where: { id: methodId },
      data: {
        status: 'REMOVED',
        deletedAt: new Date(),
        deletedBy: session.user.id,
        updatedBy: session.user.id,
      },
    });

    // If this was the default, set another as default
    if (paymentMethod.isDefault) {
      const nextMethod = await db.paymentMethod.findFirst({
        where: {
          patientId,
          clinicId: session.user.clinicId,
          status: 'ACTIVE',
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (nextMethod) {
        await db.paymentMethod.update({
          where: { id: nextMethod.id },
          data: { isDefault: true },
        });
      }
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'PaymentMethod',
      entityId: paymentMethod.id,
      details: { cardLast4: paymentMethod.cardLast4 },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  },
  { permissions: ['payment:delete'] }
);
