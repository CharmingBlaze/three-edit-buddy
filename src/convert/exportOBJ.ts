import type { EditableMesh, Vector3Like, Vector2Like } from '../types/index.js';

/**
 * Exports an EditableMesh to OBJ format
 * Preserves quads, triangles, and n-gons as supported by OBJ
 */
export function exportOBJ(mesh: EditableMesh): string {
  const lines: string[] = [];

  // Header
  lines.push('# Exported by three-edit-buddy');
  lines.push('# Faces may be quads, tris, or n-gons');
  lines.push('');

  // Export vertices
  for (const vertex of mesh.vertices) {
    const pos = getVector3Components(vertex.position);
    lines.push(`v ${pos.x.toFixed(6)} ${pos.y.toFixed(6)} ${pos.z.toFixed(6)}`);
  }

  // Export UVs if they exist
  if (mesh.uvs.length > 0) {
    lines.push('');
    for (const uv of mesh.uvs) {
      const coords = getVector2Components(uv.position);
      lines.push(`vt ${coords.x.toFixed(6)} ${coords.y.toFixed(6)}`);
    }
  }

  // Export faces
  lines.push('');
  for (const face of mesh.faces) {
    const vertexCount = face.vertexIds.length;

    if (vertexCount < 3) {
      console.warn(
        `Skipping face with ${vertexCount} vertices (minimum 3 required)`
      );
      continue;
    }

    // Create face line with vertex indices (1-based for OBJ)
    const vertexIndices = face.vertexIds.map((id) => (id + 1).toString());
    lines.push(`f ${vertexIndices.join(' ')}`);
  }

  return lines.join('\n');
}

/**
 * Exports an EditableMesh to OBJ format with UV coordinates
 * Each vertex in a face can have UV coordinates
 */
export function exportOBJWithUVs(mesh: EditableMesh): string {
  const lines: string[] = [];

  // Header
  lines.push('# Exported by three-edit-buddy with UVs');
  lines.push('# Faces may be quads, tris, or n-gons');
  lines.push('');

  // Export vertices
  for (const vertex of mesh.vertices) {
    const pos = getVector3Components(vertex.position);
    lines.push(`v ${pos.x.toFixed(6)} ${pos.y.toFixed(6)} ${pos.z.toFixed(6)}`);
  }

  // Export UVs
  lines.push('');
  for (const uv of mesh.uvs) {
    const coords = getVector2Components(uv.position);
    lines.push(`vt ${coords.x.toFixed(6)} ${coords.y.toFixed(6)}`);
  }

  // Export faces with UV indices
  lines.push('');
  for (const face of mesh.faces) {
    const vertexCount = face.vertexIds.length;

    if (vertexCount < 3) {
      console.warn(
        `Skipping face with ${vertexCount} vertices (minimum 3 required)`
      );
      continue;
    }

    // Create face line with vertex/UV indices (1-based for OBJ)
    const faceIndices: string[] = [];

    for (const vertexId of face.vertexIds) {
      const vertex = mesh.getVertex(vertexId);
      if (!vertex) continue;

      // Find UV for this vertex
      const uv = mesh.uvs.find((u) => u.vertexId === vertexId);
      if (uv) {
        // vertex/uv format: v/vt
        faceIndices.push(`${vertexId + 1}/${uv.id + 1}`);
      } else {
        // vertex only format: v
        faceIndices.push(`${vertexId + 1}`);
      }
    }

    lines.push(`f ${faceIndices.join(' ')}`);
  }

  return lines.join('\n');
}

/**
 * Exports an EditableMesh to OBJ format with materials
 */
export function exportOBJWithMaterials(mesh: EditableMesh): {
  obj: string;
  mtl: string;
} {
  const objLines: string[] = [];
  const mtlLines: string[] = [];

  // OBJ header
  objLines.push('# Exported by three-edit-buddy with materials');
  objLines.push('# Faces may be quads, tris, or n-gons');
  objLines.push('');

  // Export vertices
  for (const vertex of mesh.vertices) {
    const pos = getVector3Components(vertex.position);
    objLines.push(
      `v ${pos.x.toFixed(6)} ${pos.y.toFixed(6)} ${pos.z.toFixed(6)}`
    );
  }

  // Export UVs if they exist
  if (mesh.uvs.length > 0) {
    objLines.push('');
    for (const uv of mesh.uvs) {
      const coords = getVector2Components(uv.position);
      objLines.push(`vt ${coords.x.toFixed(6)} ${coords.y.toFixed(6)}`);
    }
  }

  // Export materials
  if (mesh.materials.length > 0) {
    objLines.push('');
    objLines.push('mtllib materials.mtl');
    objLines.push('');

    // Group faces by material
    const facesByMaterial = new Map<number, typeof mesh.faces>();

    for (const face of mesh.faces) {
      const materialId = face.materialSlotId ?? 0;
      if (!facesByMaterial.has(materialId)) {
        facesByMaterial.set(materialId, []);
      }
      facesByMaterial.get(materialId)!.push(face);
    }

    // Export faces grouped by material
    for (const [materialId, faces] of facesByMaterial) {
      const material = mesh.materials.find((m) => m.id === materialId);
      if (material) {
        objLines.push(`g material_${material.id}`);
        objLines.push(`usemtl ${material.name}`);

        for (const face of faces) {
          const vertexCount = face.vertexIds.length;

          if (vertexCount < 3) {
            console.warn(
              `Skipping face with ${vertexCount} vertices (minimum 3 required)`
            );
            continue;
          }

          const vertexIndices = face.vertexIds.map((id) => (id + 1).toString());
          objLines.push(`f ${vertexIndices.join(' ')}`);
        }

        objLines.push('');
      }
    }
  } else {
    // Export faces without materials
    objLines.push('');
    for (const face of mesh.faces) {
      const vertexCount = face.vertexIds.length;

      if (vertexCount < 3) {
        console.warn(
          `Skipping face with ${vertexCount} vertices (minimum 3 required)`
        );
        continue;
      }

      const vertexIndices = face.vertexIds.map((id) => (id + 1).toString());
      objLines.push(`f ${vertexIndices.join(' ')}`);
    }
  }

  // MTL file
  mtlLines.push('# Material file for three-edit-buddy export');
  mtlLines.push('');

  for (const material of mesh.materials) {
    mtlLines.push(`newmtl ${material.name}`);

    if (material.color) {
      const color = getVector3Components(material.color);
      mtlLines.push(
        `Kd ${color.x.toFixed(6)} ${color.y.toFixed(6)} ${color.z.toFixed(6)}`
      );
    } else {
      mtlLines.push('Kd 0.8 0.8 0.8'); // Default gray
    }

    if (material.opacity !== undefined) {
      mtlLines.push(`d ${material.opacity.toFixed(6)}`);
    }

    if (material.transparent) {
      mtlLines.push('illum 2'); // Transparency enabled
    }

    mtlLines.push('');
  }

  return {
    obj: objLines.join('\n'),
    mtl: mtlLines.join('\n'),
  };
}

/**
 * Helper function to safely access Vector3Like properties
 */
function getVector3Components(v: Vector3Like): {
  x: number;
  y: number;
  z: number;
} {
  if (Array.isArray(v)) {
    return { x: v[0] ?? 0, y: v[1] ?? 0, z: v[2] ?? 0 };
  }
  return { x: v.x, y: v.y, z: v.z };
}

/**
 * Helper function to safely access Vector2Like properties
 */
function getVector2Components(v: Vector2Like): { x: number; y: number } {
  if (Array.isArray(v)) {
    return { x: v[0] ?? 0, y: v[1] ?? 0 };
  }
  return { x: v.x, y: v.y };
}
