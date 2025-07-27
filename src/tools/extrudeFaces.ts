import { EditableMesh } from '../core/EditableMesh.js';
import type { Face, Vector3Like } from '../types/index.js';
import { PrimitiveBuilder } from '../primitives/core/PrimitiveBuilder.js';
import { toVector3Like } from '../utils/math.js';

/**
 * Extrudes faces along their normal direction
 * 
 * Creates new faces by duplicating the selected faces and connecting them
 * with side faces to form an extrusion.
 * 
 * @param mesh - The mesh to extrude faces from
 * @param faceIds - Array of face IDs to extrude
 * @param distance - Distance to extrude along face normals
 * @returns Array of newly created face IDs
 */
export function extrudeFaces(
  mesh: EditableMesh,
  faceIds: number[],
  distance: number = 1
): number[] {
  if (faceIds.length === 0) return [];
  
  const builder = new PrimitiveBuilder(mesh);
  const newFaceIds: number[] = [];
  
  // Group faces by their normal direction for efficient extrusion
  const faceGroups = new Map<string, number[]>();
  
  for (const faceId of faceIds) {
    const face = mesh.faces.find(f => f.id === faceId);
    if (!face) continue;
    
    const normal = calculateFaceNormal(mesh, face);
    const normalKey = `${normal.x.toFixed(6)},${normal.y.toFixed(6)},${normal.z.toFixed(6)}`;
    
    if (!faceGroups.has(normalKey)) {
      faceGroups.set(normalKey, []);
    }
    faceGroups.get(normalKey)!.push(faceId);
  }
  
  // Extrude each group of faces with the same normal
  for (const [normalKey, groupFaceIds] of faceGroups) {
    const [nx, ny, nz] = normalKey.split(',').map(Number);
    // Guarantee Vector3Like (no undefined)
    const normal = {
      x: nx ?? 0,
      y: ny ?? 0,
      z: nz ?? 0
    } as Vector3Like;
    for (const faceId of groupFaceIds) {
      const extrudedFaces = extrudeSingleFace(mesh, builder, faceId, normal, distance);
      newFaceIds.push(...extrudedFaces);
    }
  }
  
  return newFaceIds;
}

/**
 * Extrudes a single face along its normal
 */
function extrudeSingleFace(
  mesh: EditableMesh,
  builder: PrimitiveBuilder,
  faceId: number,
  normal: Vector3Like,
  distance: number
): number[] {
  const face = mesh.faces.find(f => f.id === faceId);
  if (!face) return [];
  
  const newFaceIds: number[] = [];
  const vertexCount = face.vertexIds.length;
  
  // Create extruded vertices
  const extrudedVertexIds: number[] = [];
  for (const vertexId of face.vertexIds) {
    const vertex = mesh.vertices.find(v => v.id === vertexId);
    if (!vertex) continue;
    
    const extrudedPosition = {
      x: vertex.position.x + normal.x * distance,
      y: vertex.position.y + normal.y * distance,
      z: vertex.position.z + normal.z * distance
    };
    
    const extrudedVertexId = builder.addVertex(
      extrudedPosition,
      `extruded-${vertexId}`
    );
    extrudedVertexIds.push(extrudedVertexId);
  }
  
  // Create the extruded face (duplicate of original)
  if (vertexCount === 3) {
    const triangle: [number, number, number] = [
      extrudedVertexIds[0]!,
      extrudedVertexIds[1]!,
      extrudedVertexIds[2]!
    ];
    const newFaceId = builder.addTriangle(
      triangle,
      `extruded-face-${faceId}`
    );
    newFaceIds.push(newFaceId);
  } else if (vertexCount === 4) {
    const quad: [number, number, number, number] = [
      extrudedVertexIds[0]!,
      extrudedVertexIds[1]!,
      extrudedVertexIds[2]!,
      extrudedVertexIds[3]!
    ];
    const newFaceId = builder.addQuad(
      quad,
      `extruded-face-${faceId}`
    );
    newFaceIds.push(newFaceId);
  } else {
    // N-gon: create a face with the same number of vertices
    // For n-gons, we need to use the mesh's addFace method directly
    // since PrimitiveBuilder only supports triangles and quads
    const newFace = mesh.addFace(
      extrudedVertexIds as number[],
      [],
      `extruded-face-${faceId}`
    );
    newFaceIds.push(newFace.id);
  }
  
  // Create side faces connecting original to extruded
  for (let i = 0; i < vertexCount; i++) {
    const nextI = (i + 1) % vertexCount;
    
    const v0 = face.vertexIds[i]!;
    const v1 = face.vertexIds[nextI]!;
    const v2 = extrudedVertexIds[nextI]!;
    const v3 = extrudedVertexIds[i]!;
    
    const sideQuad: [number, number, number, number] = [v0, v1, v2, v3];
    const sideFaceId = builder.addQuad(
      sideQuad,
      `extruded-side-${faceId}-${i}`
    );
    newFaceIds.push(sideFaceId);
  }
  
  return newFaceIds;
}

/**
 * Calculates the normal vector of a face
 */
function calculateFaceNormal(mesh: EditableMesh, face: Face): Vector3Like {
  const vertices = face.vertexIds.map(id => 
    mesh.vertices.find(v => v.id === id)!
  );
  
  if (vertices.length < 3) {
    return { x: 0, y: 0, z: 0 };
  }
  
  const v0 = toVector3Like(vertices[0]!.position);
  const v1 = toVector3Like(vertices[1]!.position);
  const v2 = toVector3Like(vertices[2]!.position);
  
  const edge1 = {
    x: v1.x - v0.x,
    y: v1.y - v0.y,
    z: v1.z - v0.z
  };
  
  const edge2 = {
    x: v2.x - v0.x,
    y: v2.y - v0.y,
    z: v2.z - v0.z
  };
  
  const normal = {
    x: edge1.y * edge2.z - edge1.z * edge2.y,
    y: edge1.z * edge2.x - edge1.x * edge2.z,
    z: edge1.x * edge2.y - edge1.y * edge2.x
  };
  
  // Normalize
  const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
  if (length > 0) {
    normal.x /= length;
    normal.y /= length;
    normal.z /= length;
  }
  
  return normal;
} 