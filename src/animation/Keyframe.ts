import type { Vector3Like } from '../types/index.js';

/**
 * Represents a single keyframe in an animation track.
 * It stores the position of every vertex in the mesh at a specific frame number.
 */
export class Keyframe {
  public frame: number;
  public vertexPositions: Map<number, Vector3Like>;

  /**
   * @param frame The frame number for this keyframe.
   * @param positions A map of vertex IDs to their positions.
   */
  constructor(frame: number, positions: Map<number, Vector3Like>) {
    this.frame = frame;
    this.vertexPositions = new Map(positions);
  }
}
