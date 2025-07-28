import * as THREE from 'three';
import { EditableMesh } from '@/core/EditableMesh.js';
import { SelectionManager } from '@/selection/SelectionManager.js';
import { MeshVisualOptions } from './options';
import { VertexVisualizer } from './VertexVisualizer';
import { EdgeVisualizer } from './EdgeVisualizer';
import { FaceVisualizer } from './FaceVisualizer';
import { SelectionHighlighter } from './SelectionHighlighter';

/**
 * Comprehensive visual helper for EditableMesh with selection support
 */
export class MeshVisualHelper {
  private vertexVisualizer: VertexVisualizer;
  private edgeVisualizer: EdgeVisualizer;
  private faceVisualizer: FaceVisualizer;
  private selectionHighlighter: SelectionHighlighter;

  constructor(
    mesh: EditableMesh,
    selectionManager: SelectionManager,
    options: MeshVisualOptions = {}
  ) {
    this.vertexVisualizer = new VertexVisualizer(mesh, options.vertices);
    this.edgeVisualizer = new EdgeVisualizer(mesh, options.edges);
    this.faceVisualizer = new FaceVisualizer(mesh, options.faces);
    this.selectionHighlighter = new SelectionHighlighter(
      mesh,
      selectionManager,
      options.selection
    );
  }

  updateVisuals(): void {
    this.vertexVisualizer.update();
    this.edgeVisualizer.update();
    this.faceVisualizer.update();
    this.selectionHighlighter.update();
  }

  getVisualGroups(): {
    vertexGroup: THREE.Group;
    edgeGroup: THREE.Group;
    faceGroup: THREE.Group;
    selectionGroup: THREE.Group;
  } {
    return {
      vertexGroup: this.vertexVisualizer.group,
      edgeGroup: this.edgeVisualizer.group,
      faceGroup: this.faceVisualizer.group,
      selectionGroup: this.selectionHighlighter.group,
    };
  }

  getVisualObjects(): {
    vertexObjects: THREE.Mesh[];
    edgeObjects: THREE.Line[];
    faceObjects: THREE.Mesh[];
    selectionObjects: THREE.Object3D[];
  } {
    return {
      vertexObjects: this.vertexVisualizer.objects,
      edgeObjects: this.edgeVisualizer.objects,
      faceObjects: this.faceVisualizer.objects,
      selectionObjects: this.selectionHighlighter.group.children,
    };
  }

  updateOptions(options: Partial<MeshVisualOptions>): void {
    if (options.vertices) this.vertexVisualizer.updateOptions(options.vertices);
    if (options.edges) this.edgeVisualizer.updateOptions(options.edges);
    if (options.faces) this.faceVisualizer.updateOptions(options.faces);
    if (options.selection) this.selectionHighlighter.updateOptions(options.selection);
  }

  setVisibility(
    type: 'vertices' | 'edges' | 'faces' | 'selection',
    visible: boolean
  ): void {
    switch (type) {
      case 'vertices':
        this.vertexVisualizer.setVisibility(visible);
        break;
      case 'edges':
        this.edgeVisualizer.setVisibility(visible);
        break;
      case 'faces':
        this.faceVisualizer.setVisibility(visible);
        break;
      case 'selection':
        this.selectionHighlighter.setVisibility(visible);
        break;
    }
  }

  getOptions(): MeshVisualOptions {
    return {
      vertices: this.vertexVisualizer.getOptions(),
      edges: this.edgeVisualizer.getOptions(),
      faces: this.faceVisualizer.getOptions(),
      selection: this.selectionHighlighter.getOptions(),
    };
  }

  dispose(): void {
    this.vertexVisualizer.dispose();
    this.edgeVisualizer.dispose();
    this.faceVisualizer.dispose();
    this.selectionHighlighter.dispose();
  }
}
