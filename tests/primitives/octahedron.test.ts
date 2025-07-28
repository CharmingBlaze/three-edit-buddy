import { describe, it, expect } from 'vitest';
import { createOctahedron } from '../../src/primitives/octahedron/createOctahedron.js';

describe('createOctahedron', () => {
  it('should create a basic octahedron with default parameters', () => {
    const octahedron = createOctahedron();
    
    // Check that we have a valid mesh
    expect(octahedron.vertices.length).toBe(6);
    expect(octahedron.faces.length).toBe(8);
    expect(octahedron.edges.length).toBeGreaterThan(0);
    
    // All faces should be triangles (3 vertices)
    for (const face of octahedron.faces) {
      expect(face.vertexIds.length).toBe(3);
    }
  });

  it('should create an octahedron with custom size', () => {
    const octahedron = createOctahedron({ size: 2 });
    
    // Check vertex count
    expect(octahedron.vertices.length).toBe(6);
    
    // Check face count
    expect(octahedron.faces.length).toBe(8);
    
    // Check that vertices are at the correct positions
    const positions = octahedron.vertices.map(v => v.position);
    expect(positions).toContainEqual({ x: 0, y: 1, z: 0 }); // Top
    expect(positions).toContainEqual({ x: 0, y: -1, z: 0 }); // Bottom
    expect(positions).toContainEqual({ x: 0, y: 0, z: 1 }); // Front
    expect(positions).toContainEqual({ x: 0, y: 0, z: -1 }); // Back
    expect(positions).toContainEqual({ x: 1, y: 0, z: 0 }); // Right
    expect(positions).toContainEqual({ x: -1, y: 0, z: 0 }); // Left
  });

  it('should have proper edge connectivity', () => {
    const octahedron = createOctahedron();
    
    // Check that edges connect vertices properly
    for (const edge of octahedron.edges) {
      expect(edge.vertexIds.length).toBe(2);
      expect(edge.vertexIds[0]).toBeGreaterThanOrEqual(0);
      expect(edge.vertexIds[1]).toBeGreaterThanOrEqual(0);
    }
  });

  it('should have all triangular faces', () => {
    const octahedron = createOctahedron();
    
    // All faces should be triangles
    for (const face of octahedron.faces) {
      expect(face.vertexIds.length).toBe(3);
    }
  });

  it('should handle edge cases', () => {
    // Very small octahedron
    const smallOctahedron = createOctahedron({ size: 0.1 });
    
    expect(smallOctahedron.vertices.length).toBe(6);
    expect(smallOctahedron.faces.length).toBe(8);
    expect(smallOctahedron.edges.length).toBeGreaterThan(0);
    
    // All faces should be triangles
    for (const face of smallOctahedron.faces) {
      expect(face.vertexIds.length).toBe(3);
    }
  });
}); 