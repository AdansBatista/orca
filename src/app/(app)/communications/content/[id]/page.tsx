'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Save,
  Eye,
  AlertTriangle,
  Image as ImageIcon,
  Video,
  Tags,
  Settings2,
  Trash2,
  Share2,
  Archive,
  Clock,
  BarChart2,
  Loader2,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import {
  CONTENT_CATEGORIES,
  TREATMENT_TYPES,
  TREATMENT_PHASES,
  AGE_GROUPS,
} from '@/lib/validations/content';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

interface Article {
  id: string;
  clinicId: string | null;
  title: string;
  slug: string;
  summary: string | null;
  body: string;
  featuredImage: string | null;
  videoUrl: string | null;
  category: string;
  tags: string[];
  treatmentTypes: string[];
  treatmentPhases: string[];
  ageGroups: string[];
  languages: string[];
  status: ContentStatus;
  publishedAt: string | null;
  expiresAt: string | null;
  viewCount: number;
  shareCount: number;
  deliveryCount: number;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditable, setIsEditable] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<ContentStatus>('DRAFT');
  const [featuredImage, setFeaturedImage] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [treatmentTypes, setTreatmentTypes] = useState<string[]>([]);
  const [treatmentPhases, setTreatmentPhases] = useState<string[]>([]);
  const [ageGroups, setAgeGroups] = useState<string[]>([]);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  // Fetch article
  const fetchArticle = useCallback(async () => {
    try {
      const response = await fetch(`/api/content/articles/${id}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to load article');
      }

      const data = result.data as Article;
      setArticle(data);

      // Global content (clinicId is null) is not editable
      setIsEditable(data.clinicId !== null);

      // Populate form
      setTitle(data.title);
      setSummary(data.summary || '');
      setBody(data.body);
      setCategory(data.category);
      setStatus(data.status);
      setFeaturedImage(data.featuredImage || '');
      setVideoUrl(data.videoUrl || '');
      setTags(data.tags || []);
      setTreatmentTypes(data.treatmentTypes || []);
      setTreatmentPhases(data.treatmentPhases || []);
      setAgeGroups(data.ageGroups || []);
      setMetaTitle(data.metaTitle || '');
      setMetaDescription(data.metaDescription || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load article');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  // Handle tag input
  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // Toggle multi-select
  const toggleArrayValue = (
    value: string,
    arr: string[],
    setArr: (val: string[]) => void
  ) => {
    if (arr.includes(value)) {
      setArr(arr.filter((v) => v !== value));
    } else {
      setArr([...arr, value]);
    }
  };

  const handleSubmit = async (saveStatus?: ContentStatus) => {
    setError(null);
    setSaving(true);

    try {
      if (!title.trim()) {
        throw new Error('Title is required');
      }
      if (!body.trim()) {
        throw new Error('Content body is required');
      }
      if (!category) {
        throw new Error('Category is required');
      }

      const payload = {
        title: title.trim(),
        summary: summary.trim() || undefined,
        body,
        category,
        status: saveStatus || status,
        featuredImage: featuredImage.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        treatmentTypes: treatmentTypes.length > 0 ? treatmentTypes : undefined,
        treatmentPhases: treatmentPhases.length > 0 ? treatmentPhases : undefined,
        ageGroups: ageGroups.length > 0 ? ageGroups : undefined,
        metaTitle: metaTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
      };

      const response = await fetch(`/api/content/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update article');
      }

      toast.success('Article updated successfully!');
      fetchArticle(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/content/articles/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete article');
      }

      toast.success('Article deleted');
      router.push('/communications/content');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  // Loading state
  if (loading) {
    return (
      <>
        <PageHeader title="Loading..." compact />
        <PageContent density="comfortable">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </PageContent>
      </>
    );
  }

  // Error state
  if (error && !article) {
    return (
      <>
        <PageHeader title="Error" compact />
        <PageContent density="comfortable">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Link href="/communications/content" className="mt-4 inline-block">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Content Library
            </Button>
          </Link>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={article?.title || 'Edit Article'}
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Communications', href: '/communications' },
          { label: 'Content Library', href: '/communications/content' },
          { label: 'Edit' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/communications/content">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            {isEditable && (
              <>
                {status !== 'ARCHIVED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSubmit('ARCHIVED')}
                    disabled={saving}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSubmit()}
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                {status !== 'PUBLISHED' && (
                  <Button
                    size="sm"
                    onClick={() => handleSubmit('PUBLISHED')}
                    disabled={saving}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Publish
                  </Button>
                )}
              </>
            )}
          </div>
        }
      />

      <PageContent density="comfortable">
        <div className="max-w-5xl space-y-6">
          {!isEditable && (
            <Alert>
              <AlertDescription>
                This is global content and cannot be edited. You can only view
                and share it with patients.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stats Bar */}
          {article && (
            <Card variant="ghost">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        article.status === 'PUBLISHED'
                          ? 'success'
                          : article.status === 'ARCHIVED'
                          ? 'warning'
                          : 'ghost'
                      }
                      dot
                    >
                      {article.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span>{article.viewCount} views</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Share2 className="h-4 w-4" />
                    <span>{article.shareCount} shares</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BarChart2 className="h-4 w-4" />
                    <span>{article.deliveryCount} deliveries</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
                    <Clock className="h-4 w-4" />
                    <span>Updated {format(new Date(article.updatedAt), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="content" className="space-y-6">
            <TabsList>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="targeting">Targeting</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Article Content
                  </CardTitle>
                  <CardDescription>
                    Write educational content for your patients
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField label="Title" required>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., How to Care for Your Braces"
                      disabled={!isEditable}
                    />
                  </FormField>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Category" required>
                      <Select
                        value={category}
                        onValueChange={setCategory}
                        disabled={!isEditable}
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

                    <FormField label="Status">
                      <Select
                        value={status}
                        onValueChange={(v) => setStatus(v as ContentStatus)}
                        disabled={!isEditable}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="PUBLISHED">Published</SelectItem>
                          <SelectItem value="ARCHIVED">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>

                  <FormField label="Summary">
                    <Textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Brief description of the article (shown in previews)"
                      rows={2}
                      maxLength={500}
                      disabled={!isEditable}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {summary.length}/500 characters
                    </p>
                  </FormField>

                  <FormField label="Content" required>
                    <RichTextEditor
                      value={body}
                      onChange={setBody}
                      placeholder="Write your article content here..."
                      minHeight="400px"
                      disabled={!isEditable}
                    />
                  </FormField>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tags className="h-5 w-5" />
                    Tags
                  </CardTitle>
                  <CardDescription>
                    Add tags to help organize and find content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditable && (
                    <div className="flex gap-2 mb-3">
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
                        className="max-w-xs"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddTag}
                      >
                        Add
                      </Button>
                    </div>
                  )}
                  {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="soft-primary"
                          className={isEditable ? 'cursor-pointer' : ''}
                          onClick={() => isEditable && handleRemoveTag(tag)}
                        >
                          {tag} {isEditable && <span>&times;</span>}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No tags added</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Featured Image
                  </CardTitle>
                  <CardDescription>
                    Add a cover image for your article
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField label="Image URL">
                    <Input
                      value={featuredImage}
                      onChange={(e) => setFeaturedImage(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      disabled={!isEditable}
                    />
                  </FormField>
                  {featuredImage && (
                    <div className="mt-4 rounded-lg overflow-hidden border border-border max-w-md">
                      <img
                        src={featuredImage}
                        alt="Featured preview"
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Video
                  </CardTitle>
                  <CardDescription>
                    Add an embedded video (YouTube, Vimeo, etc.)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField label="Video URL">
                    <Input
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      disabled={!isEditable}
                    />
                  </FormField>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Targeting Tab */}
            <TabsContent value="targeting" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5" />
                    Content Targeting
                  </CardTitle>
                  <CardDescription>
                    Specify which patients this content is relevant for
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField label="Treatment Types">
                    <div className="flex flex-wrap gap-2">
                      {TREATMENT_TYPES.map((type) => (
                        <Badge
                          key={type}
                          variant={
                            treatmentTypes.includes(type)
                              ? 'default'
                              : 'outline'
                          }
                          className={isEditable ? 'cursor-pointer' : ''}
                          onClick={() =>
                            isEditable &&
                            toggleArrayValue(type, treatmentTypes, setTreatmentTypes)
                          }
                        >
                          {type}
                        </Badge>
                      ))}
                    </div>
                    {isEditable && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Click to select relevant treatment types
                      </p>
                    )}
                  </FormField>

                  <FormField label="Treatment Phases">
                    <div className="flex flex-wrap gap-2">
                      {TREATMENT_PHASES.map((phase) => (
                        <Badge
                          key={phase}
                          variant={
                            treatmentPhases.includes(phase)
                              ? 'default'
                              : 'outline'
                          }
                          className={isEditable ? 'cursor-pointer capitalize' : 'capitalize'}
                          onClick={() =>
                            isEditable &&
                            toggleArrayValue(phase, treatmentPhases, setTreatmentPhases)
                          }
                        >
                          {phase.replace('-', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </FormField>

                  <FormField label="Age Groups">
                    <div className="flex flex-wrap gap-2">
                      {AGE_GROUPS.map((age) => (
                        <Badge
                          key={age}
                          variant={
                            ageGroups.includes(age) ? 'default' : 'outline'
                          }
                          className={isEditable ? 'cursor-pointer capitalize' : 'capitalize'}
                          onClick={() =>
                            isEditable &&
                            toggleArrayValue(age, ageGroups, setAgeGroups)
                          }
                        >
                          {age}
                        </Badge>
                      ))}
                    </div>
                  </FormField>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>SEO Settings</CardTitle>
                  <CardDescription>
                    Optimize how this article appears in search results and
                    social sharing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField label="Meta Title">
                    <Input
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder="Custom title for search engines (default: article title)"
                      maxLength={70}
                      disabled={!isEditable}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {metaTitle.length}/70 characters
                    </p>
                  </FormField>

                  <FormField label="Meta Description">
                    <Textarea
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="Brief description for search engines (default: summary)"
                      rows={3}
                      maxLength={160}
                      disabled={!isEditable}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {metaDescription.length}/160 characters
                    </p>
                  </FormField>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            {isEditable && (
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Article
              </Button>
            )}
            <div className="flex items-center gap-3 ml-auto">
              <Link href="/communications/content">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              {isEditable && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleSubmit()}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  {status !== 'PUBLISHED' && (
                    <Button
                      onClick={() => handleSubmit('PUBLISHED')}
                      disabled={saving}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {saving ? 'Publishing...' : 'Publish'}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </PageContent>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Article"
        description="Are you sure you want to delete this article? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
