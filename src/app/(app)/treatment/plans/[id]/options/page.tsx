'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Plus,
  Star,
  Check,
  Clock,
  DollarSign,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TreatmentOption {
  id: string;
  optionNumber: number;
  optionName: string;
  description: string | null;
  applianceSystem: string;
  applianceDetails: string | null;
  estimatedDuration: number | null;
  estimatedVisits: number | null;
  estimatedCost: number | null;
  isRecommended: boolean;
  recommendationNotes: string | null;
  status: string;
  advantages: string[];
  disadvantages: string[];
}

interface TreatmentPlan {
  id: string;
  planNumber: string;
  planName: string;
  status: string;
}

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
  DRAFT: 'secondary',
  PRESENTED: 'info',
  SELECTED: 'success',
  DECLINED: 'destructive',
  ARCHIVED: 'secondary',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  PRESENTED: 'Presented',
  SELECTED: 'Selected',
  DECLINED: 'Declined',
  ARCHIVED: 'Archived',
};

const applianceSystemLabels: Record<string, string> = {
  TRADITIONAL_METAL: 'Traditional Metal Braces',
  TRADITIONAL_CERAMIC: 'Traditional Ceramic Braces',
  SELF_LIGATING_METAL: 'Self-Ligating Metal Braces',
  SELF_LIGATING_CERAMIC: 'Self-Ligating Ceramic Braces',
  LINGUAL: 'Lingual Braces',
  INVISALIGN: 'Invisalign',
  CLEAR_ALIGNERS_OTHER: 'Clear Aligners (Other)',
  COMBINATION: 'Combination Treatment',
  OTHER: 'Other',
};

export default function TreatmentOptionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [options, setOptions] = useState<TreatmentOption[]>([]);
  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch treatment plan info and options
        const [planRes, optionsRes] = await Promise.all([
          fetch(`/api/treatment-plans/${id}`),
          fetch(`/api/treatment-plans/${id}/options`),
        ]);

        const planData = await planRes.json();
        const optionsData = await optionsRes.json();

        if (!planData.success) {
          throw new Error(planData.error?.message || 'Failed to fetch treatment plan');
        }

        if (!optionsData.success) {
          throw new Error(optionsData.error?.message || 'Failed to fetch treatment options');
        }

        setPlan(planData.data);
        setOptions(optionsData.data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSelectOption = async (optionId: string) => {
    setSelecting(optionId);
    try {
      const response = await fetch(`/api/treatment-plans/${id}/options/${optionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectionNotes: '' }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to select option');
      }

      // Refresh options list
      const optionsRes = await fetch(`/api/treatment-plans/${id}/options`);
      const optionsData = await optionsRes.json();
      if (optionsData.success) {
        setOptions(optionsData.data.items || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSelecting(null);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Treatment Options"
          compact
          breadcrumbs={[
            { label: 'Treatment', href: '/treatment' },
            { label: 'Plans', href: '/treatment/plans' },
            { label: 'Loading...', href: `/treatment/plans/${id}` },
            { label: 'Options' },
          ]}
        />
        <PageContent density="comfortable">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </PageContent>
      </>
    );
  }

  if (error || !plan) {
    return (
      <>
        <PageHeader
          title="Treatment Options"
          compact
          breadcrumbs={[
            { label: 'Treatment', href: '/treatment' },
            { label: 'Plans', href: '/treatment/plans' },
            { label: 'Error' },
          ]}
        />
        <PageContent density="comfortable">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-warning-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Options</h3>
              <p className="text-muted-foreground mb-4">{error || 'Treatment plan not found'}</p>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </PageContent>
      </>
    );
  }

  const canEdit = !['COMPLETED', 'DISCONTINUED', 'TRANSFERRED'].includes(plan.status);
  const canSelect = plan.status === 'PRESENTED';
  const selectedOption = options.find((o) => o.status === 'SELECTED');

  return (
    <>
      <PageHeader
        title="Compare Treatment Options"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Plans', href: '/treatment/plans' },
          { label: plan.planNumber, href: `/treatment/plans/${id}` },
          { label: 'Options' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {canEdit && plan.status === 'DRAFT' && (
              <Link href={`/treatment/plans/${id}/options/new`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </Link>
            )}
          </div>
        }
      />
      <PageContent density="comfortable">
        {selectedOption && (
          <Card className="mb-6 border-success-200 bg-success-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-success-100">
                  <Check className="h-5 w-5 text-success-600" />
                </div>
                <div>
                  <p className="font-medium text-success-700">
                    Selected Option: {selectedOption.optionName}
                  </p>
                  <p className="text-sm text-success-600">
                    {applianceSystemLabels[selectedOption.applianceSystem]}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {options.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Treatment Options</h3>
              <p className="text-muted-foreground mb-4">
                No treatment options have been created for this plan yet.
              </p>
              {canEdit && plan.status === 'DRAFT' && (
                <Link href={`/treatment/plans/${id}/options/new`}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Option
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {options.map((option) => (
              <Card
                key={option.id}
                className={`relative ${
                  option.status === 'SELECTED'
                    ? 'ring-2 ring-success-500 bg-success-50/30'
                    : option.status === 'DECLINED'
                    ? 'opacity-60'
                    : ''
                }`}
              >
                {option.isRecommended && (
                  <div className="absolute -top-3 left-4 z-10">
                    <Badge variant="soft-primary" className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Recommended
                    </Badge>
                  </div>
                )}
                <CardHeader compact className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle size="sm">
                        Option {option.optionNumber}: {option.optionName}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {applianceSystemLabels[option.applianceSystem]}
                      </CardDescription>
                    </div>
                    <Badge variant={statusBadgeVariant[option.status]}>
                      {statusLabels[option.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent compact>
                  {option.description && (
                    <p className="text-sm text-muted-foreground mb-4">{option.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {option.estimatedDuration
                          ? `${option.estimatedDuration} months`
                          : 'TBD'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {option.estimatedVisits ? `${option.estimatedVisits} visits` : 'TBD'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm col-span-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {option.estimatedCost
                          ? `$${option.estimatedCost.toLocaleString()}`
                          : 'Quote pending'}
                      </span>
                    </div>
                  </div>

                  {option.advantages.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-success-600 mb-1 flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        Advantages
                      </p>
                      <ul className="text-xs space-y-1">
                        {option.advantages.slice(0, 3).map((adv, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-success-500 mt-0.5">+</span>
                            <span>{adv}</span>
                          </li>
                        ))}
                        {option.advantages.length > 3 && (
                          <li className="text-muted-foreground">
                            +{option.advantages.length - 3} more...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {option.disadvantages.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-destructive mb-1 flex items-center gap-1">
                        <ThumbsDown className="h-3 w-3" />
                        Considerations
                      </p>
                      <ul className="text-xs space-y-1">
                        {option.disadvantages.slice(0, 3).map((dis, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-destructive mt-0.5">-</span>
                            <span>{dis}</span>
                          </li>
                        ))}
                        {option.disadvantages.length > 3 && (
                          <li className="text-muted-foreground">
                            +{option.disadvantages.length - 3} more...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Link href={`/treatment/plans/${id}/options/${option.id}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        View Details
                      </Button>
                    </Link>
                    {canSelect && option.status !== 'SELECTED' && option.status !== 'DECLINED' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            disabled={selecting === option.id}
                            className="flex-1"
                          >
                            {selecting === option.id ? 'Selecting...' : 'Select'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Select This Option?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will mark &quot;{option.optionName}&quot; as the selected treatment
                              option. Other options will be marked as declined.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleSelectOption(option.id)}>
                              Select Option
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </PageContent>
    </>
  );
}
