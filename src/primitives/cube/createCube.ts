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
  
  // Generate vertices for each face
  const frontVertices = generateFaceVertices(width, height, widthSegments, heightSegments, { x: 0, y: 0, z: halfDepth });
  const backVertices = generateFaceVertices(width, height, widthSegments, heightSegments, { x: 0, y: 0, z: -halfDepth }, Math.PI);
  const leftVertices = generateFaceVertices(depth, height, depthSegments, heightSegments, { x: -halfWidth, y: 0, z: 0 }, Math.PI / 2);
  const rightVertices = generateFaceVertices(depth, height, depthSegments, heightSegments, { x: halfWidth, y: 0, z: 0 }, -Math.PI / 2);
  const topVertices = generateFaceVertices(width, depth, widthSegments, depthSegments, { x: 0, y: halfHeight, z: 0 }, -Math.PI / 2);
  const bottomVertices = generateFaceVertices(width, depth, widthSegments, depthSegments, { x: 0, y: -halfHeight, z: 0 }, Math.PI / 2);
  
  // Add vertices to mesh
  const frontIds = addVerticesToMesh(builder, frontVertices, 'front');
  const backIds = addVerticesToMesh(builder, backVertices, 'back');
  const leftIds = addVerticesToMesh(builder, leftVertices, 'left');
  const rightIds = addVerticesToMesh(builder, rightVertices, 'right');
  const topIds = addVerticesToMesh(builder, topVertices, 'top');
  const bottomIds = addVerticesToMesh(builder, bottomVertices, 'bottom');
  
  // Create faces
  createFaceQuads(builder, frontIds, 'front');
  createFaceQuads(builder, backIds, 'back');
  createFaceQuads(builder, leftIds, 'left');
  createFaceQuads(builder, rightIds, 'right');
  createFaceQuads(builder, topIds, 'top');
  createFaceQuads(builder, bottomIds, 'bottom');
  
  // Apply material
  applyMaterial(builder, material);
  
  // Apply UVs if enabled
  if (uvs?.enabled !== false) {
    applyCubeUVs(builder, frontIds, backIds, leftIds, rightIds, topIds, bottomIds, uvs);
  }
  
  return mesh;
}

/**
 * Generate vertices for a face with optional rotation
 */
function generateFaceVertices(
  width: number, 
  height: number, 
  widthSegments: number, 
  heightSegments: number,
  center: { x: number; y: number; z: number },
  rotationY: number = 0
): { x: number; y: number; z: number }[][] {
  const vertices: { x: number; y: number; z: number }[][] = [];
  const widthStep = width / widthSegments;
  const heightStep = height / heightSegments;
  
  for (let row = 0; row <= heightSegments; row++) {
    const rowVertices: { x: number; y: number; z: number }[] = [];
    for (let col = 0; col <= widthSegments; col++) {
      const x = (col - widthSegments / 2) * widthStep;
      const y = (row - heightSegments / 2) * heightStep;
      
      // Apply rotation
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);
      const rotatedX = x * cosY - 0 * sinY;
      const rotatedZ = x * sinY + 0 * cosY;
      
      rowVertices.push({
        x: center.x + rotatedX,
        y: center.y + y,
        z: center.z + rotatedZ
      });
    }
    vertices.push(rowVertices);
  }
  
  return vertices;
}

/**
 * Add vertices to mesh and return their IDs
 */
function addVerticesToMesh(
  builder: PrimitiveBuilder, 
  vertices: { x: number; y: number; z: number }[][], 
  prefix: string
): number[][] {
  const ids: number[][] = [];
  
  for (let row = 0; row < vertices.length; row++) {
    const rowIds: number[] = [];
    for (let col = 0; col < vertices[row]!.length; col++) {
      const vertex = vertices[row]![col]!;
      const id = builder.addVertex(vertex, `${prefix}-${row}-${col}`);
      rowIds.push(id);
    }
    ids.push(rowIds);
  }
  
  return ids;
}

/**
 * Create quad faces from a grid of vertex IDs
 */
function createFaceQuads(builder: PrimitiveBuilder, vertexIds: number[][], prefix: string): void {
  for (let row = 0; row < vertexIds.length - 1; row++) {
    for (let col = 0; col < vertexIds[row]!.length - 1; col++) {
      const v0 = vertexIds[row]![col]!;
      const v1 = vertexIds[row]![col + 1]!;
      const v2 = vertexIds[row + 1]![col + 1]!;
      const v3 = vertexIds[row + 1]![col]!;
      
      builder.addQuad([v0, v1, v2, v3], `${prefix}-quad-${row}-${col}`);
    }
  }
}

/**
 * Apply UV coordinates to cube faces
 */
function applyCubeUVs(
  builder: PrimitiveBuilder,
  frontIds: number[][],
  backIds: number[][],
  leftIds: number[][],
  rightIds: number[][],
  topIds: number[][],
  bottomIds: number[][],
  uvs?: { scale?: { x: number; y: number }; offset?: { x: number; y: number } }
): void {
  const scale = uvs?.scale || { x: 1, y: 1 };
  const offset = uvs?.offset || { x: 0, y: 0 };
  
  // Apply UVs to each face
  applyFaceUVs(builder, frontIds, { x: 0, y: 0 }, scale, offset);
  applyFaceUVs(builder, backIds, { x: 1, y: 0 }, scale, offset);
  applyFaceUVs(builder, leftIds, { x: 2, y: 0 }, scale, offset);
  applyFaceUVs(builder, rightIds, { x: 3, y: 0 }, scale, offset);
  applyFaceUVs(builder, topIds, { x: 4, y: 0 }, scale, offset);
  applyFaceUVs(builder, bottomIds, { x: 5, y: 0 }, scale, offset);
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