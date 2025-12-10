'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Plus,
  Search,
  RefreshCw,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowLeft,
  Play,
  Pause,
  BarChart2,
  Users,
  Filter,
  Copy,
  ExternalLink,
} from 'lucide-react';

import { PageHeader, PageContent, StatsRow } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, StatCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { SURVEY_CATEGORIES } from '@/lib/validations/surveys';

interface Survey {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  isAnonymous: boolean;
  responseCount: number;
  completionRate: number;
  createdAt: string;
  updatedAt: string;
}

interface SurveysData {
  items: Survey[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type StatusFilter = 'all' | 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CLOSED';

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<SurveysData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deletingSurvey, setDeletingSurvey] = useState<Survey | null>(null);

  // Fetch surveys
  const fetchSurveys = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);
      params.set('pageSize', '50');

      const response = await fetch(`/api/surveys?${params}`);
      const result = await response.json();

      if (result.success) {
        setSurveys(result.data);
      } else {
        toast.error('Failed to load surveys');
      }
    } catch {
      toast.error('Failed to load surveys');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter, searchQuery]);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  // Handle delete
  const handleDelete = async () => {
    if (!deletingSurvey) return;

    try {
      const response = await fetch(`/api/surveys/${deletingSurvey.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Survey deleted');
        fetchSurveys();
      } else {
        toast.error(result.error?.message || 'Failed to delete survey');
      }
    } catch {
      toast.error('Failed to delete survey');
    } finally {
      setDeletingSurvey(null);
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (survey: Survey) => {
    const newStatus = survey.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const response = await fetch(`/api/surveys/${survey.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          newStatus === 'ACTIVE' ? 'Survey activated' : 'Survey paused'
        );
        fetchSurveys();
      } else {
        toast.error(result.error?.message || 'Failed to update survey');
      }
    } catch {
      toast.error('Failed to update survey');
    }
  };

  // Copy survey link
  const handleCopyLink = (surveyId: string) => {
    const link = `${window.location.origin}/portal/surveys/${surveyId}`;
    navigator.clipboard.writeText(link);
    toast.success('Survey link copied to clipboard');
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge variant="success" dot>
            Active
          </Badge>
        );
      case 'DRAFT':
        return <Badge variant="ghost">Draft</Badge>;
      case 'PAUSED':
        return <Badge variant="warning">Paused</Badge>;
      case 'CLOSED':
        return <Badge variant="info">Closed</Badge>;
      default:
        return <Badge variant="ghost">{status}</Badge>;
    }
  };

  // Get category label
  const getCategoryLabel = (slug: string) => {
    const category = SURVEY_CATEGORIES.find((c) => c.slug === slug);
    return category?.name || slug;
  };

  // Calculate stats
  const stats = {
    total: surveys?.total || 0,
    active: surveys?.items.filter((s) => s.status === 'ACTIVE').length || 0,
    totalResponses: surveys?.items.reduce((sum, s) => sum + s.responseCount, 0) || 0,
    avgCompletion: surveys && surveys.items.length > 0
      ? Math.round(
          surveys.items.reduce((sum, s) => sum + s.completionRate, 0) /
            surveys.items.length
        )
      : 0,
  };

  return (
    <>
      <PageHeader
        title="Patient Surveys"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Communications', href: '/communications' },
          { label: 'Surveys' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/communications">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Inbox
              </Button>
            </Link>
            <Link href="/communications/surveys/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Survey
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
                  <p className="text-xs text-muted-foreground">Total Surveys</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
                <ClipboardList className="h-8 w-8 text-primary-500/60" />
              </div>
            </StatCard>
            <StatCard accentColor="success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Active</p>
                  <p className="text-xl font-bold">{stats.active}</p>
                </div>
                <Play className="h-8 w-8 text-success-500/60" />
              </div>
            </StatCard>
            <StatCard accentColor="accent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Responses</p>
                  <p className="text-xl font-bold">{stats.totalResponses}</p>
                </div>
                <Users className="h-8 w-8 text-accent-500/60" />
              </div>
            </StatCard>
            <StatCard accentColor="warning">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Avg Completion</p>
                  <p className="text-xl font-bold">{stats.avgCompletion}%</p>
                </div>
                <BarChart2 className="h-8 w-8 text-warning-500/60" />
              </div>
            </StatCard>
          </StatsRow>

          {/* Filters */}
          <Card variant="ghost">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search surveys..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Category Filter */}
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {SURVEY_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.slug} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as StatusFilter)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>

                {/* Refresh */}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={fetchSurveys}
                  disabled={loading}
                  className="ml-auto"
                >
                  <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Surveys Table */}
          {loading && !surveys ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : surveys?.items.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                <p>No surveys found</p>
                <Link href="/communications/surveys/new">
                  <Button variant="outline" size="sm" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Survey
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Survey</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Responses</TableHead>
                    <TableHead className="text-right">Completion</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surveys?.items.map((survey) => (
                    <TableRow key={survey.id}>
                      <TableCell>
                        <Link
                          href={`/communications/surveys/${survey.id}`}
                          className="hover:underline"
                        >
                          <div className="font-medium">{survey.title}</div>
                          {survey.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {survey.description}
                            </div>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" size="sm">
                          {getCategoryLabel(survey.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(survey.status)}</TableCell>
                      <TableCell className="text-right">
                        {survey.responseCount}
                      </TableCell>
                      <TableCell className="text-right">
                        {Math.round(survey.completionRate)}%
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(survey.updatedAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <Link href={`/communications/surveys/${survey.id}`}>
                              <DropdownMenuItem>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            </Link>
                            {survey.status !== 'DRAFT' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleCopyLink(survey.id)}
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy Link
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    window.open(
                                      `/portal/surveys/${survey.id}`,
                                      '_blank'
                                    )
                                  }
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Preview
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            {(survey.status === 'ACTIVE' ||
                              survey.status === 'PAUSED') && (
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(survey)}
                              >
                                {survey.status === 'ACTIVE' ? (
                                  <>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Pause
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeletingSurvey(survey)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </PageContent>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingSurvey}
        onOpenChange={(open: boolean) => !open && setDeletingSurvey(null)}
        title="Delete Survey"
        description={`Are you sure you want to delete "${deletingSurvey?.title}"? This will also delete all responses. This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
