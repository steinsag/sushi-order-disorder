export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Normalizes a 2D movement vector so that diagonal movement does not exceed length 1.
 * Returns (0, 0) if length is below epsilon.
 */
export function normalizeMove(x: number, y: number): Vec2 {
  const len = Math.hypot(x, y);
  if (len <= 1e-6) {
    return { x: 0, y: 0 };
  }
  if (len <= 1) {
    return { x, y };
  }
  return { x: x / len, y: y / len };
}
