import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class PrimitiveDemo {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.currentMesh = null;
        this.currentPrimitive = 'cube';
        this.highlightMode = 'none';
        this.highlightObjects = [];
        
        // Topology editing properties
        this.vertexObjects = [];
        this.selectedVertex = null;
        this.isDragging = false;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Simple topology system
        this.vertices = []; // Array of { id: number, position: THREE.Vector3, connectedFaces: number[] }
        this.faces = []; // Array of { id: number, vertexIds: number[] }
        this.edges = []; // Array of { id: number, vertexIds: [number, number] }
        
        this.primitiveCreators = {
            cube: () => this.createCube(),
            sphere: () => this.createSphere(),
            cylinder: () => this.createCylinder(),
            cone: () => this.createCone(),
            pyramid: () => this.createPyramid(),
            plane: () => this.createPlane()
        };

        this.primitiveStats = {
            cube: { vertices: 8, edges: 12, faces: 6, type: 'Quad-based' },
            sphere: { vertices: 42, edges: 80, faces: 40, type: 'Mixed (quads + triangles)' },
            cylinder: { vertices: 18, edges: 40, faces: 24, type: 'Mixed (quads + triangles)' },
            cone: { vertices: 10, edges: 24, faces: 16, type: 'Triangular' },
            pyramid: { vertices: 5, edges: 8, faces: 5, type: 'Triangular' },
            plane: { vertices: 4, edges: 4, faces: 1, type: 'Quad-based' }
        };

        this.init();
        this.setupEventListeners();
        this.createPrimitive('cube');
        this.animate();
    }

    // Create simple Three.js geometries directly
    createCube() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x667eea,
            transparent: true,
            opacity: 0.9
        });
        return new THREE.Mesh(geometry, material);
    }

    createSphere() {
        const geometry = new THREE.SphereGeometry(0.5, 8, 6);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x4CAF50,
            transparent: true,
            opacity: 0.9
        });
        return new THREE.Mesh(geometry, material);
    }

    createCylinder() {
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xFF9800,
            transparent: true,
            opacity: 0.9
        });
        return new THREE.Mesh(geometry, material);
    }

    createCone() {
        const geometry = new THREE.ConeGeometry(0.5, 1, 8);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xE91E63,
            transparent: true,
            opacity: 0.9
        });
        return new THREE.Mesh(geometry, material);
    }

    createPyramid() {
        const geometry = new THREE.ConeGeometry(0.5, 1, 4);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x9C27B0,
            transparent: true,
            opacity: 0.9
        });
        return new THREE.Mesh(geometry, material);
    }

    createPlane() {
        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x2196F3,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        return new THREE.Mesh(geometry, material);
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f0f23);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(3, 2, 3);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('canvas'),
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Lighting
        this.setupLighting();

        // Hide loading screen
        document.getElementById('loading').style.display = 'none';
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0x667eea, 0.3);
        fillLight.position.set(-3, 2, -3);
        this.scene.add(fillLight);

        // Rim light
        const rimLight = new THREE.DirectionalLight(0x764ba2, 0.2);
        rimLight.position.set(0, -2, 0);
        this.scene.add(rimLight);
    }

    setupEventListeners() {
        // Primitive buttons
        Object.keys(this.primitiveCreators).forEach(primitive => {
            const btn = document.getElementById(`${primitive}-btn`);
            if (btn) {
                btn.addEventListener('click', () => this.createPrimitive(primitive));
            }
        });

        // Highlight mode buttons
        ['none', 'vertices', 'edges', 'faces'].forEach(mode => {
            const btn = document.getElementById(`${mode}-btn`);
            if (btn) {
                btn.addEventListener('click', () => this.setHighlightMode(mode));
            }
        });

        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space') {
                event.preventDefault();
                this.cycleHighlightMode();
            }
        });

        // Vertex editing controls
        this.renderer.domElement.addEventListener('mousedown', (event) => this.onMouseDown(event));
        this.renderer.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event));
        this.renderer.domElement.addEventListener('mouseup', (event) => this.onMouseUp(event));

        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    createPrimitive(primitiveName) {
        // Remove current mesh
        if (this.currentMesh) {
            this.scene.remove(this.currentMesh);
        }

        // Clear highlights
        this.clearHighlights();

        // Create new primitive
        this.currentMesh = this.primitiveCreators[primitiveName]();
        this.currentPrimitive = primitiveName;

        // Convert to topology system
        this.convertGeometryToTopology(this.currentMesh.geometry);

        // Add to scene
        this.scene.add(this.currentMesh);

        // Update UI
        this.updatePrimitiveInfo(primitiveName);
        this.updateButtonStates(primitiveName);

        // Apply current highlight mode
        this.setHighlightMode(this.highlightMode);
    }

    setHighlightMode(mode) {
        this.highlightMode = mode;
        this.clearHighlights();
        
        if (mode === 'none' || !this.currentMesh) return;

        switch (mode) {
            case 'vertices':
                this.highlightVertices();
                break;
            case 'edges':
                this.highlightEdges();
                break;
            case 'faces':
                this.highlightFaces();
                break;
        }

        this.updateButtonStates(null, mode);
    }

    highlightVertices() {
        if (!this.vertices.length) return;
        
        // Clear previous vertex objects
        this.clearVertexObjects();
        
        // Create vertex markers for each unique vertex in the topology
        this.vertices.forEach(vertex => {
            const cubeGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.08);
            const material = new THREE.MeshBasicMaterial({ 
                color: 0xffff00,
                transparent: true,
                opacity: 0.9
            });
            const cube = new THREE.Mesh(cubeGeometry, material);
            cube.position.copy(vertex.position);
            cube.userData = { 
                vertexId: vertex.id, 
                originalPosition: vertex.position.clone() 
            };
            this.scene.add(cube);
            this.highlightObjects.push(cube);
            this.vertexObjects.push(cube);
        });
    }

    highlightEdges() {
        if (!this.edges.length) return;
        
        // Create line segments for all edges in the topology
        this.edges.forEach(edge => {
            const vertex1 = this.vertices[edge.vertexIds[0]];
            const vertex2 = this.vertices[edge.vertexIds[1]];
            
            if (vertex1 && vertex2) {
                // Apply mesh transform to vertices
                const v1 = vertex1.position.clone();
                const v2 = vertex2.position.clone();
                v1.applyMatrix4(this.currentMesh.matrixWorld);
                v2.applyMatrix4(this.currentMesh.matrixWorld);
                
                this.createEdgeLine(v1, v2);
            }
        });
    }



    createEdgeLine(v1, v2) {
        // Create a line geometry that connects exactly from v1 to v2
        const lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
            v1.x, v1.y, v1.z,
            v2.x, v2.y, v2.z
        ], 3));
        
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0xff0000,
            linewidth: 3,
            transparent: true,
            opacity: 0.9
        });
        
        const line = new THREE.Line(lineGeometry, lineMaterial);
        this.scene.add(line);
        this.highlightObjects.push(line);
    }

    highlightFaces() {
        if (!this.faces.length) return;
        
        // Create face meshes for all faces in the topology
        this.faces.forEach(face => {
            const vertices = face.vertexIds.map(vertexId => {
                const vertex = this.vertices[vertexId];
                if (!vertex) return null;
                
                const v = vertex.position.clone();
                v.applyMatrix4(this.currentMesh.matrixWorld);
                return v;
            }).filter(v => v !== null);
            
            if (vertices.length >= 3) {
                const faceGeometry = new THREE.BufferGeometry();
                const positions = [];
                vertices.forEach(v => {
                    positions.push(v.x, v.y, v.z);
                });
                
                faceGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                faceGeometry.computeVertexNormals();
                
                const material = new THREE.MeshBasicMaterial({ 
                    color: 0x00ff00,
                    transparent: true,
                    opacity: 0.3,
                    side: THREE.DoubleSide
                });
                const faceMesh = new THREE.Mesh(faceGeometry, material);
                this.scene.add(faceMesh);
                this.highlightObjects.push(faceMesh);
            }
        });
    }

    clearHighlights() {
        this.highlightObjects.forEach(obj => {
            this.scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });
        this.highlightObjects = [];
        this.clearVertexObjects();
    }

    clearVertexObjects() {
        this.vertexObjects.forEach(obj => {
            this.scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });
        this.vertexObjects = [];
    }

    cycleHighlightMode() {
        const modes = ['none', 'vertices', 'edges', 'faces'];
        const currentIndex = modes.indexOf(this.highlightMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        this.setHighlightMode(modes[nextIndex]);
    }

    updatePrimitiveInfo(primitiveName) {
        const infoElement = document.getElementById('primitive-info');
        const nameElement = infoElement.querySelector('.primitive-name');
        const statsElement = infoElement.querySelector('.primitive-stats');
        
        nameElement.textContent = primitiveName.charAt(0).toUpperCase() + primitiveName.slice(1);
        
        // Use actual topology counts if available, otherwise fall back to stats
        if (this.vertices.length > 0) {
            const actualVertices = this.vertices.length;
            const actualEdges = this.edges.length;
            const actualFaces = this.faces.length;
            
            statsElement.innerHTML = `
                Vertices: ${actualVertices}<br>
                Edges: ${actualEdges}<br>
                Faces: ${actualFaces}<br>
                Type: Topology-based
            `;
        } else {
            const stats = this.primitiveStats[primitiveName];
            statsElement.innerHTML = `
                Vertices: ${stats.vertices}<br>
                Edges: ${stats.edges}<br>
                Faces: ${stats.faces}<br>
                Type: ${stats.type}
            `;
        }
    }

    updateButtonStates(primitiveName = null, highlightMode = null) {
        // Update primitive buttons
        if (primitiveName) {
            Object.keys(this.primitiveCreators).forEach(primitive => {
                const btn = document.getElementById(`${primitive}-btn`);
                if (btn) {
                    btn.classList.toggle('active', primitive === primitiveName);
                }
            });
        }

        // Update highlight mode buttons
        if (highlightMode) {
            ['none', 'vertices', 'edges', 'faces'].forEach(mode => {
                const btn = document.getElementById(`${mode}-btn`);
                if (btn) {
                    btn.classList.toggle('active', mode === highlightMode);
                }
            });
        }
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

    // Topology system methods
    convertGeometryToTopology(geometry) {
        this.vertices = [];
        this.faces = [];
        this.edges = [];
        
        const positions = geometry.attributes.position;
        const indices = geometry.index;
        
        if (!positions) return;
        
        // Create vertices from position attributes
        const vertexMap = new Map(); // position string -> vertex ID
        
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            
            // Create a unique key for this position to avoid duplicates
            const positionKey = `${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)}`;
            
            if (!vertexMap.has(positionKey)) {
                const vertexId = this.vertices.length;
                this.vertices.push({
                    id: vertexId,
                    position: new THREE.Vector3(x, y, z),
                    connectedFaces: []
                });
                vertexMap.set(positionKey, vertexId);
            }
        }
        
        // Create faces from indices
        if (indices) {
            for (let i = 0; i < indices.count; i += 3) {
                const v1 = indices.getX(i);
                const v2 = indices.getY(i);
                const v3 = indices.getZ(i);
                
                // Get the actual vertex positions and find their IDs
                const pos1 = `${positions.getX(v1).toFixed(6)},${positions.getY(v1).toFixed(6)},${positions.getZ(v1).toFixed(6)}`;
                const pos2 = `${positions.getX(v2).toFixed(6)},${positions.getY(v2).toFixed(6)},${positions.getZ(v2).toFixed(6)}`;
                const pos3 = `${positions.getX(v3).toFixed(6)},${positions.getY(v3).toFixed(6)},${positions.getZ(v3).toFixed(6)}`;
                
                const vertexId1 = vertexMap.get(pos1);
                const vertexId2 = vertexMap.get(pos2);
                const vertexId3 = vertexMap.get(pos3);
                
                // Add face
                const faceId = this.faces.length;
                this.faces.push({
                    id: faceId,
                    vertexIds: [vertexId1, vertexId2, vertexId3]
                });
                
                // Update vertex connections
                this.vertices[vertexId1].connectedFaces.push(faceId);
                this.vertices[vertexId2].connectedFaces.push(faceId);
                this.vertices[vertexId3].connectedFaces.push(faceId);
                
                // Add edges
                this.addEdge(vertexId1, vertexId2);
                this.addEdge(vertexId2, vertexId3);
                this.addEdge(vertexId3, vertexId1);
            }
        }
    }
    
    addEdge(vertexId1, vertexId2) {
        // Check if edge already exists
        const edgeKey = vertexId1 < vertexId2 ? `${vertexId1}-${vertexId2}` : `${vertexId2}-${vertexId1}`;
        const existingEdge = this.edges.find(e => {
            const eKey = e.vertexIds[0] < e.vertexIds[1] ? `${e.vertexIds[0]}-${e.vertexIds[1]}` : `${e.vertexIds[1]}-${e.vertexIds[0]}`;
            return eKey === edgeKey;
        });
        
        if (!existingEdge) {
            this.edges.push({
                id: this.edges.length,
                vertexIds: [vertexId1, vertexId2]
            });
        }
    }
    
    moveVertex(vertexId, newPosition) {
        if (vertexId >= 0 && vertexId < this.vertices.length) {
            this.vertices[vertexId].position.copy(newPosition);
            this.updateGeometryFromTopology();
        }
    }
    
    updateGeometryFromTopology() {
        if (!this.currentMesh) return;
        
        // Create new geometry from topology
        const positions = [];
        const indices = [];
        
        // Create position array from vertices
        this.vertices.forEach(vertex => {
            positions.push(vertex.position.x, vertex.position.y, vertex.position.z);
        });
        
        // Create indices from faces
        this.faces.forEach(face => {
            face.vertexIds.forEach(vertexId => {
                indices.push(vertexId);
            });
        });
        
        // Update geometry
        const newGeometry = new THREE.BufferGeometry();
        newGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        newGeometry.setIndex(indices);
        newGeometry.computeVertexNormals();
        
        this.currentMesh.geometry.dispose();
        this.currentMesh.geometry = newGeometry;
    }

    // Vertex editing methods
    onMouseDown(event) {
        if (this.highlightMode !== 'vertices' || !this.currentMesh) return;

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.vertexObjects);

        if (intersects.length > 0) {
            this.selectedVertex = intersects[0].object;
            this.isDragging = true;
            this.controls.enabled = false;
            
            // Change color to indicate selection
            this.selectedVertex.material.color.setHex(0xff0000);
        }
    }

    onMouseMove(event) {
        if (!this.isDragging || !this.selectedVertex || !this.currentMesh) return;

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Create a plane at the vertex's current Y position for dragging
        const plane = new THREE.Plane();
        plane.setFromNormalAndCoplanarPoint(
            this.camera.getWorldDirection(new THREE.Vector3()),
            this.selectedVertex.position
        );
        
        const intersection = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(plane, intersection);
        
        if (intersection) {
            // Update vertex position
            this.selectedVertex.position.copy(intersection);
            
            // Update the actual geometry using vertex ID
            this.updateGeometryVertex(this.selectedVertex.userData.vertexId, intersection);
        }
    }

    onMouseUp(event) {
        if (this.selectedVertex) {
            // Reset color
            this.selectedVertex.material.color.setHex(0xffff00);
            this.selectedVertex = null;
        }
        
        this.isDragging = false;
        this.controls.enabled = true;
    }

    updateGeometryVertex(vertexId, newPosition) {
        // Move the vertex in the topology system - this automatically updates all connected faces/edges
        this.moveVertex(vertexId, newPosition);
        
        // Update the vertex marker position
        if (this.selectedVertex) {
            this.selectedVertex.position.copy(newPosition);
        }
        
        // Update highlights if they're currently shown
        if (this.highlightMode !== 'none') {
            this.setHighlightMode(this.highlightMode);
        }
    }
}

// Initialize demo when page loads
window.addEventListener('load', () => {
    new PrimitiveDemo();
}); 