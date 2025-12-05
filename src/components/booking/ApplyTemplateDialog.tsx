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

        <div className="space-y-4 px-6 py-4">
          {/* Provider Selection (if clinic-wide templates) */}
          {providers.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-sm">Apply to</Label>
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
          <div className="space-y-1.5">
            <Label className="text-sm">Date Range</Label>
            <div className="grid grid-cols-4 gap-2">
              {RANGE_PRESETS.map((preset) => (
                <Button
                  key={preset.months}
                  variant="soft"
                  size="sm"
                  onClick={() => applyPreset(preset.months)}
                  className="h-8"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Date Range Pickers - Compact */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Start</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'w-full justify-start text-left font-normal h-9',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                    <span className="text-xs">
                      {startDate ? format(startDate, 'MMM d, yyyy') : 'Select'}
                    </span>
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

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">End</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'w-full justify-start text-left font-normal h-9',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                    <span className="text-xs">
                      {endDate ? format(endDate, 'MMM d, yyyy') : 'Select'}
                    </span>
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

          {/* Summary - More Prominent */}
          {startDate && endDate && affectedWeeks > 0 && (
            <Alert>
              <ChevronRight className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {format(startDate, 'MMM d')} – {format(endDate, 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {affectedWeeks} week{affectedWeeks !== 1 ? 's' : ''} will be updated
                    </p>
                  </div>
                  <Badge>{affectedWeeks}</Badge>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Override Option - Compact */}
          <div className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5">
            <Checkbox
              id="override"
              checked={overrideExisting}
              onCheckedChange={(checked) => setOverrideExisting(checked === true)}
            />
            <div className="flex-1">
              <Label htmlFor="override" className="text-sm font-normal cursor-pointer">
                Override existing zones
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Replace any existing zone assignments
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
