import { describe, it, expect } from 'vitest';
import { subdivideEdge, subdivideEdges } from './subdivideEdge.js';

function makeMesh(vertices, edges, faces = []) {
  return {
    vertices: vertices.map((pos, i) => ({ id: i, position: { ...pos } })),
    edges: edges.map((e, i) => ({ id: i, vertexIds: e })),
    faces: faces.map((f, i) => ({
      id: i,
      vertexIds: f,
      edgeIds: edges.map((_, j) => j),
      materialId: undefined,
      uvIds: [],
    })),
    materials: [],
    uvs: [],
    addFace(...args) {
      return { id: this.faces.length, ...args };
    },
    addEdge(...args) {
      return { id: this.edges.length, ...args };
    },
    addVertex(pos) {
      const id = this.vertices.length;
      const vertex = { id, position: { ...pos } };
      this.vertices.push(vertex);
      return vertex;
    },
  };
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
