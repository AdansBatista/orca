'use client';

/**
 * useRetention Hook
 *
 * React hook for managing image retention policies and archive operations.
 */

import { useState, useCallback } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface RetentionPolicy {
  id: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  isActive: boolean;
  imageCategories: string[];
  retentionYears: number;
  retentionForMinorsYears?: number | null;
  archiveAfterYears?: number | null;
  notifyBeforeArchive?: number | null;
  autoExtendOnAccess: boolean;
  imageCount: number;
  createdAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface ArchiveRecord {
  id: string;
  action: string;
  reason?: string | null;
  actionAt: string;
  image: {
    id: string;
    fileName: string;
    category: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  performedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  policy?: {
    id: string;
    name: string;
  } | null;
}

export interface RetentionReportSummary {
  totalImages: number;
  archivedCount: number;
  legalHoldCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  noRetentionPolicyCount: number;
  complianceRate: number;
}

export interface StorageReportSummary {
  totalImages: number;
  totalSize: number;
  hotStorageSize: number;
  coldStorageSize: number;
  hotStoragePercentage: number;
  coldStoragePercentage: number;
}

// =============================================================================
// Hook
// =============================================================================

export function useRetention() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Retention Policies
  // -------------------------------------------------------------------------

  const fetchPolicies = useCallback(
    async (options?: { isActive?: boolean; page?: number; pageSize?: number }) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (options?.isActive !== undefined)
          params.set('isActive', String(options.isActive));
        if (options?.page) params.set('page', String(options.page));
        if (options?.pageSize) params.set('pageSize', String(options.pageSize));

        const response = await fetch(
          `/api/imaging/retention/policies?${params}`
        );
        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || 'Failed to fetch policies');
          return null;
        }

        return data.data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch policies'
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const createPolicy = useCallback(
    async (input: {
      name: string;
      description?: string;
      isDefault?: boolean;
      imageCategories?: string[];
      retentionYears: number;
      retentionForMinorsYears?: number;
      archiveAfterYears?: number;
      notifyBeforeArchive?: number;
      autoExtendOnAccess?: boolean;
    }) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/imaging/retention/policies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || 'Failed to create policy');
          return null;
        }

        return data.data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to create policy'
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updatePolicy = useCallback(
    async (
      policyId: string,
      input: Partial<{
        name: string;
        description: string | null;
        isDefault: boolean;
        isActive: boolean;
        imageCategories: string[];
        retentionYears: number;
        retentionForMinorsYears: number | null;
        archiveAfterYears: number | null;
        notifyBeforeArchive: number | null;
        autoExtendOnAccess: boolean;
      }>
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/imaging/retention/policies/${policyId}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
          }
        );
        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || 'Failed to update policy');
          return null;
        }

        return data.data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update policy'
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deletePolicy = useCallback(async (policyId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/imaging/retention/policies/${policyId}`,
        {
          method: 'DELETE',
        }
      );
      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || 'Failed to delete policy');
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete policy');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Archive Operations
  // -------------------------------------------------------------------------

  const archiveImage = useCallback(
    async (imageId: string, reason?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/imaging/retention/archive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageId, reason }),
        });
        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || 'Failed to archive image');
          return false;
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to archive image');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const bulkArchive = useCallback(
    async (imageIds: string[], reason?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/imaging/retention/archive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageIds, reason }),
        });
        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || 'Failed to archive images');
          return { success: false, archived: 0 };
        }

        return { success: true, archived: data.data.archived };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to archive images');
        return { success: false, archived: 0 };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const restoreImage = useCallback(
    async (imageId: string, reason?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/imaging/retention/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageId, reason }),
        });
        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || 'Failed to restore image');
          return false;
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to restore image');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // -------------------------------------------------------------------------
  // Legal Hold
  // -------------------------------------------------------------------------

  const setLegalHold = useCallback(
    async (imageId: string, reason: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/imaging/retention/legal-hold', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageId, reason }),
        });
        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || 'Failed to set legal hold');
          return false;
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to set legal hold');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const removeLegalHold = useCallback(
    async (imageId: string, reason?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ imageId });
        if (reason) params.set('reason', reason);

        const response = await fetch(
          `/api/imaging/retention/legal-hold?${params}`,
          {
            method: 'DELETE',
          }
        );
        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || 'Failed to remove legal hold');
          return false;
        }

        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to remove legal hold'
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const fetchLegalHolds = useCallback(
    async (options?: { page?: number; pageSize?: number }) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (options?.page) params.set('page', String(options.page));
        if (options?.pageSize) params.set('pageSize', String(options.pageSize));

        const response = await fetch(
          `/api/imaging/retention/legal-hold?${params}`
        );
        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || 'Failed to fetch legal holds');
          return null;
        }

        return data.data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch legal holds'
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // -------------------------------------------------------------------------
  // Reports
  // -------------------------------------------------------------------------

  const fetchRetentionReport = useCallback(
    async (options?: {
      status?: 'expiring_soon' | 'expired' | 'archived' | 'legal_hold' | 'all';
      daysUntilExpiry?: number;
      category?: string;
      patientId?: string;
      page?: number;
      pageSize?: number;
    }) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (options?.status) params.set('status', options.status);
        if (options?.daysUntilExpiry)
          params.set('daysUntilExpiry', String(options.daysUntilExpiry));
        if (options?.category) params.set('category', options.category);
        if (options?.patientId) params.set('patientId', options.patientId);
        if (options?.page) params.set('page', String(options.page));
        if (options?.pageSize) params.set('pageSize', String(options.pageSize));

        const response = await fetch(
          `/api/imaging/retention/report?${params}`
        );
        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || 'Failed to fetch retention report');
          return null;
        }

        return data.data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch retention report'
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const fetchStorageReport = useCallback(
    async (groupBy?: 'category' | 'patient' | 'policy' | 'status') => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (groupBy) params.set('groupBy', groupBy);

        const response = await fetch(
          `/api/imaging/retention/storage?${params}`
        );
        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || 'Failed to fetch storage report');
          return null;
        }

        return data.data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch storage report'
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const fetchArchiveHistory = useCallback(
    async (options?: {
      imageId?: string;
      action?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      pageSize?: number;
    }) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (options?.imageId) params.set('imageId', options.imageId);
        if (options?.action) params.set('action', options.action);
        if (options?.startDate) params.set('startDate', options.startDate);
        if (options?.endDate) params.set('endDate', options.endDate);
        if (options?.page) params.set('page', String(options.page));
        if (options?.pageSize) params.set('pageSize', String(options.pageSize));

        const response = await fetch(
          `/api/imaging/retention/archive?${params}`
        );
        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || 'Failed to fetch archive history');
          return null;
        }

        return data.data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch archive history'
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // -------------------------------------------------------------------------
  // Utility
  // -------------------------------------------------------------------------

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isLoading,
    error,

    // Policy actions
    fetchPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,

    // Archive actions
    archiveImage,
    bulkArchive,
    restoreImage,
    fetchArchiveHistory,

    // Legal hold actions
    setLegalHold,
    removeLegalHold,
    fetchLegalHolds,

    // Reports
    fetchRetentionReport,
    fetchStorageReport,

    // Utility
    clearError,
  };
}
