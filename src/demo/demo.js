import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Core and helpers
import { EditableMesh } from '@/core/EditableMesh.js';
import { SelectionManager } from '@/selection/SelectionManager.js';
import { MeshVisualHelper } from '@/visuals/MeshVisualHelper.js';

// Primitives
import { createCube } from '@/primitives/cube/createCube.js';
import { createSphere } from '@/primitives/sphere/createSphere.js';
import { createCylinder } from '@/primitives/cylinder/createCylinder.js';
import { createCone } from '@/primitives/cone/createCone.js';
import { createPyramid } from '@/primitives/pyramid/createPyramid.js';
import { createPlane } from '@/primitives/plane/createPlane.js';
import { createTorus } from '@/primitives/torus/createTorus.js';
import { createOctahedron } from '@/primitives/octahedron/createOctahedron.js';
import { createDodecahedron } from '@/primitives/dodecahedron/createDodecahedron.js';
import { createIcosahedron } from '@/primitives/icosahedron/createIcosahedron.js';

// Tools
import { extrudeFaces, subdivideEdge, mergeVertices } from '@/tools/index.js';

class PrimitiveDemo {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.currentMesh = null;
    this.editableMesh = null;
    this.selectionManager = null;
    this.meshVisualHelper = null;

    this.selectionMode = 'vertex'; // 'vertex', 'edge', 'face'

    this.primitiveCreators = {
      cube: createCube,
      sphere: createSphere,
      cylinder: createCylinder,
      cone: createCone,
      pyramid: createPyramid,
      plane: createPlane,
      torus: createTorus,
      octahedron: createOctahedron,
      dodecahedron: createDodecahedron,
      icosahedron: createIcosahedron,
    };

    this.init();
    this.setupEventListeners();
    this.createPrimitive('cube');
    this.animate();
  }

  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f0f23);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(3, 2, 3);

    const canvas = document.getElementById('canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    this.setupLighting();

    document.getElementById('loading').style.display = 'none';
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);
    const fillLight = new THREE.DirectionalLight(0x667eea, 0.4);
    fillLight.position.set(-3, 2, -3);
    this.scene.add(fillLight);
  }

  setupEventListeners() {
    Object.keys(this.primitiveCreators).forEach((name) => {
      document.getElementById(`${name}-btn`)?.addEventListener('click', () => this.createPrimitive(name));
    });

    ['vertex', 'edge', 'face'].forEach((mode) => {
      document.getElementById(`${mode}-btn`)?.addEventListener('click', () => this.setSelectionMode(mode));
    });

    document.getElementById('extrude-btn')?.addEventListener('click', () => this.executeTool('extrude'));
    document.getElementById('subdivide-btn')?.addEventListener('click', () => this.executeTool('subdivide'));
    document.getElementById('merge-btn')?.addEventListener('click', () => this.executeTool('merge'));

    this.renderer.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('resize', () => this.onWindowResize());
  }

  createPrimitive(primitiveName) {
    if (this.currentMesh) {
      this.scene.remove(this.currentMesh);
      this.currentMesh.geometry.dispose();
      this.currentMesh.material.dispose();
    }
    if (this.meshVisualHelper) {
      this.meshVisualHelper.dispose();
      const groups = this.meshVisualHelper.getVisualGroups();
      Object.values(groups).forEach(group => this.scene.remove(group));
    }

    this.editableMesh = this.primitiveCreators[primitiveName]();
    const geometry = this.editableMesh.toBufferGeometry();
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6),
      side: THREE.DoubleSide,
      flatShading: false,
    });

    this.currentMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.currentMesh);

    this.selectionManager = new SelectionManager(this.editableMesh);
    this.meshVisualHelper = new MeshVisualHelper(this.editableMesh, this.selectionManager);

    const { vertexGroup, edgeGroup, faceGroup, selectionGroup } = this.meshVisualHelper.getVisualGroups();
    this.scene.add(vertexGroup, edgeGroup, faceGroup, selectionGroup);

    this.updateUI(primitiveName);
  }

  setSelectionMode(mode) {
    this.selectionMode = mode;
    this.selectionManager.clearSelection();
    this.meshVisualHelper.updateVisuals();
    console.log(`Selection mode set to: ${mode}`);
    this.updateUI();
  }

  onMouseDown(event) {
    event.preventDefault();
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const visualObjects = this.meshVisualHelper.getVisualObjects();
    let objectsToIntersect = [];
    switch (this.selectionMode) {
      case 'vertex': objectsToIntersect = visualObjects.vertexObjects; break;
      case 'edge': objectsToIntersect = visualObjects.edgeObjects; break;
      case 'face': objectsToIntersect = visualObjects.faceObjects; break;
    }

    if (objectsToIntersect.length === 0) return;

    const intersects = this.raycaster.intersectObjects(objectsToIntersect);

    if (intersects.length > 0) {
      const firstIntersect = intersects[0].object;
      const { type, vertexId, edgeId, faceId } = firstIntersect.userData;

      let id;
      if (type.includes('vertex')) id = vertexId;
      else if (type.includes('edge')) id = edgeId;
      else if (type.includes('face')) id = faceId;

      if (id !== undefined) {
        this.selectionManager.toggleSelection(this.selectionMode, id, event.shiftKey);
        this.meshVisualHelper.updateVisuals();
      }
    }
  }

  executeTool(toolName) {
    const selection = this.selectionManager.getSelection();
    try {
      switch (toolName) {
        case 'extrude':
          if (selection.selectedFaces.size > 0) {
            extrudeFaces(this.editableMesh, Array.from(selection.selectedFaces), { distance: 0.2 });
          }
          break;
        case 'subdivide':
          if (selection.selectedEdges.size > 0) {
            subdivideEdge(this.editableMesh, Array.from(selection.selectedEdges)[0], { splits: 1 });
          }
          break;
        case 'merge':
          if (selection.selectedVertices.size > 1) {
            mergeVertices(this.editableMesh, Array.from(selection.selectedVertices));
          }
          break;
      }
      this.editableMesh.update();
      this.currentMesh.geometry.dispose();
      this.currentMesh.geometry = this.editableMesh.toBufferGeometry();
      this.meshVisualHelper.updateVisuals();
    } catch (error) {
      console.error(`Error executing ${toolName}:`, error);
    }
  }

  updateUI(primitiveName) {
    if (primitiveName) {
      const stats = {
        vertices: this.editableMesh.vertices.length,
        edges: this.editableMesh.edges.length,
        faces: this.editableMesh.faces.length,
      };
      const infoDiv = document.getElementById('primitive-info');
      infoDiv.innerHTML = `
        <h3>${primitiveName.charAt(0).toUpperCase() + primitiveName.slice(1)}</h3>
        <p><strong>Vertices:</strong> ${stats.vertices}</p>
        <p><strong>Edges:</strong> ${stats.edges}</p>
        <p><strong>Faces:</strong> ${stats.faces}</p>
      `;
    }

    document.querySelectorAll('.controls-section button.active').forEach(b => b.classList.remove('active'));
    document.getElementById(`${this.selectionMode}-btn`)?.classList.add('active');
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new PrimitiveDemo();
});

  // Enhanced mouse handling for face/edge selection
  handleSelectionMouseDown(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.currentMesh);

    if (intersects.length > 0) {
      const intersection = intersects[0];
      const faceIndex = intersection.faceIndex;

      if (this.faceSelectionMode) {
        // Find the face that contains this triangle, considering face orientation
        const faceId = this.findFaceFromTriangle(
          faceIndex,
          intersection.face.normal,
          intersection.point
        );
        if (faceId !== null) {
          this.toggleFaceSelection(faceId);
        }
      } else if (this.edgeSelectionMode) {
        // Find the edge closest to the intersection point
        const edgeId = this.findClosestEdge(intersection.point);
        if (edgeId !== null) {
          this.toggleEdgeSelection(edgeId);
        }
      }
    }
  }

  findFaceFromTriangle(triangleIndex, faceNormal, intersectionPoint) {
    // Get camera direction to determine which side of the face we're clicking
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);

    // Transform face normal to world space
    const worldNormal = faceNormal.clone();
    worldNormal.applyMatrix4(this.currentMesh.matrixWorld);
    worldNormal.normalize();

    // Check if we're clicking on the front face (normal pointing toward camera)
    const dotProduct = cameraDirection.dot(worldNormal);
    const isFrontFace = dotProduct < 0;

    console.log('Face selection debug:', {
      triangleIndex,
      faceNormal: faceNormal.toArray(),
      worldNormal: worldNormal.toArray(),
      cameraDirection: cameraDirection.toArray(),
      dotProduct: dotProduct.toFixed(3),
      isFrontFace,
    });

    // Only select if we're clicking on the front face
    if (!isFrontFace) {
      console.log('Clicked on back face, ignoring');
      return null;
    }

    // Map triangle index to face ID
    // Since each face can be triangulated into 2 triangles, we need to find the correct face
    if (this.faces.length > 0) {
      // For quads, each face creates 2 triangles (0-1, 1-2)
      const faceIndex = Math.floor(triangleIndex / 2);
      if (faceIndex < this.faces.length) {
        const faceId = this.faces[faceIndex].id;
        console.log(`Selected face ${faceId} from triangle ${triangleIndex}`);
        return faceId;
      }
    }

    // Fallback: find the closest face to the intersection point
    return this.findClosestFace(intersectionPoint);
  }

  findClosestFace(point) {
    let closestFaceId = null;
    let closestDistance = Infinity;

    console.log('Finding closest face to point:', point);

    this.faces.forEach((face) => {
      // Calculate face center and check if point is within face bounds
      const faceVertices = face.vertexIds.map((id) => this.vertices[id]);
      if (faceVertices.some((v) => !v)) return; // Skip if any vertex is missing

      // Transform vertices to world space
      const worldVertices = faceVertices.map((vertex) => {
        const worldPos = vertex.position.clone();
        worldPos.applyMatrix4(this.currentMesh.matrixWorld);
        return worldPos;
      });

      // Calculate face center
      const center = new THREE.Vector3();
      worldVertices.forEach((vertex) => {
        center.add(vertex);
      });
      center.divideScalar(worldVertices.length);

      // Check if point is within face bounds (simplified - just check distance to center)
      const distance = point.distanceTo(center);

      // Additional check: ensure we're on the correct side of the face
      if (worldVertices.length >= 3) {
        const v0 = worldVertices[0];
        const v1 = worldVertices[1];
        const v2 = worldVertices[2];

        // Calculate face normal
        const edge1 = new THREE.Vector3().subVectors(v1, v0);
        const edge2 = new THREE.Vector3().subVectors(v2, v0);
        const faceNormal = new THREE.Vector3()
          .crossVectors(edge1, edge2)
          .normalize();

        // Check if point is on the front side of the face
        const toPoint = new THREE.Vector3().subVectors(point, v0);
        const dotProduct = faceNormal.dot(toPoint);

        if (dotProduct > 0 && distance < closestDistance) {
          closestDistance = distance;
          closestFaceId = face.id;
          console.log(
            `Found closer face ${face.id} at distance ${distance.toFixed(3)}, dot: ${dotProduct.toFixed(3)}`
          );
        }
      }
    });

    console.log(
      'Closest face:',
      closestFaceId,
      'at distance:',
      closestDistance.toFixed(3)
    );
    return closestFaceId;
  }

  findClosestEdge(point) {
    let closestEdgeId = null;
    let closestDistance = Infinity;

    console.log('Looking for edge near point:', point);

    this.edges.forEach((edge) => {
      const vertex1 = this.vertices[edge.vertexIds[0]];
      const vertex2 = this.vertices[edge.vertexIds[1]];

      if (vertex1 && vertex2) {
        const v1 = vertex1.position.clone();
        const v2 = vertex2.position.clone();
        v1.applyMatrix4(this.currentMesh.matrixWorld);
        v2.applyMatrix4(this.currentMesh.matrixWorld);

        // Calculate distance from point to line segment
        const distance = this.distanceToLineSegment(point, v1, v2);

        if (distance < closestDistance && distance < 0.2) {
          // Within 0.2 units
          closestDistance = distance;
          closestEdgeId = edge.id;
          console.log(
            `Found closer edge ${edge.id} at distance ${distance.toFixed(3)}`
          );
        }
      }
    });

    console.log(
      'Closest edge:',
      closestEdgeId,
      'at distance:',
      closestDistance.toFixed(3)
    );
    return closestEdgeId;
  }

  distanceToLineSegment(point, lineStart, lineEnd) {
    const lineVec = new THREE.Vector3().subVectors(lineEnd, lineStart);
    const pointVec = new THREE.Vector3().subVectors(point, lineStart);

    const lineLength = lineVec.length();
    if (lineLength === 0) return pointVec.length();

    const t = Math.max(
      0,
      Math.min(1, pointVec.dot(lineVec) / (lineLength * lineLength))
    );
    const projection = new THREE.Vector3().addVectors(
      lineStart,
      lineVec.multiplyScalar(t)
    );

    return point.distanceTo(projection);
  }

  toggleFaceSelection(faceId) {
    const index = this.selectedFaces.indexOf(faceId);
    if (index === -1) {
      this.selectedFaces.push(faceId);
      console.log('Selected face:', faceId);
    } else {
      this.selectedFaces.splice(index, 1);
      console.log('Deselected face:', faceId);
    }
    console.log('Selected faces:', this.selectedFaces);
    this.updateSelectionHighlights();
    this.updateSelectionUI();
  }

  toggleEdgeSelection(edgeId) {
    const index = this.selectedEdges.indexOf(edgeId);
    if (index === -1) {
      this.selectedEdges.push(edgeId);
      console.log('Selected edge:', edgeId);
    } else {
      this.selectedEdges.splice(index, 1);
      console.log('Deselected edge:', edgeId);
    }
    console.log('Selected edges:', this.selectedEdges);
    this.updateSelectionHighlights();
    this.updateSelectionUI();
  }

  updateSelectionHighlights() {
    // Clear existing selection highlights
    this.clearSelectionHighlights();

    // Create highlights for selected faces
    if (this.selectedFaces.length > 0) {
      this.createFaceSelectionHighlights();
    }

    // Create highlights for selected edges
    if (this.selectedEdges.length > 0) {
      this.createEdgeSelectionHighlights();
    }
  }

  createFaceSelectionHighlights() {
    this.selectedFaces.forEach((faceId) => {
      const face = this.faces.find((f) => f.id === faceId);
      if (!face) return;

      const vertices = face.vertexIds
        .map((vertexId) => {
          const vertex = this.vertices[vertexId];
          if (!vertex) return null;

          const v = vertex.position.clone();
          v.applyMatrix4(this.currentMesh.matrixWorld);
          return v;
        })
        .filter((v) => v !== null);

      if (vertices.length >= 3) {
        // Create a highlight mesh for this face
        const faceGeometry = new THREE.BufferGeometry();
        const positions = [];

        vertices.forEach((v) => {
          positions.push(v.x, v.y, v.z);
        });

        // Create indices based on face type
        const indices = [];
        if (vertices.length === 3) {
          indices.push(0, 1, 2);
        } else if (vertices.length === 4) {
          indices.push(0, 1, 2, 0, 2, 3);
        } else {
          for (let i = 1; i < vertices.length - 1; i++) {
            indices.push(0, i, i + 1);
          }
        }

        faceGeometry.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(positions, 3)
        );
        faceGeometry.setIndex(indices);
        faceGeometry.computeVertexNormals();

        // Bright orange material for selected faces
        const material = new THREE.MeshBasicMaterial({
          color: 0xff6600,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
        });

        const faceMesh = new THREE.Mesh(faceGeometry, material);
        this.scene.add(faceMesh);
        this.selectionHighlights.push(faceMesh);
      }
    });
  }

  createEdgeSelectionHighlights() {
    this.selectedEdges.forEach((edgeId) => {
      const edge = this.edges.find((e) => e.id === edgeId);
      if (!edge) return;

      const vertex1 = this.vertices[edge.vertexIds[0]];
      const vertex2 = this.vertices[edge.vertexIds[1]];

      if (vertex1 && vertex2) {
        const v1 = vertex1.position.clone();
        const v2 = vertex2.position.clone();
        v1.applyMatrix4(this.currentMesh.matrixWorld);
        v2.applyMatrix4(this.currentMesh.matrixWorld);

        // Create a thick line for selected edges using multiple line segments
        const segments = 10;
        const points = [];

        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const x = v1.x + (v2.x - v1.x) * t;
          const y = v1.y + (v2.y - v1.y) * t;
          const z = v1.z + (v2.z - v1.z) * t;
          points.push(x, y, z);
        }

        const lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(points, 3)
        );

        // Bright cyan material for selected edges
        const lineMaterial = new THREE.LineBasicMaterial({
          color: 0x00ffff,
          linewidth: 8,
          transparent: true,
          opacity: 1.0,
        });

        const line = new THREE.Line(lineGeometry, lineMaterial);
        this.scene.add(line);
        this.selectionHighlights.push(line);

        // Add small spheres at the endpoints for better visibility
        const sphereGeometry = new THREE.SphereGeometry(0.05, 8, 6);
        const sphereMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.8,
        });

        const sphere1 = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere1.position.copy(v1);
        this.scene.add(sphere1);
        this.selectionHighlights.push(sphere1);

        const sphere2 = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere2.position.copy(v2);
        this.scene.add(sphere2);
        this.selectionHighlights.push(sphere2);
      }
    });
  }

  clearSelectionHighlights() {
    this.selectionHighlights.forEach((obj) => {
      this.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
    this.selectionHighlights = [];
  }

  updateSelectionUI() {
    // Update face selection button text
    const faceBtn = document.getElementById('select-faces-btn');
    if (faceBtn) {
      if (this.selectedFaces.length > 0) {
        faceBtn.textContent = `Select Faces (${this.selectedFaces.length})`;
        faceBtn.style.background = 'rgba(255, 102, 0, 0.3)';
      } else {
        faceBtn.textContent = 'Select Faces';
        faceBtn.style.background = 'rgba(255, 255, 255, 0.1)';
      }
    }

    // Update edge selection button text
    const edgeBtn = document.getElementById('select-edges-btn');
    if (edgeBtn) {
      if (this.selectedEdges.length > 0) {
        edgeBtn.textContent = `Select Edges (${this.selectedEdges.length})`;
        edgeBtn.style.background = 'rgba(0, 255, 255, 0.3)';
      } else {
        edgeBtn.textContent = 'Select Edges';
        edgeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
      }
    }
  }
}

// Initialize demo when page loads
window.addEventListener('load', () => {
  new PrimitiveDemo();
});
