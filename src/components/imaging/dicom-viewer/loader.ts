/**
 * DICOM Loader
 *
 * Utilities for parsing and loading DICOM files using dicom-parser.
 */

import * as dicomParser from 'dicom-parser';

import type {
  DicomMetadata,
  LoadedDicomImage,
  PhotometricInterpretation,
  DicomModality,
} from './types';
import { DICOM_TAGS } from './types';

// =============================================================================
// DICOM PARSING
// =============================================================================

/**
 * Parse DICOM file from ArrayBuffer
 */
export function parseDicomFile(arrayBuffer: ArrayBuffer): dicomParser.DataSet {
  const byteArray = new Uint8Array(arrayBuffer);
  return dicomParser.parseDicom(byteArray);
}

/**
 * Extract metadata from DICOM DataSet
 */
export function extractMetadata(dataSet: dicomParser.DataSet): DicomMetadata {
  const getString = (tag: string): string | undefined => {
    try {
      return dataSet.string(tag);
    } catch {
      return undefined;
    }
  };

  const getInt = (tag: string): number | undefined => {
    try {
      return dataSet.uint16(tag);
    } catch {
      return undefined;
    }
  };

  const getFloat = (tag: string): number | undefined => {
    try {
      const str = dataSet.string(tag);
      return str ? parseFloat(str) : undefined;
    } catch {
      return undefined;
    }
  };

  const getFloatArray = (tag: string): number[] | undefined => {
    try {
      const str = dataSet.string(tag);
      if (!str) return undefined;
      return str.split('\\').map((s) => parseFloat(s));
    } catch {
      return undefined;
    }
  };

  // Parse window center/width (can be multiple values)
  const parseWindowValue = (tag: string): number | number[] | undefined => {
    const str = getString(tag);
    if (!str) return undefined;
    const values = str.split('\\').map((s) => parseFloat(s.trim()));
    return values.length === 1 ? values[0] : values;
  };

  const pixelSpacingArr = getFloatArray(DICOM_TAGS.PixelSpacing);
  const imagerPixelSpacingArr = getFloatArray(DICOM_TAGS.ImagerPixelSpacing);
  const imagePositionArr = getFloatArray(DICOM_TAGS.ImagePositionPatient);
  const imageOrientationArr = getFloatArray(DICOM_TAGS.ImageOrientationPatient);

  return {
    // Patient
    patientName: getString(DICOM_TAGS.PatientName),
    patientId: getString(DICOM_TAGS.PatientID),
    patientBirthDate: getString(DICOM_TAGS.PatientBirthDate),
    patientSex: getString(DICOM_TAGS.PatientSex),

    // Study
    studyDate: getString(DICOM_TAGS.StudyDate),
    studyTime: getString(DICOM_TAGS.StudyTime),
    studyDescription: getString(DICOM_TAGS.StudyDescription),
    studyId: getString(DICOM_TAGS.StudyID),
    accessionNumber: getString(DICOM_TAGS.AccessionNumber),

    // Series
    seriesDate: getString(DICOM_TAGS.SeriesDate),
    seriesTime: getString(DICOM_TAGS.SeriesTime),
    seriesDescription: getString(DICOM_TAGS.SeriesDescription),
    seriesNumber: getInt(DICOM_TAGS.SeriesNumber),
    modality: getString(DICOM_TAGS.Modality) as DicomModality | undefined,

    // Instance
    instanceNumber: getInt(DICOM_TAGS.InstanceNumber),
    imageType: getString(DICOM_TAGS.ImageType)?.split('\\'),
    acquisitionDate: getString(DICOM_TAGS.AcquisitionDate),
    contentDate: getString(DICOM_TAGS.ContentDate),

    // Equipment
    manufacturer: getString(DICOM_TAGS.Manufacturer),
    institutionName: getString(DICOM_TAGS.InstitutionName),
    stationName: getString(DICOM_TAGS.StationName),
    manufacturerModelName: getString(DICOM_TAGS.ManufacturerModelName),

    // Image Pixel
    rows: getInt(DICOM_TAGS.Rows),
    columns: getInt(DICOM_TAGS.Columns),
    bitsAllocated: getInt(DICOM_TAGS.BitsAllocated),
    bitsStored: getInt(DICOM_TAGS.BitsStored),
    highBit: getInt(DICOM_TAGS.HighBit),
    pixelRepresentation: getInt(DICOM_TAGS.PixelRepresentation),
    samplesPerPixel: getInt(DICOM_TAGS.SamplesPerPixel),
    photometricInterpretation: getString(
      DICOM_TAGS.PhotometricInterpretation
    ) as PhotometricInterpretation | undefined,

    // Window
    windowCenter: parseWindowValue(DICOM_TAGS.WindowCenter),
    windowWidth: parseWindowValue(DICOM_TAGS.WindowWidth),

    // Rescale
    rescaleIntercept: getFloat(DICOM_TAGS.RescaleIntercept),
    rescaleSlope: getFloat(DICOM_TAGS.RescaleSlope),

    // Pixel Spacing
    pixelSpacing:
      pixelSpacingArr && pixelSpacingArr.length >= 2
        ? [pixelSpacingArr[0], pixelSpacingArr[1]]
        : undefined,
    imagerPixelSpacing:
      imagerPixelSpacingArr && imagerPixelSpacingArr.length >= 2
        ? [imagerPixelSpacingArr[0], imagerPixelSpacingArr[1]]
        : undefined,

    // Position/Orientation
    imagePositionPatient:
      imagePositionArr && imagePositionArr.length >= 3
        ? [imagePositionArr[0], imagePositionArr[1], imagePositionArr[2]]
        : undefined,
    imageOrientationPatient:
      imageOrientationArr && imageOrientationArr.length >= 6
        ? [
            imageOrientationArr[0],
            imageOrientationArr[1],
            imageOrientationArr[2],
            imageOrientationArr[3],
            imageOrientationArr[4],
            imageOrientationArr[5],
          ]
        : undefined,
    sliceThickness: getFloat(DICOM_TAGS.SliceThickness),
    sliceLocation: getFloat(DICOM_TAGS.SliceLocation),

    // Transfer Syntax
    transferSyntaxUID: getString(DICOM_TAGS.TransferSyntaxUID),

    // SOP
    sopClassUID: getString(DICOM_TAGS.SOPClassUID),
    sopInstanceUID: getString(DICOM_TAGS.SOPInstanceUID),
  };
}

/**
 * Extract pixel data from DICOM DataSet
 */
export function extractPixelData(
  dataSet: dicomParser.DataSet,
  metadata: DicomMetadata
): Int16Array | Uint16Array | Uint8Array {
  const pixelDataElement = dataSet.elements[DICOM_TAGS.PixelData];

  if (!pixelDataElement) {
    throw new Error('No pixel data found in DICOM file');
  }

  const bitsAllocated = metadata.bitsAllocated || 16;
  const pixelRepresentation = metadata.pixelRepresentation || 0;

  // Get the byte array from the data set
  const byteArray = dataSet.byteArray;
  const offset = pixelDataElement.dataOffset;
  const length = pixelDataElement.length;

  if (bitsAllocated === 8) {
    return new Uint8Array(byteArray.buffer, offset, length);
  } else if (bitsAllocated === 16) {
    if (pixelRepresentation === 1) {
      // Signed
      return new Int16Array(byteArray.buffer, offset, length / 2);
    } else {
      // Unsigned
      return new Uint16Array(byteArray.buffer, offset, length / 2);
    }
  } else {
    throw new Error(`Unsupported bits allocated: ${bitsAllocated}`);
  }
}

/**
 * Calculate min/max pixel values
 */
export function calculateMinMaxPixelValues(
  pixelData: Int16Array | Uint16Array | Uint8Array
): { min: number; max: number } {
  let min = pixelData[0];
  let max = pixelData[0];

  for (let i = 1; i < pixelData.length; i++) {
    if (pixelData[i] < min) min = pixelData[i];
    if (pixelData[i] > max) max = pixelData[i];
  }

  return { min, max };
}

/**
 * Load DICOM image from ArrayBuffer
 */
export async function loadDicomImage(
  arrayBuffer: ArrayBuffer,
  onProgress?: (progress: number) => void
): Promise<LoadedDicomImage> {
  onProgress?.(10);

  // Parse DICOM
  const dataSet = parseDicomFile(arrayBuffer);
  onProgress?.(30);

  // Extract metadata
  const metadata = extractMetadata(dataSet);
  onProgress?.(50);

  // Extract pixel data
  const pixelData = extractPixelData(dataSet, metadata);
  onProgress?.(70);

  // Calculate min/max
  const { min, max } = calculateMinMaxPixelValues(pixelData);
  onProgress?.(80);

  // Determine default window/level
  let windowCenter: number;
  let windowWidth: number;

  if (metadata.windowCenter !== undefined && metadata.windowWidth !== undefined) {
    // Use DICOM values (take first if array)
    windowCenter = Array.isArray(metadata.windowCenter)
      ? metadata.windowCenter[0]
      : metadata.windowCenter;
    windowWidth = Array.isArray(metadata.windowWidth)
      ? metadata.windowWidth[0]
      : metadata.windowWidth;
  } else {
    // Calculate from pixel values
    windowCenter = (min + max) / 2;
    windowWidth = max - min;
  }

  // Determine photometric interpretation
  const photometricInterpretation =
    metadata.photometricInterpretation || 'MONOCHROME2';
  const invert = photometricInterpretation === 'MONOCHROME1';

  onProgress?.(100);

  return {
    pixelData,
    width: metadata.columns || 0,
    height: metadata.rows || 0,
    bitsAllocated: metadata.bitsAllocated || 16,
    bitsStored: metadata.bitsStored || 12,
    minPixelValue: min,
    maxPixelValue: max,
    rescaleSlope: metadata.rescaleSlope || 1,
    rescaleIntercept: metadata.rescaleIntercept || 0,
    windowCenter,
    windowWidth,
    photometricInterpretation,
    invert,
    pixelSpacing: metadata.pixelSpacing || metadata.imagerPixelSpacing,
    metadata,
    fileSize: arrayBuffer.byteLength,
  };
}

/**
 * Load DICOM from File object
 */
export async function loadDicomFromFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<LoadedDicomImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress((event.loaded / event.total) * 50);
      }
    };

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const image = await loadDicomImage(arrayBuffer, (p) =>
          onProgress?.(50 + p * 0.5)
        );
        resolve(image);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Load DICOM from URL
 */
export async function loadDicomFromUrl(
  url: string,
  onProgress?: (progress: number) => void
): Promise<LoadedDicomImage> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch DICOM: ${response.statusText}`);
  }

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  if (!response.body) {
    const arrayBuffer = await response.arrayBuffer();
    return loadDicomImage(arrayBuffer, onProgress);
  }

  // Stream download with progress
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
    loaded += value.length;

    if (total && onProgress) {
      onProgress((loaded / total) * 50);
    }
  }

  // Combine chunks
  const arrayBuffer = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    arrayBuffer.set(chunk, offset);
    offset += chunk.length;
  }

  return loadDicomImage(arrayBuffer.buffer, (p) => onProgress?.(50 + p * 0.5));
}

// =============================================================================
// IMAGE RENDERING
// =============================================================================

/**
 * Apply window/level to pixel value
 */
export function applyWindowLevel(
  pixelValue: number,
  windowCenter: number,
  windowWidth: number,
  rescaleSlope: number = 1,
  rescaleIntercept: number = 0,
  invert: boolean = false
): number {
  // Apply rescale
  const hu = pixelValue * rescaleSlope + rescaleIntercept;

  // Apply window/level
  const low = windowCenter - windowWidth / 2;
  const high = windowCenter + windowWidth / 2;

  let output: number;
  if (hu <= low) {
    output = 0;
  } else if (hu >= high) {
    output = 255;
  } else {
    output = ((hu - low) / windowWidth) * 255;
  }

  // Invert if MONOCHROME1
  if (invert) {
    output = 255 - output;
  }

  return Math.round(output);
}

/**
 * Render DICOM image to canvas ImageData
 */
export function renderDicomToImageData(
  image: LoadedDicomImage,
  windowCenter: number,
  windowWidth: number,
  invert: boolean = false
): ImageData {
  const { width, height, pixelData, rescaleSlope, rescaleIntercept } = image;
  const imageData = new ImageData(width, height);
  const data = imageData.data;

  const actualInvert = invert !== image.invert; // XOR with MONOCHROME1

  for (let i = 0; i < pixelData.length; i++) {
    const gray = applyWindowLevel(
      pixelData[i],
      windowCenter,
      windowWidth,
      rescaleSlope,
      rescaleIntercept,
      actualInvert
    );

    const idx = i * 4;
    data[idx] = gray; // R
    data[idx + 1] = gray; // G
    data[idx + 2] = gray; // B
    data[idx + 3] = 255; // A
  }

  return imageData;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format DICOM date (YYYYMMDD) to readable format
 */
export function formatDicomDate(dateStr: string | undefined): string {
  if (!dateStr || dateStr.length < 8) return 'Unknown';
  const year = dateStr.slice(0, 4);
  const month = dateStr.slice(4, 6);
  const day = dateStr.slice(6, 8);
  return `${year}-${month}-${day}`;
}

/**
 * Format DICOM time (HHMMSS) to readable format
 */
export function formatDicomTime(timeStr: string | undefined): string {
  if (!timeStr || timeStr.length < 6) return 'Unknown';
  const hour = timeStr.slice(0, 2);
  const min = timeStr.slice(2, 4);
  const sec = timeStr.slice(4, 6);
  return `${hour}:${min}:${sec}`;
}

/**
 * Format patient name (Last^First^Middle) to readable format
 */
export function formatPatientName(name: string | undefined): string {
  if (!name) return 'Unknown';
  const parts = name.split('^');
  if (parts.length >= 2) {
    return `${parts[1]} ${parts[0]}`.trim();
  }
  return name.replace(/\^/g, ' ').trim();
}

/**
 * Check if file is a DICOM file
 */
export function isDicomFile(file: File): boolean {
  const name = file.name.toLowerCase();
  // DICOM files may have .dcm extension or no extension
  if (name.endsWith('.dcm') || name.endsWith('.dicom')) return true;

  // Check MIME type
  if (file.type === 'application/dicom') return true;

  // Files without extension could be DICOM
  if (!name.includes('.')) return true;

  return false;
}

/**
 * Detect if ArrayBuffer contains DICOM data
 */
export function isDicomData(arrayBuffer: ArrayBuffer): boolean {
  // DICOM files have "DICM" at offset 128
  if (arrayBuffer.byteLength < 132) return false;

  const view = new Uint8Array(arrayBuffer, 128, 4);
  const magic = String.fromCharCode(view[0], view[1], view[2], view[3]);
  return magic === 'DICM';
}
