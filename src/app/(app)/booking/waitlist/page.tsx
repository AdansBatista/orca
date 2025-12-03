'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  Clock,
  User,
  MoreHorizontal,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Filter,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { FormField } from '@/components/ui/form-field';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName, getFakePhone } from '@/lib/fake-data';
import { toast } from 'sonner';

interface WaitlistEntry {
  id: string;
  priority: string;
  status: string;
  addedAt: string;
  expiresAt: string | null;
  notes: string | null;
  reasonForWaitlist: string | null;
  preferredTimes: string[];
  preferredDays: number[];
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
  };
  appointmentType: {
    id: string;
    code: string;
    name: string;
    color: string;
    defaultDuration: number;
  };
  preferredProvider: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface PaginatedResponse {
  items: WaitlistEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface AppointmentType {
  id: string;
  code: string;
  name: string;
  color: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

const priorityConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' }> = {
  URGENT: { label: 'Urgent', variant: 'error' },
  HIGH: { label: 'High', variant: 'warning' },
  STANDARD: { label: 'Standard', variant: 'default' },
  FLEXIBLE: { label: 'Flexible', variant: 'success' },
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'outline' }> = {
  ACTIVE: { label: 'Active', variant: 'default' },
  NOTIFIED: { label: 'Notified', variant: 'warning' },
  BOOKED: { label: 'Booked', variant: 'success' },
  EXPIRED: { label: 'Expired', variant: 'outline' },
  REMOVED: { label: 'Removed', variant: 'outline' },
  DECLINED: { label: 'Declined', variant: 'outline' },
};

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const timePreferences: Record<string, string> = {
  MORNING: 'Morning (8am-12pm)',
  AFTERNOON: 'Afternoon (12pm-5pm)',
  EVENING: 'Evening (5pm-8pm)',
};

export default function WaitlistPage() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);

  // Filters
  const [status, setStatus] = useState('ACTIVE');
  const [priority, setPriority] = useState('all');
  const [appointmentTypeId, setAppointmentTypeId] = useState('all');
  const [page, setPage] = useState(1);

  // Add dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addFormData, setAddFormData] = useState({
    patientId: '',
    appointmentTypeId: '',
    priority: 'STANDARD',
    preferredTimes: [] as string[],
    preferredDays: [] as number[],
    notes: '',
    reasonForWaitlist: '',
  });
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [searchingPatients, setSearchingPatients] = useState(false);

  // Fetch appointment types
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await fetch('/api/booking/appointment-types?isActive=true&pageSize=50');
        const result = await response.json();
        if (result.success) {
          setAppointmentTypes(result.data.items || []);
        }
      } catch {
        // Silent fail
      }
    };
    fetchTypes();
  }, []);

  // Fetch waitlist
  const fetchData = useCallback(async () => {
    setLoading(true);

    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
    if (priority && priority !== 'all') params.set('priority', priority);
    if (appointmentTypeId && appointmentTypeId !== 'all') params.set('appointmentTypeId', appointmentTypeId);
    params.set('page', String(page));
    params.set('pageSize', '20');
    params.set('sortBy', 'addedAt');
    params.set('sortOrder', 'desc');

    try {
      const response = await fetch(`/api/booking/waitlist?${params.toString()}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error(result.error?.message || 'Failed to load waitlist');
      }
    } catch {
      toast.error('Failed to load waitlist');
    } finally {
      setLoading(false);
    }
  }, [status, priority, appointmentTypeId, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Search patients
  const searchPatients = useCallback(async (query: string) => {
    if (query.length < 2) {
      setPatientResults([]);
      return;
    }

    setSearchingPatients(true);
    try {
      const response = await fetch(`/api/patients?search=${encodeURIComponent(query)}&pageSize=10`);
      const result = await response.json();
      if (result.success) {
        setPatientResults(result.data.items || []);
      }
    } catch {
      // Silent fail
    } finally {
      setSearchingPatients(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchPatients(patientSearch), 300);
    return () => clearTimeout(timer);
  }, [patientSearch, searchPatients]);

  // Remove from waitlist
  const handleRemove = async (id: string) => {
    if (!confirm('Remove this patient from the waitlist?')) return;

    try {
      const response = await fetch(`/api/booking/waitlist/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        toast.success('Removed from waitlist');
        fetchData();
      } else {
        toast.error(result.error?.message || 'Failed to remove');
      }
    } catch {
      toast.error('Failed to remove from waitlist');
    }
  };

  // Add to waitlist
  const handleAdd = async () => {
    if (!addFormData.patientId || !addFormData.appointmentTypeId) {
      toast.error('Please select a patient and appointment type');
      return;
    }

    try {
      const response = await fetch('/api/booking/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addFormData),
      });
      const result = await response.json();

      if (result.success) {
        toast.success('Added to waitlist');
        setShowAddDialog(false);
        setAddFormData({
          patientId: '',
          appointmentTypeId: '',
          priority: 'STANDARD',
          preferredTimes: [],
          preferredDays: [],
          notes: '',
          reasonForWaitlist: '',
        });
        setPatientSearch('');
        fetchData();
      } else {
        toast.error(result.error?.message || 'Failed to add to waitlist');
      }
    } catch {
      toast.error('Failed to add to waitlist');
    }
  };

  // Stats
  const activeCount = data?.items.filter(e => e.status === 'ACTIVE').length || 0;
  const urgentCount = data?.items.filter(e => e.priority === 'URGENT' && e.status === 'ACTIVE').length || 0;

  return (
    <>
      <PageHeader
        title="Waitlist"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Booking', href: '/booking' },
          { label: 'Waitlist' },
        ]}
        actions={
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add to Waitlist
          </Button>
        }
      />

      <PageContent density="comfortable">
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card variant="ghost">
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{data?.total || 0}</div>
                <p className="text-sm text-muted-foreground">Total Entries</p>
              </CardContent>
            </Card>
            <Card variant="ghost">
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{activeCount}</div>
                <p className="text-sm text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            <Card variant="ghost">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-error-600">{urgentCount}</div>
                <p className="text-sm text-muted-foreground">Urgent</p>
              </CardContent>
            </Card>
            <Card variant="ghost">
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{appointmentTypes.length}</div>
                <p className="text-sm text-muted-foreground">Appointment Types</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card variant="ghost">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Filter:</span>
                </div>

                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="NOTIFIED">Notified</SelectItem>
                    <SelectItem value="BOOKED">Booked</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="REMOVED">Removed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                    <SelectItem value="FLEXIBLE">Flexible</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={appointmentTypeId} onValueChange={setAppointmentTypeId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Appointment Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {appointmentTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                          {t.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Waitlist Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-20" />
                      <Skeleton className="h-10 flex-1" />
                      <Skeleton className="h-10 w-32" />
                      <Skeleton className="h-10 w-24" />
                    </div>
                  ))}
                </div>
              ) : data?.items.length === 0 ? (
                <div className="p-12 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-foreground mb-1">Waitlist is empty</h3>
                  <p className="text-muted-foreground mb-4">
                    {status !== 'all' || priority !== 'all'
                      ? 'No entries match your filters'
                      : 'No patients are currently on the waitlist'}
                  </p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Waitlist
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Priority</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Appointment Type</TableHead>
                      <TableHead>Preferences</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.items.map((entry) => {
                      const priorityInfo = priorityConfig[entry.priority] || priorityConfig.STANDARD;
                      const statusInfo = statusConfig[entry.status] || statusConfig.ACTIVE;
                      return (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <Badge variant={priorityInfo.variant}>
                              {priorityInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">
                                  <PhiProtected fakeData={getFakeName()}>
                                    {entry.patient.firstName} {entry.patient.lastName}
                                  </PhiProtected>
                                </p>
                                {entry.patient.phone && (
                                  <p className="text-xs text-muted-foreground">
                                    <PhiProtected fakeData={getFakePhone()}>
                                      {entry.patient.phone}
                                    </PhiProtected>
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.appointmentType.color }}
                              />
                              <span>{entry.appointmentType.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1">
                              {entry.preferredTimes.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {entry.preferredTimes.map((t) => (
                                    <Badge key={t} variant="outline" className="text-xs">
                                      {t.toLowerCase()}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              {entry.preferredDays.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {entry.preferredDays.map((d) => (
                                    <Badge key={d} variant="outline" className="text-xs">
                                      {dayNames[d]}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              {entry.preferredProvider && (
                                <div className="text-muted-foreground">
                                  Provider: {entry.preferredProvider.firstName} {entry.preferredProvider.lastName}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(entry.addedAt), 'MMM d, yyyy')}
                            {entry.expiresAt && (
                              <div className="text-xs text-muted-foreground">
                                Expires: {format(new Date(entry.expiresAt), 'MMM d')}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusInfo.variant}>
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/patients/${entry.patient.id}`}>
                                    <User className="h-4 w-4 mr-2" />
                                    View Patient
                                  </Link>
                                </DropdownMenuItem>
                                {entry.status === 'ACTIVE' && (
                                  <>
                                    <DropdownMenuItem asChild>
                                      <Link
                                        href={`/booking/appointments/new?patientId=${entry.patient.id}&typeId=${entry.appointmentType.id}`}
                                      >
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Book Appointment
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleRemove(entry.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Remove
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(data.page - 1) * data.pageSize + 1} to{' '}
                {Math.min(data.page * data.pageSize, data.total)} of {data.total} entries
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {data.page} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </PageContent>

      {/* Add to Waitlist Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add to Waitlist</DialogTitle>
            <DialogDescription>
              Add a patient to the waitlist for appointment scheduling
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Patient Search */}
            <FormField label="Patient" required>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patient name..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {patientResults.length > 0 && (
                <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto">
                  {patientResults.map((p) => (
                    <button
                      key={p.id}
                      className="w-full p-2 text-left hover:bg-muted/50 flex items-center gap-2"
                      onClick={() => {
                        setAddFormData({ ...addFormData, patientId: p.id });
                        setPatientSearch(`${p.firstName} ${p.lastName}`);
                        setPatientResults([]);
                      }}
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      <PhiProtected fakeData={getFakeName()}>
                        {p.firstName} {p.lastName}
                      </PhiProtected>
                    </button>
                  ))}
                </div>
              )}
            </FormField>

            {/* Appointment Type */}
            <FormField label="Appointment Type" required>
              <Select
                value={addFormData.appointmentTypeId}
                onValueChange={(v) => setAddFormData({ ...addFormData, appointmentTypeId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {appointmentTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                        {t.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {/* Priority */}
            <FormField label="Priority">
              <Select
                value={addFormData.priority}
                onValueChange={(v) => setAddFormData({ ...addFormData, priority: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="FLEXIBLE">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            {/* Time Preferences */}
            <FormField label="Preferred Times">
              <div className="flex flex-wrap gap-2">
                {Object.entries(timePreferences).map(([key, label]) => (
                  <Badge
                    key={key}
                    variant={addFormData.preferredTimes.includes(key) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const times = addFormData.preferredTimes.includes(key)
                        ? addFormData.preferredTimes.filter((t) => t !== key)
                        : [...addFormData.preferredTimes, key];
                      setAddFormData({ ...addFormData, preferredTimes: times });
                    }}
                  >
                    {label.split(' ')[0]}
                  </Badge>
                ))}
              </div>
            </FormField>

            {/* Day Preferences */}
            <FormField label="Preferred Days">
              <div className="flex flex-wrap gap-2">
                {dayNames.map((day, index) => (
                  <Badge
                    key={index}
                    variant={addFormData.preferredDays.includes(index) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const days = addFormData.preferredDays.includes(index)
                        ? addFormData.preferredDays.filter((d) => d !== index)
                        : [...addFormData.preferredDays, index];
                      setAddFormData({ ...addFormData, preferredDays: days });
                    }}
                  >
                    {day}
                  </Badge>
                ))}
              </div>
            </FormField>

            {/* Reason */}
            <FormField label="Reason">
              <Input
                placeholder="Why is the patient on the waitlist?"
                value={addFormData.reasonForWaitlist}
                onChange={(e) => setAddFormData({ ...addFormData, reasonForWaitlist: e.target.value })}
              />
            </FormField>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add to Waitlist</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
