/**
 * Campaign Execution Service
 *
 * Core orchestrator for campaign execution. Handles:
 * - Processing event-triggered campaigns
 * - Processing scheduled campaigns
 * - Processing recurring campaigns
 * - Step orchestration (SEND, WAIT, CONDITION, BRANCH)
 * - Audience targeting and filtering
 *
 * This service works with the MessagingService to actually send messages.
 */

import { db } from '@/lib/db';
import { getMessagingService } from '../messaging';
import type {
  CampaignEventPayload,
  ExecutionContext,
  StepExecutionResult,
  CampaignProcessingResult,
  AudienceCriteria,
  StepCondition,
  RecurrenceConfig,
} from './types';

/**
 * Campaign Execution Service Class
 */
class CampaignExecutionService {
  /**
   * Process an event and trigger matching campaigns
   *
   * Called when a business event occurs (e.g., appointment booked, payment received)
   */
  async processEvent(payload: CampaignEventPayload): Promise<CampaignProcessingResult[]> {
    const { event, clinicId, patientId, timestamp, data } = payload;
    const results: CampaignProcessingResult[] = [];

    console.log('[CampaignExecutionService] Processing event:', { event, clinicId, patientId });

    try {
      // Find active campaigns that trigger on this event
      const campaigns = await db.campaign.findMany({
        where: {
          clinicId,
          status: 'ACTIVE',
          triggerType: 'EVENT',
          triggerEvent: event,
          deletedAt: null,
        },
        include: {
          steps: {
            orderBy: { stepOrder: 'asc' },
          },
        },
      });

      if (campaigns.length === 0) {
        console.log('[CampaignExecutionService] No campaigns found for event:', event);
        return results;
      }

      console.log(`[CampaignExecutionService] Found ${campaigns.length} campaigns for event`);

      // Process each matching campaign
      for (const campaign of campaigns) {
        // Check if patient matches audience criteria
        const matchesAudience = await this.checkAudienceCriteria(
          patientId,
          clinicId,
          campaign.audience as AudienceCriteria | null,
          campaign.excludeCriteria as AudienceCriteria | null
        );

        if (!matchesAudience) {
          console.log(
            `[CampaignExecutionService] Patient ${patientId} does not match audience for campaign ${campaign.id}`
          );
          continue;
        }

        // Check if patient already has a pending send for this campaign
        const existingSend = await db.campaignSend.findFirst({
          where: {
            campaignId: campaign.id,
            patientId,
            status: 'PENDING',
          },
        });

        if (existingSend) {
          console.log(
            `[CampaignExecutionService] Patient ${patientId} already has pending send for campaign ${campaign.id}`
          );
          continue;
        }

        // Create execution context
        const context: ExecutionContext = {
          campaignId: campaign.id,
          clinicId,
          patientId,
          startedAt: timestamp,
          triggeredBy: 'event',
          triggerData: data,
          variables: await this.buildVariables(patientId, clinicId, data),
        };

        // Start campaign execution from first step
        const result = await this.executeCampaignForPatient(campaign, context);
        results.push(result);
      }
    } catch (error) {
      console.error('[CampaignExecutionService] Error processing event:', error);
    }

    return results;
  }

  /**
   * Process scheduled campaigns that are due to run
   *
   * Called by cron job to check for scheduled campaigns
   */
  async processScheduledCampaigns(): Promise<CampaignProcessingResult[]> {
    const results: CampaignProcessingResult[] = [];
    const now = new Date();

    try {
      // Find campaigns scheduled to run now
      const campaigns = await db.campaign.findMany({
        where: {
          status: 'ACTIVE',
          triggerType: 'SCHEDULED',
          triggerSchedule: { lte: now },
          deletedAt: null,
        },
        include: {
          steps: {
            orderBy: { stepOrder: 'asc' },
          },
        },
      });

      console.log(`[CampaignExecutionService] Found ${campaigns.length} scheduled campaigns to process`);

      for (const campaign of campaigns) {
        const result = await this.executeCampaignForAudience(campaign);
        results.push(result);

        // Mark campaign as completed (one-time scheduled campaigns)
        await db.campaign.update({
          where: { id: campaign.id },
          data: {
            status: 'COMPLETED',
            completedAt: now,
          },
        });
      }
    } catch (error) {
      console.error('[CampaignExecutionService] Error processing scheduled campaigns:', error);
    }

    return results;
  }

  /**
   * Process recurring campaigns based on their schedule
   *
   * Called by cron job to check for recurring campaigns
   */
  async processRecurringCampaigns(): Promise<CampaignProcessingResult[]> {
    const results: CampaignProcessingResult[] = [];
    const now = new Date();

    try {
      // Find active recurring campaigns
      const campaigns = await db.campaign.findMany({
        where: {
          status: 'ACTIVE',
          triggerType: 'RECURRING',
          deletedAt: null,
        },
        include: {
          steps: {
            orderBy: { stepOrder: 'asc' },
          },
        },
      });

      console.log(`[CampaignExecutionService] Checking ${campaigns.length} recurring campaigns`);

      for (const campaign of campaigns) {
        const recurrence = campaign.triggerRecurrence as RecurrenceConfig | null;
        if (!recurrence) continue;

        // Check if this campaign should run now
        if (!this.shouldRunRecurring(recurrence, now)) {
          continue;
        }

        // Check if already ran today/this period
        const lastRun = await this.getLastCampaignRun(campaign.id);
        if (lastRun && this.isSamePeriod(recurrence.frequency, lastRun, now)) {
          continue;
        }

        console.log(`[CampaignExecutionService] Running recurring campaign: ${campaign.id}`);

        const result = await this.executeCampaignForAudience(campaign);
        results.push(result);
      }
    } catch (error) {
      console.error('[CampaignExecutionService] Error processing recurring campaigns:', error);
    }

    return results;
  }

  /**
   * Process pending campaign sends
   *
   * Handles WAIT steps that have completed their wait period
   */
  async processPendingSends(): Promise<{ processed: number; sent: number; failed: number }> {
    const now = new Date();
    let processed = 0;
    let sent = 0;
    let failed = 0;

    try {
      // Find pending sends that are scheduled for now or earlier
      const pendingSends = await db.campaignSend.findMany({
        where: {
          status: 'PENDING',
          scheduledAt: { lte: now },
        },
        include: {
          campaign: {
            include: {
              steps: {
                orderBy: { stepOrder: 'asc' },
              },
            },
          },
          step: {
            include: {
              template: true,
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
        },
        take: 100, // Process in batches
      });

      console.log(`[CampaignExecutionService] Processing ${pendingSends.length} pending sends`);

      for (const send of pendingSends) {
        processed++;

        // Skip if campaign is no longer active
        if (send.campaign.status !== 'ACTIVE') {
          await this.cancelSend(send.id, 'Campaign no longer active');
          continue;
        }

        // Execute the step
        const context: ExecutionContext = {
          campaignId: send.campaignId,
          clinicId: send.clinicId,
          patientId: send.patientId,
          currentStepId: send.stepId,
          startedAt: send.createdAt,
          triggeredBy: 'schedule',
          variables: await this.buildVariables(send.patientId, send.clinicId, {}),
        };

        const result = await this.executeStep(send.step, context, send.patient);

        if (result.success) {
          // Update send status
          await db.campaignSend.update({
            where: { id: send.id },
            data: {
              status: 'SENT',
              sentAt: now,
              messageId: result.messageId,
            },
          });

          // Update campaign stats
          await this.incrementCampaignStats(send.campaignId, 'sent');

          // Schedule next step if exists
          if (result.nextStepId) {
            await this.scheduleNextStep(context, result.nextStepId, send.campaign.steps);
          }

          sent++;
        } else {
          await db.campaignSend.update({
            where: { id: send.id },
            data: {
              status: result.skipReason ? 'SKIPPED' : 'FAILED',
              failedAt: now,
              errorMessage: result.error?.message,
              skipReason: result.skipReason,
            },
          });

          await this.incrementCampaignStats(send.campaignId, 'failed');
          failed++;
        }
      }
    } catch (error) {
      console.error('[CampaignExecutionService] Error processing pending sends:', error);
    }

    return { processed, sent, failed };
  }

  /**
   * Execute a campaign for a single patient (event-triggered)
   */
  private async executeCampaignForPatient(
    campaign: {
      id: string;
      clinicId: string;
      steps: Array<{
        id: string;
        stepOrder: number;
        name: string;
        type: string;
        channel: string | null;
        templateId: string | null;
        waitDuration: number | null;
        waitUntil: string | null;
        condition: unknown;
        branches: unknown;
        nextStepId: string | null;
      }>;
    },
    context: ExecutionContext
  ): Promise<CampaignProcessingResult> {
    const result: CampaignProcessingResult = {
      campaignId: campaign.id,
      processed: 1,
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    if (campaign.steps.length === 0) {
      result.skipped = 1;
      return result;
    }

    // Get patient data
    const patient = await db.patient.findUnique({
      where: { id: context.patientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    if (!patient) {
      result.failed = 1;
      result.errors.push({
        patientId: context.patientId,
        stepId: campaign.steps[0].id,
        error: 'Patient not found',
      });
      return result;
    }

    // Start with first step
    const firstStep = campaign.steps[0];
    context.currentStepId = firstStep.id;

    // Increment recipient count
    await this.incrementCampaignStats(campaign.id, 'recipients');

    // Schedule or execute the first step
    await this.scheduleStep(context, firstStep, campaign.steps);

    result.sent = 1;
    return result;
  }

  /**
   * Execute a campaign for all matching audience members (scheduled/recurring)
   */
  private async executeCampaignForAudience(
    campaign: {
      id: string;
      clinicId: string;
      audience: unknown;
      excludeCriteria: unknown;
      steps: Array<{
        id: string;
        stepOrder: number;
        name: string;
        type: string;
        channel: string | null;
        templateId: string | null;
        waitDuration: number | null;
        waitUntil: string | null;
        condition: unknown;
        branches: unknown;
        nextStepId: string | null;
      }>;
    }
  ): Promise<CampaignProcessingResult> {
    const result: CampaignProcessingResult = {
      campaignId: campaign.id,
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    if (campaign.steps.length === 0) {
      return result;
    }

    // Get matching patients
    const patients = await this.getAudiencePatients(
      campaign.clinicId,
      campaign.audience as AudienceCriteria | null,
      campaign.excludeCriteria as AudienceCriteria | null
    );

    console.log(`[CampaignExecutionService] Found ${patients.length} patients for campaign ${campaign.id}`);

    result.processed = patients.length;

    // Process each patient
    for (const patient of patients) {
      // Check for existing pending send
      const existingSend = await db.campaignSend.findFirst({
        where: {
          campaignId: campaign.id,
          patientId: patient.id,
          status: 'PENDING',
        },
      });

      if (existingSend) {
        result.skipped++;
        continue;
      }

      const context: ExecutionContext = {
        campaignId: campaign.id,
        clinicId: campaign.clinicId,
        patientId: patient.id,
        startedAt: new Date(),
        triggeredBy: 'schedule',
        variables: await this.buildVariables(patient.id, campaign.clinicId, {}),
      };

      // Schedule first step
      const firstStep = campaign.steps[0];
      await this.scheduleStep(context, firstStep, campaign.steps);

      // Increment recipient count
      await this.incrementCampaignStats(campaign.id, 'recipients');

      result.sent++;
    }

    return result;
  }

  /**
   * Schedule a step for execution
   */
  private async scheduleStep(
    context: ExecutionContext,
    step: {
      id: string;
      type: string;
      waitDuration: number | null;
      waitUntil: string | null;
    },
    allSteps: Array<{ id: string; stepOrder: number }>
  ): Promise<void> {
    // Calculate when to execute
    let scheduledAt = new Date();

    if (step.type === 'WAIT') {
      if (step.waitDuration) {
        // Wait duration in minutes
        scheduledAt = new Date(Date.now() + step.waitDuration * 60 * 1000);
      } else if (step.waitUntil) {
        // Parse dynamic expression (e.g., "2 days before appointment")
        scheduledAt = this.parseWaitUntil(step.waitUntil, context.triggerData);
      }

      // For WAIT steps, schedule the next step instead
      const currentIndex = allSteps.findIndex((s) => s.id === step.id);
      const nextStep = allSteps[currentIndex + 1];

      if (nextStep) {
        await db.campaignSend.create({
          data: {
            clinicId: context.clinicId,
            campaignId: context.campaignId,
            stepId: nextStep.id,
            patientId: context.patientId,
            status: 'PENDING',
            scheduledAt,
          },
        });
      }
    } else {
      // For SEND steps, schedule immediately or based on quiet hours
      await db.campaignSend.create({
        data: {
          clinicId: context.clinicId,
          campaignId: context.campaignId,
          stepId: step.id,
          patientId: context.patientId,
          status: 'PENDING',
          scheduledAt,
        },
      });
    }
  }

  /**
   * Schedule the next step in the workflow
   */
  private async scheduleNextStep(
    context: ExecutionContext,
    nextStepId: string,
    allSteps: Array<{ id: string; stepOrder: number; type: string; waitDuration: number | null; waitUntil: string | null }>
  ): Promise<void> {
    const nextStep = allSteps.find((s) => s.id === nextStepId);
    if (!nextStep) return;

    await this.scheduleStep(context, nextStep, allSteps);
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: {
      id: string;
      type: string;
      channel: string | null;
      templateId: string | null;
      condition: unknown;
      branches: unknown;
      nextStepId: string | null;
      template: {
        smsBody: string | null;
        emailSubject: string | null;
        emailBody: string | null;
        emailHtmlBody: string | null;
        pushTitle: string | null;
        pushBody: string | null;
        inAppTitle: string | null;
        inAppBody: string | null;
      } | null;
    },
    context: ExecutionContext,
    patient: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
    }
  ): Promise<StepExecutionResult> {
    switch (step.type) {
      case 'SEND':
        return this.executeSendStep(step, context, patient);

      case 'CONDITION':
        return this.executeConditionStep(step, context);

      case 'BRANCH':
        return this.executeBranchStep(step, context);

      case 'WAIT':
        // WAIT steps are handled by scheduling, not execution
        return { success: true, nextStepId: step.nextStepId };

      default:
        return {
          success: false,
          error: { code: 'UNKNOWN_STEP_TYPE', message: `Unknown step type: ${step.type}` },
        };
    }
  }

  /**
   * Execute a SEND step
   */
  private async executeSendStep(
    step: {
      channel: string | null;
      templateId: string | null;
      nextStepId: string | null;
      template: {
        smsBody: string | null;
        emailSubject: string | null;
        emailBody: string | null;
        emailHtmlBody: string | null;
        pushTitle: string | null;
        pushBody: string | null;
        inAppTitle: string | null;
        inAppBody: string | null;
      } | null;
    },
    context: ExecutionContext,
    patient: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
    }
  ): Promise<StepExecutionResult> {
    if (!step.channel || !step.template) {
      return {
        success: false,
        skipReason: 'No channel or template configured',
      };
    }

    // Check if patient has the required contact info
    const channel = step.channel as 'SMS' | 'EMAIL' | 'PUSH' | 'IN_APP';
    if (channel === 'SMS' && !patient.phone) {
      return { success: false, skipReason: 'Patient has no phone number' };
    }
    if (channel === 'EMAIL' && !patient.email) {
      return { success: false, skipReason: 'Patient has no email' };
    }

    // Get template content
    const { body, subject, htmlBody } = this.getTemplateContent(step.template, channel);
    if (!body) {
      return { success: false, skipReason: `Template has no content for ${channel}` };
    }

    // Send message
    const messagingService = getMessagingService();
    const result = await messagingService.sendMessage({
      clinicId: context.clinicId,
      patientId: patient.id,
      channel,
      templateId: step.templateId || undefined,
      subject,
      body,
      htmlBody,
      variables: context.variables as Record<string, string>,
      createdBy: 'campaign',
      relatedType: 'Campaign',
      relatedId: context.campaignId,
      tags: ['campaign'],
    });

    if (result.success) {
      return {
        success: true,
        messageId: result.messageId,
        nextStepId: step.nextStepId,
      };
    }

    return {
      success: false,
      error: result.error,
    };
  }

  /**
   * Execute a CONDITION step
   */
  private async executeConditionStep(
    step: {
      condition: unknown;
      nextStepId: string | null;
    },
    context: ExecutionContext
  ): Promise<StepExecutionResult> {
    const condition = step.condition as StepCondition | null;
    if (!condition) {
      return { success: true, nextStepId: step.nextStepId };
    }

    const passes = this.evaluateCondition(condition, context.variables);

    if (passes) {
      return { success: true, nextStepId: step.nextStepId };
    }

    // Condition failed - skip remaining steps
    return { success: true, nextStepId: null, skipReason: 'Condition not met' };
  }

  /**
   * Execute a BRANCH step
   */
  private async executeBranchStep(
    step: {
      branches: unknown;
      nextStepId: string | null;
    },
    context: ExecutionContext
  ): Promise<StepExecutionResult> {
    const branches = step.branches as Array<{ condition: StepCondition; nextStepId: string }> | null;

    if (!branches || branches.length === 0) {
      return { success: true, nextStepId: step.nextStepId };
    }

    // Find first matching branch
    for (const branch of branches) {
      if (this.evaluateCondition(branch.condition, context.variables)) {
        return { success: true, nextStepId: branch.nextStepId };
      }
    }

    // No branch matched - use default next step
    return { success: true, nextStepId: step.nextStepId };
  }

  /**
   * Evaluate a condition against variables
   */
  private evaluateCondition(condition: StepCondition, variables: Record<string, unknown>): boolean {
    const value = this.getNestedValue(variables, condition.field);

    switch (condition.operator) {
      case 'eq':
        return value === condition.value;
      case 'ne':
        return value !== condition.value;
      case 'gt':
        return typeof value === 'number' && value > (condition.value as number);
      case 'lt':
        return typeof value === 'number' && value < (condition.value as number);
      case 'gte':
        return typeof value === 'number' && value >= (condition.value as number);
      case 'lte':
        return typeof value === 'number' && value <= (condition.value as number);
      case 'contains':
        return typeof value === 'string' && value.includes(condition.value as string);
      case 'exists':
        return value !== undefined && value !== null;
      default:
        return false;
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key: string) => {
      if (current && typeof current === 'object') {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  /**
   * Check if a patient matches audience criteria
   */
  private async checkAudienceCriteria(
    patientId: string,
    clinicId: string,
    audience: AudienceCriteria | null,
    exclude: AudienceCriteria | null
  ): Promise<boolean> {
    // If no audience criteria, allow all
    if (!audience) return true;

    const patient = await db.patient.findUnique({
      where: { id: patientId },
      select: {
        isActive: true,
        email: true,
        phone: true,
        dateOfBirth: true,
      },
    });

    if (!patient) return false;

    // Check include criteria - use isActive for patient status
    if (audience.patientStatus?.length) {
      const isActive = patient.isActive;
      const status = isActive ? 'ACTIVE' : 'INACTIVE';
      if (!audience.patientStatus.includes(status)) return false;
    }

    if (audience.hasEmail && !patient.email) return false;
    if (audience.hasPhone && !patient.phone) return false;

    // Check communication opt-in - get from NotificationPreference
    if (audience.communicationOptIn) {
      const prefs = await db.notificationPreference.findFirst({
        where: { patientId },
        select: { marketingMessages: true },
      });
      if (!prefs?.marketingMessages) return false;
    }

    // Check exclude criteria
    if (exclude) {
      const isActive = patient.isActive;
      const status = isActive ? 'ACTIVE' : 'INACTIVE';
      if (exclude.patientStatus?.includes(status)) return false;
    }

    return true;
  }

  /**
   * Get all patients matching audience criteria
   */
  private async getAudiencePatients(
    clinicId: string,
    audience: AudienceCriteria | null,
    exclude: AudienceCriteria | null
  ): Promise<Array<{ id: string }>> {
    const where: Record<string, unknown> = {
      clinicId,
      deletedAt: null,
    };

    if (audience) {
      // Map status criteria to isActive field
      if (audience.patientStatus?.length) {
        if (audience.patientStatus.includes('ACTIVE') && !audience.patientStatus.includes('INACTIVE')) {
          where.isActive = true;
        } else if (audience.patientStatus.includes('INACTIVE') && !audience.patientStatus.includes('ACTIVE')) {
          where.isActive = false;
        }
        // If both or neither, don't filter on isActive
      }
      if (audience.hasEmail) {
        where.email = { not: null };
      }
      if (audience.hasPhone) {
        where.phone = { not: null };
      }
    }

    if (exclude?.patientStatus?.length) {
      if (exclude.patientStatus.includes('ACTIVE')) {
        where.isActive = false;
      } else if (exclude.patientStatus.includes('INACTIVE')) {
        where.isActive = true;
      }
    }

    return db.patient.findMany({
      where,
      select: { id: true },
      take: 1000, // Limit batch size
    });
  }

  /**
   * Build template variables for a patient
   */
  private async buildVariables(
    patientId: string,
    clinicId: string,
    triggerData: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const [patient, clinic] = await Promise.all([
      db.patient.findUnique({
        where: { id: patientId },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          dateOfBirth: true,
        },
      }),
      db.clinic.findUnique({
        where: { id: clinicId },
        select: {
          name: true,
          phone: true,
          email: true,
        },
      }),
    ]);

    return {
      patient: patient || {},
      clinic: clinic || {},
      ...triggerData,
    };
  }

  /**
   * Get template content for a channel
   */
  private getTemplateContent(
    template: {
      smsBody: string | null;
      emailSubject: string | null;
      emailBody: string | null;
      emailHtmlBody: string | null;
      pushTitle: string | null;
      pushBody: string | null;
      inAppTitle: string | null;
      inAppBody: string | null;
    },
    channel: 'SMS' | 'EMAIL' | 'PUSH' | 'IN_APP'
  ): { body: string | null; subject?: string; htmlBody?: string } {
    switch (channel) {
      case 'SMS':
        return { body: template.smsBody };
      case 'EMAIL':
        return {
          body: template.emailBody,
          subject: template.emailSubject || undefined,
          htmlBody: template.emailHtmlBody || undefined,
        };
      case 'PUSH':
        return { body: template.pushBody, subject: template.pushTitle || undefined };
      case 'IN_APP':
        return { body: template.inAppBody, subject: template.inAppTitle || undefined };
      default:
        return { body: null };
    }
  }

  /**
   * Check if recurring campaign should run now
   */
  private shouldRunRecurring(recurrence: RecurrenceConfig, now: Date): boolean {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const [scheduleHour, scheduleMinute] = recurrence.time.split(':').map(Number);

    // Check if within the scheduled time window (within 5 minutes)
    const scheduleMinutes = scheduleHour * 60 + scheduleMinute;
    const currentMinutes = currentHour * 60 + currentMinute;
    if (Math.abs(currentMinutes - scheduleMinutes) > 5) {
      return false;
    }

    const dayOfWeek = now.getDay();
    const dayOfMonth = now.getDate();

    switch (recurrence.frequency) {
      case 'daily':
        return true;

      case 'weekly':
        return recurrence.days?.includes(dayOfWeek) ?? true;

      case 'monthly':
        return recurrence.days?.includes(dayOfMonth) ?? true;

      default:
        return false;
    }
  }

  /**
   * Get the last time a campaign was run
   */
  private async getLastCampaignRun(campaignId: string): Promise<Date | null> {
    const lastSend = await db.campaignSend.findFirst({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    return lastSend?.createdAt || null;
  }

  /**
   * Check if two dates are in the same period
   */
  private isSamePeriod(frequency: 'daily' | 'weekly' | 'monthly', date1: Date, date2: Date): boolean {
    switch (frequency) {
      case 'daily':
        return date1.toDateString() === date2.toDateString();

      case 'weekly':
        // Same ISO week
        const week1 = this.getISOWeek(date1);
        const week2 = this.getISOWeek(date2);
        return week1 === week2 && date1.getFullYear() === date2.getFullYear();

      case 'monthly':
        return date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();

      default:
        return false;
    }
  }

  /**
   * Get ISO week number
   */
  private getISOWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  /**
   * Parse wait until expression
   */
  private parseWaitUntil(expression: string, triggerData?: Record<string, unknown>): Date {
    // Simple parsing for common expressions
    // Format: "X days/hours/minutes before/after event"
    const match = expression.match(/(\d+)\s+(day|hour|minute)s?\s+(before|after)\s+(\w+)/i);

    if (!match) {
      // Default to immediate if can't parse
      return new Date();
    }

    const [, amount, unit, direction, eventField] = match;
    const value = parseInt(amount, 10);

    // Get event date from trigger data
    let eventDate = new Date();
    if (triggerData && eventField) {
      const fieldValue = triggerData[eventField];
      if (fieldValue instanceof Date) {
        eventDate = fieldValue;
      } else if (typeof fieldValue === 'string') {
        eventDate = new Date(fieldValue);
      }
    }

    let milliseconds = 0;
    switch (unit.toLowerCase()) {
      case 'day':
        milliseconds = value * 24 * 60 * 60 * 1000;
        break;
      case 'hour':
        milliseconds = value * 60 * 60 * 1000;
        break;
      case 'minute':
        milliseconds = value * 60 * 1000;
        break;
    }

    if (direction.toLowerCase() === 'before') {
      return new Date(eventDate.getTime() - milliseconds);
    } else {
      return new Date(eventDate.getTime() + milliseconds);
    }
  }

  /**
   * Cancel a pending send
   */
  private async cancelSend(sendId: string, reason: string): Promise<void> {
    await db.campaignSend.update({
      where: { id: sendId },
      data: {
        status: 'CANCELLED',
        skipReason: reason,
      },
    });
  }

  /**
   * Increment campaign statistics
   */
  private async incrementCampaignStats(
    campaignId: string,
    stat: 'recipients' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed'
  ): Promise<void> {
    const field = {
      recipients: 'totalRecipients',
      sent: 'totalSent',
      delivered: 'totalDelivered',
      opened: 'totalOpened',
      clicked: 'totalClicked',
      failed: 'totalFailed',
    }[stat];

    await db.campaign.update({
      where: { id: campaignId },
      data: {
        [field]: { increment: 1 },
      },
    });
  }
}

// Singleton instance
let campaignExecutionService: CampaignExecutionService | null = null;

/**
 * Get campaign execution service instance
 */
export function getCampaignExecutionService(): CampaignExecutionService {
  if (!campaignExecutionService) {
    campaignExecutionService = new CampaignExecutionService();
  }
  return campaignExecutionService;
}

// Export the class for testing
export { CampaignExecutionService };
