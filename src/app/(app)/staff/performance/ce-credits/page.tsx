'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { GraduationCap, RefreshCw, CheckCircle } from 'lucide-react';

import { PageHeader, PageContent, StatsRow } from '@/components/layout';
import { Button } from '@/components/ui/button';
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
import { toast } from '@/components/ui/use-toast';

interface CECredit {
  id: string;
  courseName: string;
  provider: string;
  category: string;
  credits: number;
  completionDate: string;
  isVerified: boolean;
  staffProfile: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function CECreditsPage() {
  const [credits, setCredits] = useState<CECredit[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchCredits = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (categoryFilter) params.set('category', categoryFilter);

      const response = await fetch(`/api/staff/ce-credits?${params}`);
      const data = await response.json();

      if (data.success) {
        setCredits(data.data.items);
        setTotal(data.data.total);
        setTotalCredits(data.data.totalCredits);
        setCategories(data.data.categories || []);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load CE credits', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [page, categoryFilter]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <PageHeader
        title="CE Credits"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Staff' },
          { label: 'Performance', href: '/staff/performance' },
          { label: 'CE Credits' },
        ]}
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          <StatsRow>
            <StatCard accentColor="primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Records</p>
                  <p className="text-lg font-bold">{total}</p>
                </div>
                <GraduationCap className="h-5 w-5 text-primary-500" />
              </div>
            </StatCard>
            <StatCard accentColor="accent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Credits Earned</p>
                  <p className="text-lg font-bold">{totalCredits}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-accent-500" />
              </div>
            </StatCard>
          </StatsRow>

          <Card variant="ghost">
            <CardContent className="p-4">
              <div className="flex items-end gap-4 flex-wrap">
                <FormField label="Category">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <Button variant="outline" onClick={fetchCredits}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader compact>
              <CardTitle size="sm">{total} CE Credits</CardTitle>
            </CardHeader>
            <CardContent compact>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Verified</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                    </TableRow>
                  ) : credits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No CE credits found</TableCell>
                    </TableRow>
                  ) : (
                    credits.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.courseName}</TableCell>
                        <TableCell>{c.staffProfile?.firstName} {c.staffProfile?.lastName}</TableCell>
                        <TableCell>{c.provider}</TableCell>
                        <TableCell><Badge variant="outline">{c.category}</Badge></TableCell>
                        <TableCell className="font-bold">{c.credits}</TableCell>
                        <TableCell>{format(new Date(c.completionDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          {c.isVerified ? (
                            <Badge variant="success">Verified</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </>
  );
}
