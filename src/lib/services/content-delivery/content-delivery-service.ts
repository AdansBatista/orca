/**
 * Content Delivery Automation Service
 *
 * Handles automated content delivery to patients based on triggers,
 * targeting criteria, and scheduling.
 */

import { db } from '@/lib/db';
import type { DeliveryMethod, ContentStatus } from '@prisma/client';
import type {
  DeliveryTrigger,
  ContentTargetingCriteria,
  ContentRecommendation,
  DeliveryResult,
  BatchDeliveryRequest,
  DeliveryStats,
} from './types';

// Singleton instance
let instance: ContentDeliveryService | null = null;

/**
 * Content Delivery Service
 *
 * Main service for automated content delivery.
 */
export class ContentDeliveryService {
  /**
   * Deliver content to a single patient
   */
  async deliverToPatient(
    clinicId: string,
    articleId: string,
    patientId: string,
    method: DeliveryMethod,
    trigger: DeliveryTrigger = 'manual',
    sentBy?: string
  ): Promise<DeliveryResult> {
    try {
      // Verify article exists and is published
      const article = await db.contentArticle.findFirst({
        where: {
          id: articleId,
          OR: [{ clinicId }, { clinicId: null }],
          status: 'PUBLISHED',
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          summary: true,
          slug: true,
        },
      });

      if (!article) {
        return {
          success: false,
          articleId,
          patientId,
          method,
          error: 'Article not found or not published',
        };
      }

      // Verify patient exists
      const patient = await db.patient.findFirst({
        where: {
          id: patientId,
          clinicId,
          deletedAt: null,
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      });

      if (!patient) {
        return {
          success: false,
          articleId,
          patientId,
          method,
          error: 'Patient not found or inactive',
        };
      }

      // Check if content was already delivered recently (prevent duplicates)
      const recentDelivery = await db.contentDelivery.findFirst({
        where: {
          clinicId,
          articleId,
          patientId,
          deliveredAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      if (recentDelivery) {
        return {
          success: false,
          articleId,
          patientId,
          method,
          error: 'Content already delivered to this patient in the last 24 hours',
        };
      }

      // Create delivery record
      const delivery = await db.contentDelivery.create({
        data: {
          clinicId,
          articleId,
          patientId,
          method,
          triggeredBy: trigger,
          sentBy,
        },
      });

      // Increment share count on article
      await db.contentArticle.update({
        where: { id: articleId },
        data: { shareCount: { increment: 1 } },
      });

      // Execute actual delivery based on method
      let messageId: string | undefined;
      try {
        messageId = await this.executeDelivery(
          method,
          patient,
          article,
          clinicId
        );
      } catch (deliveryError) {
        console.error('[ContentDelivery] Delivery execution failed:', deliveryError);
        // Record was created but actual send failed - log but don't fail
      }

      return {
        success: true,
        deliveryId: delivery.id,
        articleId,
        patientId,
        method,
        messageId,
      };
    } catch (error) {
      console.error('[ContentDelivery] Error:', error);
      return {
        success: false,
        articleId,
        patientId,
        method,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute the actual delivery based on method
   */
  private async executeDelivery(
    method: DeliveryMethod,
    patient: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null },
    article: { id: string; title: string; summary: string | null; slug: string },
    clinicId: string
  ): Promise<string | undefined> {
    const clinic = await db.clinic.findUnique({
      where: { id: clinicId },
      select: { name: true },
    });

    const portalUrl = `/portal/content/${article.slug}`;
    const subject = `${article.title} - ${clinic?.name || 'Your Clinic'}`;
    const body = article.summary || article.title;

    switch (method) {
      case 'EMAIL':
        if (!patient.email) {
          throw new Error('Patient has no email address');
        }
        // Create message record for email
        const emailMessage = await db.message.create({
          data: {
            clinicId,
            patientId: patient.id,
            channel: 'EMAIL',
            direction: 'OUTBOUND',
            subject,
            body: `${body}\n\nView the full article: ${portalUrl}`,
            status: 'PENDING',
            scheduledAt: new Date(),
            toAddress: patient.email,
            createdBy: 'system', // System-generated content delivery
          },
        });
        return emailMessage.id;

      case 'SMS_LINK':
        if (!patient.phone) {
          throw new Error('Patient has no phone number');
        }
        // Create message record for SMS
        const smsMessage = await db.message.create({
          data: {
            clinicId,
            patientId: patient.id,
            channel: 'SMS',
            direction: 'OUTBOUND',
            body: `${body}\n\nRead more: ${portalUrl}`,
            status: 'PENDING',
            scheduledAt: new Date(),
            toAddress: patient.phone,
            createdBy: 'system', // System-generated content delivery
          },
        });
        return smsMessage.id;

      case 'IN_APP':
        // Create in-app message/notification
        const inAppMessage = await db.message.create({
          data: {
            clinicId,
            patientId: patient.id,
            channel: 'IN_APP',
            direction: 'OUTBOUND',
            subject: article.title,
            body: body,
            status: 'DELIVERED', // In-app is immediately available
            deliveredAt: new Date(),
            relatedType: 'ContentArticle',
            relatedId: article.id,
            createdBy: 'system', // System-generated content delivery
          },
        });
        return inAppMessage.id;

      case 'PORTAL':
        // Just make it available in portal - no active notification
        // The delivery record itself makes it show up in "Shared with you"
        return undefined;

      default:
        throw new Error(`Unknown delivery method: ${method}`);
    }
  }

  /**
   * Deliver content to multiple patients
   */
  async deliverBatch(
    clinicId: string,
    request: BatchDeliveryRequest,
    sentBy?: string
  ): Promise<{ sent: number; failed: number; results: DeliveryResult[] }> {
    const results: DeliveryResult[] = [];
    let sent = 0;
    let failed = 0;

    for (const patientId of request.patientIds) {
      const result = await this.deliverToPatient(
        clinicId,
        request.articleId,
        patientId,
        request.method,
        'manual',
        sentBy
      );

      results.push(result);
      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    }

    return { sent, failed, results };
  }

  /**
   * Get content recommendations for a patient
   */
  async getRecommendations(
    clinicId: string,
    patientId: string,
    limit: number = 5
  ): Promise<ContentRecommendation[]> {
    // Get patient context
    const patient = await db.patient.findFirst({
      where: {
        id: patientId,
        clinicId,
        deletedAt: null,
      },
      select: {
        id: true,
        dateOfBirth: true,
      },
    });

    if (!patient) {
      return [];
    }

    // Get patient's treatment plan (if exists)
    const treatmentPlan = await db.treatmentPlan.findFirst({
      where: {
        patientId,
        clinicId,
        status: 'ACTIVE',
      },
      select: {
        planType: true,
        phases: {
          where: { status: 'IN_PROGRESS' },
          select: { phaseType: true },
        },
      },
    });

    // Determine age group
    let ageGroup = 'adult';
    if (patient.dateOfBirth) {
      const age = Math.floor(
        (Date.now() - patient.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      if (age < 13) ageGroup = 'child';
      else if (age < 20) ageGroup = 'teen';
    }

    // Get content already delivered
    const deliveredArticleIds = await db.contentDelivery.findMany({
      where: {
        clinicId,
        patientId,
      },
      select: { articleId: true },
    });
    const deliveredIds = deliveredArticleIds.map((d) => d.articleId);

    // Find relevant published articles
    const articles = await db.contentArticle.findMany({
      where: {
        OR: [{ clinicId }, { clinicId: null }],
        status: 'PUBLISHED',
        deletedAt: null,
        id: { notIn: deliveredIds },
      },
      select: {
        id: true,
        title: true,
        category: true,
        treatmentTypes: true,
        treatmentPhases: true,
        ageGroups: true,
        viewCount: true,
      },
      take: 50, // Get pool of articles to score
    });

    // Score articles by relevance
    const scored = articles.map((article) => {
      let score = 0;
      const reasons: string[] = [];

      // Match treatment type
      if (treatmentPlan?.planType) {
        if (article.treatmentTypes.includes(treatmentPlan.planType.toLowerCase())) {
          score += 30;
          reasons.push(`Matches your ${treatmentPlan.planType} treatment`);
        }
      }

      // Match treatment phase
      const currentPhase = treatmentPlan?.phases[0]?.phaseType;
      if (currentPhase) {
        if (article.treatmentPhases.includes(currentPhase.toLowerCase())) {
          score += 25;
          reasons.push(`Relevant to ${currentPhase} phase`);
        }
      }

      // Match age group
      if (article.ageGroups.includes(ageGroup)) {
        score += 15;
        reasons.push(`Content for ${ageGroup}s`);
      }

      // Boost popular content
      if (article.viewCount > 100) {
        score += 10;
        reasons.push('Popular content');
      }

      // Base relevance for having no specific targeting (general content)
      if (
        article.treatmentTypes.length === 0 &&
        article.treatmentPhases.length === 0 &&
        article.ageGroups.length === 0
      ) {
        score += 5;
        reasons.push('General guidance');
      }

      return {
        articleId: article.id,
        title: article.title,
        category: article.category,
        relevanceScore: score,
        reason: reasons.length > 0 ? reasons[0] : 'Recommended content',
        recommendedMethod: 'PORTAL' as DeliveryMethod,
      };
    });

    // Sort by score and return top results
    return scored
      .filter((s) => s.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Process trigger event for automated delivery
   */
  async processTrigger(
    clinicId: string,
    trigger: DeliveryTrigger,
    patientId: string,
    context?: {
      treatmentType?: string;
      treatmentPhase?: string;
      appointmentType?: string;
    }
  ): Promise<DeliveryResult[]> {
    const results: DeliveryResult[] = [];

    // Find relevant articles based on trigger and context
    const whereClause: Record<string, unknown> = {
      OR: [{ clinicId }, { clinicId: null }],
      status: 'PUBLISHED',
      deletedAt: null,
    };

    // Add targeting based on context
    if (context?.treatmentType) {
      whereClause.treatmentTypes = { has: context.treatmentType.toLowerCase() };
    }
    if (context?.treatmentPhase) {
      whereClause.treatmentPhases = { has: context.treatmentPhase.toLowerCase() };
    }

    // Map triggers to categories
    const triggerCategoryMap: Record<DeliveryTrigger, string | null> = {
      treatment_start: 'getting-started',
      phase_change: null, // Depends on phase
      appointment_scheduled: 'appointments',
      appointment_reminder: 'appointments',
      post_appointment: null,
      milestone_reached: null,
      compliance_alert: 'compliance',
      manual: null,
      scheduled: null,
      campaign: null,
    };

    const category = triggerCategoryMap[trigger];
    if (category) {
      whereClause.category = category;
    }

    const articles = await db.contentArticle.findMany({
      where: whereClause,
      select: { id: true },
      take: 3, // Limit to 3 articles per trigger
    });

    // Determine delivery method based on trigger
    const triggerMethodMap: Record<DeliveryTrigger, DeliveryMethod> = {
      treatment_start: 'EMAIL',
      phase_change: 'EMAIL',
      appointment_scheduled: 'PORTAL',
      appointment_reminder: 'SMS_LINK',
      post_appointment: 'IN_APP',
      milestone_reached: 'IN_APP',
      compliance_alert: 'IN_APP',
      manual: 'PORTAL',
      scheduled: 'EMAIL',
      campaign: 'EMAIL',
    };

    const method = triggerMethodMap[trigger];

    // Deliver each article
    for (const article of articles) {
      const result = await this.deliverToPatient(
        clinicId,
        article.id,
        patientId,
        method,
        trigger
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Mark content as viewed by patient
   */
  async markAsViewed(
    clinicId: string,
    articleId: string,
    patientId: string
  ): Promise<void> {
    // Find the delivery record
    const delivery = await db.contentDelivery.findFirst({
      where: {
        clinicId,
        articleId,
        patientId,
        viewedAt: null,
      },
      orderBy: { deliveredAt: 'desc' },
    });

    if (delivery) {
      await db.contentDelivery.update({
        where: { id: delivery.id },
        data: { viewedAt: new Date() },
      });
    }

    // Increment article view count
    await db.contentArticle.update({
      where: { id: articleId },
      data: { viewCount: { increment: 1 } },
    });
  }

  /**
   * Get delivery statistics for a clinic
   */
  async getStats(
    clinicId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<DeliveryStats> {
    const dateFilter = {
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate }),
    };

    const deliveries = await db.contentDelivery.findMany({
      where: {
        clinicId,
        ...(Object.keys(dateFilter).length > 0 && { deliveredAt: dateFilter }),
      },
      include: {
        article: {
          select: { id: true, title: true },
        },
      },
    });

    // Calculate stats
    const totalDelivered = deliveries.length;
    const viewed = deliveries.filter((d) => d.viewedAt).length;
    const viewRate = totalDelivered > 0 ? (viewed / totalDelivered) * 100 : 0;

    // By method
    const deliveredByMethod: Record<DeliveryMethod, number> = {
      EMAIL: 0,
      PORTAL: 0,
      SMS_LINK: 0,
      IN_APP: 0,
    };
    deliveries.forEach((d) => {
      deliveredByMethod[d.method]++;
    });

    // Average time to view (for those that were viewed)
    const viewTimes = deliveries
      .filter((d) => d.viewedAt)
      .map((d) => (d.viewedAt!.getTime() - d.deliveredAt.getTime()) / 60000);
    const averageTimeToView =
      viewTimes.length > 0
        ? viewTimes.reduce((a, b) => a + b, 0) / viewTimes.length
        : undefined;

    // Top articles
    const articleStats = new Map<string, { title: string; deliveryCount: number; viewCount: number }>();
    deliveries.forEach((d) => {
      const existing = articleStats.get(d.articleId) || {
        title: d.article.title,
        deliveryCount: 0,
        viewCount: 0,
      };
      existing.deliveryCount++;
      if (d.viewedAt) existing.viewCount++;
      articleStats.set(d.articleId, existing);
    });

    const topArticles = Array.from(articleStats.entries())
      .map(([articleId, stats]) => ({ articleId, ...stats }))
      .sort((a, b) => b.deliveryCount - a.deliveryCount)
      .slice(0, 10);

    return {
      totalDelivered,
      deliveredByMethod,
      viewRate,
      averageTimeToView,
      topArticles,
    };
  }

  /**
   * Get content delivered to a specific patient
   */
  async getPatientDeliveries(
    clinicId: string,
    patientId: string
  ): Promise<Array<{
    id: string;
    articleId: string;
    title: string;
    category: string;
    method: DeliveryMethod;
    deliveredAt: Date;
    viewedAt: Date | null;
  }>> {
    const deliveries = await db.contentDelivery.findMany({
      where: {
        clinicId,
        patientId,
      },
      include: {
        article: {
          select: {
            title: true,
            category: true,
            slug: true,
          },
        },
      },
      orderBy: { deliveredAt: 'desc' },
    });

    return deliveries.map((d) => ({
      id: d.id,
      articleId: d.articleId,
      title: d.article.title,
      category: d.article.category,
      method: d.method,
      deliveredAt: d.deliveredAt,
      viewedAt: d.viewedAt,
    }));
  }

  /**
   * Process scheduled content deliveries
   * Called by cron to process time-based automated deliveries
   */
  async processScheduledDeliveries(): Promise<{
    processed: number;
    sent: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    try {
      // Get all active clinics with content automation enabled
      const clinics = await db.clinic.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      });

      for (const clinic of clinics) {
        // Get patients who recently started treatment (within last 24h)
        const newTreatmentPatients = await db.treatmentPlan.findMany({
          where: {
            clinicId: clinic.id,
            status: 'ACTIVE',
            startDate: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
          select: {
            patientId: true,
            planType: true,
          },
        });

        for (const plan of newTreatmentPatients) {
          results.processed++;
          try {
            const triggerResults = await this.processTrigger(
              clinic.id,
              'treatment_start',
              plan.patientId,
              { treatmentType: plan.planType || undefined }
            );
            const successful = triggerResults.filter((r) => r.success).length;
            results.sent += successful;
            results.failed += triggerResults.length - successful;
          } catch (err) {
            results.failed++;
            results.errors.push(
              `Failed to process treatment_start for patient ${plan.patientId}: ${err instanceof Error ? err.message : 'Unknown error'}`
            );
          }
        }

        // Get patients with upcoming appointments (reminders with content)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);

        const upcomingAppointments = await db.appointment.findMany({
          where: {
            clinicId: clinic.id,
            status: { in: ['SCHEDULED', 'CONFIRMED'] },
            startTime: {
              gte: tomorrow,
              lt: dayAfter,
            },
            deletedAt: null,
          },
          select: {
            patientId: true,
            appointmentType: {
              select: { name: true },
            },
          },
        });

        for (const appt of upcomingAppointments) {
          results.processed++;
          try {
            const triggerResults = await this.processTrigger(
              clinic.id,
              'appointment_reminder',
              appt.patientId,
              { appointmentType: appt.appointmentType?.name }
            );
            const successful = triggerResults.filter((r) => r.success).length;
            results.sent += successful;
            results.failed += triggerResults.length - successful;
          } catch (err) {
            results.failed++;
            results.errors.push(
              `Failed to process appointment_reminder for patient ${appt.patientId}: ${err instanceof Error ? err.message : 'Unknown error'}`
            );
          }
        }
      }

      console.log('[ContentDelivery] Scheduled processing complete:', results);
      return results;
    } catch (error) {
      console.error('[ContentDelivery] Scheduled processing error:', error);
      results.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return results;
    }
  }
}

/**
 * Get singleton instance of ContentDeliveryService
 */
export function getContentDeliveryService(): ContentDeliveryService {
  if (!instance) {
    instance = new ContentDeliveryService();
  }
  return instance;
}
