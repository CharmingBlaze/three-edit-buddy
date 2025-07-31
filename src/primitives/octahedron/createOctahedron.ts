import { EditableMesh } from '../../core/EditableMesh.js';
import { PrimitiveBuilder } from '../core/PrimitiveBuilder.js';

export interface OctahedronParams {
  size?: number;
}

/**
 * Creates an octahedron primitive following the gold standard:
 * - Each logical vertex is created only once
 * - All faces and edges reference vertices by ID
 * - Guarantees connected, Blender-style editing
 */
export function createOctahedron(params: OctahedronParams = {}): EditableMesh {
  const { size = 1 } = params;
  const halfSize = size / 2;

  const mesh = new EditableMesh();
  const builder = new PrimitiveBuilder(mesh);

  // Create 6 unique vertices for octahedron using the builder's deduplication
  const vertexIds = {
    top: builder.addVertex({ x: 0, y: halfSize, z: 0 }, 'top'),
    bottom: builder.addVertex({ x: 0, y: -halfSize, z: 0 }, 'bottom'),
    front: builder.addVertex({ x: 0, y: 0, z: halfSize }, 'front'),
    back: builder.addVertex({ x: 0, y: 0, z: -halfSize }, 'back'),
    right: builder.addVertex({ x: halfSize, y: 0, z: 0 }, 'right'),
    left: builder.addVertex({ x: -halfSize, y: 0, z: 0 }, 'left'),
  };

  // Create 8 triangular faces with proper edge creation
  // Top faces
  builder.addTriangle([vertexIds.top, vertexIds.front, vertexIds.right], 'top-front-right');
  builder.addTriangle([vertexIds.top, vertexIds.right, vertexIds.back], 'top-right-back');
  builder.addTriangle([vertexIds.top, vertexIds.back, vertexIds.left], 'top-back-left');
  builder.addTriangle([vertexIds.top, vertexIds.left, vertexIds.front], 'top-left-front');

  // Bottom faces
  builder.addTriangle([vertexIds.bottom, vertexIds.right, vertexIds.front], 'bottom-right-front');
  builder.addTriangle([vertexIds.bottom, vertexIds.back, vertexIds.right], 'bottom-back-right');
  builder.addTriangle([vertexIds.bottom, vertexIds.left, vertexIds.back], 'bottom-left-back');
  builder.addTriangle([vertexIds.bottom, vertexIds.front, vertexIds.left], 'bottom-front-left');

  return mesh;
} 