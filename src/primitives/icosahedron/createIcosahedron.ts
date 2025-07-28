import { EditableMesh } from '../../core/EditableMesh.js';

export interface IcosahedronParams {
  size?: number;
}

/**
 * Creates an icosahedron primitive (20-sided polyhedron)
 */
export function createIcosahedron(params: IcosahedronParams = {}): EditableMesh {
  const { size = 1 } = params;
  const halfSize = size / 2;

  const mesh = new EditableMesh();

  // Golden ratio for icosahedron
  const phi = (1 + Math.sqrt(5)) / 2;

  // Create 12 vertices for icosahedron
  const vertices = [
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

  // Add vertices to mesh
  const vertexIds = vertices.map(vertex => mesh.addVertex(vertex).id);

  // Create 20 triangular faces
  // Top faces (around vertex 0)
  mesh.addFace([vertexIds[0]!, vertexIds[4]!, vertexIds[8]!], []); // 0,4,8
  mesh.addFace([vertexIds[0]!, vertexIds[8]!, vertexIds[6]!], []); // 0,8,6
  mesh.addFace([vertexIds[0]!, vertexIds[6]!, vertexIds[1]!], []); // 0,6,1
  mesh.addFace([vertexIds[0]!, vertexIds[1]!, vertexIds[9]!], []); // 0,1,9
  mesh.addFace([vertexIds[0]!, vertexIds[9]!, vertexIds[4]!], []); // 0,9,4

  // Bottom faces (around vertex 3)
  mesh.addFace([vertexIds[3]!, vertexIds[5]!, vertexIds[10]!], []); // 3,5,10
  mesh.addFace([vertexIds[3]!, vertexIds[10]!, vertexIds[7]!], []); // 3,10,7
  mesh.addFace([vertexIds[3]!, vertexIds[7]!, vertexIds[2]!], []); // 3,7,2
  mesh.addFace([vertexIds[3]!, vertexIds[2]!, vertexIds[11]!], []); // 3,2,11
  mesh.addFace([vertexIds[3]!, vertexIds[11]!, vertexIds[5]!], []); // 3,11,5

  // Middle faces (connecting top and bottom)
  mesh.addFace([vertexIds[1]!, vertexIds[6]!, vertexIds[7]!], []); // 1,6,7
  mesh.addFace([vertexIds[1]!, vertexIds[7]!, vertexIds[2]!], []); // 1,7,2
  mesh.addFace([vertexIds[1]!, vertexIds[2]!, vertexIds[9]!], []); // 1,2,9
  mesh.addFace([vertexIds[1]!, vertexIds[9]!, vertexIds[6]!], []); // 1,9,6

  mesh.addFace([vertexIds[4]!, vertexIds[9]!, vertexIds[11]!], []); // 4,9,11
  mesh.addFace([vertexIds[4]!, vertexIds[11]!, vertexIds[5]!], []); // 4,11,5
  mesh.addFace([vertexIds[4]!, vertexIds[5]!, vertexIds[8]!], []); // 4,5,8
  mesh.addFace([vertexIds[4]!, vertexIds[8]!, vertexIds[9]!], []); // 4,8,9

  mesh.addFace([vertexIds[6]!, vertexIds[9]!, vertexIds[11]!], []); // 6,9,11
  mesh.addFace([vertexIds[6]!, vertexIds[11]!, vertexIds[7]!], []); // 6,11,7

  // Add edges for all faces
  // For each face, add edges between consecutive vertices
  const faceVertexLists = [
    [0, 4, 8],
    [0, 8, 6],
    [0, 6, 1],
    [0, 1, 9],
    [0, 9, 4],
    [3, 5, 10],
    [3, 10, 7],
    [3, 7, 2],
    [3, 2, 11],
    [3, 11, 5],
    [1, 6, 7],
    [1, 7, 2],
    [1, 2, 9],
    [1, 9, 6],
    [4, 9, 11],
    [4, 11, 5],
    [4, 5, 8],
    [4, 8, 9],
    [6, 9, 11],
    [6, 11, 7],
  ];

  for (const faceVertices of faceVertexLists) {
    for (let i = 0; i < faceVertices.length; i++) {
      const current = faceVertices[i]!;
      const next = faceVertices[(i + 1) % faceVertices.length]!;
      mesh.addEdge(vertexIds[current]!, vertexIds[next]!);
    }
  }

  return mesh;
} 