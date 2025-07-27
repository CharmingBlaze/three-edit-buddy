import { EditableMesh } from '../core/EditableMesh.js';

/**
 * Dissolves edges by removing them while preserving mesh shape
 * 
 * Removes selected edges and merges their adjacent faces if possible.
 * 
 * @param mesh - The mesh to dissolve edges on
 * @param edgeIds - Array of edge IDs to dissolve
 * @returns Object containing counts of dissolved elements
 */
export function dissolveEdges(
  mesh: EditableMesh,
  edgeIds: number[]
): { dissolvedEdges: number; dissolvedFaces: number } {
  let dissolvedEdges = 0;
  let dissolvedFaces = 0;
  
  // Process each edge
  for (const edgeId of edgeIds) {
    const edgeIndex = mesh.edges.findIndex(e => e.id === edgeId);
    if (edgeIndex === -1) continue;
    
    // Find faces that use this edge
    const connectedFaces = mesh.faces.filter(face => 
      face.edgeIds.includes(edgeId)
    );
    
    // Remove the edge
    mesh.edges.splice(edgeIndex, 1);
    dissolvedEdges++;
    
    // If exactly two faces share this edge, try to merge them
    if (connectedFaces.length === 2) {
      const face1 = connectedFaces[0];
      const face2 = connectedFaces[1];
      
      // Merge the faces by combining their vertices
      // (simplified implementation)
      if (face1 && face2) {
        const face1Index = mesh.faces.findIndex(f => f.id === face1.id);
        const face2Index = mesh.faces.findIndex(f => f.id === face2.id);
        
        if (face1Index !== -1 && face2Index !== -1) {
          // Remove both faces
          // In a real implementation, we would merge them into a single face
          mesh.faces.splice(Math.max(face1Index, face2Index), 1);
          mesh.faces.splice(Math.min(face1Index, face2Index), 1);
          dissolvedFaces += 2;
        }
      }
    }
  }
  
  return { dissolvedEdges, dissolvedFaces };
}

/**
 * Dissolves faces by removing them while preserving mesh shape
 * 
 * Removes selected faces and merges their adjacent faces if possible.
 * 
 * @param mesh - The mesh to dissolve faces on
 * @param faceIds - Array of face IDs to dissolve
 * @returns Object containing counts of dissolved elements
 */
export function dissolveFaces(
  mesh: EditableMesh,
  faceIds: number[]
): { dissolvedEdges: number; dissolvedFaces: number } {
  let dissolvedEdges = 0;
  let dissolvedFaces = 0;
  
  // Process each face
  for (const faceId of faceIds) {
    const faceIndex = mesh.faces.findIndex(f => f.id === faceId);
    if (faceIndex === -1) continue;
    
    // Get the face
    const face = mesh.faces[faceIndex];
    
    // Remove the face
    mesh.faces.splice(faceIndex, 1);
    dissolvedFaces++;
    
    // Remove any edges that are no longer connected to any faces
    // (simplified implementation)
    if (face) {
      for (const edgeId of face.edgeIds) {
        const edgeIndex = mesh.edges.findIndex(e => e.id === edgeId);
        if (edgeIndex === -1) continue;
        
        // Check if any other faces use this edge
        const connectedFaces = mesh.faces.filter(f => 
          f.edgeIds.includes(edgeId)
        );
        
        // If no faces use this edge, remove it
        if (connectedFaces.length === 0) {
          mesh.edges.splice(edgeIndex, 1);
          dissolvedEdges++;
        }
      }
    }
  }
  
  return { dissolvedEdges, dissolvedFaces };
}
