import type {
  EditableMesh as IEditableMesh,
  Vertex,
  Edge,
  Face,
  Material,
  UV,
  Vector3Like,
  Vector2Like,
} from '../types/index.js';
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
      name,
    };
    this.vertices.push(vertex);
    return vertex;
  }

  addEdge(vertexId1: number, vertexId2: number, name?: string): Edge {
    const edge: Edge = {
      id: generateId(),
      vertexIds: [vertexId1, vertexId2],
      name,
    };
    this.edges.push(edge);
    return edge;
  }

  addFace(vertexIds: number[], edgeIds: number[], name?: string): Face {
    const face: Face = {
      id: generateId(),
      vertexIds,
      edgeIds,
      name,
    };
    this.faces.push(face);
    return face;
  }

  addMaterial(
    name: string,
    color?: Vector3Like,
    opacity?: number,
    transparent?: boolean
  ): Material {
    const material: Material = {
      id: generateId(),
      name,
      color,
      opacity,
      transparent,
    };
    this.materials.push(material);
    return material;
  }

  addUV(vertexId: number, position: Vector2Like): UV {
    const uv: UV = {
      id: generateId(),
      vertexId,
      position,
    };
    this.uvs.push(uv);
    return uv;
  }

  // --- Compatibility methods for visuals and conversion ---
  getVertex(vertexId: number): Vertex | undefined {
    return this.vertices.find((v) => v.id === vertexId);
  }

  getEdge(edgeId: number): Edge | undefined {
    return this.edges.find((e) => e.id === edgeId);
  }

  getFace(faceId: number): Face | undefined {
    return this.faces.find((f) => f.id === faceId);
  }

  getUVsForVertex(vertexId: number): Array<{ coordinates: Vector2Like }> {
    // Return all UVs for this vertex, wrapped in { coordinates }
    return this.uvs
      .filter((uv) => uv.vertexId === vertexId)
      .map((uv) => ({ coordinates: uv.position }));
  }

  // --- Additional utility methods ---

  /**
   * Removes a vertex and all associated edges and faces
   * @param vertexId The ID of the vertex to remove
   */
  removeVertex(vertexId: number): void {
    // Remove the vertex
    this.vertices = this.vertices.filter((v) => v.id !== vertexId);

    // Remove edges connected to this vertex
    this.edges = this.edges.filter((e) => !e.vertexIds.includes(vertexId));

    // Remove faces that reference this vertex
    this.faces = this.faces.filter((f) => !f.vertexIds.includes(vertexId));

    // Remove UVs associated with this vertex
    this.uvs = this.uvs.filter((uv) => uv.vertexId !== vertexId);
  }

  /**
   * Removes an edge and all associated faces
   * @param edgeId The ID of the edge to remove
   */
  removeEdge(edgeId: number): void {
    // Remove the edge
    this.edges = this.edges.filter((e) => e.id !== edgeId);

    // Remove faces that reference this edge
    this.faces = this.faces.filter((f) => !f.edgeIds.includes(edgeId));
  }

  /**
   * Removes a face
   * @param faceId The ID of the face to remove
   */
  removeFace(faceId: number): void {
    // Remove the face
    this.faces = this.faces.filter((f) => f.id !== faceId);
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

  // --- Selection and Interaction Methods ---

  /**
   * Finds the closest vertex to a given point in world space
   * @param worldPoint The point to find the closest vertex to
   * @param threshold Maximum distance to consider (default: 0.5)
   * @returns The closest vertex ID or null if none found within threshold
   */
  findClosestVertex(
    worldPoint: Vector3Like,
    threshold: number = 0.5
  ): number | null {
    let closestVertexId: number | null = null;
    let closestDistance = Infinity;

    for (const vertex of this.vertices) {
      const distance = Math.sqrt(
        Math.pow(vertex.position.x - worldPoint.x, 2) +
          Math.pow(vertex.position.y - worldPoint.y, 2) +
          Math.pow(vertex.position.z - worldPoint.z, 2)
      );

      if (distance < closestDistance && distance < threshold) {
        closestDistance = distance;
        closestVertexId = vertex.id;
      }
    }

    return closestVertexId;
  }

  /**
   * Finds the closest edge to a given point in world space
   * @param worldPoint The point to find the closest edge to
   * @param threshold Maximum distance to consider (default: 0.5)
   * @returns The closest edge ID or null if none found within threshold
   */
  findClosestEdge(
    worldPoint: Vector3Like,
    threshold: number = 0.5
  ): number | null {
    let closestEdgeId: number | null = null;
    let closestDistance = Infinity;

    for (const edge of this.edges) {
      const vertex1 = this.getVertex(edge.vertexIds[0]);
      const vertex2 = this.getVertex(edge.vertexIds[1]);

      if (vertex1 && vertex2) {
        const distance = this.distanceToLineSegment(
          worldPoint,
          vertex1.position,
          vertex2.position
        );

        if (distance < closestDistance && distance < threshold) {
          closestDistance = distance;
          closestEdgeId = edge.id;
        }
      }
    }

    return closestEdgeId;
  }

  /**
   * Finds the face that contains a given triangle index, considering face orientation
   * @param triangleIndex The triangle index from Three.js raycasting
   * @param faceNormal The face normal from Three.js raycasting
   * @param intersectionPoint The intersection point in world space
   * @param cameraDirection Optional camera direction for front/back face detection
   * @returns The face ID or null if not found
   */
  findFaceFromTriangle(
    _triangleIndex: number,
    _faceNormal: Vector3Like,
    intersectionPoint: Vector3Like,
    _cameraDirection?: Vector3Like
  ): number | null {
    // For now, return the first face that contains the triangle
    // In a more sophisticated implementation, this would map triangle indices to face IDs
    // and consider face orientation

    if (this.faces.length === 0) return null;

    // Simple fallback: find the face closest to the intersection point
    return this.findClosestFace(intersectionPoint);
  }

  /**
   * Finds the closest face to a given point in world space
   * @param worldPoint The point to find the closest face to
   * @returns The closest face ID or null if no faces exist
   */
  findClosestFace(worldPoint: Vector3Like): number | null {
    if (this.faces.length === 0) return null;

    let closestFaceId: number | null = null;
    let closestDistance = Infinity;

    for (const face of this.faces) {
      // Calculate face center
      const faceVertices = face.vertexIds
        .map((id) => this.getVertex(id))
        .filter((v) => v !== undefined);
      if (faceVertices.length === 0) continue;

      const center = { x: 0, y: 0, z: 0 };
      faceVertices.forEach((vertex) => {
        center.x += vertex!.position.x;
        center.y += vertex!.position.y;
        center.z += vertex!.position.z;
      });
      center.x /= faceVertices.length;
      center.y /= faceVertices.length;
      center.z /= faceVertices.length;

      const distance = Math.sqrt(
        Math.pow(center.x - worldPoint.x, 2) +
          Math.pow(center.y - worldPoint.y, 2) +
          Math.pow(center.z - worldPoint.z, 2)
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestFaceId = face.id;
      }
    }

    return closestFaceId;
  }

  /**
   * Calculates the distance from a point to a line segment
   * @param point The point
   * @param lineStart The start of the line segment
   * @param lineEnd The end of the line segment
   * @returns The shortest distance from the point to the line segment
   */
  private distanceToLineSegment(
    point: Vector3Like,
    lineStart: Vector3Like,
    lineEnd: Vector3Like
  ): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = point.z - lineStart.z;

    const D = lineEnd.x - lineStart.x;
    const E = lineEnd.y - lineStart.y;
    const F = lineEnd.z - lineStart.z;

    const dot = A * D + B * E + C * F;
    const lenSq = D * D + E * E + F * F;

    if (lenSq === 0) {
      // Line segment is actually a point
      return Math.sqrt(A * A + B * B + C * C);
    }

    const param = dot / lenSq;

    let xx, yy, zz;

    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
      zz = lineStart.z;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
      zz = lineEnd.z;
    } else {
      xx = lineStart.x + param * D;
      yy = lineStart.y + param * E;
      zz = lineStart.z + param * F;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    const dz = point.z - zz;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Gets all vertices connected to a given vertex
   * @param vertexId The vertex ID
   * @returns Array of connected vertex IDs
   */
  getConnectedVertices(vertexId: number): number[] {
    const connected: number[] = [];

    for (const edge of this.edges) {
      if (edge.vertexIds[0] === vertexId) {
        connected.push(edge.vertexIds[1]);
      } else if (edge.vertexIds[1] === vertexId) {
        connected.push(edge.vertexIds[0]);
      }
    }

    return connected;
  }

  /**
   * Gets all faces that contain a given vertex
   * @param vertexId The vertex ID
   * @returns Array of face IDs
   */
  getFacesContainingVertex(vertexId: number): number[] {
    return this.faces
      .filter((face) => face.vertexIds.includes(vertexId))
      .map((face) => face.id);
  }

  /**
   * Gets all edges that contain a given vertex
   * @param vertexId The vertex ID
   * @returns Array of edge IDs
   */
  getEdgesContainingVertex(vertexId: number): number[] {
    return this.edges
      .filter((edge) => edge.vertexIds.includes(vertexId))
      .map((edge) => edge.id);
  }

  /**
   * Gets all faces that share an edge with a given face
   * @param faceId The face ID
   * @returns Array of adjacent face IDs
   */
  getAdjacentFaces(faceId: number): number[] {
    const face = this.getFace(faceId);
    if (!face) return [];

    const adjacent: number[] = [];

    for (const otherFace of this.faces) {
      if (otherFace.id === faceId) continue;

      // Check if faces share any edges
      const sharedVertices = face.vertexIds.filter((id) =>
        otherFace.vertexIds.includes(id)
      );
      if (sharedVertices.length >= 2) {
        adjacent.push(otherFace.id);
      }
    }

    return adjacent;
  }

  /**
   * Validates that the mesh topology is consistent
   * @returns Object with validation results
   */
  validateTopology(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for orphaned vertices
    for (const vertex of this.vertices) {
      const connectedEdges = this.getEdgesContainingVertex(vertex.id);
      if (connectedEdges.length === 0) {
        warnings.push(`Vertex ${vertex.id} is not connected to any edges`);
      }
    }

    // Check for orphaned edges
    for (const edge of this.edges) {
      const vertex1 = this.getVertex(edge.vertexIds[0]);
      const vertex2 = this.getVertex(edge.vertexIds[1]);

      if (!vertex1 || !vertex2) {
        errors.push(`Edge ${edge.id} references non-existent vertices`);
      }
    }

    // Check for orphaned faces
    for (const face of this.faces) {
      for (const vertexId of face.vertexIds) {
        const vertex = this.getVertex(vertexId);
        if (!vertex) {
          errors.push(
            `Face ${face.id} references non-existent vertex ${vertexId}`
          );
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Gets all faces that use a specific vertex
   * @param vertexId The ID of the vertex
   * @returns Array of faces that reference this vertex
   */
  getFacesUsingVertex(vertexId: number): Face[] {
    return this.faces.filter((face) => face.vertexIds.includes(vertexId));
  }

  /**
   * Gets all edges that use a specific vertex
   * @param vertexId The ID of the vertex
   * @returns Array of edges that reference this vertex
   */
  getEdgesUsingVertex(vertexId: number): Edge[] {
    return this.edges.filter((edge) => edge.vertexIds.includes(vertexId));
  }

  /**
   * Converts the EditableMesh to a Three.js BufferGeometry with better face preservation
   * @returns A Three.js BufferGeometry representing this mesh
   */
  toBufferGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();

    if (this.vertices.length === 0 || this.faces.length === 0) {
      console.warn('EditableMesh has no vertices or faces');
      return geometry;
    }

    // Create position array from vertices
    const positions: number[] = [];
    const indices: number[] = [];

    // Create a map from vertex ID to index for face construction
    const vertexIdToIndex = new Map<number, number>();
    let currentIndex = 0;

    // Add all vertices to positions array
    this.vertices.forEach((vertex) => {
      positions.push(vertex.position.x, vertex.position.y, vertex.position.z);
      vertexIdToIndex.set(vertex.id, currentIndex++);
    });

    // Add face indices with minimal triangulation
    this.faces.forEach((face) => {
      const vertexCount = face.vertexIds.length;

      if (vertexCount === 3) {
        // Triangle - add as is
        face.vertexIds.forEach((vertexId) => {
          const index = vertexIdToIndex.get(vertexId);
          if (index !== undefined) {
            indices.push(index);
          }
        });
      } else if (vertexCount === 4) {
        // Quad - triangulate into 2 triangles with proper winding
        const indices4 = face.vertexIds
          .map((vertexId) => vertexIdToIndex.get(vertexId))
          .filter((index): index is number => index !== undefined);
        if (indices4.length === 4) {
          // First triangle: 0, 1, 2 (clockwise winding)
          indices.push(indices4[0]!, indices4[1]!, indices4[2]!);
          // Second triangle: 0, 2, 3 (clockwise winding)
          indices.push(indices4[0]!, indices4[2]!, indices4[3]!);
        }
      } else if (vertexCount > 4) {
        // N-gon - use fan triangulation with proper winding
        const indicesN = face.vertexIds
          .map((vertexId) => vertexIdToIndex.get(vertexId))
          .filter((index): index is number => index !== undefined);
        if (indicesN.length >= 3) {
          const centerIndex = indicesN[0]!;
          for (let i = 1; i < indicesN.length - 1; i++) {
            // Clockwise winding: center, i, i+1
            indices.push(centerIndex, indicesN[i]!, indicesN[i + 1]!);
          }
        }
      }
    });

    if (positions.length === 0) {
      console.warn('No positions generated for geometry');
      return geometry;
    }

    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );

    if (indices.length > 0) {
      geometry.setIndex(indices);
    }

    // Compute normals after setting indices
    geometry.computeVertexNormals();

    return geometry;
  }

  /**
   * Creates a geometry that better preserves face structure for highlighting
   * @returns A Three.js BufferGeometry optimized for face display
   */
  toFaceGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();

    if (this.vertices.length === 0 || this.faces.length === 0) {
      return geometry;
    }

    const positions: number[] = [];
    const indices: number[] = [];
    let currentIndex = 0;

    // Create a map from vertex ID to index
    const vertexIdToIndex = new Map<number, number>();

    // Add all vertices to positions array
    this.vertices.forEach((vertex) => {
      positions.push(vertex.position.x, vertex.position.y, vertex.position.z);
      vertexIdToIndex.set(vertex.id, currentIndex++);
    });

    // Create separate triangles for each face to avoid triangulation artifacts
    this.faces.forEach((face) => {
      const vertexCount = face.vertexIds.length;

      if (vertexCount === 3) {
        // Triangle - add as is
        face.vertexIds.forEach((vertexId) => {
          const index = vertexIdToIndex.get(vertexId);
          if (index !== undefined) {
            indices.push(index);
          }
        });
      } else if (vertexCount === 4) {
        // Quad - create as separate triangles but with better structure
        const indices4 = face.vertexIds
          .map((vertexId) => vertexIdToIndex.get(vertexId))
          .filter((index): index is number => index !== undefined);
        if (indices4.length === 4) {
          // Create two triangles that form a proper quad
          indices.push(indices4[0]!, indices4[1]!, indices4[2]!);
          indices.push(indices4[0]!, indices4[2]!, indices4[3]!);
        }
      } else if (vertexCount > 4) {
        // N-gon - use fan triangulation
        const indicesN = face.vertexIds
          .map((vertexId) => vertexIdToIndex.get(vertexId))
          .filter((index): index is number => index !== undefined);
        if (indicesN.length >= 3) {
          const centerIndex = indicesN[0]!;
          for (let i = 1; i < indicesN.length - 1; i++) {
            indices.push(centerIndex, indicesN[i]!, indicesN[i + 1]!);
          }
        }
      }
    });

    if (positions.length > 0) {
      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
      );
      if (indices.length > 0) {
        geometry.setIndex(indices);
      }
      geometry.computeVertexNormals();
    }

    return geometry;
  }
}
