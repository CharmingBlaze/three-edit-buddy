import { GridHelper, Color } from 'three';

/**
 * Options for the 3D grid helper
 */
export interface GridHelper3DOptions {
  /** Size of the grid (width and height) */
  size?: number;
  /** Number of divisions in the grid */
  divisions?: number;
  /** Color of the grid's center lines */
  centerColor?: number | string;
  /** Color of the grid's other lines */
  gridColor?: number | string;
  /** Opacity of the grid (0-1) */
  opacity?: number;
}

/**
 * Creates a Blender-style 3D grid helper
 * @param options Configuration options for the grid
 * @returns A Three.js GridHelper object
 */
export function GridHelper3D(options: GridHelper3DOptions = {}): GridHelper {
  const {
    size = 20,
    divisions = 20,
    centerColor = 0x444444,
    gridColor = 0x888888,
    opacity = 1.0
  } = options;

  // Create the grid helper
  const gridHelper = new GridHelper(size, divisions, new Color(centerColor), new Color(gridColor));
  
  // Set grid opacity if needed
  if (opacity < 1.0) {
    if (gridHelper.material instanceof Array) {
      gridHelper.material.forEach(mat => {
        mat.transparent = true;
        mat.opacity = opacity;
      });
    } else {
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = opacity;
    }
  }

  // Position the grid on the XZ plane (y=0)
  gridHelper.position.set(0, 0, 0);
  gridHelper.rotation.set(0, 0, 0);
  
  // Add a name for easy identification
  gridHelper.name = 'GridHelper3D';

  return gridHelper;
}
