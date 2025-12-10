'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Phone,
  Mail,
  Calendar,
  Target,
} from 'lucide-react';
import { format } from 'date-fns';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName, getFakePhone } from '@/lib/fake-data';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  source: string;
  stage: string;
  primaryConcern: string | null;
  consultationDate: string | null;
  createdAt: string;
  assignedTo: {
    firstName: string;
    lastName: string;
  } | null;
}

interface PipelineData {
  stages: {
    stage: string;
    leads: Lead[];
    count: number;
  }[];
  summary: {
    total: number;
    byStage: Record<string, number>;
  };
}

const stageConfig: { stage: string; label: string; color: string }[] = [
  { stage: 'INQUIRY', label: 'Inquiry', color: 'bg-secondary-100 border-secondary-300' },
  { stage: 'CONTACTED', label: 'Contacted', color: 'bg-info-100 border-info-300' },
  { stage: 'CONSULTATION_SCHEDULED', label: 'Scheduled', color: 'bg-warning-100 border-warning-300' },
  { stage: 'CONSULTATION_COMPLETED', label: 'Consulted', color: 'bg-primary-100 border-primary-300' },
  { stage: 'PENDING_DECISION', label: 'Pending', color: 'bg-warning-100 border-warning-300' },
  { stage: 'TREATMENT_ACCEPTED', label: 'Accepted', color: 'bg-success-100 border-success-300' },
];

const sourceLabels: Record<string, string> = {
  WEBSITE: 'Web',
  PHONE_CALL: 'Phone',
  WALK_IN: 'Walk-in',
  REFERRAL_DENTIST: 'Referral',
  REFERRAL_PATIENT: 'Referral',
  SOCIAL_MEDIA: 'Social',
  GOOGLE_ADS: 'Google',
  INSURANCE_DIRECTORY: 'Ins.',
  OTHER: 'Other',
};

export default function PipelinePage() {
  const router = useRouter();
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPipeline = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/leads/pipeline');
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch pipeline');
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPipeline();
  }, []);

  const getStageLeads = (stage: string) => {
    if (!data) return [];
    const stageData = data.stages.find((s) => s.stage === stage);
    return stageData?.leads || [];
  };

  const getStageCount = (stage: string) => {
    if (!data) return 0;
    return data.summary.byStage[stage] || 0;
  };

  return (
    <>
      <PageHeader
        title="Pipeline"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'CRM', href: '/crm' },
          { label: 'Pipeline' },
        ]}
        actions={
          <Link href="/crm/leads/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </Link>
        }
      />
      <PageContent density="comfortable">
        {loading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stageConfig.map((config) => (
              <div key={config.stage} className="flex-shrink-0 w-72">
                <Skeleton className="h-8 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p>{error}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stageConfig.map((config) => (
              <div key={config.stage} className="flex-shrink-0 w-72">
                {/* Column Header */}
                <div className={`p-3 rounded-t-lg border ${config.color}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{config.label}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {getStageCount(config.stage)}
                    </Badge>
                  </div>
                </div>

                {/* Column Content */}
                <div className="bg-muted/30 rounded-b-lg border border-t-0 p-2 min-h-[400px] space-y-2">
                  {getStageLeads(config.stage).length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No leads
                    </div>
                  ) : (
                    getStageLeads(config.stage).map((lead) => (
                      <Card
                        key={lead.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => router.push(`/crm/leads/${lead.id}`)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <PhiProtected fakeData={getFakeName()}>
                              <p className="font-medium text-sm">
                                {lead.firstName} {lead.lastName}
                              </p>
                            </PhiProtected>
                            <Badge variant="outline" className="text-xs">
                              {sourceLabels[lead.source] || lead.source}
                            </Badge>
                          </div>

                          {lead.primaryConcern && (
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {lead.primaryConcern}
                            </p>
                          )}

                          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                            <PhiProtected fakeData={getFakePhone()}>
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {lead.phone}
                              </span>
                            </PhiProtected>

                            {lead.consultationDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(lead.consultationDate), 'MMM d')}
                              </span>
                            )}
                          </div>

                          {lead.assignedTo && (
                            <div className="mt-2 pt-2 border-t flex items-center gap-1 text-xs text-muted-foreground">
                              <Target className="h-3 w-3" />
                              {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {data && (
          <Card variant="ghost" className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-xs text-muted-foreground">Total Active Leads</p>
                  <p className="text-2xl font-bold">{data.summary.total}</p>
                </div>
                <div className="flex gap-4">
                  {stageConfig.slice(0, 4).map((config) => (
                    <div key={config.stage}>
                      <p className="text-xs text-muted-foreground">{config.label}</p>
                      <p className="text-lg font-semibold">{getStageCount(config.stage)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </PageContent>
    </>
  );
}
