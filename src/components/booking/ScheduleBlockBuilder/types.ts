// Types for Schedule Block Builder

export interface ScheduleBlock {
  id: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // "08:00" (HH:mm)
  endTime: string; // "11:00" (HH:mm)
  appointmentTypeIds: string[];
  isBlocked: boolean;
  blockReason?: string | null;
  label?: string | null;
  color?: string | null;
}

export interface AppointmentType {
  id: string;
  code: string;
  name: string;
  color: string;
  defaultDuration: number;
  isActive: boolean;
}

export interface DragItem {
  type: 'appointment-type' | 'block' | 'blocked' | 'day-off';
  appointmentTypeId?: string;
  appointmentTypeIds?: string[];
  blockId?: string;
  color?: string;
  label?: string;
}

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
] as const;

// Grid configuration
export const GRID_CONFIG = {
  START_HOUR: 6, // 6 AM
  END_HOUR: 20, // 8 PM
  SLOT_HEIGHT: 24, // pixels per 30-min slot
  SNAP_MINUTES: 30, // snap to 30-min increments
  DAY_WIDTH: 120, // pixels per day column
} as const;

// Helper functions
export function timeToMinutes(time: string): number {
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function timeToY(time: string): number {
  const minutes = timeToMinutes(time);
  const startMinutes = GRID_CONFIG.START_HOUR * 60;
  return ((minutes - startMinutes) / 30) * GRID_CONFIG.SLOT_HEIGHT;
}

export function yToTime(y: number): string {
  const slotIndex = Math.round(y / GRID_CONFIG.SLOT_HEIGHT);
  const totalMinutes = GRID_CONFIG.START_HOUR * 60 + slotIndex * 30;
  return minutesToTime(totalMinutes);
}

export function formatTime(time: string): string {
  const [hours, mins] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function timesOverlap(
  block1: { startTime: string; endTime: string },
  block2: { startTime: string; endTime: string }
): boolean {
  const start1 = timeToMinutes(block1.startTime);
  const end1 = timeToMinutes(block1.endTime);
  const start2 = timeToMinutes(block2.startTime);
  const end2 = timeToMinutes(block2.endTime);

  return start1 < end2 && start2 < end1;
}

export function getBlockColor(
  block: ScheduleBlock,
  appointmentTypes: AppointmentType[]
): string {
  if (block.color) return block.color;
  if (block.isBlocked) return '#6B7280'; // Gray for blocked

  // Get color from first appointment type
  if (block.appointmentTypeIds.length > 0) {
    const type = appointmentTypes.find(
      (t) => t.id === block.appointmentTypeIds[0]
    );
    if (type) return type.color;
  }

  return '#3B82F6'; // Default blue
}

export function getBlockLabel(
  block: ScheduleBlock,
  appointmentTypes: AppointmentType[]
): string {
  if (block.label) return block.label;
  if (block.isBlocked) return block.blockReason || 'Blocked';

  // Get names of appointment types
  const typeNames = block.appointmentTypeIds
    .map((id) => appointmentTypes.find((t) => t.id === id)?.name)
    .filter(Boolean);

  if (typeNames.length === 0) return 'Open';
  if (typeNames.length === 1) return typeNames[0] as string;
  return `${typeNames[0]} +${typeNames.length - 1}`;
}
