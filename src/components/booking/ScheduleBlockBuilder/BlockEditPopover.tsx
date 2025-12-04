'use client';

import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { ScheduleBlock, AppointmentType } from './types';
import { formatTime } from './types';

interface BlockEditPopoverProps {
  block: ScheduleBlock;
  appointmentTypes: AppointmentType[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updates: Partial<ScheduleBlock>) => void;
  onDelete: () => void;
  children: React.ReactNode;
}

// Generate time options in 30-min increments
function generateTimeOptions() {
  const options: string[] = [];
  for (let hour = 6; hour < 21; hour++) {
    options.push(`${hour.toString().padStart(2, '0')}:00`);
    options.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

export function BlockEditPopover({
  block,
  appointmentTypes,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  children,
}: BlockEditPopoverProps) {
  const [localBlock, setLocalBlock] = useState<ScheduleBlock>(block);

  // Sync local state when block changes
  useEffect(() => {
    setLocalBlock(block);
  }, [block]);

  const handleTypeToggle = (typeId: string, checked: boolean) => {
    const newTypeIds = checked
      ? [...localBlock.appointmentTypeIds, typeId]
      : localBlock.appointmentTypeIds.filter((id) => id !== typeId);

    setLocalBlock({ ...localBlock, appointmentTypeIds: newTypeIds });
  };

  const handleApply = () => {
    onUpdate(localBlock);
    onOpenChange(false);
  };

  const activeTypes = appointmentTypes.filter((t) => t.isActive);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="font-medium">Edit Block</div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Start Time</Label>
              <Select
                value={localBlock.startTime}
                onValueChange={(v) =>
                  setLocalBlock({ ...localBlock, startTime: v })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue>{formatTime(localBlock.startTime)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.filter((t) => t < localBlock.endTime).map(
                    (time) => (
                      <SelectItem key={time} value={time}>
                        {formatTime(time)}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">End Time</Label>
              <Select
                value={localBlock.endTime}
                onValueChange={(v) =>
                  setLocalBlock({ ...localBlock, endTime: v })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue>{formatTime(localBlock.endTime)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.filter((t) => t > localBlock.startTime).map(
                    (time) => (
                      <SelectItem key={time} value={time}>
                        {formatTime(time)}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Block Type Toggle */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="isBlocked"
              checked={localBlock.isBlocked}
              onCheckedChange={(checked) =>
                setLocalBlock({
                  ...localBlock,
                  isBlocked: checked === true,
                  appointmentTypeIds: checked ? [] : localBlock.appointmentTypeIds,
                })
              }
            />
            <Label htmlFor="isBlocked" className="text-sm">
              Mark as blocked time
            </Label>
          </div>

          {/* Blocked Reason */}
          {localBlock.isBlocked && (
            <div className="space-y-1.5">
              <Label className="text-xs">Block Reason</Label>
              <Input
                placeholder="e.g., Lunch, Meeting, Day Off"
                value={localBlock.blockReason || ''}
                onChange={(e) =>
                  setLocalBlock({ ...localBlock, blockReason: e.target.value })
                }
                className="h-8 text-sm"
              />
            </div>
          )}

          {/* Appointment Types */}
          {!localBlock.isBlocked && (
            <div className="space-y-2">
              <Label className="text-xs">Appointment Types</Label>
              <div className="max-h-40 overflow-y-auto space-y-1 border rounded-md p-2">
                {activeTypes.map((type) => (
                  <div key={type.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`type-${type.id}`}
                      checked={localBlock.appointmentTypeIds.includes(type.id)}
                      onCheckedChange={(checked) =>
                        handleTypeToggle(type.id, checked === true)
                      }
                    />
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: type.color }}
                    />
                    <Label
                      htmlFor={`type-${type.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {type.name}
                    </Label>
                  </div>
                ))}
              </div>
              {localBlock.appointmentTypeIds.length === 0 && (
                <p className="text-xs text-destructive">
                  Select at least one appointment type
                </p>
              )}
            </div>
          )}

          {/* Custom Label */}
          <div className="space-y-1.5">
            <Label className="text-xs">Custom Label (optional)</Label>
            <Input
              placeholder="Override default label"
              value={localBlock.label || ''}
              onChange={(e) =>
                setLocalBlock({
                  ...localBlock,
                  label: e.target.value || null,
                })
              }
              className="h-8 text-sm"
            />
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onDelete();
                onOpenChange(false);
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                disabled={
                  !localBlock.isBlocked &&
                  localBlock.appointmentTypeIds.length === 0
                }
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
