import * as THREE from 'three';
import { EditableMesh } from '@/core/EditableMesh.js';
import { SelectionManager } from '@/selection/SelectionManager.js';
import { SelectionVisualOptions } from './options';

export class SelectionHighlighter {
  private mesh: EditableMesh;
  private selectionManager: SelectionManager;
  private options: Required<SelectionVisualOptions>;

  public group: THREE.Group;
  private objects: THREE.Object3D[] = [];

  constructor(
    mesh: EditableMesh,
    selectionManager: SelectionManager,
    options: SelectionVisualOptions = {}
  ) {
    this.mesh = mesh;
    this.selectionManager = selectionManager;
    this.options = {
      selectedVertexColor: 0xff6600,
      selectedEdgeColor: 0x00ffff,
      selectedFaceColor: 0xff6600,
      selectedVertexSize: 0.15,
      selectedEdgeWidth: 8,
      selectedFaceOpacity: 0.6,
      ...options,
    };

    this.group = new THREE.Group();
    this.group.name = 'SelectionVisuals';

    this.update();
  }

  update(): void {
    this.clear();
    const selection = this.selectionManager.getSelection();
    this.createSelectedVertexHighlights(selection.selectedVertices);
    this.createSelectedEdgeHighlights(selection.selectedEdges);
    this.createSelectedFaceHighlights(selection.selectedFaces);
  }

  private createSelectedVertexHighlights(selectedVertices: Set<number>): void {
    if (selectedVertices.size === 0) return;

    const geometry = new THREE.SphereGeometry(this.options.selectedVertexSize, 8, 6);
    const material = new THREE.MeshBasicMaterial({ color: this.options.selectedVertexColor });

    for (const vertexId of selectedVertices) {
      const vertex = this.mesh.getVertex(vertexId);
      if (vertex) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(vertex.position.x, vertex.position.y, vertex.position.z);
        mesh.userData = { vertexId, type: 'selected-vertex' };
        this.group.add(mesh);
        this.objects.push(mesh);
      }
    }
  }

  private createSelectedEdgeHighlights(selectedEdges: Set<number>): void {
    if (selectedEdges.size === 0) return;

    const material = new THREE.LineBasicMaterial({
      color: this.options.selectedEdgeColor,
      linewidth: this.options.selectedEdgeWidth,
    });

    for (const edgeId of selectedEdges) {
      const edge = this.mesh.getEdge(edgeId);
      if (edge) {
        const vertex1 = this.mesh.getVertex(edge.vertexIds[0]);
        const vertex2 = this.mesh.getVertex(edge.vertexIds[1]);
        if (vertex1 && vertex2) {
          const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(vertex1.position.x, vertex1.position.y, vertex1.position.z),
            new THREE.Vector3(vertex2.position.x, vertex2.position.y, vertex2.position.z),
          ]);
          const line = new THREE.Line(geometry, material);
          line.userData = { edgeId, type: 'selected-edge' };
          this.group.add(line);
          this.objects.push(line);
        }
      }
    }
  }

  private createSelectedFaceHighlights(selectedFaces: Set<number>): void {
    if (selectedFaces.size === 0) return;

    const material = new THREE.MeshBasicMaterial({
      color: this.options.selectedFaceColor,
      transparent: true,
      opacity: this.options.selectedFaceOpacity,
      side: THREE.DoubleSide,
    });

    for (const faceId of selectedFaces) {
      const face = this.mesh.getFace(faceId);
      if (face) {
        const faceVertices = face.vertexIds
          .map(id => this.mesh.getVertex(id))
          .filter((v): v is NonNullable<typeof v> => v !== undefined);
        if (faceVertices.length < 3) continue;

        const positions = faceVertices.map(v => new THREE.Vector3(v.position.x, v.position.y, v.position.z));
        const geometry = new THREE.BufferGeometry().setFromPoints(positions);
        
        if (faceVertices.length === 3) {
          geometry.setIndex([0, 1, 2]);
        } else if (faceVertices.length === 4) {
          geometry.setIndex([0, 1, 2, 0, 2, 3]);
        } else {
          const indices = [];
          for (let i = 1; i < faceVertices.length - 1; i++) {
            indices.push(0, i, i + 1);
          }
          geometry.setIndex(indices);
        }

        geometry.computeVertexNormals();
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { faceId, type: 'selected-face' };
        this.group.add(mesh);
        this.objects.push(mesh);
      }
    }
  }

  setVisibility(visible: boolean): void {
    this.group.visible = visible;
  }

  getOptions(): Required<SelectionVisualOptions> {
    return this.options;
  }

  updateOptions(options: Partial<SelectionVisualOptions>): void {
    this.options = { ...this.options, ...options };
    this.update();
  }

  private clear(): void {
    this.group.clear();
    this.objects = [];
  }

  dispose(): void {
    this.objects.forEach(obj => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(mat => mat.dispose());
          } else {
            obj.material.dispose();
          }
        }
      }
    });
    this.clear();
  }
}
