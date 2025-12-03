'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format, differenceInSeconds } from 'date-fns';
import {
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Pause,
  Play,
  ThermometerSun,
  Gauge,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ActiveCycle {
  id: string;
  cycleNumber: string;
  cycleType: string;
  status: string;
  startTime: string;
  expectedDuration: number; // in minutes
  autoclave: {
    id: string;
    name: string;
    equipmentNumber: string;
  };
  parameters: {
    temperature?: number;
    temperatureUnit?: string;
    pressure?: number;
  };
  packagesCount: number;
}

interface CycleTimerProps {
  cycleId?: string;
  compact?: boolean;
  onComplete?: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function CycleTimer({ cycleId, compact = false, onComplete }: CycleTimerProps) {
  const [cycles, setCycles] = useState<ActiveCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  const fetchCycles = useCallback(async () => {
    try {
      const url = cycleId
        ? `/api/resources/sterilization/cycles/${cycleId}`
        : '/api/resources/sterilization/cycles?status=IN_PROGRESS';

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        if (cycleId) {
          setCycles([result.data]);
        } else {
          setCycles(result.data.items || []);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cycles');
    } finally {
      setLoading(false);
    }
  }, [cycleId]);

  useEffect(() => {
    fetchCycles();
    // Refresh every 30 seconds
    const refreshInterval = setInterval(fetchCycles, 30000);
    return () => clearInterval(refreshInterval);
  }, [fetchCycles]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getProgress = (cycle: ActiveCycle) => {
    const elapsed = differenceInSeconds(now, new Date(cycle.startTime));
    const total = cycle.expectedDuration * 60;
    return Math.min((elapsed / total) * 100, 100);
  };

  const getElapsed = (cycle: ActiveCycle) => {
    return differenceInSeconds(now, new Date(cycle.startTime));
  };

  const getRemaining = (cycle: ActiveCycle) => {
    const elapsed = getElapsed(cycle);
    const total = cycle.expectedDuration * 60;
    return Math.max(total - elapsed, 0);
  };

  if (loading) {
    return (
      <Card className={compact ? 'bg-muted/30' : ''}>
        <CardContent className={compact ? 'p-3' : 'p-6'}>
          <div className="flex items-center gap-3 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (cycles.length === 0) {
    if (compact) {
      return (
        <Card className="bg-muted/30">
          <CardContent className="p-3">
            <p className="text-sm text-muted-foreground text-center">No active cycles</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No sterilization cycles in progress</p>
          <Link href="/resources/sterilization/new">
            <Button variant="outline" className="mt-4">
              Start New Cycle
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Compact view for dashboard widgets
  if (compact) {
    return (
      <div className="space-y-2">
        {cycles.map((cycle) => {
          const progress = getProgress(cycle);
          const remaining = getRemaining(cycle);
          const isComplete = progress >= 100;

          return (
            <Link key={cycle.id} href={`/resources/sterilization/${cycle.id}`}>
              <Card className="bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isComplete ? 'bg-success-500' : 'bg-primary-500 animate-pulse'}`} />
                      <span className="font-medium text-sm">{cycle.cycleNumber}</span>
                    </div>
                    <Badge variant={isComplete ? 'success' : 'soft-primary'} className="text-xs">
                      {isComplete ? 'Complete' : formatDuration(remaining)}
                    </Badge>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{cycle.autoclave.name}</span>
                    <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    );
  }

  // Full view
  return (
    <div className="space-y-4">
      {cycles.map((cycle) => {
        const progress = getProgress(cycle);
        const elapsed = getElapsed(cycle);
        const remaining = getRemaining(cycle);
        const isComplete = progress >= 100;

        return (
          <Card key={cycle.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle size="sm" className="flex items-center gap-2">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                    isComplete
                      ? 'bg-success-100 dark:bg-success-900/30'
                      : 'bg-primary-100 dark:bg-primary-900/30'
                  }`}>
                    <Activity className={`h-4 w-4 ${
                      isComplete ? 'text-success-600' : 'text-primary-600 animate-pulse'
                    }`} />
                  </div>
                  {cycle.cycleNumber}
                </CardTitle>
                <Badge variant={isComplete ? 'success' : 'soft-primary'}>
                  {isComplete ? 'Ready to Complete' : cycle.status.replace(/_/g, ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Timer Display */}
              <div className="text-center py-4">
                <div className="flex items-center justify-center gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Elapsed</p>
                    <p className="text-2xl font-mono font-bold">{formatDuration(elapsed)}</p>
                  </div>
                  <div className="w-px h-12 bg-border" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Remaining</p>
                    <p className={`text-2xl font-mono font-bold ${isComplete ? 'text-success-600' : ''}`}>
                      {isComplete ? 'Done' : formatDuration(remaining)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <Progress value={progress} className="h-3" />
                <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                  <span>0:00</span>
                  <span>{Math.round(progress)}%</span>
                  <span>{cycle.expectedDuration} min</span>
                </div>
              </div>

              {/* Cycle Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-xs text-muted-foreground">Equipment</p>
                  <p className="font-medium text-sm">{cycle.autoclave.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cycle Type</p>
                  <p className="font-medium text-sm">{cycle.cycleType.replace(/_/g, ' ')}</p>
                </div>
                {cycle.parameters.temperature && (
                  <div className="flex items-center gap-2">
                    <ThermometerSun className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Temperature</p>
                      <p className="font-medium text-sm">
                        {cycle.parameters.temperature}°{cycle.parameters.temperatureUnit || 'F'}
                      </p>
                    </div>
                  </div>
                )}
                {cycle.parameters.pressure && (
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Pressure</p>
                      <p className="font-medium text-sm">{cycle.parameters.pressure} PSI</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Package Count */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm">Packages in this cycle</span>
                <Badge variant="secondary">{cycle.packagesCount}</Badge>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-2">
                <Link href={`/resources/sterilization/${cycle.id}`}>
                  <Button variant="outline" size="sm">
                    View Details
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
                {isComplete && (
                  <Link href={`/resources/sterilization/${cycle.id}/complete`}>
                    <Button size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Cycle
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Inline compact timer for use in other components
export function CycleTimerInline({ cycle }: { cycle: ActiveCycle }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsed = differenceInSeconds(now, new Date(cycle.startTime));
  const total = cycle.expectedDuration * 60;
  const remaining = Math.max(total - elapsed, 0);
  const progress = Math.min((elapsed / total) * 100, 100);
  const isComplete = progress >= 100;

  return (
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${isComplete ? 'bg-success-500' : 'bg-primary-500 animate-pulse'}`} />
      <div className="flex-1">
        <Progress value={progress} className="h-1.5" />
      </div>
      <span className={`text-sm font-mono ${isComplete ? 'text-success-600' : ''}`}>
        {isComplete ? 'Done' : formatDuration(remaining)}
      </span>
    </div>
  );
}
