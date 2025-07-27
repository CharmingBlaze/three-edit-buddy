import { EditableMesh } from '../../core/EditableMesh.js';
import { Vector3Like } from '../../types/index.js';

export interface CylinderParams {
  radius?: number;
  height?: number;
  segments?: number;
}

/**
 * Creates a cylinder primitive with top and bottom caps
 */
export function createCylinder(params: CylinderParams = {}): EditableMesh {
  const {
    radius = 0.5,
    height = 1,
    segments = 8
  } = params;

  const mesh = new EditableMesh();
  const halfHeight = height / 2;
  
  // Create vertices
  const vertices: { id: number; position: Vector3Like }[] = [];
  
  // Top ring
  for (let seg = 0; seg < segments; seg++) {
    const theta = (2 * Math.PI * seg) / segments;
    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);
    vertices.push({
      id: mesh.addVertex({ x, y: halfHeight, z }).id,
      position: { x, y: halfHeight, z }
    });
  }
  
  // Bottom ring
  for (let seg = 0; seg < segments; seg++) {
    const theta = (2 * Math.PI * seg) / segments;
    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);
    vertices.push({
      id: mesh.addVertex({ x, y: -halfHeight, z }).id,
      position: { x, y: -halfHeight, z }
    });
  }
  
  // Create side faces
  for (let seg = 0; seg < segments; seg++) {
    const nextSeg = (seg + 1) % segments;
    
    // Side face
    mesh.addFace([
      vertices[seg]!.id,
      vertices[nextSeg]!.id,
      vertices[segments + nextSeg]!.id,
      vertices[segments + seg]!.id
    ], []);
    
    // Add edges for side face
    mesh.addEdge(vertices[seg]!.id, vertices[nextSeg]!.id);
    mesh.addEdge(vertices[nextSeg]!.id, vertices[segments + nextSeg]!.id);
    mesh.addEdge(vertices[segments + nextSeg]!.id, vertices[segments + seg]!.id);
    mesh.addEdge(vertices[segments + seg]!.id, vertices[seg]!.id);
  }
  
  // Create top cap face (clockwise winding when viewed from above)
  const topFaceVertexIds = [];
  for (let seg = 0; seg < segments; seg++) {
    topFaceVertexIds.push(vertices[seg]!.id);
  }
  mesh.addFace(topFaceVertexIds, []);
  
  // Add edges for top cap
  for (let seg = 0; seg < segments; seg++) {
    const nextSeg = (seg + 1) % segments;
    mesh.addEdge(vertices[seg]!.id, vertices[nextSeg]!.id);
  }
  
  // Create bottom cap face (counter-clockwise winding when viewed from above, so clockwise when viewed from below)
  const bottomFaceVertexIds = [];
  for (let seg = segments - 1; seg >= 0; seg--) {
    bottomFaceVertexIds.push(vertices[segments + seg]!.id);
  }
  mesh.addFace(bottomFaceVertexIds, []);
  
  // Add edges for bottom cap
  for (let seg = 0; seg < segments; seg++) {
    const nextSeg = (seg + 1) % segments;
    mesh.addEdge(vertices[segments + seg]!.id, vertices[segments + nextSeg]!.id);
  }
  
  return mesh;
} 