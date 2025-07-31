import { EditableMesh } from '../../core/EditableMesh.js';
import { PrimitiveBuilder } from '../core/PrimitiveBuilder.js';
import { Vector3Like } from '../../types/index.js';

export interface CylinderParams {
  radius?: number;
  height?: number;
  segments?: number;
}

/**
 * Creates a cylinder primitive following the gold standard:
 * - Each logical vertex is created only once
 * - All faces and edges reference vertices by ID
 * - Guarantees connected, Blender-style editing
 */
export function createCylinder(params: CylinderParams = {}): EditableMesh {
  const { radius = 0.5, height = 1, segments = 8 } = params;

  const mesh = new EditableMesh();
  const builder = new PrimitiveBuilder(mesh);
  const halfHeight = height / 2;

  // Create vertices for top and bottom rings
  const topRingVertexIds: number[] = [];
  const bottomRingVertexIds: number[] = [];

  // Create top ring vertices
  for (let seg = 0; seg < segments; seg++) {
    const theta = (2 * Math.PI * seg) / segments;
    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);
    topRingVertexIds.push(
      builder.addVertex({ x, y: halfHeight, z }, `top-ring-${seg}`)
    );
  }

  // Create bottom ring vertices
  for (let seg = 0; seg < segments; seg++) {
    const theta = (2 * Math.PI * seg) / segments;
    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);
    bottomRingVertexIds.push(
      builder.addVertex({ x, y: -halfHeight, z }, `bottom-ring-${seg}`)
    );
  }

  // Create side faces (quads)
  for (let seg = 0; seg < segments; seg++) {
    const nextSeg = (seg + 1) % segments;

    builder.addQuad([
      topRingVertexIds[seg],
      topRingVertexIds[nextSeg],
      bottomRingVertexIds[nextSeg],
      bottomRingVertexIds[seg]
    ], `side-${seg}`);
  }

  // Create top cap face (n-gon)
  builder.addNGon(topRingVertexIds, 'top-cap');

  // Create bottom cap face (n-gon, reversed winding)
  const bottomCapVertexIds = [...bottomRingVertexIds].reverse();
  builder.addNGon(bottomCapVertexIds, 'bottom-cap');

  return mesh;
}
