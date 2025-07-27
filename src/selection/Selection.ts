import type { EditableMesh } from '../types/index.js';

/**
 * Selection model that manages selected mesh elements
 */
export class Selection {
  selectedVertices: Set<number> = new Set();
  selectedEdges: Set<number> = new Set();
  selectedFaces: Set<number> = new Set();

  constructor() {
    // Initialize empty selection
  }

  // Vertex selection
  selectVertex(vertexId: number): void {
    this.selectedVertices.add(vertexId);
  }

  deselectVertex(vertexId: number): void {
    this.selectedVertices.delete(vertexId);
  }

  isVertexSelected(vertexId: number): boolean {
    return this.selectedVertices.has(vertexId);
  }

  // Edge selection
  selectEdge(edgeId: number): void {
    this.selectedEdges.add(edgeId);
  }

  deselectEdge(edgeId: number): void {
    this.selectedEdges.delete(edgeId);
  }

  isEdgeSelected(edgeId: number): boolean {
    return this.selectedEdges.has(edgeId);
  }

  // Face selection
  selectFace(faceId: number): void {
    this.selectedFaces.add(faceId);
  }

  deselectFace(faceId: number): void {
    this.selectedFaces.delete(faceId);
  }

  isFaceSelected(faceId: number): boolean {
    return this.selectedFaces.has(faceId);
  }

  // Bulk operations
  selectVertices(vertexIds: number[]): void {
    for (const id of vertexIds) {
      this.selectedVertices.add(id);
    }
  }

  selectEdges(edgeIds: number[]): void {
    for (const id of edgeIds) {
      this.selectedEdges.add(id);
    }
  }

  selectFaces(faceIds: number[]): void {
    for (const id of faceIds) {
      this.selectedFaces.add(id);
    }
  }

  deselectVertices(vertexIds: number[]): void {
    for (const id of vertexIds) {
      this.selectedVertices.delete(id);
    }
  }

  deselectEdges(edgeIds: number[]): void {
    for (const id of edgeIds) {
      this.selectedEdges.delete(id);
    }
  }

  deselectFaces(faceIds: number[]): void {
    for (const id of faceIds) {
      this.selectedFaces.delete(id);
    }
  }

  // Clear operations
  deselectAll(): void {
    this.selectedVertices.clear();
    this.selectedEdges.clear();
    this.selectedFaces.clear();
  }

  deselectAllVertices(): void {
    this.selectedVertices.clear();
  }

  deselectAllEdges(): void {
    this.selectedEdges.clear();
  }

  deselectAllFaces(): void {
    this.selectedFaces.clear();
  }

  // Selection queries
  getSelectedVertexCount(): number {
    return this.selectedVertices.size;
  }

  getSelectedEdgeCount(): number {
    return this.selectedEdges.size;
  }

  getSelectedFaceCount(): number {
    return this.selectedFaces.size;
  }

  getTotalSelectionCount(): number {
    return (
      this.selectedVertices.size +
      this.selectedEdges.size +
      this.selectedFaces.size
    );
  }

  getSelectedVertices(): number[] {
    return Array.from(this.selectedVertices);
  }

  getSelectedEdges(): number[] {
    return Array.from(this.selectedEdges);
  }

  getSelectedFaces(): number[] {
    return Array.from(this.selectedFaces);
  }

  // Utility methods
  clone(): Selection {
    const cloned = new Selection();
    cloned.selectedVertices = new Set(this.selectedVertices);
    cloned.selectedEdges = new Set(this.selectedEdges);
    cloned.selectedFaces = new Set(this.selectedFaces);
    return cloned;
  }

  isEmpty(): boolean {
    return (
      this.selectedVertices.size === 0 &&
      this.selectedEdges.size === 0 &&
      this.selectedFaces.size === 0
    );
  }

  // Selection expansion
  expandToConnectedVertices(mesh: EditableMesh): void {
    const newVertices = new Set<number>();

    for (const vertexId of this.selectedVertices) {
      const vertex = mesh.getVertex(vertexId);
      if (vertex) {
        // Add connected vertices by finding edges that contain this vertex
        for (const edge of mesh.edges) {
          if (edge.vertexIds[0] === vertexId) {
            newVertices.add(edge.vertexIds[1]);
          } else if (edge.vertexIds[1] === vertexId) {
            newVertices.add(edge.vertexIds[0]);
          }
        }
      }
    }

    // Add new vertices to selection
    for (const vertexId of newVertices) {
      this.selectedVertices.add(vertexId);
    }
  }

  expandToConnectedFaces(mesh: EditableMesh): void {
    const newFaces = new Set<number>();

    for (const faceId of this.selectedFaces) {
      const face = mesh.getFace(faceId);
      if (face) {
        // Add faces connected by edges by finding faces that share vertices
        for (const otherFace of mesh.faces) {
          if (otherFace.id === faceId) continue;
          
          // Check if faces share any vertices
          const sharedVertices = face.vertexIds.filter(id => 
            otherFace.vertexIds.includes(id)
          );
          if (sharedVertices.length >= 2) {
            newFaces.add(otherFace.id);
          }
        }
      }
    }

    // Add new faces to selection
    for (const faceId of newFaces) {
      this.selectedFaces.add(faceId);
    }
  }

  // Selection by type
  selectVerticesOfFaces(mesh: EditableMesh, faceIds: number[]): void {
    for (const faceId of faceIds) {
      const face = mesh.getFace(faceId);
      if (face) {
        for (const vertexId of face.vertexIds) {
          this.selectedVertices.add(vertexId);
        }
      }
    }
  }

  selectEdgesOfFaces(mesh: EditableMesh, faceIds: number[]): void {
    for (const faceId of faceIds) {
      const face = mesh.getFace(faceId);
      if (face) {
        for (const edgeId of face.edgeIds) {
          this.selectedEdges.add(edgeId);
        }
      }
    }
  }
}
