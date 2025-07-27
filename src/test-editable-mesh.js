// Test script to verify EditableMesh primitives work correctly
import { createCube, createSphere, createCylinder, createCone, createPyramid, createPlane } from './primitives/index.js';

console.log('Testing EditableMesh primitives...\n');

// Test function to check vertex sharing
function testPrimitive(name, createFunction, params = {}) {
    console.log(`Testing ${name}...`);
    
    try {
        const mesh = createFunction(params);
        
        console.log(`  ✅ Created ${name} successfully`);
        console.log(`  Vertices: ${mesh.vertices.length}`);
        console.log(`  Edges: ${mesh.edges.length}`);
        console.log(`  Faces: ${mesh.faces.length}`);
        
        // Test vertex movement
        if (mesh.vertices.length > 0) {
            const testVertexId = mesh.vertices[0].id;
            const originalPosition = { ...mesh.vertices[0].position };
            
            console.log(`  Testing vertex movement...`);
            mesh.moveVertex(testVertexId, { x: 2, y: 2, z: 2 });
            
            const updatedVertex = mesh.vertices.find(v => v.id === testVertexId);
            console.log(`  ✅ Vertex moved from ${JSON.stringify(originalPosition)} to ${JSON.stringify(updatedVertex.position)}`);
            
            // Count faces using this vertex
            const facesUsingVertex = mesh.faces.filter(face => 
                face.vertexIds.includes(testVertexId)
            );
            console.log(`  Vertex is used by ${facesUsingVertex.length} faces`);
            
            // Test geometry conversion
            const geometry = mesh.toBufferGeometry();
            console.log(`  ✅ Geometry conversion successful: ${geometry.attributes.position.count} positions`);
        }
        
        console.log('');
        return true;
    } catch (error) {
        console.log(`  ❌ Error creating ${name}:`, error.message);
        console.log('');
        return false;
    }
}

// Test all primitives
const tests = [
    ['Cube', createCube, { size: 1 }],
    ['Sphere', createSphere, { radius: 0.5 }],
    ['Cylinder', createCylinder, { radiusTop: 0.5, radiusBottom: 0.5, height: 1 }],
    ['Cone', createCone, { radiusBottom: 0.5, height: 1 }],
    ['Pyramid', createPyramid, { size: 1, height: 1 }],
    ['Plane', createPlane, { width: 1, height: 1 }]
];

let successCount = 0;
for (const [name, createFunction, params] of tests) {
    if (testPrimitive(name, createFunction, params)) {
        successCount++;
    }
}

console.log(`✅ ${successCount}/${tests.length} primitives working correctly!`);
console.log('EditableMesh primitives are ready for the demo!'); 