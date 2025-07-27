import { EditableMesh } from '../../core/EditableMesh.js';
import { PrimitiveBuilder } from '../core/PrimitiveBuilder.js';
import { applyMaterial } from '../core/PrimitiveUtils.js';
import type { SphereParams } from '../core/ParamTypes.js';
import { DEFAULT_PARAMS } from '../core/ParamTypes.js';

/**
 * Creates a sphere mesh with customizable radius and segmentation
 * 
 * Features:
 * - UV sphere topology (like Blender)
 * - Quads for the body, triangles for poles
 * - Proper UV mapping
 * - Automatic vertex/edge deduplication
 * - Support for partial spheres
 */
export function createSphere(params: SphereParams = {}): EditableMesh {
  const {
    radius = 1,
    widthSegments = 8,
    heightSegments = 6,
    phiStart = 0,
    phiLength = Math.PI * 2,
    thetaStart = 0,
    thetaLength = Math.PI,
    material,
    uvs
  } = { ...DEFAULT_PARAMS.sphere, ...params };

  const mesh = new EditableMesh();
  const builder = new PrimitiveBuilder(mesh);
  
  // Generate vertex positions
  const vertexIds: number[][] = [];
  const positions: { x: number; y: number; z: number }[][] = [];
  
  // Create vertices
  for (let y = 0; y <= heightSegments; y++) {
    const row: number[] = [];
    const posRow: { x: number; y: number; z: number }[] = [];
    const theta = thetaStart + (y / heightSegments) * thetaLength;
    
    for (let x = 0; x <= widthSegments; x++) {
      const phi = phiStart + (x / widthSegments) * phiLength;
      
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      
      const vertexX = radius * sinTheta * cosPhi;
      const vertexY = radius * cosTheta;
      const vertexZ = radius * sinTheta * sinPhi;
      
      const position = { x: vertexX, y: vertexY, z: vertexZ };
      const vertexId = builder.addVertex(position, `sphere-${y}-${x}`);
      row.push(vertexId);
      posRow.push(position);
    }
    vertexIds.push(row);
    positions.push(posRow);
  }
  
  // Create faces
  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < widthSegments; x++) {
      const v0 = vertexIds[y]?.[x];
      const v1 = vertexIds[y]?.[x + 1];
      const v2 = vertexIds[y + 1]?.[x + 1];
      const v3 = vertexIds[y + 1]?.[x];
      
      if (v0 !== undefined && v1 !== undefined && v2 !== undefined && v3 !== undefined) {
        // Use triangles for poles (first and last rows)
        if (y === 0) {
          // South pole - create triangle
          if (v0 !== v1 && v1 !== v2 && v2 !== v0) {
            builder.addTriangle([v0, v2, v1], `sphere-pole-south-${x}`);
          }
        } else if (y === heightSegments - 1) {
          // North pole - create triangle
          if (v0 !== v2 && v2 !== v1 && v1 !== v0) {
            builder.addTriangle([v0, v1, v2], `sphere-pole-north-${x}`);
          }
        } else {
          // Middle rows - create quads
          builder.addQuad([v0, v1, v2, v3], `sphere-face-${y}-${x}`);
        }
      }
    }
  }

  // Apply material
  applyMaterial(builder, material);

  // Apply UV coordinates if enabled
  if (uvs?.enabled !== false) {
    applySphereUVs(builder, vertexIds, uvs);
  }
  
  return mesh;
}

/**
 * Apply UV coordinates to sphere vertices
 */
function applySphereUVs(
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
        // Spherical UV mapping
        const u = (col / (cols - 1)) * scale.x + offset.x;
        const v = (row / (rows - 1)) * scale.y + offset.y;
        builder.addUV(vertexId, u, v);
      }
    }
  }
} 