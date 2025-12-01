'use client';

import { useState, useEffect, useCallback } from 'react';
import type { OvertimeLog, StaffProfile } from '@prisma/client';

import { PageHeader, PageContent } from '@/components/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { OvertimeList } from '@/components/staff/scheduling/OvertimeList';
import { OvertimeCalculator } from '@/components/staff/scheduling/OvertimeCalculator';

interface OvertimeLogWithStaff extends OvertimeLog {
  staffProfile: Pick<StaffProfile, 'id' | 'firstName' | 'lastName' | 'email' | 'title' | 'department'>;
}

interface WeeklyOvertimeCalculation {
  staffProfileId: string;
  staffName: string;
  weekStartDate: string;
  weekEndDate: string;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  existingLogId: string | null;
  existingLogStatus: string | null;
}

interface OvertimeSummary {
  totalStaff: number;
  totalWeeks: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  staffWithOvertime: number;
  newLogsCreated: number;
}

export default function OvertimePage() {
  const [logs, setLogs] = useState<OvertimeLogWithStaff[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/staff/overtime?pageSize=50');
      const data = await response.json();

      if (data.success) {
        setLogs(data.data.items);
      } else {
        toast({
          title: 'Error',
          description: data.error?.message || 'Failed to load overtime logs',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load overtime logs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleCalculate = async (params: {
    startDate: string;
    endDate: string;
    regularHoursThreshold: number;
    createLogs: boolean;
  }): Promise<{ calculations: WeeklyOvertimeCalculation[]; summary: OvertimeSummary } | null> => {
    try {
      const response = await fetch('/api/staff/overtime/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const result = await response.json();

      if (result.success) {
        // Refresh logs if new ones were created
        if (params.createLogs) {
          fetchLogs();
        }
        return result.data;
      } else {
        toast({
          title: 'Error',
          description: result.error?.message || 'Failed to calculate overtime',
          variant: 'destructive',
        });
        return null;
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to calculate overtime',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleApprove = async (id: string, notes?: string) => {
    try {
      const response = await fetch(`/api/staff/overtime/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Overtime approved successfully',
        });
        fetchLogs();
      } else {
        toast({
          title: 'Error',
          description: result.error?.message || 'Failed to approve overtime',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to approve overtime',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      const response = await fetch(`/api/staff/overtime/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Overtime rejected',
        });
        fetchLogs();
      } else {
        toast({
          title: 'Error',
          description: result.error?.message || 'Failed to reject overtime',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to reject overtime',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Overtime Tracking"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Staff', href: '/staff' },
          { label: 'Schedules', href: '/staff/schedules' },
          { label: 'Overtime' },
        ]}
      />
      <PageContent density="comfortable">
        <Tabs defaultValue="calculator" className="space-y-6">
          <TabsList>
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="logs">Overtime Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-6">
            <OvertimeCalculator onCalculate={handleCalculate} />
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <OvertimeList
              logs={logs}
              onApprove={handleApprove}
              onReject={handleReject}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </PageContent>
    </>
  );
}
