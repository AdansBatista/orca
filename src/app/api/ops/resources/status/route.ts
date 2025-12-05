import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';

/**
 * GET /api/ops/resources/status
 * Get current status of all resources (chairs/rooms)
 */
export const GET = withAuth(
  async (req, session) => {
    const clinicId = session.user.clinicId;

    // Get all chairs with their current occupancy
    const chairs = await db.treatmentChair.findMany({
      where: {
        room: {
          clinicId,
        },
        deletedAt: null,
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            roomNumber: true,
          },
        },
      },
      orderBy: [
        { room: { name: 'asc' } },
        { chairNumber: 'asc' },
      ],
    });

    // Get occupancy records for chairs
    const occupancies = await db.resourceOccupancy.findMany({
      where: {
        clinicId,
        chairId: {
          in: chairs.map((c) => c.id),
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        appointment: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            appointmentType: {
              select: {
                id: true,
                name: true,
                code: true,
                color: true,
              },
            },
            provider: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        assignedStaff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            providerType: true,
          },
        },
      },
    });

    // Create a map of chairId -> occupancy
    const occupancyMap = new Map(occupancies.map((o) => [o.chairId, o]));

    // Combine chair data with occupancy
    const chairStatuses = chairs.map((chair) => {
      const occupancy = occupancyMap.get(chair.id);

      return {
        id: chair.id,
        name: chair.name,
        chairNumber: chair.chairNumber,
        status: occupancy?.status || 'AVAILABLE',
        condition: chair.condition,
        room: chair.room,
        // If occupied - include sub-stage data
        ...(occupancy?.status === 'OCCUPIED' && {
          patient: occupancy.patient,
          appointment: occupancy.appointment,
          occupiedAt: occupancy.occupiedAt,
          expectedFreeAt: occupancy.expectedFreeAt,
          // Chair activity sub-stage tracking
          activitySubStage: occupancy.activitySubStage,
          subStageStartedAt: occupancy.subStageStartedAt,
          assignedStaff: occupancy.assignedStaff,
          procedureNotes: occupancy.procedureNotes,
        }),
        // If cleaning (post-treatment)
        ...(occupancy?.status === 'CLEANING' && {
          activitySubStage: 'CLEANING',
          subStageStartedAt: occupancy.subStageStartedAt,
          assignedStaff: occupancy.assignedStaff,
        }),
        // If blocked/maintenance
        ...(occupancy?.status === 'BLOCKED' && {
          blockReason: occupancy.blockReason,
          blockedUntil: occupancy.blockedUntil,
        }),
        ...(occupancy?.status === 'MAINTENANCE' && {
          blockReason: occupancy.blockReason,
        }),
      };
    });

    // Group by room for easier display
    const roomsWithChairs: Record<string, {
      room: { id: string; name: string; roomNumber: string };
      chairs: typeof chairStatuses;
    }> = {};

    for (const chair of chairStatuses) {
      const roomId = chair.room.id;
      if (!roomsWithChairs[roomId]) {
        roomsWithChairs[roomId] = {
          room: chair.room,
          chairs: [],
        };
      }
      roomsWithChairs[roomId].chairs.push(chair);
    }

    // Calculate summary including sub-stages
    const occupiedChairs = chairStatuses.filter((c) => c.status === 'OCCUPIED');
    const summary = {
      total: chairs.length,
      available: chairStatuses.filter((c) => c.status === 'AVAILABLE').length,
      occupied: occupiedChairs.length,
      cleaning: chairStatuses.filter((c) => c.status === 'CLEANING').length,
      blocked: chairStatuses.filter((c) => c.status === 'BLOCKED').length,
      maintenance: chairStatuses.filter((c) => c.status === 'MAINTENANCE').length,
      // Sub-stage breakdown for occupied chairs
      readyForDoctor: occupiedChairs.filter((c) => c.activitySubStage === 'READY_FOR_DOCTOR').length,
      doctorChecking: occupiedChairs.filter((c) => c.activitySubStage === 'DOCTOR_CHECKING').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        chairs: chairStatuses,
        byRoom: Object.values(roomsWithChairs),
        summary,
      },
    });
  },
  { permissions: ['ops:read'] }
);
