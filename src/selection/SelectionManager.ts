import type { Vector3Like } from '../types/index.js';
import { EditableMesh } from '../core/EditableMesh.js';

/**
 * Selection state for vertices, edges, and faces
 */
export interface SelectionState {
  selectedVertices: Set<number>;
  selectedEdges: Set<number>;
  selectedFaces: Set<number>;
}

/**
 * Options for selection operations
 */
export interface SelectionOptions {
  /** Maximum distance for picking (default: 0.5) */
  threshold?: number;
  /** Whether to allow multiple selections (default: true) */
  multiSelect?: boolean;
  /** Whether to clear existing selection when selecting new items (default: false) */
  clearOnSelect?: boolean;
  /** Whether to toggle selection on re-click (default: true) */
  toggleOnReclick?: boolean;
}

/**
 * Manages selection state and operations for an EditableMesh
 */
export class SelectionManager {
  private mesh: EditableMesh;
  private state: SelectionState;
  private options: Required<SelectionOptions>;

  constructor(mesh: EditableMesh, options: SelectionOptions = {}) {
    this.mesh = mesh;
    this.state = {
      selectedVertices: new Set(),
      selectedEdges: new Set(),
      selectedFaces: new Set(),
    };
    this.options = {
      threshold: options.threshold ?? 0.5,
      multiSelect: options.multiSelect ?? true,
      clearOnSelect: options.clearOnSelect ?? false,
      toggleOnReclick: options.toggleOnReclick ?? true,
    };
  }

  /**
   * Gets the current selection state
   */
  getSelection(): SelectionState {
    return {
      selectedVertices: new Set(this.state.selectedVertices),
      selectedEdges: new Set(this.state.selectedEdges),
      selectedFaces: new Set(this.state.selectedFaces),
    };
  }

  /**
   * Clears all selections
   */
  clearSelection(): void {
    this.state.selectedVertices.clear();
    this.state.selectedEdges.clear();
    this.state.selectedFaces.clear();
  }

  /**
   * Selects a vertex by ID
   */
  selectVertex(vertexId: number): boolean {
    if (!this.mesh.getVertex(vertexId)) {
      return false;
    }

    if (this.options.clearOnSelect) {
      this.clearSelection();
    }

    if (
      this.options.toggleOnReclick &&
      this.state.selectedVertices.has(vertexId)
    ) {
      this.state.selectedVertices.delete(vertexId);
      return true;
    }

    if (this.options.multiSelect) {
      this.state.selectedVertices.add(vertexId);
    } else {
      this.state.selectedVertices.clear();
      this.state.selectedVertices.add(vertexId);
    }

    return true;
  }

  /**
   * Selects an edge by ID
   */
  selectEdge(edgeId: number): boolean {
    if (!this.mesh.getEdge(edgeId)) {
      return false;
    }

    if (this.options.clearOnSelect) {
      this.clearSelection();
    }

    if (this.options.toggleOnReclick && this.state.selectedEdges.has(edgeId)) {
      this.state.selectedEdges.delete(edgeId);
      return true;
    }

    if (this.options.multiSelect) {
      this.state.selectedEdges.add(edgeId);
    } else {
      this.state.selectedEdges.clear();
      this.state.selectedEdges.add(edgeId);
    }

    return true;
  }

  /**
   * Selects a face by ID
   */
  selectFace(faceId: number): boolean {
    if (!this.mesh.getFace(faceId)) {
      return false;
    }

    if (this.options.clearOnSelect) {
      this.clearSelection();
    }

    if (this.options.toggleOnReclick && this.state.selectedFaces.has(faceId)) {
      this.state.selectedFaces.delete(faceId);
      return true;
    }

    if (this.options.multiSelect) {
      this.state.selectedFaces.add(faceId);
    } else {
      this.state.selectedFaces.clear();
      this.state.selectedFaces.add(faceId);
    }

    return true;
  }

  /**
   * Selects the closest vertex to a world point
   */
  selectVertexAtPoint(worldPoint: Vector3Like): number | null {
    const vertexId = this.mesh.findClosestVertex(
      worldPoint,
      this.options.threshold
    );
    if (vertexId !== null) {
      this.selectVertex(vertexId);
      return vertexId;
    }
    return null;
  }

  /**
   * Selects the closest edge to a world point
   */
  selectEdgeAtPoint(worldPoint: Vector3Like): number | null {
    const edgeId = this.mesh.findClosestEdge(
      worldPoint,
      this.options.threshold
    );
    if (edgeId !== null) {
      this.selectEdge(edgeId);
      return edgeId;
    }
    return null;
  }

  /**
   * Selects the closest face to a world point
   */
  selectFaceAtPoint(worldPoint: Vector3Like): number | null {
    const faceId = this.mesh.findClosestFace(worldPoint);
    if (faceId !== null) {
      this.selectFace(faceId);
      return faceId;
    }
    return null;
  }

  /**
   * Selects elements from a Three.js raycast intersection
   */
  selectFromRaycast(
    intersection: {
      faceIndex: number;
      face: { normal: Vector3Like };
      point: Vector3Like;
    },
    selectionType: 'vertex' | 'edge' | 'face'
  ): number | null {
    switch (selectionType) {
      case 'vertex':
        return this.selectVertexAtPoint(intersection.point);
      case 'edge':
        return this.selectEdgeAtPoint(intersection.point);
      case 'face':
        const faceId = this.mesh.findFaceFromTriangle(
          intersection.faceIndex,
          intersection.face.normal,
          intersection.point
        );
        if (faceId !== null) {
          this.selectFace(faceId);
          return faceId;
        }
        return null;
      default:
        return null;
    }
  }

  /**
   * Selects all vertices connected to the currently selected vertices
   */
  selectConnectedVertices(): void {
    const newVertices = new Set<number>();

    for (const vertexId of this.state.selectedVertices) {
      const connected = this.mesh.getConnectedVertices(vertexId);
      connected.forEach((id) => newVertices.add(id));
    }

    this.state.selectedVertices = newVertices;
  }

  /**
   * Selects all faces that contain any of the currently selected vertices
   */
  selectFacesWithSelectedVertices(): void {
    const newFaces = new Set<number>();

    for (const vertexId of this.state.selectedVertices) {
      const faces = this.mesh.getFacesContainingVertex(vertexId);
      faces.forEach((id) => newFaces.add(id));
    }

    this.state.selectedFaces = newFaces;
  }

  /**
   * Selects all edges that contain any of the currently selected vertices
   */
  selectEdgesWithSelectedVertices(): void {
    const newEdges = new Set<number>();

    for (const vertexId of this.state.selectedVertices) {
      const edges = this.mesh.getEdgesContainingVertex(vertexId);
      edges.forEach((id) => newEdges.add(id));
    }

    this.state.selectedEdges = newEdges;
  }

  /**
   * Selects all vertices that are part of the currently selected faces
   */
  selectVerticesInSelectedFaces(): void {
    const newVertices = new Set<number>();

    for (const faceId of this.state.selectedFaces) {
      const face = this.mesh.getFace(faceId);
      if (face) {
        face.vertexIds.forEach((id) => newVertices.add(id));
      }
    }

    this.state.selectedVertices = newVertices;
  }

  /**
   * Selects all vertices that are part of the currently selected edges
   */
  selectVerticesInSelectedEdges(): void {
    const newVertices = new Set<number>();

    for (const edgeId of this.state.selectedEdges) {
      const edge = this.mesh.getEdge(edgeId);
      if (edge) {
        edge.vertexIds.forEach((id) => newVertices.add(id));
      }
    }

    this.state.selectedVertices = newVertices;
  }

  /**
   * Gets selection statistics
   */
  getSelectionStats(): {
    vertexCount: number;
    edgeCount: number;
    faceCount: number;
    totalCount: number;
  } {
    return {
      vertexCount: this.state.selectedVertices.size,
      edgeCount: this.state.selectedEdges.size,
      faceCount: this.state.selectedFaces.size,
      totalCount:
        this.state.selectedVertices.size +
        this.state.selectedEdges.size +
        this.state.selectedFaces.size,
    };
  }

  /**
   * Updates the selection options
   */
  updateOptions(options: Partial<SelectionOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Gets the current selection options
   */
  getOptions(): Required<SelectionOptions> {
    return { ...this.options };
  }

  /**
   * Selects multiple vertices at once
   */
  selectVertices(vertexIds: number[]): void {
    if (this.options.clearOnSelect) {
      this.clearSelection();
    }

    for (const vertexId of vertexIds) {
      if (this.mesh.getVertex(vertexId)) {
        this.state.selectedVertices.add(vertexId);
      }
    }
  }

  /**
   * Selects multiple edges at once
   */
  selectEdges(edgeIds: number[]): void {
    if (this.options.clearOnSelect) {
      this.clearSelection();
    }

    for (const edgeId of edgeIds) {
      if (this.mesh.getEdge(edgeId)) {
        this.state.selectedEdges.add(edgeId);
      }
    }
  }

  /**
   * Selects multiple faces at once
   */
  selectFaces(faceIds: number[]): void {
    if (this.options.clearOnSelect) {
      this.clearSelection();
    }

    for (const faceId of faceIds) {
      if (this.mesh.getFace(faceId)) {
        this.state.selectedFaces.add(faceId);
      }
    }
  }

  /**
   * Selects all vertices in a bounding box
   */
  selectVerticesInBox(
    minPoint: Vector3Like,
    maxPoint: Vector3Like
  ): void {
    const selectedVertices: number[] = [];

    for (const vertex of this.mesh.vertices) {
      if (
        vertex.position.x >= minPoint.x &&
        vertex.position.x <= maxPoint.x &&
        vertex.position.y >= minPoint.y &&
        vertex.position.y <= maxPoint.y &&
        vertex.position.z >= minPoint.z &&
        vertex.position.z <= maxPoint.z
      ) {
        selectedVertices.push(vertex.id);
      }
    }

    this.selectVertices(selectedVertices);
  }

  /**
   * Selects all vertices within a radius of a point
   */
  selectVerticesInRadius(
    center: Vector3Like,
    radius: number
  ): void {
    const selectedVertices: number[] = [];

    for (const vertex of this.mesh.vertices) {
      const distance = Math.sqrt(
        Math.pow(vertex.position.x - center.x, 2) +
        Math.pow(vertex.position.y - center.y, 2) +
        Math.pow(vertex.position.z - center.z, 2)
      );

      if (distance <= radius) {
        selectedVertices.push(vertex.id);
      }
    }

    this.selectVertices(selectedVertices);
  }

  /**
   * Selects all edges within a radius of a point
   */
  selectEdgesInRadius(
    center: Vector3Like,
    radius: number
  ): void {
    const selectedEdges: number[] = [];

    for (const edge of this.mesh.edges) {
      const vertex1 = this.mesh.getVertex(edge.vertexIds[0]);
      const vertex2 = this.mesh.getVertex(edge.vertexIds[1]);

      if (vertex1 && vertex2) {
        // Calculate edge midpoint
        const midpoint = {
          x: (vertex1.position.x + vertex2.position.x) / 2,
          y: (vertex1.position.y + vertex2.position.y) / 2,
          z: (vertex1.position.z + vertex2.position.z) / 2,
        };

        const distance = Math.sqrt(
          Math.pow(midpoint.x - center.x, 2) +
          Math.pow(midpoint.y - center.y, 2) +
          Math.pow(midpoint.z - center.z, 2)
        );

        if (distance <= radius) {
          selectedEdges.push(edge.id);
        }
      }
    }

    this.selectEdges(selectedEdges);
  }

  /**
   * Selects all faces within a radius of a point
   */
  selectFacesInRadius(
    center: Vector3Like,
    radius: number
  ): void {
    const selectedFaces: number[] = [];

    for (const face of this.mesh.faces) {
      const vertices = face.vertexIds.map((vertexId) => this.mesh.getVertex(vertexId));
      const validVertices = vertices.filter((v) => v !== undefined);

      if (validVertices.length > 0) {
        // Calculate face center
        const centerX = validVertices.reduce((sum, v) => sum + v!.position.x, 0) / validVertices.length;
        const centerY = validVertices.reduce((sum, v) => sum + v!.position.y, 0) / validVertices.length;
        const centerZ = validVertices.reduce((sum, v) => sum + v!.position.z, 0) / validVertices.length;

        const faceCenter = { x: centerX, y: centerY, z: centerZ };

        const distance = Math.sqrt(
          Math.pow(faceCenter.x - center.x, 2) +
          Math.pow(faceCenter.y - center.y, 2) +
          Math.pow(faceCenter.z - center.z, 2)
        );

        if (distance <= radius) {
          selectedFaces.push(face.id);
        }
      }
    }

    this.selectFaces(selectedFaces);
  }

  /**
   * Selects all vertices, edges, and faces in a radius
   */
  selectAllInRadius(
    center: Vector3Like,
    radius: number
  ): void {
    this.selectVerticesInRadius(center, radius);
    this.selectEdgesInRadius(center, radius);
    this.selectFacesInRadius(center, radius);
  }

  /**
   * Inverts the current selection
   */
  invertSelection(): void {
    const allVertices = this.mesh.vertices.map((v) => v.id);
    const allEdges = this.mesh.edges.map((e) => e.id);
    const allFaces = this.mesh.faces.map((f) => f.id);

    const invertedVertices = allVertices.filter((id) => !this.state.selectedVertices.has(id));
    const invertedEdges = allEdges.filter((id) => !this.state.selectedEdges.has(id));
    const invertedFaces = allFaces.filter((id) => !this.state.selectedFaces.has(id));

    this.state.selectedVertices = new Set(invertedVertices);
    this.state.selectedEdges = new Set(invertedEdges);
    this.state.selectedFaces = new Set(invertedFaces);
  }

  /**
   * Selects all elements
   */
  selectAll(): void {
    this.state.selectedVertices = new Set(this.mesh.vertices.map((v) => v.id));
    this.state.selectedEdges = new Set(this.mesh.edges.map((e) => e.id));
    this.state.selectedFaces = new Set(this.mesh.faces.map((f) => f.id));
  }

  /**
   * Expands selection to include connected elements
   */
  expandSelection(): void {
    const newVertices = new Set(this.state.selectedVertices);
    const newEdges = new Set(this.state.selectedEdges);
    const newFaces = new Set(this.state.selectedFaces);

    // Add vertices connected to selected edges
    for (const edgeId of this.state.selectedEdges) {
      const edge = this.mesh.getEdge(edgeId);
      if (edge) {
        edge.vertexIds.forEach((id) => newVertices.add(id));
      }
    }

    // Add edges connected to selected vertices
    for (const vertexId of this.state.selectedVertices) {
      const edges = this.mesh.getEdgesContainingVertex(vertexId);
      edges.forEach((id) => newEdges.add(id));
    }

    // Add faces connected to selected vertices
    for (const vertexId of this.state.selectedVertices) {
      const faces = this.mesh.getFacesContainingVertex(vertexId);
      faces.forEach((id) => newFaces.add(id));
    }

    this.state.selectedVertices = newVertices;
    this.state.selectedEdges = newEdges;
    this.state.selectedFaces = newFaces;
  }

  /**
   * Contracts selection to only include elements that are fully selected
   */
  contractSelection(): void {
    const newVertices = new Set<number>();
    const newEdges = new Set<number>();
    const newFaces = new Set<number>();

    // Only keep vertices that are part of selected edges
    for (const edgeId of this.state.selectedEdges) {
      const edge = this.mesh.getEdge(edgeId);
      if (edge) {
        edge.vertexIds.forEach((id) => newVertices.add(id));
      }
    }

    // Only keep edges that are part of selected faces
    for (const faceId of this.state.selectedFaces) {
      const face = this.mesh.getFace(faceId);
      if (face) {
        face.edgeIds.forEach((id) => newEdges.add(id));
      }
    }

    this.state.selectedVertices = newVertices;
    this.state.selectedEdges = newEdges;
  }
}
