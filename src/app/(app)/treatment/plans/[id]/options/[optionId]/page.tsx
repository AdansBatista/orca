'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Star,
  Check,
  Clock,
  DollarSign,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
} from 'lucide-react';

import { PageHeader, PageContent, DashboardGrid } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface TreatmentOptionDetail {
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
  selectedDate: string | null;
  selectionNotes: string | null;
  advantages: string[];
  disadvantages: string[];
  createdAt: string;
  updatedAt: string;
  treatmentPlan: {
    id: string;
    planNumber: string;
    planName: string;
    status: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
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

export default function TreatmentOptionDetailPage({
  params,
}: {
  params: Promise<{ id: string; optionId: string }>;
}) {
  const { id: planId, optionId } = use(params);
  const router = useRouter();
  const [option, setOption] = useState<TreatmentOptionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    const fetchOption = async () => {
      try {
        const response = await fetch(`/api/treatment-plans/${planId}/options/${optionId}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch treatment option');
        }

        setOption(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchOption();
  }, [planId, optionId]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/treatment-plans/${planId}/options/${optionId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete option');
      }

      router.push(`/treatment/plans/${planId}/options`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setDeleting(false);
    }
  };

  const handleSelect = async () => {
    setSelecting(true);
    try {
      const response = await fetch(`/api/treatment-plans/${planId}/options/${optionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectionNotes: '' }),
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to select option');
      }

      setOption(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSelecting(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Treatment Option"
          compact
          breadcrumbs={[
            { label: 'Treatment', href: '/treatment' },
            { label: 'Plans', href: '/treatment/plans' },
            { label: 'Loading...' },
          ]}
        />
        <PageContent density="comfortable">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </PageContent>
      </>
    );
  }

  if (error || !option) {
    return (
      <>
        <PageHeader
          title="Treatment Option"
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
              <AlertCircle className="h-12 w-12 mx-auto text-warning-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Option</h3>
              <p className="text-muted-foreground mb-4">{error || 'Option not found'}</p>
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

  const canEdit = option.treatmentPlan.status === 'DRAFT' && option.status === 'DRAFT';
  const canDelete = canEdit;
  const canSelect = option.treatmentPlan.status === 'PRESENTED' &&
                   option.status !== 'SELECTED' &&
                   option.status !== 'DECLINED';

  return (
    <>
      <PageHeader
        title={`Option ${option.optionNumber}: ${option.optionName}`}
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Plans', href: '/treatment/plans' },
          { label: option.treatmentPlan.planNumber, href: `/treatment/plans/${planId}` },
          { label: 'Options', href: `/treatment/plans/${planId}/options` },
          { label: option.optionName },
        ]}
        actions={
          <div className="flex gap-2">
            {canSelect && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={selecting}>
                    <Check className="h-4 w-4 mr-2" />
                    {selecting ? 'Selecting...' : 'Select Option'}
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
                    <AlertDialogAction onClick={handleSelect}>
                      Select Option
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {canEdit && (
              <Link href={`/treatment/plans/${planId}/options/${optionId}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
            )}
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={deleting}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Treatment Option?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this
                      treatment option.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        }
      />
      <PageContent density="comfortable">
        <DashboardGrid>
          <DashboardGrid.TwoThirds className="space-y-4">
            {/* Status Banner */}
            {option.status === 'SELECTED' && (
              <Card className="border-success-200 bg-success-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-success-100">
                      <Check className="h-5 w-5 text-success-600" />
                    </div>
                    <div>
                      <p className="font-medium text-success-700">Selected Option</p>
                      {option.selectedDate && (
                        <p className="text-sm text-success-600">
                          Selected on {format(new Date(option.selectedDate), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Option Details */}
            <Card>
              <CardHeader compact>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle size="sm">Option Details</CardTitle>
                    {option.isRecommended && (
                      <Badge variant="soft-primary" className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <Badge variant={statusBadgeVariant[option.status]}>
                    {statusLabels[option.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent compact className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Appliance System</p>
                    <p className="font-medium">
                      {applianceSystemLabels[option.applianceSystem]}
                    </p>
                  </div>
                  {option.applianceDetails && (
                    <div>
                      <p className="text-sm text-muted-foreground">Details</p>
                      <p className="font-medium">{option.applianceDetails}</p>
                    </div>
                  )}
                </div>

                {option.description && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{option.description}</p>
                  </div>
                )}

                {option.isRecommended && option.recommendationNotes && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Recommendation Notes</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">
                      {option.recommendationNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Estimates */}
            <Card>
              <CardHeader compact>
                <CardTitle size="sm">Treatment Estimates</CardTitle>
              </CardHeader>
              <CardContent compact>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-bold">
                      {option.estimatedDuration || '—'}
                    </p>
                    <p className="text-sm text-muted-foreground">months</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Calendar className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-bold">
                      {option.estimatedVisits || '—'}
                    </p>
                    <p className="text-sm text-muted-foreground">visits</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <DollarSign className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-bold">
                      {option.estimatedCost
                        ? `$${option.estimatedCost.toLocaleString()}`
                        : '—'}
                    </p>
                    <p className="text-sm text-muted-foreground">estimated cost</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pros and Cons */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm" className="flex items-center gap-2 text-success-600">
                    <ThumbsUp className="h-4 w-4" />
                    Advantages
                  </CardTitle>
                </CardHeader>
                <CardContent compact>
                  {option.advantages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No advantages listed
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {option.advantages.map((adv, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-success-500 font-bold mt-0.5">+</span>
                          <span>{adv}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader compact>
                  <CardTitle size="sm" className="flex items-center gap-2 text-destructive">
                    <ThumbsDown className="h-4 w-4" />
                    Considerations
                  </CardTitle>
                </CardHeader>
                <CardContent compact>
                  {option.disadvantages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No considerations listed
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {option.disadvantages.map((dis, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-destructive font-bold mt-0.5">-</span>
                          <span>{dis}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </DashboardGrid.TwoThirds>

          <DashboardGrid.OneThird className="space-y-4">
            {/* Treatment Plan Info */}
            <Card>
              <CardHeader compact>
                <CardTitle size="sm">Treatment Plan</CardTitle>
              </CardHeader>
              <CardContent compact>
                <Link
                  href={`/treatment/plans/${planId}`}
                  className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <p className="font-medium">{option.treatmentPlan.planName || option.treatmentPlan.planNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {option.treatmentPlan.planNumber}
                  </p>
                </Link>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card variant="ghost">
              <CardHeader compact>
                <CardTitle size="sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent compact className="space-y-2">
                <Link
                  href={`/treatment/plans/${planId}/options`}
                  className="block"
                >
                  <Button variant="outline" className="w-full justify-start">
                    Compare All Options
                  </Button>
                </Link>
                <Link
                  href={`/treatment/plans/${planId}`}
                  className="block"
                >
                  <Button variant="outline" className="w-full justify-start">
                    View Treatment Plan
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card variant="ghost">
              <CardHeader compact>
                <CardTitle size="sm">History</CardTitle>
              </CardHeader>
              <CardContent compact className="text-xs text-muted-foreground space-y-1">
                <p>Created: {format(new Date(option.createdAt), 'MMM d, yyyy h:mm a')}</p>
                <p>Updated: {format(new Date(option.updatedAt), 'MMM d, yyyy h:mm a')}</p>
                {option.selectedDate && (
                  <p>Selected: {format(new Date(option.selectedDate), 'MMM d, yyyy h:mm a')}</p>
                )}
              </CardContent>
            </Card>
          </DashboardGrid.OneThird>
        </DashboardGrid>
      </PageContent>
    </>
  );
}
