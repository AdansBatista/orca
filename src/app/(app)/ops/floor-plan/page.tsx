'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  RefreshCw,
  ArrowLeft,
  Maximize2,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { FloorPlanCanvas } from '@/components/ops/floor-plan/FloorPlanCanvas';
import { DraggableChair } from '@/components/ops/floor-plan/DraggableChair';
import { DraggableRoom } from '@/components/ops/floor-plan/DraggableRoom';
import { FloorPlanControls } from '@/components/ops/floor-plan/FloorPlanControls';
import { useFloorPlanLayout } from '@/components/ops/floor-plan/hooks/useFloorPlanLayout';
import { PatientDetailSheet } from '@/components/ops/PatientDetailSheet';
import type { Chair, Room, FloorPlanLayout } from '@/types/floor-plan';
import { toast } from 'sonner';

export default function FloorPlanPage() {
  const { data: session } = useSession();
  const clinicId = session?.user?.clinicId || '';

  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);

  // Floor plan data
  const [rooms, setRooms] = useState<Room[]>([]);
  const [chairs, setChairs] = useState<Chair[]>([]);
  const [initialLayout, setInitialLayout] = useState<FloorPlanLayout | undefined>();

  // Selected chair for detail view
  const [selectedChair, setSelectedChair] = useState<Chair | null>(null);

  // Fetch floor plan data
  const fetchFloorPlan = useCallback(async () => {
    if (!clinicId) return;

    setLoading(true);
    try {
      // Fetch layout configuration
      const layoutRes = await fetch('/api/ops/floor-plan/layout');
      const layoutData = await layoutRes.json();

      if (layoutData.success) {
        setInitialLayout(layoutData.data);
      }

      // Fetch chair statuses (which includes room data)
      const statusRes = await fetch('/api/ops/resources/status');
      const statusData = await statusRes.json();

      if (statusData.success) {
        // Transform room data to include positions from layout
        const layoutRooms = layoutData.data?.rooms || [];
        const layoutChairs = layoutData.data?.chairs || [];

        // Get rooms from the byRoom data
        const byRoom = statusData.data.byRoom || [];

        const transformedRooms: Room[] = byRoom.map((roomData: any) => ({
          id: roomData.room.id,
          name: roomData.room.name,
          roomNumber: roomData.room.roomNumber || '0',
          boundary: layoutRooms.find((r: any) => r.roomId === roomData.room.id),
          chairs: roomData.chairs.map((chair: any) => ({
            id: chair.id,
            name: chair.name,
            chairNumber: chair.chairNumber,
            roomId: roomData.room.id,
            isActive: chair.condition === 'GOOD' || chair.condition === 'FAIR',
            position: layoutChairs.find((c: any) => c.chairId === chair.id),
            status: {
              status: chair.status,
              patient: chair.patient,
              appointment: chair.appointment,
              occupiedAt: chair.occupiedAt,
              subStage: chair.activitySubStage,
              assignedStaff: chair.assignedStaff,
            },
          })),
        }));

        setRooms(transformedRooms);

        // Flatten all chairs
        const allChairs = transformedRooms.flatMap((room) => room.chairs);
        setChairs(allChairs);
      }

    } catch (error) {
      console.error('Failed to fetch floor plan data:', error);
      toast.error('Failed to load floor plan');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  // Initial load
  useEffect(() => {
    if (clinicId) {
      fetchFloorPlan();
    }
  }, [clinicId, fetchFloorPlan, refreshKey]);

  // Floor plan layout hook
  const {
    layout,
    editMode,
    isSaving,
    hasUnsavedChanges,
    canUndo,
    canRedo,
    undo,
    redo,
    updateChairPosition,
    updateRoomBoundary,
    saveLayout,
    resetLayout,
    setEditMode,
  } = useFloorPlanLayout({
    clinicId,
    initialLayout,
    onSave: async (newLayout) => {
      const res = await fetch('/api/ops/floor-plan/layout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLayout),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to save');
      }
    },
  });

  // Manual refresh
  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(200, prev + 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(50, prev - 10));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      }

      // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z for redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        if (canRedo) redo();
      }

      // Ctrl/Cmd + S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (editMode && hasUnsavedChanges) {
          saveLayout();
        }
      }

      // Ctrl/Cmd + E for edit mode toggle
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        setEditMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo, editMode, hasUnsavedChanges, saveLayout, setEditMode]);

  if (loading && !initialLayout) {
    return (
      <>
        <PageHeader
          title="Floor Plan"
          compact
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Operations', href: '/ops' },
            { label: 'Floor Plan' },
          ]}
        />
        <PageContent density="comfortable">
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Floor Plan"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Operations', href: '/ops' },
          { label: 'Floor Plan' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/ops">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Ops
              </Button>
            </Link>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        }
      />

      <PageContent density="comfortable">
        <div className="space-y-4">
          {/* Controls */}
          <FloorPlanControls
            editMode={editMode}
            onToggleEdit={setEditMode}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onSave={saveLayout}
            onReset={resetLayout}
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
          />

          {/* Floor Plan Canvas */}
          <FloorPlanCanvas
            gridConfig={layout.gridConfig}
            rooms={rooms}
            chairs={chairs}
            editMode={editMode}
            zoom={zoom}
            onChairDragEnd={(chairId, position) => {
              updateChairPosition(chairId, position);
            }}
            onRoomDragEnd={(roomId, position) => {
              updateRoomBoundary(roomId, position);
            }}
            onChairClick={(chair) => setSelectedChair(chair)}
          >
            {/* Render rooms */}
            {rooms.map((room) => {
              if (!room.boundary) return null;
              return (
                <DraggableRoom
                  key={room.id}
                  room={room}
                  cellSize={layout.gridConfig.cellSize}
                  editMode={editMode}
                />
              );
            })}

            {/* Render chairs */}
            {chairs.map((chair) => {
              if (!chair.position) return null;
              return (
                <DraggableChair
                  key={chair.id}
                  chair={chair}
                  cellSize={layout.gridConfig.cellSize}
                  editMode={editMode}
                  onClick={setSelectedChair}
                />
              );
            })}
          </FloorPlanCanvas>

          {/* Help text */}
          {editMode && (
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>Drag chairs and rooms to rearrange the floor plan</p>
              <p className="font-mono">
                Keyboard: Ctrl+Z (undo) | Ctrl+Y (redo) | Ctrl+S (save) | Ctrl+E (toggle edit)
              </p>
            </div>
          )}
        </div>
      </PageContent>

      {/* Patient Detail Sheet */}
      {selectedChair && selectedChair.status?.patient && (
        <PatientDetailSheet
          open={!!selectedChair}
          onOpenChange={(open) => !open && setSelectedChair(null)}
          patientId={selectedChair.status.patient.id}
          appointmentId={selectedChair.status.appointment?.id}
          currentStage={selectedChair.status.subStage}
          onAction={handleRefresh}
        />
      )}
    </>
  );
}
