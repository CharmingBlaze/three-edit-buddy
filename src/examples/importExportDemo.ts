import { createCube, createSphere, createCylinder } from '../primitives/index.js';
import {
  exportMesh,
  importMesh,
  getSupportedExportFormats,
  getSupportedImportFormats,
  getFormatInfo,
  validateImportData,
  downloadExport,
  type ExportOptions,
} from '../convert/importExport.js';

/**
 * Comprehensive example demonstrating import/export functionality
 */
export function importExportDemo() {
  console.log('=== Three.js Edit Buddy Import/Export Demo ===\n');

  // Create some test meshes
  const cube = createCube({ size: 2 });
  const sphere = createSphere({ radius: 1, segments: 16 });
  const cylinder = createCylinder({ radius: 0.5, height: 2, segments: 12 });

  // Add some UVs and materials to the cube for testing
  cube.addUV(0, { x: 0, y: 0 });
  cube.addUV(1, { x: 1, y: 0 });
  cube.addUV(2, { x: 1, y: 1 });
  cube.addUV(3, { x: 0, y: 1 });
  
  cube.addMaterial('red', { x: 1, y: 0, z: 0 });
  cube.addMaterial('blue', { x: 0, y: 0, z: 1 });

  // Demonstrate supported formats
  console.log('Supported Export Formats:');
  const exportFormats = getSupportedExportFormats();
  exportFormats.forEach(format => {
    const info = getFormatInfo(format);
    console.log(`  - ${format}: ${info.name} (${info.extension})`);
  });

  console.log('\nSupported Import Formats:');
  const importFormats = getSupportedImportFormats();
  importFormats.forEach(format => {
    const info = getFormatInfo(format);
    console.log(`  - ${format}: ${info.name} (${info.extension})`);
  });

  // Export cube to different formats
  console.log('\n=== Export Examples ===');

  // OBJ Export
  const objResult = exportMesh(cube, { format: 'obj' });
  console.log(`OBJ Export: ${objResult.extension} (${objResult.mimeType})`);
  console.log(`Data length: ${(objResult.data as string).length} characters`);

  // OBJ with UVs
  const objUvResult = exportMesh(cube, { format: 'obj-uv' });
  console.log(`OBJ with UVs: ${objUvResult.extension} (${objUvResult.mimeType})`);
  console.log(`Data length: ${(objUvResult.data as string).length} characters`);

  // OBJ with Materials
  const objMtlResult = exportMesh(cube, { format: 'obj-mtl' });
  console.log(`OBJ with Materials: ${objMtlResult.extension} (${objMtlResult.mimeType})`);
  console.log(`Data length: ${(objMtlResult.data as string).length} characters`);

  // GLTF Export
  const gltfResult = exportMesh(cube, { format: 'gltf' });
  console.log(`GLTF Export: ${gltfResult.extension} (${gltfResult.mimeType})`);
  console.log(`Data length: ${(gltfResult.data as string).length} characters`);

  // GLTF Binary Export
  const glbResult = exportMesh(cube, { format: 'gltf-binary' });
  console.log(`GLTF Binary Export: ${glbResult.extension} (${glbResult.mimeType})`);
  console.log(`Data length: ${(glbResult.data as ArrayBuffer).byteLength} bytes`);

  // GLTF with custom options
  const gltfCustomResult = exportMesh(cube, {
    format: 'gltf',
    gltf: {
      includeUVs: true,
      includeNormals: true,
      includeMaterials: true,
      triangulate: false,
      materials: [
        {
          name: 'custom-red',
          color: { x: 1, y: 0, z: 0 },
          opacity: 0.8,
          transparent: true,
          metalness: 0.2,
          roughness: 0.8,
        },
      ],
    },
  });
  console.log(`GLTF Custom: ${gltfCustomResult.extension} (${gltfCustomResult.mimeType})`);
  console.log(`Data length: ${(gltfCustomResult.data as string).length} characters`);

  // Demonstrate data validation
  console.log('\n=== Data Validation ===');
  
  const isValidGLTF = validateImportData(gltfResult.data, 'gltf');
  console.log(`GLTF data validation: ${isValidGLTF ? 'PASS' : 'FAIL'}`);
  
  const isValidGLB = validateImportData(glbResult.data, 'gltf-binary');
  console.log(`GLB data validation: ${isValidGLB ? 'PASS' : 'FAIL'}`);
  
  const invalidData = 'invalid data';
  const isValidInvalid = validateImportData(invalidData, 'gltf');
  console.log(`Invalid data validation: ${isValidInvalid ? 'PASS' : 'FAIL'} (should be FAIL)`);

  // Demonstrate import (with a simple GLTF)
  console.log('\n=== Import Example ===');
  
  const simpleGLTF = JSON.stringify({
    asset: { version: '2.0', generator: 'test' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{
      primitives: [{
        attributes: { POSITION: 0 },
      }],
    }],
    accessors: [{
      bufferView: 0,
      componentType: 5126,
      count: 8,
      type: 'VEC3',
      max: [1, 1, 1],
      min: [-1, -1, -1],
    }],
    bufferViews: [{
      buffer: 0,
      byteOffset: 0,
      byteLength: 96,
      target: 34962,
    }],
    buffers: [{
      byteLength: 96,
      uri: 'data:application/octet-stream;base64,AAABAAIAAwAEAAUABgAHAAgACQAKAAsADAANAA4ADwAQABEAEgATABQAFQAWABcAGAAZABoAGwAcAB0AHgAfACAAIQAiACMAJAAlACYAJwAoACkAKgArACwALQAuAC8AMAAxADIAMwA0ADUANgA3ADgAOQA6ADsAPAA9AD4APwBAAEEAQgBDAEQARQBGAEcASABJAEoASwBMAE0ATgBPAFAAUQBSAFMAVABVAFYAVwBYAFkAWgBbAFwAXQBeAF8AYABhAGIAYwBkAGUAZgBnAGgAaQBqAGsAbABtAG4AbwBwAHEAcgBzAHQAdQB2AHcAeAB5AHoAewB8AH0AfgB/AIAAgQCCAIMA',
    }],
  });

  try {
    const importResult = importMesh(simpleGLTF, { format: 'gltf' });
    console.log(`Import successful: ${importResult.mesh.vertices.length} vertices, ${importResult.mesh.faces.length} faces`);
    console.log(`Imported materials: ${importResult.materials.length}`);
  } catch (error) {
    console.log(`Import failed: ${error}`);
  }

  // Demonstrate error handling
  console.log('\n=== Error Handling ===');
  
  try {
    exportMesh(cube, { format: 'unsupported' as any });
  } catch (error) {
    console.log(`Expected error caught: ${error}`);
  }

  try {
    importMesh('invalid data', { format: 'gltf' });
  } catch (error) {
    console.log(`Expected import error caught: ${error}`);
  }

  // Mesh statistics
  console.log('\n=== Mesh Statistics ===');
  console.log(`Cube: ${cube.vertices.length} vertices, ${cube.edges.length} edges, ${cube.faces.length} faces`);
  console.log(`Sphere: ${sphere.vertices.length} vertices, ${sphere.edges.length} edges, ${sphere.faces.length} faces`);
  console.log(`Cylinder: ${cylinder.vertices.length} vertices, ${cylinder.edges.length} edges, ${cylinder.faces.length} faces`);

  console.log('\n=== Demo Complete ===');
  
  return {
    cube,
    sphere,
    cylinder,
    exportResults: {
      obj: objResult,
      objUv: objUvResult,
      objMtl: objMtlResult,
      gltf: gltfResult,
      glb: glbResult,
      gltfCustom: gltfCustomResult,
    },
  };
}

/**
 * Example of how to use the download functionality
 * Note: This requires a browser environment
 */
export function downloadExample(mesh: any) {
  // Export to GLTF
  const result = exportMesh(mesh, { format: 'gltf' });
  
  // Download the file
  // downloadExport(result, 'my-mesh.gltf');
  
  console.log('Download functionality available in browser environment');
  console.log(`File would be saved as: my-mesh${result.extension}`);
}

/**
 * Example of batch export
 */
export function batchExportExample() {
  const meshes = [
    { name: 'cube', mesh: createCube({ size: 1 }) },
    { name: 'sphere', mesh: createSphere({ radius: 0.5 }) },
    { name: 'cylinder', mesh: createCylinder({ radius: 0.3, height: 1 }) },
  ];

  const formats: ExportOptions['format'][] = ['obj', 'gltf', 'gltf-binary'];

  console.log('=== Batch Export Example ===');
  
  meshes.forEach(({ name, mesh }) => {
    console.log(`\nExporting ${name}:`);
    
    formats.forEach(format => {
      try {
        const result = exportMesh(mesh, { format });
        const info = getFormatInfo(format);
        console.log(`  ${info.name}: ${(result.data as string | ArrayBuffer).length} bytes`);
      } catch (error) {
        console.log(`  ${format}: ERROR - ${error}`);
      }
    });
  });
}