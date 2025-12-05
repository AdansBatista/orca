/**
 * Practice Orchestration fixture data for seeding
 *
 * This provides sample data for:
 * - Patient flow states
 * - Resource occupancy
 * - Staff assignments
 * - Operations tasks
 * - Daily metrics
 * - Floor plan configuration
 */

import type {
  FlowStage,
  FlowPriority,
  OccupancyStatus,
  OpsTaskType,
  OpsTaskStatus,
  OpsTaskPriority,
} from '@prisma/client';

// =============================================================================
// FLOOR PLAN CONFIGURATION
// =============================================================================

export interface FloorPlanRoom {
  roomId: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  chairs?: Array<{
    chairId: string;
    name: string;
    x: number;
    y: number;
    rotation?: number;
  }>;
}

export interface FloorPlanConfig {
  gridColumns: number;
  gridRows: number;
  cellSize: number; // pixels per grid cell
  rooms: FloorPlanRoom[];
}

/**
 * Default floor plan layout for a typical orthodontic clinic
 * Uses a 20x12 grid layout
 */
export function getDefaultFloorPlan(
  rooms: Array<{ id: string; name: string }>,
  chairs: Array<{ id: string; name: string; roomId: string }>
): FloorPlanConfig {
  return {
    gridColumns: 20,
    gridRows: 12,
    cellSize: 40,
    rooms: rooms.slice(0, 6).map((room, index) => {
      // Layout rooms in a 3x2 grid pattern
      const col = index % 3;
      const row = Math.floor(index / 3);

      const roomChairs = chairs
        .filter((c) => c.roomId === room.id)
        .slice(0, 2)
        .map((chair, chairIndex) => ({
          chairId: chair.id,
          name: chair.name,
          x: chairIndex * 3 + 1,
          y: 2,
          rotation: 0,
        }));

      return {
        roomId: room.id,
        name: room.name,
        x: col * 6 + 1,
        y: row * 6 + 1,
        width: 5,
        height: 5,
        rotation: 0,
        chairs: roomChairs,
      };
    }),
  };
}

// =============================================================================
// PATIENT FLOW STATE GENERATORS
// =============================================================================

/**
 * Generate sample patient flow states for today's appointments
 */
export function generatePatientFlowStates(
  clinicId: string,
  appointments: Array<{
    id: string;
    patientId: string;
    providerId: string;
    chairId?: string | null;
    startTime: Date;
    status: string;
  }>,
  chairs: Array<{ id: string }>
): Array<{
  clinicId: string;
  appointmentId: string;
  patientId: string;
  stage: FlowStage;
  chairId?: string;
  providerId: string;
  scheduledAt: Date;
  checkedInAt?: Date;
  calledAt?: Date;
  seatedAt?: Date;
  completedAt?: Date;
  checkedOutAt?: Date;
  departedAt?: Date;
  currentWaitStartedAt?: Date;
  priority: FlowPriority;
  notes?: string;
}> {
  const now = new Date();
  const flowStates: Array<{
    clinicId: string;
    appointmentId: string;
    patientId: string;
    stage: FlowStage;
    chairId?: string;
    providerId: string;
    scheduledAt: Date;
    checkedInAt?: Date;
    calledAt?: Date;
    seatedAt?: Date;
    completedAt?: Date;
    checkedOutAt?: Date;
    departedAt?: Date;
    currentWaitStartedAt?: Date;
    priority: FlowPriority;
    notes?: string;
  }> = [];

  // Only process today's appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.startTime);
    return aptDate >= today && aptDate < tomorrow;
  });

  for (const apt of todaysAppointments) {
    const appointmentTime = new Date(apt.startTime);
    let stage: FlowStage = 'SCHEDULED';
    let checkedInAt: Date | undefined;
    let calledAt: Date | undefined;
    let seatedAt: Date | undefined;
    let completedAt: Date | undefined;
    let checkedOutAt: Date | undefined;
    let departedAt: Date | undefined;
    let currentWaitStartedAt: Date | undefined;
    let priority: FlowPriority = 'NORMAL';
    let notes: string | undefined;

    // Determine stage based on appointment status and time
    const minutesUntilAppointment = (appointmentTime.getTime() - now.getTime()) / 60000;

    if (apt.status === 'COMPLETED') {
      stage = 'DEPARTED';
      checkedInAt = new Date(appointmentTime.getTime() - 10 * 60000);
      calledAt = new Date(appointmentTime.getTime() + 2 * 60000);
      seatedAt = new Date(appointmentTime.getTime() + 5 * 60000);
      completedAt = new Date(appointmentTime.getTime() + 45 * 60000);
      checkedOutAt = new Date(appointmentTime.getTime() + 50 * 60000);
      departedAt = new Date(appointmentTime.getTime() + 55 * 60000);
    } else if (apt.status === 'IN_PROGRESS') {
      stage = 'IN_CHAIR';
      checkedInAt = new Date(appointmentTime.getTime() - 10 * 60000);
      calledAt = new Date(appointmentTime.getTime() + 2 * 60000);
      seatedAt = new Date(appointmentTime.getTime() + 5 * 60000);
    } else if (apt.status === 'CHECKED_IN') {
      // Randomly distribute between CHECKED_IN, WAITING, CALLED
      const randomStage = Math.random();
      if (randomStage < 0.3) {
        stage = 'CHECKED_IN';
        checkedInAt = new Date(now.getTime() - 5 * 60000);
      } else if (randomStage < 0.7) {
        stage = 'WAITING';
        checkedInAt = new Date(now.getTime() - 15 * 60000);
        currentWaitStartedAt = checkedInAt;
        // Long waits get higher priority
        if (now.getTime() - checkedInAt.getTime() > 20 * 60000) {
          priority = 'HIGH';
          notes = 'Extended wait time';
        }
      } else {
        stage = 'CALLED';
        checkedInAt = new Date(now.getTime() - 10 * 60000);
        calledAt = new Date(now.getTime() - 2 * 60000);
      }
    } else if (apt.status === 'CANCELLED') {
      stage = 'CANCELLED';
    } else if (apt.status === 'NO_SHOW' || (minutesUntilAppointment < -30 && apt.status === 'SCHEDULED')) {
      stage = 'NO_SHOW';
    } else {
      // Future or current scheduled appointments
      stage = 'SCHEDULED';
    }

    flowStates.push({
      clinicId,
      appointmentId: apt.id,
      patientId: apt.patientId,
      stage,
      chairId: apt.chairId || chairs[0]?.id,
      providerId: apt.providerId,
      scheduledAt: appointmentTime,
      checkedInAt,
      calledAt,
      seatedAt,
      completedAt,
      checkedOutAt,
      departedAt,
      currentWaitStartedAt,
      priority,
      notes,
    });
  }

  return flowStates;
}

// =============================================================================
// RESOURCE OCCUPANCY GENERATORS
// =============================================================================

/**
 * Generate resource occupancy states based on patient flow
 */
export function generateResourceOccupancy(
  clinicId: string,
  chairs: Array<{ id: string }>,
  rooms: Array<{ id: string }>,
  flowStates: Array<{
    appointmentId: string;
    patientId: string;
    chairId?: string;
    stage: FlowStage;
  }>
): Array<{
  clinicId: string;
  chairId?: string;
  roomId?: string;
  status: OccupancyStatus;
  appointmentId?: string;
  patientId?: string;
  occupiedAt?: Date;
  expectedFreeAt?: Date;
  blockReason?: string;
}> {
  const occupancy: Array<{
    clinicId: string;
    chairId?: string;
    roomId?: string;
    status: OccupancyStatus;
    appointmentId?: string;
    patientId?: string;
    occupiedAt?: Date;
    expectedFreeAt?: Date;
    blockReason?: string;
  }> = [];

  const now = new Date();

  // Track which chairs are occupied by IN_CHAIR patients
  const occupiedChairs = new Set<string>();
  for (const flow of flowStates) {
    if (flow.stage === 'IN_CHAIR' && flow.chairId) {
      occupiedChairs.add(flow.chairId);
    }
  }

  // Create occupancy records for all chairs
  for (const chair of chairs) {
    const flow = flowStates.find((f) => f.chairId === chair.id && f.stage === 'IN_CHAIR');

    if (flow) {
      occupancy.push({
        clinicId,
        chairId: chair.id,
        status: 'OCCUPIED',
        appointmentId: flow.appointmentId,
        patientId: flow.patientId,
        occupiedAt: new Date(now.getTime() - 15 * 60000), // Started 15 min ago
        expectedFreeAt: new Date(now.getTime() + 30 * 60000), // Expected 30 min from now
      });
    } else {
      // Random status for available chairs
      const random = Math.random();
      if (random < 0.1) {
        // 10% chance of maintenance
        occupancy.push({
          clinicId,
          chairId: chair.id,
          status: 'MAINTENANCE',
          blockReason: 'Scheduled maintenance',
        });
      } else if (random < 0.15) {
        // 5% chance of blocked
        occupancy.push({
          clinicId,
          chairId: chair.id,
          status: 'BLOCKED',
          blockReason: 'Reserved for emergency',
        });
      } else {
        occupancy.push({
          clinicId,
          chairId: chair.id,
          status: 'AVAILABLE',
        });
      }
    }
  }

  return occupancy;
}

// =============================================================================
// STAFF ASSIGNMENT GENERATORS
// =============================================================================

/**
 * Generate staff assignments for active appointments
 */
export function generateStaffAssignments(
  clinicId: string,
  flowStates: Array<{
    appointmentId: string;
    providerId: string;
    stage: FlowStage;
  }>,
  assistants: Array<{ id: string }>
): Array<{
  clinicId: string;
  staffId: string;
  appointmentId: string;
  role: string;
  notes?: string;
}> {
  const assignments: Array<{
    clinicId: string;
    staffId: string;
    appointmentId: string;
    role: string;
    notes?: string;
  }> = [];

  // Only assign staff to active appointments (IN_CHAIR or CALLED)
  const activeFlows = flowStates.filter((f) => ['IN_CHAIR', 'CALLED'].includes(f.stage));

  for (const flow of activeFlows) {
    // Add provider assignment
    assignments.push({
      clinicId,
      staffId: flow.providerId,
      appointmentId: flow.appointmentId,
      role: 'provider',
    });

    // Randomly assign an assistant (70% chance)
    if (assistants.length > 0 && Math.random() > 0.3) {
      const assistant = assistants[Math.floor(Math.random() * assistants.length)];
      assignments.push({
        clinicId,
        staffId: assistant.id,
        appointmentId: flow.appointmentId,
        role: 'assistant',
        notes: 'Assisting with treatment',
      });
    }
  }

  return assignments;
}

// =============================================================================
// OPERATIONS TASKS GENERATORS
// =============================================================================

/**
 * Default operations tasks that appear daily
 */
export const DEFAULT_OPS_TASKS = [
  {
    title: 'Morning equipment check',
    description: 'Verify all chairs and equipment are operational',
    type: 'SYSTEM' as OpsTaskType,
    priority: 'HIGH' as OpsTaskPriority,
    dueHour: 8,
  },
  {
    title: 'Review today\'s schedule',
    description: 'Check for conflicts and prepare for the day',
    type: 'SYSTEM' as OpsTaskType,
    priority: 'HIGH' as OpsTaskPriority,
    dueHour: 8,
  },
  {
    title: 'Confirm pending appointments',
    description: 'Call patients who haven\'t confirmed',
    type: 'MANUAL' as OpsTaskType,
    priority: 'NORMAL' as OpsTaskPriority,
    dueHour: 10,
  },
  {
    title: 'Update patient wait times',
    description: 'Check on patients waiting > 15 minutes',
    type: 'AI_GENERATED' as OpsTaskType,
    priority: 'HIGH' as OpsTaskPriority,
    dueHour: 11,
  },
  {
    title: 'Lunch break rotation check',
    description: 'Ensure adequate coverage during lunch',
    type: 'SYSTEM' as OpsTaskType,
    priority: 'NORMAL' as OpsTaskPriority,
    dueHour: 12,
  },
  {
    title: 'End of day cleanup',
    description: 'Prepare rooms for next day',
    type: 'MANUAL' as OpsTaskType,
    priority: 'NORMAL' as OpsTaskPriority,
    dueHour: 17,
  },
];

/**
 * Generate operations tasks for today
 */
export function generateOperationsTasks(
  clinicId: string,
  staffIds: string[],
  ownerId: string
): Array<{
  clinicId: string;
  title: string;
  description?: string;
  type: OpsTaskType;
  assigneeId?: string;
  ownerId: string;
  dueAt?: Date;
  completedAt?: Date;
  status: OpsTaskStatus;
  priority: OpsTaskPriority;
}> {
  const tasks: Array<{
    clinicId: string;
    title: string;
    description?: string;
    type: OpsTaskType;
    assigneeId?: string;
    ownerId: string;
    dueAt?: Date;
    completedAt?: Date;
    status: OpsTaskStatus;
    priority: OpsTaskPriority;
  }> = [];

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  for (const taskTemplate of DEFAULT_OPS_TASKS) {
    const dueAt = new Date(today);
    dueAt.setHours(taskTemplate.dueHour, 0, 0, 0);

    // Determine status based on current time
    let status: OpsTaskStatus = 'PENDING';
    let completedAt: Date | undefined;

    if (now.getHours() > taskTemplate.dueHour + 2) {
      // Past due by 2+ hours, mark as completed
      status = 'COMPLETED';
      completedAt = new Date(dueAt.getTime() + 30 * 60000);
    } else if (now.getHours() >= taskTemplate.dueHour) {
      // Currently due
      status = 'IN_PROGRESS';
    }

    // Randomly assign to a staff member
    const assigneeId = staffIds.length > 0 ? staffIds[Math.floor(Math.random() * staffIds.length)] : undefined;

    tasks.push({
      clinicId,
      title: taskTemplate.title,
      description: taskTemplate.description,
      type: taskTemplate.type,
      assigneeId,
      ownerId,
      dueAt,
      completedAt,
      status,
      priority: taskTemplate.priority,
    });
  }

  return tasks;
}

// =============================================================================
// DAILY METRICS GENERATORS
// =============================================================================

/**
 * Generate sample daily metrics for the past 30 days
 */
export function generateDailyMetrics(
  clinicId: string,
  daysToGenerate: number = 30
): Array<{
  clinicId: string;
  date: Date;
  scheduledCount: number;
  checkedInCount: number;
  completedCount: number;
  noShowCount: number;
  cancelledCount: number;
  walkInCount: number;
  avgWaitMinutes?: number;
  avgChairMinutes?: number;
  onTimePercentage?: number;
  chairUtilization?: number;
}> {
  const metrics: Array<{
    clinicId: string;
    date: Date;
    scheduledCount: number;
    checkedInCount: number;
    completedCount: number;
    noShowCount: number;
    cancelledCount: number;
    walkInCount: number;
    avgWaitMinutes?: number;
    avgChairMinutes?: number;
    onTimePercentage?: number;
    chairUtilization?: number;
  }> = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = daysToGenerate; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }

    // Generate realistic-ish metrics with some variance
    const scheduledCount = Math.floor(20 + Math.random() * 15); // 20-35 appointments
    const noShowRate = 0.03 + Math.random() * 0.05; // 3-8% no-show rate
    const cancelRate = 0.02 + Math.random() * 0.04; // 2-6% cancel rate

    const noShowCount = Math.floor(scheduledCount * noShowRate);
    const cancelledCount = Math.floor(scheduledCount * cancelRate);
    const checkedInCount = scheduledCount - noShowCount - cancelledCount;
    const completedCount = Math.floor(checkedInCount * (0.95 + Math.random() * 0.05)); // 95-100% completion
    const walkInCount = Math.floor(Math.random() * 3); // 0-2 walk-ins

    metrics.push({
      clinicId,
      date,
      scheduledCount,
      checkedInCount,
      completedCount,
      noShowCount,
      cancelledCount,
      walkInCount,
      avgWaitMinutes: 5 + Math.random() * 10, // 5-15 min average wait
      avgChairMinutes: 25 + Math.random() * 20, // 25-45 min average chair time
      onTimePercentage: 80 + Math.random() * 15, // 80-95% on-time
      chairUtilization: 60 + Math.random() * 25, // 60-85% utilization
    });
  }

  return metrics;
}
