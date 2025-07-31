import { EditableMesh } from '../../core/EditableMesh.js';
import { PrimitiveBuilder } from '../core/PrimitiveBuilder.js';
import type { Vector3Like } from '../../types/index.js';

export interface TorusParams {
  radius?: number;
  tubeRadius?: number;
  radialSegments?: number;
  tubularSegments?: number;
  arcStart?: number;
  arcLength?: number;
}

/**
 * Creates a torus (donut) primitive following the gold standard:
 * - Each logical vertex is created only once
 * - All faces and edges reference vertices by ID
 * - Guarantees connected, Blender-style editing
 */
export function createTorus(params: TorusParams = {}): EditableMesh {
  const {
    radius = 1,
    tubeRadius = 0.3,
    radialSegments = 8,
    tubularSegments = 6,
    arcStart = 0,
    arcLength = Math.PI * 2,
  } = params;

  const mesh = new EditableMesh();
  const builder = new PrimitiveBuilder(mesh);

  // Create vertex grid for the torus
  const vertexGrid = builder.createVertexGrid(
    2 * Math.PI * radius, // width
    2 * Math.PI * tubeRadius, // height
    radialSegments, // widthSegments
    tubularSegments, // heightSegments
    (u: number, v: number) => {
      // Convert grid coordinates to toroidal coordinates
      const radialAngle = arcStart + u * arcLength; // u maps to radial angle
      const tubularAngle = v * 2 * Math.PI; // v maps to tubular angle
      
      const cosRadial = Math.cos(radialAngle);
      const sinRadial = Math.sin(radialAngle);
      const cosTubular = Math.cos(tubularAngle);
      const sinTubular = Math.sin(tubularAngle);
      
      const x = (radius + tubeRadius * cosTubular) * cosRadial;
      const y = (radius + tubeRadius * cosTubular) * sinRadial;
      const z = tubeRadius * sinTubular;
      
      return { x, y, z };
    }
  );

  // Create faces from the vertex grid
  builder.createFacesFromGrid(vertexGrid, 'torus-face');

  return mesh;
} 