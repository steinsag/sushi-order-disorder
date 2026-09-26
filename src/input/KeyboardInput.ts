import { normalizeMove, type Vec2 } from "../math/vec2";
import type { KeyboardLayoutId } from "./PlayerInput";

export interface KeyboardLayoutConfig {
  up: string[];
  down: string[];
  left: string[];
  right: string[];
  action1: string[];
  action2: string[];
}

export const KEYBOARD_LAYOUTS: Record<KeyboardLayoutId, KeyboardLayoutConfig> =
  {
    arrows: {
      up: ["ArrowUp"],
      down: ["ArrowDown"],
      left: ["ArrowLeft"],
      right: ["ArrowRight"],
      action1: ["KeyK", "Period", "Numpad1", "Enter"],
      action2: ["KeyL", "Slash", "Numpad2", "ShiftRight"],
    },
    wasd: {
      up: ["KeyW"],
      down: ["KeyS"],
      left: ["KeyA"],
      right: ["KeyD"],
      action1: ["KeyF", "KeyC", "Space", "KeyE"],
      action2: ["KeyG", "KeyV", "KeyQ", "KeyR"],
    },
  };

export const SYSTEM_PAUSE_KEYS = ["Escape", "KeyP", "Pause"];

export interface RawInputState {
  move: Vec2;
  action1: boolean;
  action2: boolean;
}

export interface KeyboardEventTarget {
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ): void;
}

export class KeyboardState {
  private readonly downKeys = new Set<string>();
  private attachedTarget: KeyboardEventTarget | null = null;

  private readonly handleKeyDown = (e: Event): void => {
    if ("code" in e && typeof (e as KeyboardEvent).code === "string") {
      this.downKeys.add((e as KeyboardEvent).code);
    }
  };

  private readonly handleKeyUp = (e: Event): void => {
    if ("code" in e && typeof (e as KeyboardEvent).code === "string") {
      this.downKeys.delete((e as KeyboardEvent).code);
    }
  };

  private readonly handleBlur = (): void => {
    this.clear();
  };

  public attach(target: KeyboardEventTarget = window): void {
    if (this.attachedTarget) {
      this.detach();
    }
    this.attachedTarget = target;
    target.addEventListener("keydown", this.handleKeyDown);
    target.addEventListener("keyup", this.handleKeyUp);
    target.addEventListener("blur", this.handleBlur);
  }

  public detach(): void {
    if (this.attachedTarget) {
      this.attachedTarget.removeEventListener("keydown", this.handleKeyDown);
      this.attachedTarget.removeEventListener("keyup", this.handleKeyUp);
      this.attachedTarget.removeEventListener("blur", this.handleBlur);
      this.attachedTarget = null;
    }
    this.clear();
  }

  public setKeyDown(code: string): void {
    this.downKeys.add(code);
  }

  public setKeyUp(code: string): void {
    this.downKeys.delete(code);
  }

  public isDown(code: string): boolean {
    return this.downKeys.has(code);
  }

  public clear(): void {
    this.downKeys.clear();
  }

  private isAnyDown(codes: string[]): boolean {
    for (const code of codes) {
      if (this.downKeys.has(code)) {
        return true;
      }
    }
    return false;
  }

  public getRawInput(layoutId: KeyboardLayoutId): RawInputState {
    const layout = KEYBOARD_LAYOUTS[layoutId];
    if (!layout) {
      return { move: { x: 0, y: 0 }, action1: false, action2: false };
    }

    const right = this.isAnyDown(layout.right) ? 1 : 0;
    const left = this.isAnyDown(layout.left) ? 1 : 0;
    const down = this.isAnyDown(layout.down) ? 1 : 0;
    const up = this.isAnyDown(layout.up) ? 1 : 0;

    const rawX = right - left;
    const rawY = down - up;

    const move = normalizeMove(rawX, rawY);
    const action1 = this.isAnyDown(layout.action1);
    const action2 = this.isAnyDown(layout.action2);

    return { move, action1, action2 };
  }

  public isPauseRequested(): boolean {
    return this.isAnyDown(SYSTEM_PAUSE_KEYS);
  }
}
