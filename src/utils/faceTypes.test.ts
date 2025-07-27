import { describe, it, expect } from 'vitest';
import {
  getFaceType,
  isTriangle,
  isQuad,
  isNGon,
  getFaceVertexCount,
  isValidFace,
  getFaceTypeDescription
} from './faceTypes.js';
import type { Face } from '../types/index.js';

describe('Face Type Utilities', () => {
  const createFace = (vertexCount: number): Face => ({
    id: 1,
    vertexIds: Array.from({ length: vertexCount }, (_, i) => i),
    edgeIds: [],
    materialId: undefined,
    uvIds: []
  });

  describe('getFaceType', () => {
    it('should identify triangles', () => {
      const face = createFace(3);
      expect(getFaceType(face)).toBe('triangle');
    });

    it('should identify quads', () => {
      const face = createFace(4);
      expect(getFaceType(face)).toBe('quad');
    });

    it('should identify n-gons', () => {
      const face = createFace(5);
      expect(getFaceType(face)).toBe('ngon');
    });
  });

  describe('isTriangle', () => {
    it('should return true for triangles', () => {
      const face = createFace(3);
      expect(isTriangle(face)).toBe(true);
    });

    it('should return false for non-triangles', () => {
      const face = createFace(4);
      expect(isTriangle(face)).toBe(false);
    });
  });

  describe('isQuad', () => {
    it('should return true for quads', () => {
      const face = createFace(4);
      expect(isQuad(face)).toBe(true);
    });

    it('should return false for non-quads', () => {
      const face = createFace(3);
      expect(isQuad(face)).toBe(false);
    });
  });

  describe('isNGon', () => {
    it('should return true for n-gons', () => {
      const face = createFace(5);
      expect(isNGon(face)).toBe(true);
    });

    it('should return false for triangles and quads', () => {
      expect(isNGon(createFace(3))).toBe(false);
      expect(isNGon(createFace(4))).toBe(false);
    });
  });

  describe('getFaceVertexCount', () => {
    it('should return correct vertex count', () => {
      expect(getFaceVertexCount(createFace(3))).toBe(3);
      expect(getFaceVertexCount(createFace(4))).toBe(4);
      expect(getFaceVertexCount(createFace(6))).toBe(6);
    });
  });

  describe('isValidFace', () => {
    it('should return true for valid faces', () => {
      expect(isValidFace(createFace(3))).toBe(true);
      expect(isValidFace(createFace(4))).toBe(true);
      expect(isValidFace(createFace(5))).toBe(true);
    });

    it('should return false for invalid faces', () => {
      expect(isValidFace(createFace(1))).toBe(false);
      expect(isValidFace(createFace(2))).toBe(false);
    });
  });

  describe('getFaceTypeDescription', () => {
    it('should return correct descriptions', () => {
      expect(getFaceTypeDescription(createFace(3))).toBe('Triangle');
      expect(getFaceTypeDescription(createFace(4))).toBe('Quad');
      expect(getFaceTypeDescription(createFace(5))).toBe('Pentagon');
      expect(getFaceTypeDescription(createFace(6))).toBe('Hexagon');
      expect(getFaceTypeDescription(createFace(7))).toBe('Heptagon');
      expect(getFaceTypeDescription(createFace(8))).toBe('Octagon');
      expect(getFaceTypeDescription(createFace(9))).toBe('9-gon');
    });
  });
}); 