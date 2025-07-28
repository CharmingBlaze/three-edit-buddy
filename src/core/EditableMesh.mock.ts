import { Vector3 } from 'three';
import { EditableMesh } from './EditableMesh.js';
import type { Face, Vertex, Edge, UV, Vector2Like } from '../types/index.js';

export class MockEditableMesh extends EditableMesh {
  constructor() {
    super();
  }

  addVertex(position: Vector3): Vertex {
    const vertex: Vertex = { id: this.vertices.length, position };
    this.vertices.push(vertex);
    return vertex;
  }

  addFace(vertexIds: number[]): Face {
    const face: Face = { id: this.faces.length, vertexIds, edgeIds: [] };
    this.faces.push(face);
    return face;
  }

  addEdge(v0: number, v1: number): Edge {
    const edge: Edge = { id: this.edges.length, vertexIds: [v0, v1] };
    this.edges.push(edge);
    return edge;
  }

  addUV(vertexId: number, position: Vector2Like): UV {
    const uv: UV = { id: this.uvs.length, vertexId, position };
    this.uvs.push(uv);
    return uv;
  }
}
