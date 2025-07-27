import type { Face } from '../types/index.js';

/**
 * Gets the type of a face based on its vertex count
 *
 * @param face - The face to analyze
 * @returns The face type as a string
 */
export function getFaceType(face: Face): 'triangle' | 'quad' | 'ngon' {
  const vertexCount = face.vertexIds.length;

  if (vertexCount === 3) return 'triangle';
  if (vertexCount === 4) return 'quad';
  return 'ngon';
}

/**
 * Checks if a face is a triangle (3 vertices)
 *
 * @param face - The face to check
 * @returns True if the face is a triangle
 */
export function isTriangle(face: Face): boolean {
  return face.vertexIds.length === 3;
}

/**
 * Checks if a face is a quad (4 vertices)
 *
 * @param face - The face to check
 * @returns True if the face is a quad
 */
export function isQuad(face: Face): boolean {
  return face.vertexIds.length === 4;
}

/**
 * Checks if a face is an n-gon (more than 4 vertices)
 *
 * @param face - The face to check
 * @returns True if the face is an n-gon
 */
export function isNGon(face: Face): boolean {
  return face.vertexIds.length > 4;
}

/**
 * Gets the vertex count of a face
 *
 * @param face - The face to analyze
 * @returns The number of vertices in the face
 */
export function getFaceVertexCount(face: Face): number {
  return face.vertexIds.length;
}

/**
 * Checks if a face is valid (has at least 3 vertices)
 *
 * @param face - The face to validate
 * @returns True if the face is valid
 */
export function isValidFace(face: Face): boolean {
  return face.vertexIds.length >= 3;
}

/**
 * Gets a human-readable description of the face type
 *
 * @param face - The face to describe
 * @returns A string description of the face type
 */
export function getFaceTypeDescription(face: Face): string {
  const vertexCount = face.vertexIds.length;

  if (vertexCount === 3) return 'Triangle';
  if (vertexCount === 4) return 'Quad';
  if (vertexCount === 5) return 'Pentagon';
  if (vertexCount === 6) return 'Hexagon';
  if (vertexCount === 7) return 'Heptagon';
  if (vertexCount === 8) return 'Octagon';

  return `${vertexCount}-gon`;
}
