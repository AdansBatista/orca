/**
 * 3D Model Loaders
 *
 * Utilities for loading STL and PLY files using Three.js loaders.
 */

import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

import type { LoadedModel, Model3DFormat } from './types';

// =============================================================================
// LOADERS
// =============================================================================

const stlLoader = new STLLoader();
const plyLoader = new PLYLoader();
const objLoader = new OBJLoader();

/**
 * Load a 3D model from URL
 */
export async function loadModel(
  url: string,
  format: Model3DFormat,
  onProgress?: (progress: number) => void
): Promise<LoadedModel> {
  return new Promise((resolve, reject) => {
    const progressHandler = (event: ProgressEvent) => {
      if (event.lengthComputable && onProgress) {
        onProgress((event.loaded / event.total) * 100);
      }
    };

    const handleGeometry = (geometry: THREE.BufferGeometry) => {
      // Compute bounding box if not already computed
      geometry.computeBoundingBox();

      // Compute normals if not present
      if (!geometry.attributes.normal) {
        geometry.computeVertexNormals();
      }

      const boundingBox = geometry.boundingBox!;
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);

      const size = new THREE.Vector3();
      boundingBox.getSize(size);
      const diagonal = size.length();

      const vertexCount = geometry.attributes.position.count;
      const faceCount = geometry.index
        ? geometry.index.count / 3
        : vertexCount / 3;

      const loadedModel: LoadedModel = {
        geometry,
        format,
        boundingBox: {
          min: { x: boundingBox.min.x, y: boundingBox.min.y, z: boundingBox.min.z },
          max: { x: boundingBox.max.x, y: boundingBox.max.y, z: boundingBox.max.z },
        },
        center: { x: center.x, y: center.y, z: center.z },
        size: diagonal,
        vertexCount,
        faceCount,
        hasVertexColors: !!geometry.attributes.color,
        hasNormals: !!geometry.attributes.normal,
      };

      resolve(loadedModel);
    };

    const errorHandler = (error: unknown) => {
      reject(new Error(`Failed to load ${format} file: ${error}`));
    };

    switch (format) {
      case 'STL':
        stlLoader.load(url, handleGeometry, progressHandler, errorHandler);
        break;

      case 'PLY':
        plyLoader.load(url, handleGeometry, progressHandler, errorHandler);
        break;

      case 'OBJ':
        objLoader.load(
          url,
          (obj) => {
            // OBJ loader returns a Group, extract geometry from first mesh
            let geometry: THREE.BufferGeometry | null = null;
            obj.traverse((child) => {
              if (child instanceof THREE.Mesh && !geometry) {
                geometry = child.geometry as THREE.BufferGeometry;
              }
            });

            if (geometry) {
              handleGeometry(geometry);
            } else {
              reject(new Error('No geometry found in OBJ file'));
            }
          },
          progressHandler,
          errorHandler
        );
        break;

      default:
        reject(new Error(`Unsupported format: ${format}`));
    }
  });
}

/**
 * Load model from File object (for uploads)
 */
export async function loadModelFromFile(
  file: File,
  format: Model3DFormat,
  onProgress?: (progress: number) => void
): Promise<LoadedModel> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress((event.loaded / event.total) * 50); // First 50% is reading
      }
    };

    reader.onload = async (event) => {
      const result = event.target?.result;
      if (!result) {
        reject(new Error('Failed to read file'));
        return;
      }

      try {
        let geometry: THREE.BufferGeometry;

        if (format === 'STL') {
          // STL can be binary or ASCII
          if (result instanceof ArrayBuffer) {
            geometry = stlLoader.parse(result);
          } else {
            // Text STL - convert to ArrayBuffer
            const encoder = new TextEncoder();
            const buffer = encoder.encode(result as string);
            geometry = stlLoader.parse(buffer.buffer);
          }
        } else if (format === 'PLY') {
          if (result instanceof ArrayBuffer) {
            geometry = plyLoader.parse(result);
          } else {
            const encoder = new TextEncoder();
            const buffer = encoder.encode(result as string);
            geometry = plyLoader.parse(buffer.buffer);
          }
        } else if (format === 'OBJ') {
          if (typeof result === 'string') {
            const obj = objLoader.parse(result);
            let foundGeometry: THREE.BufferGeometry | null = null;
            obj.traverse((child) => {
              if (child instanceof THREE.Mesh && !foundGeometry) {
                foundGeometry = child.geometry as THREE.BufferGeometry;
              }
            });
            if (!foundGeometry) {
              throw new Error('No geometry found in OBJ file');
            }
            geometry = foundGeometry;
          } else {
            throw new Error('OBJ files must be text format');
          }
        } else {
          throw new Error(`Unsupported format: ${format}`);
        }

        // Compute bounding box and normals
        geometry.computeBoundingBox();
        if (!geometry.attributes.normal) {
          geometry.computeVertexNormals();
        }

        const boundingBox = geometry.boundingBox!;
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);

        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        const diagonal = size.length();

        const vertexCount = geometry.attributes.position.count;
        const faceCount = geometry.index
          ? geometry.index.count / 3
          : vertexCount / 3;

        onProgress?.(100);

        const loadedModel: LoadedModel = {
          geometry,
          format,
          boundingBox: {
            min: { x: boundingBox.min.x, y: boundingBox.min.y, z: boundingBox.min.z },
            max: { x: boundingBox.max.x, y: boundingBox.max.y, z: boundingBox.max.z },
          },
          center: { x: center.x, y: center.y, z: center.z },
          size: diagonal,
          vertexCount,
          faceCount,
          hasVertexColors: !!geometry.attributes.color,
          hasNormals: !!geometry.attributes.normal,
        };

        resolve(loadedModel);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    // STL and PLY can be binary, read as ArrayBuffer
    if (format === 'STL' || format === 'PLY') {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
}

/**
 * Center and scale geometry to fit in a unit box
 */
export function normalizeGeometry(
  geometry: THREE.BufferGeometry,
  targetSize: number = 50
): void {
  geometry.computeBoundingBox();
  const boundingBox = geometry.boundingBox!;

  // Center the geometry
  const center = new THREE.Vector3();
  boundingBox.getCenter(center);
  geometry.translate(-center.x, -center.y, -center.z);

  // Scale to target size
  const size = new THREE.Vector3();
  boundingBox.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = targetSize / maxDim;
  geometry.scale(scale, scale, scale);

  // Recompute bounding box
  geometry.computeBoundingBox();
}

/**
 * Calculate distance between two 3D points
 */
export function calculateDistance(
  p1: { x: number; y: number; z: number },
  p2: { x: number; y: number; z: number }
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Get model statistics
 */
export function getModelStats(model: LoadedModel): {
  vertices: string;
  faces: string;
  size: string;
  format: string;
  hasColors: boolean;
} {
  const sizeVec = new THREE.Vector3(
    model.boundingBox.max.x - model.boundingBox.min.x,
    model.boundingBox.max.y - model.boundingBox.min.y,
    model.boundingBox.max.z - model.boundingBox.min.z
  );

  return {
    vertices: formatNumber(model.vertexCount),
    faces: formatNumber(model.faceCount),
    size: `${sizeVec.x.toFixed(1)} x ${sizeVec.y.toFixed(1)} x ${sizeVec.z.toFixed(1)} mm`,
    format: model.format,
    hasColors: model.hasVertexColors,
  };
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
