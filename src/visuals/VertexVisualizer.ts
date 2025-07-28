import * as THREE from 'three';
import { EditableMesh } from '@/core/EditableMesh.js';
import { VertexVisualOptions } from './options';

export class VertexVisualizer {
  private mesh: EditableMesh;
  private options: Required<VertexVisualOptions>;

  public group: THREE.Group;
  public objects: THREE.Mesh[] = [];

  constructor(mesh: EditableMesh, options: VertexVisualOptions = {}) {
    this.mesh = mesh;
    this.options = {
      color: 0xffff00,
      size: 0.1,
      visible: true,
      shape: 'cube',
      ...options,
    };

    this.group = new THREE.Group();
    this.group.name = 'VertexVisuals';
    this.group.visible = this.options.visible;

    this.update();
  }

  update(): void {
    this.clear();

    if (!this.group.visible) return;

    const geometry = this.options.shape === 'sphere'
      ? new THREE.SphereGeometry(this.options.size, 8, 6)
      : new THREE.BoxGeometry(this.options.size, this.options.size, this.options.size);

    const material = new THREE.MeshBasicMaterial({
      color: this.options.color,
      transparent: true,
      opacity: 0.8,
    });

    for (const vertex of this.mesh.vertices) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(vertex.position.x, vertex.position.y, vertex.position.z);
      mesh.userData = { vertexId: vertex.id, type: 'vertex' };

      this.group.add(mesh);
      this.objects.push(mesh);
    }
  }

  setVisibility(visible: boolean): void {
    this.group.visible = visible;
    this.update();
  }

  getOptions(): Required<VertexVisualOptions> {
    return this.options;
  }

  updateOptions(options: Partial<VertexVisualOptions>): void {
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
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => mat.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    this.clear();
  }
}
