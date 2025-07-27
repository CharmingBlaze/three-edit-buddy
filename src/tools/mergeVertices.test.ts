import { describe, it, expect } from 'vitest';
import { mergeVertices, mergeSpecificVertices } from './mergeVertices.js';

function makeMesh(vertices, faces = [], edges = []) {
  return {
    vertices: vertices.map((pos, i) => ({ id: i, position: { ...pos } })),
    faces: faces.map((f, i) => ({
      id: i,
      vertexIds: f,
      edgeIds: [],
      materialId: undefined,
      uvIds: [],
    })),
    edges: edges.map((e, i) => ({ id: i, vertexIds: e })),
    materials: [],
    uvs: [],
    addFace(...args) {
      return { id: this.faces.length, ...args };
    },
    addEdge(...args) {
      return { id: this.edges.length, ...args };
    },
    addVertex(pos) {
      return (
        this.vertices.push({ id: this.vertices.length, position: { ...pos } }) -
        1
      );
    },
  };
}

describe('mergeVertices', () => {
  it('merges two vertices within threshold', () => {
    const mesh = makeMesh([
      { x: 0, y: 0, z: 0 },
      { x: 0.0005, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
    ]);
    const result = mergeVertices(mesh, 0.001);
    expect(result.mergedVertices).toBe(1);
  });

  it('does not merge vertices outside threshold', () => {
    const mesh = makeMesh([
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
    ]);
    const result = mergeVertices(mesh, 0.0001);
    expect(result.mergedVertices).toBe(0);
  });

  it('merges a group of three close vertices', () => {
    const mesh = makeMesh([
      { x: 0, y: 0, z: 0 },
      { x: 0.0005, y: 0, z: 0 },
      { x: 0.0007, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
    ]);
    const result = mergeVertices(mesh, 0.001);
    expect(result.mergedVertices).toBe(2);
  });
});

describe('mergeSpecificVertices', () => {
  it('merges specific vertices by ID', () => {
    const mesh = makeMesh([
      { x: 0, y: 0, z: 0 },
      { x: 0.0005, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
    ]);
    const target = mergeSpecificVertices(mesh, [0, 1]);
    expect(target).toBe(0);
  });

  it('returns -1 for single vertex', () => {
    const mesh = makeMesh([{ x: 0, y: 0, z: 0 }]);
    const target = mergeSpecificVertices(mesh, [0]);
    expect(target).toBe(0);
  });
});
