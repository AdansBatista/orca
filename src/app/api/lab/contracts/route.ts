import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createLabContractSchema } from '@/lib/validations/lab';

/**
 * GET /api/lab/contracts
 * List contracts for the clinic
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get('vendorId');
    const status = searchParams.get('status');

    const contracts = await db.labContract.findMany({
      where: {
        ...getClinicFilter(session),
        deletedAt: null,
        ...(vendorId && { vendorId }),
        ...(status && { status: status as 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' }),
      },
      include: {
        vendor: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json({ success: true, data: contracts });
  },
  { permissions: ['lab:view'] }
);

/**
 * POST /api/lab/contracts
 * Create a new contract
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    const result = createLabContractSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid contract data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify vendor exists
    const vendor = await db.labVendor.findFirst({
      where: {
        id: data.vendorId,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VENDOR_NOT_FOUND',
            message: 'Vendor not found',
          },
        },
        { status: 404 }
      );
    }

    const contract = await db.labContract.create({
      data: {
        clinicId: session.user.clinicId,
        vendorId: data.vendorId,
        contractNumber: data.contractNumber,
        name: data.name,
        status: data.status || 'ACTIVE',
        startDate: data.startDate,
        endDate: data.endDate,
        autoRenew: data.autoRenew,
        renewalNoticeDays: data.renewalNoticeDays,
        discountPercent: data.discountPercent,
        minimumVolume: data.minimumVolume,
        slaTerms: data.slaTerms,
        notes: data.notes,
        documentUrl: data.documentUrl,
        deletedAt: null,
      },
      include: {
        vendor: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'LabContract',
      entityId: contract.id,
      details: { name: contract.name, vendorId: contract.vendorId },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: contract }, { status: 201 });
  },
  { permissions: ['lab:manage_vendors'] }
);
