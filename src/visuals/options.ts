/**
 * Options for vertex visualization
 */
export interface VertexVisualOptions {
  /** Color for vertices (default: 0xffff00) */
  color?: number;
  /** Size of vertex markers (default: 0.1) */
  size?: number;
  /** Whether to show vertex markers (default: true) */
  visible?: boolean;
  /** Shape of vertex markers: 'sphere' or 'cube' (default: 'cube') */
  shape?: 'sphere' | 'cube';
}

/**
 * Options for edge visualization
 */
export interface EdgeVisualOptions {
  /** Color for edges (default: 0xff0000) */
  color?: number;
  /** Width of edge lines (default: 2) */
  width?: number;
  /** Whether to show edge lines (default: true) */
  visible?: boolean;
  /** Opacity of edge lines (default: 1.0) */
  opacity?: number;
}

/**
 * Options for face visualization
 */
export interface FaceVisualOptions {
  /** Color for faces (default: 0x00ff00) */
  color?: number;
  /** Opacity of face overlays (default: 0.3) */
  opacity?: number;
  /** Whether to show face overlays (default: true) */
  visible?: boolean;
  /** Whether to use flat shading (default: false) */
  flatShading?: boolean;
}

/**
 * Options for selection highlighting
 */
export interface SelectionVisualOptions {
  /** Color for selected vertices (default: 0xff6600) */
  selectedVertexColor?: number;
  /** Color for selected edges (default: 0x00ffff) */
  selectedEdgeColor?: number;
  /** Color for selected faces (default: 0xff6600) */
  selectedFaceColor?: number;
  /** Size of selected vertex markers (default: 0.15) */
  selectedVertexSize?: number;
  /** Width of selected edge lines (default: 8) */
  selectedEdgeWidth?: number;
  /** Opacity of selected face overlays (default: 0.6) */
  selectedFaceOpacity?: number;
}

/**
 * Complete options for mesh visualization
 */
export interface MeshVisualOptions {
  vertices?: VertexVisualOptions;
  edges?: EdgeVisualOptions;
  faces?: FaceVisualOptions;
  selection?: SelectionVisualOptions;
}
