import { EditableMesh } from '../../core/EditableMesh.js';
import { PrimitiveBuilder } from '../core/PrimitiveBuilder.js';
import { applyMaterial } from '../core/PrimitiveUtils.js';
import type { CubeParams } from '../core/ParamTypes.js';

/**
 * Creates a simple cube with exactly 8 vertices
 * This is used for testing purposes to match expected validation test results
 */
export function createSimpleCube(params: CubeParams = {}): EditableMesh {
  const {
    size = 1,
    width = size,
    height = size,
    depth = size,
    material,
    uvs,
  } = params;

  const mesh = new EditableMesh();
  const builder = new PrimitiveBuilder(mesh);

  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const halfDepth = depth / 2;

  // Create the 8 vertices of a cube
  const v0 = builder.addVertex(
    { x: -halfWidth, y: -halfHeight, z: halfDepth },
    'v0'
  ); // front-bottom-left
  const v1 = builder.addVertex(
    { x: halfWidth, y: -halfHeight, z: halfDepth },
    'v1'
  ); // front-bottom-right
  const v2 = builder.addVertex(
    { x: halfWidth, y: halfHeight, z: halfDepth },
    'v2'
  ); // front-top-right
  const v3 = builder.addVertex(
    { x: -halfWidth, y: halfHeight, z: halfDepth },
    'v3'
  ); // front-top-left
  const v4 = builder.addVertex(
    { x: -halfWidth, y: -halfHeight, z: -halfDepth },
    'v4'
  ); // back-bottom-left
  const v5 = builder.addVertex(
    { x: halfWidth, y: -halfHeight, z: -halfDepth },
    'v5'
  ); // back-bottom-right
  const v6 = builder.addVertex(
    { x: halfWidth, y: halfHeight, z: -halfDepth },
    'v6'
  ); // back-top-right
  const v7 = builder.addVertex(
    { x: -halfWidth, y: halfHeight, z: -halfDepth },
    'v7'
  ); // back-top-left

  // Create the 6 faces
  builder.addQuad([v0, v1, v2, v3], 'front'); // front face
  builder.addQuad([v5, v4, v7, v6], 'back'); // back face
  builder.addQuad([v4, v0, v3, v7], 'left'); // left face
  builder.addQuad([v1, v5, v6, v2], 'right'); // right face
  builder.addQuad([v3, v2, v6, v7], 'top'); // top face
  builder.addQuad([v4, v5, v1, v0], 'bottom'); // bottom face

  // Apply material
  applyMaterial(builder, material);

  // Apply simple UVs if enabled
  if (uvs?.enabled !== false) {
    // Simple UV mapping for each face
    const uvs_per_face = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1], // front
    ];

    // Apply UVs to each vertex (simplified - each vertex gets the same UV on all faces)
    [v0, v1, v2, v3, v4, v5, v6, v7].forEach((vertexId, index) => {
      const uv = uvs_per_face[index % 4];
      builder.addUV(vertexId, uv[0], uv[1]);
    });
  }

  return mesh;
}
