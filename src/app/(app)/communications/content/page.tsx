'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowLeft,
  FileText,
  Eye,
  Share2,
  Filter,
} from 'lucide-react';

import { PageHeader, PageContent, StatsRow, CardGrid } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, StatCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { CONTENT_CATEGORIES } from '@/lib/validations/content';

interface Article {
  id: string;
  clinicId: string | null;
  title: string;
  slug: string;
  summary: string | null;
  featuredImage: string | null;
  category: string;
  tags: string[];
  treatmentTypes: string[];
  treatmentPhases: string[];
  status: string;
  publishedAt: string | null;
  viewCount: number;
  shareCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ArticlesData {
  items: Article[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type StatusFilter = 'all' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export default function ContentLibraryPage() {
  const [articles, setArticles] = useState<ArticlesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null);

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);
      params.set('pageSize', '50');

      const response = await fetch(`/api/content/articles?${params}`);
      const result = await response.json();

      if (result.success) {
        setArticles(result.data);
      } else {
        toast.error('Failed to load content');
      }
    } catch {
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter, searchQuery]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Handle delete
  const handleDelete = async () => {
    if (!deletingArticle) return;

    try {
      const response = await fetch(`/api/content/articles/${deletingArticle.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Article deleted');
        fetchArticles();
      } else {
        toast.error(result.error?.message || 'Failed to delete article');
      }
    } catch {
      toast.error('Failed to delete article');
    } finally {
      setDeletingArticle(null);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="success" dot>Published</Badge>;
      case 'DRAFT':
        return <Badge variant="ghost">Draft</Badge>;
      case 'ARCHIVED':
        return <Badge variant="warning">Archived</Badge>;
      default:
        return <Badge variant="ghost">{status}</Badge>;
    }
  };

  // Get category label
  const getCategoryLabel = (slug: string) => {
    const category = CONTENT_CATEGORIES.find((c) => c.slug === slug);
    return category?.name || slug;
  };

  // Calculate stats
  const stats = {
    total: articles?.total || 0,
    published: articles?.items.filter((a) => a.status === 'PUBLISHED').length || 0,
    drafts: articles?.items.filter((a) => a.status === 'DRAFT').length || 0,
    totalViews: articles?.items.reduce((sum, a) => sum + a.viewCount, 0) || 0,
  };

  return (
    <>
      <PageHeader
        title="Educational Content Library"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Communications', href: '/communications' },
          { label: 'Content Library' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/communications">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Inbox
              </Button>
            </Link>
            <Link href="/communications/content/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Article
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
                  <p className="text-xs text-muted-foreground">Total Articles</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
                <BookOpen className="h-8 w-8 text-primary-500/60" />
              </div>
            </StatCard>
            <StatCard accentColor="success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Published</p>
                  <p className="text-xl font-bold">{stats.published}</p>
                </div>
                <FileText className="h-8 w-8 text-success-500/60" />
              </div>
            </StatCard>
            <StatCard accentColor="warning">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Drafts</p>
                  <p className="text-xl font-bold">{stats.drafts}</p>
                </div>
                <Pencil className="h-8 w-8 text-warning-500/60" />
              </div>
            </StatCard>
            <StatCard accentColor="accent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Views</p>
                  <p className="text-xl font-bold">{stats.totalViews.toLocaleString()}</p>
                </div>
                <Eye className="h-8 w-8 text-accent-500/60" />
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
                    placeholder="Search articles..."
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
                    {CONTENT_CATEGORIES.map((cat) => (
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
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>

                {/* Refresh */}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={fetchArticles}
                  disabled={loading}
                  className="ml-auto"
                >
                  <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Articles Grid */}
          {loading && !articles ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : articles?.items.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                <p>No articles found</p>
                <Link href="/communications/content/new">
                  <Button variant="outline" size="sm" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Article
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <CardGrid columns={3}>
              {articles?.items.map((article) => (
                <Card key={article.id} variant="bento" interactive>
                  {article.featuredImage && (
                    <div className="h-32 bg-muted rounded-t-xl overflow-hidden">
                      <img
                        src={article.featuredImage}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader compact className={article.featuredImage ? 'pt-3' : ''}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle size="sm" className="line-clamp-2">
                          {article.title}
                        </CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">
                          {article.summary || 'No summary provided'}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/communications/content/${article.id}`}>
                            <DropdownMenuItem>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share with Patient
                          </DropdownMenuItem>
                          {article.clinicId && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeletingArticle(article)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent compact className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(article.status)}
                        <Badge variant="outline" size="sm">
                          {getCategoryLabel(article.category)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {article.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="h-3 w-3" />
                          {article.shareCount}
                        </span>
                      </div>
                    </div>
                    {!article.clinicId && (
                      <Badge variant="soft-primary" size="sm" className="mt-2">
                        Global Content
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Updated {format(new Date(article.updatedAt), 'MMM d, yyyy')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </CardGrid>
          )}
        </div>
      </PageContent>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingArticle}
        onOpenChange={(open: boolean) => !open && setDeletingArticle(null)}
        title="Delete Article"
        description={`Are you sure you want to delete "${deletingArticle?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
