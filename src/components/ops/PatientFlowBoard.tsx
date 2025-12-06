'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  MoreVertical,
  Phone,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  User,
  Armchair,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface FlowPatient {
  id: string;
  appointmentId: string;
  stage: string;
  priority: string;
  scheduledAt: string;
  checkedInAt: string | null;
  seatedAt: string | null;
  currentWaitStartedAt: string | null;
  notes: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  provider: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  chair: {
    id: string;
    name: string;
    chairNumber: number;
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

interface PatientFlowBoardProps {
  onRefresh?: () => void;
}

// Flow stages in order
const FLOW_STAGES = [
  { key: 'CHECKED_IN', label: 'Checked In', color: 'bg-blue-500' },
  { key: 'WAITING', label: 'Waiting', color: 'bg-yellow-500' },
  { key: 'CALLED', label: 'Called', color: 'bg-purple-500' },
  { key: 'IN_CHAIR', label: 'In Chair', color: 'bg-green-500' },
  { key: 'COMPLETED', label: 'Completed', color: 'bg-emerald-500' },
];

export function PatientFlowBoard({ onRefresh }: PatientFlowBoardProps) {
  const [patients, setPatients] = useState<FlowPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [chairDialogOpen, setChairDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<FlowPatient | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [viewPatient, setViewPatient] = useState<FlowPatient | null>(null);

  // Fetch flow states
  const fetchFlowStates = useCallback(async () => {
    try {
      const response = await fetch('/api/ops/flow');
      const result = await response.json();
      if (result.success) {
        setPatients(result.data);
      }
    } catch {
      toast.error('Failed to load patient flow');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlowStates();
    // Poll every 30 seconds
    const interval = setInterval(fetchFlowStates, 30000);
    return () => clearInterval(interval);
  }, [fetchFlowStates]);

  // Calculate wait time in minutes
  const getWaitTime = (patient: FlowPatient): number => {
    const waitStart = patient.currentWaitStartedAt || patient.checkedInAt;
    if (!waitStart) return 0;
    return Math.floor((Date.now() - new Date(waitStart).getTime()) / 60000);
  };

  // Get patients by stage
  const getPatientsByStage = (stage: string) => {
    return patients.filter((p) => p.stage === stage);
  };

  // Open patient detail sheet
  const handleViewPatient = (patient: FlowPatient) => {
    setViewPatient(patient);
    setDetailSheetOpen(true);
  };

  // Open chair selection dialog for seating
  const handleSeatClick = (patient: FlowPatient) => {
    setSelectedPatient(patient);
    setChairDialogOpen(true);
  };

  // Seat patient with selected chair
  const seatPatient = async (chairId: string) => {
    if (!selectedPatient) return;

    setActionLoading(selectedPatient.id);
    try {
      const response = await fetch('/api/ops/flow/seat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: selectedPatient.appointmentId,
          chairId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`Patient seated successfully`);
        setChairDialogOpen(false);
        setSelectedPatient(null);
        fetchFlowStates();
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

  // Move patient to next stage
  const movePatient = async (patient: FlowPatient, action: string) => {
    // For seat action, open chair selection dialog
    if (action === 'seat') {
      handleSeatClick(patient);
      return;
    }

    setActionLoading(patient.id);

    const endpoints: Record<string, string> = {
      waiting: '/api/ops/flow/waiting',
      call: '/api/ops/flow/call',
      complete: '/api/ops/flow/complete',
      checkout: '/api/ops/flow/check-out',
    };

    try {
      const response = await fetch(endpoints[action], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: patient.appointmentId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`Patient moved successfully`);
        fetchFlowStates();
        onRefresh?.();
      } else {
        toast.error(result.error?.message || 'Failed to move patient');
      }
    } catch {
      toast.error('Failed to update patient status');
    } finally {
      setActionLoading(null);
    }
  };

  // Get next action for a stage (primary button)
  const getNextAction = (stage: string): { label: string; action: string } | null => {
    const actions: Record<string, { label: string; action: string }> = {
      CHECKED_IN: { label: 'Waiting', action: 'waiting' },
      WAITING: { label: 'Call', action: 'call' },
      CALLED: { label: 'Seat', action: 'seat' },
      IN_CHAIR: { label: 'Complete', action: 'complete' },
      COMPLETED: { label: 'Check Out', action: 'checkout' },
    };
    return actions[stage] || null;
  };

  // Get previous stage for revert action
  const getPreviousAction = (stage: string): { label: string; toStage: string } | null => {
    const reversions: Record<string, { label: string; toStage: string }> = {
      WAITING: { label: 'Checked In', toStage: 'CHECKED_IN' },
      CALLED: { label: 'Waiting', toStage: 'WAITING' },
      IN_CHAIR: { label: 'Called', toStage: 'CALLED' },
      COMPLETED: { label: 'In Chair', toStage: 'IN_CHAIR' },
    };
    return reversions[stage] || null;
  };

  // Revert patient to previous stage
  const revertPatient = async (patient: FlowPatient, toStage: string) => {
    setActionLoading(patient.id);
    try {
      const response = await fetch('/api/ops/flow/revert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: patient.appointmentId,
          toStage,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`Patient moved back to ${toStage.replace('_', ' ').toLowerCase()}`);
        fetchFlowStates();
        onRefresh?.();
      } else {
        toast.error(result.error?.message || 'Failed to revert patient');
      }
    } catch {
      toast.error('Failed to revert patient');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-5 gap-4">
        {FLOW_STAGES.map((stage) => (
          <div key={stage.key} className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-4 min-h-[400px]">
      {FLOW_STAGES.map((stage) => {
        const stagePatients = getPatientsByStage(stage.key);

        return (
          <div key={stage.key} className="flex flex-col">
            {/* Stage Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2 h-2 rounded-full ${stage.color}`} />
              <span className="text-sm font-medium">{stage.label}</span>
              <Badge variant="ghost" size="sm">
                {stagePatients.length}
              </Badge>
            </div>

            {/* Patient Cards */}
            <div className="flex-1 space-y-2 bg-muted/30 rounded-lg p-2 min-h-[300px]">
              {stagePatients.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No patients
                </div>
              ) : (
                stagePatients.map((patient) => {
                  const waitTime = getWaitTime(patient);
                  const isExtendedWait = waitTime > 15;
                  const nextAction = getNextAction(patient.stage);

                  return (
                    <Card
                      key={patient.id}
                      variant="compact"
                      className={`${isExtendedWait && patient.stage !== 'IN_CHAIR' && patient.stage !== 'COMPLETED' ? 'border-warning-400' : ''}`}
                    >
                      <CardContent className="p-3">
                        {/* Patient Info */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {patient.patient.firstName[0]}
                                {patient.patient.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                <PhiProtected fakeData={getFakeName()}>
                                  {patient.patient.firstName} {patient.patient.lastName}
                                </PhiProtected>
                              </p>
                              {patient.appointment?.appointmentType && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {patient.appointment.appointmentType.name}
                                </p>
                              )}
                            </div>
                          </div>

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
                              {/* Call option for CHECKED_IN patients (skip waiting) */}
                              {patient.stage === 'CHECKED_IN' && (
                                <DropdownMenuItem
                                  onClick={() => movePatient(patient, 'call')}
                                  disabled={actionLoading === patient.id}
                                >
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  Call (Skip Waiting)
                                </DropdownMenuItem>
                              )}
                              {nextAction && (
                                <DropdownMenuItem
                                  onClick={() => movePatient(patient, nextAction.action)}
                                  disabled={actionLoading === patient.id}
                                >
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  {nextAction.label}
                                </DropdownMenuItem>
                              )}
                              {getPreviousAction(patient.stage) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      revertPatient(
                                        patient,
                                        getPreviousAction(patient.stage)!.toStage
                                      )
                                    }
                                    disabled={actionLoading === patient.id}
                                  >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to {getPreviousAction(patient.stage)!.label}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Meta info */}
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          {/* Wait time for waiting stages */}
                          {['CHECKED_IN', 'WAITING', 'CALLED'].includes(patient.stage) && (
                            <div className={`flex items-center gap-1 ${isExtendedWait ? 'text-warning-600' : ''}`}>
                              {isExtendedWait && <AlertTriangle className="h-3 w-3" />}
                              <Clock className="h-3 w-3" />
                              <span>{waitTime}m</span>
                            </div>
                          )}

                          {/* Chair info */}
                          {patient.chair && (
                            <div className="flex items-center gap-1">
                              <Armchair className="h-3 w-3" />
                              <span>{patient.chair.name}</span>
                            </div>
                          )}

                          {/* Provider */}
                          {patient.provider && (
                            <span className="truncate">
                              Dr. {patient.provider.lastName}
                            </span>
                          )}
                        </div>

                        {/* Priority Badge */}
                        {patient.priority === 'URGENT' && (
                          <Badge variant="error" size="sm" className="mt-2">
                            Urgent
                          </Badge>
                        )}
                        {patient.priority === 'HIGH' && (
                          <Badge variant="warning" size="sm" className="mt-2">
                            High Priority
                          </Badge>
                        )}

                        {/* Quick Action */}
                        {nextAction && (
                          <Button
                            variant="soft"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => movePatient(patient, nextAction.action)}
                            disabled={actionLoading === patient.id}
                            loading={actionLoading === patient.id}
                          >
                            {nextAction.label}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        );
      })}

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
          fetchFlowStates();
          onRefresh?.();
        }}
      />
    </div>
  );
}
