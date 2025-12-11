'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Upload, AlertCircle, Loader2 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { DicomToolbar } from './DicomToolbar';
import {
  loadDicomFromFile,
  loadDicomFromUrl,
  renderDicomToImageData,
} from './loader';
import type { ViewerState, LoadedDicomImage, DicomTool } from './types';
import { DEFAULT_VIEWER_STATE } from './types';

interface DicomViewerProps {
  /** URL to load DICOM from */
  dicomUrl?: string;
  /** Allow file upload */
  allowUpload?: boolean;
  /** Callback when image is loaded */
  onImageLoad?: (image: LoadedDicomImage) => void;
  /** Height of the viewer */
  height?: string | number;
  /** Show toolbar */
  showToolbar?: boolean;
  /** Initial viewer state */
  initialState?: Partial<ViewerState>;
}

export function DicomViewer({
  dicomUrl,
  allowUpload = true,
  onImageLoad,
  height = '600px',
  showToolbar = true,
  initialState,
}: DicomViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<LoadedDicomImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [viewerState, setViewerState] = useState<ViewerState>({
    ...DEFAULT_VIEWER_STATE,
    ...initialState,
  });

  // Mouse interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialWindowLevel, setInitialWindowLevel] = useState({ center: 0, width: 0 });
  const [initialPan, setInitialPan] = useState({ x: 0, y: 0 });

  // Render image to canvas
  const renderImage = useCallback(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to image size
    canvas.width = image.width;
    canvas.height = image.height;

    // Render with current window/level
    const imageData = renderDicomToImageData(
      image,
      viewerState.windowCenter,
      viewerState.windowWidth,
      viewerState.invert
    );

    ctx.putImageData(imageData, 0, 0);
  }, [image, viewerState.windowCenter, viewerState.windowWidth, viewerState.invert]);

  // Re-render when window/level changes
  useEffect(() => {
    renderImage();
  }, [renderImage]);

  // Load DICOM from URL
  useEffect(() => {
    if (dicomUrl) {
      loadFromUrl(dicomUrl);
    }
  }, [dicomUrl]);

  const loadFromUrl = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setLoadProgress(0);

    try {
      const loadedImage = await loadDicomFromUrl(url, setLoadProgress);
      setImage(loadedImage);
      setViewerState((prev) => ({
        ...prev,
        windowCenter: loadedImage.windowCenter,
        windowWidth: loadedImage.windowWidth,
      }));
      onImageLoad?.(loadedImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load DICOM');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setLoadProgress(0);

    try {
      const loadedImage = await loadDicomFromFile(file, setLoadProgress);
      setImage(loadedImage);
      setViewerState((prev) => ({
        ...prev,
        windowCenter: loadedImage.windowCenter,
        windowWidth: loadedImage.windowWidth,
      }));
      onImageLoad?.(loadedImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load DICOM file');
    } finally {
      setIsLoading(false);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setLoadProgress(0);

    try {
      const loadedImage = await loadDicomFromFile(file, setLoadProgress);
      setImage(loadedImage);
      setViewerState((prev) => ({
        ...prev,
        windowCenter: loadedImage.windowCenter,
        windowWidth: loadedImage.windowWidth,
      }));
      onImageLoad?.(loadedImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load DICOM file');
    } finally {
      setIsLoading(false);
    }
  };

  // Toolbar handlers
  const handleWindowLevelChange = useCallback((center: number, width: number) => {
    setViewerState((prev) => ({ ...prev, windowCenter: center, windowWidth: width }));
  }, []);

  const handleZoomChange = useCallback((zoom: number) => {
    setViewerState((prev) => ({ ...prev, zoom: Math.max(0.1, Math.min(10, zoom)) }));
  }, []);

  const handleRotate = useCallback((degrees: number) => {
    setViewerState((prev) => ({ ...prev, rotation: (prev.rotation + degrees) % 360 }));
  }, []);

  const handleFlipHorizontal = useCallback(() => {
    setViewerState((prev) => ({ ...prev, flipHorizontal: !prev.flipHorizontal }));
  }, []);

  const handleFlipVertical = useCallback(() => {
    setViewerState((prev) => ({ ...prev, flipVertical: !prev.flipVertical }));
  }, []);

  const handleInvert = useCallback(() => {
    setViewerState((prev) => ({ ...prev, invert: !prev.invert }));
  }, []);

  const handleToolChange = useCallback((tool: DicomTool) => {
    setViewerState((prev) => ({ ...prev, activeTool: tool }));
  }, []);

  const handleResetView = useCallback(() => {
    if (image) {
      setViewerState({
        ...DEFAULT_VIEWER_STATE,
        windowCenter: image.windowCenter,
        windowWidth: image.windowWidth,
      });
    }
  }, [image]);

  const handleFitToWindow = useCallback(() => {
    if (!image || !containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight - (showToolbar ? 52 : 0);

    const scaleX = containerWidth / image.width;
    const scaleY = containerHeight / image.height;
    const scale = Math.min(scaleX, scaleY) * 0.95;

    setViewerState((prev) => ({
      ...prev,
      zoom: scale,
      panX: 0,
      panY: 0,
    }));
  }, [image, showToolbar]);

  // Mouse handlers for interaction
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!image) return;

      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setInitialWindowLevel({
        center: viewerState.windowCenter,
        width: viewerState.windowWidth,
      });
      setInitialPan({ x: viewerState.panX, y: viewerState.panY });
    },
    [image, viewerState]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !image) return;

      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      if (viewerState.activeTool === 'windowLevel') {
        // Horizontal = width, Vertical = center
        const newWidth = Math.max(1, initialWindowLevel.width + dx * 2);
        const newCenter = initialWindowLevel.center - dy * 2;
        handleWindowLevelChange(newCenter, newWidth);
      } else if (viewerState.activeTool === 'pan') {
        setViewerState((prev) => ({
          ...prev,
          panX: initialPan.x + dx,
          panY: initialPan.y + dy,
        }));
      } else if (viewerState.activeTool === 'zoom') {
        const zoomDelta = 1 + dy * -0.005;
        handleZoomChange(viewerState.zoom * zoomDelta);
      }
    },
    [
      isDragging,
      dragStart,
      image,
      viewerState.activeTool,
      viewerState.zoom,
      initialWindowLevel,
      initialPan,
      handleWindowLevelChange,
      handleZoomChange,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      handleZoomChange(viewerState.zoom * delta);
    },
    [viewerState.zoom, handleZoomChange]
  );

  // Canvas transform style
  const canvasStyle = useMemo(() => {
    const transforms: string[] = [];

    if (viewerState.rotation !== 0) {
      transforms.push(`rotate(${viewerState.rotation}deg)`);
    }
    if (viewerState.flipHorizontal) {
      transforms.push('scaleX(-1)');
    }
    if (viewerState.flipVertical) {
      transforms.push('scaleY(-1)');
    }

    return {
      transform: `scale(${viewerState.zoom}) ${transforms.join(' ')}`,
      transformOrigin: 'center center',
      marginLeft: viewerState.panX,
      marginTop: viewerState.panY,
    };
  }, [viewerState]);

  // Get cursor based on tool
  const getCursor = () => {
    switch (viewerState.activeTool) {
      case 'pan':
        return isDragging ? 'grabbing' : 'grab';
      case 'zoom':
        return 'zoom-in';
      case 'windowLevel':
        return 'crosshair';
      case 'measure':
        return 'crosshair';
      default:
        return 'default';
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col bg-black"
      style={{ height }}
    >
      {/* Toolbar */}
      {showToolbar && (
        <DicomToolbar
          viewerState={viewerState}
          image={image}
          onWindowLevelChange={handleWindowLevelChange}
          onZoomChange={handleZoomChange}
          onRotate={handleRotate}
          onFlipHorizontal={handleFlipHorizontal}
          onFlipVertical={handleFlipVertical}
          onInvert={handleInvert}
          onResetView={handleResetView}
          onToolChange={handleToolChange}
          onFitToWindow={handleFitToWindow}
        />
      )}

      {/* Viewer Area */}
      <div
        className="flex-1 relative overflow-hidden flex items-center justify-center"
        onDrop={allowUpload ? handleDrop : undefined}
        onDragOver={(e) => e.preventDefault()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: getCursor() }}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-white mb-2">Loading DICOM...</p>
            <Progress value={loadProgress} className="w-48" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* No Image / Upload State */}
        {!image && !isLoading && !error && allowUpload && (
          <Card className="max-w-md bg-gray-900 border-gray-700">
            <CardContent className="p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-gray-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Load DICOM Image
              </h3>
              <p className="text-gray-400 mb-4">
                Drag and drop a DICOM file here, or click to select.
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="secondary"
              >
                Select File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".dcm,.dicom,application/dicom"
                onChange={handleFileSelect}
                className="hidden"
              />
            </CardContent>
          </Card>
        )}

        {/* Canvas */}
        {image && !isLoading && (
          <canvas
            ref={canvasRef}
            style={canvasStyle}
            className="max-w-full max-h-full"
          />
        )}

        {/* Window/Level Overlay */}
        {image && (
          <div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs px-2 py-1 rounded">
            W: {Math.round(viewerState.windowWidth)} | L: {Math.round(viewerState.windowCenter)}
          </div>
        )}

        {/* Zoom Overlay */}
        {image && (
          <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {Math.round(viewerState.zoom * 100)}%
          </div>
        )}
      </div>

      {/* Hidden file input */}
      {allowUpload && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".dcm,.dicom,application/dicom"
          onChange={handleFileSelect}
          className="hidden"
        />
      )}
    </div>
  );
}
