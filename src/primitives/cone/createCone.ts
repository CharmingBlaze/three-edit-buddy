import { EditableMesh } from '../../core/EditableMesh.js';
import { PrimitiveBuilder } from '../core/PrimitiveBuilder.js';
import { generateCircleVertices, applyMaterial } from '../core/PrimitiveUtils.js';
import type { ConeParams } from '../core/ParamTypes.js';
import { DEFAULT_PARAMS } from '../core/ParamTypes.js';

/**
 * Creates a cone mesh with customizable dimensions and segmentation
 * 
 * Features:
 * - Triangles for sides and base
 * - Optional open-ended cones
 * - Proper UV mapping
 * - Automatic vertex/edge deduplication
 * - Blender-like parameter naming
 */
export function createCone(params: ConeParams = {}): EditableMesh {
  const {
    radiusBottom = 1,
    height = 2,
    radialSegments = 8,
    heightSegments = 1,
    openEnded = false,
    thetaStart = 0,
    thetaLength = Math.PI * 2,
    material,
    uvs
  } = { ...DEFAULT_PARAMS.cone, ...params };

  const mesh = new EditableMesh();
  const builder = new PrimitiveBuilder(mesh);
  
  const halfHeight = height / 2;
  
  // Generate circle vertices for base
  const baseVertices = generateCircleVertices(radiusBottom, radialSegments, thetaStart, thetaLength);
  
  // Add apex vertex (top point of cone)
  const apexId = builder.addVertex({ x: 0, y: halfHeight, z: 0 }, 'cone-apex');
  
  // Add base center vertex if not open-ended
  let baseCenterId: number | undefined;
  if (!openEnded) {
    baseCenterId = builder.addVertex({ x: 0, y: -halfHeight, z: 0 }, 'cone-base-center');
  }
  
  // Add base ring vertices
  const baseRingIds: number[] = [];
  for (let i = 0; i <= radialSegments; i++) {
    const baseVertex = baseVertices[i]!;
    baseRingIds.push(builder.addVertex(
      { x: baseVertex.x, y: -halfHeight, z: baseVertex.z },
      `cone-base-${i}`
    ));
  }
  
  // Create side faces (triangles from apex to base)
  for (let i = 0; i < radialSegments; i++) {
    const v0 = apexId;
    const v1 = baseRingIds[i]!;
    const v2 = baseRingIds[i + 1]!;
    
    builder.addTriangle([v0, v1, v2], `cone-side-${i}`);
  }
  
  // Create base cap if not open-ended
  if (!openEnded && baseCenterId !== undefined) {
    // Base cap (reverse winding for proper normal direction)
    for (let i = 0; i < radialSegments; i++) {
      builder.addTriangle([
        baseCenterId,
        baseRingIds[i + 1]!,
        baseRingIds[i]!
      ], `cone-base-cap-${i}`);
    }
  }

  // Apply material
  applyMaterial(builder, material);

  // Apply UV coordinates if enabled
  if (uvs?.enabled !== false) {
    applyConeUVs(builder, apexId, baseRingIds, baseCenterId, uvs);
  }
  
  return mesh;
}

/**
 * Apply UV coordinates to cone vertices
 */
function applyConeUVs(
  builder: PrimitiveBuilder,
  apexId: number,
  baseRingIds: number[],
  baseCenterId: number | undefined,
  uvs?: { scale?: { x: number; y: number }; offset?: { x: number; y: number } }
): void {
  const scale = uvs?.scale || { x: 1, y: 1 };
  const offset = uvs?.offset || { x: 0, y: 0 };
  
  // Apex vertex gets UV (0.5, 1)
  builder.addUV(apexId, 0.5 * scale.x + offset.x, 1 * scale.y + offset.y);
  
  // Base ring vertices get UVs in a circle
  for (let i = 0; i < baseRingIds.length; i++) {
    const angle = (i / (baseRingIds.length - 1)) * 2 * Math.PI;
    const u = (Math.cos(angle) * 0.5 + 0.5) * scale.x + offset.x;
    const v = (Math.sin(angle) * 0.5 + 0.5) * scale.y + offset.y;
    builder.addUV(baseRingIds[i]!, u, v);
  }
  
  // Base center vertex if it exists
  if (baseCenterId !== undefined) {
    builder.addUV(baseCenterId, 0.5 * scale.x + offset.x, 0.5 * scale.y + offset.y);
  }
} 