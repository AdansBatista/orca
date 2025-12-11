'use client';

import { useState, useCallback, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TooltipProvider } from '@/components/ui/tooltip';

import { CephToolbar } from './CephToolbar';
import { CephCanvas } from './CephCanvas';
import { CephMeasurementsPanel } from './CephMeasurementsPanel';
import { calculateAllMeasurements, calculateCalibration, CALIBRATION_STANDARDS } from './calculations';
import type {
  PlacedLandmark,
  CephToolState,
  CephTool,
  CephAnalysisPreset,
  CephLandmark,
  CalculatedMeasurement,
  CephAnalysisState,
} from './types';
import { ANALYSIS_PRESETS, CEPH_LANDMARKS } from './types';

interface CephAnalysisProps {
  imageUrl: string;
  imageId: string;
  patientId: string;
  clinicId: string;
  initialAnalysis?: CephAnalysisState;
  onSave?: (analysis: CephAnalysisState) => Promise<void>;
  onExport?: (analysis: CephAnalysisState) => void;
}

export function CephAnalysis({
  imageUrl,
  imageId,
  patientId,
  clinicId,
  initialAnalysis,
  onSave,
  onExport,
}: CephAnalysisProps) {
  // State
  const [placedLandmarks, setPlacedLandmarks] = useState<PlacedLandmark[]>(
    initialAnalysis?.landmarks || []
  );
  const [selectedPreset, setSelectedPreset] = useState<CephAnalysisPreset | null>(
    initialAnalysis?.presetId
      ? ANALYSIS_PRESETS.find((p) => p.id === initialAnalysis.presetId) || ANALYSIS_PRESETS[0]
      : ANALYSIS_PRESETS[0]
  );
  const [calibration, setCalibration] = useState<number>(
    initialAnalysis?.calibration || 1
  );
  const [toolState, setToolState] = useState<CephToolState>({
    activeTool: 'SELECT',
    selectedLandmarkId: null,
    placingLandmarkId: null,
    zoomLevel: 1,
    panOffset: { x: 0, y: 0 },
    showLabels: true,
    showLines: true,
    showMeasurements: true,
  });

  // Calibration dialog
  const [calibrationDialogOpen, setCalibrationDialogOpen] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState<{
    p1: { x: number; y: number };
    p2: { x: number; y: number };
  } | null>(null);
  const [calibrationDistance, setCalibrationDistance] = useState('');
  const [calibrationPreset, setCalibrationPreset] = useState('');

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Calculate measurements
  const measurements = useMemo<CalculatedMeasurement[]>(() => {
    return calculateAllMeasurements(
      placedLandmarks,
      calibration,
      selectedPreset?.measurements
    );
  }, [placedLandmarks, calibration, selectedPreset]);

  // Tool handlers
  const handleToolChange = useCallback((tool: CephTool) => {
    setToolState((prev) => ({
      ...prev,
      activeTool: tool,
      placingLandmarkId: tool === 'PLACE' ? prev.placingLandmarkId : null,
    }));
  }, []);

  const handleZoomIn = useCallback(() => {
    setToolState((prev) => ({
      ...prev,
      zoomLevel: Math.min(prev.zoomLevel * 1.2, 5),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setToolState((prev) => ({
      ...prev,
      zoomLevel: Math.max(prev.zoomLevel / 1.2, 0.2),
    }));
  }, []);

  const handleResetView = useCallback(() => {
    setToolState((prev) => ({
      ...prev,
      zoomLevel: 1,
      panOffset: { x: 0, y: 0 },
    }));
  }, []);

  const handleToggleLabels = useCallback(() => {
    setToolState((prev) => ({ ...prev, showLabels: !prev.showLabels }));
  }, []);

  const handleToggleLines = useCallback(() => {
    setToolState((prev) => ({ ...prev, showLines: !prev.showLines }));
  }, []);

  const handleToggleMeasurements = useCallback(() => {
    setToolState((prev) => ({
      ...prev,
      showMeasurements: !prev.showMeasurements,
    }));
  }, []);

  const handlePresetChange = useCallback((preset: CephAnalysisPreset) => {
    setSelectedPreset(preset);
  }, []);

  const handleLandmarkSelect = useCallback((landmark: CephLandmark | null) => {
    setToolState((prev) => ({
      ...prev,
      placingLandmarkId: landmark?.id || null,
    }));
  }, []);

  // Canvas handlers
  const handleLandmarkPlace = useCallback((landmark: PlacedLandmark) => {
    setPlacedLandmarks((prev) => {
      // Remove existing placement of same landmark
      const filtered = prev.filter((l) => l.landmarkId !== landmark.landmarkId);
      return [...filtered, landmark];
    });

    // Auto-advance to next unplaced landmark in sequence
    if (selectedPreset) {
      const currentIndex = selectedPreset.landmarks.indexOf(landmark.landmarkId);
      const nextUnplaced = selectedPreset.landmarks.find((id, i) => {
        if (i <= currentIndex) return false;
        return !placedLandmarks.some((l) => l.landmarkId === id);
      });

      if (nextUnplaced) {
        setToolState((prev) => ({
          ...prev,
          placingLandmarkId: nextUnplaced,
        }));
      }
    }
  }, [selectedPreset, placedLandmarks]);

  const handleLandmarkMove = useCallback(
    (landmarkId: string, x: number, y: number) => {
      setPlacedLandmarks((prev) =>
        prev.map((l) =>
          l.landmarkId === landmarkId ? { ...l, x, y } : l
        )
      );
    },
    []
  );

  const handleLandmarkSelectOnCanvas = useCallback((landmarkId: string | null) => {
    setToolState((prev) => ({
      ...prev,
      selectedLandmarkId: landmarkId,
    }));
  }, []);

  const handlePan = useCallback((dx: number, dy: number) => {
    setToolState((prev) => ({
      ...prev,
      panOffset: {
        x: prev.panOffset.x + dx,
        y: prev.panOffset.y + dy,
      },
    }));
  }, []);

  // Calibration handlers
  const handleCalibrate = useCallback(() => {
    setToolState((prev) => ({
      ...prev,
      activeTool: 'CALIBRATE',
    }));
  }, []);

  const handleCalibrationPoints = useCallback(
    (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
      setCalibrationPoints({ p1, p2 });
      setCalibrationDialogOpen(true);
      setToolState((prev) => ({
        ...prev,
        activeTool: 'SELECT',
      }));
    },
    []
  );

  const handleCalibrationConfirm = useCallback(() => {
    if (!calibrationPoints) return;

    let distance = parseFloat(calibrationDistance);
    if (calibrationPreset && calibrationPreset !== 'custom') {
      distance = parseFloat(calibrationPreset);
    }

    if (isNaN(distance) || distance <= 0) return;

    const newCalibration = calculateCalibration(
      calibrationPoints.p1,
      calibrationPoints.p2,
      distance
    );

    setCalibration(newCalibration);
    setCalibrationDialogOpen(false);
    setCalibrationPoints(null);
    setCalibrationDistance('');
    setCalibrationPreset('');
  }, [calibrationPoints, calibrationDistance, calibrationPreset]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      const analysis: CephAnalysisState = {
        imageId,
        patientId,
        clinicId,
        presetId: selectedPreset?.id || 'QUICK',
        landmarks: placedLandmarks,
        measurements,
        calibration,
      };

      await onSave(analysis);
    } finally {
      setIsSaving(false);
    }
  }, [
    onSave,
    imageId,
    patientId,
    clinicId,
    selectedPreset,
    placedLandmarks,
    measurements,
    calibration,
  ]);

  // Export handler
  const handleExport = useCallback(() => {
    if (!onExport) return;

    const analysis: CephAnalysisState = {
      imageId,
      patientId,
      clinicId,
      presetId: selectedPreset?.id || 'QUICK',
      landmarks: placedLandmarks,
      measurements,
      calibration,
    };

    onExport(analysis);
  }, [
    onExport,
    imageId,
    patientId,
    clinicId,
    selectedPreset,
    placedLandmarks,
    measurements,
    calibration,
  ]);

  // Landmark click from measurements panel
  const handleLandmarkClickFromPanel = useCallback((landmarkId: string) => {
    const landmark = CEPH_LANDMARKS.find((l) => l.id === landmarkId);
    if (landmark) {
      setToolState((prev) => ({
        ...prev,
        activeTool: 'PLACE',
        placingLandmarkId: landmarkId,
      }));
    }
  }, []);

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <CephToolbar
          toolState={toolState}
          onToolChange={handleToolChange}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
          onToggleLabels={handleToggleLabels}
          onToggleLines={handleToggleLines}
          onToggleMeasurements={handleToggleMeasurements}
          selectedPreset={selectedPreset}
          onPresetChange={handlePresetChange}
          placedLandmarks={placedLandmarks}
          onLandmarkSelect={handleLandmarkSelect}
          onExport={onExport ? handleExport : undefined}
          onCalibrate={handleCalibrate}
        />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 relative">
            <CephCanvas
              imageUrl={imageUrl}
              placedLandmarks={placedLandmarks}
              toolState={toolState}
              onLandmarkPlace={handleLandmarkPlace}
              onLandmarkMove={handleLandmarkMove}
              onLandmarkSelect={handleLandmarkSelectOnCanvas}
              onPan={handlePan}
              calibrationMode={toolState.activeTool === 'CALIBRATE'}
              onCalibrationPoints={handleCalibrationPoints}
            />
          </div>

          {/* Measurements Panel */}
          {toolState.showMeasurements && (
            <div className="w-80 border-l bg-background">
              <CephMeasurementsPanel
                measurements={measurements}
                placedLandmarks={placedLandmarks}
                preset={selectedPreset}
                onLandmarkClick={handleLandmarkClickFromPanel}
              />
            </div>
          )}
        </div>

        {/* Save Button */}
        {onSave && (
          <div className="p-4 border-t flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPlacedLandmarks([]);
              }}
            >
              Clear All
            </Button>
            <Button onClick={handleSave} loading={isSaving}>
              Save Analysis
            </Button>
          </div>
        )}

        {/* Calibration Dialog */}
        <Dialog open={calibrationDialogOpen} onOpenChange={setCalibrationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Calibration</DialogTitle>
              <DialogDescription>
                Enter the known distance between the two points you marked on
                the image to calibrate measurements.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Preset Distance</Label>
                <Select value={calibrationPreset} onValueChange={setCalibrationPreset}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a standard distance" />
                  </SelectTrigger>
                  <SelectContent>
                    {CALIBRATION_STANDARDS.map((std) => (
                      <SelectItem
                        key={std.value}
                        value={std.value === 0 ? 'custom' : std.value.toString()}
                      >
                        {std.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {calibrationPreset === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="calibration-distance">
                    Custom Distance (mm)
                  </Label>
                  <Input
                    id="calibration-distance"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={calibrationDistance}
                    onChange={(e) => setCalibrationDistance(e.target.value)}
                    placeholder="Enter distance in mm"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCalibrationDialogOpen(false);
                  setCalibrationPoints(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCalibrationConfirm}
                disabled={
                  !calibrationPreset ||
                  (calibrationPreset === 'custom' && !calibrationDistance)
                }
              >
                Apply Calibration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
