'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type {
  PlacedLandmark,
  CephLandmark,
  CephToolState,
} from './types';
import {
  CEPH_LANDMARKS,
  LANDMARK_COLORS,
  getLandmarkById,
} from './types';
import { getDrawableLines, type ReferenceLine } from './calculations';

interface CephCanvasProps {
  imageUrl: string;
  placedLandmarks: PlacedLandmark[];
  toolState: CephToolState;
  onLandmarkPlace: (landmark: PlacedLandmark) => void;
  onLandmarkMove: (landmarkId: string, x: number, y: number) => void;
  onLandmarkSelect: (landmarkId: string | null) => void;
  onPan: (dx: number, dy: number) => void;
  calibrationMode?: boolean;
  onCalibrationPoints?: (p1: { x: number; y: number }, p2: { x: number; y: number }) => void;
}

const LANDMARK_RADIUS = 6;
const LANDMARK_HIT_RADIUS = 12;

export function CephCanvas({
  imageUrl,
  placedLandmarks,
  toolState,
  onLandmarkPlace,
  onLandmarkMove,
  onLandmarkSelect,
  onPan,
  calibrationMode = false,
  onCalibrationPoints,
}: CephCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedLandmark, setDraggedLandmark] = useState<string | null>(null);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [calibrationPoint1, setCalibrationPoint1] = useState<{ x: number; y: number } | null>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setImageDimensions({ width: img.width, height: img.height });
      setImageLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Convert screen coordinates to image coordinates
  const screenToImage = useCallback(
    (screenX: number, screenY: number): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const x = (screenX - rect.left - toolState.panOffset.x) / toolState.zoomLevel;
      const y = (screenY - rect.top - toolState.panOffset.y) / toolState.zoomLevel;

      return { x, y };
    },
    [toolState.panOffset, toolState.zoomLevel]
  );

  // Convert image coordinates to screen coordinates
  const imageToScreen = useCallback(
    (imgX: number, imgY: number): { x: number; y: number } => {
      const x = imgX * toolState.zoomLevel + toolState.panOffset.x;
      const y = imgY * toolState.zoomLevel + toolState.panOffset.y;
      return { x, y };
    },
    [toolState.panOffset, toolState.zoomLevel]
  );

  // Find landmark at position
  const findLandmarkAtPosition = useCallback(
    (screenX: number, screenY: number): string | null => {
      const imgPos = screenToImage(screenX, screenY);

      for (const landmark of placedLandmarks) {
        const dx = landmark.x - imgPos.x;
        const dy = landmark.y - imgPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= LANDMARK_HIT_RADIUS / toolState.zoomLevel) {
          return landmark.landmarkId;
        }
      }

      return null;
    },
    [placedLandmarks, screenToImage, toolState.zoomLevel]
  );

  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;

    if (!canvas || !ctx || !img || !imageLoaded) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save state
    ctx.save();

    // Apply transformations
    ctx.translate(toolState.panOffset.x, toolState.panOffset.y);
    ctx.scale(toolState.zoomLevel, toolState.zoomLevel);

    // Draw image
    ctx.drawImage(img, 0, 0);

    // Draw reference lines
    if (toolState.showLines) {
      const lines = getDrawableLines(placedLandmarks);
      for (const { line, from, to } of lines) {
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 2 / toolState.zoomLevel;
        ctx.setLineDash([5 / toolState.zoomLevel, 5 / toolState.zoomLevel]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw landmarks
    for (const placed of placedLandmarks) {
      const landmark = getLandmarkById(placed.landmarkId);
      if (!landmark) continue;

      const color = LANDMARK_COLORS[landmark.category];
      const isSelected = toolState.selectedLandmarkId === placed.landmarkId;
      const radius = LANDMARK_RADIUS / toolState.zoomLevel;

      // Draw point
      ctx.beginPath();
      ctx.arc(placed.x, placed.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / toolState.zoomLevel;
        ctx.stroke();

        // Draw selection ring
        ctx.beginPath();
        ctx.arc(placed.x, placed.y, radius + 4 / toolState.zoomLevel, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 / toolState.zoomLevel;
        ctx.stroke();
      }

      // Draw label
      if (toolState.showLabels) {
        ctx.font = `${12 / toolState.zoomLevel}px sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(
          landmark.abbreviation,
          placed.x,
          placed.y - radius - 4 / toolState.zoomLevel
        );
      }
    }

    // Draw calibration line if in calibration mode
    if (calibrationMode && calibrationPoint1) {
      const mousePos = screenToImage(lastMousePos.x, lastMousePos.y);

      ctx.beginPath();
      ctx.moveTo(calibrationPoint1.x, calibrationPoint1.y);
      ctx.lineTo(mousePos.x, mousePos.y);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2 / toolState.zoomLevel;
      ctx.stroke();

      // Draw points
      ctx.beginPath();
      ctx.arc(calibrationPoint1.x, calibrationPoint1.y, 4 / toolState.zoomLevel, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
    }

    // Restore state
    ctx.restore();
  }, [
    imageLoaded,
    placedLandmarks,
    toolState,
    calibrationMode,
    calibrationPoint1,
    lastMousePos,
    screenToImage,
  ]);

  // Redraw on changes
  useEffect(() => {
    draw();
  }, [draw]);

  // Resize canvas to container
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;

    if (!container || !canvas) return;

    const resizeObserver = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      draw();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [draw]);

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX;
      const screenY = e.clientY;

      setLastMousePos({ x: screenX, y: screenY });

      if (toolState.activeTool === 'SELECT') {
        const landmarkId = findLandmarkAtPosition(screenX, screenY);
        if (landmarkId) {
          setDraggedLandmark(landmarkId);
          onLandmarkSelect(landmarkId);
        } else {
          onLandmarkSelect(null);
        }
        setIsDragging(true);
      } else if (toolState.activeTool === 'PLACE' && toolState.placingLandmarkId) {
        const imgPos = screenToImage(screenX, screenY);
        onLandmarkPlace({
          landmarkId: toolState.placingLandmarkId,
          x: imgPos.x,
          y: imgPos.y,
        });
      } else if (toolState.activeTool === 'PAN') {
        setIsDragging(true);
      } else if (toolState.activeTool === 'CALIBRATE' || calibrationMode) {
        const imgPos = screenToImage(screenX, screenY);
        if (!calibrationPoint1) {
          setCalibrationPoint1(imgPos);
        } else {
          if (onCalibrationPoints) {
            onCalibrationPoints(calibrationPoint1, imgPos);
          }
          setCalibrationPoint1(null);
        }
      }
    },
    [
      toolState,
      findLandmarkAtPosition,
      onLandmarkSelect,
      onLandmarkPlace,
      screenToImage,
      calibrationMode,
      calibrationPoint1,
      onCalibrationPoints,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const screenX = e.clientX;
      const screenY = e.clientY;

      setLastMousePos({ x: screenX, y: screenY });

      if (!isDragging) return;

      const dx = screenX - lastMousePos.x;
      const dy = screenY - lastMousePos.y;

      if (toolState.activeTool === 'SELECT' && draggedLandmark) {
        const imgPos = screenToImage(screenX, screenY);
        onLandmarkMove(draggedLandmark, imgPos.x, imgPos.y);
      } else if (toolState.activeTool === 'PAN' || (toolState.activeTool === 'SELECT' && !draggedLandmark)) {
        onPan(dx, dy);
      }
    },
    [
      isDragging,
      lastMousePos,
      toolState.activeTool,
      draggedLandmark,
      screenToImage,
      onLandmarkMove,
      onPan,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedLandmark(null);
  }, []);

  // Cursor style based on tool
  const getCursor = (): string => {
    if (calibrationMode) return 'crosshair';
    switch (toolState.activeTool) {
      case 'SELECT':
        return draggedLandmark ? 'grabbing' : 'default';
      case 'PLACE':
        return 'crosshair';
      case 'CALIBRATE':
        return 'crosshair';
      case 'PAN':
        return isDragging ? 'grabbing' : 'grab';
      case 'ZOOM':
        return 'zoom-in';
      default:
        return 'default';
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden"
      style={{ cursor: getCursor() }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="absolute inset-0"
      />

      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}
