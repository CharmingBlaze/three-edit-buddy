import type { EditableMesh } from '../core/EditableMesh.js';
import type { Vector3Like } from '../types/index.js';

/**
 * Snaps a position to the nearest point on a grid.
 * @param position The position to snap.
 * @param gridSize The size of the grid cells.
 * @returns The new snapped position.
 */
export function snapToGrid(position: Vector3Like, gridSize: number): Vector3Like {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
    z: Math.round(position.z / gridSize) * gridSize,
  };
}

/**
 * Finds the closest vertex to a given position within a certain threshold.
 * @param mesh The mesh to search within.
 * @param position The position to search near.
 * @param threshold The maximum distance to be considered a 'snap'.
 * @param excludeVertexId The ID of the vertex being dragged, to avoid snapping to itself.
 * @returns The position of the closest vertex if one is found within the threshold, otherwise null.
 */
export function findClosestVertex(mesh: EditableMesh, position: Vector3Like, threshold: number, excludeVertexId: number): Vector3Like | null {
  let closestVertex: Vector3Like | null = null;
  let minDistanceSq = threshold * threshold;

  for (const vertex of mesh.vertices) {
    if (vertex.id === excludeVertexId) {
      continue;
    }

    const dx = position.x - vertex.position.x;
    const dy = position.y - vertex.position.y;
    const dz = position.z - vertex.position.z;
    const distanceSq = dx * dx + dy * dy + dz * dz;

    if (distanceSq < minDistanceSq) {
      minDistanceSq = distanceSq;
      closestVertex = vertex.position;
    }
  }

  return closestVertex;
}
