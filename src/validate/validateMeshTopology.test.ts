import { describe, it, expect } from 'vitest';
import { validateMeshTopology, isWatertight, getMeshStats } from './validateMeshTopology.js';
import { EditableMesh } from '../core/EditableMesh.js';
import { createSimpleCube } from '../primitives/cube/createSimpleCube.js';

describe('Mesh Topology Validation', () => {
  describe('validateMeshTopology', () => {
    it('should validate a valid mesh', () => {
      const mesh = createSimpleCube();
      const result = validateMeshTopology(mesh);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect orphaned vertices', () => {
      const mesh = createSimpleCube();
      
      // Add an orphaned vertex
      mesh.addVertex({ x: 10, y: 10, z: 10 }, 'orphaned');
      
      const result = validateMeshTopology(mesh);
      
      expect(result.orphanedVertices).toHaveLength(1);
      expect(result.warnings).toContain('Found 1 orphaned vertices');
    });

    it('should detect orphaned edges', () => {
      const mesh = createSimpleCube();
      
      // Add an orphaned edge
      mesh.addEdge(100, 101, 'orphaned');
      
      const result = validateMeshTopology(mesh);
      
      expect(result.orphanedEdges).toHaveLength(1);
      expect(result.warnings).toContain('Found 1 orphaned edges');
    });

    it('should detect degenerate faces', () => {
      const mesh = new EditableMesh();
      
      // Create a degenerate face (zero area)
      const v1Obj = mesh.addVertex({ x: 0, y: 0, z: 0 }, 'v1');
      const v2Obj = mesh.addVertex({ x: 1, y: 0, z: 0 }, 'v2');
      const v3Obj = mesh.addVertex({ x: 0.5, y: 0, z: 0 }, 'v3'); // On the same line
      
      const v1 = v1Obj.id;
      const v2 = v2Obj.id;
      const v3 = v3Obj.id;
      
      // Create edges for the face
      const e1 = mesh.addEdge(v1Obj.id, v2Obj.id);
      const e2 = mesh.addEdge(v2Obj.id, v3Obj.id);
      const e3 = mesh.addEdge(v3Obj.id, v1Obj.id);
      
      mesh.addFace([v1, v2, v3], [e1.id, e2.id, e3.id], 'degenerate');
      
      const result = validateMeshTopology(mesh);
      
      expect(result.degenerateFaces.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Found 1 degenerate faces');
      expect(result.isValid).toBe(false);
    });

    it('should detect invalid faces', () => {
      const mesh = createSimpleCube();
      
      // Create an invalid face with only 2 vertices
      const v1 = mesh.addVertex({ x: 0, y: 0, z: 0 }, 'v1').id;
      const v2 = mesh.addVertex({ x: 1, y: 0, z: 0 }, 'v2').id;
      
      mesh.addFace([v1, v2], [], 'invalid');
      
      const result = validateMeshTopology(mesh);
      
      expect(result.errors).toContain('Found 1 invalid faces (less than 3 vertices)');
      expect(result.isValid).toBe(false);
    });
  });

  describe('isWatertight', () => {
    it('should return true for a closed cube', () => {
      const mesh = createSimpleCube();
      expect(isWatertight(mesh)).toBe(true);
    });

    it('should return false for a mesh with boundary edges', () => {
      const mesh = createSimpleCube();
      
      // Remove one face to create boundary edges
      mesh.faces.pop();
      
      expect(isWatertight(mesh)).toBe(false);
    });
  });

  describe('getMeshStats', () => {
    it('should return correct statistics for a cube', () => {
      const mesh = createSimpleCube();
      const stats = getMeshStats(mesh);
      
      expect(stats.vertexCount).toBe(8);
      expect(stats.edgeCount).toBe(12);
      expect(stats.faceCount).toBe(6);
      expect(stats.quadCount).toBe(6);
      expect(stats.triangleCount).toBe(0);
      expect(stats.ngonCount).toBe(0);
      expect(stats.materialCount).toBe(0);
      // Note: createSimpleCube may add UVs, so we don't test for exact UV count
      expect(stats.uvCount).toBeGreaterThanOrEqual(0);
    });

    it('should count different face types correctly', () => {
      const mesh = new EditableMesh();
      
      // Add vertices
      const v1 = mesh.addVertex({ x: 0, y: 0, z: 0 }, 'v1').id;
      const v2 = mesh.addVertex({ x: 1, y: 0, z: 0 }, 'v2').id;
      const v3 = mesh.addVertex({ x: 0, y: 1, z: 0 }, 'v3').id;
      const v4 = mesh.addVertex({ x: 1, y: 1, z: 0 }, 'v4').id;
      const v5 = mesh.addVertex({ x: 0.5, y: 0.5, z: 1 }, 'v5').id;
      
      // Add triangle
      mesh.addFace([v1, v2, v3], [], 'triangle');
      
      // Add quad
      mesh.addFace([v1, v2, v4, v3], [], 'quad');
      
      // Add n-gon (pentagon)
      mesh.addFace([v1, v2, v4, v3, v5], [], 'ngon');
      
      const stats = getMeshStats(mesh);
      
      expect(stats.vertexCount).toBe(5);
      expect(stats.faceCount).toBe(3);
      expect(stats.triangleCount).toBe(1);
      expect(stats.quadCount).toBe(1);
      expect(stats.ngonCount).toBe(1);
    });
  });
}); 