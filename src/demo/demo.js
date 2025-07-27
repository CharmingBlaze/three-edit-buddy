import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Import the core EditableMesh class and primitives
import { EditableMesh } from '../core/EditableMesh.js';
import { createCube } from '../primitives/cube/createCube.js';
import { createSphere } from '../primitives/sphere/createSphere.js';
import { createCylinder } from '../primitives/cylinder/createCylinder.js';
import { createCone } from '../primitives/cone/createCone.js';
import { createPyramid } from '../primitives/pyramid/createPyramid.js';
import { createPlane } from '../primitives/plane/createPlane.js';

// Import editing tools
import { extrudeFaces, subdivideEdge, mergeVertices } from '../tools/index.js';

class PrimitiveDemo {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.currentMesh = null;
        this.highlightMode = 'none';
        this.highlightObjects = [];
        this.vertexObjects = [];
        this.selectedVertex = null;
        this.isDragging = false;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Topology system for editing
        this.vertices = [];
        this.faces = [];
        this.edges = [];
        
        // Face editing system
        this.selectedFaces = [];
        this.selectedEdges = [];
        this.faceSelectionMode = false;
        this.edgeSelectionMode = false;
        this.selectionHighlights = [];
        
        // Primitive creators using the library
        this.primitiveCreators = {
            cube: () => this.createEditableMeshPrimitive('cube'),
            sphere: () => this.createEditableMeshPrimitive('sphere'),
            cylinder: () => this.createEditableMeshPrimitive('cylinder'),
            cone: () => this.createEditableMeshPrimitive('cone'),
            pyramid: () => this.createEditableMeshPrimitive('pyramid'),
            plane: () => this.createEditableMeshPrimitive('plane')
        };
        
        // Updated stats for EditableMesh primitives
        this.primitiveStats = {
            cube: { vertices: 8, edges: 12, faces: 6, type: 'EditableMesh' },
            sphere: { vertices: 25, edges: 48, faces: 24, type: 'EditableMesh' },
            cylinder: { vertices: 16, edges: 32, faces: 10, type: 'EditableMesh' },
            cone: { vertices: 9, edges: 16, faces: 8, type: 'EditableMesh' },
            pyramid: { vertices: 5, edges: 8, faces: 5, type: 'EditableMesh' },
            plane: { vertices: 4, edges: 4, faces: 1, type: 'EditableMesh' }
        };
        
        this.init();
        this.setupEventListeners();
        this.createPrimitive('cube');
        this.animate();
    }
    
    // Helper method to create EditableMesh primitives using the library
    createEditableMeshPrimitive(primitiveName) {
        const colors = {
            cube: 0x667eea,
            sphere: 0x4CAF50,
            cylinder: 0xFF9800,
            cone: 0xE91E63,
            pyramid: 0x9C27B0,
            plane: 0x2196F3
        };
        
        try {
            console.log(`Creating EditableMesh primitive: ${primitiveName}`);
            
            // Create EditableMesh primitive using the library
            let editableMesh;
            switch (primitiveName) {
                case 'cube':
                    editableMesh = createCube();
                    break;
                case 'sphere':
                    editableMesh = createSphere();
                    break;
                case 'cylinder':
                    editableMesh = createCylinder();
                    break;
                case 'cone':
                    editableMesh = createCone();
                    break;
                case 'pyramid':
                    editableMesh = createPyramid();
                    break;
                case 'plane':
                    editableMesh = createPlane();
                    break;
                default:
                    throw new Error(`Unknown primitive: ${primitiveName}`);
            }
            
            console.log(`EditableMesh created:`, {
                vertices: editableMesh.vertices.length,
                edges: editableMesh.edges.length,
                faces: editableMesh.faces.length
            });
            
            // Convert to Three.js BufferGeometry
            const geometry = editableMesh.toBufferGeometry();
            
            console.log(`Geometry converted:`, {
                positions: geometry.attributes.position.count,
                indices: geometry.index ? geometry.index.count : 0
            });
            
            // Create material
            const material = new THREE.MeshPhongMaterial({ 
                color: colors[primitiveName],
                transparent: true,
                opacity: 0.95,
                side: THREE.DoubleSide,
                flatShading: false,
                shininess: 80,
                specular: 0x666666,
                reflectivity: 0.3
            });
            
            // Create Three.js mesh
            const mesh = new THREE.Mesh(geometry, material);
            
            // Store the EditableMesh for editing
            mesh.userData.editableMesh = editableMesh;
            
            console.log(`Mesh created successfully for ${primitiveName}`);
            return mesh;
        } catch (error) {
            console.error('Error creating EditableMesh primitive:', error);
            // Fallback to Three.js geometry
            return this.createFallbackGeometry(primitiveName);
        }
    }
    
    getPrimitiveColor(primitiveName) {
        const colors = {
            createCube: 0x667eea,
            createSphere: 0x4CAF50,
            createCylinder: 0xFF9800,
            createCone: 0xE91E63,
            createPyramid: 0x9C27B0,
            createPlane: 0x2196F3
        };
        return colors[primitiveName] || 0xcccccc;
    }
    
    createFallbackGeometry(primitiveName, params) {
        // Fallback to Three.js geometries if EditableMesh fails
        const geometries = {
            createCube: () => new THREE.BoxGeometry(1, 1, 1),
            createSphere: () => new THREE.SphereGeometry(0.5, 8, 6),
            createCylinder: () => new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
            createCone: () => new THREE.ConeGeometry(0.5, 1, 8),
            createPyramid: () => new THREE.ConeGeometry(0.5, 1, 4),
            createPlane: () => new THREE.PlaneGeometry(1, 1)
        };
        
        const geometry = geometries[primitiveName]();
        const material = new THREE.MeshPhongMaterial({ 
            color: this.getPrimitiveColor(primitiveName),
            transparent: true,
            opacity: 0.9
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
        // Ambient light - increased for smoother appearance
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Main directional light - softer and more diffused
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        this.scene.add(directionalLight);

        // Fill light - increased for smoother shading
        const fillLight = new THREE.DirectionalLight(0x667eea, 0.4);
        fillLight.position.set(-3, 2, -3);
        this.scene.add(fillLight);

        // Rim light - softer
        const rimLight = new THREE.DirectionalLight(0x764ba2, 0.3);
        rimLight.position.set(0, -2, 0);
        this.scene.add(rimLight);
        
        // Additional soft light from above
        const topLight = new THREE.DirectionalLight(0xffffff, 0.3);
        topLight.position.set(0, 10, 0);
        this.scene.add(topLight);
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

        // Face editing tool buttons
        ['extrude', 'subdivide', 'merge'].forEach(tool => {
            const btn = document.getElementById(`${tool}-btn`);
            if (btn) {
                btn.addEventListener('click', () => this.executeFaceTool(tool));
            }
        });

        // Selection mode buttons
        ['select-faces', 'select-edges'].forEach(mode => {
            const btn = document.getElementById(`${mode}-btn`);
            if (btn) {
                btn.addEventListener('click', () => this.setSelectionMode(mode));
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
        console.log(`Creating primitive: ${primitiveName}`);
        
        // Remove current mesh
        if (this.currentMesh) {
            this.scene.remove(this.currentMesh);
        }

        // Clear highlights
        this.clearHighlights();

        // Create new primitive
        this.currentMesh = this.primitiveCreators[primitiveName]();
        this.currentPrimitive = primitiveName;

        console.log(`Primitive created:`, {
            mesh: this.currentMesh,
            hasEditableMesh: !!this.currentMesh.userData.editableMesh,
            geometry: this.currentMesh.geometry,
            material: this.currentMesh.material
        });

        // Use EditableMesh topology if available
        if (this.currentMesh.userData.editableMesh) {
            this.setupEditableMeshTopology(this.currentMesh.userData.editableMesh);
        } else {
            // Fallback to geometry conversion
            this.convertGeometryToTopology(this.currentMesh.geometry);
        }

        // Add to scene
        this.scene.add(this.currentMesh);
        console.log(`Primitive added to scene. Scene children:`, this.scene.children.length);

        // Update UI
        this.updatePrimitiveInfo(primitiveName);
        this.updateButtonStates(primitiveName);

        // Apply current highlight mode
        this.setHighlightMode(this.highlightMode);
    }
    
    setupEditableMeshTopology(editableMesh) {
        console.log('Setting up EditableMesh topology:', {
            vertices: editableMesh.vertices.length,
            faces: editableMesh.faces.length,
            edges: editableMesh.edges.length
        });
        
        // Create a mapping from EditableMesh vertex IDs to sequential demo IDs
        const vertexIdMap = new Map();
        let demoVertexId = 0;
        
        // Use the actual EditableMesh topology with proper ID mapping
        this.vertices = editableMesh.vertices.map(vertex => {
            vertexIdMap.set(vertex.id, demoVertexId);
            return {
                id: demoVertexId++, // Use sequential IDs for demo
                originalId: vertex.id, // Keep original ID for EditableMesh reference
                position: new THREE.Vector3(vertex.position.x, vertex.position.y, vertex.position.z),
                connectedFaces: []
            };
        });
        
        this.faces = editableMesh.faces.map(face => ({
            id: face.id,
            vertexIds: face.vertexIds.map(originalId => vertexIdMap.get(originalId))
        }));
        
        this.edges = editableMesh.edges.map(edge => ({
            id: edge.id,
            vertexIds: edge.vertexIds.map(originalId => vertexIdMap.get(originalId))
        }));
        
        // Update vertex connections
        this.vertices.forEach(vertex => {
            vertex.connectedFaces = this.faces.filter(face => 
                face.vertexIds.includes(vertex.id)
            ).map(face => face.id);
        });
        
        console.log('Topology setup complete:', {
            vertices: this.vertices.length,
            faces: this.faces.length,
            edges: this.edges.length
        });
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
        
        // Create individual face meshes with smart material settings
        this.faces.forEach(face => {
            const vertices = face.vertexIds.map(vertexId => {
                const vertex = this.vertices[vertexId];
                if (!vertex) return null;
                
                const v = vertex.position.clone();
                v.applyMatrix4(this.currentMesh.matrixWorld);
                return v;
            }).filter(v => v !== null);
            
            if (vertices.length >= 3) {
                // Create geometry for this specific face
                const faceGeometry = new THREE.BufferGeometry();
                const positions = [];
                
                // Add all vertices for this face
                vertices.forEach(v => {
                    positions.push(v.x, v.y, v.z);
                });
                
                // Create indices based on face type
                const indices = [];
                if (vertices.length === 3) {
                    // Triangle
                    indices.push(0, 1, 2);
                } else if (vertices.length === 4) {
                    // Quad - create as two triangles but with smart material
                    indices.push(0, 1, 2, 0, 2, 3);
                } else {
                    // N-gon - use fan triangulation
                    for (let i = 1; i < vertices.length - 1; i++) {
                        indices.push(0, i, i + 1);
                    }
                }
                
                faceGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                faceGeometry.setIndex(indices);
                faceGeometry.computeVertexNormals();
                
                // Smart material that makes triangulated faces look smooth
                const material = new THREE.MeshPhongMaterial({ 
                    color: 0x00ff00,
                    transparent: true,
                    opacity: 0.4,
                    side: THREE.DoubleSide,
                    flatShading: false,
                    shininess: 100,
                    specular: 0x222222
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
        this.clearSelectionHighlights();
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
            
            // Check if we're using EditableMesh or fallback topology
            const isEditableMesh = !!this.currentMesh?.userData?.editableMesh;
            const typeText = isEditableMesh ? 'EditableMesh' : 'Topology-based';
            
            statsElement.innerHTML = `
                Vertices: ${actualVertices}<br>
                Edges: ${actualEdges}<br>
                Faces: ${actualFaces}<br>
                Type: ${typeText}
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

    updateButtonStates(primitiveName = null, highlightMode = null, selectionMode = null) {
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

        // Update selection mode buttons
        if (selectionMode) {
            const faceBtn = document.getElementById('select-faces-btn');
            const edgeBtn = document.getElementById('select-edges-btn');
            if (faceBtn) faceBtn.classList.toggle('active', selectionMode === 'select-faces');
            if (edgeBtn) edgeBtn.classList.toggle('active', selectionMode === 'select-edges');
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
        
        // Create vertices from position attributes with proper deduplication
        const vertexMap = new Map(); // position string -> vertex ID
        const originalToDeduped = new Map(); // original index -> deduplicated vertex ID
        
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            
            // Create a unique key for this position to avoid duplicates
            const positionKey = `${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)}`;
            
            let vertexId;
            if (!vertexMap.has(positionKey)) {
                // Create new vertex
                vertexId = this.vertices.length;
                this.vertices.push({
                    id: vertexId,
                    position: new THREE.Vector3(x, y, z),
                    connectedFaces: []
                });
                vertexMap.set(positionKey, vertexId);
            } else {
                // Use existing vertex
                vertexId = vertexMap.get(positionKey);
            }
            
            // Map original index to deduplicated vertex ID
            originalToDeduped.set(i, vertexId);
        }
        
        // Create faces from indices using the proper vertex mapping
        if (indices) {
            for (let i = 0; i < indices.count; i += 3) {
                const originalV1 = indices.getX(i);
                const originalV2 = indices.getY(i);
                const originalV3 = indices.getZ(i);
                
                // Map to deduplicated vertex IDs
                const vertexId1 = originalToDeduped.get(originalV1);
                const vertexId2 = originalToDeduped.get(originalV2);
                const vertexId3 = originalToDeduped.get(originalV3);
                
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
        } else {
            // Handle non-indexed geometry (create faces from position array)
            for (let i = 0; i < positions.count; i += 3) {
                const vertexId1 = originalToDeduped.get(i);
                const vertexId2 = originalToDeduped.get(i + 1);
                const vertexId3 = originalToDeduped.get(i + 2);
                
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
            
            // Update the actual EditableMesh if available
            if (this.currentMesh?.userData?.editableMesh) {
                // Use the original vertex ID from EditableMesh
                const originalVertexId = this.vertices[vertexId].originalId;
                this.currentMesh.userData.editableMesh.moveVertex(originalVertexId, newPosition);
                // Update the Three.js geometry
                this.currentMesh.geometry.dispose();
                this.currentMesh.geometry = this.currentMesh.userData.editableMesh.toBufferGeometry();
            } else {
                // Fallback to topology conversion
                this.updateGeometryFromTopology();
            }
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
        if (this.faceSelectionMode || this.edgeSelectionMode) {
            this.handleSelectionMouseDown(event);
            return;
        }

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
        console.log('Updating geometry vertex:', { vertexId, newPosition });
        
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

    // Face editing methods
    setSelectionMode(mode) {
        this.faceSelectionMode = mode === 'select-faces';
        this.edgeSelectionMode = mode === 'select-edges';
        
        // Clear current selections
        this.selectedFaces = [];
        this.selectedEdges = [];
        
        // Clear highlights when switching selection modes
        this.clearHighlights();

        // Update UI
        this.updateButtonStates(null, null, mode);
        this.updateSelectionUI();
        
        // Show all edges when in edge selection mode
        if (this.edgeSelectionMode) {
            this.showAllEdges();
        }
        
        console.log(`Selection mode: ${mode}`);
    }

    showAllEdges() {
        // Create thin gray lines for all edges to show what can be selected
        this.edges.forEach(edge => {
            const vertex1 = this.vertices[edge.vertexIds[0]];
            const vertex2 = this.vertices[edge.vertexIds[1]];
            
            if (vertex1 && vertex2) {
                const v1 = vertex1.position.clone();
                const v2 = vertex2.position.clone();
                v1.applyMatrix4(this.currentMesh.matrixWorld);
                v2.applyMatrix4(this.currentMesh.matrixWorld);
                
                const lineGeometry = new THREE.BufferGeometry();
                lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
                    v1.x, v1.y, v1.z,
                    v2.x, v2.y, v2.z
                ], 3));
                
                const lineMaterial = new THREE.LineBasicMaterial({ 
                    color: 0x666666,
                    linewidth: 2,
                    transparent: true,
                    opacity: 0.5
                });
                
                const line = new THREE.Line(lineGeometry, lineMaterial);
                this.scene.add(line);
                this.highlightObjects.push(line);
            }
        });
    }

    executeFaceTool(tool) {
        if (!this.currentMesh?.userData?.editableMesh) {
            console.warn('No EditableMesh available for editing');
            return;
        }

        const editableMesh = this.currentMesh.userData.editableMesh;

        try {
            switch (tool) {
                case 'extrude':
                    if (this.selectedFaces.length > 0) {
                        console.log('Extruding faces:', this.selectedFaces);
                        const newFaceIds = extrudeFaces(editableMesh, this.selectedFaces, 0.3);
                        console.log('Extrusion created new faces:', newFaceIds);
                        
                        // Update the Three.js geometry
                        this.currentMesh.geometry.dispose();
                        this.currentMesh.geometry = editableMesh.toBufferGeometry();
                        
                        // Refresh topology
                        this.setupEditableMeshTopology(editableMesh);
                        
                        // Clear selection
                        this.selectedFaces = [];
                        this.clearSelectionHighlights();
                        
                        // Refresh highlights if they're currently shown
                        if (this.highlightMode !== 'none') {
                            this.setHighlightMode(this.highlightMode);
                        }
                    } else {
                        console.warn('No faces selected for extrusion');
                    }
                    break;

                case 'subdivide':
                    if (this.selectedEdges.length > 0) {
                        console.log('Subdividing edges:', this.selectedEdges);
                        for (const edgeId of this.selectedEdges) {
                            try {
                                const newVertexId = subdivideEdge(editableMesh, edgeId);
                                console.log('Subdivision created new vertex:', newVertexId);
                            } catch (error) {
                                console.warn(`Failed to subdivide edge ${edgeId}:`, error);
                            }
                        }
                        
                        // Update the Three.js geometry
                        this.currentMesh.geometry.dispose();
                        this.currentMesh.geometry = editableMesh.toBufferGeometry();
                        
                        // Refresh topology
                        this.setupEditableMeshTopology(editableMesh);
                        
                        // Clear selection
                        this.selectedEdges = [];
                        this.clearSelectionHighlights();
                        
                        // Refresh highlights if they're currently shown
                        if (this.highlightMode !== 'none') {
                            this.setHighlightMode(this.highlightMode);
                        }
                    } else {
                        console.warn('No edges selected for subdivision');
                    }
                    break;

                case 'merge':
                    console.log('Merging vertices...');
                    const result = mergeVertices(editableMesh, 0.1);
                    console.log('Merge result:', result);
                    
                    // Update the Three.js geometry
                    this.currentMesh.geometry.dispose();
                    this.currentMesh.geometry = editableMesh.toBufferGeometry();
                    
                    // Refresh topology
                    this.setupEditableMeshTopology(editableMesh);
                    
                    // Refresh highlights if they're currently shown
                    if (this.highlightMode !== 'none') {
                        this.setHighlightMode(this.highlightMode);
                    }
                    break;

                default:
                    console.warn(`Unknown tool: ${tool}`);
            }
        } catch (error) {
            console.error(`Error executing ${tool}:`, error);
        }
    }

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
                const faceId = this.findFaceFromTriangle(faceIndex, intersection.face.normal, intersection.point);
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
            isFrontFace
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
        
        this.faces.forEach(face => {
            // Calculate face center and check if point is within face bounds
            const faceVertices = face.vertexIds.map(id => this.vertices[id]);
            if (faceVertices.some(v => !v)) return; // Skip if any vertex is missing
            
            // Transform vertices to world space
            const worldVertices = faceVertices.map(vertex => {
                const worldPos = vertex.position.clone();
                worldPos.applyMatrix4(this.currentMesh.matrixWorld);
                return worldPos;
            });
            
            // Calculate face center
            const center = new THREE.Vector3();
            worldVertices.forEach(vertex => {
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
                const faceNormal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
                
                // Check if point is on the front side of the face
                const toPoint = new THREE.Vector3().subVectors(point, v0);
                const dotProduct = faceNormal.dot(toPoint);
                
                if (dotProduct > 0 && distance < closestDistance) {
                    closestDistance = distance;
                    closestFaceId = face.id;
                    console.log(`Found closer face ${face.id} at distance ${distance.toFixed(3)}, dot: ${dotProduct.toFixed(3)}`);
                }
            }
        });
        
        console.log('Closest face:', closestFaceId, 'at distance:', closestDistance.toFixed(3));
        return closestFaceId;
    }

    findClosestEdge(point) {
        let closestEdgeId = null;
        let closestDistance = Infinity;
        
        console.log('Looking for edge near point:', point);
        
        this.edges.forEach(edge => {
            const vertex1 = this.vertices[edge.vertexIds[0]];
            const vertex2 = this.vertices[edge.vertexIds[1]];
            
            if (vertex1 && vertex2) {
                const v1 = vertex1.position.clone();
                const v2 = vertex2.position.clone();
                v1.applyMatrix4(this.currentMesh.matrixWorld);
                v2.applyMatrix4(this.currentMesh.matrixWorld);
                
                // Calculate distance from point to line segment
                const distance = this.distanceToLineSegment(point, v1, v2);
                
                if (distance < closestDistance && distance < 0.2) { // Within 0.2 units
                    closestDistance = distance;
                    closestEdgeId = edge.id;
                    console.log(`Found closer edge ${edge.id} at distance ${distance.toFixed(3)}`);
                }
            }
        });
        
        console.log('Closest edge:', closestEdgeId, 'at distance:', closestDistance.toFixed(3));
        return closestEdgeId;
    }

    distanceToLineSegment(point, lineStart, lineEnd) {
        const lineVec = new THREE.Vector3().subVectors(lineEnd, lineStart);
        const pointVec = new THREE.Vector3().subVectors(point, lineStart);
        
        const lineLength = lineVec.length();
        if (lineLength === 0) return pointVec.length();
        
        const t = Math.max(0, Math.min(1, pointVec.dot(lineVec) / (lineLength * lineLength)));
        const projection = new THREE.Vector3().addVectors(lineStart, lineVec.multiplyScalar(t));
        
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
        this.selectedFaces.forEach(faceId => {
            const face = this.faces.find(f => f.id === faceId);
            if (!face) return;
            
            const vertices = face.vertexIds.map(vertexId => {
                const vertex = this.vertices[vertexId];
                if (!vertex) return null;
                
                const v = vertex.position.clone();
                v.applyMatrix4(this.currentMesh.matrixWorld);
                return v;
            }).filter(v => v !== null);
            
            if (vertices.length >= 3) {
                // Create a highlight mesh for this face
                const faceGeometry = new THREE.BufferGeometry();
                const positions = [];
                
                vertices.forEach(v => {
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
                
                faceGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                faceGeometry.setIndex(indices);
                faceGeometry.computeVertexNormals();
                
                // Bright orange material for selected faces
                const material = new THREE.MeshBasicMaterial({ 
                    color: 0xff6600,
                    transparent: true,
                    opacity: 0.6,
                    side: THREE.DoubleSide
                });
                
                const faceMesh = new THREE.Mesh(faceGeometry, material);
                this.scene.add(faceMesh);
                this.selectionHighlights.push(faceMesh);
            }
        });
    }

    createEdgeSelectionHighlights() {
        this.selectedEdges.forEach(edgeId => {
            const edge = this.edges.find(e => e.id === edgeId);
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
                lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
                
                // Bright cyan material for selected edges
                const lineMaterial = new THREE.LineBasicMaterial({ 
                    color: 0x00ffff,
                    linewidth: 8,
                    transparent: true,
                    opacity: 1.0
                });
                
                const line = new THREE.Line(lineGeometry, lineMaterial);
                this.scene.add(line);
                this.selectionHighlights.push(line);
                
                // Add small spheres at the endpoints for better visibility
                const sphereGeometry = new THREE.SphereGeometry(0.05, 8, 6);
                const sphereMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x00ffff,
                    transparent: true,
                    opacity: 0.8
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
        this.selectionHighlights.forEach(obj => {
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
