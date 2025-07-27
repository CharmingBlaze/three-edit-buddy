# Three.js Edit Buddy

A comprehensive, modular 3D editing library for Three.js that supports flexible quad/tri/n-gon geometry with full topology management, advanced editing tools, and an interactive demo showcasing real-time vertex editing.

## 🎯 Features

- **Interactive 3D Demo**: Modern web-based demo with real-time topology editing
- **Topology-Based Vertex Editing**: Blender-like vertex manipulation with proper mesh connectivity
- **Flexible Face Types**: Supports triangles, quads, and n-gons with quad preference
- **Complete Topology Management**: Full vertex/edge/face relationships with bidirectional connections
- **Advanced Editing Tools**: Extrusion, subdivision, beveling, loop cutting, knife cutting, and more
- **Headless Architecture**: No Three.js dependencies in core modules
- **Modular Design**: Clean separation of concerns with one concept per file
- **Production Ready**: TypeScript, ES modules, comprehensive error handling
- **Export Flexibility**: Preserves face types in OBJ, triangulates for GLTF/STL
- **Visual Helpers**: Comprehensive Three.js visualization tools
- **Validation & Testing**: Mesh integrity checks and comprehensive test suite

## 🚀 Live Demo

Experience the interactive 3D primitive demo with real-time topology editing:

```bash
npm run demo
```

**Demo Features:**
- **6 Primitive Types**: Cube, Sphere, Cylinder, Cone, Pyramid, Plane
- **Real-time Highlighting**: Vertices (yellow cubes), Edges (red lines), Faces (green overlays)
- **Topology Editing**: Drag vertices to deform meshes while maintaining connectivity
- **Blender-like Behavior**: Moving a vertex updates all connected faces and edges
- **Modern UI**: Glassmorphism design with responsive controls
- **Spacebar Controls**: Quick cycling through highlight modes

## 📦 Installation

```bash
npm install three-edit-buddy
```

## 🎮 Quick Start

### Interactive Demo

```bash
# Clone the repository
git clone https://github.com/your-username/three-edit-buddy.git
cd three-edit-buddy

# Install dependencies
npm install

# Start the interactive demo
npm run demo
```

The demo will open in your browser at `http://localhost:3000` (or next available port).

### Library Usage

```typescript
import { 
  EditableMesh, 
  createCube, 
  createSphere,
  exportOBJ, 
  triangulateForExport,
  getFaceType,
  isQuad,
  isTriangle 
} from 'three-edit-buddy';

// Create a cube (quads by default)
const cube = createCube({ width: 1, height: 1, depth: 1 });
console.log(getFaceType(cube.faces[0])); // "quad"
console.log(isQuad(cube.faces[0])); // true

// Create a sphere (mixed quads and triangles)
const sphere = createSphere({ radius: 1, widthSegments: 8, heightSegments: 6 });
console.log(`Vertices: ${sphere.vertices.length}, Faces: ${sphere.faces.length}`);

// Export to OBJ (preserves face types)
const objData = exportOBJ(cube);
```

## 🔧 Editing Tools

The library includes powerful editing tools that work seamlessly with primitives:

```typescript
import { createCube } from 'three-edit-buddy/primitives';
import { extrudeFaces, subdivideEdge, mergeVertices } from 'three-edit-buddy/tools';

// Create a cube and extrude its faces
const cube = createCube({ size: 2 });
const faceIds = cube.faces.map(face => face.id);
const newFaceIds = extrudeFaces(cube, faceIds, 0.5);

// Subdivide edges of a sphere
const sphere = createSphere({ radius: 1.5, widthSegments: 8, heightSegments: 6 });
const edgeId = sphere.edges[0].id;
const newVertexId = subdivideEdge(sphere, edgeId);

// Merge close vertices
const mergeResult = mergeVertices(cube, 0.01);

// Triangulate for formats requiring triangles
const triangulated = triangulateForExport(cube);
```

## 🏗️ Architecture

### Core Principles

1. **Topology-First**: All editing operations maintain proper mesh connectivity
2. **Quad Preference**: All primitives and tools prefer quads when possible
3. **Flexible Storage**: Faces can be triangles, quads, or n-gons as needed
4. **Headless Core**: No Three.js dependencies in core modules
5. **Modular Design**: One concept per file, clean exports

### Folder Structure

```
src/
├── core/              # Core data structures
│   ├── EditableMesh.ts
│   ├── meshStats.ts
│   └── index.ts
├── primitives/        # Shape generators
│   ├── cube/
│   ├── sphere/
│   ├── cylinder/
│   ├── cone/
│   ├── pyramid/
│   ├── plane/
│   └── index.ts
├── convert/           # Import/export utilities
│   ├── triangulateForExport.ts
│   ├── exportOBJ.ts
│   ├── toEditableMesh.ts
│   └── index.ts
├── tools/             # Editing tools
│   ├── extrudeFaces.ts
│   ├── mergeVertices.ts
│   ├── subdivideEdge.ts
│   └── index.ts
├── validate/          # Validation utilities
│   ├── validateMeshTopology.ts
│   ├── checkMeshIntegrity.ts
│   └── index.ts
├── utils/             # Shared utilities
│   ├── math.ts
│   ├── faceTypes.ts
│   ├── id.ts
│   └── index.ts
├── types/             # Type definitions
│   └── index.ts
├── demo/              # Interactive demo
│   ├── demo.js
│   ├── index.html
│   └── vite.config.js
└── index.ts           # Main exports
```

## 📚 API Reference

### Core Classes

#### EditableMesh

The main mesh data structure that supports flexible face types and topology editing.

```typescript
const mesh = new EditableMesh();

// Add vertices
const vertex = mesh.addVertex({ x: 0, y: 0, z: 0 });

// Add edges
const edge = mesh.addEdge(vertex1Id, vertex2Id);

// Add faces (supports 3+ vertices)
const face = mesh.addFace([v1, v2, v3, v4], [e1, e2, e3, e4]);

// Move vertices (updates all connected faces/edges)
mesh.moveVertex(vertexId, { x: 1, y: 0, z: 0 });

// Get statistics
const stats = mesh.getStats();
console.log(`Vertices: ${stats.vertexCount}, Edges: ${stats.edgeCount}, Faces: ${stats.faceCount}`);

// Convert to Three.js BufferGeometry
const geometry = mesh.toBufferGeometry();
```

### Primitives

#### createCube(params: CubeParams): EditableMesh

Creates a cube with quad faces.

```typescript
const cube = createCube({
  width: 1,
  height: 1,
  depth: 1,
  widthSegments: 1,
  heightSegments: 1,
  depthSegments: 1
});
```

#### createSphere(params: SphereParams): EditableMesh

Creates a sphere with mixed quads and triangles.

```typescript
const sphere = createSphere({
  radius: 1,
  widthSegments: 8,
  heightSegments: 6
});
```

#### createCylinder(params: CylinderParams): EditableMesh

Creates a cylinder with configurable segments.

```typescript
const cylinder = createCylinder({
  radiusTop: 1,
  radiusBottom: 1,
  height: 2,
  radialSegments: 8,
  heightSegments: 1
});
```

#### createCone(params: ConeParams): EditableMesh

Creates a cone with triangular faces.

```typescript
const cone = createCone({
  radius: 1,
  height: 2,
  radialSegments: 8
});
```

#### createPyramid(params: PyramidParams): EditableMesh

Creates a pyramid with triangular faces.

```typescript
const pyramid = createPyramid({
  baseWidth: 1,
  height: 1
});
```

#### createPlane(params: PlaneParams): EditableMesh

Creates a plane with a single quad face.

```typescript
const plane = createPlane({
  width: 2,
  height: 2
});
```

### Face Type Utilities

#### getFaceType(face: Face): FaceType

Returns the type of a face: 'triangle', 'quad', or 'ngon'.

```typescript
const faceType = getFaceType(face);
```

#### isQuad(face: Face): face is QuadFace

Type guard to check if a face is a quad.

```typescript
if (isQuad(face)) {
  // face is typed as QuadFace
  console.log(face.vertexIds.length); // 4
}
```

#### isTriangle(face: Face): face is TriangleFace

Type guard to check if a face is a triangle.

```typescript
if (isTriangle(face)) {
  // face is typed as TriangleFace
  console.log(face.vertexIds.length); // 3
}
```

#### isNGon(face: Face): face is NGonFace

Type guard to check if a face is an n-gon.

```typescript
if (isNGon(face)) {
  // face is typed as NGonFace
  console.log(face.vertexIds.length); // 5+
}
```

### Export Utilities

#### exportOBJ(mesh: EditableMesh): string

Exports a mesh to OBJ format, preserving face types.

```typescript
const objData = exportOBJ(mesh);
// Quads: f 1 2 3 4
// Triangles: f 1 2 3
// N-gons: f 1 2 3 4 5
```

#### triangulateForExport(mesh: EditableMesh): TriangulatedMesh

Converts all faces to triangles for export to formats requiring triangles.

```typescript
const triangulated = triangulateForExport(mesh);
// All faces are now triangles
```

#### toEditableMesh(geometry: THREE.BufferGeometry): EditableMesh

Converts a Three.js BufferGeometry to an EditableMesh for editing.

```typescript
const geometry = new THREE.BoxGeometry(1, 1, 1);
const mesh = toEditableMesh(geometry);
// Now you can edit the mesh topology
```

### Advanced Editing Tools

#### Mesh Operations

```typescript
import { 
  extrudeFaces,
  mergeVertices,
  subdivideEdge,
  deleteFaces,
  bevelEdge,
  loopCut,
  knifeCut,
  insetFaces,
  bridgeFaces 
} from 'three-edit-buddy';

// Extrude selected faces
const newFaces = extrudeFaces(mesh, selection, { distance: 0.5 });

// Merge vertices within threshold
const mergedCount = mergeVertices(mesh, 0.01);

// Subdivide an edge
const newVertex = subdivideEdge(mesh, edgeId);

// Delete faces and cleanup
deleteFaces(mesh, [faceId1, faceId2]);

// Bevel an edge
const newFaces = bevelEdge(mesh, edgeId, { width: 0.1 });

// Cut a loop around the mesh
const newEdges = loopCut(mesh, edgeId);

// Cut mesh with a plane
const newFaces = knifeCut(mesh, plane, selection);

// Inset faces
const newFaces = insetFaces(mesh, [faceId1, faceId2], { distance: 0.1 });

// Bridge between faces
const newFaces = bridgeFaces(mesh, [faceId1], [faceId2], { segments: 3 });
```

### Visual Helpers

#### Three.js Visualization Tools

```typescript
import { 
  GizmoTranslate,
  GizmoRotate,
  GizmoScale,
  CenterPointHelper,
  SelectionBoxHelper,
  RulerHelper,
  AngleHelper,
  HighlightVertices,
  HighlightEdges,
  HighlightFaces 
} from 'three-edit-buddy';

// Create transformation gizmos
const translateGizmo = GizmoTranslate(mesh, camera, renderer);
const rotateGizmo = GizmoRotate(mesh, camera, renderer);
const scaleGizmo = GizmoScale(mesh, camera, renderer);

// Create measurement helpers
const centerPoint = CenterPointHelper(center, { size: 0.1 });
const selectionBox = SelectionBoxHelper(min, max, { color: 0x00ff00 });
const ruler = RulerHelper(start, end, { showDistance: true });
const angle = AngleHelper(center, point1, point2, { showAngle: true });

// Create highlighting helpers
const vertexHighlights = HighlightVertices(mesh, selectedVertices);
const edgeHighlights = HighlightEdges(mesh, selectedEdges);
const faceHighlights = HighlightFaces(mesh, selectedFaces);
```

### Validation & Utilities

#### Mesh Validation

```typescript
import { 
  validateMeshIntegrity,
  validateMeshTopology,
  isManifold,
  isClosed,
  checkFaceWinding,
  fixFaceWinding,
  getMeshStats 
} from 'three-edit-buddy';

// Validate mesh integrity
const isValid = validateMeshIntegrity(mesh);

// Check topology properties
const isManifoldMesh = isManifold(mesh);
const isClosedMesh = isClosed(mesh);

// Fix face winding
fixFaceWinding(mesh, faceId);
fixAllFaceWinding(mesh);

// Get detailed statistics
const stats = getMeshStats(mesh);
console.log(`Triangles: ${stats.triangleCount}, Quads: ${stats.quadCount}, N-gons: ${stats.ngonCount}`);
```

## 🎨 Face Type Philosophy

### Quad Preference

The library follows a "quad preference" philosophy:

1. **Primitives**: Create quads when possible, triangles only when necessary
2. **Editing Tools**: Attempt to output quads, fall back to triangles if impossible
3. **Storage**: Support all face types but prefer quads
4. **Export**: Preserve face types in OBJ, triangulate only for formats requiring triangles

### When to Use Each Face Type

- **Quads**: Default choice for most geometry, better for subdivision
- **Triangles**: Use when quads are impossible (tetrahedron, sphere caps)
- **N-gons**: Use sparingly for complex geometry (holes, bevels)

## 🔧 Development

### Building

```bash
npm install
npm run build
```

### Testing

```bash
npm test
```

### Running the Demo

```bash
npm run demo
```

### Building the Demo

```bash
npm run demo:build
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 Changelog

### v1.0.0
- Initial release
- Interactive 3D demo with topology editing
- Flexible quad/tri/n-gon support
- OBJ export with face type preservation
- Triangulation for export formats
- Modular, headless architecture
- Real-time vertex editing with proper mesh connectivity 