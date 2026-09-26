import type { Vec2 } from "../math/vec2";

export type PlayerIndex = 0 | 1 | 2 | 3;
export const MAX_PLAYERS = 4;

export type KeyboardLayoutId = "arrows" | "wasd";

export type InputDevice =
  | { kind: "keyboard"; layout: KeyboardLayoutId }
  | { kind: "gamepad"; gamepadIndex: number };

export interface PlayerBinding {
  playerIndex: PlayerIndex;
  device: InputDevice;
}

export interface PlayerInput {
  /** Normalized movement vector: length <= 1 */
  move: Vec2;
  /** True while action button 1 is currently held */
  action1: boolean;
  /** True while action button 2 is currently held */
  action2: boolean;
  /** True only on the single frame action button 1 transitioned from unpressed to pressed */
  action1Pressed: boolean;
  /** True only on the single frame action button 2 transitioned from unpressed to pressed */
  action2Pressed: boolean;
  /** True only on the single frame action button 1 transitioned from pressed to unpressed */
  action1Released: boolean;
  /** True only on the single frame action button 2 transitioned from pressed to unpressed */
  action2Released: boolean;
}

export function createNeutralPlayerInput(): PlayerInput {
  return {
    move: { x: 0, y: 0 },
    action1: false,
    action2: false,
    action1Pressed: false,
    action2Pressed: false,
    action1Released: false,
    action2Released: false,
  };
}

export function areDevicesEqual(a: InputDevice, b: InputDevice): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "keyboard" && b.kind === "keyboard") {
    return a.layout === b.layout;
  }
  if (a.kind === "gamepad" && b.kind === "gamepad") {
    return a.gamepadIndex === b.gamepadIndex;
  }
  return false;
}
