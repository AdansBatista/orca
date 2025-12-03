'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, startOfDay, endOfDay, addDays, subDays } from 'date-fns';
import {
  Plus,
  Search,
  Filter,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName, getFakePhone } from '@/lib/fake-data';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  confirmationStatus: string;
  source: string;
  notes: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
  appointmentType: {
    id: string;
    code: string;
    name: string;
    color: string;
  };
  provider: {
    id: string;
    firstName: string;
    lastName: string;
  };
  chair?: {
    id: string;
    name: string;
  } | null;
}

interface PaginatedResponse {
  items: Appointment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface Provider {
  id: string;
  firstName: string;
  lastName: string;
}

interface AppointmentType {
  id: string;
  code: string;
  name: string;
  color: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'outline' }> = {
  SCHEDULED: { label: 'Scheduled', variant: 'default' },
  CONFIRMED: { label: 'Confirmed', variant: 'success' },
  ARRIVED: { label: 'Arrived', variant: 'warning' },
  IN_PROGRESS: { label: 'In Progress', variant: 'warning' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'outline' },
  NO_SHOW: { label: 'No Show', variant: 'error' },
};

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'ARRIVED', label: 'Arrived' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No Show' },
];

export default function AppointmentsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Data state
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);

  // Filter state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const dateParam = searchParams.get('date');
    return dateParam ? new Date(dateParam) : new Date();
  });
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [providerId, setProviderId] = useState(searchParams.get('providerId') || 'all');
  const [appointmentTypeId, setAppointmentTypeId] = useState(searchParams.get('typeId') || 'all');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Detail sheet state
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Fetch filters data
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [providersRes, typesRes] = await Promise.all([
          fetch('/api/staff?isProvider=true&status=ACTIVE&pageSize=50'),
          fetch('/api/booking/appointment-types?isActive=true&pageSize=50'),
        ]);
        const [providersData, typesData] = await Promise.all([
          providersRes.json(),
          typesRes.json(),
        ]);
        if (providersData.success) setProviders(providersData.data.items || []);
        if (typesData.success) setAppointmentTypes(typesData.data.items || []);
      } catch {
        // Silent fail
      }
    };
    fetchFilters();
  }, []);

  // Fetch appointments
  const fetchData = useCallback(async () => {
    setLoading(true);

    const params = new URLSearchParams();
    params.set('startDate', startOfDay(selectedDate).toISOString());
    params.set('endDate', endOfDay(selectedDate).toISOString());
    if (search) params.set('search', search);
    if (status && status !== 'all') params.set('status', status);
    if (providerId && providerId !== 'all') params.set('providerId', providerId);
    if (appointmentTypeId && appointmentTypeId !== 'all') params.set('appointmentTypeId', appointmentTypeId);
    params.set('page', String(page));
    params.set('pageSize', '20');
    params.set('sortBy', 'startTime');
    params.set('sortOrder', 'asc');

    try {
      const response = await fetch(`/api/booking/appointments?${params.toString()}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error(result.error?.message || 'Failed to load appointments');
      }
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, search, status, providerId, appointmentTypeId, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update URL with filters
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('date', format(selectedDate, 'yyyy-MM-dd'));
    if (search) params.set('search', search);
    if (status && status !== 'all') params.set('status', status);
    if (providerId && providerId !== 'all') params.set('providerId', providerId);
    if (appointmentTypeId && appointmentTypeId !== 'all') params.set('typeId', appointmentTypeId);
    if (page > 1) params.set('page', String(page));

    router.replace(`/booking/appointments?${params.toString()}`, { scroll: false });
  }, [selectedDate, search, status, providerId, appointmentTypeId, page, router]);

  // Navigate date
  const goToPrevDay = () => setSelectedDate((d) => subDays(d, 1));
  const goToNextDay = () => setSelectedDate((d) => addDays(d, 1));
  const goToToday = () => setSelectedDate(new Date());

  // Status action
  const handleStatusAction = async (appointmentId: string, action: string, body?: object) => {
    try {
      const response = await fetch(`/api/booking/appointments/${appointmentId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
      });
      const result = await response.json();

      if (result.success) {
        toast.success(`Appointment ${action}ed successfully`);
        fetchData();
      } else {
        toast.error(result.error?.message || `Failed to ${action} appointment`);
      }
    } catch {
      toast.error(`Failed to ${action} appointment`);
    }
  };

  // View appointment detail
  const handleViewDetail = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetail(true);
  };

  return (
    <>
      <PageHeader
        title="Appointments"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Booking', href: '/booking' },
          { label: 'Appointments' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/booking">
              <Button variant="outline" size="sm">
                <CalendarDays className="h-4 w-4 mr-2" />
                Calendar View
              </Button>
            </Link>
            <Link href="/booking/appointments/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </Button>
            </Link>
          </div>
        }
      />

      <PageContent density="comfortable">
        <div className="space-y-4">
          {/* Date Navigation */}
          <Card variant="ghost">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon-sm" onClick={goToPrevDay}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToToday}>
                    Today
                  </Button>
                  <Button variant="outline" size="icon-sm" onClick={goToNextDay}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <span className="ml-2 font-semibold text-lg">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                <Input
                  type="date"
                  value={format(selectedDate, 'yyyy-MM-dd')}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="w-auto"
                />
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card variant="ghost">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patient name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Status filter */}
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Provider filter */}
                <Select value={providerId} onValueChange={setProviderId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.firstName} {p.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Type filter */}
                <Select value={appointmentTypeId} onValueChange={setAppointmentTypeId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {appointmentTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: t.color }}
                          />
                          {t.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Results Table */}
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
                      <Skeleton className="h-10 w-10" />
                    </div>
                  ))}
                </div>
              ) : data?.items.length === 0 ? (
                <div className="p-12 text-center">
                  <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-foreground mb-1">No appointments found</h3>
                  <p className="text-muted-foreground mb-4">
                    {search || status !== 'all' || providerId !== 'all'
                      ? 'Try adjusting your filters'
                      : `No appointments scheduled for ${format(selectedDate, 'MMMM d, yyyy')}`}
                  </p>
                  <Link href="/booking/appointments/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Appointment
                    </Button>
                  </Link>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Time</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.items.map((apt) => {
                      const statusInfo = statusConfig[apt.status] || statusConfig.SCHEDULED;
                      return (
                        <TableRow key={apt.id}>
                          <TableCell className="font-mono text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {format(new Date(apt.startTime), 'h:mm a')}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {apt.duration} min
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">
                                  <PhiProtected fakeData={getFakeName()}>
                                    {apt.patient.firstName} {apt.patient.lastName}
                                  </PhiProtected>
                                </p>
                                {apt.patient.phone && (
                                  <p className="text-xs text-muted-foreground">
                                    <PhiProtected fakeData={getFakePhone()}>
                                      {apt.patient.phone}
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
                                style={{ backgroundColor: apt.appointmentType.color }}
                              />
                              <span>{apt.appointmentType.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {apt.provider.firstName} {apt.provider.lastName}
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
                                <DropdownMenuItem onClick={() => handleViewDetail(apt)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {!['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(apt.status) && (
                                  <DropdownMenuItem asChild>
                                    <Link href={`/booking/appointments/${apt.id}`}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {/* Status actions */}
                                {apt.status === 'SCHEDULED' && (
                                  <DropdownMenuItem onClick={() => handleStatusAction(apt.id, 'confirm')}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Confirm
                                  </DropdownMenuItem>
                                )}
                                {['SCHEDULED', 'CONFIRMED'].includes(apt.status) && (
                                  <DropdownMenuItem onClick={() => handleStatusAction(apt.id, 'check-in')}>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Check In
                                  </DropdownMenuItem>
                                )}
                                {apt.status === 'ARRIVED' && (
                                  <DropdownMenuItem onClick={() => handleStatusAction(apt.id, 'start')}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Start
                                  </DropdownMenuItem>
                                )}
                                {['ARRIVED', 'IN_PROGRESS'].includes(apt.status) && (
                                  <DropdownMenuItem onClick={() => handleStatusAction(apt.id, 'complete')}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Complete
                                  </DropdownMenuItem>
                                )}
                                {['SCHEDULED', 'CONFIRMED'].includes(apt.status) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleStatusAction(apt.id, 'no-show')}
                                      className="text-warning-600"
                                    >
                                      <AlertTriangle className="h-4 w-4 mr-2" />
                                      No Show
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {!['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(apt.status) && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const reason = prompt('Cancellation reason:');
                                      if (reason) {
                                        handleStatusAction(apt.id, 'cancel', { cancellationReason: reason });
                                      }
                                    }}
                                    className="text-destructive"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancel
                                  </DropdownMenuItem>
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
                {Math.min(data.page * data.pageSize, data.total)} of {data.total} appointments
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

      {/* Detail Sheet */}
      <Sheet open={showDetail} onOpenChange={setShowDetail}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Appointment Details</SheetTitle>
          </SheetHeader>
          {selectedAppointment && (
            <div className="space-y-6 py-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <Badge variant={statusConfig[selectedAppointment.status]?.variant || 'default'}>
                  {statusConfig[selectedAppointment.status]?.label || selectedAppointment.status}
                </Badge>
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedAppointment.appointmentType.color }}
                />
              </div>

              {/* Type */}
              <div>
                <h3 className="font-semibold text-lg">
                  {selectedAppointment.appointmentType.name}
                </h3>
                <p className="text-sm text-muted-foreground font-mono">
                  {selectedAppointment.appointmentType.code}
                </p>
              </div>

              {/* Patient */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">
                      <PhiProtected fakeData={getFakeName()}>
                        {selectedAppointment.patient.firstName} {selectedAppointment.patient.lastName}
                      </PhiProtected>
                    </p>
                    <Link
                      href={`/patients/${selectedAppointment.patient.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View Patient
                    </Link>
                  </div>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">
                    {format(new Date(selectedAppointment.startTime), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedAppointment.startTime), 'h:mm a')} -{' '}
                    {format(new Date(selectedAppointment.endTime), 'h:mm a')}
                    {' '}({selectedAppointment.duration} min)
                  </p>
                </div>
              </div>

              {/* Provider */}
              <div className="flex items-start gap-3">
                <UserCheck className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">
                    {selectedAppointment.provider.firstName} {selectedAppointment.provider.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">Provider</p>
                </div>
              </div>

              {/* Notes */}
              {selectedAppointment.notes && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="mt-1">{selectedAppointment.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t">
                <Link href={`/booking/appointments/${selectedAppointment.id}`}>
                  <Button variant="outline" className="w-full">
                    Edit Appointment
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
