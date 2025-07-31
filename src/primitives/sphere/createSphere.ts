import { EditableMesh } from '../../core/EditableMesh.js';
import { PrimitiveBuilder } from '../core/PrimitiveBuilder.js';
import { Vector3Like } from '../../types/index.js';

export interface SphereParams {
  radius?: number;
  segments?: number;
  rings?: number;
}

/**
 * Creates a sphere primitive following the gold standard:
 * - Each logical vertex is created only once
 * - All faces and edges reference vertices by ID
 * - Guarantees connected, Blender-style editing
 */
export function createSphere(params: SphereParams = {}): EditableMesh {
  const {
    radius = 0.5,
    segments = 6,
    rings = 4,
  } = params;

  const mesh = new EditableMesh();
  const builder = new PrimitiveBuilder(mesh);

  // Create vertex grid for the sphere
  const vertexGrid = builder.createVertexGrid(
    2 * Math.PI * radius, // width
    2 * radius, // height
    segments, // widthSegments
    rings, // heightSegments
    (u: number, v: number) => {
      // Convert grid coordinates to spherical coordinates
      const theta = u * 2 * Math.PI; // longitude
      const phi = v * Math.PI; // latitude
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      
      return { x, y, z };
    }
  );

  // Create faces from the vertex grid
  builder.createFacesFromGrid(vertexGrid, 'sphere-face');

  return mesh;
}
