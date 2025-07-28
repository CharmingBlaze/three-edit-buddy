import { describe, it, expect } from 'vitest';
import { MockEditableMesh } from '../core/EditableMesh.mock.js';
import { mergeVertices, mergeSpecificVertices } from './mergeVertices.js';
import { Vector3 } from 'three';

function makeMesh(vertices: { x: number, y: number, z: number }[], faces: number[][] = [], edges: number[][] = []) {
  const mesh = new MockEditableMesh();
  for (const v of vertices) {
    mesh.addVertex(new Vector3(v.x, v.y, v.z));
  }
  for (const f of faces) {
    mesh.addFace(f);
  }
  for (const e of edges) {
    mesh.addEdge(e[0], e[1]);
  }
  return mesh;
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
