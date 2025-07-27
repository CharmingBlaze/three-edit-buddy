import * as THREE from 'three';
import type { CameraPreset, CameraPresetConfig } from './ViewportState.js';

/**
 * Default camera preset configurations
 */
const CAMERA_PRESETS: Record<CameraPreset, CameraPresetConfig> = {
  top: {
    name: 'Top',
    type: 'orthographic',
    position: [0, 10, 0],
    target: [0, 0, 0],
    up: [0, 0, -1],
    orthographicSize: 10,
    near: 0.1,
    far: 1000,
  },
  front: {
    name: 'Front',
    type: 'orthographic',
    position: [0, 0, 10],
    target: [0, 0, 0],
    up: [0, 1, 0],
    orthographicSize: 10,
    near: 0.1,
    far: 1000,
  },
  right: {
    name: 'Right',
    type: 'orthographic',
    position: [10, 0, 0],
    target: [0, 0, 0],
    up: [0, 1, 0],
    orthographicSize: 10,
    near: 0.1,
    far: 1000,
  },
  left: {
    name: 'Left',
    type: 'orthographic',
    position: [-10, 0, 0],
    target: [0, 0, 0],
    up: [0, 1, 0],
    orthographicSize: 10,
    near: 0.1,
    far: 1000,
  },
  back: {
    name: 'Back',
    type: 'orthographic',
    position: [0, 0, -10],
    target: [0, 0, 0],
    up: [0, 1, 0],
    orthographicSize: 10,
    near: 0.1,
    far: 1000,
  },
  bottom: {
    name: 'Bottom',
    type: 'orthographic',
    position: [0, -10, 0],
    target: [0, 0, 0],
    up: [0, 0, 1],
    orthographicSize: 10,
    near: 0.1,
    far: 1000,
  },
  perspective: {
    name: 'Perspective',
    type: 'perspective',
    position: [5, 5, 5],
    target: [0, 0, 0],
    up: [0, 1, 0],
    fov: 75,
    near: 0.1,
    far: 1000,
  },
  isometric: {
    name: 'Isometric',
    type: 'orthographic',
    position: [5, 5, 5],
    target: [0, 0, 0],
    up: [0, 1, 0],
    orthographicSize: 10,
    near: 0.1,
    far: 1000,
  },
};

/**
 * Creates a camera based on a preset configuration
 * @param preset The camera preset to create
 * @param customSettings Optional custom camera settings to override defaults
 * @returns A configured Three.js camera
 */
export function createCameraFromPreset(
  preset: CameraPreset,
  customSettings?: {
    fov?: number;
    near?: number;
    far?: number;
    orthographic?: boolean;
    orthographicSize?: number;
  }
): THREE.PerspectiveCamera | THREE.OrthographicCamera {
  const config = CAMERA_PRESETS[preset];

  if (!config) {
    throw new Error(`Unknown camera preset: ${preset}`);
  }

  const settings = {
    fov: customSettings?.fov ?? config.fov ?? 75,
    near: customSettings?.near ?? config.near ?? 0.1,
    far: customSettings?.far ?? config.far ?? 1000,
    orthographicSize:
      customSettings?.orthographicSize ?? config.orthographicSize ?? 10,
  };

  let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;

  if (config.type === 'orthographic' || customSettings?.orthographic) {
    camera = new THREE.OrthographicCamera(
      -settings.orthographicSize,
      settings.orthographicSize,
      settings.orthographicSize,
      -settings.orthographicSize,
      settings.near,
      settings.far
    );
  } else {
    camera = new THREE.PerspectiveCamera(
      settings.fov,
      1, // Aspect ratio will be set later
      settings.near,
      settings.far
    );
  }

  // Set camera position and orientation
  camera.position.set(...config.position);
  camera.lookAt(...config.target);
  camera.up.set(...config.up);

  return camera;
}

/**
 * Gets the display name for a camera preset
 * @param preset The camera preset
 * @returns The display name
 */
export function getPresetDisplayName(preset: CameraPreset): string {
  return CAMERA_PRESETS[preset]?.name ?? preset;
}

/**
 * Gets all available camera presets
 * @returns Array of all camera presets
 */
export function getAllCameraPresets(): CameraPreset[] {
  return Object.keys(CAMERA_PRESETS) as CameraPreset[];
}

/**
 * Gets camera preset configuration
 * @param preset The camera preset
 * @returns The preset configuration
 */
export function getCameraPresetConfig(
  preset: CameraPreset
): CameraPresetConfig {
  const config = CAMERA_PRESETS[preset];
  if (!config) {
    throw new Error(`Unknown camera preset: ${preset}`);
  }
  return { ...config };
}

/**
 * Updates a camera to match a preset configuration
 * @param camera The camera to update
 * @param preset The preset to apply
 * @param customSettings Optional custom settings
 */
export function updateCameraToPreset(
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
  preset: CameraPreset,
  customSettings?: {
    fov?: number;
    near?: number;
    far?: number;
    orthographic?: boolean;
    orthographicSize?: number;
  }
): void {
  const config = CAMERA_PRESETS[preset];

  if (!config) {
    throw new Error(`Unknown camera preset: ${preset}`);
  }

  const settings = {
    fov: customSettings?.fov ?? config.fov ?? 75,
    near: customSettings?.near ?? config.near ?? 0.1,
    far: customSettings?.far ?? config.far ?? 1000,
    orthographicSize:
      customSettings?.orthographicSize ?? config.orthographicSize ?? 10,
  };

  // Update camera properties
  camera.position.set(...config.position);
  camera.lookAt(...config.target);
  camera.up.set(...config.up);

  // Update camera-specific properties
  if (
    camera instanceof THREE.PerspectiveCamera &&
    config.type === 'perspective'
  ) {
    camera.fov = settings.fov;
    camera.near = settings.near;
    camera.far = settings.far;
    camera.updateProjectionMatrix();
  } else if (
    camera instanceof THREE.OrthographicCamera &&
    config.type === 'orthographic'
  ) {
    camera.left = -settings.orthographicSize;
    camera.right = settings.orthographicSize;
    camera.top = settings.orthographicSize;
    camera.bottom = -settings.orthographicSize;
    camera.near = settings.near;
    camera.far = settings.far;
    camera.updateProjectionMatrix();
  }
}

/**
 * Gets the appropriate grid plane for a camera preset
 * @param preset The camera preset
 * @returns The grid plane ('xy', 'xz', 'yz')
 */
export function getGridPlaneForPreset(
  preset: CameraPreset
): 'xy' | 'xz' | 'yz' {
  switch (preset) {
    case 'top':
    case 'bottom':
      return 'xz';
    case 'front':
    case 'back':
      return 'xy';
    case 'right':
    case 'left':
      return 'yz';
    case 'perspective':
    case 'isometric':
    default:
      return 'xy'; // Default to XY plane for perspective views
  }
}

/**
 * Gets the camera type for a preset
 * @param preset The camera preset
 * @returns The camera type
 */
export function getCameraTypeForPreset(
  preset: CameraPreset
): 'perspective' | 'orthographic' {
  return CAMERA_PRESETS[preset]?.type ?? 'perspective';
}
