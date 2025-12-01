'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calculator, Clock, User, AlertTriangle, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
import { Switch } from '@/components/ui/switch';
import { StatCard } from '@/components/ui/stat-card';
import { StatsRow } from '@/components/layout';
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName } from '@/lib/fake-data';
import { toast } from '@/components/ui/use-toast';

interface WeeklyOvertimeCalculation {
  staffProfileId: string;
  staffName: string;
  weekStartDate: string;
  weekEndDate: string;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  existingLogId: string | null;
  existingLogStatus: string | null;
}

interface OvertimeSummary {
  totalStaff: number;
  totalWeeks: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  staffWithOvertime: number;
  newLogsCreated: number;
}

interface OvertimeCalculatorProps {
  onCalculate: (params: {
    startDate: string;
    endDate: string;
    regularHoursThreshold: number;
    createLogs: boolean;
  }) => Promise<{
    calculations: WeeklyOvertimeCalculation[];
    summary: OvertimeSummary;
  } | null>;
}

export function OvertimeCalculator({ onCalculate }: OvertimeCalculatorProps) {
  const today = new Date();
  const [startDate, setStartDate] = useState(format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(today, 'yyyy-MM-dd'));
  const [regularHoursThreshold, setRegularHoursThreshold] = useState(40);
  const [createLogs, setCreateLogs] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculations, setCalculations] = useState<WeeklyOvertimeCalculation[]>([]);
  const [summary, setSummary] = useState<OvertimeSummary | null>(null);

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      const result = await onCalculate({
        startDate,
        endDate,
        regularHoursThreshold,
        createLogs,
      });

      if (result) {
        setCalculations(result.calculations);
        setSummary(result.summary);

        if (createLogs && result.summary.newLogsCreated > 0) {
          toast({
            title: 'Overtime Logs Created',
            description: `Created ${result.summary.newLogsCreated} new overtime log(s)`,
          });
        }
      }
    } finally {
      setIsCalculating(false);
    }
  };

  const statusConfig = {
    PENDING: { label: 'Pending', variant: 'warning' as const },
    APPROVED: { label: 'Approved', variant: 'success' as const },
    REJECTED: { label: 'Rejected', variant: 'destructive' as const },
    PAID: { label: 'Paid', variant: 'info' as const },
  };

  return (
    <div className="space-y-6">
      {/* Calculator Controls */}
      <Card>
        <CardHeader compact>
          <CardTitle size="sm" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Overtime Calculator
          </CardTitle>
        </CardHeader>
        <CardContent compact>
          <div className="flex items-end gap-4 flex-wrap">
            <FormField label="Start Date">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </FormField>
            <FormField label="End Date">
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </FormField>
            <FormField label="Regular Hours/Week">
              <Input
                type="number"
                min={0}
                max={60}
                value={regularHoursThreshold}
                onChange={(e) => setRegularHoursThreshold(parseInt(e.target.value) || 40)}
                className="w-24"
              />
            </FormField>
            <div className="flex items-center gap-2 pb-2">
              <Switch
                checked={createLogs}
                onCheckedChange={setCreateLogs}
                id="create-logs"
              />
              <label htmlFor="create-logs" className="text-sm cursor-pointer">
                Create pending logs
              </label>
            </div>
            <Button onClick={handleCalculate} disabled={isCalculating}>
              <Calculator className={`h-4 w-4 mr-2 ${isCalculating ? 'animate-spin' : ''}`} />
              {isCalculating ? 'Calculating...' : 'Calculate'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {summary && (
        <StatsRow>
          <StatCard accentColor="primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Staff Analyzed</p>
                <p className="text-lg font-bold">{summary.totalStaff}</p>
              </div>
              <User className="h-5 w-5 text-primary-500" />
            </div>
          </StatCard>
          <StatCard accentColor="accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Regular Hours</p>
                <p className="text-lg font-bold">{summary.totalRegularHours.toFixed(1)}</p>
              </div>
              <Clock className="h-5 w-5 text-accent-500" />
            </div>
          </StatCard>
          <StatCard accentColor={summary.totalOvertimeHours > 0 ? 'warning' : 'success'}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Overtime Hours</p>
                <p className="text-lg font-bold">{summary.totalOvertimeHours.toFixed(1)}</p>
              </div>
              <AlertTriangle className={`h-5 w-5 ${summary.totalOvertimeHours > 0 ? 'text-warning-500' : 'text-success-500'}`} />
            </div>
          </StatCard>
          <StatCard accentColor={summary.staffWithOvertime > 0 ? 'warning' : 'success'}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Staff with Overtime</p>
                <p className="text-lg font-bold">{summary.staffWithOvertime}</p>
              </div>
              <User className={`h-5 w-5 ${summary.staffWithOvertime > 0 ? 'text-warning-500' : 'text-success-500'}`} />
            </div>
          </StatCard>
        </StatsRow>
      )}

      {/* Results */}
      {calculations.length > 0 && (
        <Card>
          <CardHeader compact>
            <CardTitle size="sm">Overtime Breakdown</CardTitle>
          </CardHeader>
          <CardContent compact>
            <div className="space-y-3">
              {calculations.map((calc, idx) => (
                <div
                  key={`${calc.staffProfileId}-${calc.weekStartDate}-${idx}`}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    calc.overtimeHours > 0 ? 'bg-warning/10' : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      calc.overtimeHours > 0 ? 'bg-warning/20 text-warning' : 'bg-muted text-muted-foreground'
                    }`}>
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        <PhiProtected fakeData={getFakeName()}>
                          {calc.staffName}
                        </PhiProtected>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Week of {format(new Date(calc.weekStartDate), 'MMM d')} - {format(new Date(calc.weekEndDate), 'MMM d')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-3 text-sm">
                        <span>
                          <span className="text-muted-foreground">Reg:</span>{' '}
                          <span className="font-medium">{calc.regularHours.toFixed(1)}h</span>
                        </span>
                        <span>
                          <span className="text-muted-foreground">OT:</span>{' '}
                          <span className={`font-medium ${calc.overtimeHours > 0 ? 'text-warning' : ''}`}>
                            {calc.overtimeHours.toFixed(1)}h
                          </span>
                        </span>
                      </div>
                    </div>
                    {calc.existingLogId && calc.existingLogStatus && (
                      <Badge variant={statusConfig[calc.existingLogStatus as keyof typeof statusConfig]?.variant || 'outline'}>
                        {statusConfig[calc.existingLogStatus as keyof typeof statusConfig]?.label || calc.existingLogStatus}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isCalculating && calculations.length === 0 && (
        <Card variant="ghost">
          <CardContent className="py-12 text-center">
            <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No calculations yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Select a date range and click Calculate to analyze overtime
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
