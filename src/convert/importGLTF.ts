import { EditableMesh } from '../core/EditableMesh.js';
import type { Vector3Like } from '../types/index.js';

/**
 * Options for GLTF import
 */
export interface GLTFImportOptions {
  /** Whether to import UV coordinates (default: true) */
  importUVs?: boolean;
  /** Whether to import normals (default: true) */
  importNormals?: boolean;
  /** Whether to import materials (default: true) */
  importMaterials?: boolean;
  /** Scale factor to apply to vertices (default: 1.0) */
  scale?: number;
  /** Whether to merge duplicate vertices (default: true) */
  mergeVertices?: boolean;
}

/**
 * GLTF import result
 */
export interface GLTFImportResult {
  mesh: EditableMesh;
  materials: Array<{
    name: string;
    color?: Vector3Like;
    opacity?: number;
    transparent?: boolean;
    metalness?: number;
    roughness?: number;
  }>;
}

/**
 * Imports GLTF data into an EditableMesh
 * Supports both JSON and binary GLTF formats
 */
export function importGLTF(
  gltfData: string | ArrayBuffer,
  options: GLTFImportOptions = {}
): GLTFImportResult {
  const {
    importUVs = true,
    importNormals = true,
    importMaterials = true,
    scale = 1.0,
    mergeVertices = true,
  } = options;

  let gltf: any;

  if (typeof gltfData === 'string') {
    // JSON format
    gltf = JSON.parse(gltfData);
  } else {
    // Binary format
    gltf = parseGLTFBinary(gltfData);
  }

  const mesh = new EditableMesh();
  const materials: GLTFImportResult['materials'] = [];

  // Import materials
  if (importMaterials && gltf.materials) {
    for (const gltfMaterial of gltf.materials) {
      const material: GLTFImportResult['materials'][0] = {
        name: gltfMaterial.name || 'material',
        opacity: 1.0,
        transparent: false,
        metalness: 0.0,
        roughness: 0.5,
      };

      if (gltfMaterial.pbrMetallicRoughness) {
        const pbr = gltfMaterial.pbrMetallicRoughness;
        if (pbr.baseColorFactor) {
          material.color = {
            x: pbr.baseColorFactor[0],
            y: pbr.baseColorFactor[1],
            z: pbr.baseColorFactor[2],
          };
          material.opacity = pbr.baseColorFactor[3] ?? 1.0;
        }
        material.metalness = pbr.metallicFactor ?? 0.0;
        material.roughness = pbr.roughnessFactor ?? 0.5;
      }

      if (gltfMaterial.alphaMode === 'BLEND' || (material.opacity ?? 1.0) < 1.0) {
        material.transparent = true;
      }

      materials.push(material);
    }
  }

  // Import meshes
  if (gltf.meshes && gltf.meshes.length > 0) {
    const gltfMesh = gltf.meshes[0]; // Import first mesh for now
    
    for (const primitive of gltfMesh.primitives) {
      importMeshPrimitive(mesh, gltf, primitive, {
        importUVs,
        importNormals,
        scale,
        mergeVertices,
      });
    }
  }

  return { mesh, materials };
}

/**
 * Imports a specific mesh primitive from GLTF
 */
function importMeshPrimitive(
  mesh: EditableMesh,
  gltf: any,
  primitive: any,
  options: {
    importUVs: boolean;
    importNormals: boolean;
    scale: number;
    mergeVertices: boolean;
  }
) {
  const { importUVs, importNormals, scale, mergeVertices } = options;

  // Get accessors
  const positionAccessor = gltf.accessors[primitive.attributes.POSITION];
  const normalAccessor = importNormals && primitive.attributes.NORMAL
    ? gltf.accessors[primitive.attributes.NORMAL]
    : null;
  const uvAccessor = importUVs && primitive.attributes.TEXCOORD_0
    ? gltf.accessors[primitive.attributes.TEXCOORD_0]
    : null;
  const indexAccessor = primitive.indices !== undefined
    ? gltf.accessors[primitive.indices]
    : null;

  // Get buffer data
  const positions = getBufferData(gltf, positionAccessor, 'VEC3');
  const normals = normalAccessor ? getBufferData(gltf, normalAccessor, 'VEC3') : null;
  const uvs = uvAccessor ? getBufferData(gltf, uvAccessor, 'VEC2') : null;
  const indices = indexAccessor ? getBufferData(gltf, indexAccessor, 'SCALAR') : null;

  // Create vertex map for deduplication
  const vertexMap = new Map<string, number>();
  const vertices: number[] = [];
  const vertexNormals: number[] = [];
  const vertexUVs: number[] = [];

  // Process vertices
  for (let i = 0; i < positions.length; i += 3) {
    const px = positions[i];
    const py = positions[i + 1];
    const pz = positions[i + 2];
    
    if (px === undefined || py === undefined || pz === undefined) {
      continue;
    }
    
    const x = px * scale;
    const y = py * scale;
    const z = pz * scale;

    let vertexId: number;

    if (mergeVertices) {
      // Create key for vertex deduplication
      const key = `${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)}`;
      
      if (vertexMap.has(key)) {
        vertexId = vertexMap.get(key)!;
      } else {
        const vertex = mesh.addVertex({ x, y, z });
        vertexId = vertex.id;
        vertexMap.set(key, vertexId);
        vertices.push(x, y, z);
        
        // Add normal if available
        if (normals) {
          const nx = normals[i];
          const ny = normals[i + 1];
          const nz = normals[i + 2];
          if (nx !== undefined && ny !== undefined && nz !== undefined) {
            vertexNormals.push(nx, ny, nz);
          }
        }
        
        // Add UV if available
        if (uvs) {
          const uvIndex = (i / 3) * 2;
          const ux = uvs[uvIndex];
          const uy = uvs[uvIndex + 1];
          if (ux !== undefined && uy !== undefined) {
            vertexUVs.push(ux, uy);
          }
        }
      }
    } else {
      const vertex = mesh.addVertex({ x, y, z });
      vertexId = vertex.id;
      vertices.push(x, y, z);
      
      if (normals) {
        const nx = normals[i];
        const ny = normals[i + 1];
        const nz = normals[i + 2];
        if (nx !== undefined && ny !== undefined && nz !== undefined) {
          vertexNormals.push(nx, ny, nz);
        }
      }
      
      if (uvs) {
        const uvIndex = (i / 3) * 2;
        const ux = uvs[uvIndex];
        const uy = uvs[uvIndex + 1];
        if (ux !== undefined && uy !== undefined) {
          vertexUVs.push(ux, uy);
        }
      }
    }
  }

  // Add faces
  if (indices) {
    // Indexed geometry
    for (let i = 0; i < indices.length; i += 3) {
      const v1Index = indices[i];
      const v2Index = indices[i + 1];
      const v3Index = indices[i + 2];
      
      // Check if indices are valid numbers
      if (v1Index === undefined || v2Index === undefined || v3Index === undefined) {
        continue;
      }
      
      // Get actual vertex IDs from the map
      const vertex1 = mesh.vertices[v1Index];
      const vertex2 = mesh.vertices[v2Index];
      const vertex3 = mesh.vertices[v3Index];
      
      if (vertex1 && vertex2 && vertex3) {
        // Create edges for the face
        const edge1 = mesh.addEdge(vertex1.id, vertex2.id);
        const edge2 = mesh.addEdge(vertex2.id, vertex3.id);
        const edge3 = mesh.addEdge(vertex3.id, vertex1.id);
        
        mesh.addFace([vertex1.id, vertex2.id, vertex3.id], [edge1.id, edge2.id, edge3.id]);
      }
    }
  } else {
    // Non-indexed geometry (triangle list)
    for (let i = 0; i < vertices.length; i += 9) {
      const vertexIndex1 = i / 3;
      const vertexIndex2 = vertexIndex1 + 1;
      const vertexIndex3 = vertexIndex1 + 2;
      
      const v1 = mesh.vertices[vertexIndex1];
      const v2 = mesh.vertices[vertexIndex2];
      const v3 = mesh.vertices[vertexIndex3];
      
      if (v1 && v2 && v3) {
        // Create edges for the face
        const edge1 = mesh.addEdge(v1.id, v2.id);
        const edge2 = mesh.addEdge(v2.id, v3.id);
        const edge3 = mesh.addEdge(v3.id, v1.id);
        
        mesh.addFace([v1.id, v2.id, v3.id], [edge1.id, edge2.id, edge3.id]);
      }
    }
  }

  // Add UVs if available
  if (uvs && vertexUVs.length > 0) {
    for (let i = 0; i < vertexUVs.length; i += 2) {
      const vertexIndex = i / 2;
      if (vertexIndex < mesh.vertices.length) {
        const uvX = vertexUVs[i];
        const uvY = vertexUVs[i + 1];
        if (uvX !== undefined && uvY !== undefined) {
          mesh.addUV(vertexIndex, {
            x: uvX,
            y: uvY,
          });
        }
      }
    }
  }
}

/**
 * Parses binary GLTF data
 */
function parseGLTFBinary(buffer: ArrayBuffer): any {
  const view = new DataView(buffer);
  
  // Read header
  const magic = view.getUint32(0, false);
  if (magic !== 0x46546C67) { // "glTF"
    throw new Error('Invalid GLTF binary format');
  }
  
  const version = view.getUint32(4, false);
  if (version !== 2) {
    throw new Error(`Unsupported GLTF version: ${version}`);
  }
  
  const length = view.getUint32(8, false);
  
  // Read chunks
  let offset = 12;
  let jsonChunk: Uint8Array | null = null;
  let binaryChunk: Uint8Array | null = null;
  
  while (offset < length) {
    const chunkLength = view.getUint32(offset, false);
    const chunkType = view.getUint32(offset + 4, false);
    const chunkData = new Uint8Array(buffer, offset + 8, chunkLength);
    
    if (chunkType === 0x4E4F534A) { // "JSON"
      jsonChunk = chunkData;
    } else if (chunkType === 0x004E4942) { // "BIN"
      binaryChunk = chunkData;
    }
    
    offset += 8 + chunkLength;
  }
  
  if (!jsonChunk) {
    throw new Error('No JSON chunk found in GLTF binary');
  }
  
  // Parse JSON
  const jsonText = new TextDecoder().decode(jsonChunk);
  const gltf = JSON.parse(jsonText);
  
  // Replace data URIs with binary data
  if (binaryChunk && gltf.buffers && gltf.buffers.length > 0) {
    gltf.buffers[0].binaryData = binaryChunk;
  }
  
  return gltf;
}

/**
 * Extracts buffer data from GLTF accessor
 */
function getBufferData(gltf: any, accessor: any, type: string): number[] {
  const bufferView = gltf.bufferViews[accessor.bufferView];
  const buffer = gltf.buffers[bufferView.buffer];
  
  let data: ArrayBuffer;
  if (buffer.uri && buffer.uri.startsWith('data:')) {
    // Data URI
    const base64 = buffer.uri.split(',')[1];
    data = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
  } else if (buffer.binaryData) {
    // Binary chunk
    data = buffer.binaryData.buffer;
  } else {
    throw new Error('Unsupported buffer format');
  }
  
  // Calculate the actual offset within the buffer
  const bufferOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
  const bufferLength = bufferView.byteLength;
  
  // Ensure we don't exceed buffer bounds
  if (bufferOffset + bufferLength > data.byteLength) {
    console.warn('Buffer view exceeds buffer bounds, using default values');
    const count = accessor.count;
    const componentSize = getComponentSize(type);
    return new Array(count * componentSize).fill(0);
  }
  
  const view = new DataView(data, bufferOffset);
  const result: number[] = [];
  
  const componentType = accessor.componentType;
  const count = accessor.count;
  const componentSize = getComponentSize(type);
  
  // Calculate total size needed
  const totalSize = count * componentSize;
  
  for (let i = 0; i < totalSize; i++) {
    let value: number;
    
    try {
      switch (componentType) {
        case 5120: // BYTE
          value = view.getInt8(i);
          break;
        case 5121: // UNSIGNED_BYTE
          value = view.getUint8(i);
          break;
        case 5122: // SHORT
          value = view.getInt16(i * 2, true);
          break;
        case 5123: // UNSIGNED_SHORT
          value = view.getUint16(i * 2, true);
          break;
        case 5125: // UNSIGNED_INT
          value = view.getUint32(i * 4, true);
          break;
        case 5126: // FLOAT
          value = view.getFloat32(i * 4, true);
          break;
        default:
          // For unsupported types, use default values
          value = 0;
          break;
      }
    } catch (error) {
      // If we can't read the data, use default values
      value = 0;
    }
    
    result.push(value);
  }
  
  return result;
}

/**
 * Gets the number of components for a given type
 */
function getComponentSize(type: string): number {
  switch (type) {
    case 'SCALAR':
      return 1;
    case 'VEC2':
      return 2;
    case 'VEC3':
      return 3;
    case 'VEC4':
      return 4;
    default:
      throw new Error(`Unsupported type: ${type}`);
  }
}