/**
 * ID generation utilities for mesh elements
 */

let nextId = 0;

/**
 * Generates a unique ID for any mesh element
 */
export function generateId(): number {
  return nextId++;
}

let nextVertexId = 0;
let nextEdgeId = 0;
let nextFaceId = 0;
let nextUVId = 0;
let nextMaterialId = 0;

/**
 * Generates a unique vertex ID
 */
export function generateVertexId(): number {
  return nextVertexId++;
}

/**
 * Generates a unique edge ID
 */
export function generateEdgeId(): number {
  return nextEdgeId++;
}

/**
 * Generates a unique face ID
 */
export function generateFaceId(): number {
  return nextFaceId++;
}

/**
 * Generates a unique UV ID
 */
export function generateUVId(): number {
  return nextUVId++;
}

/**
 * Generates a unique material ID
 */
export function generateMaterialId(): number {
  return nextMaterialId++;
}

/**
 * Resets all ID counters (useful for testing)
 */
export function resetIdCounters(): void {
  nextId = 0;
  nextVertexId = 0;
  nextEdgeId = 0;
  nextFaceId = 0;
  nextUVId = 0;
  nextMaterialId = 0;
}
