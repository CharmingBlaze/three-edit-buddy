// Test script to verify vertex sharing in cube
import { createCube } from './primitives/cube/createCube.js';

console.log('Testing cube vertex sharing...');

const cube = createCube({ size: 1 });

console.log(
  `Cube created with ${cube.vertices.length} vertices, ${cube.faces.length} faces, ${cube.edges.length} edges`
);

// Check for duplicate vertices at the same position
const positions = new Map();
const duplicates = [];

for (const vertex of cube.vertices) {
  const key = `${vertex.position.x.toFixed(6)},${vertex.position.y.toFixed(6)},${vertex.position.z.toFixed(6)}`;
  if (positions.has(key)) {
    duplicates.push({
      original: positions.get(key),
      duplicate: vertex.id,
      position: key,
    });
  } else {
    positions.set(key, vertex.id);
  }
}

if (duplicates.length > 0) {
  console.log('❌ Found duplicate vertices:');
  duplicates.forEach((d) => {
    console.log(
      `  Position ${d.position}: Vertex ${d.original} and ${d.duplicate}`
    );
  });
} else {
  console.log(
    '✅ No duplicate vertices found - vertex sharing is working correctly!'
  );
}

// Check face connectivity
console.log('\nChecking face connectivity...');
for (const face of cube.faces) {
  console.log(`Face ${face.id}: vertices ${face.vertexIds.join(', ')}`);
}

// Test vertex movement
console.log('\nTesting vertex movement...');
const testVertexId = cube.vertices[0].id;
const originalPosition = { ...cube.vertices[0].position };

console.log(
  `Moving vertex ${testVertexId} from ${JSON.stringify(originalPosition)}`
);

// Move the vertex
cube.moveVertex(testVertexId, { x: 2, y: 2, z: 2 });

// Check if all faces using this vertex were updated
const updatedVertex = cube.vertices.find((v) => v.id === testVertexId);
console.log(
  `Vertex ${testVertexId} new position: ${JSON.stringify(updatedVertex.position)}`
);

// Count how many faces use this vertex
const facesUsingVertex = cube.faces.filter((face) =>
  face.vertexIds.includes(testVertexId)
);
console.log(
  `Vertex ${testVertexId} is used by ${facesUsingVertex.length} faces`
);

console.log('✅ Cube vertex sharing test completed!');
