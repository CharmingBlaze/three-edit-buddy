import { describe, it, expect } from 'vitest';
import { createDodecahedron } from '../../src/primitives/dodecahedron/createDodecahedron.js';

describe('createDodecahedron', () => {
  it('should create a basic dodecahedron with default parameters', () => {
    const dodecahedron = createDodecahedron();
    
    // Check that we have a valid mesh
    expect(dodecahedron.vertices.length).toBe(20);
    expect(dodecahedron.faces.length).toBe(12);
    expect(dodecahedron.edges.length).toBeGreaterThan(0);
    
    // All faces should be pentagons (5 vertices)
    for (const face of dodecahedron.faces) {
      expect(face.vertexIds.length).toBe(5);
    }
  });

  it('should create a dodecahedron with custom size', () => {
    const dodecahedron = createDodecahedron({ size: 2 });
    
    // Check vertex count
    expect(dodecahedron.vertices.length).toBe(20);
    
    // Check face count
    expect(dodecahedron.faces.length).toBe(12);
    
    // Check that vertices are at the correct positions (scaled by size)
    const positions = dodecahedron.vertices.map(v => v.position);
    expect(positions).toContainEqual({ x: 1, y: 1, z: 1 }); // (±1, ±1, ±1)
    expect(positions).toContainEqual({ x: -1, y: 1, z: 1 });
    expect(positions).toContainEqual({ x: 1, y: -1, z: 1 });
    expect(positions).toContainEqual({ x: -1, y: -1, z: 1 });
  });

  it('should have proper edge connectivity', () => {
    const dodecahedron = createDodecahedron();
    
    // Check that edges connect vertices properly
    for (const edge of dodecahedron.edges) {
      expect(edge.vertexIds.length).toBe(2);
      expect(edge.vertexIds[0]).toBeGreaterThanOrEqual(0);
      expect(edge.vertexIds[1]).toBeGreaterThanOrEqual(0);
    }
  });

  it('should have all pentagonal faces', () => {
    const dodecahedron = createDodecahedron();
    
    // All faces should be pentagons
    for (const face of dodecahedron.faces) {
      expect(face.vertexIds.length).toBe(5);
    }
  });

  it('should handle edge cases', () => {
    // Very small dodecahedron
    const smallDodecahedron = createDodecahedron({ size: 0.1 });
    
    expect(smallDodecahedron.vertices.length).toBe(20);
    expect(smallDodecahedron.faces.length).toBe(12);
    expect(smallDodecahedron.edges.length).toBeGreaterThan(0);
    
    // All faces should be pentagons
    for (const face of smallDodecahedron.faces) {
      expect(face.vertexIds.length).toBe(5);
    }
  });
}); 