import {
  InstancedMesh,
  BoxGeometry,
  SphereGeometry,
  MeshBasicMaterial,
  Object3D,
  Matrix4,
  Color,
} from 'three';
import { EditableMesh } from '../../core/EditableMesh.js';
import { Selection } from '../../types';

/**
 * Shape options for vertex handles
 */
export type VertexHandleShape = 'cube' | 'sphere' | 'point';

/**
 * Options for vertex handles
 */
export interface VertexHandlesOptions {
  /** Size of the handles */
  size?: number;
  /** Color of the handles */
  color?: number | string;
  /** Shape of the handles */
  shape?: VertexHandleShape;
  /** Whether to show handles for all vertices or only selected ones */
  onlySelected?: boolean;
  /** Color for selected handles (if different from regular color) */
  selectedColor?: number | string;
  /** Opacity of the handles (0-1) */
  opacity?: number;
  /** Whether handles should be fixed size regardless of zoom */
  fixedSize?: boolean;
}

/**
 * Creates visual handles for vertices
 * @param mesh The EditableMesh containing the vertices
 * @param selection The current selection state
 * @param options Configuration options for the handles
 * @returns A Three.js Object3D containing the vertex handles
 */
export function VertexHandles(
  mesh: EditableMesh,
  selection: Selection,
  options: VertexHandlesOptions = {}
): Object3D {
  const {
    size = 0.1,
    color = 0x888888, // Gray
    shape = 'cube',
    onlySelected = false,
    selectedColor = 0xffff00, // Yellow
    opacity = 1.0,
    fixedSize = false,
  } = options;

  // Create a geometry based on the shape option
  let geometry;
  switch (shape) {
    case 'sphere':
      geometry = new SphereGeometry(size, 8, 8);
      break;
    case 'cube':
    default:
      geometry = new BoxGeometry(size, size, size);
      break;
  }

  // Create a material for the handles
  const material = new MeshBasicMaterial({
    color: new Color(color),
    transparent: opacity < 1.0,
    opacity,
    depthTest: true,
  });

  // Determine which vertices to show
  const verticesToShow = onlySelected
    ? Array.from(selection.selectedVertices)
    : mesh.vertices.map((v) => v.id);

  // Create an instanced mesh for performance
  const instancedMesh = new InstancedMesh(
    geometry,
    material,
    verticesToShow.length
  );
  instancedMesh.name = 'VertexHandles';
  instancedMesh.frustumCulled = false; // Ensure handles are always rendered

  // Position each instance at a vertex
  const matrix = new Matrix4();
  let instanceIndex = 0;

  for (const vertexId of verticesToShow) {
    const vertex = mesh.getVertex(vertexId);
    if (vertex) {
      // Get position from vertex
      const position = vertex.position;

      // Handle both array and object formats for Vector3Like
      let x, y, z;
      if (Array.isArray(position)) {
        [x, y, z] = position;
      } else {
        x = position.x;
        y = position.y;
        z = position.z;
      }

      // Set the matrix for this instance
      matrix.setPosition(x, y, z);
      instancedMesh.setMatrixAt(instanceIndex, matrix);

      // Set color (selected or regular)
      const isSelected = selection.selectedVertices.has(vertexId);
      const handleColor = isSelected ? selectedColor : color;
      instancedMesh.setColorAt(instanceIndex, new Color(handleColor));

      instanceIndex++;
    }
  }

  // If fixedSize is true, we need to add a custom onBeforeRender function
  // to scale the handles based on camera distance
  if (fixedSize) {
    const originalOnBeforeRender = instancedMesh.onBeforeRender;
    instancedMesh.onBeforeRender = function (
      renderer,
      scene,
      camera,
      geometry,
      material,
      group
    ) {
      // Call the original onBeforeRender if it exists
      if (originalOnBeforeRender) {
        originalOnBeforeRender.call(
          this,
          renderer,
          scene,
          camera,
          geometry,
          material,
          group
        );
      }

      // TODO: Implement fixed size scaling based on camera distance
      // This would require updating the scale of each instance based on camera distance
      // which is complex with InstancedMesh and would be better implemented
      // with a custom shader or by using sprites instead
    };
  }

  return instancedMesh;
}
