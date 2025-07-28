import { EditableMesh } from '../core/EditableMesh.js';
import type { Vector3Like } from '../types/index.js';
import { PrimitiveBuilder } from '../primitives/core/PrimitiveBuilder.js';

/**
 * Insets faces by creating smaller faces within the original faces
 *
 * Creates a border around the original face with a smaller inset face in the center.
 *
 * @param mesh - The mesh to inset faces on
 * @param faceIds - Array of face IDs to inset
 * @param distance - Distance to inset from the original face edges
 * @param thickness - Thickness of the border (0 = no border, just inset face)
 * @returns Object containing arrays of new face IDs
 */
export function insetFaces(
  mesh: EditableMesh,
  faceIds: number[],
  distance: number = 0.1,
  thickness: number = 0.1
): { insetFaces: number[]; borderFaces: number[] } {
  if (faceIds.length === 0) return { insetFaces: [], borderFaces: [] };

  const builder = new PrimitiveBuilder(mesh);
  const newInsetFaceIds: number[] = [];
  const newBorderFaceIds: number[] = [];

  // Process each face
  for (const faceId of faceIds) {
    const face = mesh.faces.find((f) => f.id === faceId);
    if (!face) continue;

    // Get the vertices of the face
    const vertices = face.vertexIds
      .map((vertexId) => mesh.vertices.find((v) => v.id === vertexId))
      .filter((v) => v !== undefined) as any[];

    if (vertices.length < 3) continue;

    // Calculate face normal
    const normal = calculateFaceNormal(mesh, face);

    // Calculate centroid of the face
    const centroid = calculateCentroid(vertices);

    // Create inset vertices
    const insetVertexIds: number[] = [];

    for (let i = 0; i < vertices.length; i++) {
      const vertex = vertices[i];

      // Calculate direction from centroid to vertex
      const direction = {
        x: vertex.position.x - centroid.x,
        y: vertex.position.y - centroid.y,
        z: vertex.position.z - centroid.z,
      };

      // Normalize direction
      const length = Math.sqrt(
        direction.x * direction.x +
          direction.y * direction.y +
          direction.z * direction.z
      );

      if (length > 0) {
        const normalizedDirection = {
          x: direction.x / length,
          y: direction.y / length,
          z: direction.z / length,
        };

        // Calculate inset position
        const insetPosition = {
          x: vertex.position.x - normalizedDirection.x * distance,
          y: vertex.position.y - normalizedDirection.y * distance,
          z: vertex.position.z - normalizedDirection.z * distance,
        };

        // Offset along normal for thickness
        if (thickness > 0) {
          insetPosition.x += normal.x * thickness;
          insetPosition.y += normal.y * thickness;
          insetPosition.z += normal.z * thickness;
        }

        // Add new inset vertex
        const insetVertexId = builder.addVertex(
          insetPosition,
          `inset-${vertex.id}-${faceId}`
        );
        insetVertexIds.push(insetVertexId);
      }
    }

    // Create inset face (only if we have enough vertices)
    if (insetVertexIds.length >= 3) {
      // For a quad inset face
      if (insetVertexIds.length === 4) {
        const v0 = insetVertexIds[0];
        const v1 = insetVertexIds[1];
        const v2 = insetVertexIds[2];
        const v3 = insetVertexIds[3];
        if (
          v0 !== undefined &&
          v1 !== undefined &&
          v2 !== undefined &&
          v3 !== undefined
        ) {
          const insetFaceId = builder.addQuad([v0, v1, v2, v3]);
          newInsetFaceIds.push(insetFaceId);
        }
      }
      // For a triangle inset face
      else if (insetVertexIds.length === 3) {
        const v0 = insetVertexIds[0];
        const v1 = insetVertexIds[1];
        const v2 = insetVertexIds[2];
        if (v0 !== undefined && v1 !== undefined && v2 !== undefined) {
          const insetFaceId = builder.addTriangle([v0, v1, v2]);
          newInsetFaceIds.push(insetFaceId);
        }
      }

      // Create border faces if thickness > 0
      if (thickness > 0 && vertices.length === insetVertexIds.length) {
        for (let i = 0; i < vertices.length; i++) {
          const nextI = (i + 1) % vertices.length;

          // Create quad border face
          const insetV1 = insetVertexIds[nextI];
          const insetV2 = insetVertexIds[i];
          if (insetV1 !== undefined && insetV2 !== undefined) {
            const borderFaceId = builder.addQuad([
              vertices[i].id,
              vertices[nextI].id,
              insetV1,
              insetV2,
            ]);
            newBorderFaceIds.push(borderFaceId);
          }
        }
      }
    }
  }

  return { insetFaces: newInsetFaceIds, borderFaces: newBorderFaceIds };
}

/**
 * Calculates the normal vector of a face
 *
 * @param mesh - The mesh containing the face
 * @param face - The face to calculate normal for
 * @returns Normal vector
 */
function calculateFaceNormal(_mesh: EditableMesh, _face: any): Vector3Like {
  // Simplified normal calculation
  // In a real implementation, this would properly calculate the face normal
  return { x: 0, y: 1, z: 0 };
}

/**
 * Calculates the centroid of a set of vertices
 *
 * @param vertices - Array of vertices
 * @returns Centroid position
 */
function calculateCentroid(vertices: any[]): Vector3Like {
  if (vertices.length === 0) {
    return { x: 0, y: 0, z: 0 };
  }

  let sumX = 0,
    sumY = 0,
    sumZ = 0;

  for (const vertex of vertices) {
    sumX += vertex.position.x;
    sumY += vertex.position.y;
    sumZ += vertex.position.z;
  }

  return {
    x: sumX / vertices.length,
    y: sumY / vertices.length,
    z: sumZ / vertices.length,
  };
}
