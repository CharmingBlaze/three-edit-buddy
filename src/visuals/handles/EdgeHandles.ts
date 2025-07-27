import { 
  InstancedMesh, 
  BoxGeometry, 
  SphereGeometry,
  CylinderGeometry,
  MeshBasicMaterial, 
  Object3D,
  Matrix4,
  Vector3,
  Quaternion,
  Color
} from 'three';
import { EditableMesh } from '../../core/EditableMesh.js';
import { Selection } from '../../types';

/**
 * Shape options for edge handles
 */
export type EdgeHandleShape = 'cube' | 'sphere' | 'cylinder';

/**
 * Options for edge handles
 */
export interface EdgeHandlesOptions {
  /** Size of the handles */
  size?: number;
  /** Color of the handles */
  color?: number | string;
  /** Shape of the handles */
  shape?: EdgeHandleShape;
  /** Whether to show handles for all edges or only selected ones */
  onlySelected?: boolean;
  /** Color for selected handles (if different from regular color) */
  selectedColor?: number | string;
  /** Opacity of the handles (0-1) */
  opacity?: number;
  /** Whether handles should be fixed size regardless of zoom */
  fixedSize?: boolean;
}

/**
 * Creates visual handles for edges (positioned at edge midpoints)
 * @param mesh The EditableMesh containing the edges
 * @param selection The current selection state
 * @param options Configuration options for the handles
 * @returns A Three.js Object3D containing the edge handles
 */
export function EdgeHandles(
  mesh: EditableMesh, 
  selection: Selection,
  options: EdgeHandlesOptions = {}
): Object3D {
  const {
    size = 0.08,
    color = 0x00aaff, // Light blue
    shape = 'cube',
    onlySelected = false,
    selectedColor = 0xffff00, // Yellow
    opacity = 1.0,
    fixedSize = false
  } = options;

  // Create a geometry based on the shape option
  let geometry;
  switch (shape) {
    case 'sphere':
      geometry = new SphereGeometry(size, 8, 8);
      break;
    case 'cylinder':
      geometry = new CylinderGeometry(size/2, size/2, size*1.5, 8);
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
    depthTest: true
  });

  // Determine which edges to show
  const edgesToShow = onlySelected 
    ? Array.from(selection.selectedEdges)
    : mesh.edges.map(e => e.id);

  // Create an instanced mesh for performance
  const instancedMesh = new InstancedMesh(
    geometry,
    material,
    edgesToShow.length
  );
  instancedMesh.name = 'EdgeHandles';
  instancedMesh.frustumCulled = false; // Ensure handles are always rendered

  // Position each instance at an edge midpoint
  const matrix = new Matrix4();
  const tempPosition = new Vector3();
  const tempQuaternion = new Quaternion();
  let instanceIndex = 0;
  
  for (const edgeId of edgesToShow) {
    const edge = mesh.getEdge(edgeId);
    if (edge) {
      // Get the two vertices that form this edge
      const v1 = mesh.getVertex(edge.vertexIds[0]);
      const v2 = mesh.getVertex(edge.vertexIds[1]);
      
      if (v1 && v2) {
        // Extract positions
        let x1, y1, z1, x2, y2, z2;
        
        if (Array.isArray(v1.position)) {
          [x1, y1, z1] = v1.position;
        } else {
          x1 = v1.position.x;
          y1 = v1.position.y;
          z1 = v1.position.z;
        }
        
        if (Array.isArray(v2.position)) {
          [x2, y2, z2] = v2.position;
        } else {
          x2 = v2.position.x;
          y2 = v2.position.y;
          z2 = v2.position.z;
        }
        
        // Calculate midpoint
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const midZ = (z1 + z2) / 2;
        
        // Set position to midpoint
        tempPosition.set(midX, midY, midZ);
        
        // For cylinders, we want to orient them along the edge
        if (shape === 'cylinder') {
          // Create direction vector from v1 to v2
          const direction = new Vector3(x2 - x1, y2 - y1, z2 - z1).normalize();
          
          // Calculate quaternion to rotate from default orientation (along Y axis) to edge direction
          tempQuaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction);
          
          // Apply position and rotation
          matrix.compose(tempPosition, tempQuaternion, new Vector3(1, 1, 1));
        } else {
          // For other shapes, just position them at the midpoint
          matrix.setPosition(midX, midY, midZ);
        }
        
        instancedMesh.setMatrixAt(instanceIndex, matrix);
        
        // Set color (selected or regular)
        const isSelected = selection.selectedEdges.has(edgeId);
        const handleColor = isSelected ? selectedColor : color;
        instancedMesh.setColorAt(instanceIndex, new Color(handleColor));
        
        instanceIndex++;
      }
    }
  }

  // If fixedSize is true, we need to add a custom onBeforeRender function
  // to scale the handles based on camera distance
  if (fixedSize) {
    const originalOnBeforeRender = instancedMesh.onBeforeRender;
    instancedMesh.onBeforeRender = function(renderer, scene, camera, geometry, material, group) {
      // Call the original onBeforeRender if it exists
      if (originalOnBeforeRender) {
        originalOnBeforeRender.call(this, renderer, scene, camera, geometry, material, group);
      }
      
      // TODO: Implement fixed size scaling based on camera distance
      // This would require updating the scale of each instance based on camera distance
      // which is complex with InstancedMesh and would be better implemented
      // with a custom shader or by using sprites instead
    };
  }

  return instancedMesh;
}
