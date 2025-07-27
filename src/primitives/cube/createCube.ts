import { EditableMesh } from '../../core/EditableMesh.js';
import { PrimitiveBuilder } from '../core/PrimitiveBuilder.js';
import { applyMaterial } from '../core/PrimitiveUtils.js';
import type { CubeParams } from '../core/ParamTypes.js';
import { DEFAULT_PARAMS } from '../core/ParamTypes.js';

/**
 * Creates a cube mesh with customizable dimensions and segmentation
 * 
 * Features:
 * - All quad faces for easy editing
 * - Proper UV mapping for each face
 * - Automatic vertex/edge deduplication
 * - Blender-like parameter naming
 * - Shared vertices between faces for proper topology
 */
export function createCube(params: CubeParams = {}): EditableMesh {
  const {
    size = 1,
    width = size,
    height = size,
    depth = size,
    widthSegments = 1,
    heightSegments = 1,
    depthSegments = 1,
    material,
    uvs
  } = { ...DEFAULT_PARAMS.cube, ...params };

  const mesh = new EditableMesh();
  const builder = new PrimitiveBuilder(mesh);
  
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const halfDepth = depth / 2;
  
  // Create a unified vertex structure for the entire cube
  const vertexGrid = createCubeVertexGrid(
    width, height, depth,
    widthSegments, heightSegments, depthSegments,
    halfWidth, halfHeight, halfDepth,
    builder
  );
  
  // Create faces using the shared vertex grid
  createCubeFaces(vertexGrid, widthSegments, heightSegments, depthSegments, builder);
  
  // Apply material
  applyMaterial(builder, material);
  
  // Apply UVs if enabled
  if (uvs?.enabled !== false) {
    applyCubeUVs(builder, vertexGrid, widthSegments, heightSegments, depthSegments, uvs);
  }
  
  return mesh;
}

/**
 * Create a unified vertex grid for the entire cube
 * This ensures vertices are shared between faces
 */
function createCubeVertexGrid(
  width: number,
  height: number,
  depth: number,
  widthSegments: number,
  heightSegments: number,
  depthSegments: number,
  halfWidth: number,
  halfHeight: number,
  halfDepth: number,
  builder: PrimitiveBuilder
): {
  // 3D grid of vertex IDs: [x][y][z]
  vertices: number[][][];
  // Face vertex mappings
  front: number[][];
  back: number[][];
  left: number[][];
  right: number[][];
  top: number[][];
  bottom: number[][];
} {
  const vertices: number[][][] = [];
  
  // Create vertices for the entire cube grid
  for (let x = 0; x <= widthSegments; x++) {
    vertices[x] = [];
    for (let y = 0; y <= heightSegments; y++) {
      vertices[x]![y] = [];
      for (let z = 0; z <= depthSegments; z++) {
        const posX = (x / widthSegments - 0.5) * width;
        const posY = (y / heightSegments - 0.5) * height;
        const posZ = (z / depthSegments - 0.5) * depth;
        
        const vertexId = builder.addVertex(
          { x: posX, y: posY, z: posZ },
          `cube-${x}-${y}-${z}`
        );
        vertices[x]![y]![z] = vertexId;
      }
    }
  }
  
  // Create face vertex mappings
  const front: number[][] = [];  // z = depthSegments
  const back: number[][] = [];   // z = 0
  const left: number[][] = [];   // x = 0
  const right: number[][] = [];  // x = widthSegments
  const top: number[][] = [];    // y = heightSegments
  const bottom: number[][] = []; // y = 0
  
  // Front face (z = depthSegments)
  for (let y = 0; y <= heightSegments; y++) {
    front[y] = [];
    for (let x = 0; x <= widthSegments; x++) {
      front[y]![x] = vertices[x]![y]![depthSegments]!;
    }
  }
  
  // Back face (z = 0)
  for (let y = 0; y <= heightSegments; y++) {
    back[y] = [];
    for (let x = 0; x <= widthSegments; x++) {
      back[y]![x] = vertices[x]![y]![0]!;
    }
  }
  
  // Left face (x = 0)
  for (let y = 0; y <= heightSegments; y++) {
    left[y] = [];
    for (let z = 0; z <= depthSegments; z++) {
      left[y]![z] = vertices[0]![y]![z]!;
    }
  }
  
  // Right face (x = widthSegments)
  for (let y = 0; y <= heightSegments; y++) {
    right[y] = [];
    for (let z = 0; z <= depthSegments; z++) {
      right[y]![z] = vertices[widthSegments]![y]![z]!;
    }
  }
  
  // Top face (y = heightSegments)
  for (let z = 0; z <= depthSegments; z++) {
    top[z] = [];
    for (let x = 0; x <= widthSegments; x++) {
      top[z]![x] = vertices[x]![heightSegments]![z]!;
    }
  }
  
  // Bottom face (y = 0)
  for (let z = 0; z <= depthSegments; z++) {
    bottom[z] = [];
    for (let x = 0; x <= widthSegments; x++) {
      bottom[z]![x] = vertices[x]![0]![z]!;
    }
  }
  
  return { vertices, front, back, left, right, top, bottom };
}

/**
 * Create faces using the shared vertex grid
 */
function createCubeFaces(
  vertexGrid: {
    vertices: number[][][];
    front: number[][];
    back: number[][];
    left: number[][];
    right: number[][];
    top: number[][];
    bottom: number[][];
  },
  widthSegments: number,
  heightSegments: number,
  depthSegments: number,
  builder: PrimitiveBuilder
): void {
  // Create front face quads
  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < widthSegments; x++) {
      const v0 = vertexGrid.front[y]![x]!;
      const v1 = vertexGrid.front[y]![x + 1]!;
      const v2 = vertexGrid.front[y + 1]![x + 1]!;
      const v3 = vertexGrid.front[y + 1]![x]!;
      builder.addQuad([v0, v1, v2, v3], `front-${x}-${y}`);
    }
  }
  
  // Create back face quads (reverse winding for proper normal)
  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < widthSegments; x++) {
      const v0 = vertexGrid.back[y]![x]!;
      const v1 = vertexGrid.back[y]![x + 1]!;
      const v2 = vertexGrid.back[y + 1]![x + 1]!;
      const v3 = vertexGrid.back[y + 1]![x]!;
      builder.addQuad([v0, v3, v2, v1], `back-${x}-${y}`);
    }
  }
  
  // Create left face quads
  for (let y = 0; y < heightSegments; y++) {
    for (let z = 0; z < depthSegments; z++) {
      const v0 = vertexGrid.left[y]![z]!;
      const v1 = vertexGrid.left[y]![z + 1]!;
      const v2 = vertexGrid.left[y + 1]![z + 1]!;
      const v3 = vertexGrid.left[y + 1]![z]!;
      builder.addQuad([v0, v1, v2, v3], `left-${z}-${y}`);
    }
  }
  
  // Create right face quads (reverse winding for proper normal)
  for (let y = 0; y < heightSegments; y++) {
    for (let z = 0; z < depthSegments; z++) {
      const v0 = vertexGrid.right[y]![z]!;
      const v1 = vertexGrid.right[y]![z + 1]!;
      const v2 = vertexGrid.right[y + 1]![z + 1]!;
      const v3 = vertexGrid.right[y + 1]![z]!;
      builder.addQuad([v0, v3, v2, v1], `right-${z}-${y}`);
    }
  }
  
  // Create top face quads
  for (let z = 0; z < depthSegments; z++) {
    for (let x = 0; x < widthSegments; x++) {
      const v0 = vertexGrid.top[z]![x]!;
      const v1 = vertexGrid.top[z]![x + 1]!;
      const v2 = vertexGrid.top[z + 1]![x + 1]!;
      const v3 = vertexGrid.top[z + 1]![x]!;
      builder.addQuad([v0, v1, v2, v3], `top-${x}-${z}`);
    }
  }
  
  // Create bottom face quads (reverse winding for proper normal)
  for (let z = 0; z < depthSegments; z++) {
    for (let x = 0; x < widthSegments; x++) {
      const v0 = vertexGrid.bottom[z]![x]!;
      const v1 = vertexGrid.bottom[z]![x + 1]!;
      const v2 = vertexGrid.bottom[z + 1]![x + 1]!;
      const v3 = vertexGrid.bottom[z + 1]![x]!;
      builder.addQuad([v0, v3, v2, v1], `bottom-${x}-${z}`);
    }
  }
}

/**
 * Apply UV coordinates to cube faces
 */
function applyCubeUVs(
  builder: PrimitiveBuilder,
  vertexGrid: {
    vertices: number[][][];
    front: number[][];
    back: number[][];
    left: number[][];
    right: number[][];
    top: number[][];
    bottom: number[][];
  },
  widthSegments: number,
  heightSegments: number,
  depthSegments: number,
  uvs?: { scale?: { x: number; y: number }; offset?: { x: number; y: number } }
): void {
  const scale = uvs?.scale || { x: 1, y: 1 };
  const offset = uvs?.offset || { x: 0, y: 0 };
  
  // Apply UVs to each face
  applyFaceUVs(builder, vertexGrid.front, { x: 0, y: 0 }, scale, offset);
  applyFaceUVs(builder, vertexGrid.back, { x: 1, y: 0 }, scale, offset);
  applyFaceUVs(builder, vertexGrid.left, { x: 2, y: 0 }, scale, offset);
  applyFaceUVs(builder, vertexGrid.right, { x: 3, y: 0 }, scale, offset);
  applyFaceUVs(builder, vertexGrid.top, { x: 4, y: 0 }, scale, offset);
  applyFaceUVs(builder, vertexGrid.bottom, { x: 5, y: 0 }, scale, offset);
}

/**
 * Apply UV coordinates to a single face
 */
function applyFaceUVs(
  builder: PrimitiveBuilder,
  vertexIds: number[][],
  faceOffset: { x: number; y: number },
  scale: { x: number; y: number },
  globalOffset: { x: number; y: number }
): void {
  const rows = vertexIds.length;
  const cols = vertexIds[0]?.length || 0;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const vertexId = vertexIds[row]?.[col];
      if (vertexId !== undefined) {
        const u = (faceOffset.x + col / (cols - 1)) * scale.x + globalOffset.x;
        const v = (faceOffset.y + row / (rows - 1)) * scale.y + globalOffset.y;
        builder.addUV(vertexId, u, v);
      }
    }
  }
} 