'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Armchair,
  User,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Wrench,
  MoreVertical,
  Bell,
  Stethoscope,
  Sparkles,
  Settings2,
  Building2,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, StatCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { IconBox } from '@/components/ui/icon-box';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { StatsRow } from '@/components/layout';

// Chair activity sub-stages (matches Prisma enum)
type ChairActivitySubStage =
  | 'SETUP'
  | 'ASSISTANT_WORKING'
  | 'READY_FOR_DOCTOR'
  | 'DOCTOR_CHECKING'
  | 'FINISHING'
  | 'CLEANING';

// Interface matching the API response structure
interface ChairStatus {
  id: string;
  name: string;
  chairNumber: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'BLOCKED' | 'CLEANING' | 'MAINTENANCE';
  condition: string;
  room: {
    id: string;
    name: string;
    roomNumber: string;
  };
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  appointment?: {
    id: string;
    startTime: string;
    endTime: string;
    appointmentType: {
      id: string;
      name: string;
      code: string;
      color: string | null;
    } | null;
    provider: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  } | null;
  occupiedAt?: string | null;
  expectedFreeAt?: string | null;
  blockReason?: string | null;
  blockedUntil?: string | null;
  // Chair activity sub-stage tracking
  activitySubStage?: ChairActivitySubStage | null;
  subStageStartedAt?: string | null;
  assignedStaff?: {
    id: string;
    firstName: string;
    lastName: string;
    providerType?: string | null;
  } | null;
  procedureNotes?: string | null;
}

interface RoomWithChairs {
  room: {
    id: string;
    name: string;
    roomNumber: string;
  };
  chairs: ChairStatus[];
}

interface FloorPlanViewProps {
  onRefresh?: () => void;
}

// Visual configuration for each sub-stage
const SUB_STAGE_CONFIG: Record<
  ChairActivitySubStage,
  {
    cardBg: string;
    border: string;
    iconBg: string;
    icon: typeof Settings2;
    label: string;
    badge: 'soft-primary' | 'warning' | 'success' | 'info' | 'ghost' | 'secondary';
    glow?: string;
    animate?: string;
  }
> = {
  SETUP: {
    cardBg: 'bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50',
    border: 'border-slate-300 dark:border-slate-600',
    iconBg: 'bg-slate-500',
    icon: Settings2,
    label: 'Setup',
    badge: 'ghost',
  },
  ASSISTANT_WORKING: {
    cardBg: 'bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-900/30 dark:to-violet-800/30',
    border: 'border-violet-400 dark:border-violet-500',
    iconBg: 'bg-violet-500',
    icon: User,
    label: 'Assistant',
    badge: 'secondary',
  },
  READY_FOR_DOCTOR: {
    cardBg: 'bg-gradient-to-br from-amber-50 to-amber-100/80 dark:from-amber-900/30 dark:to-amber-800/30',
    border: 'border-amber-400 dark:border-amber-500',
    iconBg: 'bg-amber-500',
    icon: Bell,
    label: 'Ready for Dr.',
    badge: 'warning',
    glow: 'shadow-md shadow-amber-200/50 dark:shadow-amber-900/30',
  },
  DOCTOR_CHECKING: {
    cardBg: 'bg-gradient-to-br from-green-50 to-emerald-100/50 dark:from-green-900/30 dark:to-emerald-800/30',
    border: 'border-green-500 dark:border-green-400',
    iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
    icon: Stethoscope,
    label: 'Dr. Checking',
    badge: 'success',
  },
  FINISHING: {
    cardBg: 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/30',
    border: 'border-blue-400 dark:border-blue-500',
    iconBg: 'bg-blue-500',
    icon: Sparkles,
    label: 'Finishing',
    badge: 'info',
  },
  CLEANING: {
    cardBg: 'bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-900/30 dark:to-yellow-800/30',
    border: 'border-yellow-400 dark:border-yellow-500',
    iconBg: 'bg-yellow-500',
    icon: Clock,
    label: 'Cleaning',
    badge: 'warning',
  },
};

// Configuration for non-occupied statuses
const STATUS_CONFIG = {
  AVAILABLE: {
    cardBg: 'bg-gradient-to-br from-success-50 to-success-100/50 dark:from-success-900/20 dark:to-success-800/20',
    border: 'border-success-300 dark:border-success-600',
    iconBg: 'bg-success-500',
    icon: CheckCircle2,
    label: 'Available',
    badge: 'success' as const,
  },
  OCCUPIED: {
    cardBg: 'bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/20',
    border: 'border-primary-300 dark:border-primary-600',
    iconBg: 'bg-primary-500',
    icon: User,
    label: 'Occupied',
    badge: 'soft-primary' as const,
  },
  BLOCKED: {
    cardBg: 'bg-gradient-to-br from-error-50 to-error-100/50 dark:from-error-900/20 dark:to-error-800/20',
    border: 'border-error-300 dark:border-error-500',
    iconBg: 'bg-error-500',
    icon: XCircle,
    label: 'Blocked',
    badge: 'error' as const,
  },
  CLEANING: {
    cardBg: 'bg-gradient-to-br from-warning-50 to-warning-100/50 dark:from-warning-900/20 dark:to-warning-800/20',
    border: 'border-warning-300 dark:border-warning-500',
    iconBg: 'bg-warning-500',
    icon: Clock,
    label: 'Cleaning',
    badge: 'warning' as const,
  },
  MAINTENANCE: {
    cardBg: 'bg-gradient-to-br from-slate-100 to-slate-200/50 dark:from-slate-800 dark:to-slate-700',
    border: 'border-slate-400 dark:border-slate-500',
    iconBg: 'bg-slate-600',
    icon: Wrench,
    label: 'Maintenance',
    badge: 'ghost' as const,
  },
};

// Hero action configuration based on current sub-stage
function getHeroAction(chair: ChairStatus): {
  icon: typeof Bell;
  label: string;
  colorClass: string;
  nextStage: ChairActivitySubStage;
} | null {
  if (chair.status !== 'OCCUPIED') return null;

  switch (chair.activitySubStage) {
    case 'SETUP':
    case 'ASSISTANT_WORKING':
      return {
        icon: Bell,
        label: 'Ready for Dr.',
        colorClass: 'bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/50 dark:hover:bg-amber-800/50 dark:text-amber-300',
        nextStage: 'READY_FOR_DOCTOR',
      };
    case 'READY_FOR_DOCTOR':
      return {
        icon: Stethoscope,
        label: 'Start Dr. Check',
        colorClass: 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/50 dark:hover:bg-green-800/50 dark:text-green-300',
        nextStage: 'DOCTOR_CHECKING',
      };
    case 'DOCTOR_CHECKING':
      return {
        icon: Sparkles,
        label: 'Finish',
        colorClass: 'bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/50 dark:hover:bg-blue-800/50 dark:text-blue-300',
        nextStage: 'FINISHING',
      };
    case 'FINISHING':
      return {
        icon: CheckCircle2,
        label: 'Complete',
        colorClass: 'bg-success-100 hover:bg-success-200 text-success-700 dark:bg-success-900/50 dark:hover:bg-success-800/50 dark:text-success-300',
        nextStage: 'CLEANING',
      };
    default:
      return null;
  }
}

export function FloorPlanView({ onRefresh }: FloorPlanViewProps) {
  const [rooms, setRooms] = useState<RoomWithChairs[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    available: 0,
    occupied: 0,
    cleaning: 0,
    blocked: 0,
    maintenance: 0,
    readyForDoctor: 0,
    doctorChecking: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch resource status
  const fetchResources = useCallback(async () => {
    try {
      const response = await fetch('/api/ops/resources/status');
      const result = await response.json();
      if (result.success) {
        setRooms(result.data.byRoom || []);
        setSummary(result.data.summary || {
          total: 0,
          available: 0,
          occupied: 0,
          cleaning: 0,
          blocked: 0,
          maintenance: 0,
          readyForDoctor: 0,
          doctorChecking: 0,
        });
      }
    } catch {
      toast.error('Failed to load floor plan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResources();
    // Poll every 30 seconds
    const interval = setInterval(fetchResources, 30000);
    return () => clearInterval(interval);
  }, [fetchResources]);

  // Calculate time remaining
  const getTimeRemaining = (expectedFreeAt: string | null | undefined): string | null => {
    if (!expectedFreeAt) return null;
    const remaining = Math.floor(
      (new Date(expectedFreeAt).getTime() - Date.now()) / 60000
    );
    if (remaining <= 0) return 'Overdue';
    return `${remaining}m left`;
  };

  // Calculate time in current sub-stage
  const getSubStageTime = (subStageStartedAt: string | null | undefined): string | null => {
    if (!subStageStartedAt) return null;
    const minutes = Math.floor(
      (Date.now() - new Date(subStageStartedAt).getTime()) / 60000
    );
    if (minutes < 1) return 'Just now';
    return `${minutes}m`;
  };

  // Calculate progress percentage for appointment
  const getProgressPercentage = (chair: ChairStatus): number => {
    if (!chair.appointment?.startTime || !chair.appointment?.endTime) return 0;
    const start = new Date(chair.appointment.startTime).getTime();
    const end = new Date(chair.appointment.endTime).getTime();
    const now = Date.now();
    const progress = ((now - start) / (end - start)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  // Format time for display
  const formatTime = (dateString: string | undefined): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Update sub-stage
  const updateSubStage = async (chair: ChairStatus, subStage: ChairActivitySubStage) => {
    try {
      const response = await fetch(`/api/ops/chairs/${chair.id}/sub-stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subStage }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success(`${chair.name} updated to ${SUB_STAGE_CONFIG[subStage].label}`);
        fetchResources();
        onRefresh?.();
      } else {
        toast.error(result.error?.message || 'Failed to update');
      }
    } catch {
      toast.error('Failed to update chair status');
    }
  };

  // Get chairs that are ready for doctor (for alert banner)
  const readyForDoctorChairs = rooms
    .flatMap((r) => r.chairs)
    .filter((c) => c.activitySubStage === 'READY_FOR_DOCTOR');

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        {/* Room skeletons */}
        {[1, 2].map((i) => (
          <Card key={i} variant="glass" className="w-full">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-48 w-[300px] rounded-2xl" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Armchair className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-lg font-medium">No rooms configured</p>
        <p className="text-sm">Add rooms and chairs in settings to see the floor plan</p>
      </div>
    );
  }

  const unavailable = summary.blocked + summary.maintenance;

  return (
    <div className="space-y-6">
      {/* Ready for Doctor Alert Banner - Sticky at top */}
      {summary.readyForDoctor > 0 && (
        <div className="sticky top-0 z-20">
          <div
            className={cn(
              'relative overflow-hidden rounded-2xl',
              'bg-gradient-to-r from-amber-500 to-amber-600',
              'text-white shadow-md',
              'px-6 py-4'
            )}
          >

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 rounded-full p-3">
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xl font-bold">
                    {summary.readyForDoctor} Chair{summary.readyForDoctor > 1 ? 's' : ''} Ready for Doctor
                  </p>
                  <p className="text-amber-100 text-sm">
                    {summary.readyForDoctor === 1 ? 'Patient is waiting' : 'Patients are waiting'} for doctor check
                  </p>
                </div>
              </div>

              {/* Quick jump buttons to ready chairs */}
              <div className="flex gap-2 flex-wrap">
                {readyForDoctorChairs.slice(0, 4).map((chair) => (
                  <Button
                    key={chair.id}
                    variant="secondary"
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    onClick={() => {
                      document.getElementById(`chair-${chair.id}`)?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                      });
                    }}
                  >
                    {chair.name}
                  </Button>
                ))}
                {readyForDoctorChairs.length > 4 && (
                  <span className="text-sm text-amber-100 self-center">
                    +{readyForDoctorChairs.length - 4} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Stats Summary */}
      <StatsRow>
        {/* Ready for Doctor - MOST PROMINENT when present */}
        {summary.readyForDoctor > 0 && (
          <StatCard accentColor="warning" className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3">
              <IconBox color="warning" size="lg">
                <Bell className="h-5 w-5" />
              </IconBox>
              <div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{summary.readyForDoctor}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Ready for Dr.</p>
              </div>
            </div>
          </StatCard>
        )}

        {/* Doctor Checking */}
        {summary.doctorChecking > 0 && (
          <StatCard accentColor="success">
            <div className="flex items-center gap-3">
              <IconBox color="success" size="lg">
                <Stethoscope className="h-5 w-5" />
              </IconBox>
              <div>
                <p className="text-2xl font-bold">{summary.doctorChecking}</p>
                <p className="text-xs text-muted-foreground">Dr. Checking</p>
              </div>
            </div>
          </StatCard>
        )}

        {/* Available */}
        <StatCard accentColor="accent">
          <div className="flex items-center gap-3">
            <IconBox color="accent">
              <CheckCircle2 className="h-5 w-5" />
            </IconBox>
            <div>
              <p className="text-2xl font-bold">{summary.available}</p>
              <p className="text-xs text-muted-foreground">Available</p>
            </div>
          </div>
        </StatCard>

        {/* In Chair */}
        <StatCard accentColor="primary">
          <div className="flex items-center gap-3">
            <IconBox color="primary">
              <User className="h-5 w-5" />
            </IconBox>
            <div>
              <p className="text-2xl font-bold">{summary.occupied}</p>
              <p className="text-xs text-muted-foreground">In Chair</p>
            </div>
          </div>
        </StatCard>

        {/* Cleaning & Unavailable combined */}
        {(summary.cleaning > 0 || unavailable > 0) && (
          <StatCard accentColor="secondary">
            <div className="flex items-center gap-4">
              {summary.cleaning > 0 && (
                <div className="text-center">
                  <p className="text-lg font-bold">{summary.cleaning}</p>
                  <p className="text-xs text-muted-foreground">Cleaning</p>
                </div>
              )}
              {unavailable > 0 && (
                <div className="text-center">
                  <p className="text-lg font-bold">{unavailable}</p>
                  <p className="text-xs text-muted-foreground">Unavailable</p>
                </div>
              )}
            </div>
          </StatCard>
        )}
      </StatsRow>

      {/* Room Lanes - Full Width Horizontal Strips */}
      <div className="space-y-6">
        {rooms.map((roomData) => (
          <Card key={roomData.room.id} variant="glass" className="w-full">
            <CardHeader className="pb-3 border-b border-border/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <IconBox color="primary" size="sm">
                    <Building2 className="h-4 w-4" />
                  </IconBox>
                  <CardTitle size="sm">{roomData.room.name}</CardTitle>
                </div>
                <Badge variant="outline" size="sm">
                  Room {roomData.room.roomNumber}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Horizontal flex container for chairs */}
              <div className="flex flex-wrap gap-4">
                {roomData.chairs.map((chair) => {
                  const isOccupied = chair.status === 'OCCUPIED';
                  const subStageConfig = isOccupied && chair.activitySubStage
                    ? SUB_STAGE_CONFIG[chair.activitySubStage]
                    : null;
                  const statusConfig = !isOccupied
                    ? STATUS_CONFIG[chair.status] || STATUS_CONFIG.AVAILABLE
                    : null;

                  const config = subStageConfig || statusConfig!;
                  const isReadyForDoctor = chair.activitySubStage === 'READY_FOR_DOCTOR';
                  const heroAction = getHeroAction(chair);
                  const timeRemaining = getTimeRemaining(chair.expectedFreeAt);
                  const isOverdue = timeRemaining === 'Overdue';
                  const subStageTime = getSubStageTime(chair.subStageStartedAt);
                  const progress = getProgressPercentage(chair);

                  return (
                    <div
                      id={`chair-${chair.id}`}
                      key={chair.id}
                      className={cn(
                        // Base sizing and styling
                        'relative w-[300px] min-h-[180px]',
                        'rounded-2xl border-2 overflow-hidden',
                        'transition-all duration-200 ease-out',
                        'hover:shadow-lift hover:-translate-y-0.5',
                        // Dynamic background and border
                        config.cardBg,
                        config.border,
                        // Ready for Doctor - subtle emphasis
                        isReadyForDoctor && [
                          'ring-2 ring-amber-400/40 ring-offset-1 ring-offset-background',
                          subStageConfig?.glow,
                        ]
                      )}
                    >
                      {/* Ready for Doctor indicator badge */}
                      {isReadyForDoctor && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <div className="bg-amber-500 rounded-full p-1.5 shadow-md">
                            <Bell className="h-3.5 w-3.5 text-white" />
                          </div>
                        </div>
                      )}

                      {/* Card Content */}
                      <div className="p-4 flex flex-col h-full">
                        {/* Header with Chair Name, Hero Action, and More Menu */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={cn('rounded-lg p-1.5', config.iconBg)}>
                              <config.icon className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-semibold text-sm">{chair.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {/* Hero Action Button - Always visible for occupied */}
                            {heroAction && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn('h-8 px-2', heroAction.colorClass)}
                                    onClick={() => updateSubStage(chair, heroAction.nextStage)}
                                  >
                                    <heroAction.icon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{heroAction.label}</TooltipContent>
                              </Tooltip>
                            )}

                            {/* More Menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {isOccupied && (
                                  <>
                                    <DropdownMenuItem onClick={() => updateSubStage(chair, 'SETUP')}>
                                      <Settings2 className="h-4 w-4 mr-2" />
                                      Setup
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateSubStage(chair, 'ASSISTANT_WORKING')}>
                                      <User className="h-4 w-4 mr-2" />
                                      Assistant Working
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateSubStage(chair, 'READY_FOR_DOCTOR')}>
                                      <Bell className="h-4 w-4 mr-2" />
                                      Ready for Doctor
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateSubStage(chair, 'DOCTOR_CHECKING')}>
                                      <Stethoscope className="h-4 w-4 mr-2" />
                                      Doctor Checking
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateSubStage(chair, 'FINISHING')}>
                                      <Sparkles className="h-4 w-4 mr-2" />
                                      Finishing
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>View Patient</DropdownMenuItem>
                                    <DropdownMenuItem>Complete Treatment</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                <DropdownMenuItem>Mark Available</DropdownMenuItem>
                                <DropdownMenuItem>Block Chair</DropdownMenuItem>
                                <DropdownMenuItem>Set Cleaning</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Sub-Stage Badge with Time */}
                        {isOccupied && subStageConfig && (
                          <div className="flex items-center gap-2 mb-3">
                            <Badge
                              variant={subStageConfig.badge}
                              size="sm"
                              className={cn(isReadyForDoctor && 'font-semibold')}
                            >
                              {subStageConfig.label}
                            </Badge>
                            {subStageTime && (
                              <span className="text-xs text-muted-foreground">{subStageTime}</span>
                            )}
                          </div>
                        )}

                        {/* Status Badge for non-occupied */}
                        {!isOccupied && statusConfig && (
                          <Badge variant={statusConfig.badge} size="sm" className="mb-3 w-fit">
                            {statusConfig.label}
                          </Badge>
                        )}

                        {/* Patient & Appointment Info */}
                        {isOccupied && chair.patient && (
                          <div className="space-y-1 flex-1">
                            <p className="text-sm font-medium truncate">
                              <PhiProtected fakeData={getFakeName()}>
                                {chair.patient.firstName} {chair.patient.lastName}
                              </PhiProtected>
                            </p>
                            {chair.appointment?.appointmentType && (
                              <p className="text-xs text-muted-foreground truncate">
                                {chair.appointment.appointmentType.name}
                              </p>
                            )}
                            {/* Staff & Provider */}
                            <p className="text-xs text-muted-foreground">
                              {chair.assignedStaff && (
                                <span>{chair.assignedStaff.firstName} {chair.assignedStaff.lastName[0]}.</span>
                              )}
                              {chair.assignedStaff && chair.appointment?.provider && ' • '}
                              {chair.appointment?.provider && (
                                <span>Dr. {chair.appointment.provider.lastName}</span>
                              )}
                            </p>
                          </div>
                        )}

                        {/* Available/Blocked State */}
                        {!isOccupied && (
                          <div className="flex-1">
                            {chair.status === 'AVAILABLE' && (
                              <p className="text-xs text-muted-foreground">Ready for patient</p>
                            )}
                            {chair.status === 'BLOCKED' && chair.blockReason && (
                              <p className="text-xs text-muted-foreground">{chair.blockReason}</p>
                            )}
                          </div>
                        )}

                        {/* Progress Bar for Occupied Chairs */}
                        {isOccupied && chair.appointment && (
                          <div className="mt-auto pt-3 space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                {formatTime(chair.appointment.startTime)}
                              </span>
                              {timeRemaining && (
                                <span className={cn(
                                  'font-medium flex items-center gap-1',
                                  isOverdue ? 'text-error-600' : 'text-muted-foreground'
                                )}>
                                  {isOverdue && <AlertTriangle className="h-3 w-3" />}
                                  <Clock className="h-3 w-3" />
                                  {timeRemaining}
                                </span>
                              )}
                              <span className="text-muted-foreground">
                                {formatTime(chair.appointment.endTime)}
                              </span>
                            </div>
                            <Progress
                              value={progress}
                              className={cn(
                                'h-1.5',
                                isReadyForDoctor && '[&>div]:bg-amber-500',
                                isOverdue && '[&>div]:bg-error-500'
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
