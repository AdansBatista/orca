'use client';

import { useState, useEffect, useCallback } from 'react';
import { Armchair, Bell, Building2, CheckCircle2, Stethoscope, User } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, StatCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { IconBox } from '@/components/ui/icon-box';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { StatsRow } from '@/components/layout';
import {
  ChairCard,
  SUB_STAGE_CONFIG,
  type ChairStatus,
  type ChairActivitySubStage,
} from '@/components/orchestration';

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

  // Update sub-stage - callback for ChairCard
  const handleSubStageUpdate = useCallback(async (chair: ChairStatus, subStage: ChairActivitySubStage) => {
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
  }, [fetchResources, onRefresh]);

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
                {roomData.chairs.map((chair) => (
                  <ChairCard
                    key={chair.id}
                    chair={chair}
                    onSubStageUpdate={handleSubStageUpdate}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
