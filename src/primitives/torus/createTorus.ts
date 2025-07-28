import { EditableMesh } from '../../core/EditableMesh.js';
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
 * Creates a torus (donut) primitive
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

  // Create vertices
  const vertices: { id: number; position: Vector3Like }[] = [];

  for (let i = 0; i <= radialSegments; i++) {
    const u = arcStart + (i / radialSegments) * arcLength;
    const cosU = Math.cos(u);
    const sinU = Math.sin(u);

    for (let j = 0; j <= tubularSegments; j++) {
      const v = (j / tubularSegments) * Math.PI * 2;
      const cosV = Math.cos(v);
      const sinV = Math.sin(v);

      const x = (radius + tubeRadius * cosV) * cosU;
      const y = (radius + tubeRadius * cosV) * sinU;
      const z = tubeRadius * sinV;

      vertices.push({
        id: mesh.addVertex({ x, y, z }).id,
        position: { x, y, z },
      });
    }
  }

  // Create faces and edges
  for (let i = 0; i < radialSegments; i++) {
    for (let j = 0; j < tubularSegments; j++) {
      const a = i * (tubularSegments + 1) + j;
      const b = (i + 1) * (tubularSegments + 1) + j;
      const c = (i + 1) * (tubularSegments + 1) + j + 1;
      const d = i * (tubularSegments + 1) + j + 1;

      // Create quad face
      mesh.addFace(
        [vertices[a]!.id, vertices[b]!.id, vertices[c]!.id, vertices[d]!.id],
        []
      );

      // Add edges for this face
      mesh.addEdge(vertices[a]!.id, vertices[b]!.id);
      mesh.addEdge(vertices[b]!.id, vertices[c]!.id);
      mesh.addEdge(vertices[c]!.id, vertices[d]!.id);
      mesh.addEdge(vertices[d]!.id, vertices[a]!.id);
    }
  }

  return mesh;
} 