/**
 * Strokes the polygon outlines of a screen-space mesh onto the canvas.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ points: { x, y }[], polygons: object[] }} mesh  screen-space
 * @param {{ lineWidth?: number }} [options]
 */
export function drawMeshObject(ctx, mesh, { lineWidth = 2 } = {}) {
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";

  for (const polygon of mesh.polygons) {
    const pts = polygon.vertexIndices.map((i) => mesh.points[i]);

    if (pts.length < 2) continue;

    ctx.strokeStyle = polygon.color;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    ctx.stroke();
  }
}
