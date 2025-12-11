'use client';

/**
 * Image Retention & Archival Management Page
 *
 * Comprehensive page for managing image retention policies, viewing compliance
 * dashboards, managing archives, and handling legal holds.
 */

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw } from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RetentionPolicyList,
  RetentionPolicyForm,
  RetentionDashboard,
  ArchiveManagement,
  LegalHoldManager,
} from '@/components/imaging';
import { useRetention, type RetentionPolicy } from '@/hooks/use-retention';

type TabValue = 'dashboard' | 'policies' | 'archive' | 'legal-holds';

export default function RetentionPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('dashboard');
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Policy form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<RetentionPolicy | null>(null);

  const {
    fetchPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    restoreImage,
    setLegalHold,
    removeLegalHold,
  } = useRetention();

  const loadPolicies = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await fetchPolicies();

    if (result) {
      setPolicies(result.items);
    } else {
      setError('Failed to load retention policies');
    }

    setLoading(false);
  }, [fetchPolicies]);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  const handleCreatePolicy = () => {
    setEditingPolicy(null);
    setFormOpen(true);
  };

  const handleEditPolicy = (policy: RetentionPolicy) => {
    setEditingPolicy(policy);
    setFormOpen(true);
  };

  const handleSetDefault = async (policyId: string) => {
    const result = await updatePolicy(policyId, { isDefault: true });
    if (result) {
      loadPolicies();
    }
  };

  const handleToggleActive = async (policy: RetentionPolicy) => {
    const result = await updatePolicy(policy.id, { isActive: !policy.isActive });
    if (result) {
      loadPolicies();
    }
  };

  const handleDeletePolicy = async (policyId: string): Promise<boolean> => {
    const success = await deletePolicy(policyId);
    if (success) {
      loadPolicies();
    }
    return success;
  };

  const handleFormSubmit = async (data: {
    name: string;
    description: string;
    isDefault: boolean;
    imageCategories: string[];
    retentionYears: number;
    retentionForMinorsYears: number | null;
    archiveAfterYears: number | null;
    notifyBeforeArchive: number | null;
    autoExtendOnAccess: boolean;
  }): Promise<boolean> => {
    let result;

    if (editingPolicy) {
      result = await updatePolicy(editingPolicy.id, {
        name: data.name,
        description: data.description || null,
        isDefault: data.isDefault,
        imageCategories: data.imageCategories,
        retentionYears: data.retentionYears,
        retentionForMinorsYears: data.retentionForMinorsYears,
        archiveAfterYears: data.archiveAfterYears,
        notifyBeforeArchive: data.notifyBeforeArchive,
        autoExtendOnAccess: data.autoExtendOnAccess,
      });
    } else {
      result = await createPolicy({
        name: data.name,
        description: data.description || undefined,
        isDefault: data.isDefault,
        imageCategories: data.imageCategories,
        retentionYears: data.retentionYears,
        retentionForMinorsYears: data.retentionForMinorsYears || undefined,
        archiveAfterYears: data.archiveAfterYears || undefined,
        notifyBeforeArchive: data.notifyBeforeArchive || undefined,
        autoExtendOnAccess: data.autoExtendOnAccess,
      });
    }

    if (result) {
      loadPolicies();
      return true;
    }

    return false;
  };

  const handleRestoreImage = async (imageId: string, reason?: string): Promise<boolean> => {
    return await restoreImage(imageId, reason);
  };

  const handleSetLegalHold = async (imageId: string, reason: string): Promise<boolean> => {
    return await setLegalHold(imageId, reason);
  };

  const handleRemoveLegalHold = async (imageId: string, reason?: string): Promise<boolean> => {
    return await removeLegalHold(imageId, reason);
  };

  const handleNavigateToExpiring = () => {
    // Could navigate to a filtered view of expiring images
    setActiveTab('archive');
  };

  const handleNavigateToArchived = () => {
    setActiveTab('archive');
  };

  const handleNavigateToLegalHold = () => {
    setActiveTab('legal-holds');
  };

  return (
    <>
      <PageHeader
        title="Retention & Archival"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Imaging', href: '/imaging' },
          { label: 'Retention' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadPolicies} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {activeTab === 'policies' && (
              <Button onClick={handleCreatePolicy}>
                <Plus className="h-4 w-4 mr-2" />
                New Policy
              </Button>
            )}
          </div>
        }
      />

      <PageContent density="comfortable">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="archive">Archive History</TabsTrigger>
            <TabsTrigger value="legal-holds">Legal Holds</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <RetentionDashboard
              onNavigateToExpiring={handleNavigateToExpiring}
              onNavigateToArchived={handleNavigateToArchived}
              onNavigateToLegalHold={handleNavigateToLegalHold}
            />
          </TabsContent>

          <TabsContent value="policies">
            <RetentionPolicyList
              policies={policies}
              loading={loading}
              error={error}
              onCreatePolicy={handleCreatePolicy}
              onEditPolicy={handleEditPolicy}
              onSetDefault={handleSetDefault}
              onToggleActive={handleToggleActive}
              onDeletePolicy={handleDeletePolicy}
            />
          </TabsContent>

          <TabsContent value="archive">
            <ArchiveManagement onRestoreImage={handleRestoreImage} />
          </TabsContent>

          <TabsContent value="legal-holds">
            <LegalHoldManager
              onSetLegalHold={handleSetLegalHold}
              onRemoveLegalHold={handleRemoveLegalHold}
            />
          </TabsContent>
        </Tabs>
      </PageContent>

      {/* Policy Form Dialog */}
      <RetentionPolicyForm
        open={formOpen}
        onOpenChange={setFormOpen}
        policy={editingPolicy}
        onSubmit={handleFormSubmit}
      />
    </>
  );
}
