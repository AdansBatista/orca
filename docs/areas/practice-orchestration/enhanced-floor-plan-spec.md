# Enhanced Floor Plan - Technical Specification

> **Feature**: Enhanced Interactive Floor Plan
>
> **Area**: Practice Orchestration → Resource Coordination
>
> **Start Date**: 2024-12-05
>
> **Status**: 📋 Planning

---

## Overview

Transform the basic floor plan view into a fully interactive, real-time command center for managing clinic resources. This enhancement adds drag-and-drop layout editing, real-time status updates, quick actions, advanced filtering, and comprehensive resource management.

---

## Goals & Objectives

### Primary Goals
1. **Interactive Layout Management**: Allow administrators to visually design and modify floor plans
2. **Real-Time Visibility**: Provide instant updates on chair/room status and patient flow
3. **Quick Operations**: Enable staff to perform common actions directly from the floor plan
4. **Resource Optimization**: Help identify bottlenecks and optimize chair utilization

### Success Metrics
- Layout changes take < 30 seconds to configure
- Real-time updates appear within 2 seconds
- 90% of common actions accessible within 2 clicks
- Floor plan loads in < 3 seconds for 50-chair clinics

---

## Feature Breakdown

### Feature 1: Interactive Layout Management

#### User Stories
- As a **clinic admin**, I want to drag chairs to new positions so I can match the actual clinic layout
- As a **clinic admin**, I want to resize rooms so the floor plan accurately represents our space
- As a **clinic admin**, I want to save multiple floor plan configurations for different clinic locations

#### Acceptance Criteria
- ✅ Chairs can be dragged and dropped to any position on the grid
- ✅ Rooms can be resized by dragging corners/edges
- ✅ Layout snaps to grid for alignment
- ✅ Changes auto-save or have explicit save button
- ✅ Undo/redo available for accidental changes
- ✅ Edit mode toggle to prevent accidental changes
- ✅ Layout templates available for quick setup

#### Technical Approach

**Drag-and-Drop Library**:
- **Choice**: `@dnd-kit/core` with `@dnd-kit/sortable`
- **Rationale**:
  - Modern, accessible, performant
  - Great TypeScript support
  - Handles both free positioning and grid layouts
  - Active maintenance
  - Smaller bundle size than alternatives

**Grid System**:
```typescript
interface GridConfig {
  columns: number;      // Default: 20
  rows: number;         // Default: 15
  cellSize: number;     // Default: 50px
  snapToGrid: boolean;  // Default: true
}

interface ChairPosition {
  chairId: string;
  x: number;           // Grid units
  y: number;           // Grid units
  rotation: 0 | 90 | 180 | 270;
}

interface RoomBoundary {
  roomId: string;
  x: number;           // Grid units
  y: number;           // Grid units
  width: number;       // Grid units
  height: number;      // Grid units
  rotation: 0 | 90 | 180 | 270;
}
```

**State Management**:
```typescript
// Context for floor plan editing
interface FloorPlanEditContext {
  editMode: boolean;
  layout: FloorPlanLayout;
  history: FloorPlanLayout[];
  historyIndex: number;

  // Actions
  setEditMode: (enabled: boolean) => void;
  updateChairPosition: (chairId: string, position: Position) => void;
  updateRoomBoundary: (roomId: string, boundary: Boundary) => void;
  undo: () => void;
  redo: () => void;
  saveLayout: () => Promise<void>;
  loadTemplate: (templateId: string) => void;
}
```

**Components**:
```tsx
// Main canvas
<FloorPlanCanvas
  editMode={editMode}
  gridConfig={gridConfig}
  onLayoutChange={handleLayoutChange}
>
  {rooms.map(room => (
    <DraggableRoom
      key={room.id}
      room={room}
      editMode={editMode}
      onMove={handleRoomMove}
      onResize={handleRoomResize}
    >
      {room.chairs.map(chair => (
        <DraggableChair
          key={chair.id}
          chair={chair}
          status={chairStatuses[chair.id]}
          editMode={editMode}
          onMove={handleChairMove}
          onClick={handleChairClick}
        />
      ))}
    </DraggableRoom>
  ))}
</FloorPlanCanvas>

// Controls
<FloorPlanControls
  editMode={editMode}
  onToggleEdit={toggleEditMode}
  onUndo={undo}
  onRedo={redo}
  onSave={saveLayout}
  onLoadTemplate={loadTemplate}
  canUndo={historyIndex > 0}
  canRedo={historyIndex < history.length - 1}
/>
```

**API**:
```typescript
// PUT /api/ops/floor-plan/layout
interface UpdateFloorPlanRequest {
  name?: string;
  gridConfig?: GridConfig;
  rooms: RoomBoundary[];
  chairs: ChairPosition[];
}

// GET /api/ops/floor-plan/templates
interface FloorPlanTemplate {
  id: string;
  name: string;
  description: string;
  gridConfig: GridConfig;
  rooms: RoomBoundary[];
  chairCount: number;
  previewImage?: string;
}
```

---

### Feature 2: Real-Time Status Visualization

#### User Stories
- As a **front desk staff**, I want to see which chairs are available in real-time
- As a **clinical coordinator**, I want to see when a chair is ready for doctor review
- As a **doctor**, I want to see my patients' current locations at a glance

#### Acceptance Criteria
- ✅ Chair status updates appear within 2 seconds of change
- ✅ Color coding matches status (available, occupied, ready, etc.)
- ✅ Patient name and treatment info visible on hover
- ✅ Time elapsed/remaining shown for active treatments
- ✅ Visual alerts for chairs waiting > 15 minutes for doctor
- ✅ Smooth animations for status transitions

#### Technical Approach

**Real-Time Strategy**: Server-Sent Events (SSE)

```typescript
// Server: /api/ops/floor-plan/stream
export async function GET(req: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial state
      const initialData = await getFloorPlanState();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`));

      // Poll for changes every 5 seconds
      const interval = setInterval(async () => {
        const updates = await getFloorPlanUpdates();
        if (updates.length > 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(updates)}\n\n`));
        }
      }, 5000);

      // Cleanup
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Client: Hook for SSE connection
function useFloorPlanRealtime() {
  const [chairStatuses, setChairStatuses] = useState<ChairStatus[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource('/api/ops/floor-plan/stream');

    eventSource.onopen = () => setConnected(true);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setChairStatuses(prev => mergeUpdates(prev, data));
    };

    eventSource.onerror = () => {
      setConnected(false);
      eventSource.close();
      // Fallback to polling
      startPolling();
    };

    return () => eventSource.close();
  }, []);

  return { chairStatuses, connected };
}
```

**Status Color Scheme**:
```typescript
const CHAIR_STATUS_COLORS = {
  AVAILABLE: {
    bg: 'bg-success-100',
    border: 'border-success-500',
    text: 'text-success-700',
    icon: 'text-success-500',
  },
  OCCUPIED: {
    bg: 'bg-primary-100',
    border: 'border-primary-500',
    text: 'text-primary-700',
    icon: 'text-primary-500',
  },
  READY_FOR_DOCTOR: {
    bg: 'bg-warning-100',
    border: 'border-warning-500',
    text: 'text-warning-700',
    icon: 'text-warning-500',
    pulse: true, // Pulsing animation
  },
  CLEANING: {
    bg: 'bg-purple-100',
    border: 'border-purple-500',
    text: 'text-purple-700',
    icon: 'text-purple-500',
  },
  BLOCKED: {
    bg: 'bg-error-100',
    border: 'border-error-500',
    text: 'text-error-700',
    icon: 'text-error-500',
  },
  MAINTENANCE: {
    bg: 'bg-muted',
    border: 'border-border',
    text: 'text-muted-foreground',
    icon: 'text-muted-foreground',
  },
} as const;
```

**Chair Component with Real-Time Updates**:
```tsx
interface DraggableChairProps {
  chair: Chair;
  status: ChairStatus;
  editMode: boolean;
  onMove: (position: Position) => void;
  onClick: (chair: Chair) => void;
}

function DraggableChair({ chair, status, editMode, onMove, onClick }: DraggableChairProps) {
  const colors = CHAIR_STATUS_COLORS[status.occupancyStatus];
  const timeElapsed = status.patient ? calculateTimeElapsed(status.seatedAt) : null;
  const isExtendedWait = status.subStage === 'READY_FOR_DOCTOR' && timeElapsed > 15;

  return (
    <motion.div
      layout
      className={cn(
        "relative rounded-lg border-2 p-3 cursor-pointer transition-all",
        colors.bg,
        colors.border,
        isExtendedWait && "ring-2 ring-warning-500 ring-offset-2",
        colors.pulse && "animate-pulse-subtle"
      )}
      onClick={() => !editMode && onClick(chair)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Status indicator */}
      <div className={cn("absolute -top-2 -right-2 w-4 h-4 rounded-full", colors.border)} />

      {/* Chair info */}
      <div className="text-sm font-medium">{chair.name}</div>

      {/* Patient info (if occupied) */}
      {status.patient && (
        <>
          <PhiProtected fakeData={getFakeName()}>
            <div className="text-xs truncate">{status.patient.name}</div>
          </PhiProtected>
          {timeElapsed && (
            <div className="text-xs text-muted-foreground">{timeElapsed} min</div>
          )}
        </>
      )}

      {/* Sub-stage indicator */}
      {status.subStage && (
        <Badge variant="outline" size="sm" className="mt-1">
          {SUB_STAGE_LABELS[status.subStage]}
        </Badge>
      )}
    </motion.div>
  );
}
```

---

### Feature 3: Quick Actions & Interactions

#### User Stories
- As a **clinical staff**, I want to click a chair to see patient details
- As a **assistant**, I want to mark a chair "ready for doctor" with one click
- As a **staff member**, I want to add quick notes without leaving the floor plan

#### Acceptance Criteria
- ✅ Single click opens patient detail sheet
- ✅ Hover shows quick action buttons
- ✅ Right-click shows context menu
- ✅ Keyboard shortcuts work (arrow keys, hotkeys)
- ✅ Actions provide immediate feedback
- ✅ Optimistic UI updates

#### Technical Approach

**Quick Actions Overlay**:
```tsx
interface ChairQuickActionsProps {
  chair: Chair;
  status: ChairStatus;
  onAction: (action: string) => Promise<void>;
}

function ChairQuickActions({ chair, status, onAction }: ChairQuickActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setLoading(action);
    try {
      await onAction(action);
      toast.success(`${action} completed`);
    } catch (error) {
      toast.error(`Failed to ${action}`);
    } finally {
      setLoading(null);
    }
  };

  // Different actions based on status
  const availableActions = getAvailableActions(status);

  return (
    <div className="flex gap-1 p-1 bg-background/95 backdrop-blur rounded-lg shadow-lg border">
      {availableActions.map(action => (
        <Button
          key={action.key}
          variant="ghost"
          size="icon-sm"
          onClick={() => handleAction(action.key)}
          disabled={loading !== null}
        >
          {loading === action.key ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <action.icon className="h-3 w-3" />
          )}
        </Button>
      ))}
    </div>
  );
}

function getAvailableActions(status: ChairStatus) {
  switch (status.occupancyStatus) {
    case 'AVAILABLE':
      return [
        { key: 'block', icon: Ban, label: 'Block Chair' },
      ];
    case 'OCCUPIED':
      return [
        { key: 'ready', icon: Bell, label: 'Ready for Doctor' },
        { key: 'note', icon: FileText, label: 'Add Note' },
        { key: 'complete', icon: CheckCircle, label: 'Complete' },
      ];
    case 'READY_FOR_DOCTOR':
      return [
        { key: 'note', icon: FileText, label: 'Add Note' },
        { key: 'complete', icon: CheckCircle, label: 'Complete' },
      ];
    // ... etc
  }
}
```

**Context Menu**:
```tsx
function ChairContextMenu({ chair, status }: ChairContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <DraggableChair {...props} />
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => viewDetails(chair)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </ContextMenuItem>
        <ContextMenuItem onClick={() => markReadyForDoctor(chair)}>
          <Bell className="mr-2 h-4 w-4" />
          Ready for Doctor
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => blockChair(chair)}>
          <Ban className="mr-2 h-4 w-4" />
          Block Chair
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
```

**Keyboard Shortcuts**:
```tsx
function useFloorPlanKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Navigation
      if (e.key === 'ArrowLeft') selectPreviousChair();
      if (e.key === 'ArrowRight') selectNextChair();

      // Actions (with selected chair)
      if (e.key === 'r' && e.ctrlKey) markReadyForDoctor();
      if (e.key === 'c' && e.ctrlKey) completePatient();
      if (e.key === 'n' && e.ctrlKey) openNoteDialog();

      // View controls
      if (e.key === '+') zoomIn();
      if (e.key === '-') zoomOut();
      if (e.key === 'f') toggleFilter();
      if (e.key === 'e' && e.ctrlKey) toggleEditMode();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedChair]);
}
```

---

### Feature 4: Advanced Filtering & Views

#### User Stories
- As a **clinical coordinator**, I want to filter chairs by provider to focus on one doctor's patients
- As a **front desk**, I want to see only available chairs when seating a walk-in
- As a **manager**, I want to view a heatmap of chair utilization

#### Acceptance Criteria
- ✅ Filter by status, provider, treatment type, priority
- ✅ Multiple filters can be combined
- ✅ Saved filter presets
- ✅ View modes: standard, active only, provider-grouped, priority
- ✅ Zoom in/out controls (50% - 200%)
- ✅ Minimap for large floor plans

#### Technical Approach

**Filter Panel**:
```tsx
interface FloorPlanFilters {
  status: OccupancyStatus[];
  providerIds: string[];
  treatmentTypes: string[];
  priorities: FlowPriority[];
  timeRange: 'all' | 'overdue' | 'on-time' | 'ahead';
}

function FilterPanel() {
  const [filters, setFilters] = useState<FloorPlanFilters>({
    status: [],
    providerIds: [],
    treatmentTypes: [],
    priorities: [],
    timeRange: 'all',
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status filter */}
        <div>
          <Label>Chair Status</Label>
          <MultiSelect
            options={OCCUPANCY_STATUS_OPTIONS}
            value={filters.status}
            onChange={(status) => setFilters(f => ({ ...f, status }))}
          />
        </div>

        {/* Provider filter */}
        <div>
          <Label>Provider</Label>
          <MultiSelect
            options={providers}
            value={filters.providerIds}
            onChange={(providerIds) => setFilters(f => ({ ...f, providerIds }))}
          />
        </div>

        {/* Saved presets */}
        <div>
          <Label>Presets</Label>
          <Select onValueChange={loadPreset}>
            <SelectTrigger>
              <SelectValue placeholder="Load preset..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available-only">Available Only</SelectItem>
              <SelectItem value="ready-for-doctor">Ready for Doctor</SelectItem>
              <SelectItem value="my-patients">My Patients</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
```

**View Modes**:
```tsx
type ViewMode = 'standard' | 'active-only' | 'provider-grouped' | 'priority' | 'heatmap';

function FloorPlanCanvas({ viewMode }: { viewMode: ViewMode }) {
  const filteredChairs = useFilteredChairs(chairs, filters, viewMode);

  if (viewMode === 'provider-grouped') {
    return (
      <div className="space-y-6">
        {providers.map(provider => (
          <div key={provider.id}>
            <h3 className="font-medium mb-3">{provider.name}</h3>
            <div className="grid grid-cols-4 gap-4">
              {filteredChairs
                .filter(c => c.providerId === provider.id)
                .map(chair => <DraggableChair key={chair.id} chair={chair} />)
              }
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (viewMode === 'heatmap') {
    return <ChairUtilizationHeatmap chairs={filteredChairs} />;
  }

  // Standard grid view
  return (
    <div className="relative" style={{ zoom: `${zoomLevel}%` }}>
      {/* ... standard grid ... */}
    </div>
  );
}
```

**Zoom Controls**:
```tsx
function ZoomControls() {
  const [zoom, setZoom] = useState(100);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon-sm" onClick={() => setZoom(z => Math.max(50, z - 10))}>
        <Minus className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
      <Button variant="outline" size="icon-sm" onClick={() => setZoom(z => Math.min(200, z + 10))}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

**Minimap**:
```tsx
function MiniMap({ chairs, viewport }: MiniMapProps) {
  return (
    <div className="absolute bottom-4 right-4 w-48 h-32 bg-background/95 backdrop-blur border rounded-lg p-2">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Render simplified chair positions */}
        {chairs.map(chair => (
          <rect
            key={chair.id}
            x={chair.x / gridConfig.columns * 100}
            y={chair.y / gridConfig.rows * 100}
            width={2}
            height={2}
            fill={getChairColor(chair.status)}
          />
        ))}
        {/* Viewport indicator */}
        <rect
          x={viewport.x}
          y={viewport.y}
          width={viewport.width}
          height={viewport.height}
          fill="none"
          stroke="currentColor"
          strokeWidth={0.5}
        />
      </svg>
    </div>
  );
}
```

---

### Feature 5: Resource Management Features

#### User Stories
- As a **clinic admin**, I want to block a chair for maintenance
- As a **clinical coordinator**, I want to see cleaning timers
- As a **manager**, I want to view chair utilization percentages

#### Acceptance Criteria
- ✅ Block/unblock chairs with reason
- ✅ Schedule future maintenance windows
- ✅ Automatic cleaning timers (configurable duration)
- ✅ Equipment status per chair
- ✅ Turn-over time tracking
- ✅ Utilization heatmap

#### Technical Approach

**Block/Unblock API**:
```typescript
// POST /api/ops/chairs/[id]/block
interface BlockChairRequest {
  reason: string;
  blockedUntil?: string; // ISO datetime
  maintenanceType?: 'cleaning' | 'repair' | 'other';
}

// POST /api/ops/chairs/[id]/unblock
// No body required

export const POST = withAuth(
  async (req, session, { params }) => {
    const chairId = params.chairId;
    const body = await req.json();
    const validated = blockChairSchema.parse(body);

    // Update resource occupancy
    await db.resourceOccupancy.update({
      where: {
        clinicId_resourceId: {
          clinicId: session.user.clinicId,
          resourceId: chairId,
        }
      },
      data: {
        status: validated.maintenanceType === 'cleaning' ? 'CLEANING' : 'BLOCKED',
        blockReason: validated.reason,
        blockedUntil: validated.blockedUntil,
      },
    });

    // Log audit event
    await logAudit(session, {
      action: 'BLOCK_CHAIR',
      entity: 'ResourceOccupancy',
      entityId: chairId,
      details: { reason: validated.reason },
    });

    return NextResponse.json({ success: true });
  },
  { permissions: ['ops:assign_resources'] }
);
```

**Cleaning Timer**:
```tsx
function ChairCleaningTimer({ chair }: { chair: Chair }) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (chair.status !== 'CLEANING') return;

    const cleaningDuration = chair.cleaningDuration || 15; // minutes
    const endTime = addMinutes(chair.statusChangedAt, cleaningDuration);

    const interval = setInterval(() => {
      const remaining = differenceInSeconds(endTime, new Date());
      if (remaining <= 0) {
        // Auto-unblock when timer expires
        autoUnblockChair(chair.id);
        clearInterval(interval);
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [chair]);

  if (!timeRemaining) return null;

  return (
    <div className="absolute top-0 left-0 w-full h-1 bg-muted">
      <div
        className="h-full bg-purple-500 transition-all"
        style={{ width: `${(timeRemaining / (chair.cleaningDuration * 60)) * 100}%` }}
      />
    </div>
  );
}
```

**Utilization Heatmap**:
```tsx
function ChairUtilizationHeatmap({ chairs, dateRange }: HeatmapProps) {
  const utilizationData = useChairUtilization(dateRange);

  return (
    <div className="grid grid-cols-5 gap-4">
      {chairs.map(chair => {
        const utilization = utilizationData[chair.id] || 0;
        const color = getUtilizationColor(utilization);

        return (
          <Card key={chair.id} className="relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-20"
              style={{ backgroundColor: color }}
            />
            <CardContent className="p-4 relative z-10">
              <div className="font-medium">{chair.name}</div>
              <div className="text-2xl font-bold">{utilization}%</div>
              <Progress value={utilization} className="mt-2" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function getUtilizationColor(utilization: number): string {
  if (utilization >= 80) return '#22c55e'; // Green (excellent)
  if (utilization >= 60) return '#84cc16'; // Yellow-green (good)
  if (utilization >= 40) return '#eab308'; // Yellow (fair)
  if (utilization >= 20) return '#f97316'; // Orange (poor)
  return '#ef4444'; // Red (very poor)
}
```

---

## Data Models

### Existing Models (No Changes Needed)
- `FloorPlanConfig` - Already has `layout` JSON field for positions
- `ResourceOccupancy` - Already tracks status, block reason
- `PatientFlowState` - Already tracks chair assignments

### Potential Schema Additions
```prisma
model FloorPlanConfig {
  // ... existing fields ...

  // NEW: Layout templates
  isTemplate      Boolean           @default(false)
  templateName    String?
  templateDescription String?

  // NEW: Grid configuration
  gridColumns     Int               @default(20)
  gridRows        Int               @default(15)
  cellSize        Int               @default(50)

  // NEW: Metadata
  lastEditedBy    String?           @db.ObjectId
  lastEditedAt    DateTime?
}

model ResourceOccupancy {
  // ... existing fields ...

  // NEW: Cleaning timer
  cleaningStartedAt DateTime?
  cleaningDuration  Int?            // minutes

  // NEW: Equipment tracking
  equipmentStatus Json?             // { sterilizer: 'ok', xray: 'maintenance' }

  // Existing blockedUntil can be used for scheduled maintenance
}
```

---

## API Endpoints

### New Endpoints

```typescript
// Floor Plan Layout
PUT    /api/ops/floor-plan/layout           // Save floor plan layout
GET    /api/ops/floor-plan/templates        // Get layout templates
POST   /api/ops/floor-plan/templates        // Create template from current
DELETE /api/ops/floor-plan/templates/[id]   // Delete template

// Real-Time Updates
GET    /api/ops/floor-plan/stream            // SSE stream for updates

// Chair Management
POST   /api/ops/chairs/[id]/block            // Block chair
POST   /api/ops/chairs/[id]/unblock          // Unblock chair
GET    /api/ops/chairs/[id]/utilization      // Get utilization stats

// Analytics
GET    /api/ops/floor-plan/analytics         // Utilization data
GET    /api/ops/floor-plan/analytics/export  // Export snapshot
```

---

## File Structure

```
src/
├── app/
│   ├── (app)/
│   │   └── ops/
│   │       └── floor-plan/
│   │           └── page.tsx                    # MODIFY: Enhanced floor plan page
│   └── api/
│       └── ops/
│           ├── floor-plan/
│           │   ├── layout/
│           │   │   └── route.ts                # NEW: Save/load layout
│           │   ├── templates/
│           │   │   ├── route.ts                # NEW: List templates
│           │   │   └── [id]/
│           │   │       └── route.ts            # NEW: Get/delete template
│           │   ├── stream/
│           │   │   └── route.ts                # NEW: SSE endpoint
│           │   └── analytics/
│           │       ├── route.ts                # NEW: Utilization data
│           │       └── export/
│           │           └── route.ts            # NEW: Export snapshot
│           └── chairs/
│               └── [id]/
│                   ├── block/
│                   │   └── route.ts            # NEW: Block chair
│                   ├── unblock/
│                   │   └── route.ts            # NEW: Unblock chair
│                   └── utilization/
│                       └── route.ts            # NEW: Chair stats
│
├── components/
│   └── ops/
│       └── floor-plan/
│           ├── FloorPlanCanvas.tsx             # NEW: Main canvas
│           ├── FloorPlanControls.tsx           # NEW: Controls bar
│           ├── DraggableChair.tsx              # NEW: Draggable chair
│           ├── DraggableRoom.tsx               # NEW: Draggable room
│           ├── ChairQuickActions.tsx           # NEW: Quick actions
│           ├── ChairContextMenu.tsx            # NEW: Context menu
│           ├── FilterPanel.tsx                 # NEW: Filters
│           ├── ViewModeToggle.tsx              # NEW: View modes
│           ├── ZoomControls.tsx                # NEW: Zoom
│           ├── MiniMap.tsx                     # NEW: Minimap
│           ├── LayoutTemplates.tsx             # NEW: Template selector
│           ├── ChairUtilizationHeatmap.tsx     # NEW: Heatmap view
│           ├── ChairCleaningTimer.tsx          # NEW: Cleaning timer
│           ├── BlockChairDialog.tsx            # NEW: Block dialog
│           └── hooks/
│               ├── useFloorPlanLayout.ts       # NEW: Layout state
│               ├── useFloorPlanRealtime.ts     # NEW: SSE connection
│               ├── useFloorPlanActions.ts      # NEW: Action handlers
│               ├── useFloorPlanFilters.ts      # NEW: Filter logic
│               └── useChairUtilization.ts      # NEW: Analytics
│
├── lib/
│   ├── validations/
│   │   └── floor-plan.ts                       # NEW: Floor plan validations
│   └── utils/
│       └── floor-plan.ts                       # NEW: Helper functions
│
└── types/
    └── floor-plan.ts                           # NEW: TypeScript types
```

---

## Dependencies

### NPM Packages to Add
```json
{
  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/sortable": "^8.0.0",
  "@dnd-kit/utilities": "^3.2.2",
  "framer-motion": "^10.16.16"  // May already be installed
}
```

### Internal Dependencies
- ✅ `@/components/ui/*` - All UI components
- ✅ `@/lib/db` - Database access
- ✅ `@/lib/validations/ops` - Existing validations
- ✅ `@/contexts/chair-sidebar-context` - Existing context

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Set up project structure and dependencies
- [ ] Create base components (FloorPlanCanvas, DraggableChair, DraggableRoom)
- [ ] Implement grid system
- [ ] Basic drag-and-drop functionality
- [ ] Save/load layout API

### Phase 2: Real-Time Updates (Week 1-2)
- [ ] SSE endpoint for floor plan stream
- [ ] Client-side SSE hook
- [ ] Real-time status color updates
- [ ] Polling fallback
- [ ] Connection status indicator

### Phase 3: Interactions (Week 2)
- [ ] Quick actions overlay
- [ ] Context menu
- [ ] Keyboard shortcuts
- [ ] Click-to-view details
- [ ] Optimistic UI updates

### Phase 4: Filtering & Views (Week 2-3)
- [ ] Filter panel UI
- [ ] Filter logic implementation
- [ ] View mode switcher
- [ ] Zoom controls
- [ ] Minimap
- [ ] Saved presets

### Phase 5: Resource Management (Week 3)
- [ ] Block/unblock functionality
- [ ] Cleaning timers
- [ ] Equipment tracking
- [ ] Utilization heatmap
- [ ] Analytics dashboard

### Phase 6: Polish & Testing (Week 3-4)
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Accessibility testing
- [ ] User acceptance testing
- [ ] Documentation

---

## Testing Strategy

### Unit Tests
- Grid positioning calculations
- Drag-and-drop logic
- Filter functions
- Utilization calculations

### Integration Tests
- Layout save/load
- Real-time update flow
- Quick actions
- Block/unblock workflow

### E2E Tests
```typescript
describe('Enhanced Floor Plan', () => {
  it('allows admin to edit floor plan layout', async () => {
    await login('clinic_admin');
    await visit('/ops/floor-plan');
    await click('Edit Mode');
    await dragChair('Chair 1', { x: 100, y: 100 });
    await click('Save Layout');
    await expect('Layout saved').toBeVisible();
  });

  it('shows real-time chair status updates', async () => {
    await login('front_desk');
    await visit('/ops/floor-plan');

    // Trigger status change in another window
    await api.seatPatient({ chairId: 'chair1' });

    // Should see update within 2 seconds
    await expect('.chair-1').toHaveClass('occupied', { timeout: 2000 });
  });

  it('allows quick action from floor plan', async () => {
    await login('clinical_staff');
    await visit('/ops/floor-plan');
    await hover('.chair-1');
    await click('[title="Ready for Doctor"]');
    await expect('Marked ready').toBeVisible();
    await expect('.chair-1').toHaveClass('ready-for-doctor');
  });
});
```

### Performance Tests
- Load time with 50 chairs
- SSE connection stability over 8 hours
- Drag performance with 20 rooms
- Filter responsiveness with complex queries

---

## Accessibility Checklist

- [ ] All interactive elements keyboard accessible
- [ ] ARIA labels on all floor plan elements
- [ ] Focus indicators visible
- [ ] Screen reader announcements for status changes
- [ ] High contrast mode support
- [ ] Reduced motion respects user preference
- [ ] Alt text for all icons
- [ ] Keyboard shortcuts documented

---

## Security Considerations

- [ ] All floor plan data scoped by `clinicId`
- [ ] Edit mode requires `ops:configure` permission
- [ ] Block/unblock requires `ops:assign_resources` permission
- [ ] Patient data wrapped in `<PhiProtected>`
- [ ] Audit logging for all layout changes
- [ ] Audit logging for all chair status changes
- [ ] Rate limiting on SSE endpoint
- [ ] CSRF protection on all mutations

---

## Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| Initial load (50 chairs) | < 3s | < 5s |
| SSE update latency | < 2s | < 5s |
| Drag operation FPS | > 30 | > 15 |
| Filter response time | < 500ms | < 1s |
| Layout save time | < 1s | < 2s |
| Memory usage | < 100MB | < 200MB |

---

## Rollout Plan

### Phase 1: Internal Testing (1 week)
- Deploy to staging
- Internal team testing
- Performance benchmarking
- Bug fixes

### Phase 2: Beta Testing (2 weeks)
- Select 2-3 pilot clinics
- Gather feedback
- Iterate on UX
- Monitor performance

### Phase 3: General Release
- Announce feature
- Update documentation
- Provide training materials
- Monitor adoption

---

## Success Metrics

### Quantitative
- 80%+ of clinic admins use edit mode in first month
- < 5% error rate on layout saves
- 95%+ SSE uptime
- < 1% of users revert to old floor plan

### Qualitative
- Positive feedback from beta testers
- Reduced time to seat patients
- Improved visibility into chair status
- Better resource utilization

---

## Open Questions

1. **Template Sharing**: Should clinics be able to share floor plan templates?
2. **Background Images**: Allow uploading actual floor plan images?
3. **Mobile Support**: Full editing on mobile, or view-only?
4. **Multi-Floor**: How to handle multi-story clinics?
5. **Permissions**: Separate permission for edit vs. view?
6. **Export**: What formats for exporting floor plan snapshots?

---

## References

- [Practice Orchestration README](./README.md)
- [Implementation Progress](./IMPLEMENTATION-PROGRESS.md)
- [TECH-STACK.md](../../guides/TECH-STACK.md)
- [STYLING-GUIDE.md](../../guides/STYLING-GUIDE.md)
- [@dnd-kit Documentation](https://docs.dndkit.com/)
- [SSE Guide](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

---

**Created**: 2024-12-05
**Status**: 📋 Planning
**Next Review**: After Phase 1 completion
