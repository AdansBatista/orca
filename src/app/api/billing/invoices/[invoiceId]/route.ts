import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateInvoiceSchema, voidInvoiceSchema } from '@/lib/validations/billing';
import { updateAccountBalance } from '@/lib/billing/utils';

/**
 * GET /api/billing/invoices/[invoiceId]
 * Get a single invoice by ID
 */
export const GET = withAuth<{ invoiceId: string }>(
  async (req, session, context) => {
    const { invoiceId } = await context.params;

    const invoice = await db.invoice.findFirst({
      where: withSoftDelete({
        id: invoiceId,
        ...getClinicFilter(session),
      }),
      include: {
        account: {
          select: {
            id: true,
            accountNumber: true,
            currentBalance: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        items: true,
        allocations: {
          include: {
            payment: {
              select: {
                id: true,
                paymentNumber: true,
                paymentDate: true,
                amount: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Invoice not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: invoice });
  },
  { permissions: ['billing:read'] }
);

/**
 * PATCH /api/billing/invoices/[invoiceId]
 * Update an invoice
 */
export const PATCH = withAuth<{ invoiceId: string }>(
  async (req, session, context) => {
    const { invoiceId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateInvoiceSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check invoice exists
    const existingInvoice = await db.invoice.findFirst({
      where: withSoftDelete({
        id: invoiceId,
        ...getClinicFilter(session),
      }),
    });

    if (!existingInvoice) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Invoice not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if invoice can be modified
    if (['PAID', 'VOID', 'WRITTEN_OFF'].includes(existingInvoice.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVOICE_LOCKED',
            message: `Cannot modify invoice with status: ${existingInvoice.status}`,
          },
        },
        { status: 400 }
      );
    }

    // Update invoice
    const invoice = await db.invoice.update({
      where: { id: invoiceId },
      data: {
        ...data,
        updatedBy: session.user.id,
      },
      include: {
        account: {
          select: {
            id: true,
            accountNumber: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: true,
      },
    });

    // Update account balance if status changed
    if (data.status && data.status !== existingInvoice.status) {
      await updateAccountBalance(invoice.accountId, session.user.clinicId, session.user.id);
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'Invoice',
      entityId: invoice.id,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: invoice });
  },
  { permissions: ['billing:update'] }
);

/**
 * DELETE /api/billing/invoices/[invoiceId]
 * Void/delete an invoice
 */
export const DELETE = withAuth<{ invoiceId: string }>(
  async (req, session, context) => {
    const { invoiceId } = await context.params;

    // Parse void reason from body if provided
    let voidReason = 'Deleted by user';
    try {
      const body = await req.json();
      const result = voidInvoiceSchema.safeParse(body);
      if (result.success) {
        voidReason = result.data.voidReason;
      }
    } catch {
      // No body provided, use default reason
    }

    // Check invoice exists
    const existingInvoice = await db.invoice.findFirst({
      where: withSoftDelete({
        id: invoiceId,
        ...getClinicFilter(session),
      }),
      include: {
        allocations: {
          select: { id: true },
        },
      },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Invoice not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if invoice has payments
    if (existingInvoice.allocations.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_PAYMENTS',
            message: 'Cannot delete invoice with payments. Void the invoice instead.',
          },
        },
        { status: 400 }
      );
    }

    // If invoice has been sent or has any activity, void it instead of deleting
    if (['SENT', 'PARTIAL', 'OVERDUE'].includes(existingInvoice.status)) {
      await db.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'VOID',
          internalNotes: `Voided: ${voidReason}`,
          updatedBy: session.user.id,
        },
      });
    } else {
      // Soft delete draft/pending invoices
      await db.invoice.update({
        where: { id: invoiceId },
        data: {
          deletedAt: new Date(),
          status: 'VOID',
          updatedBy: session.user.id,
        },
      });
    }

    // Update account balance
    await updateAccountBalance(existingInvoice.accountId, session.user.clinicId, session.user.id);

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'Invoice',
      entityId: invoiceId,
      details: {
        invoiceNumber: existingInvoice.invoiceNumber,
        subtotal: existingInvoice.subtotal,
        voidReason,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { id: invoiceId } });
  },
  { permissions: ['billing:delete'] }
);
