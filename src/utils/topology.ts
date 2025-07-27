import type { EditableMesh } from '../types/index.js';

/**
 * Gets all faces connected to a vertex
 * @param mesh The mesh to search
 * @param vertexId The vertex ID to find connected faces for
 * @returns Array of face IDs connected to the vertex
 */
export function getConnectedFaces(
  mesh: EditableMesh,
  vertexId: number
): number[] {
  return mesh.faces
    .filter((face) => face.vertexIds.includes(vertexId))
    .map((face) => face.id);
}

/**
 * Gets all edges connected to a vertex
 * @param mesh The mesh to search
 * @param vertexId The vertex ID to find connected edges for
 * @returns Array of edge IDs connected to the vertex
 */
export function getConnectedEdges(
  mesh: EditableMesh,
  vertexId: number
): number[] {
  return mesh.edges
    .filter((edge) => edge.vertexIds.includes(vertexId))
    .map((edge) => edge.id);
}

/**
 * Checks if an edge is a boundary edge (connected to only one face)
 * @param mesh The mesh to check
 * @param edgeId The edge ID to check
 * @returns True if the edge is a boundary edge
 */
export function isBoundaryEdge(mesh: EditableMesh, edgeId: number): boolean {
  const edge = mesh.getEdge(edgeId);
  if (!edge) return false;

  const connectedFaces = mesh.faces.filter((face) =>
    face.edgeIds.includes(edgeId)
  );

  return connectedFaces.length <= 1;
}

/**
 * Checks if a vertex is a boundary vertex (connected to at least one boundary edge)
 * @param mesh The mesh to check
 * @param vertexId The vertex ID to check
 * @returns True if the vertex is a boundary vertex
 */
export function isBoundaryVertex(
  mesh: EditableMesh,
  vertexId: number
): boolean {
  const connectedEdges = getConnectedEdges(mesh, vertexId);
  return connectedEdges.some((edgeId) => isBoundaryEdge(mesh, edgeId));
}
