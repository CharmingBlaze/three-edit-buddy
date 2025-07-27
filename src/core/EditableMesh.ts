import type { EditableMesh as IEditableMesh, Vertex, Edge, Face, Material, UV, Vector3Like, Vector2Like } from '../types/index.js';
import { generateId } from '../utils/id.js';
import * as THREE from 'three';

export class EditableMesh implements IEditableMesh {
  vertices: Vertex[] = [];
  edges: Edge[] = [];
  faces: Face[] = [];
  materials: Material[] = [];
  uvs: UV[] = [];

  addVertex(position: Vector3Like, name?: string): Vertex {
    const vertex: Vertex = {
      id: generateId(),
      position,
      name
    };
    this.vertices.push(vertex);
    return vertex;
  }

  addEdge(vertexId1: number, vertexId2: number, name?: string): Edge {
    const edge: Edge = {
      id: generateId(),
      vertexIds: [vertexId1, vertexId2],
      name
    };
    this.edges.push(edge);
    return edge;
  }

  addFace(vertexIds: number[], edgeIds: number[], name?: string): Face {
    const face: Face = {
      id: generateId(),
      vertexIds,
      edgeIds,
      name
    };
    this.faces.push(face);
    return face;
  }

  addMaterial(name: string, color?: Vector3Like, opacity?: number, transparent?: boolean): Material {
    const material: Material = {
      id: generateId(),
      name,
      color,
      opacity,
      transparent
    };
    this.materials.push(material);
    return material;
  }

  addUV(vertexId: number, position: Vector2Like): UV {
    const uv: UV = {
      id: generateId(),
      vertexId,
      position
    };
    this.uvs.push(uv);
    return uv;
  }

  // --- Compatibility methods for visuals and conversion ---
  getVertex(vertexId: number): Vertex | undefined {
    return this.vertices.find(v => v.id === vertexId);
  }

  getEdge(edgeId: number): Edge | undefined {
    return this.edges.find(e => e.id === edgeId);
  }

  getFace(faceId: number): Face | undefined {
    return this.faces.find(f => f.id === faceId);
  }

  getUVsForVertex(vertexId: number): Array<{ coordinates: Vector2Like }> {
    // Return all UVs for this vertex, wrapped in { coordinates }
    return this.uvs.filter(uv => uv.vertexId === vertexId).map(uv => ({ coordinates: uv.position }));
  }

  // --- Additional utility methods ---
  
  /**
   * Removes a vertex and all associated edges and faces
   * @param vertexId The ID of the vertex to remove
   */
  removeVertex(vertexId: number): void {
    // Remove the vertex
    this.vertices = this.vertices.filter(v => v.id !== vertexId);
    
    // Remove edges connected to this vertex
    this.edges = this.edges.filter(e => !e.vertexIds.includes(vertexId));
    
    // Remove faces that reference this vertex
    this.faces = this.faces.filter(f => !f.vertexIds.includes(vertexId));
    
    // Remove UVs associated with this vertex
    this.uvs = this.uvs.filter(uv => uv.vertexId !== vertexId);
  }
  
  /**
   * Removes an edge and all associated faces
   * @param edgeId The ID of the edge to remove
   */
  removeEdge(edgeId: number): void {
    // Remove the edge
    this.edges = this.edges.filter(e => e.id !== edgeId);
    
    // Remove faces that reference this edge
    this.faces = this.faces.filter(f => !f.edgeIds.includes(edgeId));
  }
  
  /**
   * Removes a face
   * @param faceId The ID of the face to remove
   */
  removeFace(faceId: number): void {
    // Remove the face
    this.faces = this.faces.filter(f => f.id !== faceId);
  }
  
  /**
   * Gets the number of vertices in the mesh
   * @returns The vertex count
   */
  getVertexCount(): number {
    return this.vertices.length;
  }
  
  /**
   * Gets the number of edges in the mesh
   * @returns The edge count
   */
  getEdgeCount(): number {
    return this.edges.length;
  }
  
  /**
   * Gets the number of faces in the mesh
   * @returns The face count
   */
  getFaceCount(): number {
    return this.faces.length;
  }
  
  /**
   * Clears all mesh data
   */
  clear(): void {
    this.vertices = [];
    this.edges = [];
    this.faces = [];
    this.materials = [];
    this.uvs = [];
  }

  /**
   * Moves a vertex to a new position, updating all connected faces and edges
   * @param vertexId The ID of the vertex to move
   * @param newPosition The new position for the vertex
   */
  moveVertex(vertexId: number, newPosition: Vector3Like): void {
    const vertex = this.getVertex(vertexId);
    if (!vertex) {
      throw new Error(`Vertex with ID ${vertexId} not found`);
    }
    
    // Update the vertex position - all connected faces/edges will automatically use the new position
    vertex.position = newPosition;
  }

  /**
   * Gets all faces that use a specific vertex
   * @param vertexId The ID of the vertex
   * @returns Array of faces that reference this vertex
   */
  getFacesUsingVertex(vertexId: number): Face[] {
    return this.faces.filter(face => face.vertexIds.includes(vertexId));
  }

  /**
   * Gets all edges that use a specific vertex
   * @param vertexId The ID of the vertex
   * @returns Array of edges that reference this vertex
   */
  getEdgesUsingVertex(vertexId: number): Edge[] {
    return this.edges.filter(edge => edge.vertexIds.includes(vertexId));
  }

  /**
   * Converts the EditableMesh to a Three.js BufferGeometry
   * @returns A Three.js BufferGeometry representing this mesh
   */
  toBufferGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    
    // Create position array from vertices
    const positions: number[] = [];
    const indices: number[] = [];
    
    // Create a map from vertex ID to index for face construction
    const vertexIdToIndex = new Map<number, number>();
    let currentIndex = 0;
    
    // Add all vertices to positions array
    this.vertices.forEach(vertex => {
      positions.push(vertex.position.x, vertex.position.y, vertex.position.z);
      vertexIdToIndex.set(vertex.id, currentIndex++);
    });
    
    // Add face indices
    this.faces.forEach(face => {
      face.vertexIds.forEach(vertexId => {
        const index = vertexIdToIndex.get(vertexId);
        if (index !== undefined) {
          indices.push(index);
        }
      });
    });
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }
}