import { EditableMesh } from '../core/EditableMesh.js';
import { PrimitiveBuilder } from '../primitives/core/PrimitiveBuilder.js';

/**
 * Bridges two edge loops by creating faces between them
 *
 * Creates a surface between two edge loops, useful for connecting separate mesh parts.
 *
 * @param mesh - The mesh to bridge edges on
 * @param edgeLoop1 - Array of edge IDs forming the first loop
 * @param edgeLoop2 - Array of edge IDs forming the second loop
 * @returns Object containing new face IDs
 */
export function bridgeEdges(
  mesh: EditableMesh,
  edgeLoop1: number[],
  edgeLoop2: number[]
): { newFaces: number[] } {
  if (edgeLoop1.length === 0 || edgeLoop2.length === 0) {
    return { newFaces: [] };
  }

  const builder = new PrimitiveBuilder(mesh);
  const newFaceIds: number[] = [];

  // Get vertices for each edge loop
  const vertices1 = getVerticesFromEdgeLoop(mesh, edgeLoop1);
  const vertices2 = getVerticesFromEdgeLoop(mesh, edgeLoop2);

  if (vertices1.length === 0 || vertices2.length === 0) {
    return { newFaces: [] };
  }

  // Create bridge faces
  // This implementation assumes the loops have the same number of vertices
  const minVertices = Math.min(vertices1.length, vertices2.length);

  for (let i = 0; i < minVertices; i++) {
    const nextI = (i + 1) % minVertices;

    // Create quad face between the loops
    // Ensure we have valid vertex IDs
    if (
      i < vertices1.length &&
      nextI < vertices1.length &&
      i < vertices2.length &&
      nextI < vertices2.length
    ) {
      const v1 = vertices1[i];
      const v2 = vertices1[nextI];
      const v3 = vertices2[nextI];
      const v4 = vertices2[i];

      // Ensure all vertices are valid numbers
      if (
        typeof v1 === 'number' &&
        typeof v2 === 'number' &&
        typeof v3 === 'number' &&
        typeof v4 === 'number'
      ) {
        const faceId = builder.addQuad([v1, v2, v3, v4]);
        newFaceIds.push(faceId);
      }
    }
  }

  return { newFaces: newFaceIds };
}

/**
 * Gets vertex IDs from an edge loop
 *
 * @param mesh - The mesh containing the edges
 * @param edgeLoop - Array of edge IDs
 * @returns Array of vertex IDs
 */
function getVerticesFromEdgeLoop(
  mesh: EditableMesh,
  edgeLoop: number[]
): number[] {
  if (edgeLoop.length === 0) return [];

  const vertexIds: number[] = [];

  // This is a simplified implementation
  // In a real implementation, this would properly traverse the edge loop
  // to get the ordered vertex IDs

  for (const edgeId of edgeLoop) {
    const edge = mesh.edges.find((e) => e.id === edgeId);
    if (edge) {
      // Add both vertices of the edge
      for (const vertexId of edge.vertexIds) {
        if (!vertexIds.includes(vertexId)) {
          vertexIds.push(vertexId);
        }
      }
    }
  }

  return vertexIds;
}
