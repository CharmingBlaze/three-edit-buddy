import { Object3D } from 'three';

/**
 * Options for the UV grid helper
 */
export interface UVGridHelperOptions {
  /** Size of the UV grid */
  size?: number;
  /** Number of divisions in the UV grid */
  divisions?: number;
  /** Color of the grid lines */
  color?: number | string;
  /** Opacity of the grid */
  opacity?: number;
  /** Visibility of the grid */
  visible?: boolean;
}

/**
 * Creates a UV grid helper for visualizing UV coordinates
 * @param options Configuration options
 * @returns A Three.js Object3D representing the UV grid
 */
export function UVGridHelper(options: UVGridHelperOptions = {}): Object3D {
  const {
    size = 1,
    divisions = 10,
    color = 0x444444,
    opacity = 0.5,
    visible = true,
  } = options;

  // Create the grid helper object
  const gridHelper = new Object3D();

  // In a real implementation, this would create a visual grid
  // for UV coordinate visualization

  // Apply options
  gridHelper.visible = visible;

  // Store options for later updates
  (gridHelper as any).gridOptions = { size, divisions, color, opacity };

  return gridHelper;
}
