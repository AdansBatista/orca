'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  ClipboardList,
  Activity,
  Ruler,
  FileCog,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

import { PageHeader, PageContent, StatsRow, DashboardGrid } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';
import { format } from 'date-fns';

interface DocumentationStats {
  totalNotes: number;
  draftNotes: number;
  pendingSignature: number;
  signedToday: number;
  totalProcedures: number;
  totalFindings: number;
  actionRequiredFindings: number;
  totalMeasurements: number;
}

interface RecentNote {
  id: string;
  noteDate: string;
  noteType: string;
  status: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  provider: {
    firstName: string;
    lastName: string;
  };
}

const noteTypeLabels: Record<string, string> = {
  INITIAL_EXAM: 'Initial Exam',
  CONSULTATION: 'Consultation',
  RECORDS_APPOINTMENT: 'Records',
  BONDING: 'Bonding',
  ADJUSTMENT: 'Adjustment',
  EMERGENCY: 'Emergency',
  DEBOND: 'Debond',
  RETENTION_CHECK: 'Retention Check',
  OBSERVATION: 'Observation',
  GENERAL: 'General',
};

const noteStatusBadgeVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'info'> = {
  DRAFT: 'secondary',
  PENDING_SIGNATURE: 'warning',
  SIGNED: 'success',
  PENDING_COSIGN: 'info',
  COSIGNED: 'success',
  AMENDED: 'default',
};

const noteStatusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_SIGNATURE: 'Pending Signature',
  SIGNED: 'Signed',
  PENDING_COSIGN: 'Pending Co-sign',
  COSIGNED: 'Co-signed',
  AMENDED: 'Amended',
};

export default function ClinicalDocumentationPage() {
  const [stats, setStats] = useState<DocumentationStats | null>(null);
  const [recentNotes, setRecentNotes] = useState<RecentNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recent notes
        const notesResponse = await fetch('/api/progress-notes?pageSize=5&sortBy=noteDate&sortOrder=desc');
        const notesResult = await notesResponse.json();

        if (notesResult.success) {
          setRecentNotes(notesResult.data.items);

          // Calculate basic stats
          const allNotesResponse = await fetch('/api/progress-notes?pageSize=1000');
          const allNotesResult = await allNotesResponse.json();

          if (allNotesResult.success) {
            const allNotes = allNotesResult.data.items;
            const today = new Date().toDateString();

            setStats({
              totalNotes: allNotesResult.data.total,
              draftNotes: allNotes.filter((n: RecentNote) => n.status === 'DRAFT').length,
              pendingSignature: allNotes.filter((n: RecentNote) =>
                ['PENDING_SIGNATURE', 'PENDING_COSIGN'].includes(n.status)
              ).length,
              signedToday: allNotes.filter((n: RecentNote) =>
                ['SIGNED', 'COSIGNED'].includes(n.status) &&
                new Date(n.noteDate).toDateString() === today
              ).length,
              totalProcedures: 0,
              totalFindings: 0,
              actionRequiredFindings: 0,
              totalMeasurements: 0,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch documentation data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Clinical Documentation"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Treatment', href: '/treatment' },
            { label: 'Documentation' },
          ]}
        />
        <PageContent density="comfortable">
          <div className="space-y-6">
            <StatsRow>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </StatsRow>
            <Skeleton className="h-64" />
          </div>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Clinical Documentation"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Treatment', href: '/treatment' },
          { label: 'Documentation' },
        ]}
        actions={
          <div className="flex gap-2">
            <Link href="/treatment/documentation/notes/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Progress Note
              </Button>
            </Link>
          </div>
        }
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Stats */}
          <StatsRow>
            <StatCard accentColor="primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Notes</p>
                  <p className="text-2xl font-bold">{stats?.totalNotes || 0}</p>
                  <p className="text-xs text-muted-foreground">All time</p>
                </div>
                <FileText className="h-8 w-8 text-primary-500" />
              </div>
            </StatCard>
            <StatCard accentColor="warning">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending Signature</p>
                  <p className="text-2xl font-bold">{stats?.pendingSignature || 0}</p>
                  <p className="text-xs text-warning-600">Need attention</p>
                </div>
                <Clock className="h-8 w-8 text-warning-500" />
              </div>
            </StatCard>
            <StatCard accentColor="secondary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Draft Notes</p>
                  <p className="text-2xl font-bold">{stats?.draftNotes || 0}</p>
                  <p className="text-xs text-muted-foreground">In progress</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </StatCard>
            <StatCard accentColor="success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Signed Today</p>
                  <p className="text-2xl font-bold">{stats?.signedToday || 0}</p>
                  <p className="text-xs text-success-600">Completed</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success-500" />
              </div>
            </StatCard>
          </StatsRow>

          <DashboardGrid>
            <DashboardGrid.TwoThirds className="space-y-4">
              {/* Recent Progress Notes */}
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Recent Progress Notes
                  </CardTitle>
                  <CardDescription>Latest clinical documentation</CardDescription>
                </CardHeader>
                <CardContent compact>
                  {recentNotes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No progress notes yet</p>
                      <Link href="/treatment/documentation/notes/new">
                        <Button variant="outline" size="sm" className="mt-3">
                          Create First Note
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentNotes.map((note) => (
                        <Link
                          key={note.id}
                          href={`/treatment/documentation/notes/${note.id}`}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {noteTypeLabels[note.noteType] || note.noteType}
                              </Badge>
                              <Badge variant={noteStatusBadgeVariant[note.status] || 'secondary'}>
                                {noteStatusLabels[note.status] || note.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              <PhiProtected fakeData={getFakeName()}>
                                {note.patient.firstName} {note.patient.lastName}
                              </PhiProtected>
                              {' • '}
                              Dr. {note.provider.firstName} {note.provider.lastName}
                            </p>
                          </div>
                          <div className="text-xs text-muted-foreground ml-4">
                            {format(new Date(note.noteDate), 'MMM d, yyyy')}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t">
                    <Link href="/treatment/documentation/notes">
                      <Button variant="outline" size="sm" className="w-full">
                        View All Progress Notes
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Documentation Categories */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="hover:border-primary-200 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary-100">
                        <ClipboardList className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium">Procedures</p>
                        <p className="text-xs text-muted-foreground">
                          {stats?.totalProcedures || 0} recorded
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:border-warning-200 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-warning-100">
                        <AlertCircle className="h-5 w-5 text-warning-600" />
                      </div>
                      <div>
                        <p className="font-medium">Clinical Findings</p>
                        <p className="text-xs text-muted-foreground">
                          {stats?.actionRequiredFindings || 0} need action
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:border-accent-200 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-accent-100">
                        <Ruler className="h-5 w-5 text-accent-600" />
                      </div>
                      <div>
                        <p className="font-medium">Measurements</p>
                        <p className="text-xs text-muted-foreground">
                          {stats?.totalMeasurements || 0} recorded
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </DashboardGrid.TwoThirds>

            <DashboardGrid.OneThird className="space-y-4">
              {/* Quick Actions */}
              <Card variant="ghost">
                <CardHeader compact>
                  <CardTitle size="sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent compact className="space-y-2">
                  <Link href="/treatment/documentation/notes" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      View All Notes
                    </Button>
                  </Link>
                  <Link href="/treatment/documentation/notes/new" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="h-4 w-4 mr-2" />
                      New Progress Note
                    </Button>
                  </Link>
                  <Link href="/treatment/documentation/templates" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <FileCog className="h-4 w-4 mr-2" />
                      Note Templates
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Pending Signatures Alert */}
              {stats && stats.pendingSignature > 0 && (
                <Card variant="ghost" className="border-warning-200 bg-warning-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-warning-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-warning-700">
                          Pending Signatures
                        </p>
                        <p className="text-xs text-warning-600">
                          You have {stats.pendingSignature} notes awaiting signature
                        </p>
                        <Link href="/treatment/documentation/notes?status=PENDING_SIGNATURE">
                          <Button variant="link" size="sm" className="p-0 h-auto mt-1 text-warning-700">
                            Review now →
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Note Types Guide */}
              <Card>
                <CardHeader compact>
                  <CardTitle size="sm">Note Types</CardTitle>
                </CardHeader>
                <CardContent compact>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Initial Exam</span>
                      <Badge variant="outline" className="text-xs">INITIAL_EXAM</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Adjustment</span>
                      <Badge variant="outline" className="text-xs">ADJUSTMENT</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Emergency</span>
                      <Badge variant="outline" className="text-xs">EMERGENCY</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Debond</span>
                      <Badge variant="outline" className="text-xs">DEBOND</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DashboardGrid.OneThird>
          </DashboardGrid>
        </div>
      </PageContent>
    </>
  );
}
