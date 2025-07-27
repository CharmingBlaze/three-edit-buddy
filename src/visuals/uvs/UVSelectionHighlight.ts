import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Points,
  PointsMaterial,
  Vector2,
} from 'three';
import { EditableMesh } from '../../core/EditableMesh.js';
import { Selection } from '../../types';

/**
 * Options for the UV selection highlight
 */
export interface UVSelectionHighlightOptions {
  /** Color for selected vertices */
  vertexColor?: number | string;
  /** Color for selected edges */
  edgeColor?: number | string;
  /** Color for selected faces */
  faceColor?: number | string;
  /** Size of vertex points */
  vertexSize?: number;
  /** Width of edge lines */
  edgeWidth?: number;
  /** Opacity of face fills (0-1) */
  faceOpacity?: number;
  /** Whether to show selected vertices */
  showVertices?: boolean;
  /** Whether to show selected edges */
  showEdges?: boolean;
  /** Whether to show selected faces */
  showFaces?: boolean;
}

/**
 * Creates a helper to highlight selected elements in UV space
 * @param mesh The EditableMesh being edited
 * @param selection The current selection state
 * @param options Configuration options for the highlight
 * @returns A Three.js Object3D containing the UV selection highlights
 */
export function UVSelectionHighlight(
  mesh: EditableMesh,
  selection: Selection,
  options: UVSelectionHighlightOptions = {}
): Object3D {
  const {
    vertexColor = 0xffff00, // Yellow
    edgeColor = 0xff8800, // Orange
    faceColor = 0x0088ff, // Blue
    vertexSize = 5,
    edgeWidth = 2,
    faceOpacity = 0.2,
    showVertices = true,
    showEdges = true,
    showFaces = true,
  } = options;

  // Create a group to hold all highlight elements
  const group = new Object3D();
  group.name = 'UVSelectionHighlight';

  // Extract UV data from the mesh
  const uvData = extractUVData(mesh);
  if (!uvData) {
    return group; // Return empty group if no UV data
  }

  // Highlight selected vertices
  if (showVertices && selection.selectedVertices.size > 0) {
    const vertexGeometry = new BufferGeometry();
    const positions: number[] = [];

    for (const vertexId of selection.selectedVertices) {
      const uvCoords = uvData.vertexUVs.get(vertexId);
      if (uvCoords) {
        positions.push(uvCoords.x, uvCoords.y, 0);
      }
    }

    if (positions.length > 0) {
      vertexGeometry.setAttribute(
        'position',
        new Float32BufferAttribute(positions, 3)
      );

      const vertexMaterial = new PointsMaterial({
        color: new Color(vertexColor),
        size: vertexSize,
        sizeAttenuation: false,
        depthTest: false,
      });

      const vertexPoints = new Points(vertexGeometry, vertexMaterial);
      vertexPoints.name = 'SelectedUVVertices';
      group.add(vertexPoints);
    }
  }

  // Highlight selected edges
  if (showEdges && selection.selectedEdges.size > 0) {
    const edgeGeometry = new BufferGeometry();
    const positions: number[] = [];

    for (const edgeId of selection.selectedEdges) {
      const edge = mesh.getEdge(edgeId);
      if (edge) {
        const uvStart = uvData.vertexUVs.get(edge.vertexIds[0]);
        const uvEnd = uvData.vertexUVs.get(edge.vertexIds[1]);

        if (uvStart && uvEnd) {
          positions.push(uvStart.x, uvStart.y, 0);
          positions.push(uvEnd.x, uvEnd.y, 0);
        }
      }
    }

    if (positions.length > 0) {
      edgeGeometry.setAttribute(
        'position',
        new Float32BufferAttribute(positions, 3)
      );

      const edgeMaterial = new LineBasicMaterial({
        color: new Color(edgeColor),
        linewidth: edgeWidth, // Note: This may not work in WebGLRenderer due to limitations
        depthTest: false,
      });

      const edgeLines = new LineSegments(edgeGeometry, edgeMaterial);
      edgeLines.name = 'SelectedUVEdges';
      group.add(edgeLines);
    }
  }

  // Highlight selected faces
  if (showFaces && selection.selectedFaces.size > 0) {
    for (const faceId of selection.selectedFaces) {
      const face = mesh.getFace(faceId);
      if (face) {
        const faceGeometry = new BufferGeometry();
        const positions: number[] = [];
        const indices: number[] = [];

        // Collect UV coordinates for each vertex in the face
        const faceUVs: Vector2[] = [];
        for (const vertexId of face.vertexIds) {
          const uvCoords = uvData.vertexUVs.get(vertexId);
          if (uvCoords) {
            faceUVs.push(uvCoords);
          }
        }

        if (faceUVs.length >= 3) {
          // Add positions
          for (const uv of faceUVs) {
            positions.push(uv.x, uv.y, 0);
          }

          // Triangulate the face (simple fan triangulation for convex polygons)
          for (let i = 1; i < faceUVs.length - 1; i++) {
            indices.push(0, i, i + 1);
          }

          faceGeometry.setAttribute(
            'position',
            new Float32BufferAttribute(positions, 3)
          );
          faceGeometry.setIndex(indices);

          const faceMaterial = new MeshBasicMaterial({
            color: new Color(faceColor),
            transparent: true,
            opacity: faceOpacity,
            depthTest: false,
            side: 2, // DoubleSide
          });

          const faceMesh = new Mesh(faceGeometry, faceMaterial);
          faceMesh.name = `SelectedUVFace_${faceId}`;
          group.add(faceMesh);
        }
      }
    }
  }

  return group;
}

/**
 * Extracts UV data from the mesh
 */
interface UVData {
  vertexUVs: Map<number, Vector2>;
}

function extractUVData(mesh: EditableMesh): UVData | null {
  // This is a simplified implementation
  // In a real application, you would extract UVs from the mesh's UV layers

  // For now, we'll create a placeholder implementation
  // that maps vertex IDs to UV coordinates in the 0-1 range

  const vertexUVs = new Map<number, Vector2>();

  // Check if the mesh has vertices
  if (mesh.vertices.length === 0) {
    return null;
  }

  // Create placeholder UV coordinates based on normalized vertex positions
  // This is just for demonstration - in a real implementation,
  // you would extract actual UV coordinates from the mesh

  // Find bounds of the mesh
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const vertex of mesh.vertices) {
    const x = Array.isArray(vertex.position)
      ? vertex.position[0]
      : vertex.position.x;
    const y = Array.isArray(vertex.position)
      ? vertex.position[1]
      : vertex.position.y;

    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  // Create normalized UV coordinates
  for (const vertex of mesh.vertices) {
    const x = Array.isArray(vertex.position)
      ? vertex.position[0]
      : vertex.position.x;
    const y = Array.isArray(vertex.position)
      ? vertex.position[1]
      : vertex.position.y;

    // Normalize to 0-1 range
    const u = (x - minX) / rangeX;
    const v = (y - minY) / rangeY;

    vertexUVs.set(vertex.id, new Vector2(u, v));
  }

  return { vertexUVs };
}
