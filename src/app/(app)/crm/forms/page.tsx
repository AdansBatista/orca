'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  FileText,
  ClipboardCheck,
  Shield,
  FileCheck,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

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

interface FormTemplate {
  id: string;
  name: string;
  description: string | null;
  type: string;
  category: string;
  isActive: boolean;
  isRequired: boolean;
  sortOrder: number;
  clinicId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse {
  items: FormTemplate[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'INTAKE', label: 'Intake' },
  { value: 'CONSENT', label: 'Consent' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'CLINICAL', label: 'Clinical' },
];

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'PATIENT_INFO', label: 'Patient Info' },
  { value: 'MEDICAL_HISTORY', label: 'Medical History' },
  { value: 'DENTAL_HISTORY', label: 'Dental History' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'CONSENT_TREATMENT', label: 'Treatment Consent' },
  { value: 'CONSENT_PRIVACY', label: 'Privacy Consent' },
  { value: 'CONSENT_PHOTO', label: 'Photo Consent' },
  { value: 'CONSENT_FINANCIAL', label: 'Financial Consent' },
  { value: 'CUSTOM', label: 'Custom' },
];

const typeLabels: Record<string, string> = {
  PATIENT_INFO: 'Patient Info',
  MEDICAL_HISTORY: 'Medical History',
  DENTAL_HISTORY: 'Dental History',
  INSURANCE: 'Insurance',
  CONSENT_TREATMENT: 'Treatment Consent',
  CONSENT_PRIVACY: 'Privacy Consent',
  CONSENT_PHOTO: 'Photo Consent',
  CONSENT_FINANCIAL: 'Financial Consent',
  CUSTOM: 'Custom',
};

const categoryIcons: Record<string, typeof FileText> = {
  INTAKE: ClipboardCheck,
  CONSENT: Shield,
  INSURANCE: FileCheck,
  CLINICAL: FileText,
};

const categoryBadgeVariant: Record<string, 'default' | 'secondary' | 'success' | 'info'> = {
  INTAKE: 'default',
  CONSENT: 'info',
  INSURANCE: 'secondary',
  CLINICAL: 'success',
};

export default function FormsPage() {
  const router = useRouter();

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  // Fetch templates
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (type) params.set('type', type);
      params.set('page', String(page));
      params.set('pageSize', '20');

      try {
        const response = await fetch(`/api/forms/templates?${params.toString()}`);
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

    fetchData();
  }, [search, category, type, page]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Intake Forms"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'CRM', href: '/crm' },
          { label: 'Forms' },
        ]}
        actions={
          <Link href="/crm/forms/builder">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </Link>
        }
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          {/* Filters */}
          <Card variant="ghost">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Category Filter */}
                <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value || 'all'}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Type Filter */}
                <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value || 'all'}>
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
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <p>{error}</p>
              </CardContent>
            </Card>
          ) : data?.items.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No form templates found</h3>
                <p className="text-muted-foreground mb-4">
                  {search || category || type
                    ? 'Try adjusting your filters'
                    : 'Get started by creating your first form template'}
                </p>
                <Link href="/crm/forms/builder">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                </Link>
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
                      <TableHead>Template</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.items.map((template) => {
                      const CategoryIcon = categoryIcons[template.category] || FileText;
                      return (
                        <TableRow
                          key={template.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => router.push(`/crm/forms/${template.id}`)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-muted">
                                <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">{template.name}</p>
                                {template.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {template.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {typeLabels[template.type] || template.type}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={categoryBadgeVariant[template.category] || 'secondary'}>
                              {template.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {template.isRequired ? (
                              <Badge variant="warning">Required</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">Optional</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {template.isActive ? (
                                <>
                                  <ToggleRight className="h-4 w-4 text-success-500" />
                                  <span className="text-sm text-success-600">Active</span>
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">Inactive</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={template.clinicId ? 'soft-primary' : 'outline'}>
                              {template.clinicId ? 'Custom' : 'Global'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
      </PageContent>
    </>
  );
}
