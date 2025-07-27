# Primitive System

A modern, modular primitive creation system for 3D mesh generation. This system provides Blender-like primitives that are easy to create, edit, and customize.

## Features

- **Modular Design**: Each primitive is a separate, focused module
- **Automatic Deduplication**: Vertices and edges are automatically deduplicated
- **Quad-First Approach**: Uses quads where possible for easier editing
- **Proper Topology**: Manifold meshes with correct face winding
- **UV Mapping**: Built-in UV coordinate generation
- **Material Support**: Easy material assignment
- **TypeScript**: Full type safety with comprehensive parameter types
- **Blender-Like**: Familiar parameter naming and behavior

## Available Primitives

### Cube
```typescript
import { createCube } from './primitives/index.js';

const cube = createCube({
  size: 2,
  widthSegments: 3,
  heightSegments: 3,
  depthSegments: 3,
  material: { name: 'cube-material', color: { x: 1, y: 0.5, z: 0.2 } }
});
```

### Sphere
```typescript
import { createSphere } from './primitives/index.js';

const sphere = createSphere({
  radius: 1.5,
  widthSegments: 12,
  heightSegments: 8,
  material: { name: 'sphere-material', color: { x: 0.2, y: 0.8, z: 1 } }
});
```

### Cylinder
```typescript
import { createCylinder } from './primitives/index.js';

const cylinder = createCylinder({
  radiusTop: 0.5,
  radiusBottom: 1,
  height: 3,
  radialSegments: 16,
  openEnded: false
});
```

### Cone
```typescript
import { createCone } from './primitives/index.js';

const cone = createCone({
  radiusBottom: 1,
  height: 2,
  radialSegments: 12,
  openEnded: true
});
```

### Pyramid
```typescript
import { createPyramid } from './primitives/index.js';

const pyramid = createPyramid({
  size: 1.5,
  height: 2,
  segments: 6
});
```

### Plane
```typescript
import { createPlane } from './primitives/index.js';

const plane = createPlane({
  width: 4,
  height: 3,
  widthSegments: 8,
  heightSegments: 6
});
```

## Core System

### PrimitiveBuilder
The `PrimitiveBuilder` class handles vertex, edge, and face creation with automatic deduplication:

```typescript
import { PrimitiveBuilder } from './primitives/index.js';
import { EditableMesh } from '../core/EditableMesh.js';

const mesh = new EditableMesh();
const builder = new PrimitiveBuilder(mesh);

// Add vertices (automatically deduplicated)
const v1 = builder.addVertex({ x: 0, y: 0, z: 0 });
const v2 = builder.addVertex({ x: 1, y: 0, z: 0 });

// Add faces
builder.addQuad([v1, v2, v3, v4], 'face-name');
builder.addTriangle([v1, v2, v3], 'triangle-name');
```

### Parameter Types
All primitives use strongly-typed parameters:

```typescript
import type { CubeParams, SphereParams } from './primitives/index.js';

const cubeParams: CubeParams = {
  size: 2,
  material: { name: 'my-material' }
};

const sphereParams: SphereParams = {
  radius: 1.5,
  widthSegments: 12
};
```

## UV Mapping

All primitives support automatic UV coordinate generation:

```typescript
const mesh = createCube({
  uvs: {
    enabled: true,
    scale: { x: 2, y: 1 },
    offset: { x: 0, y: 0 }
  }
});
```

## Materials

Easy material assignment with color, opacity, and transparency support:

```typescript
const mesh = createSphere({
  material: {
    name: 'sphere-material',
    color: { x: 1, y: 0, z: 0 }, // Red
    opacity: 0.8,
    transparent: true
  }
});
```

## Default Parameters

Each primitive has sensible defaults that can be overridden:

```typescript
import { DEFAULT_PARAMS } from './primitives/index.js';

console.log(DEFAULT_PARAMS.cube);
// { size: 1, width: 1, height: 1, depth: 1, ... }

console.log(DEFAULT_PARAMS.sphere);
// { radius: 1, widthSegments: 8, heightSegments: 6, ... }
```

## Architecture

The primitive system is built with these core principles:

1. **Separation of Concerns**: Each primitive is self-contained
2. **Reusability**: Common utilities are shared via `PrimitiveUtils`
3. **Type Safety**: Full TypeScript support with comprehensive types
4. **Performance**: Automatic deduplication reduces memory usage
5. **Extensibility**: Easy to add new primitives following the same pattern

## File Structure

```
src/primitives/
├── core/
│   ├── PrimitiveBuilder.ts    # Core building system
│   ├── ParamTypes.ts         # Parameter type definitions
│   └── PrimitiveUtils.ts     # Shared utility functions
├── cube/
│   └── createCube.ts         # Cube primitive
├── sphere/
│   └── createSphere.ts       # Sphere primitive
├── cylinder/
│   └── createCylinder.ts     # Cylinder primitive
├── cone/
│   └── createCone.ts         # Cone primitive
├── pyramid/
│   └── createPyramid.ts      # Pyramid primitive
├── plane/
│   └── createPlane.ts        # Plane primitive
├── index.ts                  # Main exports
└── README.md                 # This file
```

## Usage Examples

See `src/examples/primitives.ts` for comprehensive usage examples.

## Best Practices

1. **Use Quads When Possible**: Quads are easier to edit and subdivide
2. **Reasonable Segmentation**: Don't over-segment primitives unnecessarily
3. **Consistent Naming**: Use descriptive names for vertices, edges, and faces
4. **Material Organization**: Group related materials with consistent naming
5. **UV Considerations**: Think about how UVs will be used when setting scale/offset

## Extending the System

To add a new primitive:

1. Create a new directory in `src/primitives/`
2. Add parameter types to `ParamTypes.ts`
3. Create the primitive function following the established pattern
4. Add exports to `index.ts`
5. Update this README

The system is designed to be easily extensible while maintaining consistency and quality. 