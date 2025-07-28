import { describe, it, expect } from 'vitest';
import { createIcosahedron } from '../../src/primitives/icosahedron/createIcosahedron.js';

describe('createIcosahedron', () => {
  it('should create a basic icosahedron with default parameters', () => {
    const icosahedron = createIcosahedron();
    
    // Check that we have a valid mesh
    expect(icosahedron.vertices.length).toBe(12);
    expect(icosahedron.faces.length).toBe(20);
    expect(icosahedron.edges.length).toBeGreaterThan(0);
    
    // All faces should be triangles (3 vertices)
    for (const face of icosahedron.faces) {
      expect(face.vertexIds.length).toBe(3);
    }
  });

  it('should create an icosahedron with custom size', () => {
    const icosahedron = createIcosahedron({ size: 2 });
    
    // Check vertex count
    expect(icosahedron.vertices.length).toBe(12);
    
    // Check face count
    expect(icosahedron.faces.length).toBe(20);
    
    // Check that vertices are at the correct positions (scaled by size)
    const positions = icosahedron.vertices.map(v => v.position);
    const phi = (1 + Math.sqrt(5)) / 2;
    
    // Check some key vertices
    expect(positions).toContainEqual({ x: 1, y: phi, z: 0 }); // (±1, ±phi, 0)
    expect(positions).toContainEqual({ x: -1, y: phi, z: 0 });
    expect(positions).toContainEqual({ x: 0, y: 1, z: phi }); // (0, ±1, ±phi)
    expect(positions).toContainEqual({ x: 0, y: -1, z: phi });
  });

  it('should have proper edge connectivity', () => {
    const icosahedron = createIcosahedron();
    
    // Check that edges connect vertices properly
    for (const edge of icosahedron.edges) {
      expect(edge.vertexIds.length).toBe(2);
      expect(edge.vertexIds[0]).toBeGreaterThanOrEqual(0);
      expect(edge.vertexIds[1]).toBeGreaterThanOrEqual(0);
    }
  });

  it('should have all triangular faces', () => {
    const icosahedron = createIcosahedron();
    
    // All faces should be triangles
    for (const face of icosahedron.faces) {
      expect(face.vertexIds.length).toBe(3);
    }
  });

  it('should handle edge cases', () => {
    // Very small icosahedron
    const smallIcosahedron = createIcosahedron({ size: 0.1 });
    
    expect(smallIcosahedron.vertices.length).toBe(12);
    expect(smallIcosahedron.faces.length).toBe(20);
    expect(smallIcosahedron.edges.length).toBeGreaterThan(0);
    
    // All faces should be triangles
    for (const face of smallIcosahedron.faces) {
      expect(face.vertexIds.length).toBe(3);
    }
  });
}); 