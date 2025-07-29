import { EditableMesh } from '../core/EditableMesh.js';
import type { Vector3Like } from '../types/index.js';

/**
 * Options for face movement operations
 */
export interface MoveFaceOptions {
  /** Whether to maintain face shape during movement (default: false) */
  maintainShape?: boolean;
  /** Whether to update connected faces (default: true) */
  updateConnected?: boolean;
  /** Whether to update face normals (default: true) */
  updateNormals?: boolean;
  /** Maximum distance to move the face (default: Infinity) */
  maxDistance?: number;
  /** Whether to move shared vertices (default: true) */
  moveSharedVertices?: boolean;
}

/**
 * Moves a face by translating all its vertices
 * 
 * @param mesh - The mesh containing the face
 * @param faceId - ID of the face to move
 * @param translation - Translation vector to apply to the face
 * @param options - Movement options
 * @returns Object containing information about the movement
 */
export function moveFace(
  mesh: EditableMesh,
  faceId: number,
  translation: Vector3Like,
  options: MoveFaceOptions = {}
): {
  moved: boolean;
  faceId: number;
  vertexIds: number[];
  oldPositions: Vector3Like[];
  newPositions: Vector3Like[];
} {
  const {
    maintainShape = false,
    updateConnected = true,
    updateNormals = true,
    maxDistance = Infinity,
    moveSharedVertices = true,
  } = options;

  const face = mesh.getFace(faceId);
  if (!face) {
    return {
      moved: false,
      faceId,
      vertexIds: [],
      oldPositions: [],
      newPositions: [],
    };
  }

  // Get all vertices of the face
  const vertices = face.vertexIds.map((vertexId) => mesh.getVertex(vertexId));
  const validVertices = vertices.filter((v) => v !== undefined);

  if (validVertices.length === 0) {
    return {
      moved: false,
      faceId,
      vertexIds: [],
      oldPositions: [],
      newPositions: [],
    };
  }

  // Store old positions
  const oldPositions: Vector3Like[] = validVertices.map((v) => ({ ...v!.position }));

  // Calculate new positions
  let newPositions: Vector3Like[] = validVertices.map((v) => ({
    x: v!.position.x + translation.x,
    y: v!.position.y + translation.y,
    z: v!.position.z + translation.z,
  }));

  // Apply distance constraint
  const distance = Math.sqrt(
    translation.x * translation.x +
    translation.y * translation.y +
    translation.z * translation.z
  );

  if (distance > maxDistance) {
    const scale = maxDistance / distance;
    newPositions = validVertices.map((v) => ({
      x: v!.position.x + translation.x * scale,
      y: v!.position.y + translation.y * scale,
      z: v!.position.z + translation.z * scale,
    }));
  }

  // Maintain face shape if requested
  if (maintainShape && validVertices.length >= 3) {
    // Calculate face center
    const center = {
      x: validVertices.reduce((sum, v) => sum + v!.position.x, 0) / validVertices.length,
      y: validVertices.reduce((sum, v) => sum + v!.position.y, 0) / validVertices.length,
      z: validVertices.reduce((sum, v) => sum + v!.position.z, 0) / validVertices.length,
    };

    // Calculate relative positions from center
    const relativePositions = validVertices.map((v) => ({
      x: v!.position.x - center.x,
      y: v!.position.y - center.y,
      z: v!.position.z - center.z,
    }));

    // Calculate new center
    const newCenter = {
      x: center.x + translation.x,
      y: center.y + translation.y,
      z: center.z + translation.z,
    };

    // Apply relative positions to new center
    newPositions = relativePositions.map((rel) => ({
      x: newCenter.x + rel.x,
      y: newCenter.y + rel.y,
      z: newCenter.z + rel.z,
    }));
  }

  // Move the vertices
  const vertexIds: number[] = [];
  for (let i = 0; i < validVertices.length; i++) {
    const vertexId = face.vertexIds[i];
    if (vertexId !== undefined) {
      mesh.moveVertex(vertexId, newPositions[i]);
      vertexIds.push(vertexId);
    }
  }

  return {
    moved: true,
    faceId,
    vertexIds,
    oldPositions,
    newPositions,
  };
}

/**
 * Moves multiple faces simultaneously
 * 
 * @param mesh - The mesh containing the faces
 * @param faceIds - Array of face IDs to move
 * @param translation - Translation vector to apply to all faces
 * @param options - Movement options
 * @returns Array of movement results
 */
export function moveFaces(
  mesh: EditableMesh,
  faceIds: number[],
  translation: Vector3Like,
  options: MoveFaceOptions = {}
): Array<{
  moved: boolean;
  faceId: number;
  vertexIds: number[];
  oldPositions: Vector3Like[];
  newPositions: Vector3Like[];
}> {
  return faceIds.map((faceId) =>
    moveFace(mesh, faceId, translation, options)
  );
}

/**
 * Calculates the center point of a face
 * 
 * @param mesh - The mesh containing the face
 * @param faceId - ID of the face
 * @returns The center point of the face
 */
export function getFaceCenter(
  mesh: EditableMesh,
  faceId: number
): Vector3Like | null {
  const face = mesh.getFace(faceId);
  if (!face) return null;

  const vertices = face.vertexIds.map((vertexId) => mesh.getVertex(vertexId));
  const validVertices = vertices.filter((v) => v !== undefined);

  if (validVertices.length === 0) return null;

  return {
    x: validVertices.reduce((sum, v) => sum + v!.position.x, 0) / validVertices.length,
    y: validVertices.reduce((sum, v) => sum + v!.position.y, 0) / validVertices.length,
    z: validVertices.reduce((sum, v) => sum + v!.position.z, 0) / validVertices.length,
  };
}

/**
 * Calculates the normal vector of a face
 * 
 * @param mesh - The mesh containing the face
 * @param faceId - ID of the face
 * @returns The normal vector of the face
 */
export function getFaceNormal(
  mesh: EditableMesh,
  faceId: number
): Vector3Like | null {
  const face = mesh.getFace(faceId);
  if (!face || face.vertexIds.length < 3) return null;

  const vertices = face.vertexIds.map((vertexId) => mesh.getVertex(vertexId));
  const validVertices = vertices.filter((v) => v !== undefined);

  if (validVertices.length < 3) return null;

  // Calculate normal using first three vertices
  const v1 = validVertices[0]!.position;
  const v2 = validVertices[1]!.position;
  const v3 = validVertices[2]!.position;

  const edge1 = {
    x: v2.x - v1.x,
    y: v2.y - v1.y,
    z: v2.z - v1.z,
  };

  const edge2 = {
    x: v3.x - v1.x,
    y: v3.y - v1.y,
    z: v3.z - v1.z,
  };

  // Cross product
  const normal = {
    x: edge1.y * edge2.z - edge1.z * edge2.y,
    y: edge1.z * edge2.x - edge1.x * edge2.z,
    z: edge1.x * edge2.y - edge1.y * edge2.x,
  };

  // Normalize
  const length = Math.sqrt(
    normal.x * normal.x + normal.y * normal.y + normal.z * normal.z
  );

  if (length === 0) return null;

  return {
    x: normal.x / length,
    y: normal.y / length,
    z: normal.z / length,
  };
}

/**
 * Moves a face along its normal direction
 * 
 * @param mesh - The mesh containing the face
 * @param faceId - ID of the face to move
 * @param distance - Distance to move along the normal
 * @param options - Movement options
 * @returns Object containing information about the movement
 */
export function moveFaceAlongNormal(
  mesh: EditableMesh,
  faceId: number,
  distance: number,
  options: MoveFaceOptions = {}
): {
  moved: boolean;
  faceId: number;
  vertexIds: number[];
  oldPositions: Vector3Like[];
  newPositions: Vector3Like[];
} {
  const normal = getFaceNormal(mesh, faceId);
  if (!normal) {
    return {
      moved: false,
      faceId,
      vertexIds: [],
      oldPositions: [],
      newPositions: [],
    };
  }

  const translation = {
    x: normal.x * distance,
    y: normal.y * distance,
    z: normal.z * distance,
  };

  return moveFace(mesh, faceId, translation, options);
}