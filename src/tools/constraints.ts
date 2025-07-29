import * as THREE from 'three';
import type { Vector3Like } from '../types/index.js';

/**
 * Projects a point onto a line defined by an origin and a direction.
 * @param point The point to project.
 * @param lineOrigin The origin of the line.
 * @param lineDirection The direction of the line (must be a unit vector).
 * @returns The projected point on the line.
 */
function projectPointOnLine(point: Vector3Like, lineOrigin: Vector3Like, lineDirection: Vector3Like): THREE.Vector3 {
  const p = new THREE.Vector3(point.x, point.y, point.z);
  const origin = new THREE.Vector3(lineOrigin.x, lineOrigin.y, lineOrigin.z);
  const direction = new THREE.Vector3(lineDirection.x, lineDirection.y, lineDirection.z);

  const v = p.clone().sub(origin);
  const dot = v.dot(direction);
  return origin.clone().add(direction.clone().multiplyScalar(dot));
}

/**
 * Calculates the new position of a vertex constrained to a specific axis.
 * @param originalPosition The starting position of the vertex.
 * @param mouseRay The ray representing the current mouse position in 3D space.
 * @param constraintAxis The axis to constrain the movement to ('x', 'y', or 'z').
 * @returns The new constrained position.
 */
export function getConstrainedPosition(originalPosition: Vector3Like, mouseRay: THREE.Ray, constraintAxis: 'x' | 'y' | 'z'): Vector3Like {
  const axisDirection = new THREE.Vector3();
  if (constraintAxis === 'x') axisDirection.set(1, 0, 0);
  if (constraintAxis === 'y') axisDirection.set(0, 1, 0);
  if (constraintAxis === 'z') axisDirection.set(0, 0, 1);

  // Create a plane that is perpendicular to the constraint axis and contains the original position.
  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(axisDirection, new THREE.Vector3(originalPosition.x, originalPosition.y, originalPosition.z));

  // Find the intersection of the mouse ray and this plane.
  const intersectionPoint = new THREE.Vector3();
  mouseRay.intersectPlane(plane, intersectionPoint);

  // The final position is the original position moved along the constraint axis towards the intersection point.
  const finalPosition = projectPointOnLine(intersectionPoint, originalPosition, axisDirection);

  return { x: finalPosition.x, y: finalPosition.y, z: finalPosition.z };
}
