export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

export interface Vector2Like {
  x: number;
  y: number;
}

export interface Vertex {
  id: number;
  position: Vector3Like;
  name?: string | undefined;
}

export interface Edge {
  id: number;
  vertexIds: [number, number];
  name?: string | undefined;
}

export interface Face {
  id: number;
  vertexIds: number[];
  edgeIds: number[];
  name?: string | undefined;
  materialSlotId?: number | undefined;
}

export interface Material {
  id: number;
  name: string;
  color?: Vector3Like | undefined;
  opacity?: number | undefined;
  transparent?: boolean | undefined;
}

export interface UV {
  id: number;
  vertexId: number;
  position: Vector2Like;
}

export interface EditableMesh {
  vertices: Vertex[];
  edges: Edge[];
  faces: Face[];
  materials: Material[];
  uvs: UV[];
  
  addVertex(position: Vector3Like, name?: string): Vertex;
  addEdge(vertexId1: number, vertexId2: number, name?: string): Edge;
  addFace(vertexIds: number[], edgeIds: number[], name?: string): Face;
  addMaterial(name: string, color?: Vector3Like, opacity?: number, transparent?: boolean): Material;
  addUV(vertexId: number, position: Vector2Like): UV;

  getVertex(vertexId: number): Vertex | undefined;
  getEdge(edgeId: number): Edge | undefined;
  getFace(faceId: number): Face | undefined;
  getUVsForVertex(vertexId: number): Array<{ coordinates: Vector2Like }>;
  
  // Additional utility methods
  removeVertex(vertexId: number): void;
  removeEdge(edgeId: number): void;
  removeFace(faceId: number): void;
  getVertexCount(): number;
  getEdgeCount(): number;
  getFaceCount(): number;
  clear(): void;
}

export { Selection } from '../selection/Selection.js';