# Three Edit Buddy - Interactive 3D Demo

A modern, interactive 3D primitive demo showcasing real-time topology editing with Blender-like vertex manipulation.

## 🎮 Features

### **Interactive Primitives**

- **6 Primitive Types**: Cube, Sphere, Cylinder, Cone, Pyramid, Plane
- **Real-time Switching**: Click buttons to instantly switch between primitives
- **Live Statistics**: See actual vertex, edge, and face counts for each primitive
- **Topology-based**: All primitives use proper mesh topology with shared vertices

### **Visual Highlighting**

- **Vertex Mode**: Yellow cubes mark all unique vertices
- **Edge Mode**: Red lines connect vertices along mesh edges
- **Face Mode**: Green overlays show individual faces
- **Real-time Updates**: Highlights update immediately when vertices are moved

### **Topology Editing**

- **Drag & Drop**: Click and drag yellow vertex cubes to deform meshes
- **Blender-like Behavior**: Moving a vertex updates all connected faces and edges
- **Mesh Connectivity**: Proper topology is maintained throughout all operations
- **Live Geometry Updates**: Three.js geometry updates in real-time

### **Modern UI**

- **Glassmorphism Design**: Beautiful frosted glass effect with backdrop blur
- **Responsive Controls**: Works on desktop and mobile devices
- **Keyboard Shortcuts**: Spacebar to cycle through highlight modes
- **Camera Controls**: Mouse to rotate, scroll to zoom

## 🚀 Getting Started

### **Quick Start**

```bash
# Install dependencies
npm install

# Start the demo
npm run demo
```

The demo will open automatically in your browser at `http://localhost:3000` (or next available port).

### **Controls**

#### **Primitive Selection**

- Click any primitive button (Cube, Sphere, Cylinder, etc.) to switch
- Each primitive shows its actual topology statistics

#### **Highlight Modes**

- **None**: Normal view without highlights
- **Vertices**: Yellow cubes show all vertices
- **Edges**: Red lines show all edges
- **Faces**: Green overlays show all faces

#### **Vertex Editing**

1. Click the **"Vertices"** button to enter vertex mode
2. **Click and drag** any yellow cube to move that vertex
3. Watch as the entire mesh deforms while maintaining connectivity
4. All connected faces and edges automatically follow the vertex movement

#### **Camera Controls**

- **Left Click + Drag**: Rotate camera around the mesh
- **Scroll Wheel**: Zoom in/out
- **Spacebar**: Cycle through highlight modes

## 🏗️ Technical Architecture

### **Topology System**

The demo uses a custom topology system that maintains proper mesh connectivity:

```javascript
// Simple topology structure
this.vertices = []; // { id, position, connectedFaces }
this.faces = []; // { id, vertexIds }
this.edges = []; // { id, vertexIds }
```

### **Key Components**

#### **Geometry Conversion**

```javascript
convertGeometryToTopology(geometry) {
  // Converts Three.js BufferGeometry to topology system
  // Handles vertex deduplication and face/edge creation
}
```

#### **Vertex Movement**

```javascript
moveVertex(vertexId, newPosition) {
  // Updates vertex position
  // Automatically updates all connected faces/edges
  // Rebuilds Three.js geometry
}
```

#### **Real-time Updates**

```javascript
updateGeometryFromTopology() {
  // Rebuilds Three.js BufferGeometry from topology
  // Updates vertex normals
  // Maintains proper indexing
}
```

### **Three.js Integration**

- **Direct Geometry Creation**: Uses Three.js built-in geometries for primitives
- **Topology Conversion**: Converts to editable topology system
- **Real-time Rendering**: Updates geometry immediately during editing
- **Proper Cleanup**: Disposes of old geometries to prevent memory leaks

## 🎨 UI Design

### **Glassmorphism Style**

- **Backdrop Blur**: Modern frosted glass effect
- **Semi-transparent Backgrounds**: Subtle transparency with blur
- **Gradient Borders**: Beautiful color gradients
- **Smooth Animations**: Hover effects and transitions

### **Color Scheme**

- **Primary**: Purple gradient (#667eea to #764ba2)
- **Vertices**: Yellow (#ffff00)
- **Edges**: Red (#ff0000)
- **Faces**: Green (#00ff00)
- **Background**: Dark gradient (#0f0f23 to #16213e)

### **Typography**

- **Font**: Inter (with system fallbacks)
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Sizes**: 11px to 24px for different UI elements

## 🔧 Development

### **File Structure**

```
src/demo/
├── demo.js          # Main demo logic
├── index.html       # HTML structure and styles
├── vite.config.js   # Vite configuration
└── README.md        # This documentation
```

### **Key Classes**

#### **PrimitiveDemo**

Main demo class that handles:

- Three.js scene setup and rendering
- Primitive creation and switching
- Topology system management
- Vertex editing and interaction
- UI updates and event handling

#### **Topology System**

Custom topology management:

- Vertex deduplication and indexing
- Face and edge creation
- Real-time geometry updates
- Proper mesh connectivity maintenance

### **Building**

```bash
# Development
npm run demo

# Production build
npm run demo:build
```

## 🎯 Use Cases

### **Educational**

- **3D Modeling Concepts**: Learn about vertices, edges, and faces
- **Topology Understanding**: See how mesh connectivity works
- **Real-time Editing**: Experience immediate visual feedback

### **Development**

- **Three.js Testing**: Test geometry creation and manipulation
- **Topology Validation**: Verify mesh integrity and connectivity
- **Performance Testing**: Measure real-time geometry updates

### **Demonstration**

- **Library Showcase**: Demonstrate the library's capabilities
- **Feature Testing**: Test new editing tools and primitives
- **User Experience**: Validate UI/UX design decisions

## 🐛 Troubleshooting

### **Common Issues**

#### **Demo Won't Start**

```bash
# Check if port is in use
npm run demo
# Vite will automatically find next available port
```

#### **Vertex Editing Not Working**

1. Make sure you're in **"Vertices"** mode
2. Click directly on the yellow cubes
3. Drag slowly for better control
4. Check browser console for errors

#### **Performance Issues**

- Reduce primitive complexity (fewer segments)
- Close other browser tabs
- Check for memory leaks in browser dev tools

### **Browser Compatibility**

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (with webkit prefixes)
- **Mobile**: Touch controls supported

## 📈 Performance

### **Optimizations**

- **Geometry Disposal**: Proper cleanup of old geometries
- **Efficient Topology**: Minimal vertex duplication
- **Real-time Updates**: Optimized geometry rebuilding
- **Memory Management**: Automatic cleanup of highlight objects

### **Benchmarks**

- **Cube**: 8 vertices, 12 edges, 6 faces
- **Sphere**: ~42 vertices, ~80 edges, ~40 faces
- **Cylinder**: ~18 vertices, ~40 edges, ~24 faces
- **Cone**: ~10 vertices, ~24 edges, ~16 faces
- **Pyramid**: 5 vertices, 8 edges, 5 faces
- **Plane**: 4 vertices, 4 edges, 1 face

## 🔮 Future Enhancements

### **Planned Features**

- **Edge Editing**: Drag edges to modify mesh topology
- **Face Editing**: Select and manipulate entire faces
- **Multiple Selection**: Select multiple vertices/edges/faces
- **Undo/Redo**: History system for editing operations
- **Export Options**: Save edited meshes to various formats

### **Advanced Tools**

- **Subdivision**: Real-time mesh subdivision
- **Smoothing**: Mesh smoothing algorithms
- **Symmetry**: Mirror editing operations
- **Constraints**: Limit vertex movement to planes/axes

### **UI Improvements**

- **Custom Controls**: Sliders for precise editing
- **Mini-map**: Overview of mesh structure
- **Statistics Panel**: Detailed mesh information
- **Theme Support**: Light/dark mode toggle

## 📝 License

MIT License - see main project LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the demo thoroughly
5. Submit a pull request

---

**Enjoy exploring 3D topology editing!** 🎉
