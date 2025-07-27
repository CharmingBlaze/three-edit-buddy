import { EditableMesh } from '../core/EditableMesh.js';
import { PrimitiveBuilder } from '../primitives/core/PrimitiveBuilder.js';

/**
 * Quadrangulates faces by converting triangles and n-gons into quads where possible
 * 
 * Attempts to create quads from triangles and n-gons.
 * 
 * @param mesh - The mesh to quadrangulate faces on
 * @param faceIds - Array of face IDs to quadrangulate
 * @returns Object containing arrays of new face IDs and deleted face IDs
 */
export function quadrangulateFaces(
  mesh: EditableMesh,
  faceIds: number[]
): { newFaces: number[]; deletedFaces: number[] } {
  if (faceIds.length === 0) return { newFaces: [], deletedFaces: [] };
  
  const builder = new PrimitiveBuilder(mesh);
  const newFaceIds: number[] = [];
  const deletedFaceIds: number[] = [];
  
  // Process each face
  for (const faceId of faceIds) {
    const face = mesh.faces.find(f => f.id === faceId);
    if (!face) continue;
    
    // Only quadrangulate if face has more or less than 4 vertices
    if (face.vertexIds.length === 4) {
      newFaceIds.push(faceId);
      continue;
    }
    
    // For triangles, we can't easily convert to quads without adding vertices
    // For n-gons, we can try to split them into quads
    if (face.vertexIds.length > 4) {
      // Simple approach: Split n-gon into quads by connecting opposite vertices
      // This is a simplified approach and may not work for all cases
      const vertexIds = face.vertexIds;
      
      // Try to create quads by pairing vertices
      for (let i = 0; i < vertexIds.length; i += 2) {
        // Ensure we have valid vertex IDs
        const v1 = vertexIds[i];
        const v2 = vertexIds[i + 1];
        
        if (i + 3 < vertexIds.length) {
          const v3 = vertexIds[i + 2];
          const v4 = vertexIds[i + 3];
          
          // Check all vertices are valid numbers
          if (typeof v1 === 'number' && typeof v2 === 'number' && 
              typeof v3 === 'number' && typeof v4 === 'number') {
            // Create a quad using four consecutive vertices
            const quadId = builder.addQuad([v1, v2, v3, v4]);
            newFaceIds.push(quadId);
          }
        } else if (i + 2 < vertexIds.length) {
          const v3 = vertexIds[i + 2];
          
          // Check all vertices are valid numbers
          if (typeof v1 === 'number' && typeof v2 === 'number' && 
              typeof v3 === 'number') {
            // Create a triangle for remaining vertices
            const triangleId = builder.addTriangle([v1, v2, v3]);
            newFaceIds.push(triangleId);
          }
        } else if (i + 1 < vertexIds.length) {
          // Create an edge for remaining vertices (should not happen in valid meshes)
          // Just skip for now
        }
      }
      
      // Delete the original face
      const faceIndex = mesh.faces.findIndex(f => f.id === faceId);
      if (faceIndex !== -1) {
        mesh.faces.splice(faceIndex, 1);
        deletedFaceIds.push(faceId);
      }
    }
  }
  
  return { newFaces: newFaceIds, deletedFaces: deletedFaceIds };
}

/**
 * Quadrangulates all faces in a mesh
 * 
 * @param mesh - The mesh to quadrangulate
 * @returns Object containing arrays of new face IDs and deleted face IDs
 */
export function quadrangulateMesh(mesh: EditableMesh): { newFaces: number[]; deletedFaces: number[] } {
  return quadrangulateFaces(mesh, mesh.faces.map(f => f.id));
}
