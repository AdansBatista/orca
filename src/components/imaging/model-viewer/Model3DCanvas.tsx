'use client';

import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  Grid,
  GizmoHelper,
  GizmoViewport,
  Environment,
  Center,
} from '@react-three/drei';
import * as THREE from 'three';

import type { ViewerState, LoadedModel, ViewPreset } from './types';
import { VIEW_PRESET_POSITIONS } from './types';

interface Model3DCanvasProps {
  model: LoadedModel | null;
  viewerState: ViewerState;
  onCameraChange?: (position: { x: number; y: number; z: number }) => void;
}

interface ModelMeshProps {
  model: LoadedModel;
  viewerState: ViewerState;
}

function ModelMesh({ model, viewerState }: ModelMeshProps) {
  const meshRef = useRef<THREE.Mesh | THREE.Points>(null);
  const { material, renderMode, clippingEnabled, clippingPosition, clippingAxis } = viewerState;

  // Create clipping plane
  const clippingPlane = useMemo(() => {
    if (!clippingEnabled || !model) return null;

    const normal = new THREE.Vector3(
      clippingAxis === 'x' ? 1 : 0,
      clippingAxis === 'y' ? 1 : 0,
      clippingAxis === 'z' ? 1 : 0
    );

    // Calculate position based on bounding box
    const min = model.boundingBox.min[clippingAxis];
    const max = model.boundingBox.max[clippingAxis];
    const pos = min + (max - min) * clippingPosition;

    return new THREE.Plane(normal, -pos);
  }, [clippingEnabled, clippingPosition, clippingAxis, model]);

  // Create material based on settings
  const meshMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: material.color,
      metalness: material.metalness,
      roughness: material.roughness,
      opacity: material.opacity,
      transparent: material.opacity < 1,
      wireframe: renderMode === 'WIREFRAME',
      side: THREE.DoubleSide,
    });

    if (clippingPlane) {
      mat.clippingPlanes = [clippingPlane];
      mat.clipShadows = true;
    }

    return mat;
  }, [material, renderMode, clippingPlane]);

  // Create point material for points mode
  const pointsMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      color: material.color,
      size: 0.5,
      sizeAttenuation: true,
    });
  }, [material.color]);

  // Use vertex colors if available
  useEffect(() => {
    if (model.hasVertexColors && meshMaterial) {
      meshMaterial.vertexColors = true;
    }
  }, [model.hasVertexColors, meshMaterial]);

  if (renderMode === 'POINTS') {
    return (
      <points ref={meshRef as React.MutableRefObject<THREE.Points>}>
        <bufferGeometry attach="geometry" {...model.geometry} />
        <primitive attach="material" object={pointsMaterial} />
      </points>
    );
  }

  return (
    <mesh ref={meshRef} geometry={model.geometry} material={meshMaterial} />
  );
}

interface CameraControllerProps {
  viewerState: ViewerState;
  modelSize: number;
  onCameraChange?: (position: { x: number; y: number; z: number }) => void;
}

function CameraController({ viewerState, modelSize, onCameraChange }: CameraControllerProps) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  // Update camera position when view preset changes
  useEffect(() => {
    const pos = viewerState.cameraPosition;
    const scale = modelSize / 50; // Normalize based on model size
    camera.position.set(pos.x * scale, pos.y * scale, pos.z * scale);
    camera.lookAt(0, 0, 0);
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  }, [viewerState.cameraPosition, modelSize, camera]);

  // Report camera changes
  useFrame(() => {
    if (onCameraChange) {
      onCameraChange({
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      });
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      autoRotate={viewerState.autoRotate}
      autoRotateSpeed={2}
      enableDamping
      dampingFactor={0.05}
      minDistance={modelSize * 0.5}
      maxDistance={modelSize * 5}
    />
  );
}

function Scene({ model, viewerState, onCameraChange }: Model3DCanvasProps) {
  const { gl } = useThree();

  // Enable clipping planes in renderer
  useEffect(() => {
    gl.localClippingEnabled = viewerState.clippingEnabled;
  }, [gl, viewerState.clippingEnabled]);

  const modelSize = model?.size || 100;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} castShadow />
      <directionalLight position={[-10, -10, -10]} intensity={0.3} />

      {/* Environment for reflections */}
      <Environment preset="studio" />

      {/* Grid */}
      {viewerState.showGrid && (
        <Grid
          args={[modelSize * 2, modelSize * 2]}
          cellSize={modelSize / 10}
          cellThickness={0.5}
          cellColor="#6e6e6e"
          sectionSize={modelSize / 2}
          sectionThickness={1}
          sectionColor="#9d4b4b"
          fadeDistance={modelSize * 3}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid={true}
        />
      )}

      {/* Axes Helper via Gizmo */}
      {viewerState.showAxes && (
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport
            axisColors={['#ff6b6b', '#4ecdc4', '#45b7d1']}
            labelColor="white"
          />
        </GizmoHelper>
      )}

      {/* Model */}
      {model && (
        <Center>
          <ModelMesh model={model} viewerState={viewerState} />
        </Center>
      )}

      {/* Camera Controls */}
      <CameraController
        viewerState={viewerState}
        modelSize={modelSize}
        onCameraChange={onCameraChange}
      />
    </>
  );
}

export function Model3DCanvas({ model, viewerState, onCameraChange }: Model3DCanvasProps) {
  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-900 to-gray-800">
      <Canvas
        camera={{
          fov: 45,
          near: 0.1,
          far: 10000,
          position: [70, 70, 70],
        }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        <Scene model={model} viewerState={viewerState} onCameraChange={onCameraChange} />
      </Canvas>
    </div>
  );
}
