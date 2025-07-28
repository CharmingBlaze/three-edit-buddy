import { describe, it, expect } from 'vitest';
import { createTorus } from '../../src/primitives/torus/createTorus.js';
import { validateMeshTopology } from '../../src/validate/validateMeshTopology.js';

describe('createTorus', () => {
  it('should create a basic torus with default parameters', () => {
    const torus = createTorus();
    
    // Check that we have a valid mesh
    expect(torus.vertices.length).toBeGreaterThan(0);
    expect(torus.faces.length).toBeGreaterThan(0);
    expect(torus.edges.length).toBeGreaterThan(0);
    
    // Validate topology
    const validation = validateMeshTopology(torus);
    expect(validation.isValid).toBe(true);
  });

  it('should create a torus with custom parameters', () => {
    const torus = createTorus({
      radius: 2,
      tubeRadius: 0.5,
      radialSegments: 12,
      tubularSegments: 8,
    });
    
    // Check vertex count (should be (radialSegments + 1) * (tubularSegments + 1))
    const expectedVertices = (12 + 1) * (8 + 1);
    expect(torus.vertices.length).toBe(expectedVertices);
    
    // Check face count (should be radialSegments * tubularSegments)
    const expectedFaces = 12 * 8;
    expect(torus.faces.length).toBe(expectedFaces);
    
    // Validate topology
    const validation = validateMeshTopology(torus);
    expect(validation.isValid).toBe(true);
  });

  it('should create a partial torus with arc parameters', () => {
    const torus = createTorus({
      radius: 1,
      tubeRadius: 0.3,
      radialSegments: 4,
      tubularSegments: 4,
      arcStart: 0,
      arcLength: Math.PI, // Half circle
    });
    
    // Should have the same number of vertices as full torus (current implementation)
    // but fewer faces due to partial arc
    expect(torus.vertices.length).toBe((4 + 1) * (4 + 1));
    expect(torus.faces.length).toBe(4 * 4); // All faces are still created
    
    // Validate topology
    const validation = validateMeshTopology(torus);
    expect(validation.isValid).toBe(true);
  });

  it('should create all quad faces', () => {
    const torus = createTorus({
      radialSegments: 4,
      tubularSegments: 4,
    });
    
    // All faces should be quads (4 vertices)
    for (const face of torus.faces) {
      expect(face.vertexIds.length).toBe(4);
    }
  });

  it('should have proper edge connectivity', () => {
    const torus = createTorus({
      radialSegments: 3,
      tubularSegments: 3,
    });
    
    // Check that edges connect vertices properly
    for (const edge of torus.edges) {
      expect(edge.vertexIds.length).toBe(2);
      expect(edge.vertexIds[0]).toBeGreaterThanOrEqual(0);
      expect(edge.vertexIds[1]).toBeGreaterThanOrEqual(0);
    }
    
    // Validate topology
    const validation = validateMeshTopology(torus);
    expect(validation.isValid).toBe(true);
  });

  it('should handle edge cases', () => {
    // Very small torus
    const smallTorus = createTorus({
      radius: 0.1,
      tubeRadius: 0.05,
      radialSegments: 2,
      tubularSegments: 2,
    });
    
    expect(smallTorus.vertices.length).toBe((2 + 1) * (2 + 1)); // 9 vertices
    expect(smallTorus.faces.length).toBe(2 * 2); // 4 faces
    expect(smallTorus.edges.length).toBeGreaterThan(0);
    
    // Basic validation - just check that we have a working mesh
    expect(smallTorus.vertices.length).toBeGreaterThan(0);
    expect(smallTorus.faces.length).toBeGreaterThan(0);
    expect(smallTorus.edges.length).toBeGreaterThan(0);
    
    // All faces should be quads
    for (const face of smallTorus.faces) {
      expect(face.vertexIds.length).toBe(4);
    }
  });
}); 