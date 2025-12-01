'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Star, RefreshCw, Plus, Heart, Award, Users } from 'lucide-react';

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';

interface Recognition {
  id: string;
  type: string;
  title: string;
  description: string | null;
  recognitionDate: string;
  givenByName: string | null;
  isAnonymous: boolean;
  isPublic: boolean;
  staffProfile: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const recognitionTypes = [
  { value: 'KUDOS', label: 'Kudos' },
  { value: 'EMPLOYEE_OF_MONTH', label: 'Employee of the Month' },
  { value: 'YEARS_OF_SERVICE', label: 'Years of Service' },
  { value: 'ACHIEVEMENT', label: 'Achievement' },
  { value: 'PEER_RECOGNITION', label: 'Peer Recognition' },
  { value: 'PATIENT_COMPLIMENT', label: 'Patient Compliment' },
  { value: 'OTHER', label: 'Other' },
];

export default function RecognitionPage() {
  const [recognitions, setRecognitions] = useState<Recognition[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const [typeFilter, setTypeFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newRecognition, setNewRecognition] = useState({
    staffProfileId: '',
    type: 'KUDOS',
    title: '',
    description: '',
    isAnonymous: false,
    isPublic: true,
  });

  const fetchRecognitions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (typeFilter) params.set('type', typeFilter);

      const response = await fetch(`/api/staff/recognition?${params}`);
      const data = await response.json();

      if (data.success) {
        setRecognitions(data.data.items);
        setTotal(data.data.total);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load recognitions', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [page, typeFilter]);

  const fetchStaff = useCallback(async () => {
    try {
      const response = await fetch('/api/staff?pageSize=100');
      const data = await response.json();
      if (data.success) {
        setStaffList(data.data.items || []);
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchRecognitions();
  }, [fetchRecognitions]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleCreate = async () => {
    if (!newRecognition.staffProfileId || !newRecognition.title) {
      toast({ title: 'Error', description: 'Please fill in required fields', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/staff/recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecognition),
      });

      const data = await response.json();

      if (data.success) {
        toast({ title: 'Success', description: 'Recognition created!' });
        setIsCreateOpen(false);
        setNewRecognition({
          staffProfileId: '',
          type: 'KUDOS',
          title: '',
          description: '',
          isAnonymous: false,
          isPublic: true,
        });
        fetchRecognitions();
      } else {
        toast({ title: 'Error', description: data.error?.message || 'Failed to create recognition', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create recognition', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const typeVariant = (type: string) => {
    switch (type) {
      case 'EMPLOYEE_OF_MONTH': return 'warning';
      case 'ACHIEVEMENT': return 'success';
      case 'KUDOS': return 'info';
      case 'PEER_RECOGNITION': return 'accent';
      default: return 'default';
    }
  };

  return (
    <>
      <PageHeader
        title="Recognition & Kudos"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Staff' },
          { label: 'Performance', href: '/staff/performance' },
          { label: 'Recognition' },
        ]}
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Give Recognition
          </Button>
        }
      />
      <PageContent density="comfortable">
        <div className="space-y-6">
          <StatsRow>
            <StatCard accentColor="accent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Recognitions</p>
                  <p className="text-lg font-bold">{total}</p>
                </div>
                <Star className="h-5 w-5 text-accent-500" />
              </div>
            </StatCard>
          </StatsRow>

          <Card variant="ghost">
            <CardContent className="p-4">
              <div className="flex items-end gap-4 flex-wrap">
                <FormField label="Type">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {recognitionTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <Button variant="outline" onClick={fetchRecognitions}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center text-muted-foreground">Loading...</CardContent>
              </Card>
            ) : recognitions.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center text-muted-foreground">No recognitions found</CardContent>
              </Card>
            ) : (
              recognitions.map((rec) => (
                <Card key={rec.id} variant="bento">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={typeVariant(rec.type)}>{rec.type.replace('_', ' ')}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(rec.recognitionDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <h3 className="font-semibold mb-1">{rec.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      To: {rec.staffProfile?.firstName} {rec.staffProfile?.lastName}
                    </p>
                    {rec.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{rec.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {rec.isAnonymous ? 'Anonymous' : rec.givenByName ? `From: ${rec.givenByName}` : ''}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
              </div>
            </div>
          )}
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Give Recognition</DialogTitle>
              <DialogDescription>Recognize a team member for their great work!</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <FormField label="Staff Member" required>
                <Select
                  value={newRecognition.staffProfileId}
                  onValueChange={(v) => setNewRecognition({ ...newRecognition, staffProfileId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.firstName} {s.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Type" required>
                <Select
                  value={newRecognition.type}
                  onValueChange={(v) => setNewRecognition({ ...newRecognition, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {recognitionTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Title" required>
                <Input
                  value={newRecognition.title}
                  onChange={(e) => setNewRecognition({ ...newRecognition, title: e.target.value })}
                  placeholder="e.g., Great teamwork this week!"
                />
              </FormField>
              <FormField label="Description">
                <Textarea
                  value={newRecognition.description}
                  onChange={(e) => setNewRecognition({ ...newRecognition, description: e.target.value })}
                  placeholder="Add more details..."
                  rows={3}
                />
              </FormField>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={newRecognition.isAnonymous}
                    onCheckedChange={(c) => setNewRecognition({ ...newRecognition, isAnonymous: !!c })}
                  />
                  Give anonymously
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={newRecognition.isPublic}
                    onCheckedChange={(c) => setNewRecognition({ ...newRecognition, isPublic: !!c })}
                  />
                  Make public
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Recognition'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContent>
    </>
  );
}
