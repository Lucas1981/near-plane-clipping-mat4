const BOX_SIZE = 200;
const MARGIN = 16;
const PADDING = 12;

const WORLD_Z_MIN = -2;
const WORLD_Z_MAX = 10;
const WORLD_Z_RANGE = WORLD_Z_MAX - WORLD_Z_MIN;

const INNER = BOX_SIZE - PADDING * 2;
const PIXELS_PER_UNIT = INNER / WORLD_Z_RANGE;
const WORLD_X_CENTER = 0;

function toBoxX(worldX) {
  return PADDING + INNER / 2 + (worldX - WORLD_X_CENTER) * PIXELS_PER_UNIT;
}

function toBoxZ(worldZ) {
  return PADDING + ((worldZ - WORLD_Z_MIN) / WORLD_Z_RANGE) * INNER;
}

function drawWorldPolygons(ctx, mesh, offset, style) {
  for (const polygon of mesh.polygons) {
    const points = polygon.vertexIndices.map((i) => {
      const p = mesh.points[i];
      return { x: p.x + offset.x, z: p.z + offset.z };
    });

    if (points.length < 2) continue;

    ctx.strokeStyle = style.stroke ?? polygon.color;
    ctx.lineWidth = style.lineWidth ?? 1.5;
    if (style.lineDash) ctx.setLineDash(style.lineDash);

    ctx.beginPath();
    ctx.moveTo(toBoxX(points[0].x), toBoxZ(points[0].z));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(toBoxX(points[i].x), toBoxZ(points[i].z));
    }
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

/**
 * Draws clip-space polygons in the birds-eye XZ view by recovering world-space
 * coordinates from the homogeneous clip-space values:
 *   x_world = x_clip / projScale   (projScale = 2 * focalLength / height)
 *   z_world = w_clip               (w_clip = z_view = z_world for identity view)
 */
function drawClipSpacePolygons(ctx, mesh, projScale, style) {
  for (const polygon of mesh.polygons) {
    const points = polygon.vertexIndices.map((i) => {
      const v = mesh.points[i];
      return { x: v.x / projScale, z: v.w };
    });

    if (points.length < 2) continue;

    ctx.strokeStyle = style.stroke ?? polygon.color;
    ctx.lineWidth = style.lineWidth ?? 1.5;
    if (style.lineDash) ctx.setLineDash(style.lineDash);

    ctx.beginPath();
    ctx.moveTo(toBoxX(points[0].x), toBoxZ(points[0].z));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(toBoxX(points[i].x), toBoxZ(points[i].z));
    }
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    if (style.dots) {
      ctx.fillStyle = style.stroke ?? polygon.color;
      for (const p of points) {
        ctx.beginPath();
        ctx.arc(toBoxX(p.x), toBoxZ(p.z), 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ points: { x, y, z, w }[], polygons: object[] }} clippedMesh  clip-space
 * @param {{ points: object[], polygons: object[] }} originalMesh          unclipped, for ghost
 * @param {{ x: number, y: number, z: number }} originalOffset
 * @param {number} screenWidth
 * @param {number} nearZ
 * @param {number} projScale  2 * focalLength / height — used to unproject x_clip → x_world
 */
export function drawBirdsEye(
  ctx,
  clippedMesh,
  originalMesh,
  originalOffset,
  screenWidth,
  nearZ = 0,
  projScale,
) {
  const originX = screenWidth - MARGIN - BOX_SIZE;
  const originY = MARGIN;

  ctx.save();
  ctx.translate(originX, originY);

  // background
  ctx.fillStyle = "rgba(10, 10, 18, 0.85)";
  ctx.strokeStyle = "#3a3a4a";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(0, 0, BOX_SIZE, BOX_SIZE);
  ctx.fill();
  ctx.stroke();

  // ghost: original unclipped polygon in world space
  ctx.globalAlpha = 0.25;
  drawWorldPolygons(ctx, originalMesh, originalOffset, {
    lineDash: [3, 3],
    lineWidth: 1,
  });
  ctx.globalAlpha = 1;

  // near-plane line
  const nearBoxZ = toBoxZ(nearZ);
  ctx.strokeStyle = "#e05c4a";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(PADDING, nearBoxZ);
  ctx.lineTo(BOX_SIZE - PADDING, nearBoxZ);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#e05c4a";
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(`z=${nearZ}`, PADDING + 2, nearBoxZ - 2);

  // clipped polygon — vertices are in clip space, unproject to world-space XZ
  drawClipSpacePolygons(ctx, clippedMesh, projScale, { lineWidth: 1.5, dots: true });

  // axis labels
  ctx.fillStyle = "#555566";
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("x", BOX_SIZE / 2, BOX_SIZE - 1);
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("z", PADDING - 2, BOX_SIZE / 2);

  ctx.restore();
}
