/**
 * Near-plane clipping in homogeneous clip space.
 *
 * After the MVP transform, the near plane maps to z_clip = 0. Points with
 * z_clip > 0 are in front of the near plane (inside the frustum).
 *
 * Clipping here — before the perspective divide — is the natural place in a
 * mat4 pipeline: it avoids division by zero and correctly handles vertices
 * that straddle the camera. All four clip-space components (x, y, z, w) are
 * interpolated at cut edges so the subsequent perspective divide stays correct
 * for newly created boundary vertices.
 */

/**
 * Interpolates two clip-space points to find their intersection with z_clip = 0.
 *
 * @param {{ x, y, z, w }} a  inside vertex (z > 0)
 * @param {{ x, y, z, w }} b  outside vertex (z ≤ 0)
 */
function intersect(a, b) {
  const t = a.z / (a.z - b.z);
  return {
    x: a.x + t * (b.x - a.x),
    y: a.y + t * (b.y - a.y),
    z: 0,
    w: a.w + t * (b.w - a.w),
  };
}

/**
 * Sutherland–Hodgman clip of a polygon against z_clip > 0 (near plane).
 *
 * @param {{ x, y, z, w }[]} verts  clip-space vertices
 * @returns {{ x, y, z, w }[]}
 */
function clipPolygon(verts) {
  const output = [];

  for (let i = 0; i < verts.length; i++) {
    const current = verts[i];
    const next = verts[(i + 1) % verts.length];

    const currentInside = current.z > 0;
    const nextInside = next.z > 0;

    if (currentInside) {
      output.push(current);
      if (!nextInside) {
        output.push(intersect(current, next));
      }
    } else if (nextInside) {
      output.push(intersect(current, next));
    }
  }

  return output;
}

/**
 * Clips each polygon of a clip-space mesh against the near plane (z_clip ≥ 0)
 * and fan-triangulates the results. Expects vertices already in clip space —
 * the MVP transform is a separate upstream step.
 *
 * @param {{ points: { x, y, z, w }[], polygons: object[] }} mesh  clip-space
 * @returns {{
 *   points: { x: number, y: number, z: number, w: number }[],
 *   polygons: { color: string, vertexIndices: number[] }[],
 *   clippingOccurred: boolean,
 * }}
 */
export function clipAgainstNearPlane(mesh) {
  const outPoints = [];
  const outPolygons = [];
  let clippingOccurred = false;

  for (const polygon of mesh.polygons) {
    const clipVerts = polygon.vertexIndices.map((i) => mesh.points[i]);

    const anyOutside = clipVerts.some((v) => v.z <= 0);

    if (!anyOutside) {
      // Trivial accept: all vertices are in front of the near plane.
      // Copy directly — no clipping work needed.
      const base = outPoints.length;
      outPoints.push(...clipVerts);
      for (let i = 1; i < clipVerts.length - 1; i++) {
        outPolygons.push({
          color: polygon.color,
          vertexIndices: [base, base + i, base + i + 1],
        });
      }
      continue;
    }

    // At least one vertex is behind the near plane — clip and fan-triangulate.
    clippingOccurred = true;

    const clipped = clipPolygon(clipVerts);

    if (clipped.length < 3) continue;

    const base = outPoints.length;
    outPoints.push(...clipped);

    for (let i = 1; i < clipped.length - 1; i++) {
      outPolygons.push({
        color: polygon.color,
        vertexIndices: [base, base + i, base + i + 1],
      });
    }
  }

  return { points: outPoints, polygons: outPolygons, clippingOccurred };
}
