import { EditableMesh } from '../core/EditableMesh.js';
import { BufferGeometry, Float32BufferAttribute, Uint32BufferAttribute } from 'three';
import { Vector2Like, Vector3Like } from '../types';

/**
 * Helper function to safely get x coordinate from Vector3Like
 */
function getX(v: Vector3Like): number {
  return Array.isArray(v) ? v[0] : v.x;
}

/**
 * Helper function to safely get y coordinate from Vector3Like
 */
function getY(v: Vector3Like): number {
  return Array.isArray(v) ? v[1] : v.y;
}

/**
 * Helper function to safely get z coordinate from Vector3Like
 */
function getZ(v: Vector3Like): number {
  return Array.isArray(v) ? v[2] : v.z;
}

/**
 * Helper function to safely get x coordinate from Vector2Like
 */
function getX2D(v: Vector2Like): number {
  return Array.isArray(v) ? v[0] : v.x;
}

/**
 * Helper function to safely get y coordinate from Vector2Like
 */
function getY2D(v: Vector2Like): number {
  return Array.isArray(v) ? v[1] : v.y;
}

/**
 * Converts an EditableMesh to a Three.js BufferGeometry
 */
export function toBufferGeometry(mesh: EditableMesh): BufferGeometry {
  const geometry = new BufferGeometry();

  // Extract vertex positions
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Create vertex mapping
  const vertexMap = new Map<number, number>();
  let vertexIndex = 0;

  // Process faces and build geometry
  for (const face of mesh.faces) {
    const faceVertexIndices: number[] = [];

    for (const vertexId of face.vertexIds) {
      if (!vertexMap.has(vertexId)) {
        const vertex = mesh.getVertex(vertexId);
        if (vertex) {
          // Add position
          positions.push(getX(vertex.position), getY(vertex.position), getZ(vertex.position));

          // Add UV coordinates
          const vertexUVs = mesh.getUVsForVertex(vertexId);
          if (vertexUVs.length > 0 && vertexUVs[0]?.coordinates) {
            uvs.push(getX2D(vertexUVs[0].coordinates), getY2D(vertexUVs[0].coordinates));
          } else {
            uvs.push(0, 0); // Default UV
          }

          vertexMap.set(vertexId, vertexIndex++);
        }
      }

      const index = vertexMap.get(vertexId);
      if (index !== undefined) {
        faceVertexIndices.push(index);
      }
    }

    // Triangulate face if it has more than 3 vertices
    if (faceVertexIndices.length === 3) {
      indices.push(...faceVertexIndices);
    } else if (faceVertexIndices.length > 3) {
      // Simple triangulation: fan from first vertex
      for (let i = 1; i < faceVertexIndices.length - 1; i++) {
        const v0 = faceVertexIndices[0];
        const v1 = faceVertexIndices[i];
        const v2 = faceVertexIndices[i + 1];
        
        // Only add if all indices are defined
        if (v0 !== undefined && v1 !== undefined && v2 !== undefined) {
          indices.push(v0, v1, v2);
        }
      }
    }
  }

  // Set attributes
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  
  if (uvs.length > 0) {
    geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  }

  if (indices.length > 0) {
    geometry.setIndex(new Uint32BufferAttribute(indices, 1));
  }

  // Compute normals
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Converts an EditableMesh to a Three.js BufferGeometry with material groups
 */
export function toBufferGeometryWithMaterials(mesh: EditableMesh): {
  geometry: BufferGeometry;
  materialGroups: Array<{
    start: number;
    count: number;
    materialIndex: number;
  }>;
} {
  const geometry = new BufferGeometry();
  const materialGroups: Array<{
    start: number;
    count: number;
    materialIndex: number;
  }> = [];

  // Extract vertex positions
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Create vertex mapping
  const vertexMap = new Map<number, number>();
  let vertexIndex = 0;
  let indexOffset = 0;

  // Group faces by material
  const facesByMaterial = new Map<number | undefined, Array<typeof mesh.faces[0]>>();
  
  for (const face of mesh.faces) {
    const materialId = face.materialSlotId;
    if (!facesByMaterial.has(materialId)) {
      facesByMaterial.set(materialId, []);
    }
    const facesArray = facesByMaterial.get(materialId);
    if (facesArray) {
      facesArray.push(face);
    }
  }

  // Process faces by material
  for (const [materialId, faces] of facesByMaterial) {
    const materialIndex = materialId !== undefined ? 
      mesh.materials.findIndex((m) => m.id === materialId) : -1;
    
    const groupStart = indexOffset;

    for (const face of faces) {
      const faceVertexIndices: number[] = [];

      for (const vertexId of face.vertexIds) {
        if (!vertexMap.has(vertexId)) {
          const vertex = mesh.getVertex(vertexId);
          if (vertex) {
            // Add position
            positions.push(getX(vertex.position), getY(vertex.position), getZ(vertex.position));

            // Add UV coordinates
            const vertexUVs = mesh.getUVsForVertex(vertexId);
            if (vertexUVs.length > 0 && vertexUVs[0]?.coordinates) {
              uvs.push(getX2D(vertexUVs[0].coordinates), getY2D(vertexUVs[0].coordinates));
            } else {
              uvs.push(0, 0); // Default UV
            }

            vertexMap.set(vertexId, vertexIndex++);
          }
        }

        const index = vertexMap.get(vertexId);
        if (index !== undefined) {
          faceVertexIndices.push(index);
        }
      }

      // Triangulate face
      if (faceVertexIndices.length === 3) {
        indices.push(...faceVertexIndices);
        indexOffset += 3;
      } else if (faceVertexIndices.length > 3) {
        // Simple triangulation: fan from first vertex
        for (let i = 1; i < faceVertexIndices.length - 1; i++) {
          const v0 = faceVertexIndices[0];
          const v1 = faceVertexIndices[i];
          const v2 = faceVertexIndices[i + 1];
          
          // Only add if all indices are defined
          if (v0 !== undefined && v1 !== undefined && v2 !== undefined) {
            indices.push(v0, v1, v2);
            indexOffset += 3;
          }
        }
      }
    }

    // Add material group
    if (indexOffset > groupStart) {
      materialGroups.push({
        start: groupStart,
        count: indexOffset - groupStart,
        materialIndex: materialIndex !== undefined ? Math.max(0, materialIndex) : 0
      });
    }
  }

  // Set attributes
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  
  if (uvs.length > 0) {
    geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  }

  if (indices.length > 0) {
    geometry.setIndex(new Uint32BufferAttribute(indices, 1));
  }

  // Set material groups
  geometry.groups = materialGroups;

  // Compute normals
  geometry.computeVertexNormals();

  return { geometry, materialGroups };
} 