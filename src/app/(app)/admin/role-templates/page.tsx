'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Shield,
  Plus,
  Search,
  RefreshCw,
  Copy,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Sparkles,
} from 'lucide-react';
import type { RoleTemplate } from '@prisma/client';

import { PageHeader, PageContent, StatsRow } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { FormField } from '@/components/ui/form-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

interface TemplateFormData {
  name: string;
  code: string;
  description: string;
  category: string;
  permissions: string[];
  isActive: boolean;
}

const defaultFormData: TemplateFormData = {
  name: '',
  code: '',
  description: '',
  category: '',
  permissions: [],
  isActive: true,
};

export default function RoleTemplatesPage() {
  const [templates, setTemplates] = useState<RoleTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [industryStandardFilter, setIndustryStandardFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isUseOpen, setIsUseOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<RoleTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (searchQuery) params.set('search', searchQuery);
      if (categoryFilter) params.set('category', categoryFilter);
      if (industryStandardFilter) params.set('isIndustryStandard', industryStandardFilter);
      if (activeFilter) params.set('isActive', activeFilter);

      const response = await fetch(`/api/role-templates?${params}`);
      const data = await response.json();

      if (data.success) {
        setTemplates(data.data.items);
        setTotal(data.data.total);
        setCategories(data.data.categories || []);
      } else {
        toast({
          title: 'Error',
          description: data.error?.message || 'Failed to load templates',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load role templates',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, categoryFilter, industryStandardFilter, activeFilter]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const totalPages = Math.ceil(total / pageSize);

  const handleCreate = () => {
    setSelectedTemplate(null);
    setFormData(defaultFormData);
    setIsFormOpen(true);
  };

  const handleEdit = (template: RoleTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      code: template.code,
      description: template.description || '',
      category: template.category,
      permissions: template.permissions,
      isActive: template.isActive,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (template: RoleTemplate) => {
    setSelectedTemplate(template);
    setIsDeleteOpen(true);
  };

  const handleUse = (template: RoleTemplate) => {
    setSelectedTemplate(template);
    setIsUseOpen(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const url = selectedTemplate
        ? `/api/role-templates/${selectedTemplate.id}`
        : '/api/role-templates';
      const method = selectedTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: selectedTemplate
            ? 'Template updated successfully'
            : 'Template created successfully',
        });
        setIsFormOpen(false);
        fetchTemplates();
      } else {
        toast({
          title: 'Error',
          description: data.error?.message || 'Failed to save template',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedTemplate) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/role-templates/${selectedTemplate.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Template deleted successfully',
        });
        setIsDeleteOpen(false);
        fetchTemplates();
      } else {
        toast({
          title: 'Error',
          description: data.error?.message || 'Failed to delete template',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmUse = async () => {
    if (!selectedTemplate) return;

    setIsSubmitting(true);
    try {
      // Generate a unique code based on template code
      const timestamp = Date.now().toString(36);
      const newCode = `${selectedTemplate.code.replace('template_', '')}_${timestamp}`;
      const newName = selectedTemplate.name;

      const response = await fetch(`/api/role-templates/${selectedTemplate.id}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          code: newCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: `Role "${data.data.name}" created from template`,
        });
        setIsUseOpen(false);
      } else {
        toast({
          title: 'Error',
          description: data.error?.message || 'Failed to create role from template',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create role from template',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const industryStandardCount = templates.filter((t) => t.isIndustryStandard).length;
  const customCount = templates.filter((t) => !t.isIndustryStandard).length;
  const activeCount = templates.filter((t) => t.isActive).length;

  return (
    <>
      <PageHeader
        title="Role Templates"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Admin' },
          { label: 'Role Templates' },
        ]}
        actions={
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        }
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Summary Stats */}
          <StatsRow>
            <StatCard accentColor="primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Templates</p>
                  <p className="text-lg font-bold">{total}</p>
                </div>
                <Shield className="h-5 w-5 text-primary-500" />
              </div>
            </StatCard>
            <StatCard accentColor="accent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Industry Standard</p>
                  <p className="text-lg font-bold">{industryStandardCount}</p>
                </div>
                <Sparkles className="h-5 w-5 text-accent-500" />
              </div>
            </StatCard>
            <StatCard accentColor="secondary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Custom Templates</p>
                  <p className="text-lg font-bold">{customCount}</p>
                </div>
                <Edit className="h-5 w-5 text-secondary-500" />
              </div>
            </StatCard>
            <StatCard accentColor="success">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Active</p>
                  <p className="text-lg font-bold">{activeCount}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-success-500" />
              </div>
            </StatCard>
          </StatsRow>

          {/* Filters */}
          <Card variant="ghost">
            <CardContent className="p-4">
              <div className="flex items-end gap-4 flex-wrap">
                <FormField label="Search">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search templates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </FormField>
                <FormField label="Category">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Type">
                  <Select value={industryStandardFilter} onValueChange={setIndustryStandardFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="true">Industry Standard</SelectItem>
                      <SelectItem value="false">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Status">
                  <Select value={activeFilter} onValueChange={setActiveFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <Button variant="outline" onClick={fetchTemplates}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Templates Table */}
          <Card>
            <CardHeader compact>
              <CardTitle size="sm" className="flex items-center justify-between">
                <span>Role Templates</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {total} templates
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent compact>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : templates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No templates found
                      </TableCell>
                    </TableRow>
                  ) : (
                    templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell className="font-mono text-xs">{template.code}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{template.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="soft-primary">
                            {template.permissions.length} permissions
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {template.isIndustryStandard ? (
                            <Badge variant="info" dot>
                              Industry
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Custom</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {template.isActive ? (
                            <Badge variant="success" dot>
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>{template.usageCount}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleUse(template)}
                              title="Use Template"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            {!template.isIndustryStandard && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(template)}
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(template)}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {selectedTemplate ? 'Edit Template' : 'Create Template'}
              </DialogTitle>
              <DialogDescription>
                {selectedTemplate
                  ? 'Update the role template details.'
                  : 'Create a new role template that can be used to quickly create roles.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <FormField label="Name" required>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Front Desk Staff"
                />
              </FormField>
              <FormField label="Code" required>
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                    })
                  }
                  placeholder="e.g., template_front_desk"
                  disabled={!!selectedTemplate}
                />
              </FormField>
              <FormField label="Category" required>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Administrative, Clinical, Management"
                />
              </FormField>
              <FormField label="Description">
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this template's purpose..."
                  rows={3}
                />
              </FormField>
              <FormField label="Permissions" description="Comma-separated permission codes">
                <Textarea
                  value={formData.permissions.join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      permissions: e.target.value
                        .split(',')
                        .map((p) => p.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="e.g., patients:read, appointments:read, appointments:write"
                  rows={3}
                />
              </FormField>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : selectedTemplate ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Template</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the template &quot;{selectedTemplate?.name}&quot;?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Use Template Confirmation */}
        <AlertDialog open={isUseOpen} onOpenChange={setIsUseOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Use Template</AlertDialogTitle>
              <AlertDialogDescription>
                Create a new role based on the &quot;{selectedTemplate?.name}&quot; template? This
                will create a new role with {selectedTemplate?.permissions.length} permissions from
                this template.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmUse}>
                {isSubmitting ? 'Creating...' : 'Create Role'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageContent>
    </>
  );
}
