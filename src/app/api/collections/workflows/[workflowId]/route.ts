import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateCollectionWorkflowSchema } from '@/lib/validations/collections';
import { calculateWorkflowEffectiveness } from '@/lib/billing/collections-utils';

interface RouteParams {
  params: Promise<{ workflowId: string }>;
}

/**
 * GET /api/collections/workflows/:workflowId
 * Get workflow details
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { workflowId } = await params;

    const workflow = await db.collectionWorkflow.findFirst({
      where: withSoftDelete({
        id: workflowId,
        clinicId: session.user.clinicId,
      }),
      include: {
        stages: {
          orderBy: { stageNumber: 'asc' },
        },
        _count: {
          select: {
            accounts: true,
          },
        },
      },
    });

    if (!workflow) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'WORKFLOW_NOT_FOUND',
            message: 'Workflow not found',
          },
        },
        { status: 404 }
      );
    }

    // Get effectiveness metrics
    const effectiveness = await calculateWorkflowEffectiveness(
      session.user.clinicId,
      workflowId
    );

    return NextResponse.json({
      success: true,
      data: {
        ...workflow,
        effectiveness,
      },
    });
  },
  { permissions: ['collections:read'] }
);

/**
 * PATCH /api/collections/workflows/:workflowId
 * Update a workflow
 */
export const PATCH = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { workflowId } = await params;
    const body = await req.json();

    const result = updateCollectionWorkflowSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid workflow data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify workflow exists
    const existingWorkflow = await db.collectionWorkflow.findFirst({
      where: withSoftDelete({
        id: workflowId,
        clinicId: session.user.clinicId,
      }),
    });

    if (!existingWorkflow) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'WORKFLOW_NOT_FOUND',
            message: 'Workflow not found',
          },
        },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await db.collectionWorkflow.updateMany({
        where: withSoftDelete({
          clinicId: session.user.clinicId,
          isDefault: true,
          id: { not: workflowId },
        }),
        data: { isDefault: false },
      });
    }

    // Update workflow
    const workflow = await db.collectionWorkflow.update({
      where: { id: workflowId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.triggerDays !== undefined && { triggerDays: data.triggerDays }),
        ...(data.minBalance !== undefined && { minBalance: data.minBalance }),
        ...(data.patientType !== undefined && { patientType: data.patientType }),
      },
      include: {
        stages: {
          orderBy: { stageNumber: 'asc' },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'CollectionWorkflow',
      entityId: workflowId,
      details: {
        changes: data,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: workflow,
    });
  },
  { permissions: ['collections:manage'] }
);

/**
 * DELETE /api/collections/workflows/:workflowId
 * Soft delete a workflow
 */
export const DELETE = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { workflowId } = await params;

    // Verify workflow exists
    const existingWorkflow = await db.collectionWorkflow.findFirst({
      where: withSoftDelete({
        id: workflowId,
        clinicId: session.user.clinicId,
      }),
      include: {
        _count: {
          select: { accounts: true },
        },
      },
    });

    if (!existingWorkflow) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'WORKFLOW_NOT_FOUND',
            message: 'Workflow not found',
          },
        },
        { status: 404 }
      );
    }

    // Check for active accounts
    if (existingWorkflow._count.accounts > 0) {
      // Check if any are still active
      const activeAccounts = await db.accountCollection.count({
        where: {
          workflowId,
          status: { in: ['ACTIVE', 'PAUSED'] },
        },
      });

      if (activeAccounts > 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'WORKFLOW_IN_USE',
              message: `Cannot delete workflow with ${activeAccounts} active accounts`,
            },
          },
          { status: 400 }
        );
      }
    }

    // Soft delete
    await db.collectionWorkflow.update({
      where: { id: workflowId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'CollectionWorkflow',
      entityId: workflowId,
      details: { name: existingWorkflow.name },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  },
  { permissions: ['collections:manage'] }
);
