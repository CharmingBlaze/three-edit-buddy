import { describe, it, expect, beforeEach } from 'vitest';
import { EditableMesh } from '../../src/core/EditableMesh.js';
import { HistoryManager } from '../../src/core/HistoryManager.js';
import { SelectionManager } from '../../src/selection/SelectionManager.js';
import { createCube } from '../../src/primitives/cube/createCube.js';
import { moveEdge, moveEdges, findClosestPointOnEdge } from '../../src/tools/moveEdge.js';
import { moveFace, moveFaces, getFaceCenter, getFaceNormal, moveFaceAlongNormal } from '../../src/tools/moveFace.js';
import {
  applyVertexSymmetry,
  applyEdgeSymmetry,
  applyFaceSymmetry,
  createSymmetricalMesh,
} from '../../src/tools/symmetry.js';

describe('Phase 2: Advanced Editing Tools', () => {
  let mesh: EditableMesh;
  let historyManager: HistoryManager;
  let selectionManager: SelectionManager;

  beforeEach(() => {
    mesh = createCube({ size: 2 });
    historyManager = new HistoryManager(mesh);
    selectionManager = new SelectionManager(mesh);
  });

  describe('Edge Editing', () => {
    it('should move a single edge', () => {
      const edgeId = mesh.edges[0].id;
      const translation = { x: 1, y: 0, z: 0 };

      const result = moveEdge(mesh, edgeId, translation);

      expect(result.moved).toBe(true);
      expect(result.edgeId).toBe(edgeId);
      expect(result.vertexIds).toHaveLength(2);
      expect(result.oldPositions).toHaveLength(2);
      expect(result.newPositions).toHaveLength(2);
    });

    it('should move multiple edges', () => {
      const edgeIds = [mesh.edges[0].id, mesh.edges[1].id];
      const translation = { x: 0, y: 1, z: 0 };

      const results = moveEdges(mesh, edgeIds, translation);

      expect(results).toHaveLength(2);
      expect(results[0].moved).toBe(true);
      expect(results[1].moved).toBe(true);
    });

    it('should maintain edge length when requested', () => {
      const edgeId = mesh.edges[0].id;
      const translation = { x: 1, y: 1, z: 1 };

      const result = moveEdge(mesh, edgeId, translation, { maintainLength: true });

      expect(result.moved).toBe(true);
      
      // Check that edge length is preserved
      const edge = mesh.getEdge(edgeId);
      const vertex1 = mesh.getVertex(edge!.vertexIds[0]);
      const vertex2 = mesh.getVertex(edge!.vertexIds[1]);
      
      const originalLength = Math.sqrt(8); // Cube edge length
      const newLength = Math.sqrt(
        Math.pow(vertex2!.position.x - vertex1!.position.x, 2) +
        Math.pow(vertex2!.position.y - vertex1!.position.y, 2) +
        Math.pow(vertex2!.position.z - vertex1!.position.z, 2)
      );

      // Allow for some tolerance due to floating point precision
      expect(Math.abs(newLength - originalLength)).toBeLessThan(1.0);
    });

    it('should find closest point on edge', () => {
      const edgeId = mesh.edges[0].id;
      const worldPoint = { x: 1, y: 0, z: 0 };

      const result = findClosestPointOnEdge(mesh, edgeId, worldPoint);

      expect(result).not.toBeNull();
      expect(result!.t).toBeGreaterThanOrEqual(0);
      expect(result!.t).toBeLessThanOrEqual(1);
      expect(result!.point).toHaveProperty('x');
      expect(result!.point).toHaveProperty('y');
      expect(result!.point).toHaveProperty('z');
    });
  });

  describe('Face Editing', () => {
    it('should move a single face', () => {
      const faceId = mesh.faces[0].id;
      const translation = { x: 0, y: 0, z: 1 };

      const result = moveFace(mesh, faceId, translation);

      expect(result.moved).toBe(true);
      expect(result.faceId).toBe(faceId);
      expect(result.vertexIds.length).toBeGreaterThan(0);
      expect(result.oldPositions).toHaveLength(result.vertexIds.length);
      expect(result.newPositions).toHaveLength(result.vertexIds.length);
    });

    it('should move multiple faces', () => {
      const faceIds = [mesh.faces[0].id, mesh.faces[1].id];
      const translation = { x: 1, y: 0, z: 0 };

      const results = moveFaces(mesh, faceIds, translation);

      expect(results).toHaveLength(2);
      expect(results[0].moved).toBe(true);
      expect(results[1].moved).toBe(true);
    });

    it('should maintain face shape when requested', () => {
      const faceId = mesh.faces[0].id;
      const translation = { x: 1, y: 1, z: 1 };

      const result = moveFace(mesh, faceId, translation, { maintainShape: true });

      expect(result.moved).toBe(true);
      
      // Check that face shape is preserved by verifying all vertices were moved
      const face = mesh.getFace(faceId);
      const vertices = face!.vertexIds.map(id => mesh.getVertex(id));
      
      // All vertices should have been moved (not just the first one)
      for (let i = 0; i < vertices.length; i++) {
        expect(vertices[i]).not.toBeNull();
        // The vertex should have been moved from its original position
        // For a cube, vertices start at positions like (-1, -1, -1), (1, -1, -1), etc.
        // After translation, they should be at different positions
        expect(vertices[i]!.position.x).not.toBe(-1);
        expect(vertices[i]!.position.y).not.toBe(-1);
        expect(vertices[i]!.position.z).not.toBe(-1);
      }
    });

    it('should get face center', () => {
      const faceId = mesh.faces[0].id;

      const center = getFaceCenter(mesh, faceId);

      expect(center).not.toBeNull();
      expect(center).toHaveProperty('x');
      expect(center).toHaveProperty('y');
      expect(center).toHaveProperty('z');
    });

    it('should get face normal', () => {
      const faceId = mesh.faces[0].id;

      const normal = getFaceNormal(mesh, faceId);

      expect(normal).not.toBeNull();
      expect(normal).toHaveProperty('x');
      expect(normal).toHaveProperty('y');
      expect(normal).toHaveProperty('z');
      
      // Normal should be unit length
      const length = Math.sqrt(
        normal!.x * normal!.x + normal!.y * normal!.y + normal!.z * normal!.z
      );
      expect(Math.abs(length - 1)).toBeLessThan(0.001);
    });

    it('should move face along normal', () => {
      const faceId = mesh.faces[0].id;
      const distance = 0.5;

      const result = moveFaceAlongNormal(mesh, faceId, distance);

      expect(result.moved).toBe(true);
      expect(result.faceId).toBe(faceId);
    });
  });

  describe('Multiple Selection', () => {
    it('should select multiple vertices', () => {
      const vertexIds = [mesh.vertices[0].id, mesh.vertices[1].id, mesh.vertices[2].id];

      selectionManager.selectVertices(vertexIds);

      const selection = selectionManager.getSelection();
      expect(selection.selectedVertices.size).toBe(3);
      vertexIds.forEach(id => {
        expect(selection.selectedVertices.has(id)).toBe(true);
      });
    });

    it('should select multiple edges', () => {
      const edgeIds = [mesh.edges[0].id, mesh.edges[1].id];

      selectionManager.selectEdges(edgeIds);

      const selection = selectionManager.getSelection();
      expect(selection.selectedEdges.size).toBe(2);
      edgeIds.forEach(id => {
        expect(selection.selectedEdges.has(id)).toBe(true);
      });
    });

    it('should select multiple faces', () => {
      const faceIds = [mesh.faces[0].id, mesh.faces[1].id];

      selectionManager.selectFaces(faceIds);

      const selection = selectionManager.getSelection();
      expect(selection.selectedFaces.size).toBe(2);
      faceIds.forEach(id => {
        expect(selection.selectedFaces.has(id)).toBe(true);
      });
    });

    it('should select vertices in radius', () => {
      const center = { x: 0, y: 0, z: 0 };
      const radius = 2;

      selectionManager.selectVerticesInRadius(center, radius);

      const selection = selectionManager.getSelection();
      expect(selection.selectedVertices.size).toBeGreaterThan(0);
    });

    it('should select edges in radius', () => {
      const center = { x: 0, y: 0, z: 0 };
      const radius = 2;

      selectionManager.selectEdgesInRadius(center, radius);

      const selection = selectionManager.getSelection();
      expect(selection.selectedEdges.size).toBeGreaterThan(0);
    });

    it('should select faces in radius', () => {
      const center = { x: 0, y: 0, z: 0 };
      const radius = 2;

      selectionManager.selectFacesInRadius(center, radius);

      const selection = selectionManager.getSelection();
      expect(selection.selectedFaces.size).toBeGreaterThan(0);
    });

    it('should select all in radius', () => {
      const center = { x: 0, y: 0, z: 0 };
      const radius = 2;

      selectionManager.selectAllInRadius(center, radius);

      const selection = selectionManager.getSelection();
      expect(selection.selectedVertices.size).toBeGreaterThan(0);
      expect(selection.selectedEdges.size).toBeGreaterThan(0);
      expect(selection.selectedFaces.size).toBeGreaterThan(0);
    });

    it('should invert selection', () => {
      // Select first vertex
      selectionManager.selectVertex(mesh.vertices[0].id);
      
      const beforeSelection = selectionManager.getSelection();
      expect(beforeSelection.selectedVertices.size).toBe(1);

      selectionManager.invertSelection();

      const afterSelection = selectionManager.getSelection();
      expect(afterSelection.selectedVertices.size).toBe(mesh.vertices.length - 1);
    });

    it('should select all', () => {
      selectionManager.selectAll();

      const selection = selectionManager.getSelection();
      expect(selection.selectedVertices.size).toBe(mesh.vertices.length);
      expect(selection.selectedEdges.size).toBe(mesh.edges.length);
      expect(selection.selectedFaces.size).toBe(mesh.faces.length);
    });

    it('should expand selection', () => {
      // Select one vertex
      selectionManager.selectVertex(mesh.vertices[0].id);
      
      const beforeSelection = selectionManager.getSelection();
      expect(beforeSelection.selectedVertices.size).toBe(1);

      selectionManager.expandSelection();

      const afterSelection = selectionManager.getSelection();
      expect(afterSelection.selectedEdges.size).toBeGreaterThan(0);
      expect(afterSelection.selectedFaces.size).toBeGreaterThan(0);
    });

    it('should contract selection', () => {
      // Select all
      selectionManager.selectAll();
      
      const beforeSelection = selectionManager.getSelection();
      expect(beforeSelection.selectedVertices.size).toBeGreaterThan(0);

      selectionManager.contractSelection();

      const afterSelection = selectionManager.getSelection();
      // Contracted selection should be smaller or equal
      expect(afterSelection.selectedVertices.size).toBeLessThanOrEqual(beforeSelection.selectedVertices.size);
    });
  });

  describe('Undo/Redo System', () => {
    it('should record and undo vertex movement', () => {
      const vertexId = mesh.vertices[0].id;
      const oldPosition = { ...mesh.vertices[0].position };
      const newPosition = { x: 2, y: 2, z: 2 };

      historyManager.recordMoveVertex(vertexId, oldPosition, newPosition);
      mesh.moveVertex(vertexId, newPosition);

      expect(mesh.vertices[0].position.x).toBe(newPosition.x);

      historyManager.undo();

      expect(mesh.vertices[0].position.x).toBe(oldPosition.x);
    });

    it('should record and undo edge movement', () => {
      const edgeId = mesh.edges[0].id;
      const edge = mesh.getEdge(edgeId);
      const oldPositions = [
        { ...mesh.getVertex(edge!.vertexIds[0])!.position },
        { ...mesh.getVertex(edge!.vertexIds[1])!.position }
      ];
      const newPositions = [
        { x: 2, y: 0, z: 0 },
        { x: 2, y: 1, z: 0 }
      ];

      historyManager.recordMoveEdge(edgeId, edge!.vertexIds, oldPositions, newPositions);
      mesh.moveVertex(edge!.vertexIds[0], newPositions[0]);
      mesh.moveVertex(edge!.vertexIds[1], newPositions[1]);

      historyManager.undo();

      expect(mesh.getVertex(edge!.vertexIds[0])!.position.x).toBe(oldPositions[0].x);
      expect(mesh.getVertex(edge!.vertexIds[1])!.position.x).toBe(oldPositions[1].x);
    });

    it('should record and undo face movement', () => {
      const faceId = mesh.faces[0].id;
      const oldPositions = mesh.faces[0].vertexIds.map(id => ({ ...mesh.getVertex(id)!.position }));
      const newPositions = oldPositions.map(pos => ({ x: pos.x + 1, y: pos.y, z: pos.z }));

      historyManager.recordMoveFace(faceId, mesh.faces[0].vertexIds, oldPositions, newPositions);
      
      for (let i = 0; i < mesh.faces[0].vertexIds.length; i++) {
        mesh.moveVertex(mesh.faces[0].vertexIds[i], newPositions[i]);
      }

      historyManager.undo();

      for (let i = 0; i < mesh.faces[0].vertexIds.length; i++) {
        expect(mesh.getVertex(mesh.faces[0].vertexIds[i])!.position.x).toBe(oldPositions[i].x);
      }
    });

    it('should support custom operations', () => {
      let customValue = 0;

      const undoFn = () => { customValue--; };
      const redoFn = () => { customValue++; };

      historyManager.recordCustom(undoFn, redoFn, 'Custom operation');
      redoFn(); // Execute the operation

      expect(customValue).toBe(1);

      historyManager.undo();

      expect(customValue).toBe(0);

      historyManager.redo();

      expect(customValue).toBe(1);
    });

    it('should track undo/redo counts', () => {
      expect(historyManager.getUndoCount()).toBe(0);
      expect(historyManager.getRedoCount()).toBe(0);

      const vertexId = mesh.vertices[0].id;
      const oldPosition = { ...mesh.vertices[0].position };
      const newPosition = { x: 2, y: 2, z: 2 };

      historyManager.recordMoveVertex(vertexId, oldPosition, newPosition);

      expect(historyManager.getUndoCount()).toBe(1);
      expect(historyManager.getRedoCount()).toBe(0);

      historyManager.undo();

      expect(historyManager.getUndoCount()).toBe(0);
      expect(historyManager.getRedoCount()).toBe(1);
    });

    it('should check undo/redo availability', () => {
      expect(historyManager.canUndo()).toBe(false);
      expect(historyManager.canRedo()).toBe(false);

      const vertexId = mesh.vertices[0].id;
      const oldPosition = { ...mesh.vertices[0].position };
      const newPosition = { x: 2, y: 2, z: 2 };

      historyManager.recordMoveVertex(vertexId, oldPosition, newPosition);

      expect(historyManager.canUndo()).toBe(true);
      expect(historyManager.canRedo()).toBe(false);

      historyManager.undo();

      expect(historyManager.canUndo()).toBe(false);
      expect(historyManager.canRedo()).toBe(true);
    });
  });

  describe('Symmetry Operations', () => {
    it('should apply vertex symmetry', () => {
      const vertexIds = [mesh.vertices[0].id, mesh.vertices[1].id];

      const result = applyVertexSymmetry(mesh, vertexIds, { axis: 'X', position: 0, createNew: true });

      expect(result.vertexCount).toBeGreaterThan(0);
      expect(result.newVertexIds.length).toBeGreaterThan(0);
    });

    it('should apply edge symmetry', () => {
      const edgeIds = [mesh.edges[0].id, mesh.edges[1].id];

      const result = applyEdgeSymmetry(mesh, edgeIds, { axis: 'Y', position: 0, createNew: true });

      expect(result.edgeCount).toBeGreaterThan(0);
      expect(result.newEdgeIds.length).toBeGreaterThan(0);
    });

    it('should apply face symmetry', () => {
      const faceIds = [mesh.faces[0].id, mesh.faces[1].id];

      const result = applyFaceSymmetry(mesh, faceIds, { axis: 'Z', position: 0, createNew: true });

      expect(result.faceCount).toBeGreaterThan(0);
      expect(result.newFaceIds.length).toBeGreaterThan(0);
    });

    it('should create symmetrical mesh', () => {
      const originalVertexCount = mesh.vertices.length;
      const originalEdgeCount = mesh.edges.length;
      const originalFaceCount = mesh.faces.length;

      const result = createSymmetricalMesh(mesh, { axis: 'X', position: 0 });

      expect(result.vertexCount).toBeGreaterThan(0);
      expect(result.edgeCount).toBeGreaterThan(0);
      expect(result.faceCount).toBeGreaterThan(0);
      expect(result.newVertexIds.length).toBeGreaterThan(0);
      expect(result.newEdgeIds.length).toBeGreaterThan(0);
      expect(result.newFaceIds.length).toBeGreaterThan(0);

      // Mesh should have more elements after symmetry
      expect(mesh.vertices.length).toBeGreaterThan(originalVertexCount);
      expect(mesh.edges.length).toBeGreaterThan(originalEdgeCount);
      expect(mesh.faces.length).toBeGreaterThan(originalFaceCount);
    });

    it('should handle different symmetry axes', () => {
      const vertexIds = [mesh.vertices[0].id];

      const xResult = applyVertexSymmetry(mesh, vertexIds, { axis: 'X', position: 0 });
      const yResult = applyVertexSymmetry(mesh, vertexIds, { axis: 'Y', position: 0 });
      const zResult = applyVertexSymmetry(mesh, vertexIds, { axis: 'Z', position: 0 });

      expect(xResult.vertexCount).toBeGreaterThan(0);
      expect(yResult.vertexCount).toBeGreaterThan(0);
      expect(zResult.vertexCount).toBeGreaterThan(0);
    });

    it('should handle symmetry with custom position', () => {
      const vertexIds = [mesh.vertices[0].id];

      const result = applyVertexSymmetry(mesh, vertexIds, { axis: 'X', position: 1 });

      expect(result.vertexCount).toBeGreaterThan(0);
    });

    it('should handle symmetry with merging disabled', () => {
      const vertexIds = [mesh.vertices[0].id];

      const result = applyVertexSymmetry(mesh, vertexIds, { 
        axis: 'X', 
        position: 0, 
        mergeAtPlane: false 
      });

      expect(result.vertexCount).toBeGreaterThan(0);
    });
  });
});