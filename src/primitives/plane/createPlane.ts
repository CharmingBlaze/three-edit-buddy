import { EditableMesh } from '../../core/EditableMesh.js';
import { PrimitiveBuilder } from '../core/PrimitiveBuilder.js';
import { generateGridVertices, applyMaterial } from '../core/PrimitiveUtils.js';
import type { PlaneParams } from '../core/ParamTypes.js';
import { DEFAULT_PARAMS } from '../core/ParamTypes.js';

/**
 * Creates a plane mesh with customizable dimensions and segmentation
 * 
 * Features:
 * - All quad faces for easy editing
 * - Proper UV mapping
 * - Automatic vertex/edge deduplication
 * - Blender-like parameter naming
 * - Centered by default
 */
export function createPlane(params: PlaneParams = {}): EditableMesh {
  const {
    width = 1,
    height = 1,
    widthSegments = 1,
    heightSegments = 1,
    material,
    uvs
  } = { ...DEFAULT_PARAMS.plane, ...params };

  const mesh = new EditableMesh();
  const builder = new PrimitiveBuilder(mesh);
  
  // Generate grid vertices
  const vertices = generateGridVertices(width, height, widthSegments, heightSegments, true);
  
  // Add vertices to mesh
  const vertexIds: number[][] = [];
  for (let row = 0; row < vertices.length; row++) {
    const rowIds: number[] = [];
    for (let col = 0; col < vertices[row]!.length; col++) {
      const vertex = vertices[row]![col]!;
      const id = builder.addVertex(vertex, `plane-${row}-${col}`);
      rowIds.push(id);
    }
    vertexIds.push(rowIds);
  }
  
  // Create quad faces
  for (let row = 0; row < vertexIds.length - 1; row++) {
    for (let col = 0; col < vertexIds[row]!.length - 1; col++) {
      const v0 = vertexIds[row]![col]!;
      const v1 = vertexIds[row]![col + 1]!;
      const v2 = vertexIds[row + 1]![col + 1]!;
      const v3 = vertexIds[row + 1]![col]!;
      
      builder.addQuad([v0, v1, v2, v3], `plane-quad-${row}-${col}`);
    }
  }

  // Apply material
  applyMaterial(builder, material);

  // Apply UV coordinates if enabled
  if (uvs?.enabled !== false) {
    applyPlaneUVs(builder, vertexIds, uvs);
  }
  
  return mesh;
}

/**
 * Apply UV coordinates to plane vertices
 */
function applyPlaneUVs(
  builder: PrimitiveBuilder,
  vertexIds: number[][],
  uvs?: { scale?: { x: number; y: number }; offset?: { x: number; y: number } }
): void {
  const scale = uvs?.scale || { x: 1, y: 1 };
  const offset = uvs?.offset || { x: 0, y: 0 };
  const rows = vertexIds.length;
  const cols = vertexIds[0]?.length || 0;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const vertexId = vertexIds[row]?.[col];
      if (vertexId !== undefined) {
        const u = (col / (cols - 1)) * scale.x + offset.x;
        const v = (row / (rows - 1)) * scale.y + offset.y;
        builder.addUV(vertexId, u, v);
      }
    }
  }
} 