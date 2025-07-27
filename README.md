# Three.js Edit Buddy

A comprehensive, modular 3D editing library for Three.js that supports flexible quad/tri/n-gon geometry with full topology management, advanced editing tools, and an interactive demo showcasing real-time vertex editing.

## 🚀 **NEW: Easy-to-Use Library Features**

The library now includes powerful selection and visualization systems that make it incredibly easy to build interactive 3D editors:

### **SelectionManager** - Smart Selection System
```typescript
import { SelectionManager } from 'three-edit-buddy';

// Create a selection manager for your mesh
const selectionManager = new SelectionManager(mesh, {
  threshold: 0.5,        // Picking distance
  multiSelect: true,     // Allow multiple selections
  toggleOnReclick: true  // Toggle selection on re-click
});

// Easy selection from raycast
const selectedId = selectionManager.selectFromRaycast(intersection, 'face');

// Smart selection operations
selectionManager.selectConnectedVertices();
selectionManager.selectFacesWithSelectedVertices();
selectionManager.selectEdgesWithSelectedVertices();
```

### **MeshVisualHelper** - Complete Visual System
```typescript
import { MeshVisualHelper } from 'three-edit-buddy';

// Create a visual helper with full customization
const visualHelper = new MeshVisualHelper(mesh, selectionManager, {
  vertices: {
    color: 0xffff00,
    size: 0.1,
    shape: 'cube'  // or 'sphere'
  },
  edges: {
    color: 0xff0000,
    width: 2
  },
  faces: {
    color: 0x00ff00,
    opacity: 0.3
  },
  selection: {
    selectedVertexColor: 0xff6600,
    selectedEdgeColor: 0x00ffff,
    selectedFaceColor: 0xff6600
  }
});

// Add to scene
const groups = visualHelper.getVisualGroups();
scene.add(groups.vertexGroup);
scene.add(groups.edgeGroup);
scene.add(groups.faceGroup);
scene.add(groups.selectionGroup);

// Automatic updates
visualHelper.updateVisuals();
```

### **Complete Demo in 50 Lines**
```typescript
import { createCube, SelectionManager, MeshVisualHelper } from 'three-edit-buddy';

// Create mesh and helpers
const mesh = createCube();
const selectionManager = new SelectionManager(mesh);
const visualHelper = new MeshVisualHelper(mesh, selectionManager);

// Setup Three.js
const geometry = mesh.toBufferGeometry();
const material = new THREE.MeshPhongMaterial({ color: 0x667eea });
const meshObject = new THREE.Mesh(geometry, material);
scene.add(meshObject);

// Add visual groups
const groups = visualHelper.getVisualGroups();
Object.values(groups).forEach(group => scene.add(group));

// Handle mouse events
raycaster.setFromCamera(mouse, camera);
const intersects = raycaster.intersectObject(meshObject);
if (intersects.length > 0) {
  selectionManager.selectFromRaycast(intersects[0], 'face');
  visualHelper.updateVisuals();
}
```

## 🎯 **Key Features**

### **🏗️ Core Architecture**
- **Headless Design**: Core library is completely headless (no Three.js dependencies)
- **Modular Structure**: One concept per file, shared utilities in `/utils`
- **Topology-First**: All editing operations maintain proper mesh connectivity
- **TypeScript + ESM**: Modern development stack with full type safety

### **📦 Core System**
- **EditableMesh** data structure with topology management
- **Vertex, Edge, Face, UV, Material** types with proper connections
- **ID generation system** for unique element identification
- **Math utilities** (Vector3Like, Vector2Like operations)
- **Geometry helpers** (addQuad, addTriangle, addNGon)
- **Topology conversion** (toEditableMesh, toBufferGeometry)

### **🎨 Primitives (All Implemented with Shared Vertices)**
- **createCube** - 8 vertices, 12 edges, 6 quad faces
- **createSphere** - ~42 vertices, ~80 edges, ~40 faces (mixed quads/triangles)
- **createCylinder** - ~18 vertices, ~40 edges, ~24 faces
- **createCone** - ~10 vertices, ~24 edges, ~16 faces
- **createPyramid** - 5 vertices, 8 edges, 5 faces
- **createPlane** - 4 vertices, 4 edges, 1 quad face
- **createTetrahedron** - 4 vertices, 6 edges, 4 triangular faces
- **createGrid** - Configurable segments with shared vertices

### **🔧 Editing Tools**
- **extrudeFaces** - Extrude selected faces with proper topology
- **mergeVertices** - Merge vertices within threshold
- **subdivideEdge** - Subdivide edges with topology maintenance
- **deleteFaces** - Delete faces and cleanup
- **bevelEdge** - Bevel edges with proper face creation
- **loopCut** - Cut loops around mesh
- **knifeCut** - Cut mesh with plane
- **insetFaces** - Inset faces with topology preservation
- **bridgeFaces** - Bridge between faces

### **✅ Validation & Utilities**
- **validateMeshIntegrity** - Check mesh consistency
- **validateMeshTopology** - Check topology validity
- **checkFaceWinding** - Check and fix face winding
- **isManifold, isClosed** - Topology checks
- **getMeshStats** - Mesh statistics
- **Face type utilities** (getFaceType, isQuad, isTriangle, isNGon)

### **🎨 Visual Helpers (Three.js Dependent)**
- **SelectionManager** - Complete selection system with smart operations
- **MeshVisualHelper** - Comprehensive visual system for vertices, edges, faces, and selection
- **GizmoTranslate** - Translation gizmo
- **GizmoRotate** - Rotation gizmo
- **GizmoScale** - Scale gizmo
- **AxisHelper** - Coordinate axes
- **GridHelper3D** - 3D grid
- **OrthoGridHelper** - Orthographic grid
- **HighlightVertices** - Vertex highlighting
- **HighlightEdges** - Edge highlighting
- **HighlightFaces** - Face highlighting
- **VertexHandles** - Vertex manipulation handles
- **EdgeHandles** - Edge manipulation handles
- **FaceHandles** - Face manipulation handles
- **BoundingBoxHelper** - Bounding box visualization
- **MiniAxisOverlay** - Mini coordinate system
- **UVGridHelper** - UV grid visualization
- **UVSelectionHighlight** - UV selection highlighting

## 📚 **Quick Start**

### **Installation**
```bash
npm install three-edit-buddy
```

### **Basic Usage**
```typescript
import { createCube, EditableMesh } from 'three-edit-buddy';

// Create a cube primitive
const mesh = createCube({ size: 2 });

// Convert to Three.js geometry
const geometry = mesh.toBufferGeometry();

// Use with Three.js
const material = new THREE.MeshPhongMaterial({ color: 0x667eea });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
```

### **Interactive Editing**
```typescript
import { SelectionManager, MeshVisualHelper } from 'three-edit-buddy';

// Setup selection and visualization
const selectionManager = new SelectionManager(mesh);
const visualHelper = new MeshVisualHelper(mesh, selectionManager);

// Handle mouse events
raycaster.setFromCamera(mouse, camera);
const intersects = raycaster.intersectObject(meshObject);
if (intersects.length > 0) {
  // Select face
  selectionManager.selectFromRaycast(intersects[0], 'face');
  visualHelper.updateVisuals();
  
  // Or select vertex
  selectionManager.selectFromRaycast(intersects[0], 'vertex');
  visualHelper.updateVisuals();
}
```

### **Vertex Editing**
```typescript
// Move a vertex (updates all connected faces/edges automatically)
mesh.moveVertex(vertexId, { x: 1, y: 0, z: 0 });

// Update Three.js geometry
const newGeometry = mesh.toBufferGeometry();
meshObject.geometry.dispose();
meshObject.geometry = newGeometry;
```

## 🏗️ **Architecture**

### **Core Principles**
1. **Topology-First**: All operations maintain proper mesh connectivity
2. **Shared Vertices**: Vertices are unique and referenced by faces/edges
3. **ID-Based**: All elements have unique IDs for reliable referencing
4. **Headless Core**: No Three.js dependencies in core modules
5. **Modular Design**: One concept per file, clean exports

### **Folder Structure**

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
├── selection/         # Selection and interaction
│   ├── SelectionManager.ts
│   └── index.ts
├── visuals/           # Visual helpers
│   ├── MeshVisualHelper.ts
│   ├── highlights/
│   ├── gizmos/
│   ├── grids/
│   ├── handles/
│   ├── overlays/
│   ├── uvs/
│   ├── animation/
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
├── examples/          # Usage examples
│   └── SimpleDemo.ts
├── demo/              # Interactive demo
│   ├── demo.js
│   ├── index.html
│   └── vite.config.js
└── index.ts           # Main exports
```

## 📚 **API Reference**

### **Core Classes**

#### **EditableMesh**

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

// Convert to Three.js geometry
const geometry = mesh.toBufferGeometry();
```

#### **SelectionManager**

Manages selection state and operations for an EditableMesh.

```typescript
const selectionManager = new SelectionManager(mesh, {
  threshold: 0.5,        // Picking distance
  multiSelect: true,     // Allow multiple selections
  clearOnSelect: false,  // Clear existing selection
  toggleOnReclick: true  // Toggle selection on re-click
});

// Selection operations
selectionManager.selectVertex(vertexId);
selectionManager.selectEdge(edgeId);
selectionManager.selectFace(faceId);

// Smart selection
selectionManager.selectConnectedVertices();
selectionManager.selectFacesWithSelectedVertices();
selectionManager.selectEdgesWithSelectedVertices();

// Get selection state
const selection = selectionManager.getSelection();
```

#### **MeshVisualHelper**

Comprehensive visual helper for EditableMesh with selection support.

```typescript
const visualHelper = new MeshVisualHelper(mesh, selectionManager, {
  vertices: {
    color: 0xffff00,
    size: 0.1,
    shape: 'cube'
  },
  edges: {
    color: 0xff0000,
    width: 2
  },
  faces: {
    color: 0x00ff00,
    opacity: 0.3
  },
  selection: {
    selectedVertexColor: 0xff6600,
    selectedEdgeColor: 0x00ffff,
    selectedFaceColor: 0xff6600
  }
});

// Get visual groups for scene
const groups = visualHelper.getVisualGroups();
scene.add(groups.vertexGroup);
scene.add(groups.edgeGroup);
scene.add(groups.faceGroup);
scene.add(groups.selectionGroup);

// Update visuals
visualHelper.updateVisuals();

// Control visibility
visualHelper.setVisibility('vertices', true);
visualHelper.setVisibility('edges', false);
```

### **Primitives**

All primitives create proper `EditableMesh` instances with shared vertices:

```typescript
import { 
  createCube, 
  createSphere, 
  createCylinder, 
  createCone, 
  createPyramid, 
  createPlane 
} from 'three-edit-buddy';

// Create primitives with options
const cube = createCube({ size: 2 });
const sphere = createSphere({ radius: 1, segments: 16, rings: 8 });
const cylinder = createCylinder({ radius: 1, height: 2, segments: 12 });
const cone = createCone({ radius: 1, height: 2, segments: 12 });
const pyramid = createPyramid({ size: 1, height: 2 });
const plane = createPlane({ width: 2, height: 2 });
```

### **Editing Tools**

```typescript
import { extrudeFaces, mergeVertices, subdivideEdge } from 'three-edit-buddy';

// Extrude selected faces
const newFaces = extrudeFaces(mesh, selectedFaceIds, { distance: 1 });

// Merge vertices within threshold
const mergedVertices = mergeVertices(mesh, 0.1);

// Subdivide an edge
const newEdges = subdivideEdge(mesh, edgeId, 2); // 2 subdivisions
```

### **Validation**

```typescript
import { validateTopology, checkMeshIntegrity } from 'three-edit-buddy';

// Validate mesh topology
const validation = mesh.validateTopology();
if (!validation.isValid) {
  console.error('Mesh validation errors:', validation.errors);
}

// Check mesh integrity
const integrity = checkMeshIntegrity(mesh);
```

## 🎮 **Interactive Demo**

The library includes a comprehensive interactive demo showcasing all features:

```bash
npm run dev
```

**Demo Features:**
- **6 Primitive Types**: Cube, Sphere, Cylinder, Cone, Pyramid, Plane
- **Real-time Highlighting**: Vertices (yellow cubes), Edges (red lines), Faces (green overlays)
- **Interactive Selection**: Click to select vertices, edges, and faces
- **Vertex Editing**: Drag vertices to deform meshes while maintaining connectivity
- **Face Editing Tools**: Extrude, subdivide, and merge operations
- **Modern UI**: Glassmorphism design with responsive controls
- **Keyboard Shortcuts**: Spacebar for highlight cycling, V/E/F for visibility toggles

**Controls:**
- **Mouse**: Orbit camera, select elements, drag vertices
- **Spacebar**: Cycle through highlight modes
- **V**: Toggle vertex visibility
- **E**: Toggle edge visibility  
- **F**: Toggle face visibility
- **C**: Clear selection
- **S**: Select connected vertices

## 🔧 **Development**

### **Setup**
```bash
git clone https://github.com/your-repo/three-edit-buddy.git
cd three-edit-buddy
npm install
```

### **Build**
```bash
npm run build
```

### **Test**
```bash
npm test
```

### **Dev Server**
```bash
npm run dev
```

## 📄 **License**

MIT License - see LICENSE file for details.

## 🤝 **Contributing**

Contributions are welcome! Please read CONTRIBUTING.md for guidelines.

## 📞 **Support**

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Documentation**: [Full API Docs](https://your-docs-site.com)

---

**Three.js Edit Buddy** - Making 3D mesh editing simple and powerful! 🎨✨ 