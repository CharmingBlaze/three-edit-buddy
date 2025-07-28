import { describe, it, expect } from 'vitest';
import { subdivideEdge, subdivideEdges } from '../../src/tools/subdivideEdge.js';
import { MockEditableMesh } from '../../src/core/EditableMesh.mock.js';
import { Vector3 } from 'three';

function makeMesh(vertices: { x: number, y: number, z: number }[], edges: number[][] = [], faces: number[][] = []) {
  const mesh = new MockEditableMesh();
  for (const v of vertices) {
    mesh.addVertex(new Vector3(v.x, v.y, v.z));
  }
  for (const e of edges) {
    mesh.addEdge(e[0], e[1]);
  }
  for (const f of faces) {
    mesh.addFace(f);
  }
  return mesh;
}

describe('subdivideEdge', () => {
  it('subdivides a single edge and adds a vertex at the midpoint', () => {
    const mesh = makeMesh(
      [
        { x: 0, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
      ],
      [[0, 1]]
    );
    const newVertexId = subdivideEdge(mesh, 0);
    expect(mesh.vertices[newVertexId].position).toEqual({ x: 1, y: 0, z: 0 });
  });

  it('throws if edge does not exist', () => {
    const mesh = makeMesh([{ x: 0, y: 0, z: 0 }], []);
    expect(() => subdivideEdge(mesh, 0)).toThrow();
  });
});

describe('subdivideEdges', () => {
  it('subdivides multiple edges and returns new vertex IDs', () => {
    const mesh = makeMesh(
      [
        { x: 0, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
        { x: 0, y: 2, z: 0 },
        { x: 2, y: 2, z: 0 },
      ],
      [
        [0, 1],
        [2, 3],
      ]
    );
    const newVertexIds = subdivideEdges(mesh, [0, 1]);
    expect(newVertexIds.length).toBe(2);
    expect(mesh.vertices[newVertexIds[0]].position).toEqual({
      x: 1,
      y: 0,
      z: 0,
    });
    expect(mesh.vertices[newVertexIds[1]].position).toEqual({
      x: 1,
      y: 2,
      z: 0,
    });
  });
});
