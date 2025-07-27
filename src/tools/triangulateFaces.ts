import { EditableMesh } from '../core/EditableMesh.js';
import { PrimitiveBuilder } from '../primitives/core/PrimitiveBuilder.js';

/**
 * Triangulates faces by converting quads and n-gons into triangles
 * 
 * Uses a simple fan triangulation method.
 * 
 * @param mesh - The mesh to triangulate faces on
 * @param faceIds - Array of face IDs to triangulate
 * @returns Array of newly created triangle face IDs
 */
export function triangulateFaces(
  mesh: EditableMesh,
  faceIds: number[]
): number[] {
  if (faceIds.length === 0) return [];
  
  const builder = new PrimitiveBuilder(mesh);
  const newTriangleIds: number[] = [];
  
  // Process each face
  for (const faceId of faceIds) {
    const face = mesh.faces.find(f => f.id === faceId);
    if (!face) continue;
    
    // Skip if already a triangle
    if (face.vertexIds.length === 3) {
      newTriangleIds.push(faceId);
      continue;
    }
    
    // Triangulate using fan method
    const vertexIds = face.vertexIds;
    
    // Create triangles using fan triangulation
    for (let i = 1; i < vertexIds.length - 1; i++) {
      const triangleId = builder.addTriangle([
        vertexIds[0],
        vertexIds[i],
        vertexIds[i + 1]
      ]);
      
      newTriangleIds.push(triangleId);
    }
    
    // Delete the original face
    const faceIndex = mesh.faces.findIndex(f => f.id === faceId);
    if (faceIndex !== -1) {
      mesh.faces.splice(faceIndex, 1);
    }
  }
  
  return newTriangleIds;
}

/**
 * Triangulates all faces in the mesh that are not already triangles
 * 
 * @param mesh - The mesh to triangulate
 * @returns Object containing arrays of new face IDs and deleted face IDs
 */
export function triangulateMesh(
  mesh: EditableMesh
): { newFaces: number[]; deletedFaces: number[] } {
  // Get all non-triangular faces
  const nonTriangularFaceIds = mesh.faces
    .filter(face => face.vertexIds.length > 3)
    .map(face => face.id);
  
  return triangulateFaces(mesh, nonTriangularFaceIds);
}

/**
 * Performs fan triangulation of a polygon
 * 
 * @param vertexIds - Array of vertex IDs forming the polygon
 * @returns Array of triangles (each triangle is an array of 3 vertex IDs)
 */
function fanTriangulate(vertexIds: number[]): number[][] {
  if (vertexIds.length < 3) return [];
  
  const triangles: number[][] = [];
  
  // Create triangles using a fan approach
  // Connect vertex 0 to all other consecutive pairs
  for (let i = 1; i < vertexIds.length - 1; i++) {
    triangles.push([vertexIds[0], vertexIds[i], vertexIds[i + 1]]);
  }
  
  return triangles;
}
