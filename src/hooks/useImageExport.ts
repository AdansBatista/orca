'use client';

import { useState, useCallback, useRef } from 'react';
import {
  openPrintDialog,
  generateFileName,
  downloadBlob,
  downloadDataUrl,
  dataUrlToBlob,
  type ExportFormat,
  type ExportOptions,
  type ExportResult,
  DEFAULT_EXPORT_OPTIONS,
} from '@/lib/imaging';

interface UseImageExportOptions {
  defaultFormat?: ExportFormat;
  defaultFileName?: string;
}

interface UseImageExportReturn {
  /** Ref to attach to the element you want to export */
  exportRef: React.RefObject<HTMLDivElement | null>;
  /** Whether an export is currently in progress */
  isExporting: boolean;
  /** Error from the last export attempt */
  error: string | null;
  /** Export the referenced element */
  exportElement: (options?: Partial<ExportOptions>) => Promise<ExportResult>;
  /** Open print dialog for the referenced element */
  print: () => void;
  /** Generate a filename for export */
  getFileName: (format: ExportFormat) => string;
  /** Clear any error state */
  clearError: () => void;
}

/**
 * Hook for exporting HTML elements as images or PDFs
 *
 * Note: Requires html2canvas and optionally jspdf to be installed for full functionality.
 * Without these packages, the hook will return helpful error messages.
 *
 * Installation:
 * ```bash
 * npm install html2canvas jspdf
 * ```
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { exportRef, isExporting, exportElement, error } = useImageExport({
 *     defaultFileName: 'my-collage'
 *   });
 *
 *   return (
 *     <>
 *       <div ref={exportRef}>
 *         {Content to export}
 *       </div>
 *       <button onClick={() => exportElement({ format: 'PNG' })} disabled={isExporting}>
 *         {isExporting ? 'Exporting...' : 'Export as PNG'}
 *       </button>
 *       {error && <p className="text-red-500">{error}</p>}
 *     </>
 *   );
 * }
 * ```
 */
export function useImageExport(
  options: UseImageExportOptions = {}
): UseImageExportReturn {
  const { defaultFormat = 'PNG', defaultFileName = 'export' } = options;

  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFileName = useCallback(
    (format: ExportFormat): string => {
      return generateFileName(defaultFileName, format);
    },
    [defaultFileName]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const exportElement = useCallback(
    async (exportOptions?: Partial<ExportOptions>): Promise<ExportResult> => {
      if (!exportRef.current) {
        const result: ExportResult = {
          success: false,
          error: 'Export element ref is not attached to a DOM element',
        };
        setError(result.error!);
        return result;
      }

      const opts = { ...DEFAULT_EXPORT_OPTIONS, ...exportOptions };
      const format = opts.format || defaultFormat;

      setIsExporting(true);
      setError(null);

      try {
        // Try to dynamically load html2canvas
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let html2canvas: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let jsPDF: any;

        try {
          // This will throw if the module isn't installed
          const module = await (Function(
            'return import("html2canvas")'
          )() as Promise<{ default: unknown }>);
          html2canvas = module.default;
        } catch {
          setError(
            'html2canvas is not installed. Install with: npm install html2canvas'
          );
          return {
            success: false,
            error: 'html2canvas is not installed. Install with: npm install html2canvas',
          };
        }

        if (format === 'PDF') {
          try {
            const module = await (Function(
              'return import("jspdf")'
            )() as Promise<{ jsPDF: unknown }>);
            jsPDF = module.jsPDF;
          } catch {
            setError(
              'jspdf is not installed. Install with: npm install jspdf'
            );
            return {
              success: false,
              error: 'jspdf is not installed for PDF export. Install with: npm install jspdf',
            };
          }
        }

        // Create canvas from element
        const canvas = await html2canvas(exportRef.current, {
          scale: opts.scale,
          backgroundColor: opts.backgroundColor,
          useCORS: true,
          logging: false,
        });

        if (format === 'PDF' && jsPDF) {
          // Create PDF
          const pageSizes = {
            A4: { width: 210, height: 297 },
            LETTER: { width: 215.9, height: 279.4 },
            LEGAL: { width: 215.9, height: 355.6 },
          };

          const pageSize = pageSizes[opts.pageSize];
          const isLandscape = opts.orientation === 'landscape';
          const pageWidth = isLandscape ? pageSize.height : pageSize.width;
          const pageHeight = isLandscape ? pageSize.width : pageSize.height;

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const imgRatio = imgWidth / imgHeight;
          const pageRatio = pageWidth / pageHeight;

          let finalWidth: number;
          let finalHeight: number;

          if (imgRatio > pageRatio) {
            finalWidth = pageWidth - 20;
            finalHeight = finalWidth / imgRatio;
          } else {
            finalHeight = pageHeight - 20;
            finalWidth = finalHeight * imgRatio;
          }

          const x = (pageWidth - finalWidth) / 2;
          const y = (pageHeight - finalHeight) / 2;

          const pdf = new jsPDF({
            orientation: opts.orientation,
            unit: 'mm',
            format: opts.pageSize.toLowerCase(),
          });

          pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
          const blob = pdf.output('blob') as Blob;

          downloadBlob(blob, getFileName('PDF'));

          return { success: true, blob };
        } else {
          // Create image
          let dataUrl: string;
          if (format === 'JPG') {
            dataUrl = canvas.toDataURL('image/jpeg', opts.quality);
          } else {
            dataUrl = canvas.toDataURL('image/png');
          }

          downloadDataUrl(dataUrl, getFileName(format));
          const blob = dataUrlToBlob(dataUrl);

          return { success: true, dataUrl, blob };
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown export error';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsExporting(false);
      }
    },
    [defaultFormat, getFileName]
  );

  const print = useCallback(() => {
    if (exportRef.current) {
      openPrintDialog(exportRef.current);
    }
  }, []);

  return {
    exportRef,
    isExporting,
    error,
    exportElement,
    print,
    getFileName,
    clearError,
  };
}
