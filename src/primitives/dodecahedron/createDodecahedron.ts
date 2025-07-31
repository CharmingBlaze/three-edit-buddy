import { EditableMesh } from '../../core/EditableMesh.js';
import { PrimitiveBuilder } from '../core/PrimitiveBuilder.js';

export interface DodecahedronParams {
  size?: number;
}

/**
 * Creates a dodecahedron primitive following the gold standard:
 * - Each logical vertex is created only once
 * - All faces and edges reference vertices by ID
 * - Guarantees connected, Blender-style editing
 */
export function createDodecahedron(params: DodecahedronParams = {}): EditableMesh {
  const { size = 1 } = params;
  const halfSize = size / 2;

  const mesh = new EditableMesh();
  const builder = new PrimitiveBuilder(mesh);

  // Golden ratio for dodecahedron
  const phi = (1 + Math.sqrt(5)) / 2;
  const invPhi = 1 / phi;

  // Create 20 unique vertices for dodecahedron using the builder's deduplication
  const vertexPositions = [
    // (±1, ±1, ±1)
    { x: halfSize, y: halfSize, z: halfSize },
    { x: -halfSize, y: halfSize, z: halfSize },
    { x: halfSize, y: -halfSize, z: halfSize },
    { x: -halfSize, y: -halfSize, z: halfSize },
    { x: halfSize, y: halfSize, z: -halfSize },
    { x: -halfSize, y: halfSize, z: -halfSize },
    { x: halfSize, y: -halfSize, z: -halfSize },
    { x: -halfSize, y: -halfSize, z: -halfSize },

    // (0, ±phi, ±invPhi)
    { x: 0, y: halfSize * phi, z: halfSize * invPhi },
    { x: 0, y: -halfSize * phi, z: halfSize * invPhi },
    { x: 0, y: halfSize * phi, z: -halfSize * invPhi },
    { x: 0, y: -halfSize * phi, z: -halfSize * invPhi },

    // (±invPhi, 0, ±phi)
    { x: halfSize * invPhi, y: 0, z: halfSize * phi },
    { x: -halfSize * invPhi, y: 0, z: halfSize * phi },
    { x: halfSize * invPhi, y: 0, z: -halfSize * phi },
    { x: -halfSize * invPhi, y: 0, z: -halfSize * phi },

    // (±phi, ±invPhi, 0)
    { x: halfSize * phi, y: halfSize * invPhi, z: 0 },
    { x: -halfSize * phi, y: halfSize * invPhi, z: 0 },
    { x: halfSize * phi, y: -halfSize * invPhi, z: 0 },
    { x: -halfSize * phi, y: -halfSize * invPhi, z: 0 },
  ];

  // Add vertices to mesh using builder for deduplication
  const vertexIds = vertexPositions.map((pos, index) => 
    builder.addVertex(pos, `dodecahedron-vertex-${index}`)
  );

  // Create 12 pentagonal faces (n-gons)
  const faceDefinitions = [
    [0, 1, 2, 3, 4], // Face 1
    [5, 6, 7, 8, 9], // Face 2
    [10, 11, 12, 13, 14], // Face 3
    [15, 16, 17, 18, 19], // Face 4
    [0, 4, 8, 12, 16], // Face 5
    [1, 5, 9, 13, 17], // Face 6
    [2, 6, 10, 14, 18], // Face 7
    [3, 7, 11, 15, 19], // Face 8
    [0, 1, 5, 9, 13], // Face 9
    [2, 3, 7, 11, 15], // Face 10
    [4, 5, 9, 13, 17], // Face 11
    [6, 7, 11, 15, 19], // Face 12
  ];

  // Create faces using builder for proper edge creation
  faceDefinitions.forEach((faceVertexIndices, faceIndex) => {
    const faceVertexIds = faceVertexIndices.map(index => vertexIds[index]!);
    builder.addNGon(faceVertexIds, `dodecahedron-face-${faceIndex}`);
  });

  return mesh;
} 