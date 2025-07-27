import { EditableMesh } from '../../core/EditableMesh.js';
import { Vector3Like } from '../../types/index.js';

export interface SphereParams {
  radius?: number;
  segments?: number;
  rings?: number;
}

/**
 * Creates a sphere primitive with smooth appearance
 */
export function createSphere(params: SphereParams = {}): EditableMesh {
  const {
    radius = 0.5,
    segments = 6,  // Reduced for smoother appearance
    rings = 4      // Reduced for smoother appearance
  } = params;

  const mesh = new EditableMesh();
  
  // Create vertices
  const vertices: { id: number; position: Vector3Like }[] = [];
  
  // Top vertex
  vertices.push({
    id: mesh.addVertex({ x: 0, y: radius, z: 0 }).id,
    position: { x: 0, y: radius, z: 0 }
  });
  
  // Ring vertices
  for (let ring = 1; ring < rings; ring++) {
    const phi = (Math.PI * ring) / rings;
    const y = radius * Math.cos(phi);
    const ringRadius = radius * Math.sin(phi);
    
    for (let seg = 0; seg < segments; seg++) {
      const theta = (2 * Math.PI * seg) / segments;
      const x = ringRadius * Math.cos(theta);
      const z = ringRadius * Math.sin(theta);
      
      vertices.push({
        id: mesh.addVertex({ x, y, z }).id,
        position: { x, y, z }
      });
    }
  }
  
  // Bottom vertex
  vertices.push({
    id: mesh.addVertex({ x: 0, y: -radius, z: 0 }).id,
    position: { x: 0, y: -radius, z: 0 }
  });
  
  // Create faces and edges
  for (let seg = 0; seg < segments; seg++) {
    const nextSeg = (seg + 1) % segments;
    
    // Top cap
    mesh.addFace([
      vertices[0]!.id,
      vertices[1 + nextSeg]!.id,
      vertices[1 + seg]!.id
    ], []);
    
    // Add edges for top cap
    mesh.addEdge(vertices[0]!.id, vertices[1 + nextSeg]!.id);
    mesh.addEdge(vertices[1 + nextSeg]!.id, vertices[1 + seg]!.id);
    mesh.addEdge(vertices[1 + seg]!.id, vertices[0]!.id);
    
    // Middle rings
    for (let ring = 0; ring < rings - 2; ring++) {
      const currentRingStart = 1 + ring * segments;
      const nextRingStart = 1 + (ring + 1) * segments;
      
      const v1 = vertices[currentRingStart + seg]!;
      const v2 = vertices[currentRingStart + nextSeg]!;
      const v3 = vertices[nextRingStart + nextSeg]!;
      const v4 = vertices[nextRingStart + seg]!;
      
      mesh.addFace([v1.id, v2.id, v3.id, v4.id], []);
      
      // Add edges for middle ring quad
      mesh.addEdge(v1.id, v2.id);
      mesh.addEdge(v2.id, v3.id);
      mesh.addEdge(v3.id, v4.id);
      mesh.addEdge(v4.id, v1.id);
    }
    
    // Bottom cap
    const bottomVertex = vertices[vertices.length - 1]!;
    const lastRingStart = 1 + (rings - 2) * segments;
    
    mesh.addFace([
      vertices[lastRingStart + seg]!.id,
      vertices[lastRingStart + nextSeg]!.id,
      bottomVertex.id
    ], []);
    
    // Add edges for bottom cap
    mesh.addEdge(vertices[lastRingStart + seg]!.id, vertices[lastRingStart + nextSeg]!.id);
    mesh.addEdge(vertices[lastRingStart + nextSeg]!.id, bottomVertex.id);
    mesh.addEdge(bottomVertex.id, vertices[lastRingStart + seg]!.id);
  }
  
  return mesh;
} 