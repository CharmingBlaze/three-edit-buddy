import type { EditableMesh, Vector3Like, Vector2Like } from '../types/index.js';

/**
 * Options for GLTF export
 */
export interface GLTFExportOptions {
  /** Whether to include UV coordinates (default: true) */
  includeUVs?: boolean;
  /** Whether to include normals (default: true) */
  includeNormals?: boolean;
  /** Whether to include materials (default: true) */
  includeMaterials?: boolean;
  /** Whether to triangulate faces (default: false) */
  triangulate?: boolean;
  /** Custom material properties */
  materials?: Array<{
    name: string;
    color?: Vector3Like;
    opacity?: number;
    transparent?: boolean;
    metalness?: number;
    roughness?: number;
  }>;
}

/**
 * GLTF buffer view information
 */
interface BufferView {
  buffer: number;
  byteOffset: number;
  byteLength: number;
  byteStride?: number;
  target?: number;
}

/**
 * GLTF accessor information
 */
interface Accessor {
  bufferView: number;
  byteOffset: number;
  componentType: number;
  count: number;
  type: string;
  max?: number[];
  min?: number[];
}

/**
 * GLTF mesh primitive
 */
interface MeshPrimitive {
  attributes: {
    POSITION: number;
    NORMAL?: number;
    TEXCOORD_0?: number;
  };
  indices?: number;
  material?: number;
}

/**
 * GLTF material
 */
interface GLTFMaterial {
  name: string;
  pbrMetallicRoughness?: {
    baseColorFactor?: number[];
    metallicFactor?: number;
    roughnessFactor?: number;
  };
  alphaMode?: string;
  alphaCutoff?: number;
}

/**
 * Exports an EditableMesh to GLTF format
 * Supports vertices, UVs, normals, and materials
 */
export function exportGLTF(
  mesh: EditableMesh,
  options: GLTFExportOptions = {}
): string {
  const {
    includeUVs = true,
    includeNormals = true,
    includeMaterials = true,
    triangulate = false,
    materials = [],
  } = options;

  // Prepare mesh data
  const meshData = prepareMeshData(mesh, { triangulate });
  
  // Create GLTF structure
  const gltf: any = {
    asset: {
      version: '2.0',
      generator: 'three-edit-buddy',
    },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [],
    materials: [],
    accessors: [],
    bufferViews: [],
    buffers: [],
  };

  // Create buffer data
  const bufferData = createBufferData(meshData, { includeUVs, includeNormals });
  
  // Add buffer
  gltf.buffers.push({
    byteLength: bufferData.byteLength,
    uri: 'data:application/octet-stream;base64,' + bufferData.base64,
  });

  // Add buffer views
  let byteOffset = 0;
  const bufferViews: BufferView[] = [];
  
  // Position buffer view
  bufferViews.push({
    buffer: 0,
    byteOffset: 0,
    byteLength: meshData.positions.length * 12, // 3 floats * 4 bytes
    target: 34962, // ARRAY_BUFFER
  });
  byteOffset += meshData.positions.length * 12;

  // Normal buffer view
  if (includeNormals && meshData.normals.length > 0) {
    bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: meshData.normals.length * 12,
      target: 34962,
    });
    byteOffset += meshData.normals.length * 12;
  }

  // UV buffer view
  if (includeUVs && meshData.uvs.length > 0) {
    bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: meshData.uvs.length * 8, // 2 floats * 4 bytes
      target: 34962,
    });
    byteOffset += meshData.uvs.length * 8;
  }

  // Index buffer view
  if (meshData.indices.length > 0) {
    bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: meshData.indices.length * 2, // 16-bit indices
      target: 34963, // ELEMENT_ARRAY_BUFFER
    });
  }

  gltf.bufferViews = bufferViews;

  // Add accessors
  const accessors: Accessor[] = [];
  
  // Position accessor
  accessors.push({
    bufferView: 0,
    byteOffset: 0,
    componentType: 5126, // FLOAT
    count: meshData.positions.length / 3,
    type: 'VEC3',
    max: meshData.bounds.max,
    min: meshData.bounds.min,
  });

  // Normal accessor
  if (includeNormals && meshData.normals.length > 0) {
    accessors.push({
      bufferView: 1,
      byteOffset: 0,
      componentType: 5126,
      count: meshData.normals.length / 3,
      type: 'VEC3',
    });
  }

  // UV accessor
  if (includeUVs && meshData.uvs.length > 0) {
    const uvBufferViewIndex = includeNormals ? 2 : 1;
    accessors.push({
      bufferView: uvBufferViewIndex,
      byteOffset: 0,
      componentType: 5126,
      count: meshData.uvs.length / 2,
      type: 'VEC2',
    });
  }

  // Index accessor
  if (meshData.indices.length > 0) {
    const indexBufferViewIndex = (includeNormals ? 2 : 1) + (includeUVs ? 1 : 0);
    accessors.push({
      bufferView: indexBufferViewIndex,
      byteOffset: 0,
      componentType: 5123, // UNSIGNED_SHORT
      count: meshData.indices.length,
      type: 'SCALAR',
    });
  }

  gltf.accessors = accessors;

  // Add mesh
  const meshPrimitive: MeshPrimitive = {
    attributes: {
      POSITION: 0,
    },
  };

  let accessorIndex = 1;

  if (includeNormals && meshData.normals.length > 0) {
    meshPrimitive.attributes.NORMAL = accessorIndex++;
  }

  if (includeUVs && meshData.uvs.length > 0) {
    meshPrimitive.attributes.TEXCOORD_0 = accessorIndex++;
  }

  if (meshData.indices.length > 0) {
    meshPrimitive.indices = accessorIndex++;
  }

  gltf.meshes.push({
    primitives: [meshPrimitive],
  });

  // Add materials
  if (includeMaterials && materials.length > 0) {
    for (const material of materials) {
      const gltfMaterial: GLTFMaterial = {
        name: material.name,
        pbrMetallicRoughness: {
          baseColorFactor: material.color ? getVector3Components(material.color) : [0.8, 0.8, 0.8, 1.0],
          metallicFactor: material.metalness ?? 0.0,
          roughnessFactor: material.roughness ?? 0.5,
        },
      };

      if (material.transparent || (material.opacity !== undefined && material.opacity < 1.0)) {
        gltfMaterial.alphaMode = 'BLEND';
        if (material.opacity !== undefined) {
          gltfMaterial.pbrMetallicRoughness!.baseColorFactor![3] = material.opacity;
        }
      }

      gltf.materials.push(gltfMaterial);
    }

    // Assign first material to mesh
    if (gltf.materials.length > 0) {
      gltf.meshes[0].primitives[0].material = 0;
    }
  }

  return JSON.stringify(gltf, null, 2);
}

/**
 * Exports an EditableMesh to GLTF with binary buffer
 */
export function exportGLTFBinary(
  mesh: EditableMesh,
  options: GLTFExportOptions = {}
): ArrayBuffer {
  const gltfJson = exportGLTF(mesh, options);
  const jsonBuffer = new TextEncoder().encode(gltfJson);
  
  // Create binary buffer
  const meshData = prepareMeshData(mesh, { triangulate: options.triangulate ?? false });
  const bufferData = createBufferData(meshData, {
    includeUVs: options.includeUVs ?? true,
    includeNormals: options.includeNormals ?? true,
  });

  // Calculate total size
  const headerSize = 12;
  const jsonChunkSize = 8 + jsonBuffer.length;
  const binaryChunkSize = 8 + bufferData.byteLength;
  const totalSize = headerSize + jsonChunkSize + binaryChunkSize;

  // Create buffer
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // Write header
  view.setUint32(0, 0x46546C67, false); // "glTF"
  view.setUint32(4, 2, false); // Version
  view.setUint32(8, totalSize, false); // Length

  // Write JSON chunk
  let offset = headerSize;
  view.setUint32(offset, jsonBuffer.length, false); // Chunk length
  view.setUint32(offset + 4, 0x4E4F534A, false); // "JSON"
  new Uint8Array(buffer, offset + 8, jsonBuffer.length).set(jsonBuffer);
  offset += jsonChunkSize;

  // Write binary chunk
  view.setUint32(offset, bufferData.byteLength, false); // Chunk length
  view.setUint32(offset + 4, 0x004E4942, false); // "BIN"
  new Uint8Array(buffer, offset + 8, bufferData.byteLength).set(bufferData.buffer);

  return buffer;
}

/**
 * Helper function to prepare mesh data for export
 */
function prepareMeshData(mesh: EditableMesh, options: { triangulate: boolean }) {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const bounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };

  // Add vertices
  for (const vertex of mesh.vertices) {
    const pos = getVector3Components(vertex.position);
    positions.push(pos.x, pos.y, pos.z);
    
    // Update bounds
    bounds.min[0] = Math.min(bounds.min[0], pos.x);
    bounds.min[1] = Math.min(bounds.min[1], pos.y);
    bounds.min[2] = Math.min(bounds.min[2], pos.z);
    bounds.max[0] = Math.max(bounds.max[0], pos.x);
    bounds.max[1] = Math.max(bounds.max[1], pos.y);
    bounds.max[2] = Math.max(bounds.max[2], pos.z);
  }

  // Add UVs
  for (const uv of mesh.uvs) {
    const coords = getVector2Components(uv.position);
    uvs.push(coords.x, coords.y);
  }

  // Add faces
  for (const face of mesh.faces) {
    if (face.vertexIds.length < 3) continue;

    if (options.triangulate && face.vertexIds.length > 3) {
      // Triangulate n-gon
      for (let i = 1; i < face.vertexIds.length - 1; i++) {
        indices.push(face.vertexIds[0], face.vertexIds[i], face.vertexIds[i + 1]);
      }
    } else {
      // Add face as-is
      indices.push(...face.vertexIds);
    }

    // Calculate face normal
    if (face.vertexIds.length >= 3) {
      const v1 = mesh.getVertex(face.vertexIds[0])!.position;
      const v2 = mesh.getVertex(face.vertexIds[1])!.position;
      const v3 = mesh.getVertex(face.vertexIds[2])!.position;
      
      const edge1 = { x: v2.x - v1.x, y: v2.y - v1.y, z: v2.z - v1.z };
      const edge2 = { x: v3.x - v1.x, y: v3.y - v1.y, z: v3.z - v1.z };
      
      const normal = {
        x: edge1.y * edge2.z - edge1.z * edge2.y,
        y: edge1.z * edge2.x - edge1.x * edge2.z,
        z: edge1.x * edge2.y - edge1.y * edge2.x,
      };
      
      const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
      if (length > 0) {
        normal.x /= length;
        normal.y /= length;
        normal.z /= length;
      }
      
      // Add normal for each vertex of the face
      for (let i = 0; i < face.vertexIds.length; i++) {
        normals.push(normal.x, normal.y, normal.z);
      }
    }
  }

  return { positions, normals, uvs, indices, bounds };
}

/**
 * Helper function to create buffer data
 */
function createBufferData(meshData: any, options: { includeUVs: boolean; includeNormals: boolean }) {
  const buffers: number[] = [];
  
  // Add positions
  buffers.push(...meshData.positions);
  
  // Add normals
  if (options.includeNormals && meshData.normals.length > 0) {
    buffers.push(...meshData.normals);
  }
  
  // Add UVs
  if (options.includeUVs && meshData.uvs.length > 0) {
    buffers.push(...meshData.uvs);
  }
  
  // Add indices
  if (meshData.indices.length > 0) {
    buffers.push(...meshData.indices);
  }

  // Convert to Float32Array and then to base64
  const floatArray = new Float32Array(buffers);
  const uint8Array = new Uint8Array(floatArray.buffer);
  
  return {
    buffer: uint8Array,
    byteLength: uint8Array.length,
    base64: btoa(String.fromCharCode(...uint8Array)),
  };
}

/**
 * Helper function to safely access Vector3Like properties
 */
function getVector3Components(v: Vector3Like): { x: number; y: number; z: number } {
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
  if (v && typeof v === 'object' && 'x' in v && 'y' in v) {
    return { x: v.x, y: v.y };
  }
  return { x: 0, y: 0 };
}