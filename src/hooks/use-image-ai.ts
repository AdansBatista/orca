'use client';

/**
 * useImageAI Hook
 *
 * React hook for AI-powered image analysis features.
 */

import { useState, useCallback } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface ImageQualityResult {
  overallScore: number;
  diagnosticQuality: boolean;
  metrics: {
    sharpness: number;
    exposure: number;
    contrast: number;
    positioning: number;
    coverage: number;
  };
  issues: Array<{
    type: string;
    severity: 'minor' | 'moderate' | 'severe';
    description: string;
    suggestion?: string;
  }>;
  recommendations: string[];
  confidence: number;
}

export interface ImageCategorizationResult {
  category: string;
  confidence: number;
  alternatives: Array<{
    category: string;
    confidence: number;
  }>;
  characteristics: {
    isXray: boolean;
    isClinicalPhoto: boolean;
    is3DScan: boolean;
    isIntraoral: boolean;
    hasTeeth: boolean;
    hasBraces: boolean;
    hasRetainer: boolean;
  };
  subcategory?: string;
}

export interface CephLandmarkResult {
  landmarks: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    confidence: number;
    needsVerification: boolean;
  }>;
  calibration?: {
    reference: string;
    pixelsPerMm: number;
    confidence: number;
  };
  overallConfidence: number;
  landmarksNeedingReview: string[];
  analysisReady: boolean;
  missingLandmarks: string[];
}

export interface ProgressComparisonResult {
  overallChange: 'significant' | 'moderate' | 'minimal' | 'none';
  changes: Array<{
    area: string;
    description: string;
    type: 'improvement' | 'regression' | 'neutral';
    significance: number;
  }>;
  summary: string;
  talkingPoints: string[];
  confidence: number;
}

export interface AIReportResult {
  sections: Array<{
    title: string;
    content: string;
    bulletPoints?: string[];
  }>;
  keyFindings: string[];
  recommendations?: string[];
  confidence: number;
}

export interface AIHealthStatus {
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
}

interface AnalysisMeta {
  processingTime: number;
  model: string;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

// =============================================================================
// Hook
// =============================================================================

export function useImageAI() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check AI service health
   */
  const checkHealth = useCallback(async (): Promise<AIHealthStatus | null> => {
    try {
      const response = await fetch('/api/ai/imaging/health');
      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || 'Failed to check AI health');
        return null;
      }

      return data.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check AI health');
      return null;
    }
  }, []);

  /**
   * Analyze image quality
   */
  const analyzeQuality = useCallback(
    async (
      imageUrl: string,
      metadata?: Record<string, unknown>
    ): Promise<{ result: ImageQualityResult; meta: AnalysisMeta } | null> => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/imaging/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl,
            analysisType: 'quality',
            metadata,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || 'Quality analysis failed');
          return null;
        }

        return {
          result: data.data,
          meta: data.meta,
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Quality analysis failed');
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  /**
   * Auto-categorize image
   */
  const categorizeImage = useCallback(
    async (
      imageUrl: string,
      metadata?: Record<string, unknown>
    ): Promise<{ result: ImageCategorizationResult; meta: AnalysisMeta } | null> => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/imaging/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl,
            analysisType: 'categorization',
            metadata,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || 'Categorization failed');
          return null;
        }

        return {
          result: data.data,
          meta: data.meta,
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Categorization failed');
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  /**
   * Analyze image on upload (quality + categorization)
   */
  const analyzeOnUpload = useCallback(
    async (
      imageUrl: string,
      metadata?: Record<string, unknown>
    ): Promise<{
      quality?: ImageQualityResult;
      categorization?: ImageCategorizationResult;
    } | null> => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/imaging/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl,
            analysisType: 'all',
            metadata,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || 'Analysis failed');
          return null;
        }

        return {
          quality: data.data.quality?.data,
          categorization: data.data.categorization?.data,
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Analysis failed');
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  /**
   * Detect cephalometric landmarks
   */
  const detectLandmarks = useCallback(
    async (
      imageUrl: string,
      metadata?: Record<string, unknown>
    ): Promise<{ result: CephLandmarkResult; meta: AnalysisMeta } | null> => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/imaging/ceph-landmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl,
            metadata,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || 'Landmark detection failed');
          return null;
        }

        return {
          result: data.data,
          meta: data.meta,
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Landmark detection failed');
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  /**
   * Compare before/after images
   */
  const compareProgress = useCallback(
    async (
      beforeImageUrl: string,
      afterImageUrl: string,
      context?: {
        treatmentType?: string;
        patientAge?: number;
      }
    ): Promise<{ result: ProgressComparisonResult; meta: AnalysisMeta } | null> => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/imaging/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            beforeImageUrl,
            afterImageUrl,
            context,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || 'Comparison failed');
          return null;
        }

        return {
          result: data.data,
          meta: data.meta,
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Comparison failed');
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  /**
   * Generate AI report
   */
  const generateReport = useCallback(
    async (
      imageUrls: string[],
      context?: {
        treatmentType?: string;
        patientAge?: number;
        reportType?: string;
      }
    ): Promise<{ result: AIReportResult; meta: AnalysisMeta } | null> => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/imaging/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrls,
            context,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || 'Report generation failed');
          return null;
        }

        return {
          result: data.data,
          meta: data.meta,
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Report generation failed');
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isAnalyzing,
    error,

    // Actions
    checkHealth,
    analyzeQuality,
    categorizeImage,
    analyzeOnUpload,
    detectLandmarks,
    compareProgress,
    generateReport,
    clearError,
  };
}
