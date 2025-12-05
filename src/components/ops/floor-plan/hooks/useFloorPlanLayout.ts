import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  FloorPlanLayout,
  ChairPosition,
  RoomBoundary,
  GridConfig,
  LayoutHistoryEntry,
} from '@/types/floor-plan';
import { DEFAULT_GRID_CONFIG, validateLayout, snapToGrid, clampToGrid } from '@/lib/utils/floor-plan';
import { toast } from 'sonner';

const MAX_HISTORY = 50;

interface UseFloorPlanLayoutProps {
  clinicId: string;
  initialLayout?: FloorPlanLayout;
  onSave?: (layout: FloorPlanLayout) => Promise<void>;
}

export function useFloorPlanLayout({ clinicId, initialLayout, onSave }: UseFloorPlanLayoutProps) {
  // Edit mode state
  const [editMode, setEditMode] = useState(false);

  // Layout state
  const [layout, setLayout] = useState<FloorPlanLayout>(
    initialLayout || {
      name: 'Default Layout',
      gridConfig: DEFAULT_GRID_CONFIG,
      rooms: [],
      chairs: [],
    }
  );

  // History for undo/redo
  const [history, setHistory] = useState<LayoutHistoryEntry[]>([
    {
      layout: layout,
      timestamp: Date.now(),
      action: 'initial',
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track if layout has been initialized
  const initializedRef = useRef(false);

  // Update layout when initialLayout changes (e.g., from API)
  useEffect(() => {
    if (initialLayout && !initializedRef.current) {
      setLayout(initialLayout);
      setHistory([
        {
          layout: initialLayout,
          timestamp: Date.now(),
          action: 'loaded',
        },
      ]);
      setHistoryIndex(0);
      initializedRef.current = true;
    }
  }, [initialLayout]);

  // =============================================================================
  // HISTORY MANAGEMENT
  // =============================================================================

  const addToHistory = useCallback(
    (newLayout: FloorPlanLayout, action: string) => {
      setHistory((prev) => {
        // Remove any history after current index (when making changes after undo)
        const newHistory = prev.slice(0, historyIndex + 1);

        // Add new entry
        newHistory.push({
          layout: newLayout,
          timestamp: Date.now(),
          action,
        });

        // Limit history size
        if (newHistory.length > MAX_HISTORY) {
          return newHistory.slice(newHistory.length - MAX_HISTORY);
        }

        return newHistory;
      });

      setHistoryIndex((prev) => {
        const newHistory = history.slice(0, prev + 1);
        return Math.min(newHistory.length, MAX_HISTORY - 1);
      });

      setHasUnsavedChanges(true);
    },
    [historyIndex, history]
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setLayout(history[newIndex].layout);
      setHasUnsavedChanges(true);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setLayout(history[newIndex].layout);
      setHasUnsavedChanges(true);
    }
  }, [historyIndex, history]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // =============================================================================
  // LAYOUT MODIFICATIONS
  // =============================================================================

  const updateChairPosition = useCallback(
    (chairId: string, position: { x: number; y: number }) => {
      const snapped = snapToGrid(position, layout.gridConfig);
      const clamped = clampToGrid(snapped, layout.gridConfig);

      const newLayout: FloorPlanLayout = {
        ...layout,
        chairs: layout.chairs.map((chair) =>
          chair.chairId === chairId ? { ...chair, ...clamped } : chair
        ),
      };

      // Validate before applying
      const validation = validateLayout(newLayout, layout.gridConfig);
      if (!validation.valid) {
        toast.error(`Cannot move chair: ${validation.errors[0]}`);
        return false;
      }

      setLayout(newLayout);
      addToHistory(newLayout, `move_chair_${chairId}`);
      return true;
    },
    [layout, addToHistory]
  );

  const updateRoomBoundary = useCallback(
    (roomId: string, boundary: Partial<RoomBoundary>) => {
      const newLayout: FloorPlanLayout = {
        ...layout,
        rooms: layout.rooms.map((room) =>
          room.roomId === roomId ? { ...room, ...boundary } : room
        ),
      };

      // Validate before applying
      const validation = validateLayout(newLayout, layout.gridConfig);
      if (!validation.valid) {
        toast.error(`Cannot update room: ${validation.errors[0]}`);
        return false;
      }

      setLayout(newLayout);
      addToHistory(newLayout, `update_room_${roomId}`);
      return true;
    },
    [layout, addToHistory]
  );

  const rotateChair = useCallback(
    (chairId: string) => {
      const newLayout: FloorPlanLayout = {
        ...layout,
        chairs: layout.chairs.map((chair) =>
          chair.chairId === chairId
            ? {
                ...chair,
                rotation: ((chair.rotation + 90) % 360) as 0 | 90 | 180 | 270,
              }
            : chair
        ),
      };

      setLayout(newLayout);
      addToHistory(newLayout, `rotate_chair_${chairId}`);
    },
    [layout, addToHistory]
  );

  const addChair = useCallback(
    (chair: ChairPosition) => {
      const snapped = snapToGrid(chair, layout.gridConfig);
      const clamped = clampToGrid(snapped, layout.gridConfig);

      const newLayout: FloorPlanLayout = {
        ...layout,
        chairs: [...layout.chairs, { ...chair, ...clamped }],
      };

      // Validate before applying
      const validation = validateLayout(newLayout, layout.gridConfig);
      if (!validation.valid) {
        toast.error(`Cannot add chair: ${validation.errors[0]}`);
        return false;
      }

      setLayout(newLayout);
      addToHistory(newLayout, `add_chair_${chair.chairId}`);
      return true;
    },
    [layout, addToHistory]
  );

  const removeChair = useCallback(
    (chairId: string) => {
      const newLayout: FloorPlanLayout = {
        ...layout,
        chairs: layout.chairs.filter((chair) => chair.chairId !== chairId),
      };

      setLayout(newLayout);
      addToHistory(newLayout, `remove_chair_${chairId}`);
    },
    [layout, addToHistory]
  );

  const addRoom = useCallback(
    (room: RoomBoundary) => {
      const newLayout: FloorPlanLayout = {
        ...layout,
        rooms: [...layout.rooms, room],
      };

      // Validate before applying
      const validation = validateLayout(newLayout, layout.gridConfig);
      if (!validation.valid) {
        toast.error(`Cannot add room: ${validation.errors[0]}`);
        return false;
      }

      setLayout(newLayout);
      addToHistory(newLayout, `add_room_${room.roomId}`);
      return true;
    },
    [layout, addToHistory]
  );

  const removeRoom = useCallback(
    (roomId: string) => {
      const newLayout: FloorPlanLayout = {
        ...layout,
        rooms: layout.rooms.filter((room) => room.roomId !== roomId),
      };

      setLayout(newLayout);
      addToHistory(newLayout, `remove_room_${roomId}`);
    },
    [layout, addToHistory]
  );

  const updateGridConfig = useCallback(
    (config: Partial<GridConfig>) => {
      const newLayout: FloorPlanLayout = {
        ...layout,
        gridConfig: { ...layout.gridConfig, ...config },
      };

      setLayout(newLayout);
      addToHistory(newLayout, 'update_grid_config');
    },
    [layout, addToHistory]
  );

  // =============================================================================
  // SAVE & LOAD
  // =============================================================================

  const saveLayout = useCallback(async () => {
    if (!onSave) {
      toast.error('Save function not provided');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(layout);
      setHasUnsavedChanges(false);
      toast.success('Floor plan saved successfully');
    } catch (error) {
      toast.error('Failed to save floor plan');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  }, [layout, onSave]);

  const loadTemplate = useCallback((templateLayout: FloorPlanLayout) => {
    setLayout(templateLayout);
    setHistory([
      {
        layout: templateLayout,
        timestamp: Date.now(),
        action: 'load_template',
      },
    ]);
    setHistoryIndex(0);
    setHasUnsavedChanges(true);
    toast.success('Template loaded');
  }, []);

  const resetLayout = useCallback(() => {
    if (initialLayout) {
      setLayout(initialLayout);
      setHistory([
        {
          layout: initialLayout,
          timestamp: Date.now(),
          action: 'reset',
        },
      ]);
      setHistoryIndex(0);
      setHasUnsavedChanges(false);
      toast.success('Layout reset to saved version');
    }
  }, [initialLayout]);

  // =============================================================================
  // EDIT MODE
  // =============================================================================

  const toggleEditMode = useCallback(() => {
    if (editMode && hasUnsavedChanges) {
      // Prompt to save before exiting edit mode
      const confirmExit = window.confirm('You have unsaved changes. Do you want to save before exiting edit mode?');
      if (confirmExit) {
        saveLayout();
      }
    }
    setEditMode(!editMode);
  }, [editMode, hasUnsavedChanges, saveLayout]);

  return {
    // State
    layout,
    editMode,
    isSaving,
    hasUnsavedChanges,

    // History
    canUndo,
    canRedo,
    undo,
    redo,

    // Layout modifications
    updateChairPosition,
    updateRoomBoundary,
    rotateChair,
    addChair,
    removeChair,
    addRoom,
    removeRoom,
    updateGridConfig,

    // Actions
    saveLayout,
    loadTemplate,
    resetLayout,
    setEditMode: toggleEditMode,
  };
}
