import { EditableMesh } from '../../core/EditableMesh.js';

export interface OctahedronParams {
  size?: number;
}

/**
 * Creates an octahedron primitive (8-sided polyhedron)
 */
export function createOctahedron(params: OctahedronParams = {}): EditableMesh {
  const { size = 1 } = params;
  const halfSize = size / 2;

  const mesh = new EditableMesh();

  // Create 6 vertices for octahedron
  const vertices = [
    // Top vertex
    {
      id: mesh.addVertex({ x: 0, y: halfSize, z: 0 }).id,
      position: { x: 0, y: halfSize, z: 0 },
    },
    // Bottom vertex
    {
      id: mesh.addVertex({ x: 0, y: -halfSize, z: 0 }).id,
      position: { x: 0, y: -halfSize, z: 0 },
    },
    // Front vertex
    {
      id: mesh.addVertex({ x: 0, y: 0, z: halfSize }).id,
      position: { x: 0, y: 0, z: halfSize },
    },
    // Back vertex
    {
      id: mesh.addVertex({ x: 0, y: 0, z: -halfSize }).id,
      position: { x: 0, y: 0, z: -halfSize },
    },
    // Right vertex
    {
      id: mesh.addVertex({ x: halfSize, y: 0, z: 0 }).id,
      position: { x: halfSize, y: 0, z: 0 },
    },
    // Left vertex
    {
      id: mesh.addVertex({ x: -halfSize, y: 0, z: 0 }).id,
      position: { x: -halfSize, y: 0, z: 0 },
    },
  ];

  // Create 8 triangular faces
  // Top faces
  mesh.addFace([vertices[0]!.id, vertices[2]!.id, vertices[4]!.id], []); // Top-front-right
  mesh.addFace([vertices[0]!.id, vertices[4]!.id, vertices[3]!.id], []); // Top-right-back
  mesh.addFace([vertices[0]!.id, vertices[3]!.id, vertices[5]!.id], []); // Top-back-left
  mesh.addFace([vertices[0]!.id, vertices[5]!.id, vertices[2]!.id], []); // Top-left-front

  // Bottom faces
  mesh.addFace([vertices[1]!.id, vertices[4]!.id, vertices[2]!.id], []); // Bottom-right-front
  mesh.addFace([vertices[1]!.id, vertices[3]!.id, vertices[4]!.id], []); // Bottom-back-right
  mesh.addFace([vertices[1]!.id, vertices[5]!.id, vertices[3]!.id], []); // Bottom-left-back
  mesh.addFace([vertices[1]!.id, vertices[2]!.id, vertices[5]!.id], []); // Bottom-front-left

  // Add edges for all faces
  // Top edges
  mesh.addEdge(vertices[0]!.id, vertices[2]!.id);
  mesh.addEdge(vertices[2]!.id, vertices[4]!.id);
  mesh.addEdge(vertices[4]!.id, vertices[0]!.id);

  mesh.addEdge(vertices[0]!.id, vertices[4]!.id);
  mesh.addEdge(vertices[4]!.id, vertices[3]!.id);
  mesh.addEdge(vertices[3]!.id, vertices[0]!.id);

  mesh.addEdge(vertices[0]!.id, vertices[3]!.id);
  mesh.addEdge(vertices[3]!.id, vertices[5]!.id);
  mesh.addEdge(vertices[5]!.id, vertices[0]!.id);

  mesh.addEdge(vertices[0]!.id, vertices[5]!.id);
  mesh.addEdge(vertices[5]!.id, vertices[2]!.id);
  mesh.addEdge(vertices[2]!.id, vertices[0]!.id);

  // Bottom edges
  mesh.addEdge(vertices[1]!.id, vertices[4]!.id);
  mesh.addEdge(vertices[4]!.id, vertices[2]!.id);
  mesh.addEdge(vertices[2]!.id, vertices[1]!.id);

  mesh.addEdge(vertices[1]!.id, vertices[3]!.id);
  mesh.addEdge(vertices[3]!.id, vertices[4]!.id);
  mesh.addEdge(vertices[4]!.id, vertices[1]!.id);

  mesh.addEdge(vertices[1]!.id, vertices[5]!.id);
  mesh.addEdge(vertices[5]!.id, vertices[3]!.id);
  mesh.addEdge(vertices[3]!.id, vertices[1]!.id);

  mesh.addEdge(vertices[1]!.id, vertices[2]!.id);
  mesh.addEdge(vertices[2]!.id, vertices[5]!.id);
  mesh.addEdge(vertices[5]!.id, vertices[1]!.id);

  return mesh;
} 