'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  MessageSquare,
  Mail,
  Bell,
  ArrowLeft,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { CreateTemplateDialog } from '@/components/communications/CreateTemplateDialog';
import { EditTemplateDialog } from '@/components/communications/EditTemplateDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  smsBody: string | null;
  emailSubject: string | null;
  emailBody: string | null;
  pushTitle: string | null;
  pushBody: string | null;
  isActive: boolean;
  isSystem: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface TemplatesData {
  items: Template[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type CategoryFilter = 'all' | 'appointment' | 'billing' | 'treatment' | 'marketing' | 'general';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') {
        params.set('category', categoryFilter);
      }
      if (!showInactive) {
        params.set('isActive', 'true');
      }
      if (searchQuery) {
        params.set('search', searchQuery);
      }
      params.set('pageSize', '50');

      const response = await fetch(`/api/communications/templates?${params}`);
      const result = await response.json();

      if (result.success) {
        setTemplates(result.data);
      } else {
        toast.error('Failed to load templates');
      }
    } catch {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, showInactive, searchQuery]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Handle delete
  const handleDelete = async () => {
    if (!deletingTemplate) return;

    try {
      const response = await fetch(`/api/communications/templates/${deletingTemplate.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Template deleted');
        fetchTemplates();
      } else {
        toast.error(result.error?.message || 'Failed to delete template');
      }
    } catch {
      toast.error('Failed to delete template');
    } finally {
      setDeletingTemplate(null);
    }
  };

  // Handle duplicate
  const handleDuplicate = async (template: Template) => {
    try {
      const response = await fetch('/api/communications/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          description: template.description,
          category: template.category,
          smsBody: template.smsBody,
          emailSubject: template.emailSubject,
          emailBody: template.emailBody,
          pushTitle: template.pushTitle,
          pushBody: template.pushBody,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Template duplicated');
        fetchTemplates();
      } else {
        toast.error(result.error?.message || 'Failed to duplicate template');
      }
    } catch {
      toast.error('Failed to duplicate template');
    }
  };

  // Get channel badges for a template
  const getChannelBadges = (template: Template) => {
    const channels = [];
    if (template.smsBody) {
      channels.push(
        <Badge key="sms" variant="outline" size="sm" className="gap-1">
          <MessageSquare className="h-3 w-3" />
          SMS
        </Badge>
      );
    }
    if (template.emailBody) {
      channels.push(
        <Badge key="email" variant="outline" size="sm" className="gap-1">
          <Mail className="h-3 w-3" />
          Email
        </Badge>
      );
    }
    if (template.pushBody) {
      channels.push(
        <Badge key="push" variant="outline" size="sm" className="gap-1">
          <Bell className="h-3 w-3" />
          Push
        </Badge>
      );
    }
    return channels;
  };

  // Get category badge variant
  const getCategoryVariant = (category: string): 'soft-primary' | 'warning' | 'success' | 'info' | 'ghost' => {
    switch (category) {
      case 'appointment':
        return 'soft-primary';
      case 'billing':
        return 'warning';
      case 'treatment':
        return 'success';
      case 'marketing':
        return 'info';
      default:
        return 'ghost';
    }
  };

  return (
    <>
      <PageHeader
        title="Message Templates"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Communications', href: '/communications' },
          { label: 'Templates' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/communications">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Inbox
              </Button>
            </Link>
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        }
      />

      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Filters */}
          <Card variant="ghost">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Category Filter */}
                <Select
                  value={categoryFilter}
                  onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="appointment">Appointment</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="treatment">Treatment</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>

                {/* Active Toggle */}
                <Button
                  variant={showInactive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowInactive(!showInactive)}
                >
                  {showInactive ? 'Show All' : 'Active Only'}
                </Button>

                {/* Refresh */}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={fetchTemplates}
                  disabled={loading}
                  className="ml-auto"
                >
                  <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Templates Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Templates
                {templates && (
                  <Badge variant="ghost">{templates.total}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading && !templates ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : templates?.items.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                  <p>No templates found</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Template
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Channels</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates?.items.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{template.name}</p>
                            {template.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                                {template.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getCategoryVariant(template.category)}>
                            {template.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getChannelBadges(template)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={template.isActive ? 'success' : 'ghost'}
                            dot={template.isActive}
                          >
                            {template.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {template.isSystem && (
                            <Badge variant="outline" size="sm" className="ml-1">
                              System
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(template.updatedAt), 'MMM d, yyyy')}
                          <span className="text-xs ml-1">v{template.version}</span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingTemplate(template)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              {!template.isSystem && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => setDeletingTemplate(template)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContent>

      {/* Create Template Dialog */}
      <CreateTemplateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onComplete={() => {
          fetchTemplates();
          setShowCreateDialog(false);
        }}
      />

      {/* Edit Template Dialog */}
      <EditTemplateDialog
        open={!!editingTemplate}
        onOpenChange={(open) => !open && setEditingTemplate(null)}
        template={editingTemplate}
        onComplete={() => {
          fetchTemplates();
          setEditingTemplate(null);
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingTemplate}
        onOpenChange={(open: boolean) => !open && setDeletingTemplate(null)}
        title="Delete Template"
        description={`Are you sure you want to delete "${deletingTemplate?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
