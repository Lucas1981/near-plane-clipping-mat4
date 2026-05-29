import trianglesData from "./assets/triangles.json";
import { clipAgainstNearPlane } from "./clipClipSpace.js";
import { drawBirdsEye } from "./drawBirdsEye.js";
import { drawMeshObject } from "./drawMeshObject.js";
import { perspectiveDivide } from "./perspectiveDivide.js";
import { multiply, perspective, translation, transformPoints } from "./mat4.js";
import { MeshObject } from "./MeshObject.js";

const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

const meshObject = new MeshObject(trianglesData);

const meshOffset = { x: 0, y: -0.1, z: 1.2 };

const NEAR_Z = 0.1;
const FAR_Z = 100;

const DEGREES_PER_SECOND = 36;
const ROCK_AMPLITUDE = 2;

const viewport = { width: 0, height: 0, dpr: 1 };

function resize() {
  viewport.dpr = window.devicePixelRatio || 1;
  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;

  canvas.width = Math.floor(viewport.width * viewport.dpr);
  canvas.height = Math.floor(viewport.height * viewport.dpr);
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
}

function render() {
  const { width, height, dpr } = viewport;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.fillStyle = "#0f0f12";
  ctx.fillRect(0, 0, width, height);

  const focalLength = height * 0.9;

  // View matrix is identity (origin is the camera, looking +z).
  // MVP collapses to projection * model.
  const modelMatrix = translation(meshOffset.x, meshOffset.y, meshOffset.z);
  const projMatrix = perspective(focalLength, height, NEAR_Z, FAR_Z);
  const mvpMatrix = multiply(projMatrix, modelMatrix);

  // 1. Vertex transform: model-space → clip space.
  const clipSpaceMesh = {
    points: transformPoints(mvpMatrix, meshObject.points),
    polygons: meshObject.polygons,
  };

  // 2. Near-plane clipping in clip space.
  const clipped = clipAgainstNearPlane(clipSpaceMesh);

  // 3. Perspective divide: clip space → screen space.
  const screenMesh = perspectiveDivide(clipped, width, height);

  // 4. Rasterize.
  drawMeshObject(ctx, screenMesh);

  // projScale converts clip-space x back to world-space x for the birds-eye view.
  const projScale = (2 * focalLength) / height;
  drawBirdsEye(ctx, clipped, meshObject, meshOffset, width, NEAR_Z, projScale);

  let lowestZ = Infinity;
  for (const point of meshObject.points) {
    const z = point.z + meshOffset.z;
    if (z < lowestZ) lowestZ = z;
  }

  const clippingLabel = clipped.clippingOccurred ? "CLIPPING" : "no clip";
  const clippingColor = clipped.clippingOccurred ? "#e05c4a" : "#a8a8b3";

  ctx.font = "14px ui-monospace, monospace";
  ctx.textBaseline = "bottom";
  ctx.textAlign = "right";

  ctx.fillStyle = "#a8a8b3";
  ctx.fillText(`lowest z: ${lowestZ.toFixed(3)}`, width - 16, height - 16);

  ctx.fillStyle = clippingColor;
  ctx.fillText(clippingLabel, width - 16, height - 36);
}

const animationStart = performance.now();

function animate(timestamp) {
  const elapsedSeconds = (timestamp - animationStart) / 1000;
  const angleRadians = elapsedSeconds * ((DEGREES_PER_SECOND * Math.PI) / 180);

  meshOffset.z = ROCK_AMPLITUDE * Math.sin(angleRadians);

  render();
  requestAnimationFrame(animate);
}

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(animate);
