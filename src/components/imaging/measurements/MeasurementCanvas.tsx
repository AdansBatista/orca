'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';

import {
  MeasurementToolbar,
  type MeasurementTool,
  type CalibrationSettings,
  DEFAULT_CALIBRATION,
} from './MeasurementToolbar';
import { cn } from '@/lib/utils';

export type PrismaMeasurementType = 'LINEAR' | 'ANGLE' | 'AREA' | 'PERIMETER';

interface Point {
  x: number;
  y: number;
}

export interface StoredMeasurement {
  id?: string;
  type: PrismaMeasurementType;
  points: Point[];
  value: number;
  unit: string;
  label?: string;
  calibration?: number;
}

interface MeasurementCanvasProps {
  imageUrl: string;
  width?: number;
  height?: number;
  measurements?: StoredMeasurement[];
  onMeasurementsChange?: (measurements: StoredMeasurement[]) => void;
  onSave?: (measurements: StoredMeasurement[]) => Promise<void>;
  readOnly?: boolean;
  className?: string;
}

export interface MeasurementCanvasRef {
  getMeasurements: () => StoredMeasurement[];
  loadMeasurements: (measurements: StoredMeasurement[]) => void;
  clear: () => void;
}

// Calculate distance between two points
function calculateDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// Calculate angle between three points (p2 is the vertex)
function calculateAngle(p1: Point, p2: Point, p3: Point): number {
  const angle1 = Math.atan2(p1.y - p2.y, p1.x - p2.x);
  const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
  let angle = Math.abs(angle1 - angle2) * (180 / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

// Calculate polygon area using Shoelace formula
function calculatePolygonArea(points: Point[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
}

// Calculate polygon perimeter
function calculatePerimeter(points: Point[]): number {
  if (points.length < 2) return 0;
  let perimeter = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    perimeter += calculateDistance(points[i], points[j]);
  }
  return perimeter;
}

export const MeasurementCanvas = forwardRef<
  MeasurementCanvasRef,
  MeasurementCanvasProps
>(function MeasurementCanvas(
  {
    imageUrl,
    width,
    height,
    measurements: initialMeasurements = [],
    onMeasurementsChange,
    onSave,
    readOnly = false,
    className,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [activeTool, setActiveTool] = useState<MeasurementTool>('select');
  const [calibration, setCalibration] = useState<CalibrationSettings>(DEFAULT_CALIBRATION);
  const [measurementsVisible, setMeasurementsVisible] = useState(true);
  const [hasSelection, setHasSelection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [measurements, setMeasurements] = useState<StoredMeasurement[]>(initialMeasurements);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1);

  // Load image and set up canvas
  useEffect(() => {
    if (!containerRef.current) return;

    const containerWidth = width || containerRef.current.offsetWidth || 800;
    const containerHeight = height || containerRef.current.offsetHeight || 600;
    setCanvasSize({ width: containerWidth, height: containerHeight });

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      const scale = Math.min(containerWidth / img.width, containerHeight / img.height);
      setImageScale(scale);
      setImageOffset({
        x: (containerWidth - img.width * scale) / 2,
        y: (containerHeight - img.height * scale) / 2,
      });
      draw();
    };
    img.src = imageUrl;
  }, [imageUrl, width, height]);

  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !imageRef.current) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(
      imageRef.current,
      imageOffset.x,
      imageOffset.y,
      imageRef.current.width * imageScale,
      imageRef.current.height * imageScale
    );

    if (!measurementsVisible) return;

    // Draw measurements
    ctx.strokeStyle = '#3b82f6';
    ctx.fillStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.font = '14px sans-serif';

    measurements.forEach((measurement, index) => {
      const isSelected = index === selectedIndex;
      ctx.strokeStyle = isSelected ? '#ef4444' : '#3b82f6';
      ctx.fillStyle = isSelected ? '#ef4444' : '#3b82f6';

      const points = measurement.points;

      switch (measurement.type) {
        case 'LINEAR':
          if (points.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(points[1].x, points[1].y);
            ctx.stroke();

            // Draw endpoints
            points.forEach((p) => {
              ctx.beginPath();
              ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
              ctx.fill();
            });

            // Draw label
            const midX = (points[0].x + points[1].x) / 2;
            const midY = (points[0].y + points[1].y) / 2;
            const unit = calibration.isCalibrated ? 'mm' : 'px';
            const value = calibration.isCalibrated
              ? measurement.value / calibration.pixelsPerMm
              : measurement.value;
            ctx.fillStyle = 'white';
            ctx.fillRect(midX - 30, midY - 10, 60, 20);
            ctx.fillStyle = isSelected ? '#ef4444' : '#3b82f6';
            ctx.textAlign = 'center';
            ctx.fillText(`${value.toFixed(1)} ${unit}`, midX, midY + 5);
          }
          break;

        case 'ANGLE':
          if (points.length >= 3) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(points[1].x, points[1].y);
            ctx.lineTo(points[2].x, points[2].y);
            ctx.stroke();

            // Draw vertices
            points.forEach((p) => {
              ctx.beginPath();
              ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
              ctx.fill();
            });

            // Draw arc at angle vertex
            const angle1 = Math.atan2(points[0].y - points[1].y, points[0].x - points[1].x);
            const angle2 = Math.atan2(points[2].y - points[1].y, points[2].x - points[1].x);
            ctx.beginPath();
            ctx.arc(points[1].x, points[1].y, 20, angle1, angle2);
            ctx.stroke();

            // Draw label
            ctx.fillStyle = 'white';
            ctx.fillRect(points[1].x + 25, points[1].y - 10, 50, 20);
            ctx.fillStyle = isSelected ? '#ef4444' : '#3b82f6';
            ctx.textAlign = 'center';
            ctx.fillText(`${measurement.value.toFixed(1)}°`, points[1].x + 50, points[1].y + 5);
          }
          break;

        case 'AREA':
        case 'PERIMETER':
          if (points.length >= 3) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            points.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
            ctx.closePath();
            ctx.stroke();

            if (measurement.type === 'AREA') {
              ctx.fillStyle = isSelected ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)';
              ctx.fill();
            }

            // Draw vertices
            ctx.fillStyle = isSelected ? '#ef4444' : '#3b82f6';
            points.forEach((p) => {
              ctx.beginPath();
              ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
              ctx.fill();
            });

            // Draw label at centroid
            const centroidX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
            const centroidY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
            const unit = calibration.isCalibrated
              ? measurement.type === 'AREA' ? 'mm²' : 'mm'
              : 'px' + (measurement.type === 'AREA' ? '²' : '');
            let value = measurement.value;
            if (calibration.isCalibrated) {
              value = measurement.type === 'AREA'
                ? value / (calibration.pixelsPerMm * calibration.pixelsPerMm)
                : value / calibration.pixelsPerMm;
            }
            ctx.fillStyle = 'white';
            ctx.fillRect(centroidX - 40, centroidY - 10, 80, 20);
            ctx.fillStyle = isSelected ? '#ef4444' : '#3b82f6';
            ctx.textAlign = 'center';
            ctx.fillText(`${value.toFixed(1)} ${unit}`, centroidX, centroidY + 5);
          }
          break;
      }
    });

    // Draw current points being placed
    if (currentPoints.length > 0) {
      ctx.strokeStyle = '#22c55e';
      ctx.fillStyle = '#22c55e';

      currentPoints.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      if (currentPoints.length > 1) {
        ctx.beginPath();
        ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
        currentPoints.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
        if (activeTool === 'area' && currentPoints.length >= 3) {
          ctx.closePath();
        }
        ctx.stroke();
      }
    }
  }, [measurements, currentPoints, selectedIndex, measurementsVisible, calibration, activeTool, imageOffset, imageScale]);

  // Redraw when state changes
  useEffect(() => {
    draw();
  }, [draw]);

  // Handle canvas click
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (readOnly) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const point: Point = { x, y };

      if (activeTool === 'select') {
        // Check if clicked on a measurement
        let foundIndex: number | null = null;
        measurements.forEach((m, i) => {
          m.points.forEach((p) => {
            if (calculateDistance(p, point) < 10) {
              foundIndex = i;
            }
          });
        });
        setSelectedIndex(foundIndex);
        setHasSelection(foundIndex !== null);
        return;
      }

      // Add point to current measurement
      const newPoints = [...currentPoints, point];
      setCurrentPoints(newPoints);

      // Check if measurement is complete
      let isComplete = false;
      let newMeasurement: StoredMeasurement | null = null;

      switch (activeTool) {
        case 'linear':
          if (newPoints.length >= 2) {
            isComplete = true;
            const value = calculateDistance(newPoints[0], newPoints[1]);
            newMeasurement = {
              type: 'LINEAR',
              points: newPoints.slice(0, 2),
              value,
              unit: calibration.isCalibrated ? 'mm' : 'px',
              calibration: calibration.pixelsPerMm,
            };
          }
          break;

        case 'angle':
          if (newPoints.length >= 3) {
            isComplete = true;
            const value = calculateAngle(newPoints[0], newPoints[1], newPoints[2]);
            newMeasurement = {
              type: 'ANGLE',
              points: newPoints.slice(0, 3),
              value,
              unit: 'degrees',
            };
          }
          break;

        case 'area':
          // Double-click to complete polygon
          if (e.detail === 2 && newPoints.length >= 3) {
            isComplete = true;
            const area = calculatePolygonArea(newPoints);
            newMeasurement = {
              type: 'AREA',
              points: [...newPoints],
              value: area,
              unit: calibration.isCalibrated ? 'mm²' : 'px²',
              calibration: calibration.pixelsPerMm,
            };
          }
          break;
      }

      if (isComplete && newMeasurement) {
        const updated = [...measurements, newMeasurement];
        setMeasurements(updated);
        setCurrentPoints([]);
        onMeasurementsChange?.(updated);
      }
    },
    [activeTool, currentPoints, measurements, calibration, readOnly, onMeasurementsChange]
  );

  // Handle delete
  const handleDelete = useCallback(() => {
    if (selectedIndex === null) return;
    const updated = measurements.filter((_, i) => i !== selectedIndex);
    setMeasurements(updated);
    setSelectedIndex(null);
    setHasSelection(false);
    onMeasurementsChange?.(updated);
  }, [selectedIndex, measurements, onMeasurementsChange]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(measurements);
    } catch (error) {
      console.error('Failed to save measurements:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave, measurements]);

  // Toggle visibility
  const handleToggleVisibility = useCallback(() => {
    setMeasurementsVisible((prev) => !prev);
  }, []);

  // Imperative handle
  useImperativeHandle(ref, () => ({
    getMeasurements: () => measurements,
    loadMeasurements: (newMeasurements: StoredMeasurement[]) => {
      setMeasurements(newMeasurements);
    },
    clear: () => {
      setMeasurements([]);
      setCurrentPoints([]);
      setSelectedIndex(null);
      setHasSelection(false);
    },
  }));

  // Reset current points when tool changes
  useEffect(() => {
    setCurrentPoints([]);
    setSelectedIndex(null);
    setHasSelection(false);
  }, [activeTool]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onClick={handleCanvasClick}
        className="cursor-crosshair"
      />

      {!readOnly && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <MeasurementToolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            calibration={calibration}
            onCalibrationChange={setCalibration}
            onDelete={handleDelete}
            onSave={handleSave}
            measurementsVisible={measurementsVisible}
            onToggleVisibility={handleToggleVisibility}
            hasSelection={hasSelection}
            isSaving={isSaving}
          />
        </div>
      )}

      {/* Instructions */}
      {!readOnly && activeTool !== 'select' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-4 py-2 rounded-lg">
          {activeTool === 'linear' && 'Click two points to measure distance'}
          {activeTool === 'angle' && 'Click three points to measure angle (middle point is vertex)'}
          {activeTool === 'area' && 'Click points to create polygon, double-click to complete'}
        </div>
      )}
    </div>
  );
});
