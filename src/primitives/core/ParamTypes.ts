import type { Vector3Like, Vector2Like } from '../../types/index.js';
import type { PrimitiveParams } from './PrimitiveBuilder.js';

export interface CubeParams extends PrimitiveParams {
  size?: number;
  width?: number;
  height?: number;
  depth?: number;
  widthSegments?: number;
  heightSegments?: number;
  depthSegments?: number;
}

export interface SphereParams extends PrimitiveParams {
  radius?: number;
  widthSegments?: number;
  heightSegments?: number;
  phiStart?: number;
  phiLength?: number;
  thetaStart?: number;
  thetaLength?: number;
}

export interface CylinderParams extends PrimitiveParams {
  radiusTop?: number;
  radiusBottom?: number;
  height?: number;
  radialSegments?: number;
  heightSegments?: number;
  openEnded?: boolean;
  thetaStart?: number;
  thetaLength?: number;
}

export interface ConeParams extends PrimitiveParams {
  radiusBottom?: number;
  height?: number;
  radialSegments?: number;
  heightSegments?: number;
  openEnded?: boolean;
  thetaStart?: number;
  thetaLength?: number;
}

export interface PyramidParams extends PrimitiveParams {
  size?: number;
  height?: number;
  segments?: number;
}

export interface PlaneParams extends PrimitiveParams {
  width?: number;
  height?: number;
  widthSegments?: number;
  heightSegments?: number;
}

export const DEFAULT_PARAMS = {
  cube: {
    size: 1,
    width: 1,
    height: 1,
    depth: 1,
    widthSegments: 1,
    heightSegments: 1,
    depthSegments: 1
  },
  sphere: {
    radius: 1,
    widthSegments: 8,
    heightSegments: 6,
    phiStart: 0,
    phiLength: Math.PI * 2,
    thetaStart: 0,
    thetaLength: Math.PI
  },
  cylinder: {
    radiusTop: 1,
    radiusBottom: 1,
    height: 2,
    radialSegments: 8,
    heightSegments: 1,
    openEnded: false,
    thetaStart: 0,
    thetaLength: Math.PI * 2
  },
  cone: {
    radiusBottom: 1,
    height: 2,
    radialSegments: 8,
    heightSegments: 1,
    openEnded: false,
    thetaStart: 0,
    thetaLength: Math.PI * 2
  },
  pyramid: {
    size: 1,
    height: 1,
    segments: 4
  },
  plane: {
    width: 1,
    height: 1,
    widthSegments: 1,
    heightSegments: 1
  }
} as const; 