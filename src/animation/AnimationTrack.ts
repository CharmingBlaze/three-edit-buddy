import { Keyframe } from './Keyframe.js';
import type { Vector3Like } from '../types/index.js';

/**
 * Manages a sequence of keyframes for a mesh animation.
 */
export class AnimationTrack {
  public keyframes: Keyframe[] = [];

  /**
   * Adds or updates a keyframe at a specific frame.
   * If a keyframe already exists at this frame, it will be overwritten.
   * @param keyframe The keyframe to add.
   */
  addKeyframe(keyframe: Keyframe): void {
    // Remove existing keyframe at the same frame, if any
    this.keyframes = this.keyframes.filter(kf => kf.frame !== keyframe.frame);
    this.keyframes.push(keyframe);
    // Keep keyframes sorted by frame number
    this.keyframes.sort((a, b) => a.frame - b.frame);
  }

  /**
   * Gets the interpolated vertex positions for a given frame.
   * @param frame The frame to get the positions for.
   * @returns A map of vertex IDs to their interpolated positions.
   */
  getInterpolatedPositions(frame: number): Map<number, Vector3Like> | null {
    if (this.keyframes.length === 0) {
      return null;
    }

    if (this.keyframes.length === 1) {
      return this.keyframes[0].vertexPositions;
    }

    // Find the two keyframes to interpolate between
    let prevKeyframe = this.keyframes[0];
    let nextKeyframe = this.keyframes[this.keyframes.length - 1];

    for (let i = 0; i < this.keyframes.length; i++) {
      if (this.keyframes[i].frame <= frame) {
        prevKeyframe = this.keyframes[i];
      }
      if (this.keyframes[i].frame > frame) {
        nextKeyframe = this.keyframes[i];
        break;
      }
    }

    if (prevKeyframe === nextKeyframe) {
      return prevKeyframe.vertexPositions;
    }

    const frameDiff = nextKeyframe.frame - prevKeyframe.frame;
    const alpha = frameDiff === 0 ? 0 : (frame - prevKeyframe.frame) / frameDiff;

    const interpolatedPositions = new Map<number, Vector3Like>();
    const allVertexIds = new Set([...prevKeyframe.vertexPositions.keys(), ...nextKeyframe.vertexPositions.keys()]);

    for (const vertexId of allVertexIds) {
      const startPos = prevKeyframe.vertexPositions.get(vertexId);
      const endPos = nextKeyframe.vertexPositions.get(vertexId);

      if (startPos && endPos) {
        const interpolated: Vector3Like = {
          x: startPos.x + (endPos.x - startPos.x) * alpha,
          y: startPos.y + (endPos.y - startPos.y) * alpha,
          z: startPos.z + (endPos.z - startPos.z) * alpha,
        };
        interpolatedPositions.set(vertexId, interpolated);
      } else if (startPos) {
        interpolatedPositions.set(vertexId, startPos);
      } else if (endPos) {
        interpolatedPositions.set(vertexId, endPos);
      }
    }

    return interpolatedPositions;
  }
}
