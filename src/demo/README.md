# Three Edit Buddy - Primitive Demo 2025

A modern, interactive 3D demo showcasing all the primitive geometries from the Three Edit Buddy library with real-time highlighting capabilities.

## 🚀 Features

### **Interactive Primitives**
- **Cube**: 14 vertices, 19 edges, 6 faces (Quad-based)
- **Sphere**: 42 vertices, 80 edges, 40 faces (Mixed quads + triangles)
- **Cylinder**: 18 vertices, 40 edges, 24 faces (Mixed quads + triangles)
- **Cone**: 10 vertices, 24 edges, 16 faces (Triangular)
- **Pyramid**: 6 vertices, 12 edges, 8 faces (Triangular)
- **Plane**: 4 vertices, 4 edges, 1 face (Quad-based)

### **Highlight Modes**
- **Vertices**: Yellow spheres highlight all mesh vertices
- **Edges**: Red cylinders highlight all mesh edges
- **Faces**: Green transparent overlays highlight all mesh faces
- **None**: Clean view without highlights

### **Modern UI**
- Glassmorphism design with backdrop blur effects
- Responsive layout that works on all screen sizes
- Real-time statistics display for each primitive
- Smooth animations and transitions

## 🎮 Controls

### **Mouse Controls**
- **Left Click + Drag**: Rotate camera around the primitive
- **Scroll**: Zoom in/out
- **Right Click + Drag**: Pan camera

### **Keyboard Controls**
- **Spacebar**: Cycle through highlight modes (None → Vertices → Edges → Faces)

### **UI Controls**
- **Primitive Buttons**: Switch between different 3D primitives
- **Highlight Mode Buttons**: Directly select highlight mode
- **Real-time Stats**: View vertex, edge, and face counts for each primitive

## 🛠️ Technical Details

### **Built With**
- **Three.js**: 3D graphics rendering
- **Vite**: Fast development server and build tool
- **TypeScript**: Type-safe JavaScript
- **Modern CSS**: Glassmorphism effects and responsive design

### **Architecture**
- **Modular Design**: Each primitive is created using the Three Edit Buddy library
- **Real-time Conversion**: EditableMesh objects are converted to Three.js geometries
- **Efficient Highlighting**: Dynamic creation and disposal of highlight objects
- **Memory Management**: Proper cleanup of geometries and materials

### **Performance Features**
- **Vertex Deduplication**: Automatic handling of shared vertices
- **Efficient Rendering**: Optimized geometry creation and material usage
- **Responsive Design**: Adapts to different screen sizes and pixel densities
- **Smooth Interactions**: 60fps animations with proper frame timing

## 🚀 Getting Started

### **Prerequisites**
- Node.js 16+ 
- npm or yarn

### **Installation**
```bash
# Install dependencies
npm install

# Start the demo server
npm run demo
```

The demo will automatically open in your default browser at `http://localhost:3000`.

### **Build for Production**
```bash
# Build the demo
npm run demo:build
```

The built files will be available in `dist/demo/`.

## 🎨 Customization

### **Adding New Primitives**
1. Create your primitive function in the primitives directory
2. Add it to the `primitiveCreators` object in `demo.js`
3. Add corresponding stats to the `primitiveStats` object
4. Add a button to the HTML

### **Modifying Highlight Colors**
Edit the highlight colors in the demo.js file:
- **Vertices**: `0xffff00` (Yellow)
- **Edges**: `0xff0000` (Red)  
- **Faces**: `0x00ff00` (Green)

### **Changing Materials**
Modify the material properties in the `primitiveCreators` object to change colors, opacity, and other material properties.

## 🔧 Development

### **File Structure**
```
src/demo/
├── index.html          # Main HTML file
├── demo.js             # Main demo logic
├── vite.config.js      # Vite configuration
└── README.md           # This file
```

### **Key Components**
- **PrimitiveDemo Class**: Main demo controller
- **convertToThreeMesh()**: Converts EditableMesh to Three.js geometry
- **highlightVertices/Edges/Faces()**: Highlight rendering functions
- **setupLighting()**: Three-point lighting setup

## 🎯 Use Cases

### **Educational**
- Learn about 3D mesh topology
- Understand vertex, edge, and face relationships
- Visualize different primitive types

### **Development**
- Test primitive creation functions
- Debug mesh topology issues
- Validate geometry conversion

### **Presentation**
- Showcase library capabilities
- Demonstrate interactive features
- Present technical concepts visually

## 🐛 Troubleshooting

### **Common Issues**
- **Demo won't load**: Check if all dependencies are installed
- **Primitives not showing**: Verify Three.js is properly imported
- **Highlights not working**: Check browser console for errors
- **Performance issues**: Reduce primitive complexity or disable shadows

### **Browser Compatibility**
- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (with webkit prefixes)
- **Mobile**: Responsive design works on mobile browsers

## 📝 License

This demo is part of the Three Edit Buddy project and follows the same MIT license. 