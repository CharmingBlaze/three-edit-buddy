import { EditableMesh } from '../../core/EditableMesh.js';
import { Vector3Like } from '../../types/index.js';

export interface PyramidParams {
  size?: number;
  height?: number;
}

/**
 * Creates a pyramid primitive with a square base
 */
export function createPyramid(params: PyramidParams = {}): EditableMesh {
  const { size = 1, height = 1 } = params;

  const mesh = new EditableMesh();
  const halfSize = size / 2;
  const halfHeight = height / 2;

  // Create vertices
  const vertices = [
    // Base
    {
      id: mesh.addVertex({ x: -halfSize, y: -halfHeight, z: -halfSize }).id,
      position: { x: -halfSize, y: -halfHeight, z: -halfSize },
    }, // 0
    {
      id: mesh.addVertex({ x: halfSize, y: -halfHeight, z: -halfSize }).id,
      position: { x: halfSize, y: -halfHeight, z: -halfSize },
    }, // 1
    {
      id: mesh.addVertex({ x: halfSize, y: -halfHeight, z: halfSize }).id,
      position: { x: halfSize, y: -halfHeight, z: halfSize },
    }, // 2
    {
      id: mesh.addVertex({ x: -halfSize, y: -halfHeight, z: halfSize }).id,
      position: { x: -halfSize, y: -halfHeight, z: halfSize },
    }, // 3
    // Top
    {
      id: mesh.addVertex({ x: 0, y: halfHeight, z: 0 }).id,
      position: { x: 0, y: halfHeight, z: 0 },
    }, // 4
  ];

  // Create faces
  mesh.addFace(
    [vertices[0]!.id, vertices[1]!.id, vertices[2]!.id, vertices[3]!.id],
    []
  ); // Base
  mesh.addFace([vertices[0]!.id, vertices[1]!.id, vertices[4]!.id], []); // Side 1
  mesh.addFace([vertices[1]!.id, vertices[2]!.id, vertices[4]!.id], []); // Side 2
  mesh.addFace([vertices[2]!.id, vertices[3]!.id, vertices[4]!.id], []); // Side 3
  mesh.addFace([vertices[3]!.id, vertices[0]!.id, vertices[4]!.id], []); // Side 4

  // Add edges for base
  mesh.addEdge(vertices[0]!.id, vertices[1]!.id);
  mesh.addEdge(vertices[1]!.id, vertices[2]!.id);
  mesh.addEdge(vertices[2]!.id, vertices[3]!.id);
  mesh.addEdge(vertices[3]!.id, vertices[0]!.id);

  // Add edges for sides
  mesh.addEdge(vertices[0]!.id, vertices[4]!.id);
  mesh.addEdge(vertices[1]!.id, vertices[4]!.id);
  mesh.addEdge(vertices[2]!.id, vertices[4]!.id);
  mesh.addEdge(vertices[3]!.id, vertices[4]!.id);

  return mesh;
}
