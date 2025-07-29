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
import { extrudeFaces, subdivideEdge, mergeVertices, subdivideMesh, smoothMesh, getConstrainedPosition, snapToGrid, findClosestVertex } from '@/tools/index.js';

// Conversion
import { exportOBJ } from '@/convert/exportOBJ.js';

// Animation
import { Keyframe } from '@/animation/Keyframe.js';
import { AnimationTrack } from '@/animation/AnimationTrack.js';

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
    this.currentPrimitiveName = 'cube';

        this.selectionMode = 'vertex'; // 'vertex', 'edge', 'face'
    this.constraintAxis = null; // 'x', 'y', 'z', or null
    this.isDragging = false;
        this.draggedVertexInitialPositions = new Map();
    this.gridSnapEnabled = false;
    this.vertexSnapEnabled = false;
        this.gridSize = 0.25;

    // Animation state
    this.animationTrack = null;
    this.isPlaying = false;
    this.currentFrame = 0;
    this.animationFrameId = null;

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
        document.getElementById('export-obj-btn')?.addEventListener('click', () => this.exportMesh());
        document.getElementById('subdivide-mesh-btn')?.addEventListener('click', () => this.subdivideCurrentMesh());
    document.getElementById('smooth-mesh-btn')?.addEventListener('click', () => this.smoothCurrentMesh());

        ['none', 'x', 'y', 'z'].forEach((axis) => {
      document.getElementById(`constrain-${axis}-btn`)?.addEventListener('click', () => this.setConstraintAxis(axis === 'none' ? null : axis));
    });

        document.getElementById('snap-grid-btn')?.addEventListener('click', () => this.toggleGridSnap());
    document.getElementById('snap-vertex-btn')?.addEventListener('click', () => this.toggleVertexSnap());

    this.renderer.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
    window.addEventListener('resize', () => this.onWindowResize());

    // Animation listeners
    document.getElementById('add-keyframe-btn')?.addEventListener('click', () => this.addKeyframe());
    document.getElementById('play-pause-btn')?.addEventListener('click', () => this.togglePlayPause());
    document.getElementById('timeline-slider')?.addEventListener('input', (e) => this.scrubTimeline(e));
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

        this.currentPrimitiveName = primitiveName;
    this.animationTrack = new AnimationTrack(); // Reset animation on new primitive
    this.updateUI(primitiveName);
  }

  setSelectionMode(mode) {
    this.selectionMode = mode;
    this.selectionManager.clearSelection();
    this.meshVisualHelper.updateVisuals();
    console.log(`Selection mode set to: ${mode}`);
    this.updateUI();
  }

  toggleGridSnap() {
    this.gridSnapEnabled = !this.gridSnapEnabled;
    console.log(`Grid snap ${this.gridSnapEnabled ? 'enabled' : 'disabled'}.`);
    this.updateUI();
  }

  toggleVertexSnap() {
    this.vertexSnapEnabled = !this.vertexSnapEnabled;
    console.log(`Vertex snap ${this.vertexSnapEnabled ? 'enabled' : 'disabled'}.`);
    this.updateUI();
  }

  setConstraintAxis(axis) {
    this.constraintAxis = axis;
    console.log(`Constraint axis set to: ${axis}`);
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
        if (!event.shiftKey && !this.selectionManager.isSelected(this.selectionMode, id)) {
          this.selectionManager.clearSelection();
        }
        this.selectionManager.toggleSelection(this.selectionMode, id, event.shiftKey);
        this.meshVisualHelper.updateVisuals();

        // If we selected a vertex, start dragging
        if (this.selectionMode === 'vertex' && this.selectionManager.getSelection().selectedVertices.size > 0) {
          this.isDragging = true;
          this.controls.enabled = false; // Disable camera controls during drag
          this.draggedVertexInitialPositions.clear();
          for (const vertexId of this.selectionManager.getSelection().selectedVertices) {
            const vertex = this.editableMesh.getVertex(vertexId);
            if (vertex) {
              this.draggedVertexInitialPositions.set(vertexId, { ...vertex.position });
            }
          }
        }
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

  smoothCurrentMesh() {
    if (!this.editableMesh) {
      console.error('No mesh to smooth.');
      return;
    }

    try {
      smoothMesh(this.editableMesh, 1, 0.5); // Apply one iteration of smoothing

      // --- Refresh the scene with the smoothed mesh ---
      this.editableMesh.update();
      this.currentMesh.geometry.dispose();
      this.currentMesh.geometry = this.editableMesh.toBufferGeometry();
      this.meshVisualHelper.updateVisuals();

      this.updateUI(this.currentPrimitiveName);
      console.log('Mesh smoothed successfully.');
    } catch (error) {
      console.error('Error smoothing mesh:', error);
    }
  }

  subdivideCurrentMesh() {
    if (!this.editableMesh) {
      console.error('No mesh to subdivide.');
      return;
    }

    try {
      const newEditableMesh = subdivideMesh(this.editableMesh);
      this.editableMesh = newEditableMesh;

      // --- Refresh the scene with the new mesh ---
      if (this.currentMesh) {
        this.scene.remove(this.currentMesh);
        this.currentMesh.geometry.dispose();
        // Keep the old material
      }
      if (this.meshVisualHelper) {
        this.meshVisualHelper.dispose();
        const groups = this.meshVisualHelper.getVisualGroups();
        Object.values(groups).forEach(group => this.scene.remove(group));
      }

      const geometry = this.editableMesh.toBufferGeometry();
      this.currentMesh = new THREE.Mesh(geometry, this.currentMesh.material);
      this.scene.add(this.currentMesh);

      this.selectionManager = new SelectionManager(this.editableMesh);
      this.meshVisualHelper = new MeshVisualHelper(this.editableMesh, this.selectionManager);

      const { vertexGroup, edgeGroup, faceGroup, selectionGroup } = this.meshVisualHelper.getVisualGroups();
      this.scene.add(vertexGroup, edgeGroup, faceGroup, selectionGroup);

      this.updateUI(this.currentPrimitiveName);
      console.log('Mesh subdivided successfully.');
    } catch (error) {
      console.error('Error subdividing mesh:', error);
    }
  }

  exportMesh() {
    if (!this.editableMesh) {
      console.error('No mesh to export.');
      return;
    }

    try {
      const objData = exportOBJ(this.editableMesh);
      const blob = new Blob([objData], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.currentPrimitiveName || 'mesh'}.obj`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('Mesh exported successfully.');
    } catch (error) {
      console.error('Error exporting mesh:', error);
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
        document.getElementById(`constrain-${this.constraintAxis || 'none'}-btn`)?.classList.add('active');

    const gridSnapBtn = document.getElementById('snap-grid-btn');
    if (gridSnapBtn) {
      gridSnapBtn.classList.toggle('active', this.gridSnapEnabled);
    }
    const vertexSnapBtn = document.getElementById('snap-vertex-btn');
        if (vertexSnapBtn) {
      vertexSnapBtn.classList.toggle('active', this.vertexSnapEnabled);
    }

    // Update animation UI
    const playPauseBtn = document.getElementById('play-pause-btn');
    if (playPauseBtn) {
      playPauseBtn.textContent = this.isPlaying ? 'Pause' : 'Play';
    }
    const timelineSlider = document.getElementById('timeline-slider');
    if (timelineSlider) {
      timelineSlider.value = this.currentFrame;
    }
    const frameDisplay = document.getElementById('current-frame-display');
    if (frameDisplay) {
      frameDisplay.textContent = `Frame: ${this.currentFrame}`;
    }

    // Highlight keyframes on the timeline (visual feedback)
    const timelineContainer = document.querySelector('.timeline-container');
    // Clear previous markers
    timelineContainer.querySelectorAll('.keyframe-marker').forEach(m => m.remove());
    if (this.animationTrack) {
      for (const keyframe of this.animationTrack.keyframes) {
        const marker = document.createElement('div');
        marker.className = 'keyframe-marker';
        marker.style.left = `${keyframe.frame}%`;
        timelineContainer.appendChild(marker);
      }
    }
  }

  onMouseMove(event) {
    if (!this.isDragging) return;

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const selectedVertices = this.selectionManager.getSelection().selectedVertices;
    if (selectedVertices.size === 0) return;

    for (const vertexId of selectedVertices) {
      const initialPos = this.draggedVertexInitialPositions.get(vertexId);
      if (!initialPos) continue;

      let newPosition;
      if (this.constraintAxis) {
        newPosition = getConstrainedPosition(initialPos, this.raycaster.ray, this.constraintAxis);
      } else {
        // Unconstrained movement: project onto a plane facing the camera
                const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
          this.camera.getWorldDirection(new THREE.Vector3()),
          new THREE.Vector3(initialPos.x, initialPos.y, initialPos.z)
        );
        const intersectionPoint = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(plane, intersectionPoint);
        newPosition = { x: intersectionPoint.x, y: intersectionPoint.y, z: intersectionPoint.z };
      }

            if (newPosition) {
        let finalPosition = newPosition;

        // Apply vertex snapping first, as it's more precise
        if (this.vertexSnapEnabled) {
          const snapTarget = findClosestVertex(this.editableMesh, finalPosition, 0.2, vertexId);
          if (snapTarget) {
            finalPosition = snapTarget;
          }
        }

        // Apply grid snapping if vertex snapping didn't occur
        if (this.gridSnapEnabled && (!this.vertexSnapEnabled || !findClosestVertex(this.editableMesh, finalPosition, 0.2, vertexId))) {
          finalPosition = snapToGrid(finalPosition, this.gridSize);
        }

        this.editableMesh.moveVertex(vertexId, finalPosition);
      }
    }

    this.editableMesh.update();
    this.currentMesh.geometry.dispose();
    this.currentMesh.geometry = this.editableMesh.toBufferGeometry();
    this.meshVisualHelper.updateVisuals();
  }

  // --- Animation Methods ---

  addKeyframe() {
    if (!this.editableMesh) return;

    const positions = new Map();
    for (const vertex of this.editableMesh.vertices) {
      positions.set(vertex.id, { ...vertex.position });
    }

    const keyframe = new Keyframe(this.currentFrame, positions);
    this.animationTrack.addKeyframe(keyframe);
    console.log(`Keyframe added at frame ${this.currentFrame}`);
    this.updateUI();
  }

  togglePlayPause() {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      if (this.currentFrame >= 100) {
        this.currentFrame = 0; // Loop back to start if at the end
      }
      this.animateTimeline();
    } else {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }
    this.updateUI();
  }

  scrubTimeline(event) {
    this.currentFrame = parseInt(event.target.value, 10);
    if (this.isPlaying) {
      this.togglePlayPause(); // Pause if scrubbing
    }
    this.updateMeshToFrame(this.currentFrame);
    this.updateUI();
  }

  animateTimeline() {
    if (!this.isPlaying) return;

    this.currentFrame++;
    if (this.currentFrame > 100) {
      this.currentFrame = 0; // Loop animation
    }

    this.updateMeshToFrame(this.currentFrame);
    this.updateUI();

    this.animationFrameId = requestAnimationFrame(() => this.animateTimeline());
  }

  updateMeshToFrame(frame) {
    const positions = this.animationTrack.getInterpolatedPositions(frame);
    if (positions) {
      for (const [vertexId, pos] of positions.entries()) {
        this.editableMesh.moveVertex(vertexId, pos);
      }
      this.editableMesh.update();
      this.currentMesh.geometry.dispose();
      this.currentMesh.geometry = this.editableMesh.toBufferGeometry();
      this.meshVisualHelper.updateVisuals();
    }
  }

  onMouseUp(event) {
    this.isDragging = false;
    this.controls.enabled = true;
    this.draggedVertexInitialPositions.clear();
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


