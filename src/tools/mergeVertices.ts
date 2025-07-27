import { EditableMesh } from '../core/EditableMesh.js';
import type { Vector3Like } from '../types/index.js';

/**
 * Merges vertices that are within a specified distance of each other
 *
 * Combines vertices that are close together and updates all faces and edges
 * that reference the merged vertices.
 *
 * @param mesh - The mesh to merge vertices in
 * @param threshold - Distance threshold for merging (default: 0.001)
 * @returns Object containing counts of merged vertices and updated faces
 */
export function mergeVertices(
  mesh: EditableMesh,
  threshold: number = 0.001
): { mergedVertices: number; updatedFaces: number } {
  const vertexGroups = findVertexGroups(mesh, threshold);
  let mergedCount = 0;
  let updatedFaces = 0;

  // Process each group of vertices to merge
  for (const group of vertexGroups) {
    if (group.length > 1) {
      const result = mergeVertexGroup(mesh, group);
      mergedCount += result.mergedCount;
      updatedFaces += result.updatedFaces;
    }
  }

  return { mergedVertices: mergedCount, updatedFaces };
}

/**
 * Finds groups of vertices that should be merged based on proximity
 */
function findVertexGroups(mesh: EditableMesh, threshold: number): number[][] {
  const groups: number[][] = [];
  const processed = new Set<number>();

  for (const vertex of mesh.vertices) {
    if (processed.has(vertex.id)) continue;

    const group = [vertex.id];
    processed.add(vertex.id);

    // Find all vertices within threshold distance
    for (const otherVertex of mesh.vertices) {
      if (otherVertex.id === vertex.id || processed.has(otherVertex.id))
        continue;

      const distance = calculateDistance(vertex.position, otherVertex.position);
      if (distance <= threshold) {
        group.push(otherVertex.id);
        processed.add(otherVertex.id);
      }
    }

    groups.push(group);
  }

  return groups;
}

/**
 * Merges a group of vertices into a single vertex
 */
function mergeVertexGroup(
  mesh: EditableMesh,
  vertexIds: number[]
): { mergedCount: number; updatedFaces: number } {
  if (vertexIds.length <= 1) {
    return { mergedCount: 0, updatedFaces: 0 };
  }

  // Use the first vertex as the target vertex
  const targetVertexId = vertexIds[0]!;
  const verticesToRemove = vertexIds.slice(1);

  // Calculate the average position for the target vertex
  const targetVertex = mesh.vertices.find((v) => v.id === targetVertexId);
  if (!targetVertex) return { mergedCount: 0, updatedFaces: 0 };

  let totalX = targetVertex.position.x;
  let totalY = targetVertex.position.y;
  let totalZ = targetVertex.position.z;

  for (const vertexId of verticesToRemove) {
    const vertex = mesh.vertices.find((v) => v.id === vertexId);
    if (vertex) {
      totalX += vertex.position.x;
      totalY += vertex.position.y;
      totalZ += vertex.position.z;
    }
  }

  const averagePosition = {
    x: totalX / vertexIds.length,
    y: totalY / vertexIds.length,
    z: totalZ / vertexIds.length,
  };

  // Update target vertex position
  targetVertex.position = averagePosition;

  // Update all faces that reference the vertices to be removed
  let updatedFaces = 0;
  for (const face of mesh.faces) {
    let faceUpdated = false;

    for (const vertexId of verticesToRemove) {
      const index = face.vertexIds.indexOf(vertexId);
      if (index !== -1) {
        face.vertexIds[index] = targetVertexId;
        faceUpdated = true;
      }
    }

    if (faceUpdated) {
      // Remove duplicate vertices from the face
      const uniqueVertexIds = [...new Set(face.vertexIds)];
      face.vertexIds = uniqueVertexIds;
      updatedFaces++;
    }
  }

  // Remove the merged vertices
  for (const vertexId of verticesToRemove) {
    const index = mesh.vertices.findIndex((v) => v.id === vertexId);
    if (index !== -1) {
      mesh.vertices.splice(index, 1);
    }
  }

  // Clean up edges that reference removed vertices
  mesh.edges = mesh.edges.filter((edge) => {
    const hasRemovedVertex = edge.vertexIds.some((id) =>
      verticesToRemove.includes(id)
    );
    if (hasRemovedVertex) {
      // Update edge to use target vertex instead
      const updatedVertexIds = edge.vertexIds.map((id) =>
        verticesToRemove.includes(id) ? targetVertexId : id
      ) as [number, number];

      // Remove self-loops
      if (updatedVertexIds[0] === updatedVertexIds[1]) {
        return false;
      }

      edge.vertexIds = updatedVertexIds;
    }
    return true;
  });

  // Remove duplicate edges
  const uniqueEdges = new Map<string, any>();
  for (const edge of mesh.edges) {
    const key = `${Math.min(edge.vertexIds[0], edge.vertexIds[1])}-${Math.max(edge.vertexIds[0], edge.vertexIds[1])}`;
    if (!uniqueEdges.has(key)) {
      uniqueEdges.set(key, edge);
    }
  }
  mesh.edges = Array.from(uniqueEdges.values());

  return { mergedCount: verticesToRemove.length, updatedFaces };
}

/**
 * Calculates the Euclidean distance between two points
 */
function calculateDistance(pos1: Vector3Like, pos2: Vector3Like): number {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Merges specific vertices by their IDs
 *
 * @param mesh - The mesh to merge vertices in
 * @param vertexIds - Array of vertex IDs to merge
 * @returns ID of the target vertex (first in the array)
 */
export function mergeSpecificVertices(
  mesh: EditableMesh,
  vertexIds: number[]
): number {
  if (vertexIds.length === 0) {
    return -1;
  }

  if (vertexIds.length === 1) {
    return vertexIds[0]!;
  }

  mergeVertexGroup(mesh, vertexIds);
  return vertexIds[0]!;
}
