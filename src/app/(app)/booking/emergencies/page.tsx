'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Plus,
  Filter,
  User,
  MoreHorizontal,
  Phone,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Siren,
  Activity,
  UserCheck,
  FileText,
} from 'lucide-react';

import { PageHeader, PageContent, StatsRow } from '@/components/layout';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
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
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { PatientSearchCombobox, type PatientSearchResult } from '@/components/booking/PatientSearchCombobox';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName, getFakePhone } from '@/lib/fake-data';
import { toast } from 'sonner';

interface EmergencyAppointment {
  id: string;
  emergencyType: string;
  severity: string;
  status: string;
  triageStatus: string;
  requestedAt: string;
  resolvedAt: string | null;
  chiefComplaint: string;
  symptoms: string[];
  painLevel: number | null;
  notes: string | null;
  resolution: string | null;
  resolutionNotes: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
  scheduledAppointment: {
    id: string;
    scheduledStart: string;
  } | null;
  triageBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface PaginatedResponse {
  items: EmergencyAppointment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const emergencyTypeConfig: Record<string, { label: string; variant: 'default' | 'warning' | 'error' }> = {
  PAIN: { label: 'Pain', variant: 'error' },
  BROKEN_BRACKET: { label: 'Broken Bracket', variant: 'warning' },
  LOOSE_WIRE: { label: 'Loose Wire', variant: 'warning' },
  LOST_RETAINER: { label: 'Lost Retainer', variant: 'default' },
  SWELLING: { label: 'Swelling', variant: 'error' },
  TRAUMA: { label: 'Trauma', variant: 'error' },
  INFECTION: { label: 'Infection', variant: 'error' },
  OTHER: { label: 'Other', variant: 'default' },
};

const severityConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' }> = {
  LOW: { label: 'Low', variant: 'success' },
  MEDIUM: { label: 'Medium', variant: 'default' },
  HIGH: { label: 'High', variant: 'warning' },
  CRITICAL: { label: 'Critical', variant: 'error' },
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'outline' }> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  TRIAGED: { label: 'Triaged', variant: 'default' },
  SCHEDULED: { label: 'Scheduled', variant: 'success' },
  IN_PROGRESS: { label: 'In Progress', variant: 'default' },
  RESOLVED: { label: 'Resolved', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'outline' },
};

const triageStatusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' }> = {
  NOT_TRIAGED: { label: 'Not Triaged', variant: 'warning' },
  IN_PROGRESS: { label: 'In Progress', variant: 'default' },
  COMPLETED: { label: 'Completed', variant: 'success' },
};

export default function EmergenciesPage() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [emergencyType, setEmergencyType] = useState('all');
  const [page, setPage] = useState(1);

  // Dialogs
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showTriageDialog, setShowTriageDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyAppointment | null>(null);

  // New emergency form
  const [newFormData, setNewFormData] = useState({
    patientId: '',
    emergencyType: 'PAIN',
    severity: 'MEDIUM',
    chiefComplaint: '',
    symptoms: [] as string[],
    painLevel: 5,
    notes: '',
    requestChannel: 'PHONE',
  });
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null);

  // Triage form
  const [triageData, setTriageData] = useState({
    severity: 'MEDIUM',
    notes: '',
  });

  // Resolve form
  const [resolveData, setResolveData] = useState({
    resolution: 'TREATED',
    notes: '',
  });

  // Fetch emergencies
  const fetchData = useCallback(async () => {
    setLoading(true);

    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
    if (severity && severity !== 'all') params.set('severity', severity);
    if (emergencyType && emergencyType !== 'all') params.set('emergencyType', emergencyType);
    params.set('page', String(page));
    params.set('pageSize', '20');

    try {
      const response = await fetch(`/api/booking/emergencies?${params.toString()}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error(result.error?.message || 'Failed to load emergencies');
      }
    } catch {
      toast.error('Failed to load emergencies');
    } finally {
      setLoading(false);
    }
  }, [status, severity, emergencyType, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle patient selection for new emergency
  const handlePatientSelect = (patient: PatientSearchResult) => {
    setSelectedPatient(patient);
    setNewFormData({ ...newFormData, patientId: patient.id });
  };

  // Create emergency
  const handleCreate = async () => {
    if (!newFormData.patientId || !newFormData.chiefComplaint) {
      toast.error('Please select a patient and describe the complaint');
      return;
    }

    try {
      const response = await fetch('/api/booking/emergencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFormData),
      });
      const result = await response.json();

      if (result.success) {
        toast.success('Emergency created');
        setShowNewDialog(false);
        setNewFormData({
          patientId: '',
          emergencyType: 'PAIN',
          severity: 'MEDIUM',
          chiefComplaint: '',
          symptoms: [],
          painLevel: 5,
          notes: '',
          requestChannel: 'PHONE',
        });
        setSelectedPatient(null);
        fetchData();
      } else {
        toast.error(result.error?.message || 'Failed to create emergency');
      }
    } catch {
      toast.error('Failed to create emergency');
    }
  };

  // Complete triage
  const handleTriage = async () => {
    if (!selectedEmergency) return;

    try {
      const response = await fetch(`/api/booking/emergencies/${selectedEmergency.id}/triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(triageData),
      });
      const result = await response.json();

      if (result.success) {
        toast.success('Triage completed');
        setShowTriageDialog(false);
        setSelectedEmergency(null);
        setTriageData({ severity: 'MEDIUM', notes: '' });
        fetchData();
      } else {
        toast.error(result.error?.message || 'Failed to complete triage');
      }
    } catch {
      toast.error('Failed to complete triage');
    }
  };

  // Resolve emergency
  const handleResolve = async () => {
    if (!selectedEmergency) return;

    try {
      const response = await fetch(`/api/booking/emergencies/${selectedEmergency.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resolveData),
      });
      const result = await response.json();

      if (result.success) {
        toast.success('Emergency resolved');
        setShowResolveDialog(false);
        setSelectedEmergency(null);
        setResolveData({ resolution: 'TREATED', notes: '' });
        fetchData();
      } else {
        toast.error(result.error?.message || 'Failed to resolve emergency');
      }
    } catch {
      toast.error('Failed to resolve emergency');
    }
  };

  // Stats
  const pendingCount = data?.items.filter(e => e.status === 'PENDING').length || 0;
  const criticalCount = data?.items.filter(e => e.severity === 'CRITICAL' && e.status !== 'RESOLVED').length || 0;
  const needsTriageCount = data?.items.filter(e => e.triageStatus === 'NOT_TRIAGED').length || 0;

  return (
    <>
      <PageHeader
        title="Emergency Appointments"
        description="Manage urgent patient requests and emergency scheduling"
        actions={
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Emergency
          </Button>
        }
      />

      <PageContent>
        <div className="space-y-6">
          {/* Stats */}
          <StatsRow>
            <StatCard accentColor="secondary">
              <p className="text-xs text-muted-foreground">Total Active</p>
              <p className="text-2xl font-bold">{data?.total || 0}</p>
            </StatCard>
            <StatCard accentColor="warning">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </StatCard>
            <StatCard accentColor="error">
              <p className="text-xs text-muted-foreground">Critical</p>
              <p className="text-2xl font-bold">{criticalCount}</p>
            </StatCard>
            <StatCard accentColor="accent">
              <p className="text-xs text-muted-foreground">Needs Triage</p>
              <p className="text-2xl font-bold">{needsTriageCount}</p>
            </StatCard>
          </StatsRow>

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
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="TRIAGED">Triaged</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={emergencyType} onValueChange={setEmergencyType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="PAIN">Pain</SelectItem>
                    <SelectItem value="BROKEN_BRACKET">Broken Bracket</SelectItem>
                    <SelectItem value="LOOSE_WIRE">Loose Wire</SelectItem>
                    <SelectItem value="LOST_RETAINER">Lost Retainer</SelectItem>
                    <SelectItem value="SWELLING">Swelling</SelectItem>
                    <SelectItem value="TRAUMA">Trauma</SelectItem>
                    <SelectItem value="INFECTION">Infection</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Emergencies Table */}
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
                  <Siren className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-foreground mb-1">No emergencies</h3>
                  <p className="text-muted-foreground mb-4">
                    {status !== 'all' || severity !== 'all' || emergencyType !== 'all'
                      ? 'No emergencies match your filters'
                      : 'No emergency requests at this time'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Severity</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Complaint</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Triage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.items.map((emergency) => {
                      const typeInfo = emergencyTypeConfig[emergency.emergencyType] || emergencyTypeConfig.OTHER;
                      const severityInfo = severityConfig[emergency.severity] || severityConfig.MEDIUM;
                      const statusInfo = statusConfig[emergency.status] || statusConfig.PENDING;
                      const triageInfo = triageStatusConfig[emergency.triageStatus] || triageStatusConfig.NOT_TRIAGED;

                      return (
                        <TableRow key={emergency.id}>
                          <TableCell>
                            <Badge variant={severityInfo.variant}>
                              {severityInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">
                                  <PhiProtected fakeData={getFakeName()}>
                                    {emergency.patient.firstName} {emergency.patient.lastName}
                                  </PhiProtected>
                                </p>
                                {emergency.patient.phone && (
                                  <p className="text-xs text-muted-foreground">
                                    <PhiProtected fakeData={getFakePhone()}>
                                      {emergency.patient.phone}
                                    </PhiProtected>
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={typeInfo.variant}>
                              {typeInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <p className="truncate text-sm">{emergency.chiefComplaint}</p>
                            {emergency.painLevel !== null && (
                              <p className="text-xs text-muted-foreground">
                                Pain: {emergency.painLevel}/10
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {formatDistanceToNow(new Date(emergency.requestedAt), { addSuffix: true })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={triageInfo.variant}>
                              {triageInfo.label}
                            </Badge>
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
                                  <Link href={`/patients/${emergency.patient.id}`}>
                                    <User className="h-4 w-4 mr-2" />
                                    View Patient
                                  </Link>
                                </DropdownMenuItem>
                                {emergency.triageStatus !== 'COMPLETED' && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedEmergency(emergency);
                                      setTriageData({
                                        severity: emergency.severity,
                                        notes: '',
                                      });
                                      setShowTriageDialog(true);
                                    }}
                                  >
                                    <Activity className="h-4 w-4 mr-2" />
                                    Complete Triage
                                  </DropdownMenuItem>
                                )}
                                {emergency.status !== 'RESOLVED' && emergency.status !== 'CANCELLED' && (
                                  <>
                                    <DropdownMenuItem asChild>
                                      <Link href={`/booking/appointments/new?patientId=${emergency.patient.id}&emergency=${emergency.id}`}>
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Schedule Appointment
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedEmergency(emergency);
                                        setResolveData({ resolution: 'TREATED', notes: '' });
                                        setShowResolveDialog(true);
                                      }}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Resolve
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
                {Math.min(data.page * data.pageSize, data.total)} of {data.total} emergencies
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

      {/* New Emergency Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Emergency Request</DialogTitle>
            <DialogDescription>
              Log a new emergency appointment request
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            <div className="space-y-4">
              {/* Patient Search */}
              <FormField label="Patient" required>
                {selectedPatient ? (
                  <Card variant="ghost">
                    <CardContent className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <PhiProtected fakeData={getFakeName()}>
                          {selectedPatient.firstName} {selectedPatient.lastName}
                        </PhiProtected>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPatient(null);
                          setNewFormData({ ...newFormData, patientId: '' });
                        }}
                      >
                        Change
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <PatientSearchCombobox
                    onSelect={handlePatientSelect}
                    placeholder="Search patient name..."
                    showRecent={false}
                  />
                )}
              </FormField>

              {/* Emergency Type */}
              <FormField label="Emergency Type" required>
                <Select
                  value={newFormData.emergencyType}
                  onValueChange={(v) => setNewFormData({ ...newFormData, emergencyType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAIN">Pain</SelectItem>
                    <SelectItem value="BROKEN_BRACKET">Broken Bracket</SelectItem>
                    <SelectItem value="LOOSE_WIRE">Loose Wire</SelectItem>
                    <SelectItem value="LOST_RETAINER">Lost Retainer</SelectItem>
                    <SelectItem value="SWELLING">Swelling</SelectItem>
                    <SelectItem value="TRAUMA">Trauma</SelectItem>
                    <SelectItem value="INFECTION">Infection</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              {/* Severity */}
              <FormField label="Initial Severity">
                <Select
                  value={newFormData.severity}
                  onValueChange={(v) => setNewFormData({ ...newFormData, severity: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              {/* Chief Complaint */}
              <FormField label="Chief Complaint" required>
                <Textarea
                  placeholder="Describe the emergency..."
                  value={newFormData.chiefComplaint}
                  onChange={(e) => setNewFormData({ ...newFormData, chiefComplaint: e.target.value })}
                  rows={3}
                />
              </FormField>

              {/* Pain Level */}
              <FormField label="Pain Level (0-10)">
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={newFormData.painLevel}
                  onChange={(e) => setNewFormData({ ...newFormData, painLevel: parseInt(e.target.value) || 0 })}
                />
              </FormField>

              {/* Request Channel */}
              <FormField label="Request Channel">
                <Select
                  value={newFormData.requestChannel}
                  onValueChange={(v) => setNewFormData({ ...newFormData, requestChannel: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PHONE">Phone</SelectItem>
                    <SelectItem value="PORTAL">Patient Portal</SelectItem>
                    <SelectItem value="IN_PERSON">In Person</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              {/* Notes */}
              <FormField label="Additional Notes">
                <Textarea
                  placeholder="Any additional information..."
                  value={newFormData.notes}
                  onChange={(e) => setNewFormData({ ...newFormData, notes: e.target.value })}
                  rows={2}
                />
              </FormField>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Emergency</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Triage Dialog */}
      <Dialog open={showTriageDialog} onOpenChange={setShowTriageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Triage</DialogTitle>
            <DialogDescription>
              Assess and update the emergency severity
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            <div className="space-y-4">
              {selectedEmergency && (
                <Card variant="ghost">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <p className="font-medium">
                        <PhiProtected fakeData={getFakeName()}>
                          {selectedEmergency.patient.firstName} {selectedEmergency.patient.lastName}
                        </PhiProtected>
                      </p>
                      <p className="text-sm text-muted-foreground">{selectedEmergency.chiefComplaint}</p>
                      {selectedEmergency.painLevel !== null && (
                        <p className="text-sm">Pain Level: {selectedEmergency.painLevel}/10</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <FormField label="Assessed Severity">
                <Select
                  value={triageData.severity}
                  onValueChange={(v) => setTriageData({ ...triageData, severity: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRITICAL">Critical - Immediate attention</SelectItem>
                    <SelectItem value="HIGH">High - Same day</SelectItem>
                    <SelectItem value="MEDIUM">Medium - Within 24-48 hours</SelectItem>
                    <SelectItem value="LOW">Low - Routine scheduling</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Triage Notes">
                <Textarea
                  placeholder="Assessment notes..."
                  value={triageData.notes}
                  onChange={(e) => setTriageData({ ...triageData, notes: e.target.value })}
                  rows={3}
                />
              </FormField>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTriageDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleTriage}>Complete Triage</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Emergency</DialogTitle>
            <DialogDescription>
              Mark this emergency as resolved
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            <div className="space-y-4">
              <FormField label="Resolution">
                <Select
                  value={resolveData.resolution}
                  onValueChange={(v) => setResolveData({ ...resolveData, resolution: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TREATED">Treated</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled for later</SelectItem>
                    <SelectItem value="REFERRED">Referred out</SelectItem>
                    <SelectItem value="SELF_RESOLVED">Self-resolved</SelectItem>
                    <SelectItem value="NO_SHOW">No show</SelectItem>
                    <SelectItem value="FALSE_ALARM">False alarm</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Resolution Notes">
                <Textarea
                  placeholder="What was done to resolve this emergency..."
                  value={resolveData.notes}
                  onChange={(e) => setResolveData({ ...resolveData, notes: e.target.value })}
                  rows={3}
                />
              </FormField>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve}>Resolve Emergency</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
