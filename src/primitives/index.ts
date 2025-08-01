// Core primitive system
export { PrimitiveBuilder } from './core/PrimitiveBuilder.js';
export * from './core/ParamTypes.js';
export * from './core/PrimitiveUtils.js';

// Primitive creation functions
export { createCube } from './cube/createCube.js';
export { createSphere } from './sphere/createSphere.js';
export { createCylinder } from './cylinder/createCylinder.js';
export { createCone } from './cone/createCone.js';
export { createPyramid } from './pyramid/createPyramid.js';
export { createPlane } from './plane/createPlane.js';
export { createTorus } from './torus/createTorus.js';
export { createOctahedron } from './octahedron/createOctahedron.js';
export { createDodecahedron } from './dodecahedron/createDodecahedron.js';
export { createIcosahedron } from './icosahedron/createIcosahedron.js';

// Parameter types
export type {
  CubeParams,
  SphereParams,
  CylinderParams,
  ConeParams,
  PyramidParams,
  PlaneParams,
  TorusParams,
  OctahedronParams,
  DodecahedronParams,
  IcosahedronParams,
  PrimitiveParams,
} from './core/ParamTypes.js';

// Default parameters
export { DEFAULT_PARAMS } from './core/ParamTypes.js';
