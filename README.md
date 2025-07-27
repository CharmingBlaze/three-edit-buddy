# Three.js Edit Buddy

A comprehensive, modular 3D editing library for Three.js that supports flexible quad/tri/n-gon geometry with full topology management and advanced editing tools.

## 🎯 Features

- **Flexible Face Types**: Supports triangles, quads, and n-gons with quad preference
- **Complete Topology Management**: Full vertex/edge/face relationships with bidirectional connections
- **Advanced Editing Tools**: Extrusion, subdivision, beveling, loop cutting, knife cutting, and more
- **Headless Architecture**: No Three.js dependencies in core modules
- **Modular Design**: Clean separation of concerns with one concept per file
- **Production Ready**: TypeScript, ES modules, comprehensive error handling
- **Export Flexibility**: Preserves face types in OBJ, triangulates for GLTF/STL
- **Visual Helpers**: Comprehensive Three.js visualization tools
- **Validation & Testing**: Mesh integrity checks and comprehensive test suite



## 📦 Installation

```bash
npm install edit-threejs
```

## 🚀 Quick Start

```typescript
import { 
  EditableMesh, 
  createCube, 
  createTetrahedron,
  exportOBJ, 
  triangulateForExport,
  getFaceType,
  isQuad,
  isTriangle 
} from 'edit-threejs';

// Create a cube (quads by default)
const cube = createCube({ width: 1, height: 1, depth: 1 });
console.log(getFaceType(cube.faces[0])); // "quad"
console.log(isQuad(cube.faces[0])); // true

// Create a tetrahedron (triangles by necessity)
const tetrahedron = createTetrahedron({ size: 1 });
console.log(getFaceType(tetrahedron.faces[0])); // "triangle"
console.log(isTriangle(tetrahedron.faces[0])); // true

// Export to OBJ (preserves face types)
const objData = exportOBJ(cube);
```

## 🔧 Editing Tools

The library includes powerful editing tools that work seamlessly with primitives:

```typescript
import { createCube } from 'edit-threejs/primitives';
import { extrudeFaces, subdivideEdge, mergeVertices } from 'edit-threejs/tools';

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
```

// Triangulate for formats requiring triangles
const triangulated = triangulateForExport(cube);
```

## 🏗️ Architecture

### Core Principles

1. **Quad Preference**: All primitives and tools prefer quads when possible
2. **Flexible Storage**: Faces can be triangles, quads, or n-gons as needed
3. **Headless Core**: No Three.js dependencies in core modules
4. **Modular Design**: One concept per file, clean exports

### Folder Structure

```
src/
├── core/              # Core data structures
│   ├── EditableMesh.ts
│   └── index.ts
├── primitives/        # Shape generators
│   ├── createCube.ts
│   ├── createTetrahedron.ts
│   └── index.ts
├── convert/           # Import/export utilities
│   ├── triangulateForExport.ts
│   ├── exportOBJ.ts
│   └── index.ts
├── utils/             # Shared utilities
│   ├── math.ts
│   ├── geometryHelpers.ts
│   ├── id.ts
│   └── index.ts
├── types/             # Type definitions
│   └── index.ts
└── index.ts           # Main exports
```

## 📚 API Reference

### Core Classes

#### EditableMesh

The main mesh data structure that supports flexible face types.

```typescript
const mesh = new EditableMesh();

// Add vertices
const vertex = mesh.addVertex({ x: 0, y: 0, z: 0 });

// Add edges
const edge = mesh.addEdge(vertex1Id, vertex2Id);

// Add faces (supports 3+ vertices)
const face = mesh.addFace([v1, v2, v3, v4], [e1, e2, e3, e4]);

// Get statistics
const stats = mesh.getStats();
console.log(`Quads: ${stats.quadCount}, Triangles: ${stats.triangleCount}, N-gons: ${stats.ngonCount}`);
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

#### createTetrahedron(params: TetrahedronParams): EditableMesh

Creates a tetrahedron with triangular faces.

```typescript
const tetrahedron = createTetrahedron({ size: 1 });
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

#### mergeTrianglesToQuads(mesh: EditableMesh): EditableMesh

Attempts to merge adjacent triangles into quads where topology allows.

```typescript
const quadified = mergeTrianglesToQuads(mesh);
```

### Geometry Helpers

#### addQuad(mesh, v0, v1, v2, v3)

Creates a quad face from four vertex positions.

```typescript
const result = addQuad(mesh, 
  { x: 0, y: 0, z: 0 },
  { x: 1, y: 0, z: 0 },
  { x: 1, y: 1, z: 0 },
  { x: 0, y: 1, z: 0 }
);
```

#### addTriangle(mesh, v0, v1, v2)

Creates a triangle face from three vertex positions.

```typescript
const result = addTriangle(mesh,
  { x: 0, y: 0, z: 0 },
  { x: 1, y: 0, z: 0 },
  { x: 0.5, y: 1, z: 0 }
);
```

#### addNGon(mesh, vertices)

Creates an n-gon face from an array of vertex positions.

```typescript
const result = addNGon(mesh, [
  { x: 0, y: 0, z: 0 },
  { x: 1, y: 0, z: 0 },
  { x: 1, y: 1, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0.5, y: 0.5, z: 1 }
]);
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
} from 'edit-threejs';

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
} from 'edit-threejs';

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
} from 'edit-threejs';

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

### Additional Primitives

#### Extended Shape Library

```typescript
import { 
  createPlane,
  createGrid,
  createSphere,
  createCylinder 
} from 'edit-threejs';

// Create a plane with 4 vertices and 1 quad face
const plane = createPlane({ width: 2, height: 2 });

// Create a grid with configurable segments
const grid = createGrid({ width: 2, height: 2, widthSegments: 4, heightSegments: 4 });

// Create a sphere with quads and triangles
const sphere = createSphere({ radius: 1, widthSegments: 8, heightSegments: 6 });

// Create a cylinder with caps and body
const cylinder = createCylinder({ radius: 1, height: 2, radialSegments: 8 });
```
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

### Running Examples

```bash
npx tsx src/test.ts
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
- Flexible quad/tri/n-gon support
- OBJ export with face type preservation
- Triangulation for export formats
- Modular, headless architecture 