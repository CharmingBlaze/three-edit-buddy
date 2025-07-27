/**
 * Visual helpers and utilities
 */

// Core visual helper
export { MeshVisualHelper } from './MeshVisualHelper.js';
export type {
  MeshVisualOptions,
  VertexVisualOptions,
  EdgeVisualOptions,
  FaceVisualOptions,
  SelectionVisualOptions,
} from './MeshVisualHelper.js';

// Existing visual helpers
export * from './highlights/index.js';
export * from './gizmos/index.js';
export * from './grids/index.js';
export * from './handles/index.js';
export * from './overlays/index.js';
export * from './uvs/index.js';
export * from './animation/index.js';
