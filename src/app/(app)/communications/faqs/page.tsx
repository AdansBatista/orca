'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Plus,
  Search,
  RefreshCw,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowLeft,
  Star,
  ThumbsUp,
  ThumbsDown,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  Save,
} from 'lucide-react';

import { PageHeader, PageContent, StatsRow, CardGrid } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, StatCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CONTENT_CATEGORIES } from '@/lib/validations/content';

interface FAQItem {
  id: string;
  clinicId: string | null;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  sortOrder: number;
  isFeatured: boolean;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FAQsData {
  items: FAQItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface FAQFormData {
  question: string;
  answer: string;
  category: string;
  tags: string[];
  sortOrder: number;
  isFeatured: boolean;
}

const initialFormData: FAQFormData = {
  question: '',
  answer: '',
  category: '',
  tags: [],
  sortOrder: 0,
  isFeatured: false,
};

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured'>('all');
  const [deletingFaq, setDeletingFaq] = useState<FAQItem | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [formData, setFormData] = useState<FAQFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Fetch FAQs
  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (featuredFilter === 'featured') params.set('isFeatured', 'true');
      if (searchQuery) params.set('search', searchQuery);
      params.set('pageSize', '100');

      const response = await fetch(`/api/content/faqs?${params}`);
      const result = await response.json();

      if (result.success) {
        setFaqs(result.data);
      } else {
        toast.error('Failed to load FAQs');
      }
    } catch {
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, featuredFilter, searchQuery]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  // Open create dialog
  const handleCreate = () => {
    setEditingFaq(null);
    setFormData(initialFormData);
    setTagInput('');
    setDialogOpen(true);
  };

  // Open edit dialog
  const handleEdit = (faq: FAQItem) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      tags: faq.tags,
      sortOrder: faq.sortOrder,
      isFeatured: faq.isFeatured,
    });
    setTagInput('');
    setDialogOpen(true);
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.question.trim() || !formData.answer.trim() || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const url = editingFaq
        ? `/api/content/faqs/${editingFaq.id}`
        : '/api/content/faqs';
      const method = editingFaq ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save FAQ');
      }

      toast.success(editingFaq ? 'FAQ updated!' : 'FAQ created!');
      setDialogOpen(false);
      fetchFaqs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save FAQ');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingFaq) return;

    try {
      const response = await fetch(`/api/content/faqs/${deletingFaq.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('FAQ deleted');
        fetchFaqs();
      } else {
        toast.error(result.error?.message || 'Failed to delete FAQ');
      }
    } catch {
      toast.error('Failed to delete FAQ');
    } finally {
      setDeletingFaq(null);
    }
  };

  // Handle tag input
  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !formData.tags.includes(trimmed)) {
      setFormData({ ...formData, tags: [...formData.tags, trimmed] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  // Get category label
  const getCategoryLabel = (slug: string) => {
    const category = CONTENT_CATEGORIES.find((c) => c.slug === slug);
    return category?.name || slug;
  };

  // Calculate stats
  const stats = {
    total: faqs?.total || 0,
    featured: faqs?.items.filter((f) => f.isFeatured).length || 0,
    totalViews: faqs?.items.reduce((sum, f) => sum + f.viewCount, 0) || 0,
    helpfulRate:
      faqs && faqs.items.length > 0
        ? Math.round(
            (faqs.items.reduce((sum, f) => sum + f.helpfulCount, 0) /
              Math.max(
                faqs.items.reduce(
                  (sum, f) => sum + f.helpfulCount + f.notHelpfulCount,
                  0
                ),
                1
              )) *
              100
          )
        : 0,
  };

  return (
    <>
      <PageHeader
        title="FAQs Management"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Communications', href: '/communications' },
          { label: 'FAQs' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/communications">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Inbox
              </Button>
            </Link>
            <Button size="sm" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New FAQ
            </Button>
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
                  <p className="text-xs text-muted-foreground">Total FAQs</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
                <HelpCircle className="h-8 w-8 text-primary-500/60" />
              </div>
            </StatCard>
            <StatCard accentColor="warning">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Featured</p>
                  <p className="text-xl font-bold">{stats.featured}</p>
                </div>
                <Star className="h-8 w-8 text-warning-500/60" />
              </div>
            </StatCard>
            <StatCard accentColor="accent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Views</p>
                  <p className="text-xl font-bold">{stats.totalViews.toLocaleString()}</p>
                </div>
                <HelpCircle className="h-8 w-8 text-accent-500/60" />
              </div>
            </StatCard>
            <StatCard accentColor="success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Helpful Rate</p>
                  <p className="text-xl font-bold">{stats.helpfulRate}%</p>
                </div>
                <ThumbsUp className="h-8 w-8 text-success-500/60" />
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
                    placeholder="Search FAQs..."
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

                {/* Featured Filter */}
                <Select
                  value={featuredFilter}
                  onValueChange={(v) => setFeaturedFilter(v as 'all' | 'featured')}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All FAQs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All FAQs</SelectItem>
                    <SelectItem value="featured">Featured Only</SelectItem>
                  </SelectContent>
                </Select>

                {/* Refresh */}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={fetchFaqs}
                  disabled={loading}
                  className="ml-auto"
                >
                  <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* FAQ List */}
          {loading && !faqs ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : faqs?.items.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <HelpCircle className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                <p>No FAQs found</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First FAQ
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {faqs?.items.map((faq) => (
                <Card key={faq.id} variant="bento" className="overflow-hidden">
                  <button
                    className="w-full text-left"
                    onClick={() =>
                      setExpandedFaq(expandedFaq === faq.id ? null : faq.id)
                    }
                  >
                    <CardHeader compact className="flex flex-row items-center gap-3">
                      <div
                        className={cn(
                          'transition-transform',
                          expandedFaq === faq.id && 'rotate-180'
                        )}
                      >
                        {expandedFaq === faq.id ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {faq.isFeatured && (
                            <Star className="h-4 w-4 text-warning-500 fill-warning-500" />
                          )}
                          <CardTitle size="sm" className="line-clamp-1">
                            {faq.question}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" size="sm">
                            {getCategoryLabel(faq.category)}
                          </Badge>
                          {!faq.clinicId && (
                            <Badge variant="soft-primary" size="sm">
                              Global
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {faq.helpfulCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsDown className="h-3 w-3" />
                          {faq.notHelpfulCount}
                        </span>
                      </div>
                      {faq.clinicId && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(faq);
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingFaq(faq);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </CardHeader>
                  </button>
                  {expandedFaq === faq.id && (
                    <CardContent compact className="pt-0 border-t border-border/50">
                      <div className="prose prose-sm dark:prose-invert max-w-none pt-4">
                        <p className="whitespace-pre-wrap">{faq.answer}</p>
                      </div>
                      {faq.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-4">
                          {faq.tags.map((tag) => (
                            <Badge key={tag} variant="ghost" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </PageContent>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingFaq ? 'Edit FAQ' : 'Create New FAQ'}
            </DialogTitle>
            <DialogDescription>
              {editingFaq
                ? 'Update the FAQ question and answer'
                : 'Add a new frequently asked question'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <FormField label="Question" required>
              <Input
                value={formData.question}
                onChange={(e) =>
                  setFormData({ ...formData, question: e.target.value })
                }
                placeholder="What is the question patients frequently ask?"
              />
            </FormField>

            <FormField label="Answer" required>
              <Textarea
                value={formData.answer}
                onChange={(e) =>
                  setFormData({ ...formData, answer: e.target.value })
                }
                placeholder="Provide a clear and helpful answer..."
                rows={5}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Category" required>
                <Select
                  value={formData.category}
                  onValueChange={(v) =>
                    setFormData({ ...formData, category: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.slug} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Sort Order">
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sortOrder: parseInt(e.target.value) || 0,
                    })
                  }
                  min={0}
                />
              </FormField>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.isFeatured}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isFeatured: checked })
                }
              />
              <Label>Featured FAQ (shown prominently in patient portal)</Label>
            </div>

            <FormField label="Tags">
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="soft-primary"
                      className="cursor-pointer"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </FormField>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : editingFaq ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingFaq}
        onOpenChange={(open: boolean) => !open && setDeletingFaq(null)}
        title="Delete FAQ"
        description={`Are you sure you want to delete this FAQ? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
