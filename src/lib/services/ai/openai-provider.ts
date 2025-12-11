/**
 * OpenAI Provider
 *
 * Implementation of AI analysis using OpenAI's GPT-4 Vision API.
 */

import OpenAI from 'openai';
import { getAIConfig, AI_SYSTEM_PROMPTS, AI_RATE_LIMITS } from './config';
import { anonymizeForAI, anonymizeContext, logAnonymization } from './anonymizer';
import type {
  AIImageInput,
  AIAnalysisRequest,
  AIAnalysisResponse,
  ImageQualityResult,
  ImageCategorizationResult,
  CephLandmarkResult,
  ProgressComparisonResult,
  AIReportResult,
} from './types';

// =============================================================================
// OpenAI Client
// =============================================================================

let openaiClient: OpenAI | null = null;

/**
 * Get or create OpenAI client instance
 */
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const config = getAIConfig();
    openaiClient = new OpenAI({
      apiKey: config.provider.apiKey,
    });
  }
  return openaiClient;
}

// =============================================================================
// Image Processing
// =============================================================================

/**
 * Convert image to format expected by OpenAI Vision API
 */
function prepareImageForOpenAI(
  image: AIImageInput,
  clinicId: string
): { type: 'image_url'; image_url: { url: string; detail: 'high' | 'low' } } {
  // Anonymize the image and metadata
  const anonymized = anonymizeForAI(image.imageData, image.metadata as Record<string, unknown> | undefined);

  if (anonymized.anonymizedFields.length > 0) {
    logAnonymization(clinicId, 'image_prepare', anonymized.anonymizedFields);
  }

  let imageUrl: string;

  if (image.isBase64) {
    // Detect image type from base64 header or assume JPEG
    const mimeType = image.imageData.startsWith('/9j/') ? 'image/jpeg' :
                     image.imageData.startsWith('iVBORw0KGgo') ? 'image/png' :
                     'image/jpeg';
    imageUrl = `data:${mimeType};base64,${anonymized.imageData}`;
  } else {
    imageUrl = anonymized.imageData;
  }

  return {
    type: 'image_url',
    image_url: {
      url: imageUrl,
      detail: 'high', // Use high detail for medical images
    },
  };
}

// =============================================================================
// Analysis Functions
// =============================================================================

/**
 * Analyze image quality
 */
export async function analyzeImageQuality(
  request: AIAnalysisRequest
): Promise<AIAnalysisResponse<ImageQualityResult>> {
  const startTime = Date.now();
  const config = getAIConfig();

  if (!config.provider.enabled) {
    return {
      success: false,
      error: {
        code: 'AI_NOT_CONFIGURED',
        message: 'OpenAI API is not configured. Please add your API key.',
      },
      processingTime: Date.now() - startTime,
      model: config.provider.model,
    };
  }

  if (request.images.length === 0) {
    return {
      success: false,
      error: {
        code: 'NO_IMAGES',
        message: 'At least one image is required for quality analysis.',
      },
      processingTime: Date.now() - startTime,
      model: config.provider.model,
    };
  }

  try {
    const client = getOpenAIClient();

    const imageContent = request.images.map(img =>
      prepareImageForOpenAI(img, request.clinicId)
    );

    const response = await client.chat.completions.create({
      model: config.provider.model,
      max_tokens: config.provider.maxTokens,
      messages: [
        {
          role: 'system',
          content: AI_SYSTEM_PROMPTS.qualityAssessment,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please analyze the quality of this dental image and provide your assessment.',
            },
            ...imageContent,
          ],
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    const result = JSON.parse(content) as ImageQualityResult;

    return {
      success: true,
      data: result,
      processingTime: Date.now() - startTime,
      model: config.provider.model,
      tokensUsed: {
        prompt: response.usage?.prompt_tokens || 0,
        completion: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    console.error('[OpenAI] Quality analysis error:', error);
    return {
      success: false,
      error: {
        code: 'ANALYSIS_FAILED',
        message: error instanceof Error ? error.message : 'Failed to analyze image quality',
        details: error instanceof Error ? error.stack : undefined,
      },
      processingTime: Date.now() - startTime,
      model: config.provider.model,
    };
  }
}

/**
 * Categorize dental image
 */
export async function categorizeImage(
  request: AIAnalysisRequest
): Promise<AIAnalysisResponse<ImageCategorizationResult>> {
  const startTime = Date.now();
  const config = getAIConfig();

  if (!config.provider.enabled) {
    return {
      success: false,
      error: {
        code: 'AI_NOT_CONFIGURED',
        message: 'OpenAI API is not configured. Please add your API key.',
      },
      processingTime: Date.now() - startTime,
      model: config.provider.model,
    };
  }

  if (request.images.length === 0) {
    return {
      success: false,
      error: {
        code: 'NO_IMAGES',
        message: 'At least one image is required for categorization.',
      },
      processingTime: Date.now() - startTime,
      model: config.provider.model,
    };
  }

  try {
    const client = getOpenAIClient();

    const imageContent = request.images.map(img =>
      prepareImageForOpenAI(img, request.clinicId)
    );

    const response = await client.chat.completions.create({
      model: config.provider.model,
      max_tokens: config.provider.maxTokens,
      messages: [
        {
          role: 'system',
          content: AI_SYSTEM_PROMPTS.categorization,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please analyze and categorize this dental image.',
            },
            ...imageContent,
          ],
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    const result = JSON.parse(content) as ImageCategorizationResult;

    return {
      success: true,
      data: result,
      processingTime: Date.now() - startTime,
      model: config.provider.model,
      tokensUsed: {
        prompt: response.usage?.prompt_tokens || 0,
        completion: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    console.error('[OpenAI] Categorization error:', error);
    return {
      success: false,
      error: {
        code: 'CATEGORIZATION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to categorize image',
        details: error instanceof Error ? error.stack : undefined,
      },
      processingTime: Date.now() - startTime,
      model: config.provider.model,
    };
  }
}

/**
 * Detect cephalometric landmarks
 */
export async function detectCephLandmarks(
  request: AIAnalysisRequest
): Promise<AIAnalysisResponse<CephLandmarkResult>> {
  const startTime = Date.now();
  const config = getAIConfig();

  if (!config.provider.enabled) {
    return {
      success: false,
      error: {
        code: 'AI_NOT_CONFIGURED',
        message: 'OpenAI API is not configured. Please add your API key.',
      },
      processingTime: Date.now() - startTime,
      model: config.provider.model,
    };
  }

  if (request.images.length === 0) {
    return {
      success: false,
      error: {
        code: 'NO_IMAGES',
        message: 'A cephalometric X-ray image is required.',
      },
      processingTime: Date.now() - startTime,
      model: config.provider.model,
    };
  }

  try {
    const client = getOpenAIClient();

    const imageContent = request.images.map(img =>
      prepareImageForOpenAI(img, request.clinicId)
    );

    const response = await client.chat.completions.create({
      model: config.provider.model,
      max_tokens: config.provider.maxTokens,
      messages: [
        {
          role: 'system',
          content: AI_SYSTEM_PROMPTS.cephLandmarks,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please analyze this lateral cephalometric X-ray and identify the anatomical landmarks.',
            },
            ...imageContent,
          ],
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    const result = JSON.parse(content) as CephLandmarkResult;

    return {
      success: true,
      data: result,
      processingTime: Date.now() - startTime,
      model: config.provider.model,
      tokensUsed: {
        prompt: response.usage?.prompt_tokens || 0,
        completion: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    console.error('[OpenAI] Ceph landmark detection error:', error);
    return {
      success: false,
      error: {
        code: 'LANDMARK_DETECTION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to detect cephalometric landmarks',
        details: error instanceof Error ? error.stack : undefined,
      },
      processingTime: Date.now() - startTime,
      model: config.provider.model,
    };
  }
}

/**
 * Compare treatment progress between images
 */
export async function compareProgress(
  request: AIAnalysisRequest
): Promise<AIAnalysisResponse<ProgressComparisonResult>> {
  const startTime = Date.now();
  const config = getAIConfig();

  if (!config.provider.enabled) {
    return {
      success: false,
      error: {
        code: 'AI_NOT_CONFIGURED',
        message: 'OpenAI API is not configured. Please add your API key.',
      },
      processingTime: Date.now() - startTime,
      model: config.provider.model,
    };
  }

  if (request.images.length < 2) {
    return {
      success: false,
      error: {
        code: 'INSUFFICIENT_IMAGES',
        message: 'At least two images are required for progress comparison.',
      },
      processingTime: Date.now() - startTime,
      model: config.provider.model,
    };
  }

  try {
    const client = getOpenAIClient();

    const imageContent = request.images.map(img =>
      prepareImageForOpenAI(img, request.clinicId)
    );

    // Anonymize context if provided
    const context = request.context ? anonymizeContext(request.context) : {};

    const contextText = Object.keys(context).length > 0
      ? `\n\nContext: ${JSON.stringify(context)}`
      : '';

    const response = await client.chat.completions.create({
      model: config.provider.model,
      max_tokens: config.provider.maxTokens,
      messages: [
        {
          role: 'system',
          content: AI_SYSTEM_PROMPTS.progressComparison,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Please compare these before and after images and analyze the treatment progress. The first image is the "before" and the second is the "after".${contextText}`,
            },
            ...imageContent,
          ],
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    const result = JSON.parse(content) as ProgressComparisonResult;

    return {
      success: true,
      data: result,
      processingTime: Date.now() - startTime,
      model: config.provider.model,
      tokensUsed: {
        prompt: response.usage?.prompt_tokens || 0,
        completion: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    console.error('[OpenAI] Progress comparison error:', error);
    return {
      success: false,
      error: {
        code: 'COMPARISON_FAILED',
        message: error instanceof Error ? error.message : 'Failed to compare progress',
        details: error instanceof Error ? error.stack : undefined,
      },
      processingTime: Date.now() - startTime,
      model: config.provider.model,
    };
  }
}

/**
 * Generate AI-assisted report
 */
export async function generateReport(
  request: AIAnalysisRequest
): Promise<AIAnalysisResponse<AIReportResult>> {
  const startTime = Date.now();
  const config = getAIConfig();

  if (!config.provider.enabled) {
    return {
      success: false,
      error: {
        code: 'AI_NOT_CONFIGURED',
        message: 'OpenAI API is not configured. Please add your API key.',
      },
      processingTime: Date.now() - startTime,
      model: config.provider.model,
    };
  }

  try {
    const client = getOpenAIClient();

    const imageContent = request.images.map(img =>
      prepareImageForOpenAI(img, request.clinicId)
    );

    // Anonymize context
    const context = request.context ? anonymizeContext(request.context) : {};

    const contextText = Object.keys(context).length > 0
      ? `\n\nContext: ${JSON.stringify(context)}`
      : '';

    const response = await client.chat.completions.create({
      model: config.provider.model,
      max_tokens: config.provider.maxTokens,
      messages: [
        {
          role: 'system',
          content: AI_SYSTEM_PROMPTS.reportGeneration,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Please generate a clinical report based on these dental images.${contextText}`,
            },
            ...imageContent,
          ],
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    const result = JSON.parse(content) as AIReportResult;

    return {
      success: true,
      data: result,
      processingTime: Date.now() - startTime,
      model: config.provider.model,
      tokensUsed: {
        prompt: response.usage?.prompt_tokens || 0,
        completion: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    console.error('[OpenAI] Report generation error:', error);
    return {
      success: false,
      error: {
        code: 'REPORT_GENERATION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to generate report',
        details: error instanceof Error ? error.stack : undefined,
      },
      processingTime: Date.now() - startTime,
      model: config.provider.model,
    };
  }
}

// =============================================================================
// Health Check
// =============================================================================

/**
 * Check if OpenAI API is accessible
 */
export async function checkOpenAIHealth(): Promise<{
  healthy: boolean;
  message: string;
  latency?: number;
}> {
  const config = getAIConfig();

  if (!config.provider.enabled) {
    return {
      healthy: false,
      message: 'OpenAI API is not configured',
    };
  }

  const startTime = Date.now();

  try {
    const client = getOpenAIClient();

    // Simple API call to check connectivity
    await client.models.retrieve(config.provider.model);

    return {
      healthy: true,
      message: 'OpenAI API is accessible',
      latency: Date.now() - startTime,
    };
  } catch (error) {
    return {
      healthy: false,
      message: error instanceof Error ? error.message : 'Failed to connect to OpenAI',
      latency: Date.now() - startTime,
    };
  }
}
