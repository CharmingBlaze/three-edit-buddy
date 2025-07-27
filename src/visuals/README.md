# Modular Visual Helper System for Three.js Editor

This module provides a collection of stateless, reusable visual helpers for a Three.js-based editor, inspired by Blender's visual feedback system. These helpers enhance the editor's usability without mutating core mesh or selection data.

## Overview

The visual helper system is organized into several categories:

- **Grids**: Coordinate grids and axis visualizations
- **Highlights**: Visualization of selected vertices, edges, and faces
- **Handles**: Interactive handles for manipulating vertices, edges, and faces
- **Gizmos**: Transform controls for translation, rotation, and scaling
- **Overlays**: Additional visual aids like bounding boxes and mini-axis displays
- **UVs**: Helpers for UV editing mode
- **Animation**: Helpers for skeletal animation and IK systems

## Key Features

- **Stateless**: All helpers are pure functions that don't store or mutate state
- **Reusable**: Each helper can be used independently or combined with others
- **Configurable**: Extensive options for customizing appearance and behavior
- **Performance-optimized**: Uses Three.js best practices like instanced meshes
- **Type-safe**: Full TypeScript support with proper interfaces and types

## Directory Structure

```
src/visuals/
├── index.ts                # Main export file
├── grids/
│   ├── index.ts            # Exports for grid helpers
│   ├── GridHelper3D.ts     # 3D grid similar to Blender's grid
│   ├── AxisHelper.ts       # XYZ axis visualization
│   └── OrthoGridHelper.ts  # 2D grid for orthographic views
├── highlights/
│   ├── index.ts            # Exports for highlight helpers
│   ├── HighlightVertices.ts # Vertex selection visualization
│   ├── HighlightEdges.ts   # Edge selection visualization
│   └── HighlightFaces.ts   # Face selection visualization
├── handles/
│   ├── index.ts            # Exports for handle helpers
│   ├── VertexHandles.ts    # Interactive vertex handles
│   ├── EdgeHandles.ts      # Interactive edge handles
│   └── FaceHandles.ts      # Interactive face handles
├── gizmos/
│   ├── index.ts            # Exports for gizmo helpers
│   └── GizmoTranslate.ts   # Translation gizmo
├── overlays/
│   ├── index.ts            # Exports for overlay helpers
│   ├── BoundingBoxHelper.ts # Bounding box visualization
│   └── MiniAxisOverlay.ts  # Mini axis display in corner
├── uvs/
│   ├── index.ts            # Exports for UV helpers
│   ├── UVGridHelper.ts     # Grid for UV editor
│   └── UVSelectionHighlight.ts # UV selection visualization
└── animation/
    ├── index.ts            # Exports for animation helpers
    ├── SkeletonHelper.ts   # Skeleton visualization
    └── IKHelper.ts         # IK chain visualization
```

## Usage

All helpers follow a consistent pattern:

1. Import the helper from its category
2. Call the helper function with required parameters (typically mesh, selection, camera)
3. Add the returned Three.js Object3D to your scene
4. Update or recreate the helper when relevant data changes

### Example

```typescript
import { GridHelper3D } from './visuals/grids';
import { HighlightVertices } from './visuals/highlights';
import { GizmoTranslate } from './visuals/gizmos';

// Create helpers
const grid = GridHelper3D({ size: 10, divisions: 10 });
const vertexHighlight = HighlightVertices(mesh, selection, { color: 0xffff00 });
const gizmo = GizmoTranslate(mesh, selection, camera, { size: 1 });

// Add to scene
scene.add(grid);
scene.add(vertexHighlight);
scene.add(gizmo);

// When selection changes, update relevant helpers
function onSelectionChange(newSelection) {
  // Remove old helpers
  scene.remove(vertexHighlight);
  scene.remove(gizmo);
  
  // Create new helpers with updated selection
  vertexHighlight = HighlightVertices(mesh, newSelection, { color: 0xffff00 });
  gizmo = GizmoTranslate(mesh, newSelection, camera, { size: 1 });
  
  // Add updated helpers to scene
  scene.add(vertexHighlight);
  scene.add(gizmo);
}
```

See `src/examples/VisualHelpersUsage.ts` for a complete working example.

## Helper Categories

### Grids

- **GridHelper3D**: 3D grid with customizable size, divisions, and colors
- **AxisHelper**: XYZ axis visualization with optional labels
- **OrthoGridHelper**: 2D grid for orthographic views (top, front, side)

### Highlights

- **HighlightVertices**: Visualizes selected vertices using Points
- **HighlightEdges**: Visualizes selected edges using LineSegments
- **HighlightFaces**: Visualizes selected faces using Mesh

### Handles

- **VertexHandles**: Interactive handles for vertices
- **EdgeHandles**: Interactive handles for edges
- **FaceHandles**: Interactive handles for faces

### Gizmos

- **GizmoTranslate**: Translation control gizmo with axis and plane handles

### Overlays

- **BoundingBoxHelper**: Visualizes the bounding box of selected elements
- **MiniAxisOverlay**: Small axis display in the corner of the viewport

### UVs

- **UVGridHelper**: Grid for UV editing mode
- **UVSelectionHighlight**: Visualizes selected elements in UV space

### Animation

- **SkeletonHelper**: Visualizes a skeleton with bones and joints
- **IKHelper**: Visualizes IK chains, targets, and pole vectors

## Best Practices

1. **Recreate helpers when data changes**: Since helpers are stateless, recreate them when the underlying data (mesh, selection) changes
2. **Use appropriate options**: Customize helpers with options to match your editor's style and UX
3. **Consider performance**: For large meshes, be selective about which helpers are active
4. **Combine with interaction**: These helpers provide visual feedback, but should be combined with proper interaction handling

## Future Enhancements

- Additional gizmos (rotate, scale)
- Snapping helpers
- Measurement tools
- Animation timeline visualization
- Custom shader-based selection highlighting
