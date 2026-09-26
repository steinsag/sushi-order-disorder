import { describe, expect, it } from "vitest";
import { InputSystem } from "./InputSystem";
import { KeyboardState } from "./KeyboardInput";
import { GamepadInput } from "./GamepadInput";

describe("InputSystem", () => {
  it("initializes with default 4-player bindings (2 keyboard, 2 gamepad)", () => {
    const inputSystem = new InputSystem();

    expect(inputSystem.getBinding(0)).toEqual({
      kind: "keyboard",
      layout: "arrows",
    });
    expect(inputSystem.getBinding(1)).toEqual({
      kind: "keyboard",
      layout: "wasd",
    });
    expect(inputSystem.getBinding(2)).toEqual({
      kind: "gamepad",
      gamepadIndex: 0,
    });
    expect(inputSystem.getBinding(3)).toEqual({
      kind: "gamepad",
      gamepadIndex: 1,
    });
  });

  it("enforces single device per slot (cannot bind same device to two slots)", () => {
    const inputSystem = new InputSystem();

    // Slot 0 currently has "arrows"
    expect(inputSystem.getBinding(0)).toEqual({
      kind: "keyboard",
      layout: "arrows",
    });

    // Bind Slot 2 to "arrows"
    inputSystem.bindSlot(2, { kind: "keyboard", layout: "arrows" });

    // Slot 0 should be unbound, Slot 2 has "arrows"
    expect(inputSystem.getBinding(0)).toBeNull();
    expect(inputSystem.getBinding(2)).toEqual({
      kind: "keyboard",
      layout: "arrows",
    });
  });

  it("handles joinDevice and leaveDevice", () => {
    const inputSystem = new InputSystem({
      initialBindings: [],
    });

    // Join Slot 0
    const slot0 = inputSystem.joinDevice({
      kind: "keyboard",
      layout: "arrows",
    });
    expect(slot0).toBe(0);

    // Join Slot 1
    const slot1 = inputSystem.joinDevice({ kind: "keyboard", layout: "wasd" });
    expect(slot1).toBe(1);

    // Join Slot 2 (gamepad 0)
    const slot2 = inputSystem.joinDevice({ kind: "gamepad", gamepadIndex: 0 });
    expect(slot2).toBe(2);

    // Join Slot 3 (gamepad 1)
    const slot3 = inputSystem.joinDevice({ kind: "gamepad", gamepadIndex: 1 });
    expect(slot3).toBe(3);

    // 5th device cannot join (max 4 slots)
    const slot4 = inputSystem.joinDevice({ kind: "gamepad", gamepadIndex: 2 });
    expect(slot4).toBe(-1);

    // Leave device
    const left = inputSystem.leaveDevice({
      kind: "keyboard",
      layout: "arrows",
    });
    expect(left).toBe(true);
    expect(inputSystem.getBinding(0)).toBeNull();

    // Now a new device can join slot 0
    const slotReclaimed = inputSystem.joinDevice({
      kind: "gamepad",
      gamepadIndex: 2,
    });
    expect(slotReclaimed).toBe(0);
  });

  it("performs precise edge detection for action buttons across frames", () => {
    const keyboard = new KeyboardState();
    const inputSystem = new InputSystem({ keyboard });

    // Frame 1: Nothing pressed
    const poll1 = inputSystem.poll();
    expect(poll1.inputs[0].action1).toBe(false);
    expect(poll1.inputs[0].action1Pressed).toBe(false);
    expect(poll1.inputs[0].action1Released).toBe(false);

    // Frame 2: KeyK pressed down (P1 action1)
    keyboard.setKeyDown("KeyK");
    const poll2 = inputSystem.poll();
    expect(poll2.inputs[0].action1).toBe(true);
    expect(poll2.inputs[0].action1Pressed).toBe(true);
    expect(poll2.inputs[0].action1Released).toBe(false);

    // Frame 3: KeyK still held down
    const poll3 = inputSystem.poll();
    expect(poll3.inputs[0].action1).toBe(true);
    expect(poll3.inputs[0].action1Pressed).toBe(false); // Flank was only on frame 2!
    expect(poll3.inputs[0].action1Released).toBe(false);

    // Frame 4: KeyK released
    keyboard.setKeyUp("KeyK");
    const poll4 = inputSystem.poll();
    expect(poll4.inputs[0].action1).toBe(false);
    expect(poll4.inputs[0].action1Pressed).toBe(false);
    expect(poll4.inputs[0].action1Released).toBe(true);
  });

  it("performs edge detection for system pause", () => {
    const keyboard = new KeyboardState();
    const inputSystem = new InputSystem({ keyboard });

    // Frame 1: No pause
    expect(inputSystem.poll().pausePressed).toBe(false);

    // Frame 2: Escape key down
    keyboard.setKeyDown("Escape");
    expect(inputSystem.poll().pausePressed).toBe(true);

    // Frame 3: Escape still held
    expect(inputSystem.poll().pausePressed).toBe(false);

    // Frame 4: Escape released
    keyboard.setKeyUp("Escape");
    expect(inputSystem.poll().pausePressed).toBe(false);
  });

  it("returns neutral input for unbound slots or disconnected gamepads", () => {
    const gamepad = new GamepadInput({
      gamepadProvider: () => [null, null],
    });
    const inputSystem = new InputSystem({
      gamepad,
      initialBindings: [
        { playerIndex: 2, device: { kind: "gamepad", gamepadIndex: 0 } },
      ],
    });

    const poll = inputSystem.poll();
    expect(poll.inputs[0].move).toEqual({ x: 0, y: 0 }); // Unbound slot 0
    expect(poll.inputs[2].move).toEqual({ x: 0, y: 0 }); // Disconnected gamepad on slot 2
    expect(poll.inputs[2].action1).toBe(false);
    expect(poll.inputs[2].action2).toBe(false);
  });
});
