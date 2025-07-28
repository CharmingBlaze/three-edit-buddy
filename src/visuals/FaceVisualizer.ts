import * as THREE from 'three';
import { EditableMesh } from '@/core/EditableMesh.js';
import { FaceVisualOptions } from './options';

export class FaceVisualizer {
  private mesh: EditableMesh;
  private options: Required<FaceVisualOptions>;

  public group: THREE.Group;
  public objects: THREE.Mesh[] = [];

  constructor(mesh: EditableMesh, options: FaceVisualOptions = {}) {
    this.mesh = mesh;
    this.options = {
      color: 0x00ff00,
      opacity: 0.3,
      visible: true,
      flatShading: false,
      ...options,
    };

    this.group = new THREE.Group();
    this.group.name = 'FaceVisuals';
    this.group.visible = this.options.visible;

    this.update();
  }

  update(): void {
    this.clear();

    if (!this.group.visible) return;

    const positions: number[] = [];
    const indices: number[] = [];
    let indexOffset = 0;

    for (const face of this.mesh.faces) {
      const faceVertices = face.vertexIds
        .map(id => this.mesh.getVertex(id))
        .filter((v): v is NonNullable<typeof v> => v !== undefined);
      if (faceVertices.length < 3) continue;

      for (const vertex of faceVertices) {
        positions.push(vertex.position.x, vertex.position.y, vertex.position.z);
      }

      if (faceVertices.length === 3) {
        indices.push(indexOffset, indexOffset + 1, indexOffset + 2);
      } else if (faceVertices.length === 4) {
        indices.push(indexOffset, indexOffset + 1, indexOffset + 2);
        indices.push(indexOffset, indexOffset + 2, indexOffset + 3);
      } else {
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
        color: this.options.color,
        transparent: true,
        opacity: this.options.opacity,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData = { type: 'face-highlight' };

      this.group.add(mesh);
      this.objects.push(mesh);
    }
  }

  setVisibility(visible: boolean): void {
    this.group.visible = visible;
    this.update();
  }

  getOptions(): Required<FaceVisualOptions> {
    return this.options;
  }

  updateOptions(options: Partial<FaceVisualOptions>): void {
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
