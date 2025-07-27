import type { EditableMesh, Face, Edge, Vertex } from '../types/index.js';
import { isValidFace } from '../utils/faceTypes.js';

/**
 * Validation result containing topology issues found in the mesh
 */
export interface TopologyValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  nonManifoldEdges: number[];
  degenerateFaces: number[];
  orphanedVertices: number[];
  orphanedEdges: number[];
}

/**
 * Validates the topology of a mesh
 *
 * Checks for common topology issues like non-manifold edges,
 * degenerate faces, orphaned vertices, etc.
 *
 * @param mesh - The mesh to validate
 * @returns Validation result with details about any issues found
 */
export function validateMeshTopology(
  mesh: EditableMesh
): TopologyValidationResult {
  const result: TopologyValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    nonManifoldEdges: [],
    degenerateFaces: [],
    orphanedVertices: [],
    orphanedEdges: [],
  };

  // Check for orphaned vertices
  const orphanedVertices = findOrphanedVertices(mesh);
  if (orphanedVertices.length > 0) {
    result.orphanedVertices = orphanedVertices;
    result.warnings.push(`Found ${orphanedVertices.length} orphaned vertices`);
  }

  // Check for orphaned edges
  const orphanedEdges = findOrphanedEdges(mesh);
  if (orphanedEdges.length > 0) {
    result.orphanedEdges = orphanedEdges;
    result.warnings.push(`Found ${orphanedEdges.length} orphaned edges`);
  }

  // Check for degenerate faces
  const degenerateFaces = findDegenerateFaces(mesh);
  if (degenerateFaces.length > 0) {
    result.degenerateFaces = degenerateFaces;
    result.errors.push(`Found ${degenerateFaces.length} degenerate faces`);
    result.isValid = false;
  }

  // Check for non-manifold edges
  const nonManifoldEdges = findNonManifoldEdges(mesh);
  if (nonManifoldEdges.length > 0) {
    result.nonManifoldEdges = nonManifoldEdges;
    result.warnings.push(`Found ${nonManifoldEdges.length} non-manifold edges`);
  }

  // Check for invalid faces
  const invalidFaces = findInvalidFaces(mesh);
  if (invalidFaces.length > 0) {
    result.errors.push(
      `Found ${invalidFaces.length} invalid faces (less than 3 vertices)`
    );
    result.isValid = false;
  }

  return result;
}

/**
 * Finds vertices that are not used by any faces
 */
function findOrphanedVertices(mesh: EditableMesh): number[] {
  const usedVertices = new Set<number>();

  for (const face of mesh.faces) {
    for (const vertexId of face.vertexIds) {
      usedVertices.add(vertexId);
    }
  }

  return mesh.vertices
    .filter((vertex) => !usedVertices.has(vertex.id))
    .map((vertex) => vertex.id);
}

/**
 * Finds edges that are not used by any faces
 */
function findOrphanedEdges(mesh: EditableMesh): number[] {
  const usedEdges = new Set<number>();

  for (const face of mesh.faces) {
    for (const edgeId of face.edgeIds) {
      usedEdges.add(edgeId);
    }
  }

  return mesh.edges
    .filter((edge) => !usedEdges.has(edge.id))
    .map((edge) => edge.id);
}

/**
 * Finds faces that are degenerate (zero area)
 */
function findDegenerateFaces(mesh: EditableMesh): number[] {
  const degenerateFaces: number[] = [];

  for (const face of mesh.faces) {
    const vertices = face.vertexIds
      .map((id) => mesh.vertices.find((v) => v.id === id))
      .filter(Boolean);

    if (vertices.length < 3) continue;

    // For triangles, check if vertices are collinear
    if (vertices.length === 3) {
      const v0 = vertices[0]!.position;
      const v1 = vertices[1]!.position;
      const v2 = vertices[2]!.position;

      const edge1 = {
        x: v1.x - v0.x,
        y: v1.y - v0.y,
        z: v1.z - v0.z,
      };

      const edge2 = {
        x: v2.x - v0.x,
        y: v2.y - v0.y,
        z: v2.z - v0.z,
      };

      const crossProduct = {
        x: edge1.y * edge2.z - edge1.z * edge2.y,
        y: edge1.z * edge2.x - edge1.x * edge2.z,
        z: edge1.x * edge2.y - edge1.y * edge2.x,
      };

      const area =
        Math.sqrt(
          crossProduct.x * crossProduct.x +
            crossProduct.y * crossProduct.y +
            crossProduct.z * crossProduct.z
        ) / 2;

      if (area < 0.000001) {
        // Very small threshold for numerical precision
        degenerateFaces.push(face.id);
      }
    }
    // For quads and n-gons, check if any three consecutive vertices are collinear
    else {
      for (let i = 0; i < vertices.length; i++) {
        const v0 = vertices[i]!.position;
        const v1 = vertices[(i + 1) % vertices.length]!.position;
        const v2 = vertices[(i + 2) % vertices.length]!.position;

        const edge1 = {
          x: v1.x - v0.x,
          y: v1.y - v0.y,
          z: v1.z - v0.z,
        };

        const edge2 = {
          x: v2.x - v0.x,
          y: v2.y - v0.y,
          z: v2.z - v0.z,
        };

        const crossProduct = {
          x: edge1.y * edge2.z - edge1.z * edge2.y,
          y: edge1.z * edge2.x - edge1.x * edge2.z,
          z: edge1.x * edge2.y - edge1.y * edge2.x,
        };

        const area =
          Math.sqrt(
            crossProduct.x * crossProduct.x +
              crossProduct.y * crossProduct.y +
              crossProduct.z * crossProduct.z
          ) / 2;

        if (area < 0.000001) {
          // Very small threshold for numerical precision
          degenerateFaces.push(face.id);
          break; // Found one degenerate triangle, no need to check more
        }
      }
    }
  }

  return degenerateFaces;
}

/**
 * Finds edges that are used by more than 2 faces (non-manifold)
 */
function findNonManifoldEdges(mesh: EditableMesh): number[] {
  const edgeUsage = new Map<number, number>();

  for (const face of mesh.faces) {
    for (const edgeId of face.edgeIds) {
      edgeUsage.set(edgeId, (edgeUsage.get(edgeId) || 0) + 1);
    }
  }

  return Array.from(edgeUsage.entries())
    .filter(([_, count]) => count > 2)
    .map(([edgeId, _]) => edgeId);
}

/**
 * Finds faces with invalid vertex counts
 */
function findInvalidFaces(mesh: EditableMesh): number[] {
  return mesh.faces.filter((face) => !isValidFace(face)).map((face) => face.id);
}

/**
 * Checks if a mesh is watertight (closed manifold)
 *
 * @param mesh - The mesh to check
 * @returns True if the mesh is watertight
 */
export function isWatertight(mesh: EditableMesh): boolean {
  const result = validateMeshTopology(mesh);

  // Check for boundary edges (edges used by only one face)
  const edgeUsage = new Map<number, number>();

  for (const face of mesh.faces) {
    for (const edgeId of face.edgeIds) {
      edgeUsage.set(edgeId, (edgeUsage.get(edgeId) || 0) + 1);
    }
  }

  const boundaryEdges = Array.from(edgeUsage.entries()).filter(
    ([_, count]) => count === 1
  ).length;

  return result.isValid && boundaryEdges === 0;
}

/**
 * Gets mesh statistics
 *
 * @param mesh - The mesh to analyze
 * @returns Object containing various mesh statistics
 */
export function getMeshStats(mesh: EditableMesh): {
  vertexCount: number;
  edgeCount: number;
  faceCount: number;
  triangleCount: number;
  quadCount: number;
  ngonCount: number;
  materialCount: number;
  uvCount: number;
} {
  const triangleCount = mesh.faces.filter(
    (face) => face.vertexIds.length === 3
  ).length;
  const quadCount = mesh.faces.filter(
    (face) => face.vertexIds.length === 4
  ).length;
  const ngonCount = mesh.faces.filter(
    (face) => face.vertexIds.length > 4
  ).length;

  return {
    vertexCount: mesh.vertices.length,
    edgeCount: mesh.edges.length,
    faceCount: mesh.faces.length,
    triangleCount,
    quadCount,
    ngonCount,
    materialCount: mesh.materials.length,
    uvCount: mesh.uvs.length,
  };
}
