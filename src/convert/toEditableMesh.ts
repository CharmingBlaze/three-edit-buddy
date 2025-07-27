import * as THREE from 'three';
import { EditableMesh } from '../core/EditableMesh.js';

/**
 * Converts a Three.js BufferGeometry to an EditableMesh
 * @param geometry The Three.js BufferGeometry to convert
 * @returns An EditableMesh with proper vertex sharing and topology
 */
export function toEditableMesh(geometry: THREE.BufferGeometry): EditableMesh {
  const mesh = new EditableMesh();
  const positions = geometry.attributes.position;
  const indices = geometry.index;

  if (!positions) {
    throw new Error('Geometry must have position attributes');
  }

  // Create vertices from position attributes
  const vertexMap = new Map<string, number>(); // position string -> vertex ID

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);

    // Create a unique key for this position to avoid duplicates
    const positionKey = `${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)}`;

    if (!vertexMap.has(positionKey)) {
      const vertex = mesh.addVertex({ x, y, z });
      vertexMap.set(positionKey, vertex.id);
    }
  }

  // Create faces from indices
  if (indices) {
    for (let i = 0; i < indices.count; i += 3) {
      const v1 = indices.getX(i);
      const v2 = indices.getY(i);
      const v3 = indices.getZ(i);

      // Get the actual vertex positions and find their IDs
      const pos1 = `${positions.getX(v1).toFixed(6)},${positions.getY(v1).toFixed(6)},${positions.getZ(v1).toFixed(6)}`;
      const pos2 = `${positions.getX(v2).toFixed(6)},${positions.getY(v2).toFixed(6)},${positions.getZ(v2).toFixed(6)}`;
      const pos3 = `${positions.getX(v3).toFixed(6)},${positions.getY(v3).toFixed(6)},${positions.getZ(v3).toFixed(6)}`;

      const vertexId1 = vertexMap.get(pos1)!;
      const vertexId2 = vertexMap.get(pos2)!;
      const vertexId3 = vertexMap.get(pos3)!;

      // Add edges for this face
      const edge1 = mesh.addEdge(vertexId1, vertexId2);
      const edge2 = mesh.addEdge(vertexId2, vertexId3);
      const edge3 = mesh.addEdge(vertexId3, vertexId1);

      // Add the face
      mesh.addFace(
        [vertexId1, vertexId2, vertexId3],
        [edge1.id, edge2.id, edge3.id]
      );
    }
  } else {
    // No indices, assume triangles
    for (let i = 0; i < positions.count; i += 3) {
      const v1 = i;
      const v2 = i + 1;
      const v3 = i + 2;

      const pos1 = `${positions.getX(v1).toFixed(6)},${positions.getY(v1).toFixed(6)},${positions.getZ(v1).toFixed(6)}`;
      const pos2 = `${positions.getX(v2).toFixed(6)},${positions.getY(v2).toFixed(6)},${positions.getZ(v2).toFixed(6)}`;
      const pos3 = `${positions.getX(v3).toFixed(6)},${positions.getY(v3).toFixed(6)},${positions.getZ(v3).toFixed(6)}`;

      const vertexId1 = vertexMap.get(pos1)!;
      const vertexId2 = vertexMap.get(pos2)!;
      const vertexId3 = vertexMap.get(pos3)!;

      // Add edges for this face
      const edge1 = mesh.addEdge(vertexId1, vertexId2);
      const edge2 = mesh.addEdge(vertexId2, vertexId3);
      const edge3 = mesh.addEdge(vertexId3, vertexId1);

      // Add the face
      mesh.addFace(
        [vertexId1, vertexId2, vertexId3],
        [edge1.id, edge2.id, edge3.id]
      );
    }
  }

  return mesh;
}
