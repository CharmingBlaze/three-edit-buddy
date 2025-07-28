import { EditableMesh } from '../core/EditableMesh.js';
import { PrimitiveBuilder } from '../primitives/core/PrimitiveBuilder.js';

/**
 * Subdivides an edge by adding a new vertex at its midpoint
 *
 * Splits the edge into two edges and updates all faces that use this edge.
 *
 * @param mesh - The mesh containing the edge
 * @param edgeId - ID of the edge to subdivide
 * @returns ID of the newly created vertex
 */
export function subdivideEdge(mesh: EditableMesh, edgeId: number): number {
  const edge = mesh.edges.find((e) => e.id === edgeId);
  if (!edge) {
    throw new Error(`Edge with ID ${edgeId} not found`);
  }

  const builder = new PrimitiveBuilder(mesh);

  // Get the vertices of the edge
  const v1 = mesh.vertices.find((v) => v.id === edge.vertexIds[0]);
  const v2 = mesh.vertices.find((v) => v.id === edge.vertexIds[1]);

  if (!v1 || !v2) {
    throw new Error(`Edge vertices not found`);
  }

  // Calculate midpoint
  const midpoint = {
    x: (v1.position.x + v2.position.x) / 2,
    y: (v1.position.y + v2.position.y) / 2,
    z: (v1.position.z + v2.position.z) / 2,
  };

  // Create new vertex at midpoint
  const newVertexId = builder.addVertex(midpoint, `subdivided-${edgeId}`);

  // Find all faces that use this edge
  const affectedFaces = mesh.faces.filter((face) =>
    face.edgeIds.includes(edgeId)
  );

  // Update each affected face
  for (const face of affectedFaces) {
    updateFaceForEdgeSubdivision(mesh, builder, face, edgeId, newVertexId);
  }

  return newVertexId;
}

/**
 * Updates a face when one of its edges is subdivided
 */
function updateFaceForEdgeSubdivision(
  mesh: EditableMesh,
  builder: PrimitiveBuilder,
  face: any,
  edgeId: number,
  newVertexId: number
): void {
  const edge = mesh.edges.find((e) => e.id === edgeId);
  if (!edge) return;

  const [v1Id, v2Id] = edge.vertexIds;

  // Find the position of the edge vertices in the face
  const v1Index = face.vertexIds.indexOf(v1Id);
  const v2Index = face.vertexIds.indexOf(v2Id);

  if (v1Index === -1 || v2Index === -1) return;

  // Create new vertex array with the subdivided vertex inserted
  const newVertexIds = [...face.vertexIds];

  // Insert the new vertex between the edge vertices
  // We need to handle the case where the vertices might not be adjacent
  // For simplicity, we'll insert after the first vertex
  const insertIndex = Math.min(v1Index, v2Index) + 1;
  newVertexIds.splice(insertIndex, 0, newVertexId);

  // Remove the old face
  const faceIndex = mesh.faces.findIndex((f) => f.id === face.id);
  if (faceIndex !== -1) {
    mesh.faces.splice(faceIndex, 1);
  }

  // Create new face(s) based on the number of vertices
  if (newVertexIds.length === 4) {
    builder.addQuad(
      [newVertexIds[0]!, newVertexIds[1]!, newVertexIds[2]!, newVertexIds[3]!],
      `subdivided-face-${face.id}`
    );
  } else if (newVertexIds.length === 3) {
    builder.addTriangle(
      [newVertexIds[0]!, newVertexIds[1]!, newVertexIds[2]!],
      `subdivided-face-${face.id}`
    );
  } else {
    // N-gon: split into triangles or quads
    splitNGonIntoFaces(mesh, builder, newVertexIds, face.id);
  }
}

/**
 * Splits an n-gon into triangles or quads when an edge is subdivided
 */
function splitNGonIntoFaces(
  _mesh: EditableMesh,
  builder: PrimitiveBuilder,
  vertexIds: number[],
  originalFaceId: number
): void {
  const vertexCount = vertexIds.length;

  if (vertexCount < 3) return;

  // For simplicity, we'll create a triangle fan
  // A more sophisticated approach would try to create quads where possible
  for (let i = 1; i < vertexCount - 1; i++) {
    const triangle: [number, number, number] = [
      vertexIds[0]!,
      vertexIds[i]!,
      vertexIds[i + 1]!,
    ];

    builder.addTriangle(triangle, `subdivided-face-${originalFaceId}-${i}`);
  }
}

/**
 * Subdivides multiple edges at once
 *
 * @param mesh - The mesh containing the edges
 * @param edgeIds - Array of edge IDs to subdivide
 * @returns Array of newly created vertex IDs
 */
export function subdivideEdges(
  mesh: EditableMesh,
  edgeIds: number[]
): number[] {
  const newVertexIds: number[] = [];

  for (const edgeId of edgeIds) {
    try {
      const newVertexId = subdivideEdge(mesh, edgeId);
      newVertexIds.push(newVertexId);
    } catch (error) {
      console.warn(`Failed to subdivide edge ${edgeId}:`, error);
    }
  }

  return newVertexIds;
}
