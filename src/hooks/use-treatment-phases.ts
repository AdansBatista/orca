'use client';

/**
 * useTreatmentPhases Hook
 *
 * React hook for fetching and managing treatment phases for image linking.
 */

import { useState, useCallback } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface TreatmentPhase {
  id: string;
  phaseNumber: number;
  phaseName: string;
  phaseType: string;
  status: string;
  progressPercent: number;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  imageCount: number;
}

export interface TreatmentPlan {
  id: string;
  planNumber: string;
  planName: string;
  planType: string | null;
  status: string;
  startDate: string | null;
  estimatedEndDate: string | null;
  phases: TreatmentPhase[];
  phaseCount: number;
}

export interface PatientTreatmentData {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  treatmentPlans: TreatmentPlan[];
}

// =============================================================================
// Hook
// =============================================================================

export function useTreatmentPhases() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch treatment plans and phases for a patient
   */
  const fetchPatientPhases = useCallback(
    async (patientId: string): Promise<PatientTreatmentData | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/patients/${patientId}/treatment-phases`);
        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || 'Failed to fetch treatment phases');
          return null;
        }

        return data.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch treatment phases');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Link an image to a treatment phase
   */
  const linkImageToPhase = useCallback(
    async (
      imageId: string,
      treatmentPhaseId: string,
      treatmentPlanId?: string
    ): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/images/phase-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageId,
            treatmentPhaseId,
            treatmentPlanId,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || 'Failed to link image to phase');
          return false;
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to link image to phase');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Bulk link images to a treatment phase
   */
  const bulkLinkImagesToPhase = useCallback(
    async (
      imageIds: string[],
      treatmentPhaseId: string,
      treatmentPlanId?: string
    ): Promise<{ success: boolean; linked: number }> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/images/phase-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageIds,
            treatmentPhaseId,
            treatmentPlanId,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || 'Failed to link images to phase');
          return { success: false, linked: 0 };
        }

        return { success: true, linked: data.data.linked };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to link images to phase');
        return { success: false, linked: 0 };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Unlink an image from its treatment phase
   */
  const unlinkImageFromPhase = useCallback(
    async (imageId: string, keepPlanLink: boolean = false): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          imageId,
          keepPlanLink: keepPlanLink.toString(),
        });

        const response = await fetch(`/api/images/phase-link?${params}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || 'Failed to unlink image from phase');
          return false;
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to unlink image from phase');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Fetch images for a specific treatment phase
   */
  const fetchPhaseImages = useCallback(
    async (
      phaseId: string,
      options?: {
        category?: string;
        page?: number;
        pageSize?: number;
        sortBy?: 'captureDate' | 'createdAt' | 'fileName';
        sortOrder?: 'asc' | 'desc';
      }
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (options?.category) params.set('category', options.category);
        if (options?.page) params.set('page', options.page.toString());
        if (options?.pageSize) params.set('pageSize', options.pageSize.toString());
        if (options?.sortBy) params.set('sortBy', options.sortBy);
        if (options?.sortOrder) params.set('sortOrder', options.sortOrder);

        const response = await fetch(
          `/api/treatment-phases/${phaseId}/images?${params}`
        );
        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || 'Failed to fetch phase images');
          return null;
        }

        return data.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch phase images');
        return null;
      } finally {
        setIsLoading(false);
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
    isLoading,
    error,

    // Actions
    fetchPatientPhases,
    linkImageToPhase,
    bulkLinkImagesToPhase,
    unlinkImageFromPhase,
    fetchPhaseImages,
    clearError,
  };
}
