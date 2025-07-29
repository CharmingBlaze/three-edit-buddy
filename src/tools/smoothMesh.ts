import { EditableMesh } from '../core/EditableMesh.js';
import type { Vector3Like } from '../types/index.js';

/**
 * Smoothes a mesh using a simple Laplacian smoothing algorithm.
 * Each vertex is moved to the average position of its connected neighbors.
 * @param mesh The mesh to smooth.
 * @param iterations The number of smoothing iterations to perform.
 * @param factor The smoothing factor (0 to 1), controlling how much each vertex moves towards the average.
 */
export function smoothMesh(mesh: EditableMesh, iterations: number = 1, factor: number = 0.5): void {
  for (let i = 0; i < iterations; i++) {
    const newPositions: Map<number, Vector3Like> = new Map();

    // First, calculate the new position for each vertex based on its neighbors
    for (const vertex of mesh.vertices) {
      const connectedVertices = mesh.getConnectedVertices(vertex.id)
        .map(id => mesh.getVertex(id))
        .filter(v => v !== undefined);

      if (connectedVertices.length === 0) {
        continue; // Don't move vertices with no neighbors
      }

      const averagePosition: Vector3Like = { x: 0, y: 0, z: 0 };
      for (const neighbor of connectedVertices) {
        averagePosition.x += neighbor!.position.x;
        averagePosition.y += neighbor!.position.y;
        averagePosition.z += neighbor!.position.z;
      }

      averagePosition.x /= connectedVertices.length;
      averagePosition.y /= connectedVertices.length;
      averagePosition.z /= connectedVertices.length;

      // Interpolate between the old position and the new average position
      const finalPosition: Vector3Like = {
        x: vertex.position.x + (averagePosition.x - vertex.position.x) * factor,
        y: vertex.position.y + (averagePosition.y - vertex.position.y) * factor,
        z: vertex.position.z + (averagePosition.z - vertex.position.z) * factor,
      };

      newPositions.set(vertex.id, finalPosition);
    }

    // Then, apply the new positions to the mesh
    for (const [vertexId, newPosition] of newPositions.entries()) {
      const vertex = mesh.getVertex(vertexId);
      if (vertex) {
        vertex.position = newPosition;
      }
    }
  }
}
