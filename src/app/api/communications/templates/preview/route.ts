/**
 * Template Preview API
 *
 * POST /api/communications/templates/preview
 *
 * Preview a template with variable substitution.
 * Can preview either an existing template by ID or raw template content.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { withSoftDeleteAnd } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { messageChannelEnum } from '@/lib/validations/communications';

/**
 * Validation schema for preview request
 */
const previewSchema = z.object({
  // Either templateId or raw content
  templateId: z.string().optional(),
  channel: messageChannelEnum,

  // Raw content (used if no templateId)
  smsBody: z.string().optional(),
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),
  pushTitle: z.string().optional(),
  pushBody: z.string().optional(),

  // Variables for substitution
  variables: z.record(z.string(), z.string()).optional(),

  // Optional patient ID to auto-populate patient variables
  patientId: z.string().optional(),
});

/**
 * Substitute variables in text
 */
function substituteVariables(
  text: string,
  variables: Record<string, string>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] ?? match;
  });
}

/**
 * Extract variable names from template text
 */
function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map((m) => m.slice(2, -2)))];
}

/**
 * POST /api/communications/templates/preview
 * Preview a template with variables
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = previewSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid preview request',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { templateId, channel, variables = {}, patientId } = result.data;
    const clinicId = session.user.clinicId;

    // Build variables from patient if provided
    let finalVariables = { ...variables };

    if (patientId) {
      const patient = await db.patient.findFirst({
        where: withSoftDeleteAnd([{ id: patientId }, getClinicFilter(session)]),
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      });

      if (patient) {
        finalVariables = {
          firstName: patient.firstName,
          lastName: patient.lastName,
          fullName: `${patient.firstName} ${patient.lastName}`,
          email: patient.email || '',
          phone: patient.phone || '',
          ...finalVariables, // User-provided variables take precedence
        };
      }
    }

    // Get clinic info for clinic variables
    const clinic = await db.clinic.findUnique({
      where: { id: clinicId },
      select: {
        name: true,
        phone: true,
        email: true,
        address: true,
      },
    });

    if (clinic) {
      finalVariables = {
        clinicName: clinic.name,
        clinicPhone: clinic.phone || '',
        clinicEmail: clinic.email || '',
        clinicAddress: clinic.address || '',
        ...finalVariables,
      };
    }

    // Get template content
    let content: {
      subject?: string;
      body?: string;
      htmlBody?: string;
    } = {};
    let templateVariables: string[] = [];

    if (templateId) {
      // Load template from database
      const template = await db.messageTemplate.findFirst({
        where: withSoftDeleteAnd([{ id: templateId }, { clinicId }]),
      });

      if (!template) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TEMPLATE_NOT_FOUND',
              message: 'Template not found',
            },
          },
          { status: 404 }
        );
      }

      // Get content for the specified channel
      switch (channel) {
        case 'SMS':
          content = { body: template.smsBody || undefined };
          break;
        case 'EMAIL':
          content = {
            subject: template.emailSubject || undefined,
            body: template.emailBody || undefined,
            htmlBody: template.emailHtmlBody || undefined,
          };
          break;
        case 'PUSH':
          content = {
            subject: template.pushTitle || undefined,
            body: template.pushBody || undefined,
          };
          break;
        case 'IN_APP':
          content = {
            subject: template.inAppTitle || undefined,
            body: template.inAppBody || undefined,
          };
          break;
      }

      // Get template's declared variables
      templateVariables = (template.variables as string[]) || [];
    } else {
      // Use raw content from request
      switch (channel) {
        case 'SMS':
          content = { body: result.data.smsBody };
          break;
        case 'EMAIL':
          content = {
            subject: result.data.emailSubject,
            body: result.data.emailBody,
          };
          break;
        case 'PUSH':
          content = {
            subject: result.data.pushTitle,
            body: result.data.pushBody,
          };
          break;
      }
    }

    // Extract variables from content
    const allText = [content.subject, content.body, content.htmlBody]
      .filter(Boolean)
      .join(' ');
    const foundVariables = extractVariables(allText);

    // Perform substitution
    const preview = {
      subject: content.subject
        ? substituteVariables(content.subject, finalVariables)
        : undefined,
      body: content.body
        ? substituteVariables(content.body, finalVariables)
        : undefined,
      htmlBody: content.htmlBody
        ? substituteVariables(content.htmlBody, finalVariables)
        : undefined,
    };

    // Identify missing variables (found in template but not provided)
    const providedVars = new Set(Object.keys(finalVariables));
    const missingVariables = foundVariables.filter((v) => !providedVars.has(v));

    return NextResponse.json({
      success: true,
      data: {
        channel,
        preview,
        original: content,
        variables: {
          found: foundVariables,
          declared: templateVariables,
          provided: Object.keys(finalVariables),
          missing: missingVariables,
        },
      },
    });
  },
  { permissions: ['comms:view_inbox'] }
);
