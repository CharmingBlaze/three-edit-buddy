import { EditableMesh } from '../../core/EditableMesh.js';
import type { Vector3Like, Vector2Like } from '../../types/index.js';

export interface PrimitiveParams {
  material?: {
    name: string;
    color?: Vector3Like;
    opacity?: number;
    transparent?: boolean;
  };
  uvs?: {
    enabled?: boolean;
    scale?: Vector2Like;
    offset?: Vector2Like;
  };
}

/**
 * Gold Standard Primitive Builder
 * 
 * Ensures each logical vertex is created only once and reused everywhere it's needed.
 * All faces and edges reference vertices by ID, guaranteeing connected, Blender-style editing.
 */
export class PrimitiveBuilder {
  private mesh: EditableMesh;
  private vertexMap = new Map<string, number>(); // position hash -> vertex id
  private edgeMap = new Map<string, number>(); // vertex pair hash -> edge id

  constructor(mesh: EditableMesh) {
    this.mesh = mesh;
  }

  /**
   * Add a vertex with automatic deduplication
   * Returns the vertex ID, creating a new vertex only if one doesn't exist at this position
   */
  addVertex(position: Vector3Like, name?: string): number {
    const hash = this.positionHash(position);

    if (this.vertexMap.has(hash)) {
      return this.vertexMap.get(hash)!;
    }

    const vertex = this.mesh.addVertex(position, name);
    this.vertexMap.set(hash, vertex.id);
    return vertex.id;
  }

  /**
   * Add an edge with automatic deduplication
   * Returns the edge ID, creating a new edge only if one doesn't exist between these vertices
   */
  addEdge(vertexId1: number, vertexId2: number, name?: string): number {
    const hash = this.edgeHash(vertexId1, vertexId2);

    if (this.edgeMap.has(hash)) {
      return this.edgeMap.get(hash)!;
    }

    const edge = this.mesh.addEdge(vertexId1, vertexId2, name);
    this.edgeMap.set(hash, edge.id);
    return edge.id;
  }

  /**
   * Add a quad face (4 vertices) with proper edge creation
   * All vertices must be created via addVertex() first
   */
  addQuad(vertexIds: [number, number, number, number], name?: string): number {
    const edgeIds = [
      this.addEdge(vertexIds[0], vertexIds[1]),
      this.addEdge(vertexIds[1], vertexIds[2]),
      this.addEdge(vertexIds[2], vertexIds[3]),
      this.addEdge(vertexIds[3], vertexIds[0]),
    ];

    const face = this.mesh.addFace(vertexIds, edgeIds, name);
    return face.id;
  }

  /**
   * Add a triangle face (3 vertices) with proper edge creation
   * All vertices must be created via addVertex() first
   */
  addTriangle(vertexIds: [number, number, number], name?: string): number {
    const edgeIds = [
      this.addEdge(vertexIds[0], vertexIds[1]),
      this.addEdge(vertexIds[1], vertexIds[2]),
      this.addEdge(vertexIds[2], vertexIds[0]),
    ];

    const face = this.mesh.addFace(vertexIds, edgeIds, name);
    return face.id;
  }

  /**
   * Add an n-gon face with proper edge creation
   * All vertices must be created via addVertex() first
   */
  addNGon(vertexIds: number[], name?: string): number {
    const edgeIds: number[] = [];
    
    for (let i = 0; i < vertexIds.length; i++) {
      const nextI = (i + 1) % vertexIds.length;
      edgeIds.push(this.addEdge(vertexIds[i], vertexIds[nextI]));
    }

    const face = this.mesh.addFace(vertexIds, edgeIds, name);
    return face.id;
  }

  /**
   * Create a grid of vertices with proper deduplication
   * Returns a 2D array of vertex IDs
   */
  createVertexGrid(
    width: number,
    height: number,
    widthSegments: number,
    heightSegments: number,
    positionFn: (x: number, y: number) => Vector3Like
  ): number[][] {
    const vertexIds: number[][] = [];

    for (let y = 0; y <= heightSegments; y++) {
      const row: number[] = [];
      for (let x = 0; x <= widthSegments; x++) {
        const u = x / widthSegments;
        const v = y / heightSegments;
        const position = positionFn(u, v);
        row.push(this.addVertex(position));
      }
      vertexIds.push(row);
    }

    return vertexIds;
  }

  /**
   * Create faces from a vertex grid
   * Creates quads between adjacent vertices in the grid
   */
  createFacesFromGrid(vertexGrid: number[][], namePrefix?: string): number[] {
    const faceIds: number[] = [];
    const rows = vertexGrid.length;
    const cols = vertexGrid[0]?.length || 0;

    for (let row = 0; row < rows - 1; row++) {
      for (let col = 0; col < cols - 1; col++) {
        const v00 = vertexGrid[row]?.[col];
        const v10 = vertexGrid[row]?.[col + 1];
        const v11 = vertexGrid[row + 1]?.[col + 1];
        const v01 = vertexGrid[row + 1]?.[col];

        if (v00 !== undefined && v10 !== undefined && v11 !== undefined && v01 !== undefined) {
          const faceId = this.addQuad([v00, v10, v11, v01], `${namePrefix || 'face'}-${row}-${col}`);
          faceIds.push(faceId);
        }
      }
    }

    return faceIds;
  }

  /**
   * Add material to the mesh
   */
  addMaterial(
    name: string,
    color?: Vector3Like,
    opacity?: number,
    transparent?: boolean
  ): number {
    const material = this.mesh.addMaterial(name, color, opacity, transparent);
    return material.id;
  }

  /**
   * Add UV coordinates for a vertex
   */
  addUV(vertexId: number, u: number, v: number): number {
    const uv = this.mesh.addUV(vertexId, { x: u, y: v });
    return uv.id;
  }

  /**
   * Generate UV coordinates for a grid of vertices
   */
  generateGridUVs(
    vertexIds: number[][],
    scale: Vector2Like = { x: 1, y: 1 },
    offset: Vector2Like = { x: 0, y: 0 }
  ): void {
    const rows = vertexIds.length;
    const cols = vertexIds[0]?.length || 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const vertexId = vertexIds[row]?.[col];
        if (vertexId !== undefined) {
          const u = (col / (cols - 1)) * scale.x + offset.x;
          const v = (row / (rows - 1)) * scale.y + offset.y;
          this.addUV(vertexId, u, v);
        }
      }
    }
  }

  /**
   * Generate UV coordinates for a circular arrangement
   */
  generateCircularUVs(
    centerVertexId: number,
    ringVertexIds: number[],
    scale: Vector2Like = { x: 1, y: 1 },
    offset: Vector2Like = { x: 0, y: 0 }
  ): void {
    // Center vertex gets UV (0.5, 0.5)
    this.addUV(
      centerVertexId,
      0.5 * scale.x + offset.x,
      0.5 * scale.y + offset.y
    );

    // Ring vertices get UVs in a circle
    for (let i = 0; i < ringVertexIds.length; i++) {
      const angle = (i / ringVertexIds.length) * 2 * Math.PI;
      const u = (Math.cos(angle) * 0.5 + 0.5) * scale.x + offset.x;
      const v = (Math.sin(angle) * 0.5 + 0.5) * scale.y + offset.y;
      this.addUV(ringVertexIds[i]!, u, v);
    }
  }

  /**
   * Get vertex ID at a specific position, creating if necessary
   */
  getVertexAt(position: Vector3Like, name?: string): number {
    return this.addVertex(position, name);
  }

  /**
   * Get edge ID between two vertices, creating if necessary
   */
  getEdgeBetween(vertexId1: number, vertexId2: number, name?: string): number {
    return this.addEdge(vertexId1, vertexId2, name);
  }

  /**
   * Clear all cached data (useful for debugging)
   */
  clearCache(): void {
    this.vertexMap.clear();
    this.edgeMap.clear();
  }

  /**
   * Get statistics about the builder's deduplication
   */
  getStats(): { vertexCacheSize: number; edgeCacheSize: number } {
    return {
      vertexCacheSize: this.vertexMap.size,
      edgeCacheSize: this.edgeMap.size,
    };
  }

  private positionHash(position: Vector3Like): string {
    // Use a precision of 6 decimal places to handle floating point precision
    // Also handle negative zero by converting to positive zero
    const x = Math.round(position.x * 1000000) / 1000000;
    const y = Math.round(position.y * 1000000) / 1000000;
    const z = Math.round(position.z * 1000000) / 1000000;

    // Convert negative zero to positive zero
    const normalizedX = x === 0 ? 0 : x;
    const normalizedY = y === 0 ? 0 : y;
    const normalizedZ = z === 0 ? 0 : z;

    return `${normalizedX},${normalizedY},${normalizedZ}`;
  }

  private edgeHash(vertexId1: number, vertexId2: number): string {
    // Always use the smaller ID first for consistent hashing
    return vertexId1 < vertexId2
      ? `${vertexId1},${vertexId2}`
      : `${vertexId2},${vertexId1}`;
  }

  getMesh(): EditableMesh {
    return this.mesh;
  }
}
