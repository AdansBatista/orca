'use client';

import { useState, useCallback, useMemo } from 'react';
import { format, addMonths, startOfWeek, endOfWeek, eachWeekOfInterval } from 'date-fns';
import { CalendarRange, CalendarDays, ChevronRight, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Provider {
  id: string;
  firstName: string;
  lastName: string;
}

interface ApplyTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  templateName: string;
  providers?: Provider[];
  onApply: (data: {
    templateId: string;
    providerId?: string;
    startDate: Date;
    endDate: Date;
    overrideExisting: boolean;
  }) => Promise<void>;
}

// Preset ranges
const RANGE_PRESETS = [
  { label: '1 Month', months: 1 },
  { label: '3 Months', months: 3 },
  { label: '6 Months', months: 6 },
  { label: '1 Year', months: 12 },
];

export function ApplyTemplateDialog({
  open,
  onOpenChange,
  templateId,
  templateName,
  providers = [],
  onApply,
}: ApplyTemplateDialogProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [providerId, setProviderId] = useState<string>('_clinic');
  const [overrideExisting, setOverrideExisting] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate weeks that will be affected
  const affectedWeeks = useMemo(() => {
    if (!startDate || !endDate) return 0;
    try {
      const weeks = eachWeekOfInterval(
        { start: startDate, end: endDate },
        { weekStartsOn: 1 }
      );
      return weeks.length;
    } catch {
      return 0;
    }
  }, [startDate, endDate]);

  // Apply a preset range
  const applyPreset = useCallback((months: number) => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = endOfWeek(addMonths(today, months), { weekStartsOn: 1 });
    setStartDate(start);
    setEndDate(end);
  }, []);

  // Reset form when dialog opens
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (isOpen) {
      setStartDate(undefined);
      setEndDate(undefined);
      setProviderId('_clinic');
      setOverrideExisting(false);
      setError(null);
    }
    onOpenChange(isOpen);
  }, [onOpenChange]);

  // Handle apply
  const handleApply = async () => {
    if (!startDate || !endDate) {
      setError('Please select a date range');
      return;
    }

    if (endDate < startDate) {
      setError('End date must be after start date');
      return;
    }

    setApplying(true);
    setError(null);

    try {
      await onApply({
        templateId,
        providerId: providerId === '_clinic' ? undefined : providerId,
        startDate,
        endDate,
        overrideExisting,
      });
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply template');
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-primary" />
            Apply Template to Calendar
          </DialogTitle>
          <DialogDescription>
            Apply &quot;{templateName}&quot; to future dates. This will create booking
            zone guides for the selected period.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Provider Selection (if clinic-wide templates) */}
          {providers.length > 0 && (
            <div className="space-y-2">
              <Label>Apply to</Label>
              <Select value={providerId} onValueChange={setProviderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_clinic">Clinic-wide (all providers)</SelectItem>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.firstName} {provider.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quick Range Presets */}
          <div className="space-y-2">
            <Label>Quick Range</Label>
            <div className="flex flex-wrap gap-2">
              {RANGE_PRESETS.map((preset) => (
                <Button
                  key={preset.months}
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset.months)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Date Range Pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'MMM d, yyyy') : 'Select start'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date: Date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'MMM d, yyyy') : 'Select end'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date: Date) =>
                      date < new Date() || (startDate ? date < startDate : false)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Summary */}
          {startDate && endDate && affectedWeeks > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {format(startDate, 'MMM d, yyyy')} → {format(endDate, 'MMM d, yyyy')}
                </p>
                <p className="text-xs text-muted-foreground">
                  Template will be applied to {affectedWeeks} week{affectedWeeks !== 1 ? 's' : ''}
                </p>
              </div>
              <Badge variant="outline">{affectedWeeks} weeks</Badge>
            </div>
          )}

          {/* Override Option */}
          <div className="flex items-start gap-3 p-3 rounded-lg border">
            <Checkbox
              id="override"
              checked={overrideExisting}
              onCheckedChange={(checked) => setOverrideExisting(checked === true)}
            />
            <div className="space-y-1">
              <Label htmlFor="override" className="font-medium cursor-pointer">
                Override existing zone assignments
              </Label>
              <p className="text-xs text-muted-foreground">
                If checked, any existing booking zones for the selected dates will be replaced.
                Otherwise, only days without zone assignments will be updated.
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={applying || !startDate || !endDate}
          >
            {applying ? 'Applying...' : 'Apply Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
