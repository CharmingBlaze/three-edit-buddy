// Editing Tools
export { extrudeFaces } from './extrudeFaces.js';
export { subdivideEdge, subdivideEdges } from './subdivideEdge.js';
export { mergeVertices, mergeSpecificVertices } from './mergeVertices.js';
export {
  deleteElements,
  deleteVertices,
  deleteEdges,
  deleteFaces,
} from './deleteElements.js';
export { bevelEdge } from './bevelEdge.js';
export { insetFaces } from './insetFaces.js';
export { triangulateFaces, triangulateMesh } from './triangulateFaces.js';
export { quadrangulateFaces, quadrangulateMesh } from './quadrangulateFaces.js';
export { dissolveEdges, dissolveFaces } from './dissolveElements.js';
export { loopCut } from './loopCut.js';
export { bridgeEdges } from './bridgeEdges.js';
export { subdivideMesh } from './subdivideMesh.js';
export { smoothMesh } from './smoothMesh.js';
export { getConstrainedPosition } from './constraints.js';
export { snapToGrid, findClosestVertex } from './snapping.js';

// Phase 2: Advanced Editing Tools
export { moveEdge, moveEdges, findClosestPointOnEdge } from './moveEdge.js';
export { 
  moveFace, 
  moveFaces, 
  getFaceCenter, 
  getFaceNormal, 
  moveFaceAlongNormal 
} from './moveFace.js';
export {
  applyVertexSymmetry,
  applyEdgeSymmetry,
  applyFaceSymmetry,
  createSymmetricalMesh,
} from './symmetry.js';
