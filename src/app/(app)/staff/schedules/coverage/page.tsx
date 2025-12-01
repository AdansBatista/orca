'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { Plus, RefreshCw, Calendar } from 'lucide-react';
import type { CoverageRequirement } from '@prisma/client';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { toast } from '@/components/ui/use-toast';
import { CoverageRequirementList } from '@/components/staff/scheduling/CoverageRequirementList';
import { CoverageRequirementForm } from '@/components/staff/scheduling/CoverageRequirementForm';
import { CoverageGapsList } from '@/components/staff/scheduling/CoverageGapsList';
import type { CreateCoverageRequirementInput } from '@/lib/validations/scheduling';

interface CoverageGap {
  date: string;
  dayOfWeek: number;
  timeSlot: string | null;
  requirementId: string;
  requirementName: string;
  locationId: string;
  department: string | null;
  providerType: string | null;
  required: number;
  scheduled: number;
  gap: number;
  isCritical: boolean;
  priority: number;
}

interface CoverageStatus {
  date: string;
  gaps: CoverageGap[];
  totalGaps: number;
  criticalGaps: number;
}

interface CoverageGapSummary {
  totalDays: number;
  daysWithGaps: number;
  totalGaps: number;
  criticalGaps: number;
}

// Placeholder location ID - in production this would come from context/selection
const LOCATION_ID = 'placeholder-location-id';

export default function CoverageManagementPage() {
  const [requirements, setRequirements] = useState<CoverageRequirement[]>([]);
  const [gaps, setGaps] = useState<CoverageStatus[]>([]);
  const [summary, setSummary] = useState<CoverageGapSummary>({
    totalDays: 0,
    daysWithGaps: 0,
    totalGaps: 0,
    criticalGaps: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingGaps, setIsLoadingGaps] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<CoverageRequirement | null>(null);

  // Date range for gap analysis
  const today = new Date();
  const [startDate, setStartDate] = useState(format(startOfWeek(today), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfWeek(addDays(today, 14)), 'yyyy-MM-dd'));

  const fetchRequirements = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/staff/coverage');
      const data = await response.json();

      if (data.success) {
        setRequirements(data.data.items);
      } else {
        toast({
          title: 'Error',
          description: data.error?.message || 'Failed to load coverage requirements',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load coverage requirements',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchGaps = useCallback(async () => {
    if (!startDate || !endDate) return;

    setIsLoadingGaps(true);
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
      });
      const response = await fetch(`/api/staff/coverage/gaps?${params}`);
      const data = await response.json();

      if (data.success) {
        setGaps(data.data.gaps);
        setSummary(data.data.summary);
      } else {
        toast({
          title: 'Error',
          description: data.error?.message || 'Failed to analyze coverage gaps',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to analyze coverage gaps',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingGaps(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  useEffect(() => {
    if (requirements.length > 0) {
      fetchGaps();
    }
  }, [requirements.length, fetchGaps]);

  const handleCreateRequirement = async (data: CreateCoverageRequirementInput) => {
    try {
      const response = await fetch('/api/staff/coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Coverage requirement created successfully',
        });
        fetchRequirements();
        fetchGaps();
      } else {
        toast({
          title: 'Error',
          description: result.error?.message || 'Failed to create coverage requirement',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create coverage requirement',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateRequirement = async (data: CreateCoverageRequirementInput) => {
    if (!editingRequirement) return;

    try {
      const response = await fetch(`/api/staff/coverage/${editingRequirement.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Coverage requirement updated successfully',
        });
        setEditingRequirement(null);
        fetchRequirements();
        fetchGaps();
      } else {
        toast({
          title: 'Error',
          description: result.error?.message || 'Failed to update coverage requirement',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update coverage requirement',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRequirement = async (id: string) => {
    try {
      const response = await fetch(`/api/staff/coverage/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Coverage requirement deleted successfully',
        });
        fetchRequirements();
        fetchGaps();
      } else {
        toast({
          title: 'Error',
          description: result.error?.message || 'Failed to delete coverage requirement',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete coverage requirement',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (requirement: CoverageRequirement) => {
    setEditingRequirement(requirement);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingRequirement(null);
  };

  return (
    <>
      <PageHeader
        title="Coverage Management"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Staff', href: '/staff' },
          { label: 'Schedules', href: '/staff/schedules' },
          { label: 'Coverage' },
        ]}
      />
      <PageContent density="comfortable">
        <Tabs defaultValue="gaps" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="gaps">Coverage Gaps</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
            </TabsList>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Requirement
            </Button>
          </div>

          <TabsContent value="gaps" className="space-y-6">
            <Card variant="ghost">
              <CardContent className="p-4">
                <div className="flex items-end gap-4 flex-wrap">
                  <FormField label="Start Date">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </FormField>
                  <FormField label="End Date">
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </FormField>
                  <Button variant="outline" onClick={fetchGaps} disabled={isLoadingGaps}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingGaps ? 'animate-spin' : ''}`} />
                    Analyze
                  </Button>
                </div>
              </CardContent>
            </Card>

            <CoverageGapsList
              gaps={gaps}
              summary={summary}
              isLoading={isLoadingGaps}
            />
          </TabsContent>

          <TabsContent value="requirements" className="space-y-6">
            <CoverageRequirementList
              requirements={requirements}
              onEdit={handleEdit}
              onDelete={handleDeleteRequirement}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>

        <CoverageRequirementForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSubmit={editingRequirement ? handleUpdateRequirement : handleCreateRequirement}
          requirement={editingRequirement}
          locationId={LOCATION_ID}
        />
      </PageContent>
    </>
  );
}
