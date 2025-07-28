import { EditableMesh } from '../../core/EditableMesh.js';

export interface DodecahedronParams {
  size?: number;
}

/**
 * Creates a dodecahedron primitive (12-sided polyhedron)
 */
export function createDodecahedron(params: DodecahedronParams = {}): EditableMesh {
  const { size = 1 } = params;
  const halfSize = size / 2;

  const mesh = new EditableMesh();

  // Golden ratio for dodecahedron
  const phi = (1 + Math.sqrt(5)) / 2;
  const invPhi = 1 / phi;

  // Create 20 vertices for dodecahedron
  const vertices = [
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

  // Add vertices to mesh
  const vertexIds = vertices.map(vertex => mesh.addVertex(vertex).id);

  // Create 12 pentagonal faces
  // Face 1: (0,1,2,3,4)
  mesh.addFace([vertexIds[0]!, vertexIds[1]!, vertexIds[2]!, vertexIds[3]!, vertexIds[4]!], []);
  
  // Face 2: (5,6,7,8,9)
  mesh.addFace([vertexIds[5]!, vertexIds[6]!, vertexIds[7]!, vertexIds[8]!, vertexIds[9]!], []);
  
  // Face 3: (10,11,12,13,14)
  mesh.addFace([vertexIds[10]!, vertexIds[11]!, vertexIds[12]!, vertexIds[13]!, vertexIds[14]!], []);
  
  // Face 4: (15,16,17,18,19)
  mesh.addFace([vertexIds[15]!, vertexIds[16]!, vertexIds[17]!, vertexIds[18]!, vertexIds[19]!], []);
  
  // Face 5: (0,4,8,12,16)
  mesh.addFace([vertexIds[0]!, vertexIds[4]!, vertexIds[8]!, vertexIds[12]!, vertexIds[16]!], []);
  
  // Face 6: (1,5,9,13,17)
  mesh.addFace([vertexIds[1]!, vertexIds[5]!, vertexIds[9]!, vertexIds[13]!, vertexIds[17]!], []);
  
  // Face 7: (2,6,10,14,18)
  mesh.addFace([vertexIds[2]!, vertexIds[6]!, vertexIds[10]!, vertexIds[14]!, vertexIds[18]!], []);
  
  // Face 8: (3,7,11,15,19)
  mesh.addFace([vertexIds[3]!, vertexIds[7]!, vertexIds[11]!, vertexIds[15]!, vertexIds[19]!], []);
  
  // Face 9: (0,1,5,9,13)
  mesh.addFace([vertexIds[0]!, vertexIds[1]!, vertexIds[5]!, vertexIds[9]!, vertexIds[13]!], []);
  
  // Face 10: (2,3,7,11,15)
  mesh.addFace([vertexIds[2]!, vertexIds[3]!, vertexIds[7]!, vertexIds[11]!, vertexIds[15]!], []);
  
  // Face 11: (4,5,9,13,17)
  mesh.addFace([vertexIds[4]!, vertexIds[5]!, vertexIds[9]!, vertexIds[13]!, vertexIds[17]!], []);
  
  // Face 12: (6,7,11,15,19)
  mesh.addFace([vertexIds[6]!, vertexIds[7]!, vertexIds[11]!, vertexIds[15]!, vertexIds[19]!], []);

  // Add edges for all faces
  // For each face, add edges between consecutive vertices
  const faceVertexLists = [
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19],
    [0, 4, 8, 12, 16],
    [1, 5, 9, 13, 17],
    [2, 6, 10, 14, 18],
    [3, 7, 11, 15, 19],
    [0, 1, 5, 9, 13],
    [2, 3, 7, 11, 15],
    [4, 5, 9, 13, 17],
    [6, 7, 11, 15, 19],
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