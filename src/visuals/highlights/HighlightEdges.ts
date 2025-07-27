import { Object3D } from 'three';

/**
 * Options for edge highlighting
 */
export interface HighlightEdgesOptions {
  /** Color of the edge highlights */
  color?: number | string;
  /** Width of the edge highlights */
  width?: number;
  /** Visibility of the edge highlights */
  visible?: boolean;
}

/**
 * Creates visualization highlights for selected edges
 * @param edgeIds Array of edge IDs to highlight
 * @param options Configuration options
 * @returns A Three.js Object3D representing the edge highlights
 */
export function HighlightEdges(
  edgeIds: number[],
  options: HighlightEdgesOptions = {}
): Object3D {
  const {
    color = 0x0000ff, // Blue
    width = 2,
    visible = true,
  } = options;

  // Create the highlights object
  const highlights = new Object3D();

  // In a real implementation, this would create visual highlights
  // for each edge in the edgeIds array

  // Apply options
  highlights.visible = visible;

  // Store edge IDs and options for later updates
  (highlights as any).edgeIds = edgeIds;
  (highlights as any).highlightOptions = { color, width };

  return highlights;
}
