✨ edit-threejs Modular 3D Editing Library — AI Build Prompt
🏗️ Project Overview
edit-threejs is a modular TypeScript/ESM library for editing 3D geometry using Three.js.
It supports real-time, topology-safe editing of primitives, vertices, edges, faces, UVs, materials, and transformations.
It is headless (no UI), lightweight, and designed for integration into any 3D modeling app, CAD tool, or custom workflow.

 Quad/Tris/N-gon Editing & Export for edit-threejs
Goal
Build a modular system where:

All primitives and editing tools prefer quad faces (four-sided polygons) wherever possible.

EditableMesh stores faces as quads, triangles, or n-gons (arbitrary-sided polygons) as needed.

All editing and mesh operations work with quads, triangles, and n-gons, but always prefer quads for new geometry.

Exports to OBJ or other quad-supporting formats preserve quads; triangles or n-gons are only generated when required by the export target (e.g., GLTF, STL).

Conversion utilities exist to triangulate quads and n-gons only at export-time for formats that require triangles.

Implementation Details
1. Primitives
Every primitive (e.g., createCube, createPlane, createGrid, etc.) must generate quad faces by default, except for shapes that require triangles (e.g., createTetrahedron, sphere caps).

Faces are stored as face.vertexIds arrays of length 3 (tri), 4 (quad), or more (n-gon).

Avoid producing triangles unless necessary for geometry/topology.

2. Editing Tools
All mesh editing tools (extrudeFaces, subdivideEdge, bevelEdge, bridgeFaces, etc.):

Always attempt to output quads.

If a tool must split or create faces and quads are impossible, output triangles.

Support for n-gons is allowed for advanced cases (bevels, holes, etc.).

Editing and selection tools must be n-gon/tri/quad aware.

3. Mesh Storage
The Face structure supports any number of vertices:

ts
Copy
Edit
interface Face { id: number; vertexIds: number[]; ... }
All editing and topology tools work for tris, quads, and n-gons.

Imported geometry with tris/n-gons can be run through a “merge triangles to quads” tool (mergeTrianglesToQuads), but editing as tris/n-gons is fully supported.

4. Quad/N-gon to Triangle Conversion (For Export)
Provide a triangulateForExport(mesh) utility:

Converts all faces to triangles:

Quads → 2 triangles (diagonal split)

N-gons → triangulate (earcut or fan)

Tris → unchanged

Exporters:

OBJ exporter: writes faces as 3, 4, or more indices (OBJ supports n-gons, but most apps only use tris/quads).

GLTF/STL: Triangulate with triangulateForExport.

5. OBJ Export Example
When exporting to OBJ:

Faces with 4 indices output as quads:

nginx
Copy
Edit
f 1 2 3 4
Faces with 3 indices output as tris:

nginx
Copy
Edit
f 1 2 3
Faces with >4 indices output as n-gons (supported by some apps):

nginx
Copy
Edit
f 1 2 3 4 5
6. Importers
When importing geometry:

Import tris/quads/n-gons as-is.

Optionally, run a tool to merge adjacent triangles into quads where possible.

7. Documentation
Document all primitives, tools, and exporters:

“Faces may be quads, tris, or n-gons depending on the mesh operation, import, or primitive. Editing tools and exporters preserve quads and tris where possible; triangulation is performed only when required by the export format.”

API Example
ts
Copy
Edit
import { EditableMesh, createCube, createTetrahedron, exportOBJ, triangulateForExport } from 'edit-threejs'

// Cube: faces are quads
const mesh = createCube({ width: 1, height: 1, depth: 1 })
console.log(mesh.faces[0].vertexIds.length) // 4 (quad!)

// Tetrahedron: faces are tris
const mesh2 = createTetrahedron({ size: 1 })
console.log(mesh2.faces[0].vertexIds.length) // 3 (tri!)

const objData = exportOBJ(mesh)    // Preserves quads/tris/n-gons!
const tris = triangulateForExport(mesh) // All faces become tris for STL/GLTF/etc
📝 Checklist for AI Coders
 All primitive generators create quad faces when possible, tris if required (e.g., tetrahedron, sphere caps).

 All editing tools operate on and output quads, but fully support tris/n-gons when needed.

 Face storage supports arbitrary vertex counts.

 OBJ exporter outputs faces with 3 (tris), 4 (quads), or >4 (n-gon) indices.

 Provide robust quad/n-gon-to-triangle conversion utilities for other formats.

 Include a “tris to quads” tool for importers.

 No unnecessary triangulation during editing—quads/tris/n-gons are preserved at all times unless the user requests triangulation/export requires it.

 All documentation notes quad/tri/n-gon support for editing, import, and export.

This approach gives you Blender-style flexibility:

All editing can be done on quads, tris, or n-gons.

You always keep quads/tris for OBJ export.

Triangulation only happens at export when the target format demands it.

📁 Folder & File Structure
Every file should do one job only. No large multi-responsibility files.
TypeScript + ESM only.
Use a folder and file structure like:

pgsql
Copy
Edit
edit-threejs/
├── core/              # Core data structures (EditableMesh, Vertex, Edge, Face, UV, Material)
│   ├── EditableMesh.ts
│   ├── Vertex.ts
│   ├── Edge.ts
│   ├── Face.ts
│   ├── UV.ts
│   └── MaterialSlot.ts
├── primitives/        # Cube, Sphere, Cylinder, Plane, etc.
│   ├── createCube.ts
│   ├── createSphere.ts
│   ├── createCylinder.ts
│   ├── createPlane.ts
│   ├── index.ts
├── tools/             # Modeling tools (extrude, subdivide, merge, delete, bevel, etc.)
│   ├── extrudeFaces.ts
│   ├── subdivideEdge.ts
│   ├── mergeVertices.ts
│   ├── deleteFaces.ts
│   ├── index.ts
├── selection/         # Selection model and helpers
│   ├── SelectionModel.ts
│   ├── selectFace.ts
│   ├── deselectAll.ts
│   ├── isFaceSelected.ts
│   ├── index.ts
├── transforms/        # Matrix transforms, pivot tools, bounding box, etc.
│   ├── applyTransform.ts
│   ├── computeBoundingBox.ts
│   ├── index.ts
├── convert/           # Import/export with THREE.BufferGeometry
│   ├── toBufferGeometry.ts
│   ├── fromBufferGeometry.ts
│   ├── index.ts
├── validate/          # Topology, winding, manifoldness, etc.
│   ├── checkNonManifold.ts
│   ├── checkFaceWinding.ts
│   ├── validateMeshTopology.ts
│   ├── fixFaceWinding.ts
│   ├── mergeCloseVertices.ts
│   ├── index.ts
├── utils/             # Pure helpers (math, geometry, topology, ids, debug)
│   ├── math.ts
│   ├── geometryHelpers.ts
│   ├── topology.ts
│   ├── id.ts
│   ├── debug.ts
│   ├── index.ts
├── types/             # Shared types, enums, constants
│   ├── index.ts
├── index.ts           # Exports entire public API (single entry point)
🧩 Module Responsibilities (Detailed)
1. core/
Defines all base data structures and core mesh logic.

Each concept (vertex, edge, face, uv, material) is its own file.

EditableMesh.ts should only handle mesh-wide logic (add/remove/query/clone).

No direct Three.js usage in core types.
Types should use Vector3Like/Vector2Like for compatibility.

2. primitives/
Each primitive has its own file: createCube.ts, createSphere.ts, etc.

No shared code duplicated:
Place grid/face/segment generation helpers in utils/geometryHelpers.ts.

Primitives should return a fresh EditableMesh.

3. tools/
Every modeling/editing tool gets its own file (single responsibility).

Pure, stateless tools are preferred:

Accept a mesh and params.

Return a new mesh or mutate (if explicit).

Compatible with undo/redo.

Use helpers from utils/topology.ts and utils/math.ts.

4. selection/
Encapsulates all selection logic, e.g., SelectionModel.ts, selectFace.ts, etc.

Never embed selection state in the mesh itself (decouple editing data from UI/interaction state).

Small, focused selection helpers (select, deselect, toggle, query).

5. transforms/
Handles matrix, axis, and pivot-based transformations on objects or selections.

One file per transform type (e.g., applyTransform.ts, computeBoundingBox.ts).

Uses math helpers from utils/math.ts.

Handles both object and per-element transforms.

6. convert/
Provides conversion utilities:

toBufferGeometry(mesh): THREE.BufferGeometry

fromBufferGeometry(geometry): EditableMesh

Ensure full support for UVs, materials, and winding.

Run through validation before/after conversion.

7. validate/
Each validator is its own file (e.g., checkNonManifold.ts).

Include fixers for winding, close vertices, etc.

Validators must not mutate input unless explicitly designed to "fix."

8. utils/
Place all shared logic here.

math.ts for vector/matrix/geometry math

geometryHelpers.ts for addQuad(), addTriangle(), etc.

topology.ts for edge/face/vertex traversal

id.ts for unique id generation

debug.ts for mesh stats, logging

Absolutely no duplicate code in primitives/tools—refactor all logic here.

9. types/
Define and export all shared types, interfaces, enums.

Always use strict typing (interface, enum, type).

Use Vector3Like and Vector2Like for Three.js interop, but never depend directly on Three.js in type definitions.

10. index.ts
Public API, re-exporting all features cleanly.

Each folder must have its own index.ts to re-export local modules.

🛠️ Best Coding Practices
TypeScript and ESModules only. No CommonJS, no legacy code.

One job per file. No “god” files or multipurpose modules.

Naming conventions: camelCase for functions/variables, PascalCase for classes/types.

Pure functions wherever possible. Side effects only where clearly documented.

Stateless editing tools (no global state).

Undo/redo compatibility: tools should not mutate input mesh unless explicitly requested.

All code is headless. No UI, DOM, or Three.js rendering code in core library.

Extensive comments and docstrings—every function should explain its job and params.

✨ API Example
ts
Copy
Edit
import { EditableMesh, createCube, extrudeFaces, toBufferGeometry } from 'edit-threejs'

const mesh = createCube({ width: 2, height: 1, depth: 2, widthSegments: 2 })
const mesh2 = extrudeFaces(mesh, [0, 1, 2], 1.5)
const threeGeometry = toBufferGeometry(mesh2)
🧪 Optional (Strongly Recommended) Bonus Modules
history/
Undo/redo system: e.g., UndoStack.push(mesh.clone())

One file per function (undo, redo, stack).

test/
Use Vitest or Jest.

Every tool, primitive, and helper should have a test file.

playground/
Simple Three.js-based testbed for visually checking primitives and tools.

✅ AI Implementation Checklist
Task	Folder	Details
Create all data structures	core/	Separate file per type
Build each primitive	primitives/	One file per shape, no code duplication
Implement tools	tools/	One file per tool, pure where possible
Create selection helpers	selection/	Decoupled from mesh core
Add transform logic	transforms/	One file per transform
Support import/export	convert/	Handle all data types
Validate mesh	validate/	Each check/fix in its own file
Utilities for math/topology	utils/	All shared logic centralized
Types	types/	All interfaces/enums/consts here
Clean exports	index.ts	Use index.ts for every folder and root
No duplicate code	—	Move all common logic to utils/
Use pure functions	—	Mutate only if explicitly intended
Document everything	—	Docstrings for every function & class

Purpose
Build a powerful, Blender-style modular visuals system that provides:

Camera grids (3D, ortho, axis)

Selection/hover highlights

Edit mode handles (points, cubes, spheres)

Gizmos (move, rotate, scale)

Bounding boxes, centers

Raycast/hover markers

Measurement/guide overlays (ruler, angle)

Snapping/constraint helpers

Axis and viewport overlays

UV and animation overlays

Annotation/error overlays

Selection box

All helpers are small, stateless, and never modify core mesh/selection data.

🗂 Recommended Folder & File Structure
cpp
Copy
Edit
visuals/
├── grids/
│   ├── GridHelper3D.ts          // 3D grid like Blender/THREE.GridHelper
│   ├── OrthoGridHelper.ts       // 2D ortho/top/front/side grid
│   ├── AxisHelper.ts            // XYZ axis lines/arrows
│   ├── index.ts
├── highlights/
│   ├── HighlightVertices.ts     // Highlights selected verts
│   ├── HighlightEdges.ts        // Highlights selected edges
│   ├── HighlightFaces.ts        // Highlights selected faces
│   ├── HoverHighlightHelper.ts  // Visual feedback on hover
│   ├── ErrorHighlightHelper.ts  // Show mesh errors (non-manifold, flipped, etc)
│   ├── index.ts
├── handles/
│   ├── VertexHandles.ts         // Spheres/cubes at vertices
│   ├── EdgeHandles.ts           // Handles at edge midpoints
│   ├── FaceHandles.ts           // Handles at face centers
│   ├── index.ts
├── gizmos/
│   ├── GizmoTranslate.ts        // Move arrows
│   ├── GizmoRotate.ts           // Rotate arcs
│   ├── GizmoScale.ts            // Scale handles
│   ├── index.ts
├── overlays/
│   ├── MiniAxisOverlay.ts       // Small orientation widget
│   ├── ViewportInfoOverlay.ts   // Mode/camera info
│   ├── SelectionBoxHelper.ts    // Drag box for selection
│   ├── RulerHelper.ts           // Visual ruler/measure
│   ├── AngleHelper.ts           // Visual angle overlay
│   ├── AnnotationHelper.ts      // Notes/markers
│   ├── ConstraintLineHelper.ts  // Show axis-constraint lines
│   ├── GridSnapHelper.ts        // Snap grid/markers
│   ├── CenterPointHelper.ts     // Show object/selection center
│   ├── BoundingBoxHelper.ts     // Shows bounding box
│   ├── BoundingSphereHelper.ts  // Shows bounding sphere
│   ├── RaycastMarker.ts         // Marker at raycast hit point
│   ├── index.ts
├── uvs/
│   ├── UVGridHelper.ts          // Checker grid for UV view
│   ├── UVSelectionHighlight.ts  // UV selection highlight
│   ├── UVHandlePoints.ts        // Handles at UVs
│   ├── index.ts
├── animation/
│   ├── SkeletonHelper.ts        // Bones/joints display
│   ├── IKHandleHelper.ts        // IK control points
│   ├── index.ts
├── index.ts
✅ General Best Practices
Stateless: Helpers only read mesh, selection, or camera state.

No mutation: Never modify the mesh, selection, or any editing state.

Single responsibility: Each helper = one file = one purpose.

Reusable: Plug into any Three.js or R3F scene.

Arguments: Accept mesh, selection, camera, or whatever is needed as arguments (never import editing core directly).

✨ How To Use / Example Imports
ts
Copy
Edit
import { GridHelper3D, AxisHelper } from 'edit-threejs/visuals/grids'
import { HighlightVertices, HighlightFaces } from 'edit-threejs/visuals/highlights'
import { VertexHandles, FaceHandles } from 'edit-threejs/visuals/handles'
import { GizmoTranslate } from 'edit-threejs/visuals/gizmos'
import { BoundingBoxHelper } from 'edit-threejs/visuals/overlays'

// In your Three.js scene:
scene.add(GridHelper3D({ size: 20, divisions: 40 }))
scene.add(AxisHelper({ size: 5 }))

scene.add(HighlightVertices(mesh, selection))
scene.add(FaceHandles(mesh, { size: 0.08, color: 0x88ff00 }))

scene.add(GizmoTranslate(selection, camera))
scene.add(BoundingBoxHelper(mesh, selection))
🛠️ What Each Folder Covers (Detailed):
grids/: Floor grid, ortho grids, world axes.

highlights/: Selection, hover, error overlays (vertex, edge, face).

handles/: Handles/cubes/spheres at vertices, edge midpoints, face centers (for editing/picking).

gizmos/: Move/rotate/scale manipulators.

overlays/: Bounding boxes, snap overlays, center markers, selection box, info overlays, rulers, angles, annotation, constraint lines, raycast markers.

uvs/: UV overlays, grid, highlights, UV edit handles.

animation/: Skeleton and IK visual aids.

🚦 Helpers That Are Always Conflict-Free
Grids, overlays, handles, highlights, gizmos, markers, measurement helpers, annotation, selection box, axis overlays, UV and animation widgets.

As long as helpers are stateless and visual only, you’ll never have conflicts.

📝 AI/Dev Prompt Summary
Implement each visual helper as a small, stateless, reusable function/class in its own file, inside the appropriate visuals/ subfolder.

Each helper must only consume mesh, selection, camera, or mode state as function arguments and must never mutate editing data or depend on global state.

Each folder should have an index.ts for re-exporting, and a root visuals/index.ts for clean imports.

🚀 This Structure Gives You:
The flexibility of Blender/Unity visual helpers in your own editor.

Completely modular, future-proof files.

No chance of conflict with mesh editing/data logic.

# Three.js Edit Buddy - Development Plan

## Core Architecture

### Headless Design
- Core library is completely headless (no Three.js dependencies)
- Visual helpers are separate modules that depend on Three.js
- All core operations work with pure data structures

### Modular Structure
- One concept per file
- Shared utilities in `/utils`
- Clear separation of concerns
- Independent testability

## Current Status

### ✅ Completed Features

#### Core System
- [x] EditableMesh data structure
- [x] Vertex, Edge, Face, UV, Material types
- [x] Topology management (vertex/edge/face connections)
- [x] ID generation system
- [x] Math utilities (Vector3Like, Vector2Like operations)
- [x] Geometry helpers (addQuad, addTriangle)

#### Primitives (All Refactored for Shared Vertices)
- [x] createCube - 8 vertices, 12 edges, 6 quad faces
- [x] createTetrahedron - 4 vertices, 6 edges, 4 triangular faces
- [x] createPlane - 4 vertices, 4 edges, 1 quad face
- [x] createGrid - Configurable segments with shared vertices
- [x] createSphere - Spherical mesh with quads and triangles
- [x] createCylinder - Cylindrical mesh with caps and body

#### Editing Tools
- [x] extrudeFaces - Extrude selected faces
- [x] mergeVertices - Merge vertices within threshold
- [x] subdivideEdge - Subdivide edges
- [x] deleteFaces - Delete faces and cleanup
- [x] bevelEdge - Bevel edges
- [x] loopCut - Cut loops around mesh
- [x] knifeCut - Cut mesh with plane
- [x] insetFaces - Inset faces
- [x] bridgeFaces - Bridge between faces

#### Validation & Utilities
- [x] validateMeshIntegrity - Check mesh consistency
- [x] validateMeshTopology - Check topology validity
- [x] checkFaceWinding - Check and fix face winding
- [x] isManifold, isClosed - Topology checks
- [x] getMeshStats - Mesh statistics

#### Visual Helpers (Three.js Dependent)
- [x] GizmoTranslate - Translation gizmo
- [x] GizmoRotate - Rotation gizmo
- [x] GizmoScale - Scale gizmo
- [x] AxisHelper - Coordinate axes
- [x] GridHelper3D - 3D grid
- [x] OrthoGridHelper - Orthographic grid
- [x] HighlightVertices - Vertex highlighting
- [x] HighlightEdges - Edge highlighting
- [x] HighlightFaces - Face highlighting
- [x] VertexHandles - Vertex manipulation handles
- [x] EdgeHandles - Edge manipulation handles
- [x] FaceHandles - Face manipulation handles
- [x] BoundingBoxHelper - Bounding box visualization
- [x] MiniAxisOverlay - Mini coordinate system
- [x] UVGridHelper - UV grid visualization
- [x] UVSelectionHighlight - UV selection highlighting
- [x] SkeletonHelper - Skeleton visualization
- [x] IKHelper - IK chain visualization

#### Export/Conversion
- [x] exportOBJ - Export to OBJ format
- [x] toBufferGeometry - Convert to Three.js BufferGeometry
- [x] triangulateForExport - Triangulate for export

#### Testing
- [x] Vitest configuration
- [x] Unit tests for all primitives
- [x] Shared vertex validation tests

## 🚧 Future Primitives Plan

### Phase 1: Basic Geometric Primitives
- [ ] **createCone** - Cone with configurable height and radius
  - Parameters: radius, height, radialSegments, heightSegments
  - Topology: Shared vertices for body, separate for caps
  - Test: Verify vertex count and face types

- [ ] **createTorus** - Torus (donut) shape
  - Parameters: radius, tubeRadius, radialSegments, tubularSegments
  - Topology: All quads, shared vertices
  - Test: Verify torus topology and UV mapping

- [ ] **createOctahedron** - 8-sided polyhedron
  - Parameters: radius
  - Topology: 6 vertices, 12 edges, 8 triangular faces
  - Test: Verify octahedron geometry

- [ ] **createDodecahedron** - 12-sided polyhedron
  - Parameters: radius
  - Topology: 20 vertices, 30 edges, 12 pentagonal faces
  - Test: Verify dodecahedron geometry

- [ ] **createIcosahedron** - 20-sided polyhedron
  - Parameters: radius
  - Topology: 12 vertices, 30 edges, 20 triangular faces
  - Test: Verify icosahedron geometry

### Phase 2: Advanced Primitives
- [ ] **createTorusKnot** - Complex torus knot
  - Parameters: p, q, radius, tubeRadius, radialSegments, tubularSegments
  - Topology: Complex surface with shared vertices
  - Test: Verify knot topology

- [ ] **createHelix** - Helical shape
  - Parameters: radius, height, turns, radialSegments, heightSegments
  - Topology: Cylindrical with spiral
  - Test: Verify helix geometry

- [ ] **createPyramid** - Pyramid with configurable base
  - Parameters: baseWidth, baseHeight, height, baseSegments
  - Topology: Base + triangular sides
  - Test: Verify pyramid topology

- [ ] **createPrism** - Triangular prism
  - Parameters: baseWidth, height
  - Topology: 6 vertices, 9 edges, 5 faces (2 triangles + 3 quads)
  - Test: Verify prism geometry

### Phase 3: Procedural Primitives
- [ ] **createTerrain** - Heightmap-based terrain
  - Parameters: width, height, segments, heightmap
  - Topology: Grid with height variation
  - Test: Verify terrain generation

- [ ] **createFractal** - Fractal-based geometry
  - Parameters: iterations, scale, baseGeometry
  - Topology: Recursive subdivision
  - Test: Verify fractal properties

- [ ] **createLSystem** - L-system generated geometry
  - Parameters: axiom, rules, iterations, angle, length
  - Topology: Branching structure
  - Test: Verify L-system generation

### Phase 4: Specialized Primitives
- [ ] **createText** - 3D text geometry
  - Parameters: text, font, size, depth
  - Topology: Extruded text shapes
  - Test: Verify text geometry

- [ ] **createSpline** - Spline-based geometry
  - Parameters: points, segments, closed
  - Topology: Smooth curve surface
  - Test: Verify spline properties

- [ ] **createRevolution** - Surface of revolution
  - Parameters: profile, axis, segments
  - Topology: Rotated profile
  - Test: Verify revolution geometry

## 🧪 Testing Strategy

### Unit Tests for Each Primitive
```typescript
// Template for primitive tests
describe('create[PrimitiveName]', () => {
  it('should create correct topology', () => {
    const mesh = create[PrimitiveName](params);
    expect(mesh.vertices.length).toBe(expectedVertexCount);
    expect(mesh.faces.length).toBe(expectedFaceCount);
    expect(mesh.edges.length).toBe(expectedEdgeCount);
  });

  it('should have correct face types', () => {
    const mesh = create[PrimitiveName](params);
    for (const face of mesh.faces) {
      expect(['triangle', 'quad', 'ngon'].includes(getFaceType(face))).toBe(true);
    }
  });

  it('should use shared vertices', () => {
    const mesh = create[PrimitiveName](params);
    // Verify no duplicate vertices at same position
    const positions = mesh.vertices.map(v => JSON.stringify(v.position));
    const uniquePositions = new Set(positions);
    expect(uniquePositions.size).toBe(mesh.vertices.length);
  });

  it('should have valid topology', () => {
    const mesh = create[PrimitiveName](params);
    expect(validateMeshTopology(mesh)).toBe(true);
  });
});
```

### Integration Tests
- [ ] **Primitive Combinations** - Test combining multiple primitives
- [ ] **Editing Operations** - Test editing operations on each primitive
- [ ] **Export/Import** - Test export/import cycle for each primitive
- [ ] **Performance** - Test performance with large primitive counts

### Property-Based Tests
- [ ] **Random Parameters** - Test with random valid parameters
- [ ] **Edge Cases** - Test with minimum/maximum parameter values
- [ ] **Invalid Inputs** - Test error handling for invalid parameters

## 📋 Implementation Guidelines

### For Each New Primitive

1. **Plan the Topology**
   - Calculate exact vertex, edge, and face counts
   - Design vertex positions and connectivity
   - Plan UV mapping strategy

2. **Implement with Shared Vertices**
   - Use `addVertex()` for unique positions only
   - Use `addEdge()` to connect vertices
   - Use `addFace()` with vertex IDs and edge IDs
   - Never use `addQuad()` or `addTriangle()` with positions

3. **Add Comprehensive Tests**
   - Unit tests for topology validation
   - Tests for parameter variations
   - Tests for edge cases

4. **Document the Primitive**
   - Clear parameter descriptions
   - Topology explanation
   - Usage examples

5. **Update Exports**
   - Add to `src/primitives/index.ts`
   - Add to main library exports
   - Update documentation

### Quality Standards

- **Performance**: Efficient vertex/edge/face creation
- **Memory**: Minimal memory footprint with shared vertices
- **Robustness**: Handle all parameter edge cases
- **Consistency**: Follow established patterns
- **Testability**: Fully testable with clear expectations

## 🎯 Next Steps

1. **Complete Current Testing Phase**
   - Add integration tests for existing primitives
   - Add performance benchmarks
   - Add property-based tests

2. **Implement Phase 1 Primitives**
   - Start with `createCone` (simplest)
   - Progress through geometric primitives
   - Maintain consistent quality standards

3. **Expand Testing Framework**
   - Add visual regression tests
   - Add performance regression tests
   - Add automated quality checks

4. **Documentation and Examples**
   - Create comprehensive API documentation
   - Add interactive examples
   - Create tutorial content

This plan ensures systematic, high-quality primitive development with comprehensive testing and clear implementation guidelines.

