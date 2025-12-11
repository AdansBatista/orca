'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  FileCog,
  Edit,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { format } from 'date-fns';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FormField } from '@/components/ui/form-field';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NoteTemplate {
  id: string;
  templateName: string;
  templateType: string;
  description: string | null;
  defaultSubjective: string | null;
  defaultObjective: string | null;
  defaultAssessment: string | null;
  defaultPlan: string | null;
  isActive: boolean;
  createdAt: string;
  provider: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface PaginatedResponse {
  items: NoteTemplate[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const templateTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'INITIAL_EXAM', label: 'Initial Exam' },
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'DEBOND', label: 'Debond' },
  { value: 'RETENTION_CHECK', label: 'Retention Check' },
  { value: 'GENERAL', label: 'General' },
];

const templateTypeLabels: Record<string, string> = {
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

export default function NoteTemplatesPage() {
  const router = useRouter();

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [templateType, setTemplateType] = useState('');
  const [page, setPage] = useState(1);

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<NoteTemplate | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<NoteTemplate | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    templateName: '',
    templateType: 'GENERAL',
    description: '',
    defaultSubjective: '',
    defaultObjective: '',
    defaultAssessment: '',
    defaultPlan: '',
    isActive: true,
  });

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (templateType) params.set('templateType', templateType);
    params.set('page', String(page));
    params.set('pageSize', '20');

    try {
      const response = await fetch(`/api/note-templates?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch templates');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [search, templateType, page]);

  const resetForm = () => {
    setFormData({
      templateName: '',
      templateType: 'GENERAL',
      description: '',
      defaultSubjective: '',
      defaultObjective: '',
      defaultAssessment: '',
      defaultPlan: '',
      isActive: true,
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const openEditDialog = (template: NoteTemplate) => {
    setFormData({
      templateName: template.templateName,
      templateType: template.templateType,
      description: template.description || '',
      defaultSubjective: template.defaultSubjective || '',
      defaultObjective: template.defaultObjective || '',
      defaultAssessment: template.defaultAssessment || '',
      defaultPlan: template.defaultPlan || '',
      isActive: template.isActive,
    });
    setEditTemplate(template);
  };

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/note-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create template');
      }

      setCreateDialogOpen(false);
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editTemplate) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/note-templates/${editTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update template');
      }

      setEditTemplate(null);
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTemplate) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/note-templates/${deleteTemplate.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete template');
      }

      setDeleteTemplate(null);
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Note Templates"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Treatment', href: '/treatment' },
          { label: 'Documentation', href: '/treatment/documentation' },
          { label: 'Templates' },
        ]}
        actions={
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        }
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Filters */}
          <Card variant="ghost">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-9"
                  />
                </div>

                <Select value={templateType} onValueChange={(v) => { setTemplateType(v === 'all' ? '' : v); setPage(1); }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Template Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {templateTypeOptions.map((opt) => (
                      <SelectItem key={opt.value || 'all'} value={opt.value || 'all'}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {loading ? (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : data?.items.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileCog className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                <p className="text-muted-foreground mb-4">
                  Create templates to speed up note documentation
                </p>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader compact>
                <CardTitle size="sm">
                  {data?.total} template{data?.total !== 1 ? 's' : ''}
                </CardTitle>
              </CardHeader>
              <CardContent compact className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.items.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{template.templateName}</p>
                            {template.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                                {template.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {templateTypeLabels[template.templateType] || template.templateType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {template.provider
                              ? `${template.provider.firstName} ${template.provider.lastName}`
                              : 'System'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={template.isActive ? 'success' : 'secondary'}>
                            {template.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(template.createdAt), 'MMM d, yyyy')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(template)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteTemplate(template)}
                                className="text-destructive"
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
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of {data.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === data.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={createDialogOpen || !!editTemplate} onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditTemplate(null);
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editTemplate ? 'Edit Template' : 'Create Template'}
              </DialogTitle>
              <DialogDescription>
                {editTemplate
                  ? 'Update the template details and default content'
                  : 'Create a new note template with default SOAP content'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Template Name" required>
                  <Input
                    value={formData.templateName}
                    onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                    placeholder="e.g., Standard Adjustment"
                  />
                </FormField>

                <FormField label="Template Type" required>
                  <Select
                    value={formData.templateType}
                    onValueChange={(v) => setFormData({ ...formData, templateType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templateTypeOptions.filter(opt => opt.value).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              <FormField label="Description">
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe when to use this template..."
                  rows={2}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Default Subjective (S)">
                  <Textarea
                    value={formData.defaultSubjective}
                    onChange={(e) => setFormData({ ...formData, defaultSubjective: e.target.value })}
                    placeholder="Patient reports..."
                    rows={4}
                  />
                </FormField>

                <FormField label="Default Objective (O)">
                  <Textarea
                    value={formData.defaultObjective}
                    onChange={(e) => setFormData({ ...formData, defaultObjective: e.target.value })}
                    placeholder="Clinical exam reveals..."
                    rows={4}
                  />
                </FormField>

                <FormField label="Default Assessment (A)">
                  <Textarea
                    value={formData.defaultAssessment}
                    onChange={(e) => setFormData({ ...formData, defaultAssessment: e.target.value })}
                    placeholder="Assessment indicates..."
                    rows={4}
                  />
                </FormField>

                <FormField label="Default Plan (P)">
                  <Textarea
                    value={formData.defaultPlan}
                    onChange={(e) => setFormData({ ...formData, defaultPlan: e.target.value })}
                    placeholder="Plan includes..."
                    rows={4}
                  />
                </FormField>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => { setCreateDialogOpen(false); setEditTemplate(null); }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={editTemplate ? handleUpdate : handleCreate}
                disabled={submitting || !formData.templateName}
              >
                {submitting ? 'Saving...' : (editTemplate ? 'Update' : 'Create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteTemplate} onOpenChange={(open) => !open && setDeleteTemplate(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Template</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deleteTemplate?.templateName}"?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteTemplate(null)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={submitting}
              >
                {submitting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContent>
    </>
  );
}
