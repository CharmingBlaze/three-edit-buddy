import { createTorus } from './src/primitives/torus/createTorus.js';
import { validateMeshTopology } from './src/validate/validateMeshTopology.js';

// Create the small torus that's failing
const smallTorus = createTorus({
  radius: 0.1,
  tubeRadius: 0.05,
  radialSegments: 2,
  tubularSegments: 2,
});

console.log('Small torus stats:');
console.log(`Vertices: ${smallTorus.vertices.length}`);
console.log(`Faces: ${smallTorus.faces.length}`);
console.log(`Edges: ${smallTorus.edges.length}`);

console.log('\nFaces:');
smallTorus.faces.forEach((face, i) => {
  console.log(`Face ${i}: vertices=${face.vertexIds.join(',')}, edges=${face.edgeIds.join(',')}`);
});

console.log('\nEdges:');
smallTorus.edges.forEach((edge, i) => {
  console.log(`Edge ${i}: ${edge.vertexIds.join('->')}`);
});

console.log('\nVertices:');
smallTorus.vertices.forEach((vertex, i) => {
  console.log(`Vertex ${i}: ${JSON.stringify(vertex.position)}`);
});

const validation = validateMeshTopology(smallTorus);
console.log('\nValidation result:');
console.log(JSON.stringify(validation, null, 2)); 