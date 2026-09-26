import { applyRadialDeadzone, normalizeMove, type Vec2 } from "../math/vec2";
import type { RawInputState } from "./KeyboardInput";

export type GamepadProvider = () => (Gamepad | null)[];

export function defaultGamepadProvider(): (Gamepad | null)[] {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.getGamepads === "function"
  ) {
    return Array.from(navigator.getGamepads());
  }
  return [];
}

export interface GamepadInputOptions {
  deadzone?: number;
  gamepadProvider?: GamepadProvider;
}

function isButtonPressed(pad: Gamepad, index: number): boolean {
  const btn = pad.buttons[index];
  if (!btn) return false;
  if (typeof btn === "object") {
    return Boolean(btn.pressed || btn.value > 0.5);
  }
  return Boolean(btn);
}

export function isMacXboxGamepad(pad: Gamepad): boolean {
  if (pad.mapping === "standard") {
    return false;
  }
  const id = (pad.id || "").toLowerCase();
  if (
    id.includes("045e") ||
    id.includes("028e") ||
    id.includes("02a1") ||
    id.includes("02d1") ||
    id.includes("xbox") ||
    id.includes("x-box")
  ) {
    return true;
  }
  // Fallback: If non-standard and has at least 15 buttons (standard Xbox-style button count in HID)
  if (pad.buttons.length >= 15 && pad.buttons.length <= 17) {
    return true;
  }
  return false;
}

export class GamepadInput {
  private readonly deadzone: number;
  private readonly provider: GamepadProvider;

  constructor(options: GamepadInputOptions = {}) {
    this.deadzone = options.deadzone ?? 0.2;
    this.provider = options.gamepadProvider ?? defaultGamepadProvider;
  }

  public getGamepads(): (Gamepad | null)[] {
    return this.provider();
  }

  public getGamepad(gamepadIndex: number): Gamepad | null {
    const pads = this.getGamepads();
    const pad = pads[gamepadIndex];
    if (pad && pad.connected !== false) {
      return pad;
    }
    // Fallback: match nth connected gamepad in the list if the slot index is sparse/null
    const connectedPads = pads.filter((p): p is Gamepad =>
      Boolean(p && p.connected !== false),
    );
    return connectedPads[gamepadIndex] ?? null;
  }

  public isConnected(gamepadIndex: number): boolean {
    return this.getGamepad(gamepadIndex) !== null;
  }

  public getRawInput(gamepadIndex: number): RawInputState {
    const pad = this.getGamepad(gamepadIndex);

    if (!pad) {
      return { move: { x: 0, y: 0 }, action1: false, action2: false };
    }

    const isMacXbox = isMacXboxGamepad(pad);

    // Read Left Stick axes
    const rawAxisX = pad.axes[0] ?? 0;
    // macOS raw HID without standard mapping has Y axis inverted (+1 up, -1 down) compared to standard spec (-1 up, +1 down)
    const rawAxisY = isMacXbox ? -(pad.axes[1] ?? 0) : (pad.axes[1] ?? 0);

    let move: Vec2 = applyRadialDeadzone(rawAxisX, rawAxisY, this.deadzone);

    // D-Pad indices
    // Standard: 12=Up, 13=Down, 14=Left, 15=Right
    // macOS Xbox HID: 0=Up, 1=Down, 2=Left, 3=Right
    const upIndex = isMacXbox ? 0 : 12;
    const downIndex = isMacXbox ? 1 : 13;
    const leftIndex = isMacXbox ? 2 : 14;
    const rightIndex = isMacXbox ? 3 : 15;

    const dpadUp = isButtonPressed(pad, upIndex);
    const dpadDown = isButtonPressed(pad, downIndex);
    const dpadLeft = isButtonPressed(pad, leftIndex);
    const dpadRight = isButtonPressed(pad, rightIndex);

    const dpadX = (dpadRight ? 1 : 0) - (dpadLeft ? 1 : 0);
    const dpadY = (dpadDown ? 1 : 0) - (dpadUp ? 1 : 0);

    if (dpadX !== 0 || dpadY !== 0) {
      const dpadMove = normalizeMove(dpadX, dpadY);
      // If stick is not strongly moved, prefer/blend dpad
      if (Math.hypot(move.x, move.y) < 0.1) {
        move = dpadMove;
      }
    }

    // Action 1: A / X / LB / LT
    // Standard: 0 (A), 2 (X), 4 (LB), 6 (LT)
    // macOS Xbox HID: 11 (A), 13 (X), 8 (LB), 15 (LT)
    const action1Indices = isMacXbox ? [11, 13, 8, 15] : [0, 2, 4, 6];

    // Action 2: B / Y / RB / RT
    // Standard: 1 (B), 3 (Y), 5 (RB), 7 (RT)
    // macOS Xbox HID: 12 (B), 14 (Y), 9 (RB), 16 (RT)
    const action2Indices = isMacXbox ? [12, 14, 9, 16] : [1, 3, 5, 7];

    const action1 = action1Indices.some((idx) => isButtonPressed(pad, idx));
    const action2 = action2Indices.some((idx) => isButtonPressed(pad, idx));

    return {
      move,
      action1,
      action2,
    };
  }

  private checkPauseForPad(pad: Gamepad): boolean {
    if (isMacXboxGamepad(pad)) {
      return (
        isButtonPressed(pad, 4) || // Start
        isButtonPressed(pad, 5) || // Back
        isButtonPressed(pad, 10) // Xbox Guide
      );
    }
    return (
      isButtonPressed(pad, 9) || // Start
      isButtonPressed(pad, 8) || // Select / Back
      isButtonPressed(pad, 16) // Guide / Home
    );
  }

  public isPauseRequested(gamepadIndex?: number): boolean {
    const pads = this.getGamepads();

    if (gamepadIndex !== undefined) {
      const pad = this.getGamepad(gamepadIndex);
      if (!pad) return false;
      return this.checkPauseForPad(pad);
    }

    // Check across all connected gamepads
    for (let i = 0; i < pads.length; i++) {
      const pad = this.getGamepad(i);
      if (pad && this.checkPauseForPad(pad)) {
        return true;
      }
    }
    return false;
  }
}
