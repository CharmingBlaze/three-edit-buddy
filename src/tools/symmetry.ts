import { EditableMesh } from '../core/EditableMesh.js';
import type { Vector3Like } from '../types/index.js';

/**
 * Symmetry axis options
 */
export type SymmetryAxis = 'X' | 'Y' | 'Z' | 'XY' | 'XZ' | 'YZ' | 'XYZ';

/**
 * Options for symmetry operations
 */
export interface SymmetryOptions {
  /** The axis or plane to mirror across (default: 'X') */
  axis?: SymmetryAxis;
  /** The position of the symmetry plane/axis (default: 0) */
  position?: number;
  /** Whether to create new vertices or move existing ones (default: false) */
  createNew?: boolean;
  /** Whether to merge vertices at the symmetry plane (default: true) */
  mergeAtPlane?: boolean;
  /** Threshold for merging vertices (default: 0.001) */
  mergeThreshold?: number;
  /** Whether to maintain topology (default: true) */
  maintainTopology?: boolean;
}

/**
 * Result of a symmetry operation
 */
export interface SymmetryResult {
  /** Number of vertices created/moved */
  vertexCount: number;
  /** Number of edges created/moved */
  edgeCount: number;
  /** Number of faces created/moved */
  faceCount: number;
  /** IDs of newly created vertices */
  newVertexIds: number[];
  /** IDs of newly created edges */
  newEdgeIds: number[];
  /** IDs of newly created faces */
  newFaceIds: number[];
}

/**
 * Applies symmetry to selected vertices
 * 
 * @param mesh - The mesh to apply symmetry to
 * @param vertexIds - Array of vertex IDs to mirror
 * @param options - Symmetry options
 * @returns Result of the symmetry operation
 */
export function applyVertexSymmetry(
  mesh: EditableMesh,
  vertexIds: number[],
  options: SymmetryOptions = {}
): SymmetryResult {
  const {
    axis = 'X',
    position = 0,
    createNew = false,
    mergeAtPlane = true,
    mergeThreshold = 0.001,
  } = options;

  const result: SymmetryResult = {
    vertexCount: 0,
    edgeCount: 0,
    faceCount: 0,
    newVertexIds: [],
    newEdgeIds: [],
    newFaceIds: [],
  };

  const newVertices = new Map<number, number>(); // old vertex ID -> new vertex ID

  for (const vertexId of vertexIds) {
    const vertex = mesh.getVertex(vertexId);
    if (!vertex) continue;

    const mirroredPosition = mirrorPosition(vertex.position, axis, position);
    
    // Check if we should merge at the symmetry plane
    if (mergeAtPlane && isOnSymmetryPlane(vertex.position, axis, position, mergeThreshold)) {
      continue; // Skip vertices on the symmetry plane
    }

    if (createNew) {
      // Create new vertex
      const newVertex = mesh.addVertex(mirroredPosition, `mirrored-${vertex.name || vertexId}`);
      newVertices.set(vertexId, newVertex.id);
      result.newVertexIds.push(newVertex.id);
      result.vertexCount++;
    } else {
      // Move existing vertex
      mesh.moveVertex(vertexId, mirroredPosition);
      result.vertexCount++;
    }
  }

  return result;
}

/**
 * Applies symmetry to selected edges
 * 
 * @param mesh - The mesh to apply symmetry to
 * @param edgeIds - Array of edge IDs to mirror
 * @param options - Symmetry options
 * @returns Result of the symmetry operation
 */
export function applyEdgeSymmetry(
  mesh: EditableMesh,
  edgeIds: number[],
  options: SymmetryOptions = {}
): SymmetryResult {
  const {
    axis = 'X',
    position = 0,
    createNew = false,
    mergeAtPlane = true,
    mergeThreshold = 0.001,
  } = options;

  const result: SymmetryResult = {
    vertexCount: 0,
    edgeCount: 0,
    faceCount: 0,
    newVertexIds: [],
    newEdgeIds: [],
    newFaceIds: [],
  };

  const newVertices = new Map<number, number>(); // old vertex ID -> new vertex ID

  for (const edgeId of edgeIds) {
    const edge = mesh.getEdge(edgeId);
    if (!edge) continue;

    const vertex1 = mesh.getVertex(edge.vertexIds[0]);
    const vertex2 = mesh.getVertex(edge.vertexIds[1]);

    if (!vertex1 || !vertex2) continue;

    // Check if edge crosses the symmetry plane
    const crossesPlane = edgeCrossesSymmetryPlane(vertex1.position, vertex2.position, axis, position);
    
    if (crossesPlane && mergeAtPlane) {
      continue; // Skip edges that cross the symmetry plane
    }

    let newVertex1Id: number;
    let newVertex2Id: number;

    if (createNew) {
      // Create new vertices
      const mirroredPos1 = mirrorPosition(vertex1.position, axis, position);
      const mirroredPos2 = mirrorPosition(vertex2.position, axis, position);

      const newVertex1 = mesh.addVertex(mirroredPos1, `mirrored-${vertex1.name || edge.vertexIds[0]}`);
      const newVertex2 = mesh.addVertex(mirroredPos2, `mirrored-${vertex2.name || edge.vertexIds[1]}`);

      newVertex1Id = newVertex1.id;
      newVertex2Id = newVertex2.id;

      result.newVertexIds.push(newVertex1.id, newVertex2.id);
      result.vertexCount += 2;
    } else {
      // Move existing vertices
      const mirroredPos1 = mirrorPosition(vertex1.position, axis, position);
      const mirroredPos2 = mirrorPosition(vertex2.position, axis, position);

      mesh.moveVertex(edge.vertexIds[0], mirroredPos1);
      mesh.moveVertex(edge.vertexIds[1], mirroredPos2);

      newVertex1Id = edge.vertexIds[0];
      newVertex2Id = edge.vertexIds[1];
      result.vertexCount += 2;
    }

    // Create new edge
    const newEdge = mesh.addEdge(newVertex1Id, newVertex2Id, `mirrored-${edge.name || edgeId}`);
    result.newEdgeIds.push(newEdge.id);
    result.edgeCount++;
  }

  return result;
}

/**
 * Applies symmetry to selected faces
 * 
 * @param mesh - The mesh to apply symmetry to
 * @param faceIds - Array of face IDs to mirror
 * @param options - Symmetry options
 * @returns Result of the symmetry operation
 */
export function applyFaceSymmetry(
  mesh: EditableMesh,
  faceIds: number[],
  options: SymmetryOptions = {}
): SymmetryResult {
  const {
    axis = 'X',
    position = 0,
    createNew = false,
    mergeAtPlane = true,
    mergeThreshold = 0.001,
  } = options;

  const result: SymmetryResult = {
    vertexCount: 0,
    edgeCount: 0,
    faceCount: 0,
    newVertexIds: [],
    newEdgeIds: [],
    newFaceIds: [],
  };

  for (const faceId of faceIds) {
    const face = mesh.getFace(faceId);
    if (!face) continue;

    // Check if face crosses the symmetry plane
    const vertices = face.vertexIds.map((vertexId) => mesh.getVertex(vertexId));
    const validVertices = vertices.filter((v) => v !== undefined);

    if (validVertices.length === 0) continue;

    const crossesPlane = faceCrossesSymmetryPlane(validVertices.map((v) => v!.position), axis, position);
    
    if (crossesPlane && mergeAtPlane) {
      continue; // Skip faces that cross the symmetry plane
    }

    if (createNew) {
      // Create new vertices and face
      const newVertexIds: number[] = [];
      
      for (const vertex of validVertices) {
        const mirroredPosition = mirrorPosition(vertex!.position, axis, position);
        const newVertex = mesh.addVertex(mirroredPosition, `mirrored-${vertex!.name || vertex!.id}`);
        newVertexIds.push(newVertex.id);
        result.newVertexIds.push(newVertex.id);
        result.vertexCount++;
      }

      // Create new edges
      const newEdgeIds: number[] = [];
      for (let i = 0; i < newVertexIds.length; i++) {
        const v1 = newVertexIds[i];
        const v2 = newVertexIds[(i + 1) % newVertexIds.length];
        const newEdge = mesh.addEdge(v1, v2, `mirrored-edge-${faceId}-${i}`);
        newEdgeIds.push(newEdge.id);
        result.newEdgeIds.push(newEdge.id);
        result.edgeCount++;
      }

      // Create new face
      const newFace = mesh.addFace(newVertexIds, newEdgeIds, `mirrored-${face.name || faceId}`);
      result.newFaceIds.push(newFace.id);
      result.faceCount++;
    } else {
      // Move existing vertices
      for (const vertex of validVertices) {
        const mirroredPosition = mirrorPosition(vertex!.position, axis, position);
        mesh.moveVertex(vertex!.id, mirroredPosition);
        result.vertexCount++;
      }
      result.faceCount++;
    }
  }

  return result;
}

/**
 * Mirrors a position across the specified axis/plane
 */
function mirrorPosition(
  position: Vector3Like,
  axis: SymmetryAxis,
  planePosition: number
): Vector3Like {
  const result = { ...position };

  switch (axis) {
    case 'X':
      result.x = 2 * planePosition - position.x;
      break;
    case 'Y':
      result.y = 2 * planePosition - position.y;
      break;
    case 'Z':
      result.z = 2 * planePosition - position.z;
      break;
    case 'XY':
      result.x = 2 * planePosition - position.x;
      result.y = 2 * planePosition - position.y;
      break;
    case 'XZ':
      result.x = 2 * planePosition - position.x;
      result.z = 2 * planePosition - position.z;
      break;
    case 'YZ':
      result.y = 2 * planePosition - position.y;
      result.z = 2 * planePosition - position.z;
      break;
    case 'XYZ':
      result.x = 2 * planePosition - position.x;
      result.y = 2 * planePosition - position.y;
      result.z = 2 * planePosition - position.z;
      break;
  }

  return result;
}

/**
 * Checks if a position is on the symmetry plane
 */
function isOnSymmetryPlane(
  position: Vector3Like,
  axis: SymmetryAxis,
  planePosition: number,
  threshold: number
): boolean {
  switch (axis) {
    case 'X':
      return Math.abs(position.x - planePosition) < threshold;
    case 'Y':
      return Math.abs(position.y - planePosition) < threshold;
    case 'Z':
      return Math.abs(position.z - planePosition) < threshold;
    case 'XY':
      return Math.abs(position.x - planePosition) < threshold && Math.abs(position.y - planePosition) < threshold;
    case 'XZ':
      return Math.abs(position.x - planePosition) < threshold && Math.abs(position.z - planePosition) < threshold;
    case 'YZ':
      return Math.abs(position.y - planePosition) < threshold && Math.abs(position.z - planePosition) < threshold;
    case 'XYZ':
      return Math.abs(position.x - planePosition) < threshold && Math.abs(position.y - planePosition) < threshold && Math.abs(position.z - planePosition) < threshold;
    default:
      return false;
  }
}

/**
 * Checks if an edge crosses the symmetry plane
 */
function edgeCrossesSymmetryPlane(
  pos1: Vector3Like,
  pos2: Vector3Like,
  axis: SymmetryAxis,
  planePosition: number
): boolean {
  let coord1: number, coord2: number;

  switch (axis) {
    case 'X':
      coord1 = pos1.x;
      coord2 = pos2.x;
      break;
    case 'Y':
      coord1 = pos1.y;
      coord2 = pos2.y;
      break;
    case 'Z':
      coord1 = pos1.z;
      coord2 = pos2.z;
      break;
    default:
      return false;
  }

  return (coord1 - planePosition) * (coord2 - planePosition) < 0;
}

/**
 * Checks if a face crosses the symmetry plane
 */
function faceCrossesSymmetryPlane(
  positions: Vector3Like[],
  axis: SymmetryAxis,
  planePosition: number
): boolean {
  let coords: number[];

  switch (axis) {
    case 'X':
      coords = positions.map((p) => p.x);
      break;
    case 'Y':
      coords = positions.map((p) => p.y);
      break;
    case 'Z':
      coords = positions.map((p) => p.z);
      break;
    default:
      return false;
  }

  // Check if any edge of the face crosses the plane
  for (let i = 0; i < coords.length; i++) {
    const coord1 = coords[i];
    const coord2 = coords[(i + 1) % coords.length];
    
    if ((coord1 - planePosition) * (coord2 - planePosition) < 0) {
      return true;
    }
  }

  return false;
}

/**
 * Creates a symmetrical mesh by duplicating and mirroring the entire mesh
 * 
 * @param mesh - The mesh to make symmetrical
 * @param options - Symmetry options
 * @returns Result of the symmetry operation
 */
export function createSymmetricalMesh(
  mesh: EditableMesh,
  options: SymmetryOptions = {}
): SymmetryResult {
  const vertexIds = mesh.vertices.map((v) => v.id);
  const edgeIds = mesh.edges.map((e) => e.id);
  const faceIds = mesh.faces.map((f) => f.id);

  const vertexResult = applyVertexSymmetry(mesh, vertexIds, { ...options, createNew: true });
  const edgeResult = applyEdgeSymmetry(mesh, edgeIds, { ...options, createNew: true });
  const faceResult = applyFaceSymmetry(mesh, faceIds, { ...options, createNew: true });

  return {
    vertexCount: vertexResult.vertexCount + edgeResult.vertexCount + faceResult.vertexCount,
    edgeCount: edgeResult.edgeCount + faceResult.edgeCount,
    faceCount: faceResult.faceCount,
    newVertexIds: [...vertexResult.newVertexIds, ...edgeResult.newVertexIds, ...faceResult.newVertexIds],
    newEdgeIds: [...edgeResult.newEdgeIds, ...faceResult.newEdgeIds],
    newFaceIds: faceResult.newFaceIds,
  };
}