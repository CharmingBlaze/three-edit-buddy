import { EditableMesh } from '../../core/EditableMesh.js';
import { PrimitiveBuilder } from '../core/PrimitiveBuilder.js';
import { generateCircleVertices, applyMaterial } from '../core/PrimitiveUtils.js';
import type { CylinderParams } from '../core/ParamTypes.js';
import { DEFAULT_PARAMS } from '../core/ParamTypes.js';

/**
 * Creates a cylinder mesh with customizable dimensions and segmentation
 * 
 * Features:
 * - Quads for the body, triangles for caps
 * - Optional open-ended cylinders
 * - Proper UV mapping
 * - Automatic vertex/edge deduplication
 * - Support for different top/bottom radii
 */
export function createCylinder(params: CylinderParams = {}): EditableMesh {
  const {
    radiusTop = 1,
    radiusBottom = 1,
    height = 2,
    radialSegments = 8,
    heightSegments = 1,
    openEnded = false,
    thetaStart = 0,
    thetaLength = Math.PI * 2,
    material,
    uvs
  } = { ...DEFAULT_PARAMS.cylinder, ...params };

  const mesh = new EditableMesh();
  const builder = new PrimitiveBuilder(mesh);
  
  const halfHeight = height / 2;
  
  // Generate circle vertices for top and bottom
  const topVertices = generateCircleVertices(radiusTop, radialSegments, thetaStart, thetaLength);
  const bottomVertices = generateCircleVertices(radiusBottom, radialSegments, thetaStart, thetaLength);
  
  // Add center vertices for caps if not open-ended
  let topCenterId: number | undefined;
  let bottomCenterId: number | undefined;
  
  if (!openEnded) {
    topCenterId = builder.addVertex({ x: 0, y: halfHeight, z: 0 }, 'cylinder-top-center');
    bottomCenterId = builder.addVertex({ x: 0, y: -halfHeight, z: 0 }, 'cylinder-bottom-center');
  }
  
  // Add ring vertices
  const topRingIds: number[] = [];
  const bottomRingIds: number[] = [];
  
  for (let i = 0; i <= radialSegments; i++) {
    const topVertex = topVertices[i]!;
    const bottomVertex = bottomVertices[i]!;
    
    topRingIds.push(builder.addVertex(
      { x: topVertex.x, y: halfHeight, z: topVertex.z },
      `cylinder-top-${i}`
    ));
    
    bottomRingIds.push(builder.addVertex(
      { x: bottomVertex.x, y: -halfHeight, z: bottomVertex.z },
      `cylinder-bottom-${i}`
    ));
  }
  
  // Create side faces (quads)
  for (let i = 0; i < radialSegments; i++) {
    const v0 = bottomRingIds[i]!;
    const v1 = bottomRingIds[i + 1]!;
    const v2 = topRingIds[i + 1]!;
    const v3 = topRingIds[i]!;
    
    builder.addQuad([v0, v1, v2, v3], `cylinder-side-${i}`);
  }
  
  // Create caps if not open-ended
  if (!openEnded) {
    // Top cap
    if (topCenterId !== undefined) {
      for (let i = 0; i < radialSegments; i++) {
        builder.addTriangle([
          topCenterId,
          topRingIds[i]!,
          topRingIds[i + 1]!
        ], `cylinder-top-cap-${i}`);
      }
    }
    
    // Bottom cap (reverse winding for proper normal direction)
    if (bottomCenterId !== undefined) {
      for (let i = 0; i < radialSegments; i++) {
        builder.addTriangle([
          bottomCenterId,
          bottomRingIds[i + 1]!,
          bottomRingIds[i]!
        ], `cylinder-bottom-cap-${i}`);
      }
    }
  }

  // Apply material
  applyMaterial(builder, material);

  // Apply UV coordinates if enabled
  if (uvs?.enabled !== false) {
    applyCylinderUVs(builder, topRingIds, bottomRingIds, topCenterId, bottomCenterId, uvs);
  }
  
  return mesh;
}

/**
 * Apply UV coordinates to cylinder vertices
 */
function applyCylinderUVs(
  builder: PrimitiveBuilder,
  topRingIds: number[],
  bottomRingIds: number[],
  topCenterId: number | undefined,
  bottomCenterId: number | undefined,
  uvs?: { scale?: { x: number; y: number }; offset?: { x: number; y: number } }
): void {
  const scale = uvs?.scale || { x: 1, y: 1 };
  const offset = uvs?.offset || { x: 0, y: 0 };
  
  // Apply UVs to ring vertices (cylindrical mapping)
  for (let i = 0; i < topRingIds.length; i++) {
    const u = (i / (topRingIds.length - 1)) * scale.x + offset.x;
    
    // Top ring
    builder.addUV(topRingIds[i]!, u, 1 * scale.y + offset.y);
    
    // Bottom ring
    builder.addUV(bottomRingIds[i]!, u, 0 * scale.y + offset.y);
  }
  
  // Apply UVs to center vertices if they exist
  if (topCenterId !== undefined) {
    builder.addUV(topCenterId, 0.5 * scale.x + offset.x, 1 * scale.y + offset.y);
  }
  
  if (bottomCenterId !== undefined) {
    builder.addUV(bottomCenterId, 0.5 * scale.x + offset.x, 0 * scale.y + offset.y);
  }
} 