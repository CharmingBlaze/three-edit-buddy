import { EditableMesh } from '../core/EditableMesh.js';

/**
 * Subdivides a mesh using a simple algorithm that splits each face.
 * This method creates a center vertex for each face and midpoints for each edge,
 * then creates new triangular faces.
 * @param mesh The mesh to subdivide.
 * @returns A new, subdivided EditableMesh.
 */
export function subdivideMesh(mesh: EditableMesh): EditableMesh {
  const newMesh = new EditableMesh();
  const edgeMidpoints = new Map<string, number>(); // Map edge key to new vertex ID

  // 1. Copy all original vertices to the new mesh and keep a map.
  const oldToNewVertexMap = new Map<number, number>();
  for (const vertex of mesh.vertices) {
    const newVertex = newMesh.addVertex(vertex.position);
    oldToNewVertexMap.set(vertex.id, newVertex.id);
  }

  // Helper to get or create a midpoint for an edge
  const getOrCreateMidpoint = (v1Id: number, v2Id: number): number => {
    const edgeKey = [v1Id, v2Id].sort().join('-');
    if (edgeMidpoints.has(edgeKey)) {
      return edgeMidpoints.get(edgeKey)!;
    }

    const vertex1 = mesh.getVertex(v1Id)!;
    const vertex2 = mesh.getVertex(v2Id)!;

    const midpointPosition = {
      x: (vertex1.position.x + vertex2.position.x) / 2,
      y: (vertex1.position.y + vertex2.position.y) / 2,
      z: (vertex1.position.z + vertex2.position.z) / 2,
    };
    const newVertex = newMesh.addVertex(midpointPosition);
    edgeMidpoints.set(edgeKey, newVertex.id);
    return newVertex.id;
  };

  // 2. Iterate over each face of the original mesh
  for (const face of mesh.faces) {
    const faceVertices = face.vertexIds.map(id => mesh.getVertex(id));
    if (faceVertices.some(v => v === undefined)) continue; // Skip malformed faces

    // 3. Calculate face center and add it as a new vertex
    const centerPosition = {
      x: faceVertices.reduce((sum, v) => sum + v!.position.x, 0) / faceVertices.length,
      y: faceVertices.reduce((sum, v) => sum + v!.position.y, 0) / faceVertices.length,
      z: faceVertices.reduce((sum, v) => sum + v!.position.z, 0) / faceVertices.length,
    };
    const centerVertexId = newMesh.addVertex(centerPosition).id;

    // 4. Create new faces connecting original vertices, edge midpoints, and the center
    for (let i = 0; i < faceVertices.length; i++) {
      const v1_id_old = faceVertices[i]!.id;
      const v2_id_old = faceVertices[(i + 1) % faceVertices.length]!.id;

      const midpointId = getOrCreateMidpoint(v1_id_old, v2_id_old);
      const v1_id_new = oldToNewVertexMap.get(v1_id_old)!;

      // Create a new face (quad) from the original vertex, the edge midpoint,
      // the face center, and the previous edge's midpoint.
      // For simplicity, we create triangles fanning from the center.
      newMesh.addFace([v1_id_new, midpointId, centerVertexId], []);
    }
  }

  // Note: This simple implementation does not rebuild the edge list.
  // For a fully-featured subdivision, edge recalculation would be necessary.

  return newMesh;
}
