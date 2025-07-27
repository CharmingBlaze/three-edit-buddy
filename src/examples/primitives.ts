import {
  createCube,
  createSphere,
  createCylinder,
  createCone,
  createPyramid,
  createPlane,
  type CubeParams,
  type SphereParams,
  type CylinderParams,
  type ConeParams,
  type PyramidParams,
  type PlaneParams,
} from '../primitives/index.js';

/**
 * Example: Creating a basic cube
 */
export function createBasicCube() {
  return createCube();
}

/**
 * Example: Creating a segmented cube
 */
export function createSegmentedCube() {
  const params: CubeParams = {
    size: 2,
    widthSegments: 3,
    heightSegments: 3,
    depthSegments: 3,
    material: {
      name: 'cube-material',
      color: { x: 1, y: 0.5, z: 0.2 },
    },
  };

  return createCube(params);
}

/**
 * Example: Creating a sphere with custom parameters
 */
export function createCustomSphere() {
  const params: SphereParams = {
    radius: 1.5,
    widthSegments: 12,
    heightSegments: 8,
    material: {
      name: 'sphere-material',
      color: { x: 0.2, y: 0.8, z: 1 },
    },
    uvs: {
      enabled: true,
      scale: { x: 2, y: 1 },
    },
  };

  return createSphere(params);
}

/**
 * Example: Creating a cylinder with different top/bottom radii
 */
export function createConeCylinder() {
  const params: CylinderParams = {
    radiusTop: 0.5,
    radiusBottom: 1,
    height: 3,
    radialSegments: 16,
    material: {
      name: 'cylinder-material',
      color: { x: 0.8, y: 0.2, z: 0.8 },
    },
  };

  return createCylinder(params);
}

/**
 * Example: Creating an open-ended cone
 */
export function createOpenCone() {
  const params: ConeParams = {
    radiusBottom: 1,
    height: 2,
    radialSegments: 12,
    openEnded: true,
    material: {
      name: 'cone-material',
      color: { x: 1, y: 1, z: 0.2 },
    },
  };

  return createCone(params);
}

/**
 * Example: Creating a pyramid with custom segments
 */
export function createHexagonalPyramid() {
  const params: PyramidParams = {
    size: 1.5,
    height: 2,
    segments: 6,
    material: {
      name: 'pyramid-material',
      color: { x: 0.2, y: 1, z: 0.2 },
    },
  };

  return createPyramid(params);
}

/**
 * Example: Creating a segmented plane
 */
export function createSegmentedPlane() {
  const params: PlaneParams = {
    width: 4,
    height: 3,
    widthSegments: 8,
    heightSegments: 6,
    material: {
      name: 'plane-material',
      color: { x: 0.5, y: 0.5, z: 0.5 },
    },
    uvs: {
      enabled: true,
      scale: { x: 2, y: 2 },
    },
  };

  return createPlane(params);
}

/**
 * Example: Creating all primitives with default settings
 */
export function createAllPrimitives() {
  return {
    cube: createCube(),
    sphere: createSphere(),
    cylinder: createCylinder(),
    cone: createCone(),
    pyramid: createPyramid(),
    plane: createPlane(),
  };
}
