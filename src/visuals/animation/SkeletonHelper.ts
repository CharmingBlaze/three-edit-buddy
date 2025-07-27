import { Object3D, Skeleton } from 'three';

/**
 * Options for the SkeletonHelper
 */
export interface SkeletonHelperOptions {
  /** Color of the skeleton lines */
  color?: number | string;
  /** Visibility of the skeleton */
  visible?: boolean;
}

/**
 * Creates a Three.js SkeletonHelper for visualizing bone structures
 * @param skeleton The skeleton to visualize
 * @param options Configuration options
 * @returns A Three.js SkeletonHelper object
 */
export function SkeletonHelper(
  skeleton: Skeleton,
  options: SkeletonHelperOptions = {}
): Object3D {
  // Create the Three.js SkeletonHelper
  const helper = new (eval('THREE.SkeletonHelper'))(skeleton.bones[0]);

  // Apply options
  if (options.color !== undefined) {
    helper.material.color.set(options.color);
  }

  if (options.visible !== undefined) {
    helper.visible = options.visible;
  }

  return helper;
}
