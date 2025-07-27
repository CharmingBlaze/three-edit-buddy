import type { EditableMesh, Face } from '../types/index.js';

/**
 * Returns the number of quad faces (4-sided) in the mesh.
 */
export function countQuads(mesh: EditableMesh): number {
  return mesh.faces.filter(face => face.vertexIds.length === 4).length;
}

/**
 * Returns the number of triangle faces (3-sided) in the mesh.
 */
export function countTriangles(mesh: EditableMesh): number {
  return mesh.faces.filter(face => face.vertexIds.length === 3).length;
}

/**
 * Returns the number of n-gon faces (faces with more than 4 sides) in the mesh.
 */
export function countNGons(mesh: EditableMesh): number {
  return mesh.faces.filter(face => face.vertexIds.length > 4).length;
}

/**
 * Returns a summary of the mesh face types and counts.
 */
export function getMeshSummary(mesh: EditableMesh): {
  total: number;
  quads: number;
  tris: number;
  ngons: number;
} {
  const quads = countQuads(mesh);
  const tris = countTriangles(mesh);
  const ngons = countNGons(mesh);
  return {
    total: mesh.faces.length,
    quads,
    tris,
    ngons
  };
}
