import type { EditableMesh, Vector3Like } from '../types/index.js';
import { exportOBJ, exportOBJWithUVs, exportOBJWithMaterials } from './exportOBJ.js';
import { exportGLTF, exportGLTFBinary, GLTFExportOptions } from './exportGLTF.js';
import { importGLTF, GLTFImportOptions, GLTFImportResult } from './importGLTF.js';

/**
 * Supported export formats
 */
export type ExportFormat = 'obj' | 'obj-uv' | 'obj-mtl' | 'gltf' | 'gltf-binary';

/**
 * Supported import formats
 */
export type ImportFormat = 'gltf' | 'gltf-binary';

/**
 * Unified export options
 */
export interface ExportOptions {
  /** Export format */
  format: ExportFormat;
  /** GLTF-specific options */
  gltf?: GLTFExportOptions;
  /** Whether to include UVs (for OBJ formats) */
  includeUVs?: boolean;
  /** Whether to include materials (for OBJ formats) */
  includeMaterials?: boolean;
}

/**
 * Unified import options
 */
export interface ImportOptions {
  /** Import format */
  format: ImportFormat;
  /** GLTF-specific options */
  gltf?: GLTFImportOptions;
}

/**
 * Export result
 */
export interface ExportResult {
  /** Export data as string or ArrayBuffer */
  data: string | ArrayBuffer;
  /** MIME type for the exported data */
  mimeType: string;
  /** Suggested file extension */
  extension: string;
}

/**
 * Import result
 */
export interface ImportResult {
  /** Imported mesh */
  mesh: EditableMesh;
  /** Imported materials */
  materials: Array<{
    name: string;
    color?: Vector3Like;
    opacity?: number;
    transparent?: boolean;
    metalness?: number;
    roughness?: number;
  }>;
}

/**
 * Exports an EditableMesh to various formats
 */
export function exportMesh(
  mesh: EditableMesh,
  options: ExportOptions
): ExportResult {
  const { format, gltf, includeUVs = true, includeMaterials = true } = options;

  switch (format) {
    case 'obj':
      return {
        data: exportOBJ(mesh),
        mimeType: 'text/plain',
        extension: '.obj',
      };

    case 'obj-uv':
      return {
        data: exportOBJWithUVs(mesh),
        mimeType: 'text/plain',
        extension: '.obj',
      };

    case 'obj-mtl':
      const result = exportOBJWithMaterials(mesh);
      return {
        data: result.obj,
        mimeType: 'text/plain',
        extension: '.obj',
      };

    case 'gltf':
      return {
        data: exportGLTF(mesh, gltf || {}),
        mimeType: 'model/gltf+json',
        extension: '.gltf',
      };

    case 'gltf-binary':
      return {
        data: exportGLTFBinary(mesh, gltf || {}),
        mimeType: 'model/gltf-binary',
        extension: '.glb',
      };

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Imports mesh data from various formats
 */
export function importMesh(
  data: string | ArrayBuffer,
  options: ImportOptions
): ImportResult {
  const { format, gltf } = options;

  switch (format) {
    case 'gltf':
    case 'gltf-binary':
      return importGLTF(data, gltf || {});

    default:
      throw new Error(`Unsupported import format: ${format}`);
  }
}

/**
 * Gets supported export formats
 */
export function getSupportedExportFormats(): ExportFormat[] {
  return ['obj', 'obj-uv', 'obj-mtl', 'gltf', 'gltf-binary'];
}

/**
 * Gets supported import formats
 */
export function getSupportedImportFormats(): ImportFormat[] {
  return ['gltf', 'gltf-binary'];
}

/**
 * Gets format information
 */
export function getFormatInfo(format: ExportFormat | ImportFormat): {
  name: string;
  description: string;
  mimeType: string;
  extension: string;
} {
  const formatInfo: Record<string, any> = {
    'obj': {
      name: 'Wavefront OBJ',
      description: 'Simple text-based 3D format',
      mimeType: 'text/plain',
      extension: '.obj',
    },
    'obj-uv': {
      name: 'Wavefront OBJ with UVs',
      description: 'OBJ format with texture coordinates',
      mimeType: 'text/plain',
      extension: '.obj',
    },
    'obj-mtl': {
      name: 'Wavefront OBJ with Materials',
      description: 'OBJ format with material definitions',
      mimeType: 'text/plain',
      extension: '.obj',
    },
    'gltf': {
      name: 'GLTF JSON',
      description: 'Modern 3D format with JSON structure',
      mimeType: 'model/gltf+json',
      extension: '.gltf',
    },
    'gltf-binary': {
      name: 'GLTF Binary',
      description: 'GLTF format with embedded binary data',
      mimeType: 'model/gltf-binary',
      extension: '.glb',
    },
  };

  return formatInfo[format] || {
    name: 'Unknown',
    description: 'Unknown format',
    mimeType: 'application/octet-stream',
    extension: '.bin',
  };
}

/**
 * Validates if data can be imported as the specified format
 */
export function validateImportData(
  data: string | ArrayBuffer,
  format: ImportFormat
): boolean {
  try {
    switch (format) {
      case 'gltf':
        if (typeof data === 'string') {
          const gltf = JSON.parse(data);
          return gltf.asset && gltf.asset.version === '2.0';
        }
        return false;

      case 'gltf-binary':
        if (data instanceof ArrayBuffer) {
          const view = new DataView(data);
          const magic = view.getUint32(0, false);
          return magic === 0x46546C67; // "glTF"
        }
        return false;

      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Downloads exported data as a file
 */
export function downloadExport(
  result: ExportResult,
  filename?: string
): void {
  const extension = result.extension;
  const defaultName = `mesh${extension}`;
  const finalName = filename || defaultName;

  if (typeof result.data === 'string') {
    // String data (JSON, OBJ, etc.)
    const blob = new Blob([result.data], { type: result.mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Binary data (GLB, etc.)
    const blob = new Blob([result.data], { type: result.mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}