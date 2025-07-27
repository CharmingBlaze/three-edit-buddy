import { EditableMesh } from '../../core/EditableMesh.js';
import { Vector3Like } from '../../types/index.js';

export interface ConeParams {
  radius?: number;
  height?: number;
  segments?: number;
}

/**
 * Creates a cone primitive with a base
 */
export function createCone(params: ConeParams = {}): EditableMesh {
  const { radius = 0.5, height = 1, segments = 8 } = params;

  const mesh = new EditableMesh();
  const halfHeight = height / 2;

  // Create vertices
  const vertices: { id: number; position: Vector3Like }[] = [];

  // Top vertex
  vertices.push({
    id: mesh.addVertex({ x: 0, y: halfHeight, z: 0 }).id,
    position: { x: 0, y: halfHeight, z: 0 },
  });

  // Bottom ring
  for (let seg = 0; seg < segments; seg++) {
    const theta = (2 * Math.PI * seg) / segments;
    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);
    vertices.push({
      id: mesh.addVertex({ x, y: -halfHeight, z }).id,
      position: { x, y: -halfHeight, z },
    });
  }

  // Create faces
  for (let seg = 0; seg < segments; seg++) {
    const nextSeg = (seg + 1) % segments;

    // Side face
    mesh.addFace(
      [vertices[0]!.id, vertices[1 + seg]!.id, vertices[1 + nextSeg]!.id],
      []
    );

    // Add edges for side face
    mesh.addEdge(vertices[0]!.id, vertices[1 + seg]!.id);
    mesh.addEdge(vertices[1 + seg]!.id, vertices[1 + nextSeg]!.id);
    mesh.addEdge(vertices[1 + nextSeg]!.id, vertices[0]!.id);
  }

  // Add edges for bottom ring
  for (let seg = 0; seg < segments; seg++) {
    const nextSeg = (seg + 1) % segments;
    mesh.addEdge(vertices[1 + seg]!.id, vertices[1 + nextSeg]!.id);
  }

  return mesh;
}
