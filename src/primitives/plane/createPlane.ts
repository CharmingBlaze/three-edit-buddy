import { EditableMesh } from '../../core/EditableMesh.js';
import type { PlaneParams } from '../core/ParamTypes.js';

/**
 * Creates a plane primitive
 */
export function createPlane(params: PlaneParams = {}): EditableMesh {
  const { 
    width = 1, 
    height = 1
  } = params;
  
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  const mesh = new EditableMesh();

  // Create vertices
  const vertices = [
    {
      id: mesh.addVertex({ x: -halfWidth, y: 0, z: -halfHeight }).id,
      position: { x: -halfWidth, y: 0, z: -halfHeight },
    }, // 0
    {
      id: mesh.addVertex({ x: halfWidth, y: 0, z: -halfHeight }).id,
      position: { x: halfWidth, y: 0, z: -halfHeight },
    }, // 1
    {
      id: mesh.addVertex({ x: halfWidth, y: 0, z: halfHeight }).id,
      position: { x: halfWidth, y: 0, z: halfHeight },
    }, // 2
    {
      id: mesh.addVertex({ x: -halfWidth, y: 0, z: halfHeight }).id,
      position: { x: -halfWidth, y: 0, z: halfHeight },
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
