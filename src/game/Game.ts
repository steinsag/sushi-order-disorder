import {
  createInitialWorldState,
  setPlayerJoined,
  updateWorldState,
  type WorldState,
} from "../state/WorldState";
import { Renderer } from "../render/Renderer";
import { Overlay } from "../ui/Overlay";
import { GameLoop, type GameLoopOptions } from "./GameLoop";
import { InputSystem, type InputSystemOptions } from "../input/InputSystem";
import type { InputDevice, PlayerIndex } from "../input/PlayerInput";

export interface GameOptions {
  loopOptions?: GameLoopOptions;
  inputOptions?: InputSystemOptions;
}

export class Game {
  private readonly container: HTMLElement;
  private state: WorldState;
  private readonly loop: GameLoop;
  private readonly renderer: Renderer;
  private readonly overlay: Overlay;
  private readonly inputSystem: InputSystem;

  private readonly onResize = (): void => {
    this.renderer.resize();
  };

  constructor(container: HTMLElement, options: GameOptions = {}) {
    this.container = container;
    this.state = createInitialWorldState();

    // Prepare DOM elements inside container
    this.container.classList.add("game-root");

    const canvas = document.createElement("canvas");
    canvas.className = "game-canvas";
    this.container.appendChild(canvas);

    this.renderer = new Renderer(canvas);
    this.inputSystem = new InputSystem(options.inputOptions);

    if (typeof window !== "undefined") {
      this.inputSystem.attach(window);
      window.addEventListener("resize", this.onResize);
    }

    this.overlay = new Overlay(this.container, {
      onStart: () => this.startMatch(),
      onPauseToggle: () => this.togglePause(),
      onReset: () => this.resetToTitle(),
      onRetry: () => this.resetToTitle(),
      onTogglePlayerSlot: (slot) => this.togglePlayerSlot(slot),
    });

    this.loop = new GameLoop(
      (dt) => this.update(dt),
      (alpha) => this.render(alpha),
      options.loopOptions,
    );

    // Initial render
    this.render(0);
    this.loop.start();
  }

  public getState(): Readonly<WorldState> {
    return this.state;
  }

  public getInputSystem(): InputSystem {
    return this.inputSystem;
  }

  public setPlayerJoined(slot: PlayerIndex, joined: boolean): void {
    this.state = setPlayerJoined(this.state, slot, joined);
    this.overlay.render(this.state);
  }

  public togglePlayerSlot(slot: PlayerIndex): void {
    const isJoined = this.state.players[slot].joined;
    const nextJoined = !isJoined;
    if (nextJoined && !this.inputSystem.getBinding(slot)) {
      const defaultDevices: Record<PlayerIndex, InputDevice> = {
        0: { kind: "keyboard", layout: "arrows" },
        1: { kind: "keyboard", layout: "wasd" },
        2: { kind: "gamepad", gamepadIndex: 0 },
        3: { kind: "gamepad", gamepadIndex: 1 },
      };
      this.inputSystem.bindSlot(slot, defaultDevices[slot]);
    }
    this.setPlayerJoined(slot, nextJoined);
  }

  public bindDevice(slot: PlayerIndex, device: InputDevice): void {
    this.inputSystem.bindSlot(slot, device);
    this.setPlayerJoined(slot, true);
  }

  public unbindDevice(slot: PlayerIndex): void {
    this.inputSystem.unbindSlot(slot);
    this.setPlayerJoined(slot, false);
  }

  public startMatch(): void {
    // Preserve joined player states across rounds
    const joinedStates = this.state.players.map((p) => p.joined);
    const hasJoined = joinedStates.some(Boolean);

    const freshState = createInitialWorldState();
    const players = freshState.players.map((p, i) => ({
      ...p,
      joined: hasJoined ? (joinedStates[i] ?? false) : i < 2,
    })) as typeof freshState.players;

    this.state = {
      ...freshState,
      players,
      phase: "running",
    };
    this.inputSystem.reset();
    this.overlay.render(this.state);
  }

  public togglePause(): void {
    if (this.state.phase === "running") {
      this.state = {
        ...this.state,
        phase: "paused",
      };
    } else if (this.state.phase === "paused") {
      this.state = {
        ...this.state,
        phase: "running",
      };
      this.inputSystem.reset();
    }
    this.overlay.render(this.state);
  }

  public resetToTitle(): void {
    this.state = createInitialWorldState();
    this.inputSystem.reset();
    this.overlay.render(this.state);
  }

  public setError(message: string): void {
    this.state = {
      ...this.state,
      phase: "error",
      errorMessage: message,
    };
    this.overlay.render(this.state);
  }

  public update(dt: number): void {
    try {
      const { inputs, pausePressed } = this.inputSystem.poll();

      if (pausePressed) {
        if (this.state.phase === "running" || this.state.phase === "paused") {
          this.togglePause();
          return;
        }
      }

      this.state = updateWorldState(this.state, dt, inputs);
    } catch (err) {
      this.setError(err instanceof Error ? err.message : String(err));
    }
  }

  public render(alpha: number): void {
    try {
      this.renderer.render(this.state, alpha);
      this.overlay.render(this.state);
    } catch (err) {
      this.setError(err instanceof Error ? err.message : String(err));
    }
  }

  public destroy(): void {
    this.loop.stop();
    this.inputSystem.detach();
    if (typeof window !== "undefined") {
      window.removeEventListener("resize", this.onResize);
    }
    this.overlay.destroy();
    this.container.innerHTML = "";
  }
}
