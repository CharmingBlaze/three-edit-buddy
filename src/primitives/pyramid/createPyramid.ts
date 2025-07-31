import { EditableMesh } from '../../core/EditableMesh.js';
import { PrimitiveBuilder } from '../core/PrimitiveBuilder.js';

export interface PyramidParams {
  size?: number;
  height?: number;
}

/**
 * Creates a pyramid primitive following the gold standard:
 * - Each logical vertex is created only once
 * - All faces and edges reference vertices by ID
 * - Guarantees connected, Blender-style editing
 */
export function createPyramid(params: PyramidParams = {}): EditableMesh {
  const { size = 1, height = 1 } = params;

  const mesh = new EditableMesh();
  const builder = new PrimitiveBuilder(mesh);
  const halfSize = size / 2;
  const halfHeight = height / 2;

  // Create 5 unique vertices for the pyramid using the builder's deduplication
  const vertexIds = {
    // Base vertices
    baseBottomLeft: builder.addVertex({ x: -halfSize, y: -halfHeight, z: -halfSize }, 'base-bottom-left'),
    baseBottomRight: builder.addVertex({ x: halfSize, y: -halfHeight, z: -halfSize }, 'base-bottom-right'),
    baseTopRight: builder.addVertex({ x: halfSize, y: -halfHeight, z: halfSize }, 'base-top-right'),
    baseTopLeft: builder.addVertex({ x: -halfSize, y: -halfHeight, z: halfSize }, 'base-top-left'),
    
    // Apex vertex
    apex: builder.addVertex({ x: 0, y: halfHeight, z: 0 }, 'apex'),
  };

  // Create base face (quad)
  builder.addQuad([
    vertexIds.baseBottomLeft,
    vertexIds.baseBottomRight,
    vertexIds.baseTopRight,
    vertexIds.baseTopLeft
  ], 'base');

  // Create side faces (triangles)
  builder.addTriangle([
    vertexIds.baseBottomLeft,
    vertexIds.baseBottomRight,
    vertexIds.apex
  ], 'side-1');

  builder.addTriangle([
    vertexIds.baseBottomRight,
    vertexIds.baseTopRight,
    vertexIds.apex
  ], 'side-2');

  builder.addTriangle([
    vertexIds.baseTopRight,
    vertexIds.baseTopLeft,
    vertexIds.apex
  ], 'side-3');

  builder.addTriangle([
    vertexIds.baseTopLeft,
    vertexIds.baseBottomLeft,
    vertexIds.apex
  ], 'side-4');

  return mesh;
}
