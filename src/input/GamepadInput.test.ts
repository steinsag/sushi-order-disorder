import { describe, expect, it } from "vitest";
import { GamepadInput } from "./GamepadInput";

function createMockGamepad(options: {
  id?: string;
  index?: number;
  mapping?: GamepadMappingType;
  connected?: boolean;
  axes?: number[];
  buttons?: boolean[];
}): Gamepad {
  const axes = options.axes ?? [0, 0, 0, 0];
  const buttonsArray = (options.buttons ?? []).map((pressed) => ({
    pressed,
    touched: pressed,
    value: pressed ? 1 : 0,
  }));

  // Fill up to 17 standard buttons
  while (buttonsArray.length < 17) {
    buttonsArray.push({ pressed: false, touched: false, value: 0 });
  }

  return {
    id: options.id ?? "Mock Controller",
    index: options.index ?? 0,
    connected: options.connected ?? true,
    timestamp: Date.now(),
    mapping: options.mapping ?? "standard",
    axes,
    buttons: buttonsArray,
    hapticActuators: [],
    vibrationActuator: null,
  } as unknown as Gamepad;
}

describe("GamepadInput", () => {
  it("returns neutral input when gamepad is not connected or provider returns empty", () => {
    const input = new GamepadInput({
      gamepadProvider: () => [null, null],
    });

    expect(input.isConnected(0)).toBe(false);
    expect(input.getRawInput(0)).toEqual({
      move: { x: 0, y: 0 },
      action1: false,
      action2: false,
    });
    expect(input.isPauseRequested(0)).toBe(false);
  });

  it("applies deadzone to axes", () => {
    let mockPad = createMockGamepad({ axes: [0.1, -0.15] });
    const input = new GamepadInput({
      deadzone: 0.2,
      gamepadProvider: () => [mockPad],
    });

    // Both below 0.2 magnitude
    expect(input.getRawInput(0).move).toEqual({ x: 0, y: 0 });

    // Strong stick deflection
    mockPad = createMockGamepad({ axes: [1.0, 0] });
    expect(input.getRawInput(0).move).toEqual({ x: 1, y: 0 });

    // Diagonal stick deflection
    mockPad = createMockGamepad({ axes: [1.0, 1.0] });
    const diag = input.getRawInput(0).move;
    expect(diag.x).toBeCloseTo(Math.SQRT1_2);
    expect(diag.y).toBeCloseTo(Math.SQRT1_2);
  });

  it("handles D-Pad navigation fallback", () => {
    const buttons = new Array(17).fill(false);
    buttons[12] = true; // D-Pad Up
    buttons[15] = true; // D-Pad Right
    const mockPad = createMockGamepad({ axes: [0, 0], buttons });

    const input = new GamepadInput({
      gamepadProvider: () => [mockPad],
    });

    const move = input.getRawInput(0).move;
    expect(move.x).toBeCloseTo(Math.SQRT1_2);
    expect(move.y).toBeCloseTo(-Math.SQRT1_2);
  });

  it("maps action buttons and pause buttons correctly for standard gamepads", () => {
    const buttons = new Array(17).fill(false);
    buttons[0] = true; // Action 1 (A/Cross)
    buttons[1] = true; // Action 2 (B/Circle)
    buttons[9] = true; // Start / Pause

    const mockPad = createMockGamepad({ buttons });
    const input = new GamepadInput({
      gamepadProvider: () => [mockPad],
    });

    const raw = input.getRawInput(0);
    expect(raw.action1).toBe(true);
    expect(raw.action2).toBe(true);
    expect(input.isPauseRequested(0)).toBe(true);
    expect(input.isPauseRequested()).toBe(true);
  });

  it("correctly maps 045e-028e Xbox macOS HID gamepad buttons without standard mapping", () => {
    // 045e-028e Xbox 360 controller on macOS (mapping: "")
    // Buttons: 0=Up, 1=Down, 2=Left, 3=Right, 4=Start, 5=Back, 11=A, 12=B, 13=X, 14=Y
    const buttonsA = new Array(17).fill(false);
    buttonsA[11] = true; // A button -> Action 1
    const padA = createMockGamepad({
      id: "045e-028e-Controller",
      mapping: "" as GamepadMappingType,
      buttons: buttonsA,
    });

    const inputA = new GamepadInput({ gamepadProvider: () => [padA] });
    const rawA = inputA.getRawInput(0);
    expect(rawA.action1).toBe(true);
    expect(rawA.action2).toBe(false);
    expect(rawA.move).toEqual({ x: 0, y: 0 }); // Must not move

    const buttonsB = new Array(17).fill(false);
    buttonsB[12] = true; // B button -> Action 2
    const padB = createMockGamepad({
      id: "045e-028e-Controller",
      mapping: "" as GamepadMappingType,
      buttons: buttonsB,
    });
    const inputB = new GamepadInput({ gamepadProvider: () => [padB] });
    const rawB = inputB.getRawInput(0);
    expect(rawB.action1).toBe(false);
    expect(rawB.action2).toBe(true);
    expect(rawB.move).toEqual({ x: 0, y: 0 }); // Must not move

    const buttonsX = new Array(17).fill(false);
    buttonsX[13] = true; // X button -> Action 1
    const padX = createMockGamepad({
      id: "045e-028e-Controller",
      mapping: "" as GamepadMappingType,
      buttons: buttonsX,
    });
    const inputX = new GamepadInput({ gamepadProvider: () => [padX] });
    const rawX = inputX.getRawInput(0);
    expect(rawX.action1).toBe(true);
    expect(rawX.action2).toBe(false);
    expect(rawX.move).toEqual({ x: 0, y: 0 }); // Must not move

    const buttonsY = new Array(17).fill(false);
    buttonsY[14] = true; // Y button -> Action 2
    const padY = createMockGamepad({
      id: "045e-028e-Controller",
      mapping: "" as GamepadMappingType,
      buttons: buttonsY,
    });
    const inputY = new GamepadInput({ gamepadProvider: () => [padY] });
    const rawY = inputY.getRawInput(0);
    expect(rawY.action1).toBe(false);
    expect(rawY.action2).toBe(true);
    expect(rawY.move).toEqual({ x: 0, y: 0 }); // Must not move

    // Test macOS Xbox D-Pad (buttons 0-3)
    const buttonsDpad = new Array(17).fill(false);
    buttonsDpad[0] = true; // Up
    buttonsDpad[3] = true; // Right
    const padDpad = createMockGamepad({
      id: "045e-028e-Controller",
      mapping: "" as GamepadMappingType,
      buttons: buttonsDpad,
    });
    const inputDpad = new GamepadInput({ gamepadProvider: () => [padDpad] });
    const rawDpad = inputDpad.getRawInput(0);
    expect(rawDpad.move.x).toBeCloseTo(Math.SQRT1_2);
    expect(rawDpad.move.y).toBeCloseTo(-Math.SQRT1_2);
    expect(rawDpad.action1).toBe(false);
    expect(rawDpad.action2).toBe(false);

    // Test macOS Xbox Joystick Y inversion (+1 raw axis is Up -> negative Y on screen, -1 raw axis is Down -> positive Y on screen)
    const padStickUp = createMockGamepad({
      id: "045e-028e-Controller",
      mapping: "" as GamepadMappingType,
      axes: [0, 1.0], // raw HID stick pushed Up (+1)
    });
    const inputStickUp = new GamepadInput({
      gamepadProvider: () => [padStickUp],
    });
    expect(inputStickUp.getRawInput(0).move.y).toBe(-1); // Up is -1 (towards top of screen)

    const padStickDown = createMockGamepad({
      id: "045e-028e-Controller",
      mapping: "" as GamepadMappingType,
      axes: [0, -1.0], // raw HID stick pushed Down (-1)
    });
    const inputStickDown = new GamepadInput({
      gamepadProvider: () => [padStickDown],
    });
    expect(inputStickDown.getRawInput(0).move.y).toBe(1); // Down is +1 (towards bottom of screen)

    // Test macOS Xbox Pause (button 4=Start)
    const buttonsPause = new Array(17).fill(false);
    buttonsPause[4] = true;
    const padPause = createMockGamepad({
      id: "045e-028e-Controller",
      mapping: "" as GamepadMappingType,
      buttons: buttonsPause,
    });
    const inputPause = new GamepadInput({ gamepadProvider: () => [padPause] });
    expect(inputPause.isPauseRequested(0)).toBe(true);
  });

  it("handles disconnect and reconnect seamlessly", () => {
    let pads: (Gamepad | null)[] = [
      createMockGamepad({ index: 0, axes: [1, 0], connected: true }),
    ];
    const input = new GamepadInput({
      gamepadProvider: () => pads,
    });

    expect(input.isConnected(0)).toBe(true);
    expect(input.getRawInput(0).move.x).toBe(1);

    // Disconnect
    pads = [null];
    expect(input.isConnected(0)).toBe(false);
    expect(input.getRawInput(0)).toEqual({
      move: { x: 0, y: 0 },
      action1: false,
      action2: false,
    });

    // Reconnect
    pads = [createMockGamepad({ index: 0, axes: [0, -1], connected: true })];
    expect(input.isConnected(0)).toBe(true);
    expect(input.getRawInput(0).move.y).toBe(-1);
  });

  it("resolves sparse or shifted gamepad indices gracefully", () => {
    // Gamepad at array index 2 (e.g. index 0 and 1 are null)
    const pads = [
      null,
      null,
      createMockGamepad({ index: 2, axes: [1, 0], connected: true }),
    ];
    const input = new GamepadInput({
      gamepadProvider: () => pads,
    });

    // Gamepad 1 (index 0) should find the first available connected gamepad (pads[2])
    expect(input.isConnected(0)).toBe(true);
    expect(input.getRawInput(0).move.x).toBe(1);
  });
});
