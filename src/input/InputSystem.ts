import {
  type InputDevice,
  type PlayerBinding,
  type PlayerIndex,
  type PlayerInput,
  MAX_PLAYERS,
  areDevicesEqual,
  createNeutralPlayerInput,
} from "./PlayerInput";
import { KeyboardState } from "./KeyboardInput";
import { GamepadInput, type GamepadProvider } from "./GamepadInput";

export interface InputSystemOptions {
  keyboard?: KeyboardState;
  gamepad?: GamepadInput;
  gamepadProvider?: GamepadProvider;
  deadzone?: number;
  initialBindings?: PlayerBinding[];
}

export interface PollResult {
  inputs: [PlayerInput, PlayerInput, PlayerInput, PlayerInput];
  pausePressed: boolean;
}

export class InputSystem {
  public readonly keyboard: KeyboardState;
  public readonly gamepad: GamepadInput;

  private readonly bindings: (InputDevice | null)[] = [null, null, null, null];
  private readonly previousRawActions: {
    action1: boolean;
    action2: boolean;
  }[] = [
    { action1: false, action2: false },
    { action1: false, action2: false },
    { action1: false, action2: false },
    { action1: false, action2: false },
  ];
  private previousPauseState = false;

  constructor(options: InputSystemOptions = {}) {
    this.keyboard = options.keyboard ?? new KeyboardState();
    this.gamepad =
      options.gamepad ??
      new GamepadInput({
        deadzone: options.deadzone,
        gamepadProvider: options.gamepadProvider,
      });

    if (options.initialBindings) {
      for (const b of options.initialBindings) {
        this.bindSlot(b.playerIndex, b.device);
      }
    } else {
      // Default 4-player configuration: P1 & P2 keyboard, P3 & P4 gamepads
      this.bindSlot(0, { kind: "keyboard", layout: "arrows" });
      this.bindSlot(1, { kind: "keyboard", layout: "wasd" });
      this.bindSlot(2, { kind: "gamepad", gamepadIndex: 0 });
      this.bindSlot(3, { kind: "gamepad", gamepadIndex: 1 });
    }
  }

  public attach(
    target: (Window & typeof globalThis) | HTMLElement = window,
  ): void {
    this.keyboard.attach(target);
  }

  public detach(): void {
    this.keyboard.detach();
  }

  public getBinding(slot: PlayerIndex): InputDevice | null {
    return this.bindings[slot] ?? null;
  }

  public getBindings(): PlayerBinding[] {
    const result: PlayerBinding[] = [];
    for (let i = 0; i < MAX_PLAYERS; i++) {
      const device = this.bindings[i];
      if (device) {
        result.push({ playerIndex: i as PlayerIndex, device });
      }
    }
    return result;
  }

  /**
   * Binds a device to a player slot.
   * If the device was already bound to another slot, it is unbound from the old slot
   * ensuring no device is bound to multiple slots at the same time.
   */
  public bindSlot(slot: PlayerIndex, device: InputDevice): void {
    // Check if another slot has this device
    for (let i = 0; i < MAX_PLAYERS; i++) {
      if (
        i !== slot &&
        this.bindings[i] &&
        areDevicesEqual(this.bindings[i]!, device)
      ) {
        this.bindings[i] = null;
        this.previousRawActions[i] = { action1: false, action2: false };
      }
    }
    this.bindings[slot] = device;
    this.previousRawActions[slot] = { action1: false, action2: false };
  }

  public unbindSlot(slot: PlayerIndex): void {
    this.bindings[slot] = null;
    this.previousRawActions[slot] = { action1: false, action2: false };
  }

  public findSlotForDevice(device: InputDevice): PlayerIndex | -1 {
    for (let i = 0; i < MAX_PLAYERS; i++) {
      const current = this.bindings[i];
      if (current && areDevicesEqual(current, device)) {
        return i as PlayerIndex;
      }
    }
    return -1;
  }

  /**
   * Automatically joins a device into the first available slot.
   * Returns the assigned slot index or -1 if all 4 slots are occupied.
   */
  public joinDevice(device: InputDevice): PlayerIndex | -1 {
    const existingSlot = this.findSlotForDevice(device);
    if (existingSlot !== -1) {
      return existingSlot;
    }

    for (let i = 0; i < MAX_PLAYERS; i++) {
      if (this.bindings[i] === null) {
        this.bindSlot(i as PlayerIndex, device);
        return i as PlayerIndex;
      }
    }
    return -1;
  }

  public leaveDevice(device: InputDevice): boolean {
    const slot = this.findSlotForDevice(device);
    if (slot !== -1) {
      this.unbindSlot(slot);
      return true;
    }
    return false;
  }

  public poll(): PollResult {
    const inputs: [PlayerInput, PlayerInput, PlayerInput, PlayerInput] = [
      createNeutralPlayerInput(),
      createNeutralPlayerInput(),
      createNeutralPlayerInput(),
      createNeutralPlayerInput(),
    ];

    for (let i = 0; i < MAX_PLAYERS; i++) {
      const device = this.bindings[i];
      if (!device) {
        this.previousRawActions[i] = { action1: false, action2: false };
        continue;
      }

      let raw = { move: { x: 0, y: 0 }, action1: false, action2: false };
      if (device.kind === "keyboard") {
        raw = this.keyboard.getRawInput(device.layout);
      } else if (device.kind === "gamepad") {
        raw = this.gamepad.getRawInput(device.gamepadIndex);
      }

      const prev = this.previousRawActions[i];
      const action1Pressed = raw.action1 && !prev.action1;
      const action2Pressed = raw.action2 && !prev.action2;
      const action1Released = !raw.action1 && prev.action1;
      const action2Released = !raw.action2 && prev.action2;

      this.previousRawActions[i] = {
        action1: raw.action1,
        action2: raw.action2,
      };

      inputs[i] = {
        move: raw.move,
        action1: raw.action1,
        action2: raw.action2,
        action1Pressed,
        action2Pressed,
        action1Released,
        action2Released,
      };
    }

    // Process system pause signal with edge detection
    const rawPause =
      this.keyboard.isPauseRequested() || this.gamepad.isPauseRequested();
    const pausePressed = rawPause && !this.previousPauseState;
    this.previousPauseState = rawPause;

    return { inputs, pausePressed };
  }

  public reset(): void {
    this.keyboard.clear();
    for (let i = 0; i < MAX_PLAYERS; i++) {
      this.previousRawActions[i] = { action1: false, action2: false };
    }
    this.previousPauseState = false;
  }
}
