import { EditableMesh } from '../core/EditableMesh.js';
import { PrimitiveBuilder } from '../primitives/core/PrimitiveBuilder.js';

/**
 * Inserts an edge loop around a mesh
 *
 * Creates a new edge loop that runs parallel to an existing edge ring.
 *
 * @param mesh - The mesh to add loop cut to
 * @param edgeId - ID of an edge in the loop to cut along
 * @param position - Position along the edge (0-1) where to place the cut
 * @returns Object containing new vertex IDs and edge IDs
 */
export function loopCut(
  mesh: EditableMesh,
  edgeId: number,
  position: number = 0.5
): { newVertices: number[]; newEdges: number[] } {
  const edge = mesh.edges.find((e) => e.id === edgeId);
  if (!edge) {
    return { newVertices: [], newEdges: [] };
  }

  const builder = new PrimitiveBuilder(mesh);
  const newVertexIds: number[] = [];
  const newEdgeIds: number[] = [];

  // Get the vertices of the edge
  const v1 = mesh.vertices.find((v) => v.id === edge.vertexIds[0]);
  const v2 = mesh.vertices.find((v) => v.id === edge.vertexIds[1]);

  if (!v1 || !v2) {
    return { newVertices: [], newEdges: [] };
  }

  // Find all edges in the loop
  const loopEdges = findEdgeLoop(mesh, edgeId);

  // Create new vertices along each edge in the loop
  const newVerticesMap = new Map<number, number>(); // original vertex ID -> new vertex ID

  for (const loopEdgeId of loopEdges) {
    const loopEdge = mesh.edges.find((e) => e.id === loopEdgeId);
    if (!loopEdge) continue;

    // Get the vertices of the loop edge
    const lv1 = mesh.vertices.find((v) => v.id === loopEdge.vertexIds[0]);
    const lv2 = mesh.vertices.find((v) => v.id === loopEdge.vertexIds[1]);

    if (!lv1 || !lv2) continue;

    // Calculate new vertex position
    const newPosition = {
      x: lv1.position.x + (lv2.position.x - lv1.position.x) * position,
      y: lv1.position.y + (lv2.position.y - lv1.position.y) * position,
      z: lv1.position.z + (lv2.position.z - lv1.position.z) * position,
    };

    // Add new vertex
    const newVertexId = builder.addVertex(newPosition, `loopcut-${loopEdgeId}`);
    newVertexIds.push(newVertexId);

    // Map original vertices to new vertices
    newVerticesMap.set(lv1.id, newVertexId);
    newVerticesMap.set(lv2.id, newVertexId);
  }

  // Create new edges connecting the new vertices
  // This is a simplified implementation
  for (let i = 0; i < newVertexIds.length - 1; i++) {
    const v1 = newVertexIds[i];
    const v2 = newVertexIds[i + 1];

    // Ensure both vertices are valid numbers
    if (typeof v1 === 'number' && typeof v2 === 'number') {
      const newEdgeId = builder.addEdge(v1, v2);
      newEdgeIds.push(newEdgeId);
    }
  }

  // Connect the last vertex to the first to close the loop if needed
  if (newVertexIds.length > 2) {
    const v1 = newVertexIds[newVertexIds.length - 1];
    const v2 = newVertexIds[0];

    // Ensure both vertices are valid numbers
    if (typeof v1 === 'number' && typeof v2 === 'number') {
      const newEdgeId = builder.addEdge(v1, v2);
      newEdgeIds.push(newEdgeId);
    }
  }

  return { newVertices: newVertexIds, newEdges: newEdgeIds };
}

/**
 * Finds all edges in a loop that contains the given edge
 *
 * @param mesh - The mesh to search in
 * @param edgeId - ID of the starting edge
 * @returns Array of edge IDs in the loop
 */
function findEdgeLoop(_mesh: EditableMesh, edgeId: number): number[] {
  const loopEdges: number[] = [edgeId];

  // This is a simplified implementation
  // In a real implementation, this would traverse the mesh to find the full loop

  // Find connected edges that form a loop
  // For now, we'll just return the single edge as a placeholder
  return loopEdges;
}
