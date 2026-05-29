/**
 * Converts a clip-space mesh to screen space by performing the perspective
 * divide (x/w, y/w → NDC) and mapping NDC coordinates to pixel coordinates.
 *
 * All vertices are assumed to have w > 0, which is guaranteed by clipping
 * against the near plane before this step.
 *
 * @param {{ points: { x, y, z, w }[], polygons: object[] }} mesh  clip-space
 * @param {number} width   viewport width in pixels
 * @param {number} height  viewport height in pixels
 * @returns {{ points: { x: number, y: number }[], polygons: object[] }}  screen-space
 */
export function perspectiveDivide(mesh, width, height) {
  return {
    points: mesh.points.map(({ x, y, w }) => ({
      x: ((x / w) + 1) / 2 * width,
      y: (1 - (y / w)) / 2 * height,
    })),
    polygons: mesh.polygons,
  };
}
