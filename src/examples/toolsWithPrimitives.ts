import { createCube } from '../primitives/cube/createCube.js';
import { createSphere } from '../primitives/sphere/createSphere.js';
import { extrudeFaces, subdivideEdge, mergeVertices } from '../tools/index.js';
import { validateMeshTopology } from '../validate/index.js';

/**
 * Example: Extruding faces of a cube
 */
export function extrudeCubeFaces() {
  // Create a basic cube
  const cube = createCube({ size: 2 });

  // Get all face IDs
  const faceIds = cube.faces.map((face) => face.id);

  // Extrude all faces by 0.5 units
  const newFaceIds = extrudeFaces(cube, faceIds, 0.5);

  // Validate the mesh topology
  const validation = validateMeshTopology(cube);

  console.log(`Original cube had ${faceIds.length} faces`);
  console.log(`Extrusion created ${newFaceIds.length} new faces`);
  console.log(`Mesh is valid: ${validation.isValid}`);

  return cube;
}

/**
 * Example: Subdividing edges of a sphere
 */
export function subdivideSphereEdges() {
  // Create a sphere with moderate segmentation
  const sphere = createSphere({
    radius: 1.5,
    segments: 8,
    rings: 6,
  });

  // Get the first 5 edge IDs
  const edgeIds = sphere.edges.slice(0, 5).map((edge) => edge.id);

  // Subdivide these edges
  const newVertexIds = [];
  for (const edgeId of edgeIds) {
    try {
      const newVertexId = subdivideEdge(sphere, edgeId);
      newVertexIds.push(newVertexId);
    } catch (error) {
      console.warn(`Failed to subdivide edge ${edgeId}:`, error);
    }
  }

  // Validate the mesh topology
  const validation = validateMeshTopology(sphere);

  console.log(`Original sphere had ${sphere.vertices.length} vertices`);
  console.log(`Subdivision created ${newVertexIds.length} new vertices`);
  console.log(`Mesh is valid: ${validation.isValid}`);

  return sphere;
}

/**
 * Example: Merging vertices of a cube with overlapping vertices
 */
export function mergeCubeVertices() {
  // Create a cube
  const cube = createCube({ size: 2 });

  // Add some duplicate vertices to test merging
  // (In a real scenario, these might come from importing a model)
  cube.addVertex({ x: 1.0001, y: 1.0001, z: 1.0001 }); // Nearly identical to existing vertex
  cube.addVertex({ x: -1.0002, y: -1.0002, z: -1.0002 }); // Nearly identical to existing vertex

  // Count vertices before merging
  const originalVertexCount = cube.vertices.length;

  // Merge vertices that are within 0.01 units of each other
  const result = mergeVertices(cube, 0.01);

  // Validate the mesh topology
  const validation = validateMeshTopology(cube);

  console.log(`Original cube had ${originalVertexCount} vertices`);
  console.log(`Merged ${result.mergedVertices} vertices`);
  console.log(`Updated ${result.updatedFaces} faces`);
  console.log(`Final vertex count: ${cube.vertices.length}`);
  console.log(`Mesh is valid: ${validation.isValid}`);

  return cube;
}

/**
 * Example: Combining multiple tools on a single primitive
 */
export function complexCubeModification() {
  // Create a segmented cube
  const cube = createCube({
    size: 2,
  });

  console.log(
    `Initial cube: ${cube.vertices.length} vertices, ${cube.faces.length} faces`
  );

  // Extrude all faces
  const faceIds = cube.faces.map((face) => face.id);
  extrudeFaces(cube, faceIds, 0.3);

  console.log(
    `After extrusion: ${cube.vertices.length} vertices, ${cube.faces.length} faces`
  );

  // Subdivide some edges
  const edgeIds = cube.edges.slice(0, 10).map((edge) => edge.id);
  for (const edgeId of edgeIds) {
    try {
      subdivideEdge(cube, edgeId);
    } catch (error) {
      // Ignore errors for this example
    }
  }

  console.log(
    `After subdivision: ${cube.vertices.length} vertices, ${cube.faces.length} faces`
  );

  // Merge close vertices
  const mergeResult = mergeVertices(cube, 0.01);

  console.log(
    `After merging: ${cube.vertices.length} vertices, ${cube.faces.length} faces`
  );
  console.log(`Merged ${mergeResult.mergedVertices} vertices`);

  // Final validation
  const validation = validateMeshTopology(cube);
  console.log(`Final mesh is valid: ${validation.isValid}`);

  return cube;
}
