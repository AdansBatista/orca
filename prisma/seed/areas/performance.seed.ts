import type { SeedContext } from '../types';

// ============================================================================
// PERFORMANCE & TRAINING SEED DATA
// ============================================================================

const GOAL_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'] as const;
const REVIEW_TYPES = ['ANNUAL', 'SEMI_ANNUAL', 'QUARTERLY', 'PROBATIONARY', 'PERFORMANCE_IMPROVEMENT', 'PROMOTION', 'SPECIAL'] as const;
const REVIEW_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'COMPLETED', 'CANCELLED'] as const;
const TRAINING_STATUSES = ['ASSIGNED', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'WAIVED'] as const;
const RECOGNITION_TYPES = ['KUDOS', 'EMPLOYEE_OF_MONTH', 'YEARS_OF_SERVICE', 'ACHIEVEMENT', 'PEER_RECOGNITION', 'PATIENT_COMPLIMENT', 'OTHER'] as const;

// Sample data
const GOAL_TITLES = [
  'Complete Advanced Orthodontics Certification',
  'Improve patient satisfaction scores by 10%',
  'Reduce appointment wait times',
  'Master new practice management software',
  'Complete leadership training program',
  'Achieve CPR recertification',
  'Mentor new team members',
  'Implement new sterilization protocols',
  'Improve documentation accuracy',
  'Attend industry conference',
];

const TRAINING_COURSES = [
  { name: 'HIPAA Compliance Training', category: 'Compliance', required: true },
  { name: 'Infection Control Protocols', category: 'Clinical', required: true },
  { name: 'CPR/BLS Certification', category: 'Safety', required: true },
  { name: 'Patient Communication Skills', category: 'Soft Skills', required: false },
  { name: 'Practice Management Software', category: 'Technical', required: false },
  { name: 'Orthodontic Updates 2024', category: 'Clinical', required: false },
  { name: 'Workplace Safety', category: 'Safety', required: true },
  { name: 'OSHA Compliance', category: 'Compliance', required: true },
  { name: 'Customer Service Excellence', category: 'Soft Skills', required: false },
  { name: 'Digital Imaging Techniques', category: 'Technical', required: false },
];

const CE_COURSES = [
  { name: 'Modern Orthodontic Techniques', provider: 'AAO', category: 'Clinical', credits: 8 },
  { name: 'Invisalign Advanced Training', provider: 'Align Technology', category: 'Clinical', credits: 6 },
  { name: 'Dental Radiology Update', provider: 'ADA', category: 'Radiology', credits: 4 },
  { name: 'Infection Prevention in Dentistry', provider: 'CDC', category: 'Compliance', credits: 3 },
  { name: 'Patient Management Strategies', provider: 'Dental Academy', category: 'Practice Management', credits: 2 },
  { name: 'TMJ Disorders Overview', provider: 'AAO', category: 'Clinical', credits: 5 },
  { name: 'Pediatric Orthodontics', provider: 'AAPD', category: 'Clinical', credits: 6 },
  { name: 'Practice Ethics and Law', provider: 'State Board', category: 'Ethics', credits: 2 },
];

const RECOGNITION_TITLES = [
  'Outstanding Patient Care',
  'Team Player of the Month',
  'Going Above and Beyond',
  'Excellent Communication Skills',
  'Problem Solver Award',
  'Perfect Attendance',
  'Patient Compliment Recognition',
  'Leadership Excellence',
  'Innovation Award',
  'Mentorship Recognition',
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function randomItem<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

// ============================================================================
// PERFORMANCE SEED FUNCTION
// ============================================================================

/**
 * Seed performance and training data for staff profiles.
 * Creates goals, reviews, training records, CE credits, and recognitions.
 */
export async function seedPerformance(ctx: SeedContext): Promise<void> {
  const { db, idTracker, logger } = ctx;
  const clinicIds = idTracker.getAll('Clinic');

  logger.startArea('Performance & Training');

  let totalGoals = 0;
  let totalReviews = 0;
  let totalTraining = 0;
  let totalCECredits = 0;
  let totalRecognitions = 0;
  let totalMetrics = 0;

  for (const clinicId of clinicIds) {
    const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
    logger.info(`Seeding performance data for clinic: ${clinic?.name || clinicId}`);

    // Get staff profiles for this clinic
    const staffProfiles = await db.staffProfile.findMany({
      where: { clinicId },
      select: { id: true, firstName: true, lastName: true, isProvider: true, hireDate: true },
    });

    if (staffProfiles.length === 0) {
      logger.warn('  No staff profiles found, skipping performance seed');
      continue;
    }

    // Get a user for createdBy
    const existingUserIds = idTracker.getByClinic('User', clinicId);
    const createdBy = existingUserIds.length > 0 ? existingUserIds[0] : undefined;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ========================================================================
    // 1. Create Role Templates (if not exists)
    // ========================================================================
    const existingTemplates = await db.roleTemplate.count();
    if (existingTemplates === 0) {
      await createRoleTemplates(db);
      logger.info('  Created role templates');
    }

    // ========================================================================
    // 2. Create Staff Goals
    // ========================================================================
    for (const staff of staffProfiles) {
      const goalCount = randomInt(2, 4);

      for (let i = 0; i < goalCount; i++) {
        const status = randomItem(GOAL_STATUSES);
        const createdAt = addDays(today, -randomInt(30, 180));
        const targetDate = addDays(createdAt, randomInt(60, 180));

        let completedDate = null;
        let progress = 0;

        switch (status) {
          case 'COMPLETED':
            completedDate = addDays(createdAt, randomInt(30, 150));
            progress = 100;
            break;
          case 'IN_PROGRESS':
            progress = randomInt(20, 80);
            break;
          case 'NOT_STARTED':
            progress = 0;
            break;
          case 'ON_HOLD':
            progress = randomInt(10, 50);
            break;
          case 'CANCELLED':
            progress = randomInt(0, 30);
            break;
        }

        await db.staffGoal.create({
          data: {
            staffProfileId: staff.id,
            clinicId,
            title: randomItem(GOAL_TITLES),
            description: `Goal set during ${createdAt.getFullYear()} performance planning.`,
            category: randomItem(['Professional Development', 'Clinical Skills', 'Leadership', 'Compliance', 'Patient Care']),
            status,
            priority: randomInt(1, 3), // 1=low, 2=medium, 3=high
            startDate: createdAt,
            targetDate,
            completedDate,
            progress,
            milestones: [{ target: '100%', current: `${progress}%` }],
            notes: status === 'ON_HOLD' ? 'Paused due to workload' : null,
            createdBy,
            createdAt,
          },
        });
        totalGoals++;
      }
    }
    logger.info(`  Created ${totalGoals} goals`);

    // ========================================================================
    // 3. Create Performance Reviews
    // ========================================================================
    for (const staff of staffProfiles) {
      // Create 1-2 past reviews and possibly 1 upcoming
      const pastReviewCount = randomInt(1, 2);

      for (let i = 0; i < pastReviewCount; i++) {
        const reviewPeriodStart = addMonths(today, -(12 * (i + 1)));
        const reviewPeriodEnd = addMonths(reviewPeriodStart, 12);
        const reviewDate = addDays(reviewPeriodEnd, randomInt(7, 30));

        await db.performanceReview.create({
          data: {
            staffProfileId: staff.id,
            clinicId,
            reviewType: i === 0 ? 'ANNUAL' : randomItem(['SEMI_ANNUAL', 'QUARTERLY']),
            status: 'COMPLETED',
            reviewPeriodStart,
            reviewPeriodEnd,
            reviewDate,
            reviewerId: createdBy || null,
            overallRating: randomInt(3, 5),
            ratings: { quality: randomInt(3, 5), teamwork: randomInt(3, 5), communication: randomInt(3, 5) },
            strengthsNotes: 'Excellent patient communication, team collaboration, and technical skills.',
            improvementNotes: 'Time management and documentation timeliness could be improved.',
            newGoals: [{ title: 'Continue professional development' }, { title: 'Mentor junior staff' }],
            employeeComments: 'I appreciate the feedback and look forward to continued growth.',
            completedAt: addDays(reviewDate, randomInt(1, 7)),
          },
        });
        totalReviews++;
      }

      // Create upcoming/scheduled review for some staff
      if (Math.random() < 0.5) {
        const reviewPeriodStart = addMonths(today, -11);
        const reviewPeriodEnd = addMonths(today, 1);
        const reviewDate = addDays(today, randomInt(7, 30));

        await db.performanceReview.create({
          data: {
            staffProfileId: staff.id,
            clinicId,
            reviewType: 'ANNUAL',
            status: randomItem(['SCHEDULED', 'IN_PROGRESS']),
            reviewPeriodStart,
            reviewPeriodEnd,
            reviewDate,
            reviewerId: createdBy || null,
          },
        });
        totalReviews++;
      }
    }
    logger.info(`  Created ${totalReviews} reviews`);

    // ========================================================================
    // 4. Create Training Records
    // ========================================================================
    for (const staff of staffProfiles) {
      // Assign required training to all staff
      for (const course of TRAINING_COURSES.filter(c => c.required)) {
        const assignedAt = addDays(today, -randomInt(60, 180));
        const dueDate = addDays(assignedAt, 30);
        const isPastDue = dueDate < today;
        const status = isPastDue
          ? (Math.random() < 0.8 ? 'COMPLETED' as const : 'OVERDUE' as const)
          : randomItem(['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'] as const);

        await db.trainingRecord.create({
          data: {
            staffProfileId: staff.id,
            clinicId,
            name: course.name,
            description: `Required ${course.category.toLowerCase()} training.`,
            category: course.category,
            provider: 'Internal',
            assignedDate: assignedAt,
            dueDate,
            status,
            completedDate: status === 'COMPLETED' ? addDays(assignedAt, randomInt(7, 25)) : null,
            score: status === 'COMPLETED' ? randomInt(80, 100) : null,
            passed: status === 'COMPLETED' ? true : null,
            expirationDate: status === 'COMPLETED' ? addMonths(today, 12) : null,
            notes: course.required ? 'Required compliance training' : null,
            createdBy,
          },
        });
        totalTraining++;
      }

      // Assign some optional training
      const optionalCourses = TRAINING_COURSES.filter(c => !c.required);
      const optionalCount = randomInt(1, 3);
      for (let i = 0; i < optionalCount; i++) {
        const course = randomItem(optionalCourses);
        const status = randomItem(TRAINING_STATUSES.filter(s => s !== 'OVERDUE'));

        await db.trainingRecord.create({
          data: {
            staffProfileId: staff.id,
            clinicId,
            name: course.name,
            description: `Optional ${course.category.toLowerCase()} training for professional development.`,
            category: course.category,
            provider: 'External',
            assignedDate: addDays(today, -randomInt(7, 30)),
            dueDate: addDays(today, randomInt(30, 90)),
            status,
            completedDate: status === 'COMPLETED' ? addDays(today, -randomInt(7, 60)) : null,
            score: status === 'COMPLETED' ? randomInt(75, 100) : null,
            passed: status === 'COMPLETED' ? true : null,
            createdBy,
          },
        });
        totalTraining++;
      }
    }
    logger.info(`  Created ${totalTraining} training records`);

    // ========================================================================
    // 5. Create CE Credits (for providers)
    // ========================================================================
    const providers = staffProfiles.filter(s => s.isProvider);
    for (const provider of providers) {
      const ceCount = randomInt(3, 6);

      for (let i = 0; i < ceCount; i++) {
        const course = randomItem(CE_COURSES);
        const completionDate = addDays(today, -randomInt(30, 365));

        const isVerified = Math.random() < 0.7;
        await db.cECredit.create({
          data: {
            staffProfileId: provider.id,
            clinicId,
            courseName: course.name,
            provider: course.provider,
            category: course.category,
            credits: course.credits,
            creditType: 'hours',
            completionDate,
            reportingPeriodStart: addMonths(completionDate, -12),
            reportingPeriodEnd: addMonths(completionDate, 12),
            verificationCode: `CE-${randomInt(10000, 99999)}`,
            isVerified,
            verifiedBy: isVerified ? createdBy : null,
            verifiedAt: isVerified ? addDays(completionDate, randomInt(1, 14)) : null,
            notes: null,
          },
        });
        totalCECredits++;
      }
    }

    // Also give non-providers some CE credits (dental assistants, etc.)
    for (const staff of staffProfiles.filter(s => !s.isProvider).slice(0, 3)) {
      const ceCount = randomInt(1, 3);

      for (let i = 0; i < ceCount; i++) {
        const course = randomItem(CE_COURSES);
        const completionDate = addDays(today, -randomInt(30, 365));

        const isVerified = Math.random() < 0.5;
        await db.cECredit.create({
          data: {
            staffProfileId: staff.id,
            clinicId,
            courseName: course.name,
            provider: course.provider,
            category: course.category,
            credits: course.credits,
            creditType: 'hours',
            completionDate,
            verificationCode: `CE-${randomInt(10000, 99999)}`,
            isVerified,
          },
        });
        totalCECredits++;
      }
    }
    logger.info(`  Created ${totalCECredits} CE credits`);

    // ========================================================================
    // 6. Create Recognitions
    // ========================================================================
    for (const staff of staffProfiles) {
      // Each staff gets 0-3 recognitions
      const recognitionCount = randomInt(0, 3);

      for (let i = 0; i < recognitionCount; i++) {
        const type = randomItem(RECOGNITION_TYPES);
        const recognitionDate = addDays(today, -randomInt(7, 180));

        // Get a random staff member as giver (not self)
        const otherStaff = staffProfiles.filter(s => s.id !== staff.id);
        const giver = otherStaff.length > 0 ? randomItem(otherStaff) : null;

        await db.recognition.create({
          data: {
            staffProfileId: staff.id,
            clinicId,
            type,
            title: type === 'EMPLOYEE_OF_MONTH'
              ? `Employee of the Month - ${recognitionDate.toLocaleString('default', { month: 'long' })} ${recognitionDate.getFullYear()}`
              : randomItem(RECOGNITION_TITLES),
            description: type === 'PATIENT_COMPLIMENT'
              ? 'Patient specifically mentioned excellent care and communication.'
              : type === 'PEER_RECOGNITION'
                ? `Recognized by colleagues for outstanding teamwork.`
                : 'Demonstrated exceptional performance and dedication.',
            recognitionDate,
            givenById: giver ? (existingUserIds.find(u => u !== createdBy) || createdBy) : createdBy,
            givenByName: giver ? `${giver.firstName} ${giver.lastName}` : 'Management',
            isAnonymous: Math.random() < 0.1,
            isPublic: Math.random() < 0.8,
            awardValue: type === 'EMPLOYEE_OF_MONTH' ? 100 : null,
            awardDescription: type === 'EMPLOYEE_OF_MONTH' ? 'Gift card award' : null,
          },
        });
        totalRecognitions++;
      }
    }
    logger.info(`  Created ${totalRecognitions} recognitions`);

    // ========================================================================
    // 7. Create Performance Metrics (aggregated)
    // ========================================================================
    for (const staff of staffProfiles) {
      // Create monthly metrics for past 6 months
      for (let monthOffset = -6; monthOffset <= 0; monthOffset++) {
        const periodStart = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
        const periodEnd = new Date(today.getFullYear(), today.getMonth() + monthOffset + 1, 0);

        const value = randomInt(75, 100);
        await db.performanceMetric.create({
          data: {
            staffProfileId: staff.id,
            clinicId,
            metricType: 'MONTHLY_SUMMARY',
            metricName: 'Overall Performance Score',
            periodStart,
            periodEnd,
            value,
            targetValue: 85,
            targetMet: value >= 85,
            unit: 'score',
            notes: monthOffset === 0 ? 'Current period - in progress' : null,
            calculatedBy: 'system',
            createdBy,
          },
        });
        totalMetrics++;
      }
    }
    logger.info(`  Created ${totalMetrics} performance metrics`);
  }

  logger.endArea('Performance & Training', totalGoals + totalReviews + totalTraining + totalCECredits + totalRecognitions + totalMetrics);
}

/**
 * Create standard role templates
 */
async function createRoleTemplates(db: SeedContext['db']) {
  const templates = [
    {
      code: 'ORTHODONTIST',
      name: 'Orthodontist',
      description: 'Full clinical access for orthodontists',
      category: 'Clinical',
      permissions: ['patient:read', 'patient:write', 'treatment:read', 'treatment:write', 'schedule:read', 'schedule:write', 'imaging:read', 'imaging:write'],
      isActive: true,
      isIndustryStandard: true,
    },
    {
      code: 'CLINICAL_ASSISTANT',
      name: 'Clinical Assistant',
      description: 'Clinical support staff with limited access',
      category: 'Clinical',
      permissions: ['patient:read', 'treatment:read', 'schedule:read', 'imaging:read'],
      isActive: true,
      isIndustryStandard: true,
    },
    {
      code: 'FRONT_DESK',
      name: 'Front Desk',
      description: 'Patient scheduling and front office operations',
      category: 'Administrative',
      permissions: ['patient:read', 'patient:write', 'schedule:read', 'schedule:write', 'communication:read', 'communication:write'],
      isActive: true,
      isIndustryStandard: true,
    },
    {
      code: 'BILLING_SPECIALIST',
      name: 'Billing Specialist',
      description: 'Financial and billing operations',
      category: 'Administrative',
      permissions: ['patient:read', 'billing:read', 'billing:write', 'insurance:read', 'insurance:write', 'reports:read'],
      isActive: true,
      isIndustryStandard: true,
    },
    {
      code: 'OFFICE_MANAGER',
      name: 'Office Manager',
      description: 'Full administrative access for office management',
      category: 'Management',
      permissions: ['patient:read', 'patient:write', 'staff:read', 'staff:write', 'schedule:read', 'schedule:write', 'billing:read', 'billing:write', 'reports:read', 'reports:write'],
      isActive: true,
      isIndustryStandard: true,
    },
  ];

  for (const template of templates) {
    await db.roleTemplate.create({ data: template });
  }
}

/**
 * Clear all performance and training data
 */
export async function clearPerformance(ctx: SeedContext): Promise<void> {
  const { db, logger } = ctx;

  logger.info('Clearing performance & training data...');

  // Clear in correct order
  await db.recognition.deleteMany({});
  await db.cECredit.deleteMany({});
  await db.trainingRecord.deleteMany({});
  await db.performanceReview.deleteMany({});
  await db.staffGoal.deleteMany({});
  await db.performanceMetric.deleteMany({});
  await db.roleChangeHistory.deleteMany({});
  await db.roleTemplate.deleteMany({});

  logger.info('Performance & training data cleared');
}
