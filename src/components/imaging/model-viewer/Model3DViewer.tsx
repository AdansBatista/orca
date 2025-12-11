'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Upload, AlertCircle, Loader2 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TooltipProvider } from '@/components/ui/tooltip';

import { Model3DToolbar } from './Model3DToolbar';
import { loadModel, loadModelFromFile, normalizeGeometry } from './loaders';
import type {
  ViewerState,
  ViewPreset,
  RenderMode,
  MaterialPreset,
  LoadedModel,
  Model3DFormat,
} from './types';
import {
  DEFAULT_VIEWER_STATE,
  VIEW_PRESET_POSITIONS,
  MATERIAL_PRESETS,
  detectFormat,
} from './types';

// Dynamically import the 3D canvas to avoid SSR issues
const Model3DCanvas = dynamic(
  () => import('./Model3DCanvas').then((mod) => mod.Model3DCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
  }
);

interface Model3DViewerProps {
  /** URL to load model from */
  modelUrl?: string;
  /** Format of the model file */
  format?: Model3DFormat;
  /** Allow file upload */
  allowUpload?: boolean;
  /** Callback when model is loaded */
  onModelLoad?: (model: LoadedModel) => void;
  /** Initial viewer state */
  initialState?: Partial<ViewerState>;
  /** Height of the viewer */
  height?: string | number;
}

export function Model3DViewer({
  modelUrl,
  format,
  allowUpload = true,
  onModelLoad,
  initialState,
  height = '600px',
}: Model3DViewerProps) {
  const [model, setModel] = useState<LoadedModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [viewerState, setViewerState] = useState<ViewerState>({
    ...DEFAULT_VIEWER_STATE,
    ...initialState,
  });

  // Load model from URL
  useEffect(() => {
    if (modelUrl && format) {
      loadModelFromUrl(modelUrl, format);
    }
  }, [modelUrl, format]);

  const loadModelFromUrl = async (url: string, modelFormat: Model3DFormat) => {
    setIsLoading(true);
    setError(null);
    setLoadProgress(0);

    try {
      const loadedModel = await loadModel(url, modelFormat, setLoadProgress);
      normalizeGeometry(loadedModel.geometry);
      setModel(loadedModel);
      onModelLoad?.(loadedModel);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load model');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const detectedFormat = detectFormat(file.name);
      if (!detectedFormat) {
        setError('Unsupported file format. Please use STL, PLY, or OBJ files.');
        return;
      }

      setIsLoading(true);
      setError(null);
      setLoadProgress(0);

      try {
        const loadedModel = await loadModelFromFile(file, detectedFormat, setLoadProgress);
        normalizeGeometry(loadedModel.geometry);
        setModel(loadedModel);
        onModelLoad?.(loadedModel);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load model');
      } finally {
        setIsLoading(false);
      }
    },
    [onModelLoad]
  );

  // Toolbar handlers
  const handleViewPreset = useCallback((preset: ViewPreset) => {
    setViewerState((prev) => ({
      ...prev,
      cameraPosition: VIEW_PRESET_POSITIONS[preset],
    }));
  }, []);

  const handleRenderModeChange = useCallback((mode: RenderMode) => {
    setViewerState((prev) => ({ ...prev, renderMode: mode }));
  }, []);

  const handleMaterialPresetChange = useCallback((preset: MaterialPreset) => {
    setViewerState((prev) => ({
      ...prev,
      material: MATERIAL_PRESETS[preset],
    }));
  }, []);

  const handleToggleGrid = useCallback(() => {
    setViewerState((prev) => ({ ...prev, showGrid: !prev.showGrid }));
  }, []);

  const handleToggleAxes = useCallback(() => {
    setViewerState((prev) => ({ ...prev, showAxes: !prev.showAxes }));
  }, []);

  const handleToggleAutoRotate = useCallback(() => {
    setViewerState((prev) => ({ ...prev, autoRotate: !prev.autoRotate }));
  }, []);

  const handleToggleClipping = useCallback(() => {
    setViewerState((prev) => ({
      ...prev,
      clippingEnabled: !prev.clippingEnabled,
    }));
  }, []);

  const handleClippingPositionChange = useCallback((position: number) => {
    setViewerState((prev) => ({ ...prev, clippingPosition: position }));
  }, []);

  const handleClippingAxisChange = useCallback((axis: 'x' | 'y' | 'z') => {
    setViewerState((prev) => ({ ...prev, clippingAxis: axis }));
  }, []);

  const handleResetView = useCallback(() => {
    setViewerState((prev) => ({
      ...prev,
      cameraPosition: VIEW_PRESET_POSITIONS.ISOMETRIC,
      zoom: 1,
      autoRotate: false,
    }));
  }, []);

  const handleZoomIn = useCallback(() => {
    setViewerState((prev) => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.2, 5),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setViewerState((prev) => ({
      ...prev,
      zoom: Math.max(prev.zoom / 1.2, 0.2),
    }));
  }, []);

  const handleCameraChange = useCallback(
    (position: { x: number; y: number; z: number }) => {
      // Can be used to sync camera position with external state
    },
    []
  );

  return (
    <TooltipProvider>
      <div className="flex flex-col" style={{ height }}>
        {/* Toolbar */}
        <Model3DToolbar
          viewerState={viewerState}
          model={model}
          onViewPreset={handleViewPreset}
          onRenderModeChange={handleRenderModeChange}
          onMaterialPresetChange={handleMaterialPresetChange}
          onToggleGrid={handleToggleGrid}
          onToggleAxes={handleToggleAxes}
          onToggleAutoRotate={handleToggleAutoRotate}
          onToggleClipping={handleToggleClipping}
          onClippingPositionChange={handleClippingPositionChange}
          onClippingAxisChange={handleClippingAxisChange}
          onResetView={handleResetView}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
        />

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mx-4 mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading Progress */}
        {isLoading && (
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 mb-1">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading model...</span>
            </div>
            <Progress value={loadProgress} className="h-2" />
          </div>
        )}

        {/* 3D Canvas or Upload Prompt */}
        <div className="flex-1 relative">
          {model ? (
            <Model3DCanvas
              model={model}
              viewerState={viewerState}
              onCameraChange={handleCameraChange}
            />
          ) : !isLoading && allowUpload ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <Card className="max-w-md">
                <CardContent className="p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Upload 3D Model
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop or click to upload STL, PLY, or OBJ files
                    from your intraoral scanner.
                  </p>
                  <label>
                    <input
                      type="file"
                      accept=".stl,.ply,.obj"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button asChild>
                      <span>Select File</span>
                    </Button>
                  </label>
                </CardContent>
              </Card>
            </div>
          ) : !isLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <p className="text-muted-foreground">No model loaded</p>
            </div>
          ) : null}

          {/* Drag and drop overlay */}
          {allowUpload && model && (
            <label className="absolute inset-0 cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
              <input
                type="file"
                accept=".stl,.ply,.obj"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center text-white">
                  <Upload className="h-8 w-8 mx-auto mb-2" />
                  <p>Drop file to replace model</p>
                </div>
              </div>
            </label>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
