/**
 * Export Utilities for Imaging Module
 *
 * This module provides utilities for exporting collages, reports, and presentations
 * to various formats (PNG, JPG, PDF).
 *
 * Note: Full export functionality requires html2canvas and jspdf packages.
 * Install with: npm install html2canvas jspdf
 */

export type ExportFormat = 'PNG' | 'JPG' | 'PDF';

export interface ExportOptions {
  format: ExportFormat;
  quality?: number; // 0-1, for JPG
  scale?: number; // Scale factor, default 2 for high-res
  backgroundColor?: string;
  fileName?: string;
  // PDF specific
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'LETTER' | 'LEGAL';
}

export interface ExportResult {
  success: boolean;
  dataUrl?: string;
  blob?: Blob;
  error?: string;
}

/**
 * Default export options
 */
export const DEFAULT_EXPORT_OPTIONS: Required<ExportOptions> = {
  format: 'PNG',
  quality: 0.95,
  scale: 2,
  backgroundColor: '#ffffff',
  fileName: 'export',
  orientation: 'landscape',
  pageSize: 'A4',
};

/**
 * Generate a filename with timestamp
 */
export function generateFileName(
  prefix: string,
  format: ExportFormat
): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  const extension = format.toLowerCase();
  return `${prefix}-${timestamp}.${extension}`;
}

/**
 * Convert a data URL to a Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const bstr = atob(parts[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);

  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }

  return new Blob([u8arr], { type: mime });
}

/**
 * Download a file from a data URL
 */
export function downloadDataUrl(
  dataUrl: string,
  fileName: string
): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, fileName);
  URL.revokeObjectURL(url);
}

/**
 * Export an HTML element as an image
 *
 * Requires html2canvas to be installed:
 * npm install html2canvas
 *
 * Usage:
 * ```typescript
 * import html2canvas from 'html2canvas';
 * const result = await exportElementAsImage(element, { format: 'PNG' }, html2canvas);
 * ```
 */
export async function exportElementAsImage(
  element: HTMLElement,
  options: Partial<ExportOptions> = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  html2canvas?: any
): Promise<ExportResult> {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };

  if (!html2canvas) {
    return {
      success: false,
      error: 'html2canvas is required for image export. Install with: npm install html2canvas',
    };
  }

  try {
    const canvas = await html2canvas(element, {
      scale: opts.scale,
      backgroundColor: opts.backgroundColor,
      useCORS: true,
      logging: false,
    });

    let dataUrl: string;
    if (opts.format === 'JPG') {
      dataUrl = canvas.toDataURL('image/jpeg', opts.quality);
    } else {
      dataUrl = canvas.toDataURL('image/png');
    }

    const blob = dataUrlToBlob(dataUrl);

    return {
      success: true,
      dataUrl,
      blob,
    };
  } catch (error) {
    return {
      success: false,
      error: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Export an HTML element as a PDF
 *
 * Requires html2canvas and jspdf to be installed:
 * npm install html2canvas jspdf
 *
 * Usage:
 * ```typescript
 * import html2canvas from 'html2canvas';
 * import { jsPDF } from 'jspdf';
 * const result = await exportElementAsPdf(element, { format: 'PDF' }, html2canvas, jsPDF);
 * ```
 */
export async function exportElementAsPdf(
  element: HTMLElement,
  options: Partial<ExportOptions> = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  html2canvas?: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jsPDF?: any
): Promise<ExportResult> {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };

  if (!html2canvas) {
    return {
      success: false,
      error: 'html2canvas is required for PDF export. Install with: npm install html2canvas',
    };
  }

  if (!jsPDF) {
    return {
      success: false,
      error: 'jsPDF is required for PDF export. Install with: npm install jspdf',
    };
  }

  try {
    const canvas = await html2canvas(element, {
      scale: opts.scale,
      backgroundColor: opts.backgroundColor,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');

    // Page dimensions in mm
    const pageSizes = {
      A4: { width: 210, height: 297 },
      LETTER: { width: 215.9, height: 279.4 },
      LEGAL: { width: 215.9, height: 355.6 },
    };

    const pageSize = pageSizes[opts.pageSize];
    const isLandscape = opts.orientation === 'landscape';

    const pageWidth = isLandscape ? pageSize.height : pageSize.width;
    const pageHeight = isLandscape ? pageSize.width : pageSize.height;

    // Calculate image dimensions to fit page
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const imgRatio = imgWidth / imgHeight;
    const pageRatio = pageWidth / pageHeight;

    let finalWidth: number;
    let finalHeight: number;

    if (imgRatio > pageRatio) {
      // Image is wider than page
      finalWidth = pageWidth - 20; // 10mm margin on each side
      finalHeight = finalWidth / imgRatio;
    } else {
      // Image is taller than page
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

    const blob = pdf.output('blob');

    return {
      success: true,
      blob,
    };
  } catch (error) {
    return {
      success: false,
      error: `PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Export multiple elements as a multi-page PDF
 */
export async function exportMultiPagePdf(
  elements: HTMLElement[],
  options: Partial<ExportOptions> = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  html2canvas?: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jsPDF?: any
): Promise<ExportResult> {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };

  if (!html2canvas || !jsPDF) {
    return {
      success: false,
      error: 'html2canvas and jsPDF are required for PDF export',
    };
  }

  try {
    const pageSizes = {
      A4: { width: 210, height: 297 },
      LETTER: { width: 215.9, height: 279.4 },
      LEGAL: { width: 215.9, height: 355.6 },
    };

    const pageSize = pageSizes[opts.pageSize];
    const isLandscape = opts.orientation === 'landscape';

    const pageWidth = isLandscape ? pageSize.height : pageSize.width;
    const pageHeight = isLandscape ? pageSize.width : pageSize.height;

    const pdf = new jsPDF({
      orientation: opts.orientation,
      unit: 'mm',
      format: opts.pageSize.toLowerCase(),
    });

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];

      if (i > 0) {
        pdf.addPage();
      }

      const canvas = await html2canvas(element, {
        scale: opts.scale,
        backgroundColor: opts.backgroundColor,
        useCORS: true,
        logging: false,
      });

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

      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
    }

    const blob = pdf.output('blob');

    return {
      success: true,
      blob,
    };
  } catch (error) {
    return {
      success: false,
      error: `Multi-page PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Simple export function that handles download automatically
 */
export async function exportAndDownload(
  element: HTMLElement,
  options: Partial<ExportOptions> = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  html2canvas?: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jsPDF?: any
): Promise<ExportResult> {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  const fileName =
    opts.fileName ||
    generateFileName('export', opts.format);

  let result: ExportResult;

  if (opts.format === 'PDF') {
    result = await exportElementAsPdf(element, opts, html2canvas, jsPDF);
  } else {
    result = await exportElementAsImage(element, opts, html2canvas);
  }

  if (result.success) {
    if (result.blob) {
      downloadBlob(result.blob, fileName);
    } else if (result.dataUrl) {
      downloadDataUrl(result.dataUrl, fileName);
    }
  }

  return result;
}

/**
 * Create a print-friendly version of content
 */
export function openPrintDialog(element: HTMLElement): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print</title>
      <style>
        body { margin: 0; padding: 20px; }
        @media print {
          body { margin: 0; padding: 0; }
        }
      </style>
    </head>
    <body>
      ${element.outerHTML}
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

/**
 * Prepare images for collage export by ensuring they're loaded
 */
export async function preloadImages(urls: string[]): Promise<void> {
  const promises = urls.map((url) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load: ${url}`));
      img.src = url;
    });
  });

  await Promise.all(promises);
}
