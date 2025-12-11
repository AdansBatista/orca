'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  CheckCircle2,
  ArrowLeft,
  Search,
  Filter,
  ChevronRight,
  Calendar,
  Target,
  AlertTriangle,
  Check,
  X,
  Plus,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';

interface DebondAssessment {
  id: string;
  treatmentPlanId: string;
  planNumber: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  assessmentDate: string;
  readinessScore: number;
  isReadyForDebond: boolean;
  isApproved: boolean;
  targetDebondDate: string | null;
  actualDebondDate: string | null;
  alignmentComplete: boolean;
  occlusionCorrect: boolean;
  spaceClosure: boolean;
  rootParallelism: boolean;
  midlineCorrect: boolean;
  patientSatisfied: boolean;
}

export default function DebondReadinessPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<DebondAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        // In production, this would fetch from the actual API
        // For now, using simulated data
        setAssessments([
          {
            id: '1',
            treatmentPlanId: 'plan-1',
            planNumber: 'TP-2023-045',
            patient: { id: '1', firstName: 'Emily', lastName: 'Wilson' },
            assessmentDate: new Date(Date.now() - 7 * 86400000).toISOString(),
            readinessScore: 95,
            isReadyForDebond: true,
            isApproved: true,
            targetDebondDate: new Date(Date.now() + 7 * 86400000).toISOString(),
            actualDebondDate: null,
            alignmentComplete: true,
            occlusionCorrect: true,
            spaceClosure: true,
            rootParallelism: true,
            midlineCorrect: true,
            patientSatisfied: true,
          },
          {
            id: '2',
            treatmentPlanId: 'plan-2',
            planNumber: 'TP-2023-052',
            patient: { id: '2', firstName: 'David', lastName: 'Brown' },
            assessmentDate: new Date(Date.now() - 3 * 86400000).toISOString(),
            readinessScore: 83,
            isReadyForDebond: true,
            isApproved: false,
            targetDebondDate: new Date(Date.now() + 14 * 86400000).toISOString(),
            actualDebondDate: null,
            alignmentComplete: true,
            occlusionCorrect: true,
            spaceClosure: true,
            rootParallelism: true,
            midlineCorrect: false,
            patientSatisfied: true,
          },
          {
            id: '3',
            treatmentPlanId: 'plan-3',
            planNumber: 'TP-2023-068',
            patient: { id: '3', firstName: 'Lisa', lastName: 'Martinez' },
            assessmentDate: new Date(Date.now() - 1 * 86400000).toISOString(),
            readinessScore: 67,
            isReadyForDebond: false,
            isApproved: false,
            targetDebondDate: null,
            actualDebondDate: null,
            alignmentComplete: true,
            occlusionCorrect: false,
            spaceClosure: true,
            rootParallelism: false,
            midlineCorrect: true,
            patientSatisfied: false,
          },
          {
            id: '4',
            treatmentPlanId: 'plan-4',
            planNumber: 'TP-2023-039',
            patient: { id: '4', firstName: 'James', lastName: 'Anderson' },
            assessmentDate: new Date(Date.now() - 30 * 86400000).toISOString(),
            readinessScore: 100,
            isReadyForDebond: true,
            isApproved: true,
            targetDebondDate: new Date(Date.now() - 14 * 86400000).toISOString(),
            actualDebondDate: new Date(Date.now() - 14 * 86400000).toISOString(),
            alignmentComplete: true,
            occlusionCorrect: true,
            spaceClosure: true,
            rootParallelism: true,
            midlineCorrect: true,
            patientSatisfied: true,
          },
        ]);
      } catch (error) {
        console.error('Error fetching assessments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  const filteredAssessments = assessments.filter((assessment) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const patientName = `${assessment.patient.firstName} ${assessment.patient.lastName}`.toLowerCase();
      if (!patientName.includes(query) && !assessment.planNumber.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Status filter
    if (statusFilter === 'ready' && !assessment.isReadyForDebond) return false;
    if (statusFilter === 'not-ready' && assessment.isReadyForDebond) return false;
    if (statusFilter === 'approved' && !assessment.isApproved) return false;
    if (statusFilter === 'pending-approval' && (assessment.isApproved || !assessment.isReadyForDebond)) return false;
    if (statusFilter === 'completed' && !assessment.actualDebondDate) return false;

    return true;
  });

  // Summary stats
  const totalAssessments = assessments.length;
  const readyCount = assessments.filter((a) => a.isReadyForDebond && !a.actualDebondDate).length;
  const approvedCount = assessments.filter((a) => a.isApproved && !a.actualDebondDate).length;
  const completedCount = assessments.filter((a) => a.actualDebondDate).length;

  if (loading) {
    return (
      <>
        <PageHeader
          title="Debond Readiness"
          compact
          breadcrumbs={[
            { label: 'Treatment', href: '/treatment' },
            { label: 'Tracking', href: '/treatment/tracking' },
            { label: 'Debond' },
          ]}
        />
        <PageContent density="comfortable">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <div className="grid gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Debond Readiness"
        description="Assess and track patients ready for debonding"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Tracking', href: '/treatment/tracking' },
          { label: 'Debond' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Assessment
            </Button>
          </div>
        }
      />
      <PageContent density="comfortable">
        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{totalAssessments}</p>
              <p className="text-sm text-muted-foreground">Total Assessments</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-success-600">{readyCount}</p>
              <p className="text-sm text-muted-foreground">Ready for Debond</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary-600">{approvedCount}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-info-600">{completedCount}</p>
              <p className="text-sm text-muted-foreground">Debonded</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients or plan numbers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assessments</SelectItem>
                  <SelectItem value="ready">Ready for Debond</SelectItem>
                  <SelectItem value="not-ready">Not Ready</SelectItem>
                  <SelectItem value="pending-approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="completed">Debonded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Assessments List */}
        <Card>
          <CardHeader compact>
            <CardTitle size="sm" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Debond Assessments ({filteredAssessments.length})
            </CardTitle>
          </CardHeader>
          <CardContent compact>
            {filteredAssessments.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium mb-2">No Assessments Found</p>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No debond assessments have been recorded'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAssessments.map((assessment) => (
                  <Link key={assessment.id} href={`/treatment/tracking/debond/${assessment.id}`}>
                    <div className="flex items-start justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            assessment.actualDebondDate
                              ? 'bg-info-100'
                              : assessment.isApproved
                              ? 'bg-success-100'
                              : assessment.isReadyForDebond
                              ? 'bg-warning-100'
                              : 'bg-muted'
                          }`}
                        >
                          {assessment.actualDebondDate ? (
                            <CheckCircle2 className="h-6 w-6 text-info-600" />
                          ) : assessment.isApproved ? (
                            <Check className="h-6 w-6 text-success-600" />
                          ) : assessment.isReadyForDebond ? (
                            <Target className="h-6 w-6 text-warning-600" />
                          ) : (
                            <AlertTriangle className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <PhiProtected fakeData={getFakeName()}>
                            <p className="font-medium">
                              {assessment.patient.firstName} {assessment.patient.lastName}
                            </p>
                          </PhiProtected>
                          <p className="text-sm text-muted-foreground">{assessment.planNumber}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Assessed: {format(new Date(assessment.assessmentDate), 'MMM d, yyyy')}
                              </span>
                            </div>
                            {assessment.targetDebondDate && (
                              <div className="flex items-center gap-1">
                                <Target className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  Target: {format(new Date(assessment.targetDebondDate), 'MMM d, yyyy')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              assessment.actualDebondDate
                                ? 'info'
                                : assessment.isApproved
                                ? 'success'
                                : assessment.isReadyForDebond
                                ? 'warning'
                                : 'secondary'
                            }
                          >
                            {assessment.actualDebondDate
                              ? 'Debonded'
                              : assessment.isApproved
                              ? 'Approved'
                              : assessment.isReadyForDebond
                              ? 'Ready'
                              : 'Not Ready'}
                          </Badge>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">{assessment.readinessScore}%</span>
                          <span className="text-xs text-muted-foreground">readiness</span>
                        </div>

                        {/* Criteria indicators */}
                        <div className="flex gap-1">
                          {[
                            { key: 'alignmentComplete', label: 'AL' },
                            { key: 'occlusionCorrect', label: 'OC' },
                            { key: 'spaceClosure', label: 'SC' },
                            { key: 'rootParallelism', label: 'RP' },
                            { key: 'midlineCorrect', label: 'ML' },
                            { key: 'patientSatisfied', label: 'PS' },
                          ].map(({ key, label }) => (
                            <div
                              key={key}
                              className={`w-6 h-6 rounded text-xs flex items-center justify-center ${
                                assessment[key as keyof typeof assessment]
                                  ? 'bg-success-100 text-success-700'
                                  : 'bg-destructive/10 text-destructive'
                              }`}
                              title={label}
                            >
                              {assessment[key as keyof typeof assessment] ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PageContent>
    </>
  );
}
