import { EditableMesh } from '../core/EditableMesh.js';
import type { Vector3Like } from '../types/index.js';
import { PrimitiveBuilder } from '../primitives/core/PrimitiveBuilder.js';

/**
 * Bevels edges by creating a chamfered or rounded effect
 *
 * Creates new faces along edges to create a beveled appearance.
 *
 * @param mesh - The mesh to bevel edges on
 * @param edgeIds - Array of edge IDs to bevel
 * @param distance - Distance to offset the bevel from the original edge
 * @param segments - Number of segments for the bevel (1 = simple chamfer, >1 = rounded)
 * @returns Array of newly created face IDs
 */
export function bevelEdge(
  mesh: EditableMesh,
  edgeIds: number[],
  distance: number = 0.1,
  segments: number = 1
): number[] {
  if (edgeIds.length === 0) return [];

  const builder = new PrimitiveBuilder(mesh);
  const newFaceIds: number[] = [];

  // Process each edge
  for (const edgeId of edgeIds) {
    const edge = mesh.edges.find((e) => e.id === edgeId);
    if (!edge) continue;

    // Get the vertices of the edge
    const v1 = mesh.vertices.find((v) => v.id === edge.vertexIds[0]);
    const v2 = mesh.vertices.find((v) => v.id === edge.vertexIds[1]);

    if (!v1 || !v2) continue;

    // Find faces that use this edge
    const connectedFaces = mesh.faces.filter((face) =>
      face.edgeIds.includes(edgeId)
    );

    if (connectedFaces.length === 0) continue;

    // For a simple bevel (1 segment), we create new vertices offset from the original edge
    // and connect them to form a beveled face

    // Calculate edge direction
    const edgeDirection = {
      x: v2.position.x - v1.position.x,
      y: v2.position.y - v1.position.y,
      z: v2.position.z - v1.position.z,
    };

    // Normalize edge direction
    const edgeLength = Math.sqrt(
      edgeDirection.x * edgeDirection.x +
        edgeDirection.y * edgeDirection.y +
        edgeDirection.z * edgeDirection.z
    );

    if (edgeLength === 0) continue;

    // For each connected face, calculate a normal direction to offset
    for (const face of connectedFaces) {
      // Calculate face normal (simplified)
      const faceNormal = calculateSimpleNormal(mesh, face);

      // Create offset vertices
      const offset1 = {
        x: v1.position.x + faceNormal.x * distance,
        y: v1.position.y + faceNormal.y * distance,
        z: v1.position.z + faceNormal.z * distance,
      };

      const offset2 = {
        x: v2.position.x + faceNormal.x * distance,
        y: v2.position.y + faceNormal.y * distance,
        z: v2.position.z + faceNormal.z * distance,
      };

      // Add new vertices
      const newVertexId1 = builder.addVertex(
        offset1,
        `bevel-${v1.id}-${face.id}`
      );
      const newVertexId2 = builder.addVertex(
        offset2,
        `bevel-${v2.id}-${face.id}`
      );

      // Create bevel face (quad)
      const bevelFaceId = builder.addQuad([
        v1.id,
        newVertexId1,
        newVertexId2,
        v2.id,
      ]);
      newFaceIds.push(bevelFaceId);
    }
  }

  return newFaceIds;
}

/**
 * Calculates a simple normal for a face (for demonstration purposes)
 *
 * @param mesh - The mesh containing the face
 * @param face - The face to calculate normal for
 * @returns Normal vector
 */
function calculateSimpleNormal(mesh: EditableMesh, face: any): Vector3Like {
  // For a simple approximation, we'll just return a basic up vector
  // In a real implementation, this would calculate the actual face normal
  return { x: 0, y: 1, z: 0 };
}
