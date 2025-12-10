'use client';

import { useState } from 'react';
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
import { toast } from 'sonner';
import {
  CONTENT_CATEGORIES,
  TREATMENT_TYPES,
  TREATMENT_PHASES,
  AGE_GROUPS,
} from '@/lib/validations/content';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ContentStatus = 'DRAFT' | 'PUBLISHED';

export default function NewArticlePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (saveStatus: ContentStatus) => {
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
        status: saveStatus,
        featuredImage: featuredImage.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        treatmentTypes: treatmentTypes.length > 0 ? treatmentTypes : undefined,
        treatmentPhases: treatmentPhases.length > 0 ? treatmentPhases : undefined,
        ageGroups: ageGroups.length > 0 ? ageGroups : undefined,
        metaTitle: metaTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
      };

      const response = await fetch('/api/content/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create article');
      }

      toast.success(
        saveStatus === 'PUBLISHED'
          ? 'Article published successfully!'
          : 'Article saved as draft!'
      );
      router.push(`/communications/content/${result.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="New Article"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Communications', href: '/communications' },
          { label: 'Content Library', href: '/communications/content' },
          { label: 'New' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/communications/content">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSubmit('DRAFT')}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button
              size="sm"
              onClick={() => handleSubmit('PUBLISHED')}
              disabled={saving}
            >
              <Eye className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        }
      />

      <PageContent density="comfortable">
        <div className="max-w-5xl space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
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
                    />
                  </FormField>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Category" required>
                      <Select value={category} onValueChange={setCategory}>
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
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="PUBLISHED">Published</SelectItem>
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
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="soft-primary"
                          className="cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {tag} &times;
                        </Badge>
                      ))}
                    </div>
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
                          className="cursor-pointer capitalize"
                          onClick={() =>
                            toggleArrayValue(type, treatmentTypes, setTreatmentTypes)
                          }
                        >
                          {type}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Click to select relevant treatment types
                    </p>
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
                          className="cursor-pointer capitalize"
                          onClick={() =>
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
                          className="cursor-pointer capitalize"
                          onClick={() =>
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
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {metaDescription.length}/160 characters
                    </p>
                  </FormField>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Link href="/communications/content">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => handleSubmit('DRAFT')}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button onClick={() => handleSubmit('PUBLISHED')} disabled={saving}>
              <Eye className="h-4 w-4 mr-2" />
              {saving ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
        </div>
      </PageContent>
    </>
  );
}
