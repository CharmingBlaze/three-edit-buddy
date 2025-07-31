import { EditableMesh } from '../../core/EditableMesh.js';
import { PrimitiveBuilder } from '../core/PrimitiveBuilder.js';

export interface CubeParams {
  size?: number;
}

/**
 * Creates a cube primitive following the gold standard:
 * - Each logical vertex is created only once
 * - All faces and edges reference vertices by ID
 * - Guarantees connected, Blender-style editing
 */
export function createCube(params: CubeParams = {}): EditableMesh {
  const { size = 1 } = params;
  const halfSize = size / 2;

  const mesh = new EditableMesh();
  const builder = new PrimitiveBuilder(mesh);

  // Create 8 unique vertices for the cube using the builder's deduplication
  const vertexIds = {
    // Front face vertices
    frontBottomLeft: builder.addVertex({ x: -halfSize, y: -halfSize, z: halfSize }, 'front-bottom-left'),
    frontBottomRight: builder.addVertex({ x: halfSize, y: -halfSize, z: halfSize }, 'front-bottom-right'),
    frontTopRight: builder.addVertex({ x: halfSize, y: halfSize, z: halfSize }, 'front-top-right'),
    frontTopLeft: builder.addVertex({ x: -halfSize, y: halfSize, z: halfSize }, 'front-top-left'),
    
    // Back face vertices
    backBottomLeft: builder.addVertex({ x: -halfSize, y: -halfSize, z: -halfSize }, 'back-bottom-left'),
    backBottomRight: builder.addVertex({ x: halfSize, y: -halfSize, z: -halfSize }, 'back-bottom-right'),
    backTopRight: builder.addVertex({ x: halfSize, y: halfSize, z: -halfSize }, 'back-top-right'),
    backTopLeft: builder.addVertex({ x: -halfSize, y: halfSize, z: -halfSize }, 'back-top-left'),
  };

  // Create 6 quad faces with proper edge creation
  // Each face automatically creates its edges with deduplication
  
  // Front face
  builder.addQuad([
    vertexIds.frontBottomLeft,
    vertexIds.frontBottomRight,
    vertexIds.frontTopRight,
    vertexIds.frontTopLeft
  ], 'front');

  // Back face
  builder.addQuad([
    vertexIds.backBottomRight,
    vertexIds.backBottomLeft,
    vertexIds.backTopLeft,
    vertexIds.backTopRight
  ], 'back');

  // Left face
  builder.addQuad([
    vertexIds.backBottomLeft,
    vertexIds.frontBottomLeft,
    vertexIds.frontTopLeft,
    vertexIds.backTopLeft
  ], 'left');

  // Right face
  builder.addQuad([
    vertexIds.frontBottomRight,
    vertexIds.backBottomRight,
    vertexIds.backTopRight,
    vertexIds.frontTopRight
  ], 'right');

  // Top face
  builder.addQuad([
    vertexIds.frontTopLeft,
    vertexIds.frontTopRight,
    vertexIds.backTopRight,
    vertexIds.backTopLeft
  ], 'top');

  // Bottom face
  builder.addQuad([
    vertexIds.backBottomLeft,
    vertexIds.backBottomRight,
    vertexIds.frontBottomRight,
    vertexIds.frontBottomLeft
  ], 'bottom');

  return mesh;
}
