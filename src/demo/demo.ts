import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Core and helpers
import { EditableMesh } from '../core/EditableMesh.js';
import { SelectionManager } from '../selection/SelectionManager.js';
import { MeshVisualHelper } from '../visuals/MeshVisualHelper.js';

// Primitives
import { createCube } from '../primitives/cube/createCube.js';
import { createSphere } from '../primitives/sphere/createSphere.js';
import { createCylinder } from '../primitives/cylinder/createCylinder.js';
import { createCone } from '../primitives/cone/createCone.js';
import { createPyramid } from '../primitives/pyramid/createPyramid.js';
import { createPlane } from '../primitives/plane/createPlane.js';
import { createTorus } from '../primitives/torus/createTorus.js';
import { createOctahedron } from '../primitives/octahedron/createOctahedron.js';
import { createDodecahedron } from '../primitives/dodecahedron/createDodecahedron.js';
import { createIcosahedron } from '../primitives/icosahedron/createIcosahedron.js';

// Tools
import { extrudeFaces, subdivideEdge, mergeVertices, subdivideMesh, smoothMesh, getConstrainedPosition, snapToGrid, findClosestVertex } from '../tools/index.js';

// Conversion
import { exportOBJ } from '../convert/exportOBJ.js';

// Animation
import { Keyframe } from '../animation/Keyframe.js';
import { AnimationTrack } from '../animation/AnimationTrack.js';

class PrimitiveDemo {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  // Library components
  private currentMesh!: THREE.Mesh;
  private editableMesh!: EditableMesh;
  private selectionManager!: SelectionManager;
  private meshVisualHelper!: MeshVisualHelper;
  private currentPrimitiveName: string;

  // State
  private selectionMode: string;
  private viewMode: string;
  private constraintAxis: string | null;
  private isDragging: boolean;
  private draggedVertexInitialPositions: Map<number, any>;
  private gridSnapEnabled: boolean;
  private vertexSnapEnabled: boolean;
  private gridSize: number;

  // Animation state
  private animationTrack!: AnimationTrack;
  private isPlaying: boolean;
  private currentFrame: number;
  private animationFrameId: number | null;

  private primitiveCreators: Record<string, () => EditableMesh>;

  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.currentPrimitiveName = 'cube';

    this.selectionMode = 'vertex'; // 'vertex', 'edge', 'face'
    this.viewMode = 'none'; // 'none', 'vertices', 'edges', 'faces'
    this.constraintAxis = null; // 'x', 'y', 'z', or null
    this.isDragging = false;
    this.draggedVertexInitialPositions = new Map();
    this.gridSnapEnabled = false;
    this.vertexSnapEnabled = false;
    this.gridSize = 0.25;

    // Animation state
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

  init(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f0f23);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(3, 2, 3);

    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    this.setupLighting();

    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  }

  setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);
    const fillLight = new THREE.DirectionalLight(0x667eea, 0.4);
    fillLight.position.set(-3, 2, -3);
    this.scene.add(fillLight);
  }

  setupEventListeners(): void {
    // Dropdown event listeners
    document.addEventListener('dropdownChange', (e: Event) => {
      const customEvent = e as CustomEvent;
      const { dropdown, value } = customEvent.detail;
      
      switch (dropdown) {
        case 'primitive-options':
          this.createPrimitive(value);
          break;
        case 'view-options':
          this.setViewMode(value);
          break;
        case 'selection-options':
          this.setSelectionMode(value);
          break;
        case 'constraint-options':
          this.setConstraintAxis(value === 'none' ? null : value);
          break;
      }
    });

    // Tool buttons
    document.getElementById('extrude-btn')?.addEventListener('click', () => this.executeTool('extrude'));
    document.getElementById('subdivide-btn')?.addEventListener('click', () => this.executeTool('subdivide'));
    document.getElementById('merge-btn')?.addEventListener('click', () => this.executeTool('merge'));
    document.getElementById('export-obj-btn')?.addEventListener('click', () => this.exportMesh());
    document.getElementById('subdivide-mesh-btn')?.addEventListener('click', () => this.subdivideCurrentMesh());
    document.getElementById('smooth-mesh-btn')?.addEventListener('click', () => this.smoothCurrentMesh());

    // Toggle buttons
    document.getElementById('snap-grid-btn')?.addEventListener('click', () => this.toggleGridSnap());
    document.getElementById('snap-vertex-btn')?.addEventListener('click', () => this.toggleVertexSnap());

    // Mouse events
    this.renderer.domElement.addEventListener('mousedown', (e: MouseEvent) => this.onMouseDown(e));
    window.addEventListener('mousemove', (e: MouseEvent) => this.onMouseMove(e));
    window.addEventListener('mouseup', (e: MouseEvent) => this.onMouseUp(e));
    window.addEventListener('resize', () => this.onWindowResize());

    // Animation listeners
    document.getElementById('add-keyframe-btn')?.addEventListener('click', () => this.addKeyframe());
    document.getElementById('play-pause-btn')?.addEventListener('click', () => this.togglePlayPause());
    document.getElementById('timeline-slider')?.addEventListener('input', (e: Event) => this.scrubTimeline(e));

    // Keyboard shortcuts
    document.addEventListener('keydown', (e: KeyboardEvent) => this.onKeyDown(e));
  }

  createPrimitive(primitiveName: string): void {
    if (this.currentMesh) {
      this.scene.remove(this.currentMesh);
      this.currentMesh.geometry.dispose();
      if (this.currentMesh.material instanceof THREE.Material) {
        this.currentMesh.material.dispose();
      }
    }
    if (this.meshVisualHelper) {
      this.meshVisualHelper.dispose();
      const groups = this.meshVisualHelper.getVisualGroups();
      Object.values(groups).forEach(group => this.scene.remove(group));
    }

    const creator = this.primitiveCreators[primitiveName];
    if (!creator) {
      console.error(`Unknown primitive: ${primitiveName}`);
      return;
    }
    this.editableMesh = creator();
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
    if (primitiveName) {
      this.updateUI(primitiveName);
    }
  }

  setViewMode(mode: string): void {
    this.viewMode = mode;
    if (this.meshVisualHelper) {
      this.meshVisualHelper.setVisibility('vertices', mode === 'vertices');
      this.meshVisualHelper.setVisibility('edges', mode === 'edges');
      this.meshVisualHelper.setVisibility('faces', mode === 'faces');
    }
    console.log(`View mode set to: ${mode}`);
    this.updateUI();
  }

  setSelectionMode(mode: string): void {
    this.selectionMode = mode;
    if (this.selectionManager) {
      this.selectionManager.clearSelection();
    }
    if (this.meshVisualHelper) {
      this.meshVisualHelper.updateVisuals();
    }
    console.log(`Selection mode set to: ${mode}`);
    this.updateUI();
  }

  toggleGridSnap(): void {
    this.gridSnapEnabled = !this.gridSnapEnabled;
    console.log(`Grid snap ${this.gridSnapEnabled ? 'enabled' : 'disabled'}.`);
    this.updateUI();
  }

  toggleVertexSnap(): void {
    this.vertexSnapEnabled = !this.vertexSnapEnabled;
    console.log(`Vertex snap ${this.vertexSnapEnabled ? 'enabled' : 'disabled'}.`);
    this.updateUI();
  }

  setConstraintAxis(axis: string | null): void {
    this.constraintAxis = axis;
    console.log(`Constraint axis set to: ${axis}`);
    this.updateUI();
  }

  onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (!this.meshVisualHelper) return;

    const visualObjects = this.meshVisualHelper.getVisualObjects();
    let objectsToIntersect: THREE.Object3D[] = [];
    
    // For face selection, we need to intersect with the actual mesh, not just visual objects
    if (this.selectionMode === 'face') {
      const intersects = this.raycaster.intersectObject(this.currentMesh);
      if (intersects.length > 0) {
        const intersection = intersects[0];
        if (intersection && intersection.faceIndex !== undefined) {
          // Get the face ID from the intersection
          const faceId = intersection.faceIndex;
          if (this.selectionManager) {
            if (!event.shiftKey) {
              this.selectionManager.clearSelection();
            }
            this.selectionManager.selectFace(faceId);
            if (this.meshVisualHelper) {
              this.meshVisualHelper.updateVisuals();
            }
          }
        }
      }
      return;
    }
    
    // For vertex and edge selection, use visual objects
    switch (this.selectionMode) {
      case 'vertex': objectsToIntersect = visualObjects.vertexObjects; break;
      case 'edge': objectsToIntersect = visualObjects.edgeObjects; break;
    }

    if (objectsToIntersect.length === 0) return;

    const intersects = this.raycaster.intersectObjects(objectsToIntersect);

    if (intersects.length > 0) {
      const firstIntersect = intersects[0];
      if (!firstIntersect || !firstIntersect.object) return;
      const { type, vertexId, edgeId } = firstIntersect.object.userData;

      let id: number | undefined;
      if (type.includes('vertex')) id = vertexId;
      else if (type.includes('edge')) id = edgeId;

      if (id !== undefined && this.selectionManager) {
        if (!event.shiftKey) {
          this.selectionManager.clearSelection();
        }
        
        // Select the element
        switch (this.selectionMode) {
          case 'vertex':
            this.selectionManager.selectVertex(id);
            break;
          case 'edge':
            this.selectionManager.selectEdge(id);
            break;
        }
        
        if (this.meshVisualHelper) {
          this.meshVisualHelper.updateVisuals();
        }

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

  executeTool(toolName: string): void {
    if (!this.selectionManager) return;
    
    const selection = this.selectionManager.getSelection();
    try {
      switch (toolName) {
        case 'extrude':
          if (selection.selectedFaces.size > 0) {
            // Fix the extrudeFaces call - it takes faceIds array and distance
            const faceIds = Array.from(selection.selectedFaces);
            extrudeFaces(this.editableMesh, faceIds, 0.2);
          }
          break;
        case 'subdivide':
          if (selection.selectedEdges.size > 0) {
            const edgeArray = Array.from(selection.selectedEdges);
            if (edgeArray.length > 0) {
              // subdivideEdge takes edgeId and number of cuts
              if (edgeArray[0] !== undefined) {
                subdivideEdge(this.editableMesh, edgeArray[0]);
              }
            }
          }
          break;
        case 'merge':
          if (selection.selectedVertices.size > 1) {
            // The current mergeVertices tool uses a threshold and doesn't take specific vertex IDs.
            // We'll just call it with a small threshold. A more advanced implementation
            // would require a mergeSpecificVertices tool.
            mergeVertices(this.editableMesh, 0.01);
          }
          break;
      }
      this.currentMesh.geometry.dispose();
      this.currentMesh.geometry = this.editableMesh.toBufferGeometry();
      if (this.meshVisualHelper) {
        this.meshVisualHelper.updateVisuals();
      }
    } catch (error) {
      console.error(`Error executing ${toolName}:`, error);
    }
  }

  smoothCurrentMesh(): void {
    if (!this.editableMesh) {
      console.error('No mesh to smooth.');
      return;
    }

    try {
      smoothMesh(this.editableMesh, 1, 0.5); // Apply one iteration of smoothing

      // --- Refresh the scene with the smoothed mesh ---
      this.currentMesh.geometry.dispose();
      this.currentMesh.geometry = this.editableMesh.toBufferGeometry();
      if (this.meshVisualHelper) {
        this.meshVisualHelper.updateVisuals();
      }

      this.updateUI(this.currentPrimitiveName);
      console.log('Mesh smoothed successfully.');
    } catch (error) {
      console.error('Error smoothing mesh:', error);
    }
  }

  subdivideCurrentMesh(): void {
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

  exportMesh(): void {
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

  updateUI(primitiveName?: string): void {
    if (primitiveName) {
      const stats = {
        vertices: this.editableMesh.vertices.length,
        edges: this.editableMesh.edges.length,
        faces: this.editableMesh.faces.length,
      };
      const infoDiv = document.getElementById('primitive-info');
      if (infoDiv) {
        infoDiv.innerHTML = `
          <div class="primitive-name">${primitiveName.charAt(0).toUpperCase() + primitiveName.slice(1)}</div>
          <div class="primitive-stats">
            Vertices: ${stats.vertices}<br />
            Edges: ${stats.edges}<br />
            Faces: ${stats.faces}<br />
            Type: Quad-based
          </div>
          <div class="edit-info">
            <h4>Topology Editing</h4>
            <p>
              Click "Vertices" mode and drag yellow cubes to edit mesh topology
            </p>
            <p style="font-size: 10px; margin-top: 4px; color: #4caf50">
              ✓ Maintains mesh connectivity
            </p>

            <h4 style="margin-top: 12px; color: #ff9800">Face Editing Tools</h4>
            <p style="font-size: 11px; margin: 4px 0">
              1. Select faces/edges from dropdown
            </p>
            <p style="font-size: 11px; margin: 4px 0">
              2. Click on mesh to select elements
            </p>
            <p style="font-size: 11px; margin: 4px 0">
              3. Use editing tools to modify
            </p>
            <p style="font-size: 10px; margin-top: 4px; color: #4caf50">
              ✓ Advanced topology editing
            </p>
          </div>
        `;
      }
    }

    // Update toggle button states
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
    const timelineSlider = document.getElementById('timeline-slider') as HTMLInputElement;
    if (timelineSlider) {
      timelineSlider.value = this.currentFrame.toString();
    }
    const frameDisplay = document.getElementById('current-frame-display');
    if (frameDisplay) {
      frameDisplay.textContent = `Frame: ${this.currentFrame}`;
    }

    // Highlight keyframes on the timeline (visual feedback)
    const timelineContainer = document.querySelector('.timeline-container');
    if (timelineContainer) {
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
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;

    // Prevent unused variable warning
    if (event.type === 'mousemove') {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    } else {
        return;
    }

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const selectedVertices = this.selectionManager.getSelection().selectedVertices;
    if (selectedVertices.size === 0) return;

    for (const vertexId of selectedVertices) {
      const initialPos = this.draggedVertexInitialPositions.get(vertexId);
      if (!initialPos) continue;

      let newPosition: any;
      if (this.constraintAxis) {
        newPosition = getConstrainedPosition(initialPos, this.raycaster.ray, this.constraintAxis as 'x' | 'y' | 'z');
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

    this.currentMesh.geometry.dispose();
    this.currentMesh.geometry = this.editableMesh.toBufferGeometry();
    if (this.meshVisualHelper) {
      this.meshVisualHelper.updateVisuals();
    }
  }

  // --- Animation Methods ---

  addKeyframe(): void {
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

  togglePlayPause(): void {
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

  scrubTimeline(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.currentFrame = parseInt(target.value, 10);
    if (this.isPlaying) {
      this.togglePlayPause(); // Pause if scrubbing
    }
    this.updateMeshToFrame(this.currentFrame);
    this.updateUI();
  }

  animateTimeline(): void {
    if (!this.isPlaying) return;

    this.currentFrame++;
    if (this.currentFrame > 100) {
      this.currentFrame = 0; // Loop animation
    }

    this.updateMeshToFrame(this.currentFrame);
    this.updateUI();

    this.animationFrameId = requestAnimationFrame(() => this.animateTimeline());
  }

  updateMeshToFrame(frame: number): void {
    const positions = this.animationTrack.getInterpolatedPositions(frame);
    if (positions) {
      for (const [vertexId, pos] of positions.entries()) {
        this.editableMesh.moveVertex(vertexId, pos);
      }
      this.currentMesh.geometry.dispose();
      this.currentMesh.geometry = this.editableMesh.toBufferGeometry();
      if (this.meshVisualHelper) {
        this.meshVisualHelper.updateVisuals();
      }
    }
  }

  onMouseUp(event: MouseEvent): void {
    // Use event to prevent unused variable warning
    if (event.button === 0) {
        this.isDragging = false;
        this.controls.enabled = true;
    }
    this.isDragging = false;
    this.controls.enabled = true;
    this.draggedVertexInitialPositions.clear();
  }

  onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onKeyDown(event: KeyboardEvent): void {
    // Use event to prevent unused variable warning
    if (event.key) {
        // Placeholder for keyboard shortcuts
    }
    switch (event.code) {
      case 'Space':
        event.preventDefault();
        // Cycle through view modes
        const viewModes = ['none', 'vertices', 'edges', 'faces'];
        const currentIndex = viewModes.indexOf(this.viewMode);
        const nextIndex = (currentIndex + 1) % viewModes.length;
        const nextMode = viewModes[nextIndex];
        if (nextMode) {
          this.setViewMode(nextMode);
        }
        
        // Update dropdown
        const viewDropdown = document.getElementById('view-dropdown');
        const viewText = viewDropdown?.querySelector('span:first-child');
        if (viewText) {
          const nextMode = viewModes[nextIndex];
          if (nextMode) {
            viewText.textContent = nextMode.charAt(0).toUpperCase() + nextMode.slice(1);
          }
        }
        break;
    }
  }

  animate(): void {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    if (this.meshVisualHelper) {
      this.meshVisualHelper.dispose();
    }
    if (this.currentMesh) {
      this.currentMesh.geometry.dispose();
      if (this.currentMesh.material instanceof THREE.Material) {
        this.currentMesh.material.dispose();
      }
    }
    this.renderer.dispose();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new PrimitiveDemo();
});


