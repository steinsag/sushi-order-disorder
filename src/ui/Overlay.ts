import type { WorldState } from "../state/WorldState";

export interface OverlayCallbacks {
  onStart: () => void;
  onPauseToggle: () => void;
  onReset: () => void;
  onRetry: () => void;
}

export class Overlay {
  private readonly callbacks: OverlayCallbacks;
  private readonly container: HTMLElement;
  private currentHtml = "";

  constructor(root: HTMLElement, callbacks: OverlayCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement("div");
    this.container.className = "ui-overlay";
    root.appendChild(this.container);
  }

  public render(state: WorldState): void {
    let html = "";

    switch (state.phase) {
      case "loading":
        html = `
          <div class="overlay-card loading-card">
            <h2>Lade Sushi Rush...</h2>
            <div class="spinner"></div>
          </div>
        `;
        break;

      case "error":
        html = `
          <div class="overlay-card error-card">
            <h2>⚠️ Fehler aufgetreten</h2>
            <p class="error-msg">${state.errorMessage ?? "Ein unerwarteter Fehler ist aufgetreten."}</p>
            <button id="btn-retry" class="btn btn-primary">Erneut versuchen</button>
          </div>
        `;
        break;

      case "title":
        html = `
          <div class="overlay-card title-card">
            <h1 class="game-title">🍣 Sushi Rush</h1>
            <p class="tagline">Lokales Koop-Kübchen-Chaos (2–4 Spieler)</p>
            <div class="card-actions">
              <button id="btn-start" class="btn btn-primary">Spiel starten</button>
            </div>
            <div class="controls-hint">
              <span>Steuerung: Tastatur (P1: Pfeiltasten, P2: WASD) & Gamepads</span>
            </div>
          </div>
        `;
        break;

      case "paused":
        html = `
          <div class="overlay-card pause-card">
            <h2>⏸️ Spiel Pausiert</h2>
            <div class="card-actions">
              <button id="btn-resume" class="btn btn-primary">Fortsetzen</button>
              <button id="btn-reset" class="btn btn-secondary">Hauptmenü</button>
            </div>
          </div>
        `;
        break;

      case "running":
        html = `
          <div class="hud-bar">
            <button id="btn-pause" class="btn btn-small">Pause</button>
          </div>
        `;
        break;
    }

    if (this.currentHtml !== html) {
      this.currentHtml = html;
      this.container.innerHTML = html;
      this.attachListeners(state.phase);
    }
  }

  public destroy(): void {
    this.container.remove();
  }

  private attachListeners(phase: WorldState["phase"]): void {
    if (phase === "title") {
      this.container
        .querySelector("#btn-start")
        ?.addEventListener("click", () => this.callbacks.onStart());
    } else if (phase === "running") {
      this.container
        .querySelector("#btn-pause")
        ?.addEventListener("click", () => this.callbacks.onPauseToggle());
    } else if (phase === "paused") {
      this.container
        .querySelector("#btn-resume")
        ?.addEventListener("click", () => this.callbacks.onPauseToggle());
      this.container
        .querySelector("#btn-reset")
        ?.addEventListener("click", () => this.callbacks.onReset());
    } else if (phase === "error") {
      this.container
        .querySelector("#btn-retry")
        ?.addEventListener("click", () => this.callbacks.onRetry());
    }
  }
}
