import type { Vector3Like, Vector2Like } from '../../types/index.js';
import type { PrimitiveBuilder } from './PrimitiveBuilder.js';

/**
 * Generate vertices in a circle
 */
export function generateCircleVertices(
  radius: number, 
  segments: number, 
  startAngle: number = 0, 
  endAngle: number = Math.PI * 2
): Vector3Like[] {
  const vertices: Vector3Like[] = [];
  const angleStep = (endAngle - startAngle) / segments;
  
  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + i * angleStep;
    vertices.push({
      x: radius * Math.cos(angle),
      y: 0,
      z: radius * Math.sin(angle)
    });
  }
  
  return vertices;
}

/**
 * Generate vertices in a grid pattern
 */
export function generateGridVertices(
  width: number,
  height: number,
  widthSegments: number,
  heightSegments: number,
  center: boolean = true
): Vector3Like[][] {
  const vertices: Vector3Like[][] = [];
  const widthStep = width / widthSegments;
  const heightStep = height / heightSegments;
  
  const offsetX = center ? -width / 2 : 0;
  const offsetZ = center ? -height / 2 : 0;
  
  for (let row = 0; row <= heightSegments; row++) {
    const rowVertices: Vector3Like[] = [];
    for (let col = 0; col <= widthSegments; col++) {
      rowVertices.push({
        x: offsetX + col * widthStep,
        y: 0,
        z: offsetZ + row * heightStep
      });
    }
    vertices.push(rowVertices);
  }
  
  return vertices;
}

/**
 * Apply material to the mesh
 */
export function applyMaterial(builder: PrimitiveBuilder, material?: { name: string; color?: Vector3Like; opacity?: number; transparent?: boolean }): void {
  if (material) {
    builder.addMaterial(material.name, material.color, material.opacity, material.transparent);
  }
}

/**
 * Apply UV coordinates to vertices
 */
export function applyUVs(
  builder: PrimitiveBuilder, 
  vertexIds: number[], 
  positions: Vector3Like[], 
  uvs?: { enabled?: boolean; scale?: Vector2Like; offset?: Vector2Like }
): void {
  if (uvs?.enabled === false) return;
  
  const scale = uvs?.scale || { x: 1, y: 1 };
  const offset = uvs?.offset || { x: 0, y: 0 };
  
  for (let i = 0; i < vertexIds.length; i++) {
    const position = positions[i]!;
    // Simple planar UV mapping
    const u = (position.x + 0.5) * scale.x + offset.x;
    const v = (position.z + 0.5) * scale.y + offset.y;
    builder.addUV(vertexIds[i]!, u, v);
  }
}

/**
 * Calculate face normal for a triangle
 */
export function calculateTriangleNormal(v0: Vector3Like, v1: Vector3Like, v2: Vector3Like): Vector3Like {
  const edge1 = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z };
  const edge2 = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z };
  
  return {
    x: edge1.y * edge2.z - edge1.z * edge2.y,
    y: edge1.z * edge2.x - edge1.x * edge2.z,
    z: edge1.x * edge2.y - edge1.y * edge2.x
  };
}

/**
 * Normalize a vector
 */
export function normalizeVector(vector: Vector3Like): Vector3Like {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
  if (length === 0) return { x: 0, y: 0, z: 0 };
  
  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length
  };
} 