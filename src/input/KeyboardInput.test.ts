import { describe, expect, it } from "vitest";
import { KeyboardState } from "./KeyboardInput";

describe("KeyboardState", () => {
  it("returns neutral input when no keys are down", () => {
    const keyboard = new KeyboardState();
    const inputArrows = keyboard.getRawInput("arrows");
    const inputWasd = keyboard.getRawInput("wasd");

    expect(inputArrows).toEqual({
      move: { x: 0, y: 0 },
      action1: false,
      action2: false,
    });
    expect(inputWasd).toEqual({
      move: { x: 0, y: 0 },
      action1: false,
      action2: false,
    });
    expect(keyboard.isPauseRequested()).toBe(false);
  });

  it("handles arrows layout movement and actions correctly", () => {
    const keyboard = new KeyboardState();

    keyboard.setKeyDown("ArrowRight");
    expect(keyboard.getRawInput("arrows").move).toEqual({ x: 1, y: 0 });

    keyboard.setKeyDown("ArrowUp");
    const diagonal = keyboard.getRawInput("arrows").move;
    expect(diagonal.x).toBeCloseTo(Math.SQRT1_2);
    expect(diagonal.y).toBeCloseTo(-Math.SQRT1_2);

    keyboard.setKeyDown("KeyK");
    keyboard.setKeyDown("KeyL");
    const withActions = keyboard.getRawInput("arrows");
    expect(withActions.action1).toBe(true);
    expect(withActions.action2).toBe(true);

    // WASD is unaffected
    expect(keyboard.getRawInput("wasd")).toEqual({
      move: { x: 0, y: 0 },
      action1: false,
      action2: false,
    });
  });

  it("handles wasd layout movement and actions correctly", () => {
    const keyboard = new KeyboardState();

    keyboard.setKeyDown("KeyW");
    keyboard.setKeyDown("KeyA");
    const diag = keyboard.getRawInput("wasd").move;
    expect(diag.x).toBeCloseTo(-Math.SQRT1_2);
    expect(diag.y).toBeCloseTo(-Math.SQRT1_2);

    keyboard.setKeyDown("KeyF");
    expect(keyboard.getRawInput("wasd").action1).toBe(true);
    expect(keyboard.getRawInput("wasd").action2).toBe(false);

    keyboard.setKeyDown("KeyG");
    expect(keyboard.getRawInput("wasd").action2).toBe(true);

    // Arrows is unaffected
    expect(keyboard.getRawInput("arrows")).toEqual({
      move: { x: 0, y: 0 },
      action1: false,
      action2: false,
    });
  });

  it("clears state on blur and returns neutral input", () => {
    const keyboard = new KeyboardState();
    keyboard.setKeyDown("ArrowUp");
    keyboard.setKeyDown("KeyW");
    keyboard.setKeyDown("KeyK");

    expect(keyboard.getRawInput("arrows").action1).toBe(true);
    expect(keyboard.getRawInput("wasd").move.y).toBe(-1);

    keyboard.clear();

    expect(keyboard.getRawInput("arrows")).toEqual({
      move: { x: 0, y: 0 },
      action1: false,
      action2: false,
    });
    expect(keyboard.getRawInput("wasd")).toEqual({
      move: { x: 0, y: 0 },
      action1: false,
      action2: false,
    });
  });

  it("detects system pause keys (Escape / KeyP)", () => {
    const keyboard = new KeyboardState();
    expect(keyboard.isPauseRequested()).toBe(false);

    keyboard.setKeyDown("Escape");
    expect(keyboard.isPauseRequested()).toBe(true);

    keyboard.setKeyUp("Escape");
    expect(keyboard.isPauseRequested()).toBe(false);

    keyboard.setKeyDown("KeyP");
    expect(keyboard.isPauseRequested()).toBe(true);
  });

  it("attaches event listeners to target and handles keydown/keyup/blur", () => {
    const target = new EventTarget();
    const keyboard = new KeyboardState();
    keyboard.attach(target);

    // Dispatch keydown
    const downEvent = new Event("keydown") as Event & { code: string };
    downEvent.code = "ArrowDown";
    target.dispatchEvent(downEvent);
    expect(keyboard.isDown("ArrowDown")).toBe(true);
    expect(keyboard.getRawInput("arrows").move).toEqual({ x: 0, y: 1 });

    // Dispatch keyup
    const upEvent = new Event("keyup") as Event & { code: string };
    upEvent.code = "ArrowDown";
    target.dispatchEvent(upEvent);
    expect(keyboard.isDown("ArrowDown")).toBe(false);

    // Dispatch blur
    const wEvent = new Event("keydown") as Event & { code: string };
    wEvent.code = "KeyW";
    target.dispatchEvent(wEvent);
    expect(keyboard.isDown("KeyW")).toBe(true);

    target.dispatchEvent(new Event("blur"));
    expect(keyboard.isDown("KeyW")).toBe(false);

    keyboard.detach();
  });
});
