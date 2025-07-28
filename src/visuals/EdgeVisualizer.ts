import * as THREE from 'three';
import { EditableMesh } from '@/core/EditableMesh.js';
import { EdgeVisualOptions } from './options';

export class EdgeVisualizer {
  private mesh: EditableMesh;
  private options: Required<EdgeVisualOptions>;

  public group: THREE.Group;
  public objects: THREE.Line[] = [];

  constructor(mesh: EditableMesh, options: EdgeVisualOptions = {}) {
    this.mesh = mesh;
    this.options = {
      color: 0xff0000,
      width: 2,
      visible: true,
      opacity: 1.0,
      ...options,
    };

    this.group = new THREE.Group();
    this.group.name = 'EdgeVisuals';
    this.group.visible = this.options.visible;

    this.update();
  }

  update(): void {
    this.clear();

    if (!this.group.visible) return;

    const material = new THREE.LineBasicMaterial({
      color: this.options.color,
      linewidth: this.options.width,
      transparent: true,
      opacity: this.options.opacity,
    });

    for (const edge of this.mesh.edges) {
      const vertex1 = this.mesh.getVertex(edge.vertexIds[0]);
      const vertex2 = this.mesh.getVertex(edge.vertexIds[1]);

      if (vertex1 && vertex2) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(vertex1.position.x, vertex1.position.y, vertex1.position.z),
          new THREE.Vector3(vertex2.position.x, vertex2.position.y, vertex2.position.z),
        ]);

        const line = new THREE.Line(geometry, material);
        line.userData = { edgeId: edge.id, type: 'edge' };

        this.group.add(line);
        this.objects.push(line);
      }
    }
  }

  setVisibility(visible: boolean): void {
    this.group.visible = visible;
    this.update();
  }

  getOptions(): Required<EdgeVisualOptions> {
    return this.options;
  }

  updateOptions(options: Partial<EdgeVisualOptions>): void {
    this.options = { ...this.options, ...options };
    this.update();
  }

  private clear(): void {
    this.group.clear();
    this.objects = [];
  }

  dispose(): void {
    this.objects.forEach(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material && !Array.isArray(obj.material)) obj.material.dispose();
    });
    this.clear();
  }
}
