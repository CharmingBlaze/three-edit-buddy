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
}
