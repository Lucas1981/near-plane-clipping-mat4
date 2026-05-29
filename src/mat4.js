/**
 * Minimal Mat4 utilities (column-major, matching the WebGL convention).
 *
 * Memory layout – each column is stored contiguously at indices [col*4 .. col*4+3]:
 *
 *   | m[ 0]  m[ 4]  m[ 8]  m[12] |
 *   | m[ 1]  m[ 5]  m[ 9]  m[13] |
 *   | m[ 2]  m[ 6]  m[10]  m[14] |
 *   | m[ 3]  m[ 7]  m[11]  m[15] |
 */

/**
 * Returns a translation matrix.
 *
 * @param {number} tx
 * @param {number} ty
 * @param {number} tz
 * @returns {number[]} 16-element column-major array
 */
export function translation(tx, ty, tz) {
  // prettier-ignore
  return [
    1,  0,  0,  0,
    0,  1,  0,  0,
    0,  0,  1,  0,
    tx, ty, tz, 1,
  ];
}

/**
 * Returns a perspective projection matrix (left-handed, +z forward).
 * Maps view-space z ∈ [near, far] to NDC z ∈ [0, 1].
 *
 * The focal length and screen dimensions define the field of view such that
 * the resulting screen coordinates exactly match the previous manual projection:
 *   x_screen = width/2  + x * (focalLength / z) * (width / height)
 *   y_screen = height/2 − y * (focalLength / z)
 *
 * @param {number} focalLength  in pixels (e.g. height * 0.9)
 * @param {number} height       viewport height in pixels
 * @param {number} near         near plane z (world space)
 * @param {number} far          far plane z (world space)
 * @returns {number[]} 16-element column-major array
 */
export function perspective(focalLength, height, near, far) {
  const f = (2 * focalLength) / height;
  const nf = far / (far - near);
  // prettier-ignore
  return [
    f,  0,  0,          0,
    0,  f,  0,          0,
    0,  0,  nf,         1,
    0,  0,  -near * nf, 0,
  ];
}

/**
 * Multiplies two column-major 4×4 matrices: returns a * b.
 *
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number[]}
 */
export function multiply(a, b) {
  const out = new Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let s = 0;
      for (let k = 0; k < 4; k++) {
        s += a[k * 4 + row] * b[col * 4 + k];
      }
      out[col * 4 + row] = s;
    }
  }
  return out;
}

/**
 * Transforms a homogeneous point [x, y, z, w] by a column-major 4×4 matrix.
 *
 * @param {number[]} mat
 * @param {number}   x
 * @param {number}   y
 * @param {number}   z
 * @param {number}   [w=1]
 * @returns {{ x: number, y: number, z: number, w: number }}
 */
export function transformPoint(mat, x, y, z, w = 1) {
  return {
    x: mat[0] * x + mat[4] * y + mat[ 8] * z + mat[12] * w,
    y: mat[1] * x + mat[5] * y + mat[ 9] * z + mat[13] * w,
    z: mat[2] * x + mat[6] * y + mat[10] * z + mat[14] * w,
    w: mat[3] * x + mat[7] * y + mat[11] * z + mat[15] * w,
  };
}

/**
 * Transforms an array of points by a column-major 4×4 matrix in one pass —
 * the conceptual equivalent of multiplying a 4×N vertex matrix by the 4×4
 * transform. Each point is treated as a column vector [x, y, z, w=1].
 *
 * In plain JS the arithmetic is still sequential, but this function belongs
 * here because the vertex transform is a mat4 concern, not a clipping concern.
 * It is also the natural place for a future Float32Array / SIMD upgrade.
 *
 * @param {number[]} mat
 * @param {{ x: number, y: number, z: number }[]} points
 * @returns {{ x: number, y: number, z: number, w: number }[]}
 */
export function transformPoints(mat, points) {
  return points.map(({ x, y, z }) => transformPoint(mat, x, y, z));
}
