export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Clamps a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
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

/**
 * Applies a 1D deadzone with linear rescaling so that the active range maps to [0, 1].
 */
export function applyDeadzone(value: number, deadzone = 0.2): number {
  const abs = Math.abs(value);
  if (abs <= deadzone) {
    return 0;
  }
  const sign = Math.sign(value);
  const scaled = (abs - deadzone) / (1 - deadzone);
  return sign * clamp(scaled, 0, 1);
}

/**
 * Applies a 2D radial deadzone to an analog stick input with linear rescaling.
 */
export function applyRadialDeadzone(
  x: number,
  y: number,
  deadzone = 0.2,
): Vec2 {
  const magnitude = Math.hypot(x, y);
  if (magnitude <= deadzone || magnitude <= 1e-6) {
    return { x: 0, y: 0 };
  }
  const normalizedX = x / magnitude;
  const normalizedY = y / magnitude;
  const scaledMag = clamp((magnitude - deadzone) / (1 - deadzone), 0, 1);
  return {
    x: normalizedX * scaledMag,
    y: normalizedY * scaledMag,
  };
}
