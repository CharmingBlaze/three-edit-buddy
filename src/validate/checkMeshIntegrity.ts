import type { EditableMesh, ValidationResult } from '../types/index.js';
import {
  getConnectedFaces,
  getConnectedEdges,
  isBoundaryEdge,
  isBoundaryVertex,
} from '../utils/topology.js';

/**
 * Validates mesh topology and integrity
 */
export function validateMeshTopology(mesh: EditableMesh): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for orphaned vertices
  for (const vertex of mesh.vertices) {
    if (vertex.connectedEdges.length === 0) {
      errors.push(`Orphaned vertex ${vertex.id} has no connected edges`);
    }
  }

  // Check for orphaned edges
  for (const edge of mesh.edges) {
    if (edge.connectedFaces.length === 0) {
      errors.push(`Orphaned edge ${edge.id} has no connected faces`);
    }
  }

  // Check for invalid vertex references in edges
  for (const edge of mesh.edges) {
    const v1 = mesh.getVertex(edge.vertexIds[0]);
    const v2 = mesh.getVertex(edge.vertexIds[1]);

    if (!v1) {
      errors.push(
        `Edge ${edge.id} references non-existent vertex ${edge.vertexIds[0]}`
      );
    }
    if (!v2) {
      errors.push(
        `Edge ${edge.id} references non-existent vertex ${edge.vertexIds[1]}`
      );
    }
  }

  // Check for invalid edge references in faces
  for (const face of mesh.faces) {
    for (const edgeId of face.edgeIds) {
      const edge = mesh.getEdge(edgeId);
      if (!edge) {
        errors.push(`Face ${face.id} references non-existent edge ${edgeId}`);
      }
    }
  }

  // Check for invalid vertex references in faces
  for (const face of mesh.faces) {
    for (const vertexId of face.vertexIds) {
      const vertex = mesh.getVertex(vertexId);
      if (!vertex) {
        errors.push(
          `Face ${face.id} references non-existent vertex ${vertexId}`
        );
      }
    }
  }

  // Check for degenerate faces (less than 3 vertices)
  for (const face of mesh.faces) {
    if (face.vertexIds.length < 3) {
      errors.push(
        `Face ${face.id} has less than 3 vertices (${face.vertexIds.length})`
      );
    }
  }

  // Check for non-manifold edges
  for (const edge of mesh.edges) {
    if (edge.connectedFaces.length > 2) {
      errors.push(
        `Non-manifold edge ${edge.id} is connected to ${edge.connectedFaces.length} faces`
      );
    }
  }

  // Check for inconsistent topology
  for (const vertex of mesh.vertices) {
    const connectedFaces = getConnectedFaces(mesh, vertex.id);
    const connectedEdges = getConnectedEdges(mesh, vertex.id);

    if (connectedFaces.length === 0 && connectedEdges.length > 0) {
      warnings.push(`Vertex ${vertex.id} has edges but no faces`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Checks for non-manifold topology issues
 */
export function checkNonManifold(mesh: EditableMesh): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for edges with more than 2 connected faces
  for (const edge of mesh.edges) {
    if (edge.connectedFaces.length > 2) {
      errors.push(
        `Non-manifold edge ${edge.id} is connected to ${edge.connectedFaces.length} faces`
      );
    }
  }

  // Check for vertices with inconsistent topology
  for (const vertex of mesh.vertices) {
    const connectedFaces = getConnectedFaces(mesh, vertex.id);
    const connectedEdges = getConnectedEdges(mesh, vertex.id);

    // Check for vertices that are not part of a proper manifold
    if (
      connectedFaces.length > 0 &&
      connectedEdges.length !== connectedFaces.length
    ) {
      warnings.push(
        `Vertex ${vertex.id} has inconsistent topology (${connectedEdges.length} edges, ${connectedFaces.length} faces)`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Checks face winding consistency
 */
export function checkFaceWinding(mesh: EditableMesh): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // This is a basic check - in a full implementation, you'd want to check
  // that adjacent faces have consistent winding order

  for (const face of mesh.faces) {
    if (face.vertexIds.length < 3) {
      errors.push(`Face ${face.id} has invalid winding (less than 3 vertices)`);
      continue;
    }

    // Check for duplicate vertices in face
    const uniqueVertices = new Set(face.vertexIds);
    if (uniqueVertices.size !== face.vertexIds.length) {
      errors.push(`Face ${face.id} has duplicate vertices`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Checks for boundary issues
 */
export function checkBoundary(mesh: EditableMesh): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const boundaryEdges = mesh.edges.filter((edge) =>
    isBoundaryEdge(mesh, edge.id)
  );
  const boundaryVertices = mesh.vertices.filter((vertex) =>
    isBoundaryVertex(mesh, vertex.id)
  );

  // Check for open boundaries (this might be intentional)
  if (boundaryEdges.length > 0) {
    warnings.push(`Mesh has ${boundaryEdges.length} boundary edges`);
  }

  // Check for vertices that are only connected to boundary edges
  for (const vertex of boundaryVertices) {
    const connectedEdges = getConnectedEdges(mesh, vertex.id);
    const allBoundary = connectedEdges.every((edge) =>
      isBoundaryEdge(mesh, edge.id)
    );

    if (allBoundary) {
      warnings.push(`Vertex ${vertex.id} is only connected to boundary edges`);
    }
  }

  return {
    isValid: true, // Boundaries are not necessarily errors
    errors,
    warnings,
  };
}

/**
 * Comprehensive mesh validation
 */
export function validateMesh(mesh: EditableMesh): ValidationResult {
  const topologyResult = validateMeshTopology(mesh);
  const nonManifoldResult = checkNonManifold(mesh);
  const windingResult = checkFaceWinding(mesh);
  const boundaryResult = checkBoundary(mesh);

  const allErrors = [
    ...topologyResult.errors,
    ...nonManifoldResult.errors,
    ...windingResult.errors,
    ...boundaryResult.errors,
  ];

  const allWarnings = [
    ...topologyResult.warnings,
    ...nonManifoldResult.warnings,
    ...windingResult.warnings,
    ...boundaryResult.warnings,
  ];

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}
