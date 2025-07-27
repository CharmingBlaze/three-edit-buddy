import * as THREE from 'three';
import type { CameraPreset } from './ViewportState.js';
import { getGridPlaneForPreset } from './CameraPresets.js';

/**
 * Grid overlay configuration
 */
export interface GridOverlayConfig {
  /** Grid size */
  size?: number;
  /** Number of divisions */
  divisions?: number;
  /** Grid color */
  color?: number;
  /** Center line color */
  centerColor?: number;
  /** Grid opacity */
  opacity?: number;
  /** Whether to show center lines */
  showCenterLines?: boolean;
  /** Whether to show axis lines */
  showAxisLines?: boolean;
}

/**
 * Creates a grid overlay appropriate for the given camera preset
 * @param preset The camera preset
 * @param config Grid configuration
 * @returns A Three.js Object3D containing the grid overlay
 */
export function createGridOverlay(
  preset: CameraPreset, 
  config: GridOverlayConfig = {}
): THREE.Object3D {
  const {
    size = 20,
    divisions = 20,
    color = 0x888888,
    centerColor = 0x444444,
    opacity = 0.5,
    showCenterLines = true,
    showAxisLines = true
  } = config;

  const group = new THREE.Group();
  group.name = `GridOverlay_${preset}`;

  const gridPlane = getGridPlaneForPreset(preset);
  
  // Create main grid
  const gridHelper = new THREE.GridHelper(size, divisions, color, color);
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = opacity;
  
  // Position grid based on plane
  switch (gridPlane) {
    case 'xy':
      // Default orientation (XY plane)
      break;
    case 'xz':
      // Rotate 90 degrees around X axis for XZ plane
      gridHelper.rotation.x = Math.PI / 2;
      break;
    case 'yz':
      // Rotate 90 degrees around Z axis for YZ plane
      gridHelper.rotation.z = Math.PI / 2;
      break;
  }
  
  group.add(gridHelper);

  // Add center lines if enabled
  if (showCenterLines) {
    const centerLines = createCenterLines(size, centerColor, opacity, gridPlane);
    group.add(centerLines);
  }

  // Add axis lines if enabled
  if (showAxisLines) {
    const axisLines = createAxisLines(size, opacity, gridPlane);
    group.add(axisLines);
  }

  return group;
}

/**
 * Creates center lines for the grid
 * @param size Grid size
 * @param color Line color
 * @param opacity Line opacity
 * @param plane Grid plane
 * @returns Center lines object
 */
function createCenterLines(
  size: number, 
  color: number, 
  opacity: number, 
  plane: 'xy' | 'xz' | 'yz'
): THREE.Object3D {
  const group = new THREE.Group();
  group.name = 'CenterLines';

  const material = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: opacity,
    linewidth: 2
  });

  const halfSize = size / 2;

  // Create center lines based on plane
  switch (plane) {
    case 'xy':
      // X center line
      const xLineGeometry = new THREE.BufferGeometry();
      xLineGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
        -halfSize, 0, 0,
        halfSize, 0, 0
      ], 3));
      const xLine = new THREE.Line(xLineGeometry, material);
      group.add(xLine);

      // Y center line
      const yLineGeometry = new THREE.BufferGeometry();
      yLineGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
        0, -halfSize, 0,
        0, halfSize, 0
      ], 3));
      const yLine = new THREE.Line(yLineGeometry, material);
      group.add(yLine);
      break;

    case 'xz':
      // X center line
      const xzXLineGeometry = new THREE.BufferGeometry();
      xzXLineGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
        -halfSize, 0, 0,
        halfSize, 0, 0
      ], 3));
      const xzXLine = new THREE.Line(xzXLineGeometry, material);
      group.add(xzXLine);

      // Z center line
      const zLineGeometry = new THREE.BufferGeometry();
      zLineGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
        0, 0, -halfSize,
        0, 0, halfSize
      ], 3));
      const zLine = new THREE.Line(zLineGeometry, material);
      group.add(zLine);
      break;

    case 'yz':
      // Y center line
      const yzYLineGeometry = new THREE.BufferGeometry();
      yzYLineGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
        0, -halfSize, 0,
        0, halfSize, 0
      ], 3));
      const yzYLine = new THREE.Line(yzYLineGeometry, material);
      group.add(yzYLine);

      // Z center line
      const yzZLineGeometry = new THREE.BufferGeometry();
      yzZLineGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
        0, 0, -halfSize,
        0, 0, halfSize
      ], 3));
      const yzZLine = new THREE.Line(yzZLineGeometry, material);
      group.add(yzZLine);
      break;
  }

  return group;
}

/**
 * Creates axis lines for the grid
 * @param size Grid size
 * @param opacity Line opacity
 * @param plane Grid plane
 * @returns Axis lines object
 */
function createAxisLines(
  size: number, 
  opacity: number, 
  plane: 'xy' | 'xz' | 'yz'
): THREE.Object3D {
  const group = new THREE.Group();
  group.name = 'AxisLines';

  const halfSize = size / 2;

  // X axis (red)
  const xAxisMaterial = new THREE.LineBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: opacity,
    linewidth: 3
  });

  // Y axis (green)
  const yAxisMaterial = new THREE.LineBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: opacity,
    linewidth: 3
  });

  // Z axis (blue)
  const zAxisMaterial = new THREE.LineBasicMaterial({
    color: 0x0000ff,
    transparent: true,
    opacity: opacity,
    linewidth: 3
  });

  // Create axis lines based on plane
  switch (plane) {
    case 'xy':
      // X axis
      const xAxisGeometry = new THREE.BufferGeometry();
      xAxisGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
        0, 0, 0,
        halfSize, 0, 0
      ], 3));
      const xAxis = new THREE.Line(xAxisGeometry, xAxisMaterial);
      group.add(xAxis);

      // Y axis
      const yAxisGeometry = new THREE.BufferGeometry();
      yAxisGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
        0, 0, 0,
        0, halfSize, 0
      ], 3));
      const yAxis = new THREE.Line(yAxisGeometry, yAxisMaterial);
      group.add(yAxis);
      break;

    case 'xz':
      // X axis
      const xzXAxisGeometry = new THREE.BufferGeometry();
      xzXAxisGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
        0, 0, 0,
        halfSize, 0, 0
      ], 3));
      const xzXAxis = new THREE.Line(xzXAxisGeometry, xAxisMaterial);
      group.add(xzXAxis);

      // Z axis
      const zAxisGeometry = new THREE.BufferGeometry();
      zAxisGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
        0, 0, 0,
        0, 0, halfSize
      ], 3));
      const zAxis = new THREE.Line(zAxisGeometry, zAxisMaterial);
      group.add(zAxis);
      break;

    case 'yz':
      // Y axis
      const yzYAxisGeometry = new THREE.BufferGeometry();
      yzYAxisGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
        0, 0, 0,
        0, halfSize, 0
      ], 3));
      const yzYAxis = new THREE.Line(yzYAxisGeometry, yAxisMaterial);
      group.add(yzYAxis);

      // Z axis
      const yzZAxisGeometry = new THREE.BufferGeometry();
      yzZAxisGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
        0, 0, 0,
        0, 0, halfSize
      ], 3));
      const yzZAxis = new THREE.Line(yzZAxisGeometry, zAxisMaterial);
      group.add(yzZAxis);
      break;
  }

  return group;
}

/**
 * Updates an existing grid overlay for a new camera preset
 * @param gridOverlay The existing grid overlay
 * @param preset The new camera preset
 * @param config Grid configuration
 */
export function updateGridOverlay(
  gridOverlay: THREE.Object3D,
  preset: CameraPreset,
  config: GridOverlayConfig = {}
): void {
  // Remove existing grid overlay
  gridOverlay.clear();

  // Create new grid overlay
  const newGridOverlay = createGridOverlay(preset, config);
  
  // Copy children from new overlay
  newGridOverlay.children.forEach(child => {
    gridOverlay.add(child);
  });

  // Update name
  gridOverlay.name = `GridOverlay_${preset}`;
}

/**
 * Creates a simple axis helper for the viewport
 * @param size Axis size
 * @param opacity Line opacity
 * @returns Axis helper object
 */
export function createAxisHelper(size: number = 5, opacity: number = 0.8): THREE.Object3D {
  const group = new THREE.Group();
  group.name = 'AxisHelper';

  // X axis (red)
  const xAxisMaterial = new THREE.LineBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: opacity,
    linewidth: 2
  });

  // Y axis (green)
  const yAxisMaterial = new THREE.LineBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: opacity,
    linewidth: 2
  });

  // Z axis (blue)
  const zAxisMaterial = new THREE.LineBasicMaterial({
    color: 0x0000ff,
    transparent: true,
    opacity: opacity,
    linewidth: 2
  });

  // Create axis lines
  const xAxisGeometry = new THREE.BufferGeometry();
  xAxisGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0,
    size, 0, 0
  ], 3));
  const xAxis = new THREE.Line(xAxisGeometry, xAxisMaterial);
  group.add(xAxis);

  const yAxisGeometry = new THREE.BufferGeometry();
  yAxisGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0,
    0, size, 0
  ], 3));
  const yAxis = new THREE.Line(yAxisGeometry, yAxisMaterial);
  group.add(yAxis);

  const zAxisGeometry = new THREE.BufferGeometry();
  zAxisGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0,
    0, 0, size
  ], 3));
  const zAxis = new THREE.Line(zAxisGeometry, zAxisMaterial);
  group.add(zAxis);

  return group;
} 