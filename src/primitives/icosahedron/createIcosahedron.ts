import { EditableMesh } from '../../core/EditableMesh.js';
import { PrimitiveBuilder } from '../core/PrimitiveBuilder.js';

export interface IcosahedronParams {
  size?: number;
}

/**
 * Creates an icosahedron primitive following the gold standard:
 * - Each logical vertex is created only once
 * - All faces and edges reference vertices by ID
 * - Guarantees connected, Blender-style editing
 */
export function createIcosahedron(params: IcosahedronParams = {}): EditableMesh {
  const { size = 1 } = params;
  const halfSize = size / 2;

  const mesh = new EditableMesh();
  const builder = new PrimitiveBuilder(mesh);

  // Golden ratio for icosahedron
  const phi = (1 + Math.sqrt(5)) / 2;

  // Create 12 unique vertices for icosahedron using the builder's deduplication
  const vertexPositions = [
    // (±1, ±phi, 0)
    { x: halfSize, y: halfSize * phi, z: 0 },
    { x: -halfSize, y: halfSize * phi, z: 0 },
    { x: halfSize, y: -halfSize * phi, z: 0 },
    { x: -halfSize, y: -halfSize * phi, z: 0 },

    // (0, ±1, ±phi)
    { x: 0, y: halfSize, z: halfSize * phi },
    { x: 0, y: -halfSize, z: halfSize * phi },
    { x: 0, y: halfSize, z: -halfSize * phi },
    { x: 0, y: -halfSize, z: -halfSize * phi },

    // (±phi, 0, ±1)
    { x: halfSize * phi, y: 0, z: halfSize },
    { x: -halfSize * phi, y: 0, z: halfSize },
    { x: halfSize * phi, y: 0, z: -halfSize },
    { x: -halfSize * phi, y: 0, z: -halfSize },
  ];

  // Add vertices to mesh using builder for deduplication
  const vertexIds = vertexPositions.map((pos, index) => 
    builder.addVertex(pos, `icosahedron-vertex-${index}`)
  );

  // Create 20 triangular faces
  const faceDefinitions = [
    // Top faces (around vertex 0)
    [0, 4, 8], // 0,4,8
    [0, 8, 6], // 0,8,6
    [0, 6, 1], // 0,6,1
    [0, 1, 9], // 0,1,9
    [0, 9, 4], // 0,9,4

    // Bottom faces (around vertex 3)
    [3, 5, 10], // 3,5,10
    [3, 10, 7], // 3,10,7
    [3, 7, 2], // 3,7,2
    [3, 2, 11], // 3,2,11
    [3, 11, 5], // 3,11,5

    // Middle faces (connecting top and bottom)
    [1, 6, 7], // 1,6,7
    [1, 7, 2], // 1,7,2
    [1, 2, 9], // 1,2,9
    [1, 9, 6], // 1,9,6

    [4, 9, 11], // 4,9,11
    [4, 11, 5], // 4,11,5
    [4, 5, 8], // 4,5,8
    [4, 8, 9], // 4,8,9

    [6, 9, 11], // 6,9,11
    [6, 11, 7], // 6,11,7
  ];

  // Create faces using builder for proper edge creation
  faceDefinitions.forEach((faceVertexIndices, faceIndex) => {
    const faceVertexIds = faceVertexIndices.map(index => vertexIds[index]!);
    builder.addTriangle(faceVertexIds, `icosahedron-face-${faceIndex}`);
  });

  return mesh;
} 