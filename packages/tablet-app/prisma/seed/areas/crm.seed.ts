/**
 * CRM & Onboarding seeder - Creates leads, activities, and tasks
 *
 * This seeder creates sample lead data for testing the CRM & Onboarding area
 * including leads at various pipeline stages, activities, and follow-up tasks.
 *
 * Dependencies: core, auth:users, staff
 */

import type { SeedContext } from '../types';
import { withSoftDelete } from '../utils/soft-delete';

// Lead sources for variety
const LEAD_SOURCES = [
  'WEBSITE',
  'PHONE_CALL',
  'WALK_IN',
  'REFERRAL_DENTIST',
  'REFERRAL_PATIENT',
  'SOCIAL_MEDIA',
  'GOOGLE_ADS',
  'INSURANCE_DIRECTORY',
] as const;

// Lead stages in order of progression (matches Prisma LeadStage enum)
const LEAD_STAGES = [
  'INQUIRY',
  'CONTACTED',
  'CONSULTATION_SCHEDULED',
  'CONSULTATION_COMPLETED',
  'PENDING_DECISION',
  'TREATMENT_ACCEPTED',
  'TREATMENT_STARTED',
  'LOST',
] as const;

// Lead statuses
const LEAD_STATUSES = ['NEW', 'IN_PROGRESS', 'CONVERTED', 'LOST'] as const;

// Sample lead data with realistic scenarios
const SAMPLE_LEADS = [
  // NEW leads (recent inquiries)
  {
    firstName: 'Jennifer',
    lastName: 'Martinez',
    email: 'jennifer.martinez@email.com',
    phone: '(555) 234-5678',
    preferredContact: 'EMAIL' as const,
    source: 'WEBSITE',
    sourceDetails: 'Contact form submission',
    status: 'NEW',
    stage: 'INQUIRY',
    patientType: 'NEW_PATIENT',
    treatmentInterest: 'Braces or Invisalign',
    primaryConcern: 'Interested in options for her 14-year-old son',
  },
  {
    firstName: 'Michael',
    lastName: 'Thompson',
    email: 'mthompson@company.com',
    phone: '(555) 345-6789',
    preferredContact: 'PHONE' as const,
    source: 'GOOGLE_ADS',
    sourceDetails: 'Adult Invisalign campaign',
    status: 'NEW',
    stage: 'INQUIRY',
    patientType: 'NEW_PATIENT',
    treatmentInterest: 'Invisalign',
    primaryConcern: 'Adult patient interested in clear aligners for work',
  },
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.j@gmail.com',
    phone: '(555) 456-7890',
    preferredContact: 'TEXT' as const,
    source: 'REFERRAL_PATIENT',
    sourceDetails: 'Referred by Emma Wilson',
    status: 'NEW',
    stage: 'INQUIRY',
    patientType: 'NEW_PATIENT',
    treatmentInterest: 'Braces',
    primaryConcern: 'Her friend Emma is a current patient',
  },

  // IN_PROGRESS leads (being worked)
  {
    firstName: 'David',
    lastName: 'Chen',
    email: 'david.chen@outlook.com',
    phone: '(555) 567-8901',
    preferredContact: 'PHONE' as const,
    source: 'REFERRAL_DENTIST',
    sourceDetails: 'Dr. Robert Smith - Family Dentistry',
    status: 'IN_PROGRESS',
    stage: 'CONTACTED',
    patientType: 'NEW_PATIENT',
    treatmentInterest: 'Braces',
    primaryConcern: 'Called back, very interested. Scheduling consultation.',
  },
  {
    firstName: 'Amanda',
    lastName: 'Williams',
    email: 'amanda.w@hotmail.com',
    phone: '(555) 678-9012',
    preferredContact: 'EMAIL' as const,
    source: 'SOCIAL_MEDIA',
    sourceDetails: 'Instagram - smile transformation post',
    status: 'IN_PROGRESS',
    stage: 'CONSULTATION_SCHEDULED',
    patientType: 'NEW_PATIENT',
    treatmentInterest: 'Invisalign',
    primaryConcern: 'Consultation scheduled for next week',
  },
  {
    firstName: 'Robert',
    lastName: 'Garcia',
    email: 'rgarcia@email.com',
    phone: '(555) 789-0123',
    preferredContact: 'PHONE' as const,
    source: 'PHONE_CALL',
    sourceDetails: 'Direct inquiry',
    status: 'IN_PROGRESS',
    stage: 'CONSULTATION_COMPLETED',
    patientType: 'TRANSFER_PATIENT',
    treatmentInterest: 'Braces',
    primaryConcern: 'Transferring from another ortho. Needs records.',
  },
  {
    firstName: 'Lisa',
    lastName: 'Brown',
    email: 'lisa.brown@work.com',
    phone: '(555) 890-1234',
    preferredContact: 'TEXT' as const,
    source: 'INSURANCE_DIRECTORY',
    sourceDetails: 'Delta Dental provider search',
    status: 'IN_PROGRESS',
    stage: 'PENDING_DECISION',
    patientType: 'NEW_PATIENT',
    treatmentInterest: 'Braces',
    primaryConcern: 'Treatment plan presented. Reviewing with spouse.',
  },
  {
    firstName: 'James',
    lastName: 'Wilson',
    email: 'jwilson@email.com',
    phone: '(555) 901-2345',
    preferredContact: 'EMAIL' as const,
    source: 'WALK_IN',
    sourceDetails: 'Walked in for information',
    status: 'IN_PROGRESS',
    stage: 'TREATMENT_ACCEPTED',
    patientType: 'NEW_PATIENT',
    treatmentInterest: 'Invisalign',
    primaryConcern: 'Discussing payment options. Very close to starting.',
  },

  // CONVERTED leads (became patients)
  {
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@email.com',
    phone: '(555) 012-3456',
    preferredContact: 'PHONE' as const,
    source: 'REFERRAL_PATIENT',
    sourceDetails: 'Referred by current patient',
    status: 'CONVERTED',
    stage: 'TREATMENT_STARTED',
    patientType: 'NEW_PATIENT',
    treatmentInterest: 'Braces',
    primaryConcern: 'Converted! Treatment started last month.',
  },
  {
    firstName: 'Christopher',
    lastName: 'Lee',
    email: 'chris.lee@gmail.com',
    phone: '(555) 123-4567',
    preferredContact: 'TEXT' as const,
    source: 'WEBSITE',
    sourceDetails: 'Online scheduling',
    status: 'CONVERTED',
    stage: 'TREATMENT_STARTED',
    patientType: 'NEW_PATIENT',
    treatmentInterest: 'Invisalign',
    primaryConcern: 'Converted! Started Invisalign treatment.',
  },

  // LOST leads
  {
    firstName: 'Patricia',
    lastName: 'Moore',
    email: 'p.moore@email.com',
    phone: '(555) 234-5679',
    preferredContact: 'EMAIL' as const,
    source: 'GOOGLE_ADS',
    sourceDetails: 'Braces campaign',
    status: 'LOST',
    stage: 'LOST',
    patientType: 'NEW_PATIENT',
    treatmentInterest: 'Braces',
    primaryConcern: 'Lost - chose another provider closer to home.',
    lostReason: 'Chose competitor closer to home',
  },
  {
    firstName: 'Daniel',
    lastName: 'Taylor',
    email: 'dtaylor@email.com',
    phone: '(555) 345-6780',
    preferredContact: 'PHONE' as const,
    source: 'PHONE_CALL',
    sourceDetails: 'Direct inquiry',
    status: 'LOST',
    stage: 'LOST',
    patientType: 'NEW_PATIENT',
    treatmentInterest: 'Invisalign',
    primaryConcern: 'Lost - decided treatment is not affordable right now.',
    lostReason: 'Budget constraints',
  },
];

// Activity types for lead interactions (matches Prisma LeadActivityType)
const ACTIVITY_TYPES = [
  'CALL',
  'EMAIL',
  'TEXT',
  'MEETING',
  'NOTE',
  'STATUS_CHANGE',
  'STAGE_CHANGE',
] as const;

/**
 * Seed CRM/Lead data
 */
export async function seedCRM(ctx: SeedContext): Promise<void> {
  const { db, idTracker, logger } = ctx;
  const clinicIds = idTracker.getAll('Clinic');

  logger.startArea('CRM');

  if (clinicIds.length === 0) {
    logger.warn('No clinics found, skipping CRM seeding');
    logger.endArea('CRM', 0);
    return;
  }

  let totalCreated = 0;

  for (const clinicId of clinicIds) {
    const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
    logger.info(`Seeding CRM data for clinic: ${clinic?.name || clinicId}`);

    // Get staff members for assignment
    const staffMembers = await db.staffProfile.findMany({
      where: withSoftDelete({ clinicId }),
      take: 5,
    });

    // Get admin user for activity tracking
    const adminUser = await db.user.findFirst({
      where: { clinicId, role: { in: ['clinic_admin', 'front_desk'] } },
    });

    let leadCount = 0;
    let activityCount = 0;
    let taskCount = 0;

    for (const leadData of SAMPLE_LEADS) {
      // Check if lead already exists
      const existingLead = await db.lead.findFirst({
        where: {
          clinicId,
          email: leadData.email,
        },
      });

      if (existingLead) {
        idTracker.add('Lead', existingLead.id, clinicId);
        continue;
      }

      // Assign to random staff member
      const assignedStaff = staffMembers[Math.floor(Math.random() * staffMembers.length)];

      // Calculate dates based on status
      const now = new Date();
      const daysAgo = leadData.status === 'NEW'
        ? Math.floor(Math.random() * 3) // 0-3 days ago
        : leadData.status === 'IN_PROGRESS'
        ? Math.floor(Math.random() * 14) + 3 // 3-17 days ago
        : Math.floor(Math.random() * 30) + 14; // 14-44 days ago

      const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const lastContactedAt = leadData.status !== 'NEW'
        ? new Date(now.getTime() - Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000)
        : null;

      const lead = await db.lead.create({
        data: {
          clinicId,
          firstName: leadData.firstName,
          lastName: leadData.lastName,
          email: leadData.email,
          phone: leadData.phone,
          preferredContact: leadData.preferredContact,
          source: leadData.source as typeof LEAD_SOURCES[number],
          sourceDetails: leadData.sourceDetails,
          status: leadData.status as typeof LEAD_STATUSES[number],
          stage: leadData.stage as typeof LEAD_STAGES[number],
          patientType: leadData.patientType as 'NEW_PATIENT' | 'RETURNING_PATIENT' | 'TRANSFER_PATIENT',
          treatmentInterest: leadData.treatmentInterest,
          primaryConcern: leadData.primaryConcern,
          lostReason: 'lostReason' in leadData ? leadData.lostReason : undefined,
          assignedToId: assignedStaff?.id,
          createdAt,
          updatedAt: new Date(),
          deletedAt: null,
        },
      });

      idTracker.add('Lead', lead.id, clinicId);
      leadCount++;
      totalCreated++;

      // Create activities for non-new leads
      if (leadData.status !== 'NEW' && adminUser?.id) {
        const activities = generateLeadActivities(
          lead.id,
          clinicId,
          leadData.stage,
          adminUser.id,
          createdAt
        );

        for (const activityData of activities) {
          await db.leadActivity.create({
            data: {
              clinicId: activityData.clinicId,
              leadId: activityData.leadId,
              type: activityData.type,
              title: activityData.title,
              description: activityData.description,
              performedById: activityData.performedById,
              createdAt: activityData.createdAt,
            },
          });
          activityCount++;
          totalCreated++;
        }
      }

      // Create follow-up tasks for in-progress leads
      if (leadData.status === 'IN_PROGRESS') {
        const tasks = generateLeadTasks(
          lead.id,
          clinicId,
          leadData.stage,
          assignedStaff?.id
        );

        for (const taskData of tasks) {
          await db.leadTask.create({ data: taskData });
          taskCount++;
          totalCreated++;
        }
      }
    }

    logger.info(`  Created ${leadCount} leads, ${activityCount} activities, ${taskCount} tasks`);
  }

  logger.success(`CRM seeding complete: ${totalCreated} records created`);
  logger.endArea('CRM', totalCreated);
}

/**
 * Generate activities for a lead based on stage
 */
function generateLeadActivities(
  leadId: string,
  clinicId: string,
  stage: string,
  performedById: string,
  leadCreatedAt?: Date
) {
  const activities: Array<{
    clinicId: string;
    leadId: string;
    type: typeof ACTIVITY_TYPES[number];
    title: string;
    description?: string;
    performedById: string;
    createdAt: Date;
  }> = [];

  const now = new Date();
  const startDate = leadCreatedAt || new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Initial inquiry
  activities.push({
    clinicId,
    leadId,
    type: 'NOTE',
    title: 'New lead received',
    description: 'Lead entered system from inquiry',
    performedById,
    createdAt: startDate,
  });

  // If contacted or beyond
  if (['CONTACTED', 'CONSULTATION_SCHEDULED', 'CONSULTATION_COMPLETED', 'PENDING_DECISION', 'TREATMENT_ACCEPTED', 'TREATMENT_STARTED'].includes(stage)) {
    activities.push({
      clinicId,
      leadId,
      type: 'CALL',
      title: 'Initial contact call',
      description: 'Called to follow up on inquiry. Left voicemail.',
      performedById,
      createdAt: new Date(startDate.getTime() + 1 * 24 * 60 * 60 * 1000),
    });

    activities.push({
      clinicId,
      leadId,
      type: 'CALL',
      title: 'Follow-up call - Connected',
      description: 'Spoke with lead. Answered questions about treatment options.',
      performedById,
      createdAt: new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000),
    });
  }

  // If consultation scheduled or beyond
  if (['CONSULTATION_SCHEDULED', 'CONSULTATION_COMPLETED', 'PENDING_DECISION', 'TREATMENT_ACCEPTED', 'TREATMENT_STARTED'].includes(stage)) {
    activities.push({
      clinicId,
      leadId,
      type: 'EMAIL',
      title: 'Consultation confirmation sent',
      description: 'Sent appointment confirmation email with pre-visit instructions.',
      performedById,
      createdAt: new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000),
    });
  }

  // If consultation completed or beyond
  if (['CONSULTATION_COMPLETED', 'PENDING_DECISION', 'TREATMENT_ACCEPTED', 'TREATMENT_STARTED'].includes(stage)) {
    activities.push({
      clinicId,
      leadId,
      type: 'MEETING',
      title: 'Consultation completed',
      description: 'Conducted initial consultation. Records taken, treatment options discussed.',
      performedById,
      createdAt: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
    });
  }

  // If pending decision or beyond (treatment plan presented)
  if (['PENDING_DECISION', 'TREATMENT_ACCEPTED', 'TREATMENT_STARTED'].includes(stage)) {
    activities.push({
      clinicId,
      leadId,
      type: 'EMAIL',
      title: 'Treatment plan sent',
      description: 'Emailed detailed treatment plan with cost breakdown and financing options.',
      performedById,
      createdAt: new Date(startDate.getTime() + 8 * 24 * 60 * 60 * 1000),
    });
  }

  // If treatment started (converted)
  if (stage === 'TREATMENT_STARTED') {
    activities.push({
      clinicId,
      leadId,
      type: 'STATUS_CHANGE',
      title: 'Lead converted to patient',
      description: 'Patient accepted treatment plan and signed contract.',
      performedById,
      createdAt: new Date(startDate.getTime() + 10 * 24 * 60 * 60 * 1000),
    });
  }

  return activities;
}

/**
 * Generate tasks for in-progress leads
 */
function generateLeadTasks(
  leadId: string,
  clinicId: string,
  stage: string,
  assignedToId?: string
) {
  const tasks: Array<{
    clinicId: string;
    leadId: string;
    title: string;
    description?: string;
    dueDate: Date;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    assignedToId?: string;
  }> = [];

  const now = new Date();

  if (stage === 'CONTACTED') {
    tasks.push({
      clinicId,
      leadId,
      title: 'Schedule consultation',
      description: 'Follow up to schedule initial consultation appointment',
      dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      priority: 'HIGH',
      status: 'PENDING',
      assignedToId,
    });
  }

  if (stage === 'CONSULTATION_SCHEDULED') {
    tasks.push({
      clinicId,
      leadId,
      title: 'Send pre-consultation paperwork',
      description: 'Email patient forms and medical history questionnaire',
      dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      priority: 'MEDIUM',
      status: 'PENDING',
      assignedToId,
    });
  }

  if (stage === 'CONSULTATION_COMPLETED') {
    tasks.push({
      clinicId,
      leadId,
      title: 'Prepare treatment plan',
      description: 'Create detailed treatment plan based on consultation findings',
      dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      assignedToId,
    });
  }

  if (stage === 'PENDING_DECISION') {
    tasks.push({
      clinicId,
      leadId,
      title: 'Follow up on treatment plan',
      description: 'Call to answer questions and address any concerns',
      dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      priority: 'HIGH',
      status: 'PENDING',
      assignedToId,
    });
  }

  if (stage === 'TREATMENT_ACCEPTED') {
    tasks.push({
      clinicId,
      leadId,
      title: 'Finalize payment arrangements',
      description: 'Review financing options and finalize payment plan',
      dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      assignedToId,
    });
  }

  return tasks;
}

/**
 * Clear CRM data
 */
export async function clearCRM(ctx: SeedContext): Promise<void> {
  const { db, logger } = ctx;

  logger.info('Clearing CRM data...');

  // Delete in reverse dependency order
  // Lead-related models
  await db.leadTask.deleteMany({});
  await db.leadActivity.deleteMany({});
  await db.lead.deleteMany({});

  // Referral-related models
  await db.referralLetter.deleteMany({});
  await db.referringProvider.deleteMany({});

  logger.info('  CRM data cleared');
}
