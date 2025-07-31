import { EditableMesh } from '../../core/EditableMesh.js';
import { PrimitiveBuilder } from '../core/PrimitiveBuilder.js';
import type { PlaneParams } from '../core/ParamTypes.js';

/**
 * Creates a plane primitive following the gold standard:
 * - Each logical vertex is created only once
 * - All faces and edges reference vertices by ID
 * - Guarantees connected, Blender-style editing
 */
export function createPlane(params: PlaneParams = {}): EditableMesh {
  const { 
    width = 1, 
    height = 1
  } = params;
  
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  const mesh = new EditableMesh();
  const builder = new PrimitiveBuilder(mesh);

  // Create 4 unique vertices for the plane using the builder's deduplication
  const vertexIds = {
    bottomLeft: builder.addVertex({ x: -halfWidth, y: 0, z: -halfHeight }, 'bottom-left'),
    bottomRight: builder.addVertex({ x: halfWidth, y: 0, z: -halfHeight }, 'bottom-right'),
    topRight: builder.addVertex({ x: halfWidth, y: 0, z: halfHeight }, 'top-right'),
    topLeft: builder.addVertex({ x: -halfWidth, y: 0, z: halfHeight }, 'top-left'),
  };

  // Create a single quad face with proper edge creation
  builder.addQuad([
    vertexIds.bottomLeft,
    vertexIds.bottomRight,
    vertexIds.topRight,
    vertexIds.topLeft
  ], 'plane');

  return mesh;
}
