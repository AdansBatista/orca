/**
 * Imaging AI Service
 *
 * High-level service for AI-powered imaging analysis features.
 * Provides a unified API for all imaging AI operations.
 */

import { db } from '@/lib/db';
import { getAIConfig, isFeatureAvailable } from './config';
import {
  analyzeImageQuality,
  categorizeImage,
  detectCephLandmarks,
  compareProgress,
  generateReport,
  checkOpenAIHealth,
} from './openai-provider';
import type {
  AIAnalysisRequest,
  AIAnalysisResponse,
  AIImageInput,
  ImageQualityResult,
  ImageCategorizationResult,
  CephLandmarkResult,
  ProgressComparisonResult,
  AIReportResult,
} from './types';

// =============================================================================
// Service Class
// =============================================================================

class ImagingAIService {
  /**
   * Analyze image quality
   *
   * Evaluates a dental image for diagnostic quality, detecting issues
   * like blur, exposure problems, positioning errors, etc.
   */
  async analyzeQuality(
    imageUrl: string,
    clinicId: string,
    metadata?: Record<string, unknown>
  ): Promise<AIAnalysisResponse<ImageQualityResult>> {
    if (!isFeatureAvailable('qualityScoring')) {
      return {
        success: false,
        error: {
          code: 'FEATURE_DISABLED',
          message: 'Image quality scoring is not enabled',
        },
        processingTime: 0,
        model: 'none',
      };
    }

    const request: AIAnalysisRequest = {
      type: 'quality',
      images: [
        {
          imageData: imageUrl,
          isBase64: false,
          metadata,
        },
      ],
      clinicId,
    };

    const result = await analyzeImageQuality(request);

    // Log the analysis for audit trail
    if (result.success) {
      await this.logAnalysis(clinicId, 'quality', result);
    }

    return result;
  }

  /**
   * Auto-categorize an image
   *
   * Automatically detects the type of dental image (intraoral photo,
   * panoramic X-ray, cephalometric, etc.)
   */
  async categorize(
    imageUrl: string,
    clinicId: string,
    metadata?: Record<string, unknown>
  ): Promise<AIAnalysisResponse<ImageCategorizationResult>> {
    if (!isFeatureAvailable('autoCategorization')) {
      return {
        success: false,
        error: {
          code: 'FEATURE_DISABLED',
          message: 'Auto-categorization is not enabled',
        },
        processingTime: 0,
        model: 'none',
      };
    }

    const request: AIAnalysisRequest = {
      type: 'categorization',
      images: [
        {
          imageData: imageUrl,
          isBase64: false,
          metadata,
        },
      ],
      clinicId,
    };

    const result = await categorizeImage(request);

    if (result.success) {
      await this.logAnalysis(clinicId, 'categorization', result);
    }

    return result;
  }

  /**
   * Detect cephalometric landmarks
   *
   * Analyzes a lateral cephalometric X-ray and identifies anatomical
   * landmarks for cephalometric analysis.
   */
  async detectLandmarks(
    imageUrl: string,
    clinicId: string,
    metadata?: Record<string, unknown>
  ): Promise<AIAnalysisResponse<CephLandmarkResult>> {
    if (!isFeatureAvailable('cephDetection')) {
      return {
        success: false,
        error: {
          code: 'FEATURE_DISABLED',
          message: 'Cephalometric landmark detection is not enabled',
        },
        processingTime: 0,
        model: 'none',
      };
    }

    const request: AIAnalysisRequest = {
      type: 'ceph_landmarks',
      images: [
        {
          imageData: imageUrl,
          isBase64: false,
          metadata,
        },
      ],
      clinicId,
    };

    const result = await detectCephLandmarks(request);

    if (result.success) {
      await this.logAnalysis(clinicId, 'ceph_landmarks', result);
    }

    return result;
  }

  /**
   * Compare treatment progress
   *
   * Analyzes before/after images to describe treatment changes.
   */
  async compareImages(
    beforeImageUrl: string,
    afterImageUrl: string,
    clinicId: string,
    context?: {
      treatmentType?: string;
      patientAge?: number;
    }
  ): Promise<AIAnalysisResponse<ProgressComparisonResult>> {
    if (!isFeatureAvailable('imageAnalysis')) {
      return {
        success: false,
        error: {
          code: 'FEATURE_DISABLED',
          message: 'Image analysis is not enabled',
        },
        processingTime: 0,
        model: 'none',
      };
    }

    const request: AIAnalysisRequest = {
      type: 'progress_comparison',
      images: [
        { imageData: beforeImageUrl, isBase64: false },
        { imageData: afterImageUrl, isBase64: false },
      ],
      context,
      clinicId,
    };

    const result = await compareProgress(request);

    if (result.success) {
      await this.logAnalysis(clinicId, 'progress_comparison', result);
    }

    return result;
  }

  /**
   * Generate AI-assisted report
   *
   * Creates a clinical report based on provided images.
   */
  async generateImageReport(
    imageUrls: string[],
    clinicId: string,
    context?: {
      treatmentType?: string;
      patientAge?: number;
      reportType?: string;
    }
  ): Promise<AIAnalysisResponse<AIReportResult>> {
    if (!isFeatureAvailable('imageAnalysis')) {
      return {
        success: false,
        error: {
          code: 'FEATURE_DISABLED',
          message: 'Image analysis is not enabled',
        },
        processingTime: 0,
        model: 'none',
      };
    }

    const request: AIAnalysisRequest = {
      type: 'report',
      images: imageUrls.map((url) => ({
        imageData: url,
        isBase64: false,
      })),
      context,
      clinicId,
    };

    const result = await generateReport(request);

    if (result.success) {
      await this.logAnalysis(clinicId, 'report', result);
    }

    return result;
  }

  /**
   * Batch analyze images on upload
   *
   * Performs quality check and auto-categorization for newly uploaded images.
   */
  async analyzeOnUpload(
    imageUrl: string,
    clinicId: string,
    metadata?: Record<string, unknown>
  ): Promise<{
    quality?: AIAnalysisResponse<ImageQualityResult>;
    categorization?: AIAnalysisResponse<ImageCategorizationResult>;
  }> {
    const results: {
      quality?: AIAnalysisResponse<ImageQualityResult>;
      categorization?: AIAnalysisResponse<ImageCategorizationResult>;
    } = {};

    // Run quality analysis and categorization in parallel if both are enabled
    const promises: Promise<void>[] = [];

    if (isFeatureAvailable('qualityScoring')) {
      promises.push(
        this.analyzeQuality(imageUrl, clinicId, metadata).then((result) => {
          results.quality = result;
        })
      );
    }

    if (isFeatureAvailable('autoCategorization')) {
      promises.push(
        this.categorize(imageUrl, clinicId, metadata).then((result) => {
          results.categorization = result;
        })
      );
    }

    await Promise.all(promises);

    return results;
  }

  /**
   * Check AI service health
   */
  async checkHealth(): Promise<{
    available: boolean;
    provider: {
      name: string;
      healthy: boolean;
      message: string;
      latency?: number;
    };
    features: {
      qualityScoring: boolean;
      autoCategorization: boolean;
      cephDetection: boolean;
      imageAnalysis: boolean;
    };
  }> {
    const config = getAIConfig();
    const healthCheck = await checkOpenAIHealth();

    return {
      available: config.enabled && healthCheck.healthy,
      provider: {
        name: 'OpenAI',
        ...healthCheck,
      },
      features: {
        qualityScoring: isFeatureAvailable('qualityScoring'),
        autoCategorization: isFeatureAvailable('autoCategorization'),
        cephDetection: isFeatureAvailable('cephDetection'),
        imageAnalysis: isFeatureAvailable('imageAnalysis'),
      },
    };
  }

  /**
   * Get AI usage statistics for a clinic
   */
  async getUsageStats(
    clinicId: string,
    period: 'day' | 'week' | 'month' = 'month'
  ): Promise<{
    totalAnalyses: number;
    byType: Record<string, number>;
    tokensUsed: number;
    successRate: number;
  }> {
    const periodStart = new Date();
    switch (period) {
      case 'day':
        periodStart.setDate(periodStart.getDate() - 1);
        break;
      case 'week':
        periodStart.setDate(periodStart.getDate() - 7);
        break;
      case 'month':
        periodStart.setMonth(periodStart.getMonth() - 1);
        break;
    }

    // Query AI analysis logs from database
    // For now, return mock data - would need AIAnalysisLog model in Prisma
    return {
      totalAnalyses: 0,
      byType: {},
      tokensUsed: 0,
      successRate: 0,
    };
  }

  /**
   * Log AI analysis for audit trail
   */
  private async logAnalysis(
    clinicId: string,
    type: string,
    result: AIAnalysisResponse<unknown>
  ): Promise<void> {
    // In production, this would write to an AIAnalysisLog table
    console.log('[ImagingAIService] Analysis completed:', {
      clinicId,
      type,
      success: result.success,
      processingTime: result.processingTime,
      model: result.model,
      tokensUsed: result.tokensUsed?.total,
      timestamp: new Date().toISOString(),
    });
  }
}

// =============================================================================
// Singleton Export
// =============================================================================

let imagingAIService: ImagingAIService | null = null;

/**
 * Get imaging AI service instance
 */
export function getImagingAIService(): ImagingAIService {
  if (!imagingAIService) {
    imagingAIService = new ImagingAIService();
  }
  return imagingAIService;
}

// Export class for testing
export { ImagingAIService };
