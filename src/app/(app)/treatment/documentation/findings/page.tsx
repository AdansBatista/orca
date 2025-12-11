'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ListItem, ListItemTitle, ListItemDescription } from '@/components/ui/list-item';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';
import { Pagination } from '@/components/ui/pagination';

interface ClinicalFinding {
  id: string;
  findingType: string;
  description: string;
  severity: string | null;
  toothNumbers: number[];
  location: string | null;
  actionRequired: boolean;
  actionTaken: string | null;
  followUpRequired: boolean;
  createdAt: string;
  progressNote: {
    id: string;
    noteDate: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
}

const findingTypeLabels: Record<string, string> = {
  DECALCIFICATION: 'Decalcification',
  CARIES: 'Caries',
  GINGIVITIS: 'Gingivitis',
  BRACKET_ISSUE: 'Bracket Issue',
  WIRE_ISSUE: 'Wire Issue',
  ELASTIC_COMPLIANCE: 'Elastic Compliance',
  ORAL_HYGIENE: 'Oral Hygiene',
  ROOT_RESORPTION: 'Root Resorption',
  IMPACTION: 'Impaction',
  ECTOPIC_ERUPTION: 'Ectopic Eruption',
  ANKYLOSIS: 'Ankylosis',
  OTHER: 'Other',
};

const severityLabels: Record<string, string> = {
  MILD: 'Mild',
  MODERATE: 'Moderate',
  SEVERE: 'Severe',
};

const severityVariants: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  MILD: 'success',
  MODERATE: 'warning',
  SEVERE: 'destructive',
};

function FindingsListPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [findings, setFindings] = useState<ClinicalFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [findingType, setFindingType] = useState(searchParams.get('findingType') || 'all');
  const [severity, setSeverity] = useState(searchParams.get('severity') || 'all');
  const [actionRequired, setActionRequired] = useState(searchParams.get('actionRequired') || 'all');

  const fetchFindings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (findingType && findingType !== 'all') params.set('findingType', findingType);
      if (severity && severity !== 'all') params.set('severity', severity);
      if (actionRequired && actionRequired !== 'all') {
        params.set('actionRequired', actionRequired === 'yes' ? 'true' : 'false');
      }
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());
      params.set('sortBy', 'createdAt');
      params.set('sortOrder', 'desc');

      const res = await fetch(`/api/clinical-findings?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setFindings(data.data.items);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Error fetching findings:', error);
    } finally {
      setLoading(false);
    }
  }, [search, findingType, severity, actionRequired, page, pageSize]);

  useEffect(() => {
    fetchFindings();
  }, [fetchFindings]);

  const totalPages = Math.ceil(total / pageSize);

  const formatTeeth = (teeth: number[]) => {
    if (teeth.length === 0) return null;
    return teeth.sort((a, b) => a - b).join(', ');
  };

  return (
    <>
      <PageHeader
        title="Clinical Findings"
        description="Track clinical observations and issues"
        compact
        breadcrumbs={[
          { label: 'Treatment', href: '/treatment' },
          { label: 'Documentation', href: '/treatment/documentation' },
          { label: 'Findings' },
        ]}
        actions={
          <Button onClick={() => router.push('/treatment/documentation/notes/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Progress Note
          </Button>
        }
      />

      <PageContent>
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by description or patient..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={findingType} onValueChange={(value) => { setFindingType(value); setPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Finding Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(findingTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={severity} onValueChange={(value) => { setSeverity(value); setPage(1); }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  {Object.entries(severityLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={actionRequired} onValueChange={(value) => { setActionRequired(value); setPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Action Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Action Required</SelectItem>
                  <SelectItem value="no">No Action Needed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : findings.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No clinical findings found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Findings are documented within progress notes
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push('/treatment/documentation/notes/new')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Progress Note
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {findings.map((finding) => (
                  <ListItem
                    key={finding.id}
                    showArrow
                    className="px-4"
                    onClick={() => router.push(`/treatment/documentation/notes/${finding.progressNote.id}`)}
                    leading={
                      <div className={`p-2 rounded-lg ${
                        finding.actionRequired ? 'bg-warning-100' : 'bg-muted'
                      }`}>
                        {finding.actionRequired ? (
                          <AlertTriangle className="h-5 w-5 text-warning" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    }
                    trailing={
                      <div className="flex flex-col items-end gap-1">
                        {finding.severity && (
                          <Badge variant={severityVariants[finding.severity] || 'secondary'}>
                            {severityLabels[finding.severity] || finding.severity}
                          </Badge>
                        )}
                        {finding.actionRequired && !finding.actionTaken && (
                          <Badge variant="warning" className="text-xs">
                            Action Needed
                          </Badge>
                        )}
                        {finding.actionTaken && (
                          <Badge variant="success" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Addressed
                          </Badge>
                        )}
                      </div>
                    }
                  >
                    <ListItemTitle>
                      <span className="flex items-center gap-2">
                        <Badge variant="outline">
                          {findingTypeLabels[finding.findingType] || finding.findingType}
                        </Badge>
                        <PhiProtected fakeData={getFakeName()}>
                          {finding.progressNote.patient.firstName} {finding.progressNote.patient.lastName}
                        </PhiProtected>
                      </span>
                    </ListItemTitle>
                    <ListItemDescription>
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="truncate max-w-md">{finding.description}</span>
                        {formatTeeth(finding.toothNumbers) && (
                          <span>Teeth: {formatTeeth(finding.toothNumbers)}</span>
                        )}
                        {finding.location && <span>{finding.location}</span>}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(finding.createdAt).toLocaleDateString()}
                        </span>
                        {finding.followUpRequired && (
                          <Badge variant="info" className="text-xs">Follow-up</Badge>
                        )}
                      </span>
                    </ListItemDescription>
                  </ListItem>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </PageContent>
    </>
  );
}

function FindingsListPageLoading() {
  return (
    <>
      <PageHeader
        title="Clinical Findings"
        description="Track clinical observations and issues"
        compact
      />
      <PageContent>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-[160px]" />
              <Skeleton className="h-10 w-[130px]" />
              <Skeleton className="h-10 w-[150px]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-72" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </PageContent>
    </>
  );
}

export default function FindingsListPage() {
  return (
    <Suspense fallback={<FindingsListPageLoading />}>
      <FindingsListPageContent />
    </Suspense>
  );
}
