import * as THREE from 'three';
import type { Vector3Like } from '../types/index.js';
import { EditableMesh } from '../core/EditableMesh.js';
import { SelectionManager, SelectionState } from '../selection/SelectionManager.js';

/**
 * Options for vertex visualization
 */
export interface VertexVisualOptions {
  /** Color for vertices (default: 0xffff00) */
  color?: number;
  /** Size of vertex markers (default: 0.1) */
  size?: number;
  /** Whether to show vertex markers (default: true) */
  visible?: boolean;
  /** Shape of vertex markers: 'sphere' or 'cube' (default: 'cube') */
  shape?: 'sphere' | 'cube';
}

/**
 * Options for edge visualization
 */
export interface EdgeVisualOptions {
  /** Color for edges (default: 0xff0000) */
  color?: number;
  /** Width of edge lines (default: 2) */
  width?: number;
  /** Whether to show edge lines (default: true) */
  visible?: boolean;
  /** Opacity of edge lines (default: 1.0) */
  opacity?: number;
}

/**
 * Options for face visualization
 */
export interface FaceVisualOptions {
  /** Color for faces (default: 0x00ff00) */
  color?: number;
  /** Opacity of face overlays (default: 0.3) */
  opacity?: number;
  /** Whether to show face overlays (default: true) */
  visible?: boolean;
  /** Whether to use flat shading (default: false) */
  flatShading?: boolean;
}

/**
 * Options for selection highlighting
 */
export interface SelectionVisualOptions {
  /** Color for selected vertices (default: 0xff6600) */
  selectedVertexColor?: number;
  /** Color for selected edges (default: 0x00ffff) */
  selectedEdgeColor?: number;
  /** Color for selected faces (default: 0xff6600) */
  selectedFaceColor?: number;
  /** Size of selected vertex markers (default: 0.15) */
  selectedVertexSize?: number;
  /** Width of selected edge lines (default: 8) */
  selectedEdgeWidth?: number;
  /** Opacity of selected face overlays (default: 0.6) */
  selectedFaceOpacity?: number;
}

/**
 * Complete options for mesh visualization
 */
export interface MeshVisualOptions {
  vertices?: VertexVisualOptions;
  edges?: EdgeVisualOptions;
  faces?: FaceVisualOptions;
  selection?: SelectionVisualOptions;
}

/**
 * Comprehensive visual helper for EditableMesh with selection support
 */
export class MeshVisualHelper {
  private mesh: EditableMesh;
  private selectionManager: SelectionManager;
  private options: Required<MeshVisualOptions>;
  
  // Visual objects
  private vertexObjects: THREE.Mesh[] = [];
  private edgeObjects: THREE.Line[] = [];
  private faceObjects: THREE.Mesh[] = [];
  private selectionObjects: THREE.Object3D[] = [];
  
  // Groups for organization
  private vertexGroup: THREE.Group;
  private edgeGroup: THREE.Group;
  private faceGroup: THREE.Group;
  private selectionGroup: THREE.Group;

  constructor(mesh: EditableMesh, selectionManager: SelectionManager, options: MeshVisualOptions = {}) {
    this.mesh = mesh;
    this.selectionManager = selectionManager;
    
    // Set default options
    this.options = {
      vertices: {
        color: 0xffff00,
        size: 0.1,
        visible: true,
        shape: 'cube',
        ...options.vertices
      },
      edges: {
        color: 0xff0000,
        width: 2,
        visible: true,
        opacity: 1.0,
        ...options.edges
      },
      faces: {
        color: 0x00ff00,
        opacity: 0.3,
        visible: true,
        flatShading: false,
        ...options.faces
      },
      selection: {
        selectedVertexColor: 0xff6600,
        selectedEdgeColor: 0x00ffff,
        selectedFaceColor: 0xff6600,
        selectedVertexSize: 0.15,
        selectedEdgeWidth: 8,
        selectedFaceOpacity: 0.6,
        ...options.selection
      }
    };

    // Create groups
    this.vertexGroup = new THREE.Group();
    this.vertexGroup.name = 'VertexVisuals';
    
    this.edgeGroup = new THREE.Group();
    this.edgeGroup.name = 'EdgeVisuals';
    
    this.faceGroup = new THREE.Group();
    this.faceGroup.name = 'FaceVisuals';
    
    this.selectionGroup = new THREE.Group();
    this.selectionGroup.name = 'SelectionVisuals';

    this.updateVisuals();
  }

  /**
   * Updates all visual elements based on current mesh and selection state
   */
  updateVisuals(): void {
    this.updateVertexVisuals();
    this.updateEdgeVisuals();
    this.updateFaceVisuals();
    this.updateSelectionVisuals();
  }

  /**
   * Updates vertex visualization
   */
  private updateVertexVisuals(): void {
    // Clear existing vertex objects
    this.vertexGroup.clear();
    this.vertexObjects = [];

    if (!this.options.vertices.visible) return;

    // Create geometry based on shape preference
    const geometry = this.options.vertices.shape === 'sphere' 
      ? new THREE.SphereGeometry(this.options.vertices.size, 8, 6)
      : new THREE.BoxGeometry(this.options.vertices.size, this.options.vertices.size, this.options.vertices.size);

    const material = new THREE.MeshBasicMaterial({
      color: this.options.vertices.color,
      transparent: true,
      opacity: 0.8
    });

    // Create vertex markers
    for (const vertex of this.mesh.vertices) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(vertex.position.x, vertex.position.y, vertex.position.z);
      mesh.userData = { vertexId: vertex.id, type: 'vertex' };
      
      this.vertexGroup.add(mesh);
      this.vertexObjects.push(mesh);
    }
  }

  /**
   * Updates edge visualization
   */
  private updateEdgeVisuals(): void {
    // Clear existing edge objects
    this.edgeGroup.clear();
    this.edgeObjects = [];

    if (!this.options.edges.visible) return;

    const material = new THREE.LineBasicMaterial({
      color: this.options.edges.color,
      linewidth: this.options.edges.width,
      transparent: true,
      opacity: this.options.edges.opacity
    });

    // Create edge lines
    for (const edge of this.mesh.edges) {
      const vertex1 = this.mesh.getVertex(edge.vertexIds[0]);
      const vertex2 = this.mesh.getVertex(edge.vertexIds[1]);

      if (vertex1 && vertex2) {
        const geometry = new THREE.BufferGeometry();
        const positions = [
          vertex1.position.x, vertex1.position.y, vertex1.position.z,
          vertex2.position.x, vertex2.position.y, vertex2.position.z
        ];
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

        const line = new THREE.Line(geometry, material);
        line.userData = { edgeId: edge.id, type: 'edge' };
        
        this.edgeGroup.add(line);
        this.edgeObjects.push(line);
      }
    }
  }

  /**
   * Updates face visualization
   */
  private updateFaceVisuals(): void {
    // Clear existing face objects
    this.faceGroup.clear();
    this.faceObjects = [];

    if (!this.options.faces.visible) return;

    // Create a single geometry for all faces
    const positions: number[] = [];
    const indices: number[] = [];
    let indexOffset = 0;

    for (const face of this.mesh.faces) {
      const faceVertices = face.vertexIds.map(id => this.mesh.getVertex(id)).filter(v => v !== undefined);
      if (faceVertices.length < 3) continue;

      // Add vertex positions
      for (const vertex of faceVertices) {
        positions.push(vertex!.position.x, vertex!.position.y, vertex!.position.z);
      }

      // Create indices for triangulation
      if (faceVertices.length === 3) {
        indices.push(indexOffset, indexOffset + 1, indexOffset + 2);
      } else if (faceVertices.length === 4) {
        // Quad triangulation
        indices.push(indexOffset, indexOffset + 1, indexOffset + 2);
        indices.push(indexOffset, indexOffset + 2, indexOffset + 3);
      } else {
        // N-gon fan triangulation
        for (let i = 1; i < faceVertices.length - 1; i++) {
          indices.push(indexOffset, indexOffset + i, indexOffset + i + 1);
        }
      }

      indexOffset += faceVertices.length;
    }

    if (positions.length > 0) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();

      const material = new THREE.MeshBasicMaterial({
        color: this.options.faces.color,
        transparent: true,
        opacity: this.options.faces.opacity,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData = { type: 'face-highlight' };
      
      this.faceGroup.add(mesh);
      this.faceObjects.push(mesh);
    }
  }

  /**
   * Updates selection visualization
   */
  private updateSelectionVisuals(): void {
    // Clear existing selection objects
    this.selectionGroup.clear();
    this.selectionObjects = [];

    const selection = this.selectionManager.getSelection();

    // Highlight selected vertices
    this.createSelectedVertexHighlights(selection.selectedVertices);
    
    // Highlight selected edges
    this.createSelectedEdgeHighlights(selection.selectedEdges);
    
    // Highlight selected faces
    this.createSelectedFaceHighlights(selection.selectedFaces);
  }

  /**
   * Creates highlights for selected vertices
   */
  private createSelectedVertexHighlights(selectedVertices: Set<number>): void {
    if (selectedVertices.size === 0) return;

    const geometry = new THREE.SphereGeometry(this.options.selection.selectedVertexSize, 8, 6);
    const material = new THREE.MeshBasicMaterial({
      color: this.options.selection.selectedVertexColor,
      transparent: true,
      opacity: 0.8
    });

    for (const vertexId of selectedVertices) {
      const vertex = this.mesh.getVertex(vertexId);
      if (vertex) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(vertex.position.x, vertex.position.y, vertex.position.z);
        mesh.userData = { vertexId, type: 'selected-vertex' };
        
        this.selectionGroup.add(mesh);
        this.selectionObjects.push(mesh);
      }
    }
  }

  /**
   * Creates highlights for selected edges
   */
  private createSelectedEdgeHighlights(selectedEdges: Set<number>): void {
    if (selectedEdges.size === 0) return;

    const material = new THREE.LineBasicMaterial({
      color: this.options.selection.selectedEdgeColor,
      linewidth: this.options.selection.selectedEdgeWidth,
      transparent: true,
      opacity: 1.0
    });

    for (const edgeId of selectedEdges) {
      const edge = this.mesh.getEdge(edgeId);
      if (edge) {
        const vertex1 = this.mesh.getVertex(edge.vertexIds[0]);
        const vertex2 = this.mesh.getVertex(edge.vertexIds[1]);

        if (vertex1 && vertex2) {
          // Create a thick line using multiple segments
          const segments = 10;
          const points = [];
          
          for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = vertex1.position.x + (vertex2.position.x - vertex1.position.x) * t;
            const y = vertex1.position.y + (vertex2.position.y - vertex1.position.y) * t;
            const z = vertex1.position.z + (vertex2.position.z - vertex1.position.z) * t;
            points.push(x, y, z);
          }

          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

          const line = new THREE.Line(geometry, material);
          line.userData = { edgeId, type: 'selected-edge' };
          
          this.selectionGroup.add(line);
          this.selectionObjects.push(line);

          // Add endpoint spheres
          const sphereGeometry = new THREE.SphereGeometry(0.05, 8, 6);
          const sphereMaterial = new THREE.MeshBasicMaterial({
            color: this.options.selection.selectedEdgeColor,
            transparent: true,
            opacity: 0.8
          });

          const sphere1 = new THREE.Mesh(sphereGeometry, sphereMaterial);
          sphere1.position.set(vertex1.position.x, vertex1.position.y, vertex1.position.z);
          this.selectionGroup.add(sphere1);
          this.selectionObjects.push(sphere1);

          const sphere2 = new THREE.Mesh(sphereGeometry, sphereMaterial);
          sphere2.position.set(vertex2.position.x, vertex2.position.y, vertex2.position.z);
          this.selectionGroup.add(sphere2);
          this.selectionObjects.push(sphere2);
        }
      }
    }
  }

  /**
   * Creates highlights for selected faces
   */
  private createSelectedFaceHighlights(selectedFaces: Set<number>): void {
    if (selectedFaces.size === 0) return;

    for (const faceId of selectedFaces) {
      const face = this.mesh.getFace(faceId);
      if (face) {
        const faceVertices = face.vertexIds.map(id => this.mesh.getVertex(id)).filter(v => v !== undefined);
        if (faceVertices.length < 3) continue;

        const positions: number[] = [];
        const indices: number[] = [];

        // Add vertex positions
        for (const vertex of faceVertices) {
          positions.push(vertex!.position.x, vertex!.position.y, vertex!.position.z);
        }

        // Create indices for triangulation
        if (faceVertices.length === 3) {
          indices.push(0, 1, 2);
        } else if (faceVertices.length === 4) {
          indices.push(0, 1, 2, 0, 2, 3);
        } else {
          for (let i = 1; i < faceVertices.length - 1; i++) {
            indices.push(0, i, i + 1);
          }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        const material = new THREE.MeshBasicMaterial({
          color: this.options.selection.selectedFaceColor,
          transparent: true,
          opacity: this.options.selection.selectedFaceOpacity,
          side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { faceId, type: 'selected-face' };
        
        this.selectionGroup.add(mesh);
        this.selectionObjects.push(mesh);
      }
    }
  }

  /**
   * Gets all visual groups for adding to a scene
   */
  getVisualGroups(): {
    vertexGroup: THREE.Group;
    edgeGroup: THREE.Group;
    faceGroup: THREE.Group;
    selectionGroup: THREE.Group;
  } {
    return {
      vertexGroup: this.vertexGroup,
      edgeGroup: this.edgeGroup,
      faceGroup: this.faceGroup,
      selectionGroup: this.selectionGroup
    };
  }

  /**
   * Gets all visual objects for raycasting
   */
  getVisualObjects(): {
    vertexObjects: THREE.Mesh[];
    edgeObjects: THREE.Line[];
    faceObjects: THREE.Mesh[];
    selectionObjects: THREE.Object3D[];
  } {
    return {
      vertexObjects: this.vertexObjects,
      edgeObjects: this.edgeObjects,
      faceObjects: this.faceObjects,
      selectionObjects: this.selectionObjects
    };
  }

  /**
   * Updates the visual options
   */
  updateOptions(options: Partial<MeshVisualOptions>): void {
    this.options = {
      vertices: { ...this.options.vertices, ...options.vertices },
      edges: { ...this.options.edges, ...options.edges },
      faces: { ...this.options.faces, ...options.faces },
      selection: { ...this.options.selection, ...options.selection }
    };
    this.updateVisuals();
  }

  /**
   * Gets the current visual options
   */
  getOptions(): Required<MeshVisualOptions> {
    return { ...this.options };
  }

  /**
   * Shows or hides specific visual elements
   */
  setVisibility(type: 'vertices' | 'edges' | 'faces' | 'selection', visible: boolean): void {
    switch (type) {
      case 'vertices':
        this.options.vertices.visible = visible;
        this.vertexGroup.visible = visible;
        break;
      case 'edges':
        this.options.edges.visible = visible;
        this.edgeGroup.visible = visible;
        break;
      case 'faces':
        this.options.faces.visible = visible;
        this.faceGroup.visible = visible;
        break;
      case 'selection':
        this.selectionGroup.visible = visible;
        break;
    }
  }

  /**
   * Disposes of all visual resources
   */
  dispose(): void {
    // Dispose of geometries and materials
    [...this.vertexObjects, ...this.faceObjects].forEach(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => mat.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    this.edgeObjects.forEach(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });

    this.selectionObjects.forEach(obj => {
      if (obj instanceof THREE.Mesh) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(mat => mat.dispose());
          } else {
            obj.material.dispose();
          }
        }
      } else if (obj instanceof THREE.Line) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      }
    });

    // Clear arrays
    this.vertexObjects = [];
    this.edgeObjects = [];
    this.faceObjects = [];
    this.selectionObjects = [];
  }
} 