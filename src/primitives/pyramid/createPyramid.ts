import { EditableMesh } from '../../core/EditableMesh.js';
import { PrimitiveBuilder } from '../core/PrimitiveBuilder.js';
import { applyMaterial } from '../core/PrimitiveUtils.js';
import type { PyramidParams } from '../core/ParamTypes.js';
import { DEFAULT_PARAMS } from '../core/ParamTypes.js';

/**
 * Creates a pyramid mesh with customizable dimensions
 * 
 * Features:
 * - Square base with triangular sides
 * - All triangular faces for simplicity
 * - Proper UV mapping
 * - Automatic vertex/edge deduplication
 * - Blender-like parameter naming
 */
export function createPyramid(params: PyramidParams = {}): EditableMesh {
  const {
    size = 1,
    height = 1,
    segments = 4,
    material,
    uvs
  } = { ...DEFAULT_PARAMS.pyramid, ...params };

  const mesh = new EditableMesh();
  const builder = new PrimitiveBuilder(mesh);
  
  const halfSize = size / 2;
  const halfHeight = height / 2;
  
  // Add apex vertex (top point of pyramid)
  const apexId = builder.addVertex({ x: 0, y: halfHeight, z: 0 }, 'pyramid-apex');
  
  // Add base center vertex
  const baseCenterId = builder.addVertex({ x: 0, y: -halfHeight, z: 0 }, 'pyramid-base-center');
  
  // Add base corner vertices
  const baseCornerIds: number[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    const x = halfSize * Math.cos(angle);
    const z = halfSize * Math.sin(angle);
    
    baseCornerIds.push(builder.addVertex(
      { x, y: -halfHeight, z },
      `pyramid-base-corner-${i}`
    ));
  }
  
  // Create side faces (triangles from apex to base)
  for (let i = 0; i < segments; i++) {
    const v0 = apexId;
    const v1 = baseCornerIds[i]!;
    const v2 = baseCornerIds[(i + 1) % segments]!;
    
    builder.addTriangle([v0, v1, v2], `pyramid-side-${i}`);
  }
  
  // Create base cap (triangles from center to corners)
  for (let i = 0; i < segments; i++) {
    builder.addTriangle([
      baseCenterId,
      baseCornerIds[(i + 1) % segments]!,
      baseCornerIds[i]!
    ], `pyramid-base-cap-${i}`);
  }

  // Apply material
  applyMaterial(builder, material);

  // Apply UV coordinates if enabled
  if (uvs?.enabled !== false) {
    applyPyramidUVs(builder, apexId, baseCornerIds, baseCenterId, uvs);
  }
  
  return mesh;
}

/**
 * Apply UV coordinates to pyramid vertices
 */
function applyPyramidUVs(
  builder: PrimitiveBuilder,
  apexId: number,
  baseCornerIds: number[],
  baseCenterId: number,
  uvs?: { scale?: { x: number; y: number }; offset?: { x: number; y: number } }
): void {
  const scale = uvs?.scale || { x: 1, y: 1 };
  const offset = uvs?.offset || { x: 0, y: 0 };
  
  // Apex vertex gets UV (0.5, 1)
  builder.addUV(apexId, 0.5 * scale.x + offset.x, 1 * scale.y + offset.y);
  
  // Base corner vertices get UVs in a square pattern
  for (let i = 0; i < baseCornerIds.length; i++) {
    const u = (i / baseCornerIds.length) * scale.x + offset.x;
    const v = 0 * scale.y + offset.y;
    builder.addUV(baseCornerIds[i]!, u, v);
  }
  
  // Base center vertex
  builder.addUV(baseCenterId, 0.5 * scale.x + offset.x, 0.5 * scale.y + offset.y);
} 