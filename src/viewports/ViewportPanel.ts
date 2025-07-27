import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type {
  ViewportPanelConfig,
  ViewportPanelState,
  CameraPreset,
  ViewportEvent,
  ViewportEventListener,
} from './ViewportState.js';
import {
  createCameraFromPreset,
  updateCameraToPreset,
} from './CameraPresets.js';
import {
  createGridOverlay,
  updateGridOverlay,
  createAxisHelper,
} from './ViewportGridOverlay.js';
import { createViewportMenu } from './ViewportMenu.js';
import { attachFullscreenToggle } from './FullscreenToggle.js';

/**
 * Viewport panel event types
 */
export type ViewportPanelEventType =
  | 'panel-created'
  | 'panel-destroyed'
  | 'preset-changed'
  | 'resized'
  | 'rendered';

/**
 * Viewport panel event data
 */
export interface ViewportPanelEvent {
  type: ViewportPanelEventType;
  panelId: string;
  preset?: CameraPreset;
  width?: number;
  height?: number;
}

/**
 * Viewport panel event listener
 */
export type ViewportPanelEventListener = (event: ViewportPanelEvent) => void;

/**
 * Creates a viewport panel with all necessary components
 * @param config Panel configuration
 * @param scene The shared Three.js scene
 * @param gridSettings Grid configuration
 * @returns The viewport panel instance
 */
export function createViewportPanel(
  config: ViewportPanelConfig,
  scene: THREE.Scene,
  gridSettings: {
    size?: number;
    divisions?: number;
    color?: number;
    centerColor?: number;
  } = {}
): {
  state: ViewportPanelState;
  addEventListener: (
    type: ViewportPanelEventType,
    listener: ViewportPanelEventListener
  ) => void;
  removeEventListener: (
    type: ViewportPanelEventType,
    listener: ViewportPanelEventListener
  ) => void;
  setPreset: (preset: CameraPreset) => void;
  resize: (width: number, height: number) => void;
  render: () => void;
  destroy: () => void;
} {
  const {
    id,
    initialPreset,
    showGrid = true,
    showAxis = true,
    cameraSettings,
  } = config;

  // Event listeners storage
  const eventListeners = new Map<
    ViewportPanelEventType,
    Set<ViewportPanelEventListener>
  >();

  // Add event listener helper
  function addEventListener(
    type: ViewportPanelEventType,
    listener: ViewportPanelEventListener
  ): void {
    if (!eventListeners.has(type)) {
      eventListeners.set(type, new Set());
    }
    eventListeners.get(type)!.add(listener);
  }

  // Remove event listener helper
  function removeEventListener(
    type: ViewportPanelEventType,
    listener: ViewportPanelEventListener
  ): void {
    const listeners = eventListeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  // Emit event helper
  function emitEvent(event: ViewportPanelEvent): void {
    const listeners = eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach((listener) => listener(event));
    }
  }

  // Create panel element
  const panelElement = document.createElement('div');
  panelElement.className = 'viewport-panel';
  panelElement.style.cssText = `
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #1a1a1a;
  `;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.style.cssText = `
    width: 100%;
    height: 100%;
    display: block;
  `;
  panelElement.appendChild(canvas);

  // Create renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(400, 300); // Initial size, will be updated

  // Create camera
  const camera = createCameraFromPreset(initialPreset, cameraSettings);

  // Create controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 0.1;
  controls.maxDistance = 1000;

  // Create grid overlay if enabled
  let gridOverlay: THREE.Object3D | undefined;
  if (showGrid) {
    gridOverlay = createGridOverlay(initialPreset, gridSettings);
    scene.add(gridOverlay);
  }

  // Create axis helper if enabled
  let axisHelper: THREE.Object3D | undefined;
  if (showAxis) {
    axisHelper = createAxisHelper(5, 0.8);
    scene.add(axisHelper);
  }

  // Create menu
  const menu = createViewportMenu(id, {
    presets: [
      'top',
      'front',
      'right',
      'left',
      'back',
      'bottom',
      'perspective',
      'isometric',
    ],
    position: 'top-left',
    theme: 'dark',
  });
  panelElement.appendChild(menu.element);

  // Create fullscreen toggle
  const fullscreenToggle = attachFullscreenToggle(panelElement, id, {
    position: 'top-right',
    theme: 'dark',
    enableDoubleClick: true,
  });

  // Create panel state
  const state: ViewportPanelState = {
    id,
    currentPreset: initialPreset,
    isMaximized: false,
    element: panelElement,
    canvas,
    renderer,
    camera,
    controls,
    menuElement: menu.element,
    fullscreenToggle: fullscreenToggle.element,
    ...(gridOverlay && { gridOverlay }),
    ...(axisHelper && { axisHelper }),
  };

  // Set preset function
  function setPreset(preset: CameraPreset): void {
    if (state.currentPreset === preset) return;

    state.currentPreset = preset;

    // Update camera
    updateCameraToPreset(camera, preset, cameraSettings);

    // Update grid overlay
    if (gridOverlay) {
      updateGridOverlay(gridOverlay, preset, gridSettings);
    }

    // Update controls target
    controls.target.set(0, 0, 0);
    controls.update();

    emitEvent({
      type: 'preset-changed',
      panelId: id,
      preset,
    });
  }

  // Resize function
  function resize(width: number, height: number): void {
    renderer.setSize(width, height);

    // Update camera aspect ratio
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    emitEvent({
      type: 'resized',
      panelId: id,
      width,
      height,
    });
  }

  // Render function
  function render(): void {
    renderer.render(scene, camera);
    controls.update();

    emitEvent({
      type: 'rendered',
      panelId: id,
    });
  }

  // Menu event handlers
  menu.addEventListener('preset-selected', (event) => {
    if (event.preset) {
      setPreset(event.preset);
    }
  });

  // Fullscreen toggle event handlers
  fullscreenToggle.addEventListener('maximize', (event) => {
    state.isMaximized = true;
    fullscreenToggle.setMaximized(true);
  });

  fullscreenToggle.addEventListener('restore', (event) => {
    state.isMaximized = false;
    fullscreenToggle.setMaximized(false);
  });

  // Destroy function
  function destroy(): void {
    // Remove from scene
    if (gridOverlay) {
      scene.remove(gridOverlay);
    }
    if (axisHelper) {
      scene.remove(axisHelper);
    }

    // Dispose renderer
    renderer.dispose();

    // Destroy UI components
    menu.destroy();
    fullscreenToggle.destroy();

    // Remove panel element
    panelElement.remove();

    // Clear event listeners
    eventListeners.clear();

    emitEvent({
      type: 'panel-destroyed',
      panelId: id,
    });
  }

  // Emit created event
  emitEvent({
    type: 'panel-created',
    panelId: id,
  });

  return {
    state,
    addEventListener,
    removeEventListener,
    setPreset,
    resize,
    render,
    destroy,
  };
}
