/**
 * Cephalometric Calculation Utilities
 *
 * Mathematical functions for calculating cephalometric measurements
 * from placed landmark points.
 */

import type {
  PlacedLandmark,
  CephMeasurement,
  CalculatedMeasurement,
  MeasurementCalculation,
} from './types';
import { getMeasurementInterpretation, CEPH_MEASUREMENTS } from './types';

// =============================================================================
// GEOMETRIC PRIMITIVES
// =============================================================================

interface Point {
  x: number;
  y: number;
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Calculate angle formed by three points (in degrees)
 * The angle is at point p2 (the vertex)
 */
export function angle3Point(p1: Point, p2: Point, p3: Point): number {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  if (mag1 === 0 || mag2 === 0) return 0;

  const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return Math.acos(cosAngle) * (180 / Math.PI);
}

/**
 * Calculate angle between two lines (in degrees)
 * Line 1: p1 to p2
 * Line 2: p3 to p4
 */
export function angle2Line(p1: Point, p2: Point, p3: Point, p4: Point): number {
  const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
  const v2 = { x: p4.x - p3.x, y: p4.y - p3.y };

  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  if (mag1 === 0 || mag2 === 0) return 0;

  const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  let angle = Math.acos(cosAngle) * (180 / Math.PI);

  // Return the acute angle if > 90
  if (angle > 90) {
    angle = 180 - angle;
  }

  return angle;
}

/**
 * Calculate perpendicular distance from a point to a line
 * Line defined by p1 to p2, distance to point p
 */
export function pointToLineDistance(p: Point, lineP1: Point, lineP2: Point): number {
  const A = p.x - lineP1.x;
  const B = p.y - lineP1.y;
  const C = lineP2.x - lineP1.x;
  const D = lineP2.y - lineP1.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  if (lenSq === 0) return distance(p, lineP1);

  // Calculate perpendicular distance
  const cross = A * D - B * C;
  return cross / Math.sqrt(lenSq);
}

/**
 * Project a point onto a line
 */
export function projectPointOnLine(p: Point, lineP1: Point, lineP2: Point): Point {
  const A = p.x - lineP1.x;
  const B = p.y - lineP1.y;
  const C = lineP2.x - lineP1.x;
  const D = lineP2.y - lineP1.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  if (lenSq === 0) return lineP1;

  const t = dot / lenSq;

  return {
    x: lineP1.x + t * C,
    y: lineP1.y + t * D,
  };
}

// =============================================================================
// MEASUREMENT CALCULATIONS
// =============================================================================

/**
 * Get landmark point from placed landmarks
 */
function getLandmarkPoint(
  landmarkId: string,
  placedLandmarks: PlacedLandmark[]
): Point | null {
  const landmark = placedLandmarks.find(l => l.landmarkId === landmarkId);
  return landmark ? { x: landmark.x, y: landmark.y } : null;
}

/**
 * Calculate a specific measurement type
 */
function calculateByType(
  calculation: MeasurementCalculation,
  landmarks: string[],
  placedLandmarks: PlacedLandmark[],
  calibration: number
): number | null {
  const points = landmarks.map(id => getLandmarkPoint(id, placedLandmarks));

  // Check if all points are placed
  if (points.some(p => p === null)) {
    return null;
  }

  const validPoints = points as Point[];

  switch (calculation) {
    case 'ANGLE_3POINT':
      // Angle at middle point (points[1] is vertex)
      if (validPoints.length >= 3) {
        return angle3Point(validPoints[0], validPoints[1], validPoints[2]);
      }
      break;

    case 'ANGLE_2LINE':
      // Angle between two lines
      if (validPoints.length >= 4) {
        return angle2Line(
          validPoints[0],
          validPoints[1],
          validPoints[2],
          validPoints[3]
        );
      }
      break;

    case 'LINEAR':
      // Distance between first two points
      if (validPoints.length >= 2) {
        const pixelDist = distance(validPoints[0], validPoints[1]);
        return calibration > 0 ? pixelDist / calibration : pixelDist;
      }
      break;

    case 'LINE_TO_POINT':
      // Distance from point to line
      // First point is the point, next two define the line
      if (validPoints.length >= 3) {
        const pixelDist = pointToLineDistance(
          validPoints[0],
          validPoints[1],
          validPoints[2]
        );
        return calibration > 0 ? pixelDist / calibration : pixelDist;
      }
      break;

    case 'RATIO':
      // Ratio calculation - specific to each measurement
      // Not commonly used in basic ceph analysis
      return null;
  }

  return null;
}

/**
 * Calculate a single measurement
 */
export function calculateMeasurement(
  measurement: CephMeasurement,
  placedLandmarks: PlacedLandmark[],
  calibration: number = 1
): CalculatedMeasurement | null {
  const value = calculateByType(
    measurement.calculation,
    measurement.landmarks,
    placedLandmarks,
    calibration
  );

  if (value === null) {
    return null;
  }

  const { label, interpretation, deviation } = getMeasurementInterpretation(
    measurement,
    value
  );

  return {
    measurementId: measurement.id,
    value: Math.round(value * 10) / 10, // Round to 1 decimal
    deviation,
    interpretation: `${label}: ${interpretation}`,
    category: measurement.category,
  };
}

/**
 * Calculate all possible measurements from placed landmarks
 */
export function calculateAllMeasurements(
  placedLandmarks: PlacedLandmark[],
  calibration: number = 1,
  measurementIds?: string[]
): CalculatedMeasurement[] {
  const measurements = measurementIds
    ? CEPH_MEASUREMENTS.filter(m => measurementIds.includes(m.id))
    : CEPH_MEASUREMENTS;

  const results: CalculatedMeasurement[] = [];

  for (const measurement of measurements) {
    const result = calculateMeasurement(measurement, placedLandmarks, calibration);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

/**
 * Calculate measurements for a specific analysis preset
 */
export function calculatePresetMeasurements(
  presetId: string,
  placedLandmarks: PlacedLandmark[],
  calibration: number = 1
): CalculatedMeasurement[] {
  // Import preset and get measurement IDs
  const { ANALYSIS_PRESETS } = require('./types');
  const preset = ANALYSIS_PRESETS.find((p: { id: string }) => p.id === presetId);

  if (!preset) {
    return calculateAllMeasurements(placedLandmarks, calibration);
  }

  return calculateAllMeasurements(placedLandmarks, calibration, preset.measurements);
}

// =============================================================================
// SPECIFIC MEASUREMENT HELPERS
// =============================================================================

/**
 * Calculate SNA angle (Sella-Nasion-A point)
 */
export function calculateSNA(placedLandmarks: PlacedLandmark[]): number | null {
  const S = getLandmarkPoint('S', placedLandmarks);
  const N = getLandmarkPoint('N', placedLandmarks);
  const A = getLandmarkPoint('A', placedLandmarks);

  if (!S || !N || !A) return null;
  return angle3Point(S, N, A);
}

/**
 * Calculate SNB angle (Sella-Nasion-B point)
 */
export function calculateSNB(placedLandmarks: PlacedLandmark[]): number | null {
  const S = getLandmarkPoint('S', placedLandmarks);
  const N = getLandmarkPoint('N', placedLandmarks);
  const B = getLandmarkPoint('B', placedLandmarks);

  if (!S || !N || !B) return null;
  return angle3Point(S, N, B);
}

/**
 * Calculate ANB angle (A point-Nasion-B point)
 */
export function calculateANB(placedLandmarks: PlacedLandmark[]): number | null {
  const sna = calculateSNA(placedLandmarks);
  const snb = calculateSNB(placedLandmarks);

  if (sna === null || snb === null) return null;
  return sna - snb;
}

/**
 * Calculate FMA (Frankfort-Mandibular Plane Angle)
 */
export function calculateFMA(placedLandmarks: PlacedLandmark[]): number | null {
  const Po = getLandmarkPoint('Po', placedLandmarks);
  const Or = getLandmarkPoint('Or', placedLandmarks);
  const Me = getLandmarkPoint('Me', placedLandmarks);
  const Go = getLandmarkPoint('Go', placedLandmarks);

  if (!Po || !Or || !Me || !Go) return null;
  return angle2Line(Po, Or, Go, Me);
}

// =============================================================================
// LINE DRAWING HELPERS
// =============================================================================

/**
 * Get reference lines for display
 */
export interface ReferenceLine {
  id: string;
  name: string;
  from: string; // landmark ID
  to: string;   // landmark ID
  color: string;
}

export const REFERENCE_LINES: ReferenceLine[] = [
  // SN Plane
  { id: 'SN', name: 'SN Plane', from: 'S', to: 'N', color: '#3b82f6' },
  // Frankfort Horizontal
  { id: 'FH', name: 'Frankfort Horizontal', from: 'Po', to: 'Or', color: '#22c55e' },
  // Mandibular Plane
  { id: 'MP', name: 'Mandibular Plane', from: 'Go', to: 'Me', color: '#ef4444' },
  // NA Line
  { id: 'NA', name: 'NA Line', from: 'N', to: 'A', color: '#f59e0b' },
  // NB Line
  { id: 'NB', name: 'NB Line', from: 'N', to: 'B', color: '#a855f7' },
  // E-Line (Esthetic Line)
  { id: 'E', name: 'E-Line', from: 'Prn', to: 'Pgs', color: '#ec4899' },
  // Upper Incisor Axis
  { id: 'U1', name: 'Upper Incisor', from: 'U1E', to: 'U1A', color: '#f59e0b' },
  // Lower Incisor Axis
  { id: 'L1', name: 'Lower Incisor', from: 'L1E', to: 'L1A', color: '#f59e0b' },
];

/**
 * Get lines that can be drawn given placed landmarks
 */
export function getDrawableLines(
  placedLandmarks: PlacedLandmark[]
): { line: ReferenceLine; from: Point; to: Point }[] {
  const placedIds = new Set(placedLandmarks.map(l => l.landmarkId));
  const result: { line: ReferenceLine; from: Point; to: Point }[] = [];

  for (const line of REFERENCE_LINES) {
    if (placedIds.has(line.from) && placedIds.has(line.to)) {
      const fromPt = getLandmarkPoint(line.from, placedLandmarks);
      const toPt = getLandmarkPoint(line.to, placedLandmarks);
      if (fromPt && toPt) {
        result.push({ line, from: fromPt, to: toPt });
      }
    }
  }

  return result;
}

// =============================================================================
// CALIBRATION HELPERS
// =============================================================================

/**
 * Calculate calibration from known distance
 * Returns pixels per millimeter
 */
export function calculateCalibration(
  point1: Point,
  point2: Point,
  knownDistanceMm: number
): number {
  const pixelDist = distance(point1, point2);
  return pixelDist / knownDistanceMm;
}

/**
 * Standard ruler lengths in mm for calibration
 */
export const CALIBRATION_STANDARDS = [
  { label: '10mm ruler', value: 10 },
  { label: '20mm ruler', value: 20 },
  { label: '50mm ruler', value: 50 },
  { label: '100mm ruler', value: 100 },
  { label: 'Custom', value: 0 },
];
