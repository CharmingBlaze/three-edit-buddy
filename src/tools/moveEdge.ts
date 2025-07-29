import { EditableMesh } from '../core/EditableMesh.js';
import type { Vector3Like } from '../types/index.js';

/**
 * Options for edge movement operations
 */
export interface MoveEdgeOptions {
  /** Whether to maintain edge length during movement (default: false) */
  maintainLength?: boolean;
  /** Whether to update connected faces (default: true) */
  updateFaces?: boolean;
  /** Whether to update connected edges (default: true) */
  updateEdges?: boolean;
  /** Maximum distance to move the edge (default: Infinity) */
  maxDistance?: number;
}

/**
 * Moves an edge by translating its vertices
 * 
 * @param mesh - The mesh containing the edge
 * @param edgeId - ID of the edge to move
 * @param translation - Translation vector to apply to the edge
 * @param options - Movement options
 * @returns Object containing information about the movement
 */
export function moveEdge(
  mesh: EditableMesh,
  edgeId: number,
  translation: Vector3Like,
  options: MoveEdgeOptions = {}
): {
  moved: boolean;
  edgeId: number;
  vertexIds: number[];
  oldPositions: Vector3Like[];
  newPositions: Vector3Like[];
} {
  const {
    maintainLength = false,
    updateFaces = true,
    updateEdges = true,
    maxDistance = Infinity,
  } = options;

  const edge = mesh.getEdge(edgeId);
  if (!edge) {
    return {
      moved: false,
      edgeId,
      vertexIds: [],
      oldPositions: [],
      newPositions: [],
    };
  }

  // Get the vertices of the edge
  const vertex1 = mesh.getVertex(edge.vertexIds[0]);
  const vertex2 = mesh.getVertex(edge.vertexIds[1]);

  if (!vertex1 || !vertex2) {
    return {
      moved: false,
      edgeId,
      vertexIds: [],
      oldPositions: [],
      newPositions: [],
    };
  }

  // Store old positions
  const oldPositions: Vector3Like[] = [
    { ...vertex1.position },
    { ...vertex2.position },
  ];

  // Calculate new positions
  let newPositions: Vector3Like[] = [
    {
      x: vertex1.position.x + translation.x,
      y: vertex1.position.y + translation.y,
      z: vertex1.position.z + translation.z,
    },
    {
      x: vertex2.position.x + translation.x,
      y: vertex2.position.y + translation.y,
      z: vertex2.position.z + translation.z,
    },
  ];

  // Apply distance constraint
  const distance = Math.sqrt(
    translation.x * translation.x +
    translation.y * translation.y +
    translation.z * translation.z
  );

  if (distance > maxDistance) {
    const scale = maxDistance / distance;
    newPositions = [
      {
        x: vertex1.position.x + translation.x * scale,
        y: vertex1.position.y + translation.y * scale,
        z: vertex1.position.z + translation.z * scale,
      },
      {
        x: vertex2.position.x + translation.x * scale,
        y: vertex2.position.y + translation.y * scale,
        z: vertex2.position.z + translation.z * scale,
      },
    ];
  }

  // Maintain edge length if requested
  if (maintainLength) {
    const originalLength = Math.sqrt(
      Math.pow(vertex2.position.x - vertex1.position.x, 2) +
      Math.pow(vertex2.position.y - vertex1.position.y, 2) +
      Math.pow(vertex2.position.z - vertex1.position.z, 2)
    );

    const newLength = Math.sqrt(
      Math.pow(newPositions[1].x - newPositions[0].x, 2) +
      Math.pow(newPositions[1].y - newPositions[0].y, 2) +
      Math.pow(newPositions[1].z - newPositions[0].z, 2)
    );

    if (newLength > 0) {
      const scale = originalLength / newLength;
      const midPoint = {
        x: (newPositions[0].x + newPositions[1].x) / 2,
        y: (newPositions[0].y + newPositions[1].y) / 2,
        z: (newPositions[0].z + newPositions[1].z) / 2,
      };

      const halfVector = {
        x: (newPositions[1].x - newPositions[0].x) * scale / 2,
        y: (newPositions[1].y - newPositions[0].y) * scale / 2,
        z: (newPositions[1].z - newPositions[0].z) * scale / 2,
      };

      newPositions = [
        {
          x: midPoint.x - halfVector.x,
          y: midPoint.y - halfVector.y,
          z: midPoint.z - halfVector.z,
        },
        {
          x: midPoint.x + halfVector.x,
          y: midPoint.y + halfVector.y,
          z: midPoint.z + halfVector.z,
        },
      ];
    }
  }

  // Move the vertices
  mesh.moveVertex(edge.vertexIds[0], newPositions[0]);
  mesh.moveVertex(edge.vertexIds[1], newPositions[1]);

  return {
    moved: true,
    edgeId,
    vertexIds: [edge.vertexIds[0], edge.vertexIds[1]],
    oldPositions,
    newPositions,
  };
}

/**
 * Moves multiple edges simultaneously
 * 
 * @param mesh - The mesh containing the edges
 * @param edgeIds - Array of edge IDs to move
 * @param translation - Translation vector to apply to all edges
 * @param options - Movement options
 * @returns Array of movement results
 */
export function moveEdges(
  mesh: EditableMesh,
  edgeIds: number[],
  translation: Vector3Like,
  options: MoveEdgeOptions = {}
): Array<{
  moved: boolean;
  edgeId: number;
  vertexIds: number[];
  oldPositions: Vector3Like[];
  newPositions: Vector3Like[];
}> {
  return edgeIds.map((edgeId) =>
    moveEdge(mesh, edgeId, translation, options)
  );
}

/**
 * Finds the closest point on an edge to a given world point
 * 
 * @param mesh - The mesh containing the edge
 * @param edgeId - ID of the edge
 * @param worldPoint - The world point to find the closest point to
 * @returns The closest point on the edge and the parameter t (0-1)
 */
export function findClosestPointOnEdge(
  mesh: EditableMesh,
  edgeId: number,
  worldPoint: Vector3Like
): { point: Vector3Like; t: number } | null {
  const edge = mesh.getEdge(edgeId);
  if (!edge) return null;

  const vertex1 = mesh.getVertex(edge.vertexIds[0]);
  const vertex2 = mesh.getVertex(edge.vertexIds[1]);

  if (!vertex1 || !vertex2) return null;

  // Calculate edge direction
  const edgeVector = {
    x: vertex2.position.x - vertex1.position.x,
    y: vertex2.position.y - vertex1.position.y,
    z: vertex2.position.z - vertex1.position.z,
  };

  // Calculate vector from vertex1 to worldPoint
  const toPointVector = {
    x: worldPoint.x - vertex1.position.x,
    y: worldPoint.y - vertex1.position.y,
    z: worldPoint.z - vertex1.position.z,
  };

  // Calculate parameter t
  const edgeLengthSquared =
    edgeVector.x * edgeVector.x +
    edgeVector.y * edgeVector.y +
    edgeVector.z * edgeVector.z;

  if (edgeLengthSquared === 0) return null;

  const t = Math.max(
    0,
    Math.min(
      1,
      (toPointVector.x * edgeVector.x +
        toPointVector.y * edgeVector.y +
        toPointVector.z * edgeVector.z) /
        edgeLengthSquared
    )
  );

  // Calculate closest point
  const point = {
    x: vertex1.position.x + edgeVector.x * t,
    y: vertex1.position.y + edgeVector.y * t,
    z: vertex1.position.z + edgeVector.z * t,
  };

  return { point, t };
}