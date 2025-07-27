import { EditableMesh } from '../core/EditableMesh.js';

/**
 * Deletes vertices, edges, and faces from a mesh
 * 
 * Performs topology cleanup to maintain mesh integrity after deletion.
 * 
 * @param mesh - The mesh to delete elements from
 * @param vertexIds - Array of vertex IDs to delete
 * @param edgeIds - Array of edge IDs to delete
 * @param faceIds - Array of face IDs to delete
 * @returns Object containing counts of deleted elements
 */
export function deleteElements(
  mesh: EditableMesh,
  vertexIds: number[] = [],
  edgeIds: number[] = [],
  faceIds: number[] = []
): { deletedVertices: number; deletedEdges: number; deletedFaces: number } {
  let deletedVertices = 0;
  let deletedEdges = 0;
  let deletedFaces = 0;
  
  // Delete faces first (to avoid orphaned edges)
  for (const faceId of faceIds) {
    const faceIndex = mesh.faces.findIndex(f => f.id === faceId);
    if (faceIndex !== -1) {
      mesh.faces.splice(faceIndex, 1);
      deletedFaces++;
    }
  }
  
  // Delete edges (to avoid orphaned vertices)
  for (const edgeId of edgeIds) {
    const edgeIndex = mesh.edges.findIndex(e => e.id === edgeId);
    if (edgeIndex !== -1) {
      mesh.edges.splice(edgeIndex, 1);
      deletedEdges++;
    }
  }
  
  // Delete vertices
  for (const vertexId of vertexIds) {
    const vertexIndex = mesh.vertices.findIndex(v => v.id === vertexId);
    if (vertexIndex !== -1) {
      mesh.vertices.splice(vertexIndex, 1);
      deletedVertices++;
    }
  }
  
  // Clean up orphaned elements that are no longer referenced
  cleanupOrphanedElements(mesh);
  
  return { deletedVertices, deletedEdges, deletedFaces };
}

/**
 * Deletes selected vertices and all connected edges and faces
 * 
 * @param mesh - The mesh to delete vertices from
 * @param vertexIds - Array of vertex IDs to delete
 * @returns Object containing counts of deleted elements
 */
export function deleteVertices(
  mesh: EditableMesh,
  vertexIds: number[]
): { deletedVertices: number; deletedEdges: number; deletedFaces: number } {
  // Find all connected edges and faces
  const connectedEdges = new Set<number>();
  const connectedFaces = new Set<number>();
  
  for (const vertexId of vertexIds) {
    // Find connected edges
    for (const edge of mesh.edges) {
      if (edge.vertexIds.includes(vertexId)) {
        connectedEdges.add(edge.id);
      }
    }
    
    // Find connected faces
    for (const face of mesh.faces) {
      if (face.vertexIds.includes(vertexId)) {
        connectedFaces.add(face.id);
      }
    }
  }
  
  // Delete everything
  return deleteElements(
    mesh,
    vertexIds,
    Array.from(connectedEdges),
    Array.from(connectedFaces)
  );
}

/**
 * Deletes selected edges and all connected faces
 * 
 * @param mesh - The mesh to delete edges from
 * @param edgeIds - Array of edge IDs to delete
 * @returns Object containing counts of deleted elements
 */
export function deleteEdges(
  mesh: EditableMesh,
  edgeIds: number[]
): { deletedVertices: number; deletedEdges: number; deletedFaces: number } {
  // Find all connected faces
  const connectedFaces = new Set<number>();
  
  for (const edgeId of edgeIds) {
    for (const face of mesh.faces) {
      if (face.edgeIds.includes(edgeId)) {
        connectedFaces.add(face.id);
      }
    }
  }
  
  // Delete edges and connected faces
  return deleteElements(
    mesh,
    [],
    edgeIds,
    Array.from(connectedFaces)
  );
}

/**
 * Deletes selected faces
 * 
 * @param mesh - The mesh to delete faces from
 * @param faceIds - Array of face IDs to delete
 * @returns Object containing counts of deleted elements
 */
export function deleteFaces(
  mesh: EditableMesh,
  faceIds: number[]
): { deletedVertices: number; deletedEdges: number; deletedFaces: number } {
  // Delete just the faces
  return deleteElements(mesh, [], [], faceIds);
}

/**
 * Cleans up orphaned elements that are no longer referenced
 * 
 * @param mesh - The mesh to clean up
 */
function cleanupOrphanedElements(mesh: EditableMesh): void {
  // Find all referenced vertex IDs
  const referencedVertexIds = new Set<number>();
  
  // Vertices referenced by edges
  for (const edge of mesh.edges) {
    for (const vertexId of edge.vertexIds) {
      referencedVertexIds.add(vertexId);
    }
  }
  
  // Vertices referenced by faces
  for (const face of mesh.faces) {
    for (const vertexId of face.vertexIds) {
      referencedVertexIds.add(vertexId);
    }
  }
  
  // Remove unreferenced vertices
  mesh.vertices = mesh.vertices.filter(v => referencedVertexIds.has(v.id));
  
  // Find all referenced edge IDs
  const referencedEdgeIds = new Set<number>();
  
  // Edges referenced by faces
  for (const face of mesh.faces) {
    for (const edgeId of face.edgeIds) {
      referencedEdgeIds.add(edgeId);
    }
  }
  
  // Remove unreferenced edges
  mesh.edges = mesh.edges.filter(e => referencedEdgeIds.has(e.id));
}
