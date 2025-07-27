import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Available camera/view presets
 */
export type CameraPreset = 
  | 'top' 
  | 'front' 
  | 'right' 
  | 'left' 
  | 'back' 
  | 'bottom' 
  | 'perspective' 
  | 'isometric';

/**
 * Viewport layout options
 */
export type ViewportLayout = '2x2' | '1x1' | '1x2' | '2x1';

/**
 * Viewport panel configuration
 */
export interface ViewportPanelConfig {
  /** Unique identifier for the panel */
  id: string;
  /** Initial camera preset */
  initialPreset: CameraPreset;
  /** Whether to show grid overlay */
  showGrid?: boolean;
  /** Whether to show axis helper */
  showAxis?: boolean;
  /** Custom camera settings */
  cameraSettings?: {
    fov?: number;
    near?: number;
    far?: number;
    orthographic?: boolean;
    orthographicSize?: number;
  };
}

/**
 * Viewport system configuration
 */
export interface ViewportSystemConfig {
  /** The shared Three.js scene */
  scene: THREE.Scene;
  /** Container element for the viewport system */
  container: HTMLElement;
  /** Layout configuration */
  layout: ViewportLayout;
  /** Panel configurations */
  panels: ViewportPanelConfig[];
  /** Available camera presets */
  cameraPresets?: CameraPreset[];
  /** Grid settings */
  gridSettings?: {
    size?: number;
    divisions?: number;
    color?: number;
    centerColor?: number;
  };
  /** Whether to enable fullscreen toggle */
  enableFullscreen?: boolean;
  /** Whether to enable view switching */
  enableViewSwitching?: boolean;
}

/**
 * Individual viewport panel state
 */
export interface ViewportPanelState {
  /** Panel ID */
  id: string;
  /** Current camera preset */
  currentPreset: CameraPreset;
  /** Whether panel is maximized */
  isMaximized: boolean;
  /** Panel element */
  element: HTMLElement;
  /** Canvas element */
  canvas: HTMLCanvasElement;
  /** Three.js renderer */
  renderer: THREE.WebGLRenderer;
  /** Three.js camera */
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  /** Orbit controls */
  controls: OrbitControls;
  /** Grid overlay */
  gridOverlay?: THREE.Object3D;
  /** Axis helper */
  axisHelper?: THREE.Object3D;
  /** Menu element */
  menuElement?: HTMLElement;
  /** Fullscreen toggle element */
  fullscreenToggle?: HTMLElement;
}

/**
 * Overall viewport system state
 */
export interface ViewportSystemState {
  /** System configuration */
  config: ViewportSystemConfig;
  /** Panel states */
  panels: Map<string, ViewportPanelState>;
  /** Currently maximized panel ID */
  maximizedPanelId: string | null;
  /** Whether system is initialized */
  isInitialized: boolean;
  /** Animation frame ID */
  animationFrameId: number | null;
}

/**
 * Camera preset configuration
 */
export interface CameraPresetConfig {
  /** Preset name */
  name: string;
  /** Camera type */
  type: 'perspective' | 'orthographic';
  /** Camera position */
  position: [number, number, number];
  /** Camera target/look-at point */
  target: [number, number, number];
  /** Camera up vector */
  up: [number, number, number];
  /** Field of view (for perspective) */
  fov?: number;
  /** Orthographic size (for orthographic) */
  orthographicSize?: number;
  /** Near plane */
  near?: number;
  /** Far plane */
  far?: number;
}

/**
 * Viewport event types
 */
export type ViewportEventType = 
  | 'panel-created'
  | 'panel-destroyed'
  | 'preset-changed'
  | 'maximized'
  | 'restored'
  | 'layout-changed';

/**
 * Viewport event data
 */
export interface ViewportEvent {
  type: ViewportEventType;
  panelId?: string;
  preset?: CameraPreset;
  layout?: ViewportLayout;
  data?: any;
}

/**
 * Viewport event listener
 */
export type ViewportEventListener = (event: ViewportEvent) => void; 