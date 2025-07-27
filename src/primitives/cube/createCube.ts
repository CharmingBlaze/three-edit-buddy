import { EditableMesh } from '../../core/EditableMesh.js';

export interface CubeParams {
  size?: number;
}

/**
 * Creates a cube primitive with shared vertices
 */
export function createCube(params: CubeParams = {}): EditableMesh {
  const { size = 1 } = params;
  const halfSize = size / 2;

  const mesh = new EditableMesh();

  // Create 8 unique vertices for the cube
  const vertices = [
    // Front face
    {
      id: mesh.addVertex({ x: -halfSize, y: -halfSize, z: halfSize }).id,
      position: { x: -halfSize, y: -halfSize, z: halfSize },
    }, // 0
    {
      id: mesh.addVertex({ x: halfSize, y: -halfSize, z: halfSize }).id,
      position: { x: halfSize, y: -halfSize, z: halfSize },
    }, // 1
    {
      id: mesh.addVertex({ x: halfSize, y: halfSize, z: halfSize }).id,
      position: { x: halfSize, y: halfSize, z: halfSize },
    }, // 2
    {
      id: mesh.addVertex({ x: -halfSize, y: halfSize, z: halfSize }).id,
      position: { x: -halfSize, y: halfSize, z: halfSize },
    }, // 3
    // Back face
    {
      id: mesh.addVertex({ x: -halfSize, y: -halfSize, z: -halfSize }).id,
      position: { x: -halfSize, y: -halfSize, z: -halfSize },
    }, // 4
    {
      id: mesh.addVertex({ x: halfSize, y: -halfSize, z: -halfSize }).id,
      position: { x: halfSize, y: -halfSize, z: -halfSize },
    }, // 5
    {
      id: mesh.addVertex({ x: halfSize, y: halfSize, z: -halfSize }).id,
      position: { x: halfSize, y: halfSize, z: -halfSize },
    }, // 6
    {
      id: mesh.addVertex({ x: -halfSize, y: halfSize, z: -halfSize }).id,
      position: { x: -halfSize, y: halfSize, z: -halfSize },
    }, // 7
  ];

  // Create edges
  const edges = [];
  // Front face edges
  edges.push(mesh.addEdge(vertices[0]!.id, vertices[1]!.id));
  edges.push(mesh.addEdge(vertices[1]!.id, vertices[2]!.id));
  edges.push(mesh.addEdge(vertices[2]!.id, vertices[3]!.id));
  edges.push(mesh.addEdge(vertices[3]!.id, vertices[0]!.id));
  // Back face edges
  edges.push(mesh.addEdge(vertices[4]!.id, vertices[5]!.id));
  edges.push(mesh.addEdge(vertices[5]!.id, vertices[6]!.id));
  edges.push(mesh.addEdge(vertices[6]!.id, vertices[7]!.id));
  edges.push(mesh.addEdge(vertices[7]!.id, vertices[4]!.id));
  // Connecting edges
  edges.push(mesh.addEdge(vertices[0]!.id, vertices[4]!.id));
  edges.push(mesh.addEdge(vertices[1]!.id, vertices[5]!.id));
  edges.push(mesh.addEdge(vertices[2]!.id, vertices[6]!.id));
  edges.push(mesh.addEdge(vertices[3]!.id, vertices[7]!.id));

  // Create faces (6 quads)
  const edgeIds = edges.map((e) => e.id);
  mesh.addFace(
    [vertices[0]!.id, vertices[1]!.id, vertices[2]!.id, vertices[3]!.id],
    [edgeIds[0]!, edgeIds[1]!, edgeIds[2]!, edgeIds[3]!]
  ); // Front
  mesh.addFace(
    [vertices[5]!.id, vertices[4]!.id, vertices[7]!.id, vertices[6]!.id],
    [edgeIds[4]!, edgeIds[7]!, edgeIds[6]!, edgeIds[5]!]
  ); // Back
  mesh.addFace(
    [vertices[4]!.id, vertices[0]!.id, vertices[3]!.id, vertices[7]!.id],
    [edgeIds[8]!, edgeIds[3]!, edgeIds[11]!, edgeIds[7]!]
  ); // Left
  mesh.addFace(
    [vertices[1]!.id, vertices[5]!.id, vertices[6]!.id, vertices[2]!.id],
    [edgeIds[1]!, edgeIds[9]!, edgeIds[5]!, edgeIds[2]!]
  ); // Right
  mesh.addFace(
    [vertices[3]!.id, vertices[2]!.id, vertices[6]!.id, vertices[7]!.id],
    [edgeIds[2]!, edgeIds[10]!, edgeIds[6]!, edgeIds[11]!]
  ); // Top
  mesh.addFace(
    [vertices[4]!.id, vertices[5]!.id, vertices[1]!.id, vertices[0]!.id],
    [edgeIds[4]!, edgeIds[9]!, edgeIds[0]!, edgeIds[8]!]
  ); // Bottom

  return mesh;
}
