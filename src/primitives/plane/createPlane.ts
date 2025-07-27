import { EditableMesh } from '../../core/EditableMesh.js';
import { Vector3Like } from '../../types/index.js';

export interface PlaneParams {
  size?: number;
}

/**
 * Creates a plane primitive
 */
export function createPlane(params: PlaneParams = {}): EditableMesh {
  const { size = 1 } = params;
  const halfSize = size / 2;

  const mesh = new EditableMesh();

  // Create vertices
  const vertices = [
    {
      id: mesh.addVertex({ x: -halfSize, y: 0, z: -halfSize }).id,
      position: { x: -halfSize, y: 0, z: -halfSize },
    }, // 0
    {
      id: mesh.addVertex({ x: halfSize, y: 0, z: -halfSize }).id,
      position: { x: halfSize, y: 0, z: -halfSize },
    }, // 1
    {
      id: mesh.addVertex({ x: halfSize, y: 0, z: halfSize }).id,
      position: { x: halfSize, y: 0, z: halfSize },
    }, // 2
    {
      id: mesh.addVertex({ x: -halfSize, y: 0, z: halfSize }).id,
      position: { x: -halfSize, y: 0, z: halfSize },
    }, // 3
  ];

  // Create face
  mesh.addFace(
    [vertices[0]!.id, vertices[1]!.id, vertices[2]!.id, vertices[3]!.id],
    []
  );

  // Add edges for plane
  mesh.addEdge(vertices[0]!.id, vertices[1]!.id);
  mesh.addEdge(vertices[1]!.id, vertices[2]!.id);
  mesh.addEdge(vertices[2]!.id, vertices[3]!.id);
  mesh.addEdge(vertices[3]!.id, vertices[0]!.id);

  return mesh;
}
