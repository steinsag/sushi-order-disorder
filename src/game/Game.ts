import {
  createInitialWorldState,
  updateWorldState,
  type WorldState,
} from "../state/WorldState";
import { Renderer } from "../render/Renderer";
import { Overlay } from "../ui/Overlay";
import { GameLoop, type GameLoopOptions } from "./GameLoop";

export interface GameOptions {
  loopOptions?: GameLoopOptions;
}

export class Game {
  private readonly container: HTMLElement;
  private state: WorldState;
  private readonly loop: GameLoop;
  private readonly renderer: Renderer;
  private readonly overlay: Overlay;
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

    this.overlay = new Overlay(this.container, {
      onStart: () => this.startMatch(),
      onPauseToggle: () => this.togglePause(),
      onReset: () => this.resetToTitle(),
      onRetry: () => this.resetToTitle(),
    });

    this.loop = new GameLoop(
      (dt) => this.update(dt),
      (alpha) => this.render(alpha),
      options.loopOptions,
    );

    if (typeof window !== "undefined") {
      window.addEventListener("resize", this.onResize);
    }

    // Initial render
    this.render(0);
    this.loop.start();
  }

  public getState(): Readonly<WorldState> {
    return this.state;
  }

  public startMatch(): void {
    this.state = {
      ...this.state,
      phase: "running",
    };
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
    }
    this.overlay.render(this.state);
  }

  public resetToTitle(): void {
    this.state = createInitialWorldState();
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
      this.state = updateWorldState(this.state, dt);
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
    if (typeof window !== "undefined") {
      window.removeEventListener("resize", this.onResize);
    }
    this.overlay.destroy();
    this.container.innerHTML = "";
  }
}
