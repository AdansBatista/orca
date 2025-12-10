import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { convertLeadSchema } from '@/lib/validations/leads';

/**
 * POST /api/leads/[id]/convert
 * Convert a lead to a patient
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = convertLeadSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid conversion data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Get the lead
    const lead = await db.lead.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!lead) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Lead not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if already converted
    if (lead.status === 'CONVERTED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_CONVERTED',
            message: 'This lead has already been converted to a patient',
            patientId: lead.convertedToPatientId,
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check if patient with same email already exists
    if (lead.email) {
      const existingPatient = await db.patient.findFirst({
        where: {
          clinicId: session.user.clinicId,
          email: lead.email,
        },
      });

      if (existingPatient) {
        // Link to existing patient instead of creating new
        const updatedLead = await db.lead.update({
          where: { id },
          data: {
            status: 'CONVERTED',
            convertedAt: new Date(),
            convertedToPatientId: existingPatient.id,
          },
        });

        // Log activity
        await db.leadActivity.create({
          data: {
            clinicId: session.user.clinicId,
            leadId: id,
            type: 'STATUS_CHANGE',
            title: 'Lead linked to existing patient',
            description: `Linked to existing patient record`,
            metadata: { patientId: existingPatient.id },
            performedById: session.user.id,
          },
        });

        return NextResponse.json({
          success: true,
          data: {
            lead: updatedLead,
            patient: existingPatient,
            wasExisting: true,
          },
        });
      }
    }

    // Create new patient from lead
    // Note: Patient model has limited fields - additional data stored elsewhere
    const patient = await db.patient.create({
      data: {
        clinicId: session.user.clinicId,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        dateOfBirth: data.dateOfBirth,
        isActive: true,
        createdBy: session.user.id,
      },
    });

    // Update lead with conversion info
    const updatedLead = await db.lead.update({
      where: { id },
      data: {
        status: 'CONVERTED',
        stage: 'TREATMENT_STARTED',
        convertedAt: new Date(),
        convertedToPatientId: patient.id,
      },
    });

    // Transfer form submissions to patient
    await db.formSubmission.updateMany({
      where: {
        leadId: id,
        patientId: null,
      },
      data: {
        patientId: patient.id,
      },
    });

    // Log activity
    await db.leadActivity.create({
      data: {
        clinicId: session.user.clinicId,
        leadId: id,
        type: 'STATUS_CHANGE',
        title: 'Lead converted to patient',
        description: `Created new patient record`,
        metadata: { patientId: patient.id },
        performedById: session.user.id,
      },
    });

    // Update referring provider stats if applicable
    if (lead.referringDentistId) {
      await db.referringProvider.update({
        where: { id: lead.referringDentistId },
        data: {
          totalReferrals: { increment: 1 },
          referralsThisYear: { increment: 1 },
          lastReferralDate: new Date(),
        },
      });
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'Patient',
      entityId: patient.id,
      details: {
        convertedFromLeadId: id,
        name: `${patient.firstName} ${patient.lastName}`,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        lead: updatedLead,
        patient,
        wasExisting: false,
      },
    });
  },
  { permissions: ['leads:full', 'patients:edit'] }
);
