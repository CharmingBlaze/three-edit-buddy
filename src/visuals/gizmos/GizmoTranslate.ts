import { Object3D } from 'three';

/**
 * Options for the translation gizmo
 */
export interface GizmoTranslateOptions {
  /** Size of the gizmo */
  size?: number;
  /** Color of the X axis */
  xColor?: number | string;
  /** Color of the Y axis */
  yColor?: number | string;
  /** Color of the Z axis */
  zColor?: number | string;
  /** Visibility of the gizmo */
  visible?: boolean;
}

/**
 * Creates a translation gizmo for manipulating objects in 3D space
 * @param options Configuration options
 * @returns A Three.js Object3D representing the translation gizmo
 */
export function GizmoTranslate(options: GizmoTranslateOptions = {}): Object3D {
  const {
    size = 1,
    xColor = 0xff0000, // Red
    yColor = 0x00ff00, // Green
    zColor = 0x0000ff, // Blue
    visible = true
  } = options;
  
  // Create the gizmo object
  const gizmo = new Object3D();
  
  // In a real implementation, this would create visual representations
  // of the X, Y, and Z axes for translation manipulation
  
  // Apply options
  gizmo.visible = visible;
  
  // Store options for later updates
  (gizmo as any).gizmoOptions = { size, xColor, yColor, zColor };
  
  return gizmo;
}
