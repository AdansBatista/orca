/**
 * Bulk Messages API
 *
 * POST /api/communications/messages/bulk
 *
 * Send messages to multiple patients using a template.
 * Supports scheduling and variable substitution.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { z } from 'zod';

import { db } from '@/lib/db';
import { withSoftDeleteAnd, SOFT_DELETE_FILTER } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { getMessagingService } from '@/lib/services/messaging';
import { messageChannelEnum } from '@/lib/validations/communications';

/**
 * Validation schema for bulk message request
 */
const bulkMessageSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  channel: messageChannelEnum,
  patientIds: z.array(z.string()).min(1, 'At least one patient is required').max(500),
  commonVariables: z.record(z.string(), z.string()).optional(),
  scheduledAt: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * POST /api/communications/messages/bulk
 * Send bulk messages to multiple patients
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = bulkMessageSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid bulk message data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { templateId, channel, patientIds, commonVariables, scheduledAt, tags } = result.data;
    const clinicId = session.user.clinicId;

    // Verify template exists and has content for the channel
    const template = await db.messageTemplate.findFirst({
      where: withSoftDeleteAnd([{ id: templateId }, { clinicId }, { isActive: true }]),
    });

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: 'Template not found or inactive',
          },
        },
        { status: 404 }
      );
    }

    // Check template has content for the channel
    const hasContent =
      (channel === 'SMS' && template.smsBody) ||
      (channel === 'EMAIL' && template.emailBody) ||
      (channel === 'PUSH' && template.pushBody) ||
      (channel === 'IN_APP' && template.inAppBody);

    if (!hasContent) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_TEMPLATE_CONTENT',
            message: `Template has no content for ${channel} channel`,
          },
        },
        { status: 400 }
      );
    }

    // Get patients with their contact info
    const patients = await db.patient.findMany({
      where: withSoftDeleteAnd([{ id: { in: patientIds } }, getClinicFilter(session)]),
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    // Build recipients list
    const recipients = patients
      .map((patient) => {
        const to = channel === 'EMAIL' ? patient.email : patient.phone;
        if (!to) return null;

        return {
          patientId: patient.id,
          to,
          variables: {
            firstName: patient.firstName,
            lastName: patient.lastName,
            fullName: `${patient.firstName} ${patient.lastName}`,
            email: patient.email || '',
            phone: patient.phone || '',
          },
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    // Track patients without contact info
    const missingContact = patientIds.filter((id) => !recipients.find((r) => r.patientId === id));

    if (recipients.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_VALID_RECIPIENTS',
            message: `None of the selected patients have ${channel === 'EMAIL' ? 'email addresses' : 'phone numbers'}`,
          },
        },
        { status: 400 }
      );
    }

    // Send bulk messages
    const messagingService = getMessagingService();
    const sendResult = await messagingService.sendBulkMessages(
      {
        templateId,
        channel,
        recipients,
        commonVariables,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        tags,
      },
      session.user.id
    );

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'BulkMessage',
      entityId: templateId,
      details: {
        channel,
        templateName: template.name,
        totalRecipients: patientIds.length,
        sent: sendResult.sent,
        failed: sendResult.failed,
        missingContact: missingContact.length,
        scheduled: !!scheduledAt,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: sendResult.success,
      data: {
        total: patientIds.length,
        sent: sendResult.sent,
        failed: sendResult.failed,
        missingContact: missingContact.length,
        results: sendResult.results,
        missingContactPatients: missingContact,
      },
    });
  },
  { permissions: ['comms:send_message'] }
);
