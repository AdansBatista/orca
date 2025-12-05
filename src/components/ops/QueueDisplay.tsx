'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  AlertTriangle,
  Phone,
  ArrowRight,
  User,
  Armchair,
  MoreVertical,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';
import { ChairSelectionDialog } from './ChairSelectionDialog';
import { PatientDetailSheet } from './PatientDetailSheet';
import { toast } from 'sonner';

interface QueuePatient {
  id: string;
  appointmentId: string;
  stage: string;
  priority: string;
  scheduledAt: string;
  checkedInAt: string | null;
  currentWaitStartedAt: string | null;
  notes: string | null;
  waitMinutes: number;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
  provider: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  appointment: {
    id: string;
    duration: number;
    appointmentType: {
      id: string;
      name: string;
      code: string;
      color: string | null;
    } | null;
  } | null;
}

interface QueueDisplayProps {
  onRefresh?: () => void;
}

const STAGE_BADGES: Record<string, { label: string; variant: 'info' | 'warning' | 'soft-primary' }> = {
  CHECKED_IN: { label: 'Checked In', variant: 'info' },
  WAITING: { label: 'Waiting', variant: 'warning' },
  CALLED: { label: 'Called', variant: 'soft-primary' },
};

export function QueueDisplay({ onRefresh }: QueueDisplayProps) {
  const [queue, setQueue] = useState<QueuePatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [chairDialogOpen, setChairDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<QueuePatient | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [viewPatient, setViewPatient] = useState<QueuePatient | null>(null);

  // Fetch queue
  const fetchQueue = useCallback(async () => {
    try {
      const response = await fetch('/api/ops/flow/queue');
      const result = await response.json();
      if (result.success) {
        // API returns { queue, grouped, summary } - extract queue array
        setQueue(result.data.queue || []);
      }
    } catch {
      toast.error('Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    // Poll every 30 seconds
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Call patient
  const callPatient = async (patient: QueuePatient) => {
    setActionLoading(patient.id);
    try {
      const response = await fetch('/api/ops/flow/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: patient.appointmentId }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`${patient.patient.firstName} called`);
        fetchQueue();
        onRefresh?.();
      } else {
        toast.error(result.error?.message || 'Failed to call patient');
      }
    } catch {
      toast.error('Failed to call patient');
    } finally {
      setActionLoading(null);
    }
  };

  // Open chair selection dialog
  const handleSeatClick = (patient: QueuePatient) => {
    setSelectedPatient(patient);
    setChairDialogOpen(true);
  };

  // Open patient detail sheet
  const handleViewPatient = (patient: QueuePatient) => {
    setViewPatient(patient);
    setDetailSheetOpen(true);
  };

  // Seat patient in selected chair
  const seatPatient = async (chairId: string) => {
    if (!selectedPatient) return;

    setActionLoading(selectedPatient.id);
    try {
      const response = await fetch('/api/ops/flow/seat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: selectedPatient.appointmentId, chairId }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`${selectedPatient.patient.firstName} seated`);
        setChairDialogOpen(false);
        setSelectedPatient(null);
        fetchQueue();
        onRefresh?.();
      } else {
        toast.error(result.error?.message || 'Failed to seat patient');
      }
    } catch {
      toast.error('Failed to seat patient');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <User className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-lg font-medium">No patients waiting</p>
        <p className="text-sm">Patients will appear here when they check in</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Queue Header */}
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            {queue.length} patient{queue.length !== 1 ? 's' : ''} waiting
          </span>
          <Badge variant="warning" dot>
            {queue.filter((p) => p.waitMinutes > 15).length} extended wait
          </Badge>
        </div>
      </div>

      {/* Queue List */}
      <div className="space-y-2">
        {queue.map((patient, index) => {
          const isExtendedWait = patient.waitMinutes > 15;
          const stageBadge = STAGE_BADGES[patient.stage];

          return (
            <Card
              key={patient.id}
              variant="compact"
              className={isExtendedWait ? 'border-warning-400' : ''}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Position */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-sm font-medium">{index + 1}</span>
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback>
                      {patient.patient.firstName[0]}
                      {patient.patient.lastName[0]}
                    </AvatarFallback>
                  </Avatar>

                  {/* Patient Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        <PhiProtected fakeData={getFakeName()}>
                          {patient.patient.firstName} {patient.patient.lastName}
                        </PhiProtected>
                      </p>
                      {stageBadge && (
                        <Badge variant={stageBadge.variant} size="sm">
                          {stageBadge.label}
                        </Badge>
                      )}
                      {patient.priority === 'URGENT' && (
                        <Badge variant="error" size="sm">
                          Urgent
                        </Badge>
                      )}
                      {patient.priority === 'HIGH' && (
                        <Badge variant="warning" size="sm">
                          High
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                      {patient.appointment?.appointmentType && (
                        <span>{patient.appointment.appointmentType.name}</span>
                      )}
                      {patient.provider && (
                        <span>Dr. {patient.provider.lastName}</span>
                      )}
                      <span>
                        {new Date(patient.scheduledAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Wait Time */}
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                      isExtendedWait
                        ? 'bg-warning-100 text-warning-700'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isExtendedWait && <AlertTriangle className="h-4 w-4" />}
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">{patient.waitMinutes}m</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {patient.stage === 'CALLED' ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSeatClick(patient)}
                        disabled={actionLoading === patient.id}
                        loading={actionLoading === patient.id}
                      >
                        <Armchair className="h-4 w-4 mr-1" />
                        Seat
                      </Button>
                    ) : (
                      <Button
                        variant="soft"
                        size="sm"
                        onClick={() => callPatient(patient)}
                        disabled={actionLoading === patient.id}
                        loading={actionLoading === patient.id}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Call
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewPatient(patient)}>
                          <User className="h-4 w-4 mr-2" />
                          View Patient
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Phone className="h-4 w-4 mr-2" />
                          Contact
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            patient.stage === 'CALLED'
                              ? handleSeatClick(patient)
                              : callPatient(patient)
                          }
                        >
                          <ArrowRight className="h-4 w-4 mr-2" />
                          {patient.stage === 'CALLED' ? 'Seat Patient' : 'Call Patient'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Notes */}
                {patient.notes && (
                  <div className="mt-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-2">
                    {patient.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chair Selection Dialog */}
      <ChairSelectionDialog
        open={chairDialogOpen}
        onOpenChange={(open) => {
          setChairDialogOpen(open);
          if (!open) setSelectedPatient(null);
        }}
        onSelect={seatPatient}
        patientName={
          selectedPatient
            ? `${selectedPatient.patient.firstName} ${selectedPatient.patient.lastName}`
            : ''
        }
        loading={actionLoading === selectedPatient?.id}
      />

      {/* Patient Detail Sheet */}
      <PatientDetailSheet
        open={detailSheetOpen}
        onOpenChange={(open) => {
          setDetailSheetOpen(open);
          if (!open) setViewPatient(null);
        }}
        patientId={viewPatient?.patient.id || ''}
        appointmentId={viewPatient?.appointmentId}
        currentStage={viewPatient?.stage}
        onAction={() => {
          fetchQueue();
          onRefresh?.();
        }}
      />
    </div>
  );
}
