import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  EditableMesh,
  createCube,
  SelectionManager,
  MeshVisualHelper,
} from '../index.js';

/**
 * Simple demo showing how easy it is to use the library features
 */
export class SimpleDemo {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;

  // Library components
  private mesh: EditableMesh;
  private selectionManager: SelectionManager;
  private visualHelper: MeshVisualHelper;

  // Three.js objects
  private meshObject: THREE.Mesh;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  // State
  private isDragging = false;
  private selectedVertexId: number | null = null;

  constructor(container: HTMLElement) {
    // Setup Three.js
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    // Setup controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.camera.position.set(5, 5, 5);
    this.controls.update();

    // Setup interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Create mesh using library
    this.mesh = createCube();

    // Create selection manager
    this.selectionManager = new SelectionManager(this.mesh, {
      threshold: 0.5,
      multiSelect: true,
      toggleOnReclick: true,
    });

    // Create visual helper
    this.visualHelper = new MeshVisualHelper(this.mesh, this.selectionManager, {
      vertices: {
        color: 0xffff00,
        size: 0.1,
        shape: 'cube',
      },
      edges: {
        color: 0xff0000,
        width: 2,
      },
      faces: {
        color: 0x00ff00,
        opacity: 0.3,
      },
      selection: {
        selectedVertexColor: 0xff6600,
        selectedEdgeColor: 0x00ffff,
        selectedFaceColor: 0xff6600,
      },
    });

    // Create Three.js mesh
    const geometry = this.mesh.toBufferGeometry();
    const material = new THREE.MeshPhongMaterial({
      color: 0x667eea,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    });
    this.meshObject = new THREE.Mesh(geometry, material);
    this.scene.add(this.meshObject);

    // Add visual groups to scene
    const groups = this.visualHelper.getVisualGroups();
    this.scene.add(groups.vertexGroup);
    this.scene.add(groups.edgeGroup);
    this.scene.add(groups.faceGroup);
    this.scene.add(groups.selectionGroup);

    // Setup lighting
    this.setupLighting();

    // Setup event listeners
    this.setupEventListeners();

    // Start render loop
    this.animate();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-10, -10, -5);
    this.scene.add(fillLight);
  }

  private setupEventListeners(): void {
    // Mouse events for selection and dragging
    this.renderer.domElement.addEventListener(
      'mousedown',
      this.onMouseDown.bind(this)
    );
    this.renderer.domElement.addEventListener(
      'mousemove',
      this.onMouseMove.bind(this)
    );
    this.renderer.domElement.addEventListener(
      'mouseup',
      this.onMouseUp.bind(this)
    );

    // Keyboard events
    document.addEventListener('keydown', this.onKeyDown.bind(this));

    // Window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private onMouseDown(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Try to select vertex first
    const vertexObjects = this.visualHelper.getVisualObjects().vertexObjects;
    const vertexIntersects = this.raycaster.intersectObjects(vertexObjects);

    if (vertexIntersects.length > 0) {
      const vertexObject = vertexIntersects[0].object as THREE.Mesh;
      this.selectedVertexId = vertexObject.userData.vertexId;
      this.isDragging = true;
      this.controls.enabled = false;

      // Select the vertex
      this.selectionManager.selectVertex(this.selectedVertexId);
      this.visualHelper.updateVisuals();
      return;
    }

    // Try to select face
    const intersects = this.raycaster.intersectObject(this.meshObject);
    if (intersects.length > 0) {
      const intersection = intersects[0];
      const selectedId = this.selectionManager.selectFromRaycast(
        intersection,
        'face'
      );
      if (selectedId !== null) {
        this.visualHelper.updateVisuals();
      }
    }
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging || this.selectedVertexId === null) return;

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Create a plane at the vertex's current position
    const vertex = this.mesh.getVertex(this.selectedVertexId);
    if (!vertex) return;

    const plane = new THREE.Plane();
    plane.setFromNormalAndCoplanarPoint(
      this.camera.getWorldDirection(new THREE.Vector3()),
      new THREE.Vector3(vertex.position.x, vertex.position.y, vertex.position.z)
    );

    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, intersection);

    // Move the vertex
    this.mesh.moveVertex(this.selectedVertexId, {
      x: intersection.x,
      y: intersection.y,
      z: intersection.z,
    });

    // Update the Three.js geometry
    const newGeometry = this.mesh.toBufferGeometry();
    this.meshObject.geometry.dispose();
    this.meshObject.geometry = newGeometry;

    // Update visual helper
    this.visualHelper.updateVisuals();
  }

  private onMouseUp(): void {
    this.isDragging = false;
    this.selectedVertexId = null;
    this.controls.enabled = true;
  }

  private onKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyV':
        // Toggle vertex visibility
        const currentVertexVisibility =
          this.visualHelper.getOptions().vertices.visible;
        this.visualHelper.setVisibility('vertices', !currentVertexVisibility);
        break;
      case 'KeyE':
        // Toggle edge visibility
        const currentEdgeVisibility =
          this.visualHelper.getOptions().edges.visible;
        this.visualHelper.setVisibility('edges', !currentEdgeVisibility);
        break;
      case 'KeyF':
        // Toggle face visibility
        const currentFaceVisibility =
          this.visualHelper.getOptions().faces.visible;
        this.visualHelper.setVisibility('faces', !currentFaceVisibility);
        break;
      case 'KeyC':
        // Clear selection
        this.selectionManager.clearSelection();
        this.visualHelper.updateVisuals();
        break;
      case 'KeyS':
        // Select connected vertices
        this.selectionManager.selectConnectedVertices();
        this.visualHelper.updateVisuals();
        break;
    }
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.visualHelper.dispose();
    this.meshObject.geometry.dispose();
    (this.meshObject.material as THREE.Material).dispose();
    this.renderer.dispose();
  }
}
