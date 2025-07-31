import { EditableMesh } from '../../core/EditableMesh.js';
import { PrimitiveBuilder } from '../core/PrimitiveBuilder.js';
import { Vector3Like } from '../../types/index.js';

export interface ConeParams {
  radius?: number;
  height?: number;
  segments?: number;
}

/**
 * Creates a cone primitive following the gold standard:
 * - Each logical vertex is created only once
 * - All faces and edges reference vertices by ID
 * - Guarantees connected, Blender-style editing
 */
export function createCone(params: ConeParams = {}): EditableMesh {
  const { radius = 0.5, height = 1, segments = 8 } = params;

  const mesh = new EditableMesh();
  const builder = new PrimitiveBuilder(mesh);
  const halfHeight = height / 2;

  // Create top vertex (apex)
  const apexVertexId = builder.addVertex({ x: 0, y: halfHeight, z: 0 }, 'apex');

  // Create bottom ring vertices
  const bottomRingVertexIds: number[] = [];
  for (let seg = 0; seg < segments; seg++) {
    const theta = (2 * Math.PI * seg) / segments;
    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);
    bottomRingVertexIds.push(
      builder.addVertex({ x, y: -halfHeight, z }, `bottom-ring-${seg}`)
    );
  }

  // Create side faces (triangles)
  for (let seg = 0; seg < segments; seg++) {
    const nextSeg = (seg + 1) % segments;

    builder.addTriangle([
      apexVertexId,
      bottomRingVertexIds[seg],
      bottomRingVertexIds[nextSeg]
    ], `side-${seg}`);
  }

  // Create bottom cap face (n-gon, reversed winding for proper orientation)
  const bottomCapVertexIds = [...bottomRingVertexIds].reverse();
  builder.addNGon(bottomCapVertexIds, 'bottom-cap');

  return mesh;
}
