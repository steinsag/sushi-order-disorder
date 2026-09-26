import type { WorldState } from "../state/WorldState";
import type { PlayerIndex } from "../input/PlayerInput";

export interface OverlayCallbacks {
  onStart: () => void;
  onPauseToggle: () => void;
  onReset: () => void;
  onRetry: () => void;
  onTogglePlayerSlot?: (slot: PlayerIndex) => void;
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

      case "title": {
        const p1Joined = state.players[0].joined;
        const p2Joined = state.players[1].joined;
        const p3Joined = state.players[2].joined;
        const p4Joined = state.players[3].joined;

        html = `
          <div class="overlay-card title-card">
            <h1 class="game-title">🍣 Sushi Rush</h1>
            <p class="tagline">Lokales Koop-Küchen-Chaos (2–4 Spieler)</p>

            <div class="players-setup">
              <div class="player-slot ${p1Joined ? "active" : "inactive"}" data-slot="0">
                <span class="badge p1-badge">P1</span>
                <span class="slot-desc">Pfeiltasten (K: Akt1, L: Akt2)</span>
                <button class="btn-slot-toggle ${p1Joined ? "active" : ""}" data-slot="0">
                  ${p1Joined ? "Dabei" : "Beitreten"}
                </button>
              </div>

              <div class="player-slot ${p2Joined ? "active" : "inactive"}" data-slot="1">
                <span class="badge p2-badge">P2</span>
                <span class="slot-desc">WASD (F: Akt1, G: Akt2)</span>
                <button class="btn-slot-toggle ${p2Joined ? "active" : ""}" data-slot="1">
                  ${p2Joined ? "Dabei" : "Beitreten"}
                </button>
              </div>

              <div class="player-slot ${p3Joined ? "active" : "inactive"}" data-slot="2">
                <span class="badge p3-badge">P3</span>
                <span class="slot-desc">Gamepad 1 (A: Akt1, B: Akt2)</span>
                <button class="btn-slot-toggle ${p3Joined ? "active" : ""}" data-slot="2">
                  ${p3Joined ? "Dabei" : "Beitreten"}
                </button>
              </div>

              <div class="player-slot ${p4Joined ? "active" : "inactive"}" data-slot="3">
                <span class="badge p4-badge">P4</span>
                <span class="slot-desc">Gamepad 2 (A: Akt1, B: Akt2)</span>
                <button class="btn-slot-toggle ${p4Joined ? "active" : ""}" data-slot="3">
                  ${p4Joined ? "Dabei" : "Beitreten"}
                </button>
              </div>
            </div>

            <div class="card-actions">
              <button id="btn-start" class="btn btn-primary">Spiel starten</button>
            </div>
            <div class="controls-hint">
              <span>Pause: Esc / P / Gamepad Start</span>
            </div>
          </div>
        `;
        break;
      }

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
            <button id="btn-pause" class="btn btn-small">Pause (Esc)</button>
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

      this.container.querySelectorAll(".btn-slot-toggle").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const target = e.currentTarget as HTMLElement;
          const slot = Number(target.dataset.slot) as PlayerIndex;
          this.callbacks.onTogglePlayerSlot?.(slot);
        });
      });
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
