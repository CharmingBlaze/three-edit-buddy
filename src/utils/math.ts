import type { Vector3Like } from '../types/index.js';

/**
 * Converts any object with x, y, z properties to a Vector3Like
 */
export function toVector3Like(obj: any): Vector3Like {
  if (obj && typeof obj.x === 'number' && typeof obj.y === 'number' && typeof obj.z === 'number') {
    return { x: obj.x, y: obj.y, z: obj.z };
  }
  throw new Error('Object must have x, y, z number properties');
}

/**
 * Converts any object with x, y properties to a Vector2Like
 */
export function toVector2Like(obj: any): { x: number; y: number } {
  if (obj && typeof obj.x === 'number' && typeof obj.y === 'number') {
    return { x: obj.x, y: obj.y };
  }
  throw new Error('Object must have x, y number properties');
} 