'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import * as fabric from 'fabric';

import {
  AnnotationToolbar,
  type AnnotationTool,
  type AnnotationStyle,
  DEFAULT_ANNOTATION_STYLE,
} from './AnnotationToolbar';
import { cn } from '@/lib/utils';

// Map our tool types to Prisma annotation types
export type PrismaAnnotationType =
  | 'FREEHAND'
  | 'LINE'
  | 'ARROW'
  | 'CIRCLE'
  | 'RECTANGLE'
  | 'TEXT'
  | 'POLYGON';

export interface StoredAnnotation {
  id?: string;
  type: PrismaAnnotationType;
  geometry: {
    type: string;
    data: unknown;
  };
  style: AnnotationStyle;
  text?: string;
  label?: string;
}

interface AnnotationCanvasProps {
  imageUrl: string;
  width?: number;
  height?: number;
  annotations?: StoredAnnotation[];
  onAnnotationsChange?: (annotations: StoredAnnotation[]) => void;
  onSave?: (annotations: StoredAnnotation[]) => Promise<void>;
  readOnly?: boolean;
  className?: string;
}

export interface AnnotationCanvasRef {
  getAnnotations: () => StoredAnnotation[];
  loadAnnotations: (annotations: StoredAnnotation[]) => void;
  clear: () => void;
}

const TOOL_TO_PRISMA: Record<AnnotationTool, PrismaAnnotationType | null> = {
  select: null,
  freehand: 'FREEHAND',
  line: 'LINE',
  arrow: 'ARROW',
  circle: 'CIRCLE',
  rectangle: 'RECTANGLE',
  text: 'TEXT',
  polygon: 'POLYGON',
};

export const AnnotationCanvas = forwardRef<
  AnnotationCanvasRef,
  AnnotationCanvasProps
>(function AnnotationCanvas(
  {
    imageUrl,
    width,
    height,
    annotations: initialAnnotations = [],
    onAnnotationsChange,
    onSave,
    readOnly = false,
    className,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  const [activeTool, setActiveTool] = useState<AnnotationTool>('select');
  const [style, setStyle] = useState<AnnotationStyle>(DEFAULT_ANNOTATION_STYLE);
  const [annotationsVisible, setAnnotationsVisible] = useState(true);
  const [hasSelection, setHasSelection] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // History for undo/redo
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const isLoadingRef = useRef(false);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const containerWidth = width || containerRef.current.offsetWidth || 800;
    const containerHeight = height || containerRef.current.offsetHeight || 600;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: containerWidth,
      height: containerHeight,
      selection: !readOnly,
      backgroundColor: 'transparent',
    });

    fabricCanvasRef.current = canvas;

    // Load background image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const fabricImg = new fabric.FabricImage(img, {
        selectable: false,
        evented: false,
      });

      // Scale image to fit canvas
      const scale = Math.min(
        containerWidth / img.width,
        containerHeight / img.height
      );
      fabricImg.scale(scale);

      // Center the image
      fabricImg.set({
        left: (containerWidth - img.width * scale) / 2,
        top: (containerHeight - img.height * scale) / 2,
      });

      canvas.backgroundImage = fabricImg;
      canvas.renderAll();

      // Load initial annotations after image is loaded
      if (initialAnnotations.length > 0) {
        loadAnnotationsToCanvas(initialAnnotations);
      }

      // Save initial state
      saveToHistory();
    };
    img.src = imageUrl;

    // Event listeners
    canvas.on('selection:created', () => setHasSelection(true));
    canvas.on('selection:cleared', () => setHasSelection(false));
    canvas.on('object:added', handleObjectModified);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:removed', handleObjectModified);

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [imageUrl, width, height, readOnly]);

  // Save state to history
  const saveToHistory = useCallback(() => {
    if (isLoadingRef.current || !fabricCanvasRef.current) return;

    const json = JSON.stringify(fabricCanvasRef.current.toJSON());

    // Remove any redo states
    historyRef.current = historyRef.current.slice(
      0,
      historyIndexRef.current + 1
    );

    // Add new state
    historyRef.current.push(json);
    historyIndexRef.current = historyRef.current.length - 1;

    // Limit history size
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
      historyIndexRef.current--;
    }

    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  // Handle object modifications
  const handleObjectModified = useCallback(() => {
    if (isLoadingRef.current) return;
    saveToHistory();

    if (onAnnotationsChange && fabricCanvasRef.current) {
      const annotations = getAnnotationsFromCanvas();
      onAnnotationsChange(annotations);
    }
  }, [onAnnotationsChange, saveToHistory]);

  // Get annotations from canvas as storable format
  const getAnnotationsFromCanvas = useCallback((): StoredAnnotation[] => {
    if (!fabricCanvasRef.current) return [];

    const objects = fabricCanvasRef.current.getObjects();
    return objects
      .filter((obj) => (obj as fabric.Object & { annotationType?: string }).annotationType)
      .map((obj) => {
        const typedObj = obj as fabric.Object & { annotationType: PrismaAnnotationType };
        return {
          type: typedObj.annotationType,
          geometry: {
            type: obj.type || 'unknown',
            data: obj.toJSON(),
          },
          style: {
            strokeColor: (obj as fabric.FabricObject).stroke as string || DEFAULT_ANNOTATION_STYLE.strokeColor,
            strokeWidth: (obj as fabric.FabricObject).strokeWidth || DEFAULT_ANNOTATION_STYLE.strokeWidth,
            fillColor: (obj as fabric.FabricObject).fill as string || DEFAULT_ANNOTATION_STYLE.fillColor,
            fillOpacity:
              typeof (obj as fabric.FabricObject).fill === 'string' &&
              ((obj as fabric.FabricObject).fill as string).startsWith('rgba')
                ? parseFloat(((obj as fabric.FabricObject).fill as string).split(',')[3] || '0')
                : 0,
          },
          text:
            obj.type === 'i-text' || obj.type === 'textbox'
              ? (obj as fabric.Textbox).text
              : undefined,
        };
      });
  }, []);

  // Load annotations onto canvas
  const loadAnnotationsToCanvas = useCallback(
    (annotations: StoredAnnotation[]) => {
      if (!fabricCanvasRef.current) return;

      isLoadingRef.current = true;
      const canvas = fabricCanvasRef.current;

      // Remove existing annotation objects
      const objects = canvas.getObjects();
      objects.forEach((obj) => {
        if ((obj as fabric.Object & { annotationType?: string }).annotationType) {
          canvas.remove(obj);
        }
      });

      // Add new annotations
      annotations.forEach((annotation) => {
        const { geometry, style: annotStyle, type, text } = annotation;
        const objData = geometry.data as fabric.Object;

        fabric.util.enlivenObjects([objData]).then((objects) => {
          objects.forEach((obj) => {
            (obj as fabric.Object & { annotationType: string }).annotationType = type;
            canvas.add(obj as fabric.FabricObject);
          });
          canvas.renderAll();
        });
      });

      isLoadingRef.current = false;
    },
    []
  );

  // Imperative handle
  useImperativeHandle(ref, () => ({
    getAnnotations: getAnnotationsFromCanvas,
    loadAnnotations: loadAnnotationsToCanvas,
    clear: () => {
      if (!fabricCanvasRef.current) return;
      const objects = fabricCanvasRef.current.getObjects();
      objects.forEach((obj) => {
        if ((obj as fabric.Object & { annotationType?: string }).annotationType) {
          fabricCanvasRef.current?.remove(obj);
        }
      });
      fabricCanvasRef.current.renderAll();
      saveToHistory();
    },
  }));

  // Handle tool change
  useEffect(() => {
    if (!fabricCanvasRef.current || readOnly) return;

    const canvas = fabricCanvasRef.current;

    // Reset drawing mode
    canvas.isDrawingMode = false;

    if (activeTool === 'freehand') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = style.strokeColor;
      canvas.freeDrawingBrush.width = style.strokeWidth;
    } else if (activeTool === 'select') {
      canvas.selection = true;
    } else {
      canvas.selection = false;
    }
  }, [activeTool, style, readOnly]);

  // Handle drawing shapes
  useEffect(() => {
    if (!fabricCanvasRef.current || readOnly) return;
    if (activeTool === 'select' || activeTool === 'freehand') return;

    const canvas = fabricCanvasRef.current;
    let isDrawing = false;
    let startX = 0;
    let startY = 0;
    let currentShape: fabric.FabricObject | null = null;

    const handleMouseDown = (opt: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
      // Already filtered by useEffect guard, but double-check
      if (['select', 'freehand'].includes(activeTool)) return;

      const pointer = canvas.getViewportPoint(opt.e);
      isDrawing = true;
      startX = pointer.x;
      startY = pointer.y;

      const fill =
        style.fillOpacity > 0
          ? `${style.fillColor}${Math.round(style.fillOpacity * 255)
              .toString(16)
              .padStart(2, '0')}`
          : 'transparent';

      const commonProps = {
        stroke: style.strokeColor,
        strokeWidth: style.strokeWidth,
        fill,
        selectable: true,
        originX: 'left' as const,
        originY: 'top' as const,
      };

      switch (activeTool) {
        case 'line':
          currentShape = new fabric.Line([startX, startY, startX, startY], {
            ...commonProps,
            fill: undefined,
          });
          break;
        case 'arrow':
          // Arrow is a group of line + triangle
          currentShape = new fabric.Line([startX, startY, startX, startY], {
            ...commonProps,
            fill: undefined,
          });
          break;
        case 'circle':
          currentShape = new fabric.Ellipse({
            ...commonProps,
            left: startX,
            top: startY,
            rx: 0,
            ry: 0,
          });
          break;
        case 'rectangle':
          currentShape = new fabric.Rect({
            ...commonProps,
            left: startX,
            top: startY,
            width: 0,
            height: 0,
          });
          break;
        case 'text':
          const textbox = new fabric.Textbox('Type here', {
            left: startX,
            top: startY,
            fontSize: 16,
            fill: style.strokeColor,
            width: 150,
          });
          (textbox as fabric.Textbox & { annotationType: string }).annotationType = 'TEXT';
          canvas.add(textbox);
          canvas.setActiveObject(textbox);
          textbox.enterEditing();
          setActiveTool('select');
          isDrawing = false;
          return;
        case 'polygon':
          // Polygon requires multiple clicks - simplified for now
          currentShape = new fabric.Polygon(
            [
              { x: startX, y: startY },
              { x: startX + 50, y: startY },
              { x: startX + 50, y: startY + 50 },
              { x: startX, y: startY + 50 },
            ],
            commonProps
          );
          (currentShape as fabric.Polygon & { annotationType: string }).annotationType = 'POLYGON';
          canvas.add(currentShape);
          setActiveTool('select');
          isDrawing = false;
          return;
      }

      if (currentShape) {
        (currentShape as fabric.FabricObject & { annotationType: string }).annotationType =
          TOOL_TO_PRISMA[activeTool] || 'LINE';
        canvas.add(currentShape);
      }
    };

    const handleMouseMove = (opt: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
      if (!isDrawing || !currentShape) return;

      const pointer = canvas.getViewportPoint(opt.e);

      switch (activeTool) {
        case 'line':
        case 'arrow':
          (currentShape as fabric.Line).set({ x2: pointer.x, y2: pointer.y });
          break;
        case 'circle':
          const rx = Math.abs(pointer.x - startX) / 2;
          const ry = Math.abs(pointer.y - startY) / 2;
          (currentShape as fabric.Ellipse).set({
            rx,
            ry,
            left: Math.min(startX, pointer.x),
            top: Math.min(startY, pointer.y),
          });
          break;
        case 'rectangle':
          (currentShape as fabric.Rect).set({
            width: Math.abs(pointer.x - startX),
            height: Math.abs(pointer.y - startY),
            left: Math.min(startX, pointer.x),
            top: Math.min(startY, pointer.y),
          });
          break;
      }

      canvas.renderAll();
    };

    const handleMouseUp = () => {
      if (!isDrawing || !currentShape) return;
      isDrawing = false;

      // If creating an arrow, add arrowhead
      if (activeTool === 'arrow' && currentShape.type === 'line') {
        const line = currentShape as fabric.Line;
        const x1 = line.x1 || 0;
        const y1 = line.y1 || 0;
        const x2 = line.x2 || 0;
        const y2 = line.y2 || 0;

        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLen = 15;

        const triangle = new fabric.Triangle({
          left: x2,
          top: y2,
          width: headLen,
          height: headLen,
          fill: style.strokeColor,
          angle: (angle * 180) / Math.PI + 90,
          originX: 'center',
          originY: 'center',
        });

        const group = new fabric.Group([line, triangle], {
          selectable: true,
        });
        (group as fabric.Group & { annotationType: string }).annotationType = 'ARROW';

        canvas.remove(currentShape);
        canvas.add(group);
      }

      currentShape = null;
      canvas.renderAll();
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [activeTool, style, readOnly]);

  // Handle path created for freehand
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    const handlePathCreated = (opt: { path: fabric.Path }) => {
      if (opt.path) {
        (opt.path as fabric.Path & { annotationType: string }).annotationType = 'FREEHAND';
      }
    };

    canvas.on('path:created', handlePathCreated);

    return () => {
      canvas.off('path:created', handlePathCreated);
    };
  }, []);

  // Undo handler
  const handleUndo = useCallback(() => {
    if (!fabricCanvasRef.current || historyIndexRef.current <= 0) return;

    historyIndexRef.current--;
    isLoadingRef.current = true;

    fabricCanvasRef.current.loadFromJSON(
      JSON.parse(historyRef.current[historyIndexRef.current]),
      () => {
        fabricCanvasRef.current?.renderAll();
        isLoadingRef.current = false;
        setCanUndo(historyIndexRef.current > 0);
        setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
      }
    );
  }, []);

  // Redo handler
  const handleRedo = useCallback(() => {
    if (
      !fabricCanvasRef.current ||
      historyIndexRef.current >= historyRef.current.length - 1
    )
      return;

    historyIndexRef.current++;
    isLoadingRef.current = true;

    fabricCanvasRef.current.loadFromJSON(
      JSON.parse(historyRef.current[historyIndexRef.current]),
      () => {
        fabricCanvasRef.current?.renderAll();
        isLoadingRef.current = false;
        setCanUndo(historyIndexRef.current > 0);
        setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
      }
    );
  }, []);

  // Delete handler
  const handleDelete = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const activeObjects = fabricCanvasRef.current.getActiveObjects();
    activeObjects.forEach((obj) => {
      fabricCanvasRef.current?.remove(obj);
    });
    fabricCanvasRef.current.discardActiveObject();
    fabricCanvasRef.current.renderAll();
  }, []);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      const annotations = getAnnotationsFromCanvas();
      await onSave(annotations);
    } catch (error) {
      console.error('Failed to save annotations:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave, getAnnotationsFromCanvas]);

  // Toggle visibility
  const handleToggleVisibility = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const newVisible = !annotationsVisible;
    setAnnotationsVisible(newVisible);

    const objects = fabricCanvasRef.current.getObjects();
    objects.forEach((obj) => {
      if ((obj as fabric.Object & { annotationType?: string }).annotationType) {
        obj.set('visible', newVisible);
      }
    });
    fabricCanvasRef.current.renderAll();
  }, [annotationsVisible]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <canvas ref={canvasRef} />

      {!readOnly && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <AnnotationToolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            style={style}
            onStyleChange={setStyle}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onDelete={handleDelete}
            onSave={handleSave}
            annotationsVisible={annotationsVisible}
            onToggleVisibility={handleToggleVisibility}
            hasSelection={hasSelection}
            isSaving={isSaving}
          />
        </div>
      )}
    </div>
  );
});
