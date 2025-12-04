'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, RotateCcw, Clock, Coffee, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FormField } from '@/components/ui/form-field';

interface Provider {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
}

interface DaySchedule {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
  lunchStartTime: string | null;
  lunchEndTime: string | null;
  autoBlockLunch: boolean;
  breaks?: Array<{ startTime: string; endTime: string; label?: string }>;
}

interface ProviderScheduleData {
  provider: Provider;
  schedules: DaySchedule[];
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

const DEFAULT_SCHEDULE: DaySchedule = {
  dayOfWeek: 0,
  startTime: '08:00',
  endTime: '17:00',
  isWorkingDay: false,
  lunchStartTime: '12:00',
  lunchEndTime: '13:00',
  autoBlockLunch: true,
};

function getDefaultSchedule(dayOfWeek: number): DaySchedule {
  // Weekend defaults to non-working
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  return {
    ...DEFAULT_SCHEDULE,
    dayOfWeek,
    isWorkingDay: !isWeekend,
  };
}

export function ProviderScheduleManager() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [scheduleData, setScheduleData] = useState<ProviderScheduleData | null>(null);
  const [editedSchedules, setEditedSchedules] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch providers on mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch('/api/staff?isProvider=true&status=ACTIVE&pageSize=50');
        const result = await response.json();
        if (result.success) {
          setProviders(result.data.items || []);
          // Auto-select first provider
          if (result.data.items?.length > 0) {
            setSelectedProviderId(result.data.items[0].id);
          }
        }
      } catch {
        toast.error('Failed to load providers');
      } finally {
        setLoading(false);
      }
    };
    fetchProviders();
  }, []);

  // Fetch schedule when provider changes
  useEffect(() => {
    if (!selectedProviderId) return;

    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/booking/provider-schedules/${selectedProviderId}`);
        const result = await response.json();

        if (result.success) {
          setScheduleData(result.data);
          // Initialize edited schedules with fetched data
          setEditedSchedules(result.data.schedules || []);
          setHasChanges(false);
        } else {
          toast.error(result.error?.message || 'Failed to load schedule');
        }
      } catch {
        toast.error('Failed to load schedule');
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [selectedProviderId]);

  // Get schedule for a specific day (from edited schedules or default)
  const getScheduleForDay = useCallback((dayOfWeek: number): DaySchedule => {
    const existing = editedSchedules.find(s => s.dayOfWeek === dayOfWeek);
    return existing || getDefaultSchedule(dayOfWeek);
  }, [editedSchedules]);

  // Update a day's schedule
  const updateDaySchedule = useCallback((dayOfWeek: number, updates: Partial<DaySchedule>) => {
    setEditedSchedules(prev => {
      const existing = prev.find(s => s.dayOfWeek === dayOfWeek);
      if (existing) {
        return prev.map(s =>
          s.dayOfWeek === dayOfWeek ? { ...s, ...updates } : s
        );
      } else {
        return [...prev, { ...getDefaultSchedule(dayOfWeek), ...updates }];
      }
    });
    setHasChanges(true);
  }, []);

  // Copy schedule to other days
  const copyToWeekdays = useCallback((sourceDayOfWeek: number) => {
    const source = getScheduleForDay(sourceDayOfWeek);
    const weekdays = [1, 2, 3, 4, 5]; // Mon-Fri

    setEditedSchedules(prev => {
      const updated = [...prev];
      weekdays.forEach(day => {
        if (day !== sourceDayOfWeek) {
          const existingIndex = updated.findIndex(s => s.dayOfWeek === day);
          const newSchedule = { ...source, dayOfWeek: day, id: undefined };
          if (existingIndex >= 0) {
            updated[existingIndex] = newSchedule;
          } else {
            updated.push(newSchedule);
          }
        }
      });
      return updated;
    });
    setHasChanges(true);
    toast.success('Copied to weekdays');
  }, [getScheduleForDay]);

  // Save schedules
  const handleSave = async () => {
    if (!selectedProviderId) return;

    setSaving(true);
    try {
      // Build schedules array for API
      const schedulesToSave = DAYS_OF_WEEK.map(day => {
        const schedule = getScheduleForDay(day.value);
        return {
          dayOfWeek: day.value,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          isWorkingDay: schedule.isWorkingDay,
          lunchStartTime: schedule.lunchStartTime,
          lunchEndTime: schedule.lunchEndTime,
          autoBlockLunch: schedule.autoBlockLunch,
          breaks: schedule.breaks,
        };
      });

      const response = await fetch('/api/booking/provider-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: selectedProviderId,
          schedules: schedulesToSave,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Schedule saved successfully');
        setHasChanges(false);
        // Refresh data
        setEditedSchedules(result.data.schedules || []);
      } else {
        toast.error(result.error?.message || 'Failed to save schedule');
      }
    } catch {
      toast.error('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  // Reset to original
  const handleReset = () => {
    if (scheduleData) {
      setEditedSchedules(scheduleData.schedules || []);
      setHasChanges(false);
      toast.info('Changes discarded');
    }
  };

  if (loading && providers.length === 0) {
    return null; // Let Suspense handle initial loading
  }

  return (
    <div className="space-y-6">
      {/* Header with provider selector and actions */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Provider Working Hours</h2>
          <p className="text-sm text-muted-foreground">
            Configure working hours, breaks, and lunch times for each provider
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={selectedProviderId}
            onValueChange={setSelectedProviderId}
            disabled={loading}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select a provider" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.firstName} {provider.lastName}
                  {provider.title && ` - ${provider.title}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasChanges && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={saving}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Week schedule grid */}
      {selectedProviderId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          {DAYS_OF_WEEK.map((day) => {
            const schedule = getScheduleForDay(day.value);
            const isWeekend = day.value === 0 || day.value === 6;

            return (
              <Card
                key={day.value}
                variant={schedule.isWorkingDay ? 'default' : 'ghost'}
                className={!schedule.isWorkingDay ? 'opacity-60' : ''}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      {isWeekend ? (
                        <Moon className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Sun className="h-4 w-4 text-primary" />
                      )}
                      {day.label}
                    </CardTitle>
                    <Badge
                      variant={schedule.isWorkingDay ? 'success' : 'secondary'}
                      className="text-xs"
                    >
                      {schedule.isWorkingDay ? 'Working' : 'Off'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Working day toggle */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`working-${day.value}`} className="text-xs">
                      Working Day
                    </Label>
                    <Switch
                      id={`working-${day.value}`}
                      checked={schedule.isWorkingDay}
                      onCheckedChange={(checked) =>
                        updateDaySchedule(day.value, { isWorkingDay: checked })
                      }
                    />
                  </div>

                  {schedule.isWorkingDay && (
                    <>
                      <Separator />

                      {/* Working hours */}
                      <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Hours
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={schedule.startTime}
                            onChange={(e) =>
                              updateDaySchedule(day.value, { startTime: e.target.value })
                            }
                            className="text-xs h-8"
                          />
                          <span className="text-xs text-muted-foreground">to</span>
                          <Input
                            type="time"
                            value={schedule.endTime}
                            onChange={(e) =>
                              updateDaySchedule(day.value, { endTime: e.target.value })
                            }
                            className="text-xs h-8"
                          />
                        </div>
                      </div>

                      {/* Lunch break */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs flex items-center gap-1">
                            <Coffee className="h-3 w-3" />
                            Lunch
                          </Label>
                          <Switch
                            checked={schedule.autoBlockLunch}
                            onCheckedChange={(checked) =>
                              updateDaySchedule(day.value, { autoBlockLunch: checked })
                            }
                          />
                        </div>
                        {schedule.autoBlockLunch && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={schedule.lunchStartTime || '12:00'}
                              onChange={(e) =>
                                updateDaySchedule(day.value, { lunchStartTime: e.target.value })
                              }
                              className="text-xs h-8"
                            />
                            <span className="text-xs text-muted-foreground">to</span>
                            <Input
                              type="time"
                              value={schedule.lunchEndTime || '13:00'}
                              onChange={(e) =>
                                updateDaySchedule(day.value, { lunchEndTime: e.target.value })
                              }
                              className="text-xs h-8"
                            />
                          </div>
                        )}
                      </div>

                      {/* Copy to weekdays button */}
                      {!isWeekend && day.value === 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => copyToWeekdays(day.value)}
                        >
                          Copy to all weekdays
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary card */}
      {selectedProviderId && (
        <Card variant="ghost">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-muted-foreground">Working Days: </span>
                  <span className="font-medium">
                    {editedSchedules.filter(s => s.isWorkingDay).length} / 7
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Hours: </span>
                  <span className="font-medium">
                    {calculateTotalHours(editedSchedules)} hrs/week
                  </span>
                </div>
              </div>
              {hasChanges && (
                <Badge variant="warning">Unsaved changes</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper to calculate total weekly hours
function calculateTotalHours(schedules: DaySchedule[]): number {
  let total = 0;
  schedules.forEach(schedule => {
    if (schedule.isWorkingDay) {
      const start = parseTime(schedule.startTime);
      const end = parseTime(schedule.endTime);
      let hours = end - start;

      // Subtract lunch if applicable
      if (schedule.autoBlockLunch && schedule.lunchStartTime && schedule.lunchEndTime) {
        const lunchStart = parseTime(schedule.lunchStartTime);
        const lunchEnd = parseTime(schedule.lunchEndTime);
        hours -= (lunchEnd - lunchStart);
      }

      total += hours;
    }
  });
  return Math.round(total * 10) / 10;
}

function parseTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours + minutes / 60;
}
