import type { WorldState } from "../state/WorldState";
import type { PlayerIndex } from "../input/PlayerInput";
import { INGREDIENT_METADATA } from "../rules/IngredientConfig";
import { getRecipeDefinition } from "../rules/RecipeConfig";
import { calculateShiftRating } from "../rules/ShiftConfig";

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
            <h2>Lade Sushi Order Disorder...</h2>
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
            <h1 class="game-title">🍣 Sushi Order Disorder</h1>
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

      case "completed": {
        const scoreState = state.scoreState;
        const rating = calculateShiftRating(scoreState);
        const totalOrders = scoreState.completedOrders;
        const onTime = scoreState.onTimeOrders;
        const late = scoreState.lateOrders;
        const wrong = scoreState.wrongDeliveries;

        html = `
          <div class="overlay-card summary-card">
            <h1 class="summary-title">🏁 Schicht beendet!</h1>
            <div class="rating-box">
              <div class="rating-title">${rating.title}</div>
              <p class="rating-description">${rating.description}</p>
            </div>

            <div class="summary-stats-grid">
              <div class="stat-box stat-highlight">
                <span class="stat-label">🏆 Gesamtpunkte</span>
                <span class="stat-value">${scoreState.totalScore}</span>
              </div>
              <div class="stat-box">
                <span class="stat-label">✅ Pünktlich geliefert</span>
                <span class="stat-value">${onTime}</span>
              </div>
              <div class="stat-box">
                <span class="stat-label">⏳ Verspätet geliefert</span>
                <span class="stat-value">${late}</span>
              </div>
              <div class="stat-box">
                <span class="stat-label">❌ Falsche Lieferungen</span>
                <span class="stat-value">${wrong}</span>
              </div>
              <div class="stat-box">
                <span class="stat-label">📦 Bestellungen gesamt</span>
                <span class="stat-value">${totalOrders}</span>
              </div>
            </div>

            <div class="card-actions">
              <button id="btn-restart" class="btn btn-primary">Neue Schicht starten</button>
              <button id="btn-menu" class="btn btn-secondary">Hauptmenü</button>
            </div>
          </div>
        `;
        break;
      }

      case "running": {
        // 1. Render active orders & recipe cards
        let ordersHtml: string;
        if (state.activeOrders && state.activeOrders.length > 0) {
          ordersHtml = state.activeOrders
            .map((order) => {
              const recipe = getRecipeDefinition(order.recipeId);
              const pct = Math.max(
                0,
                Math.min(100, (order.timeRemaining / order.totalTime) * 100),
              );
              const isUrgent = order.timeRemaining <= 10;
              const isExpired =
                order.status === "expired" || order.timeRemaining <= 0;
              const timeClass = isExpired
                ? "time-expired"
                : isUrgent
                  ? "time-urgent"
                  : "time-normal";

              const ingredientsHtml = recipe.ingredients
                .map((ing) => {
                  const meta = INGREDIENT_METADATA[ing];
                  return `
                    <span class="recipe-ingredient-tag" title="${meta.label}">
                      <span class="ing-emoji">${meta.emoji}</span>
                      <span class="ing-label">${meta.label}</span>
                    </span>
                  `;
                })
                .join("");

              return `
                <div class="recipe-card ${isExpired ? "card-expired" : ""} ${order.isExpress ? "card-express" : ""}" data-order-id="${order.id}">
                  <div class="recipe-card-header">
                    <span class="recipe-title">${recipe.emoji} ${recipe.name}</span>
                    ${order.isExpress ? '<span class="express-badge">⚡ Express</span>' : ""}
                  </div>
                  <div class="recipe-ingredients-list">
                    ${ingredientsHtml}
                  </div>
                  <div class="recipe-timer-wrapper">
                    <div class="recipe-timer-bar">
                      <div class="recipe-timer-fill ${timeClass}" style="width: ${pct}%;"></div>
                    </div>
                    <span class="recipe-timer-text ${timeClass}">
                      ${isExpired ? "Abgelaufen" : `${Math.ceil(order.timeRemaining)}s`}
                    </span>
                  </div>
                </div>
              `;
            })
            .join("");
        } else if (state.orderStation?.pendingOrder) {
          ordersHtml = `
            <div class="pending-order-banner">
              <span class="bell-icon">🛎️</span>
              <span class="banner-text">Neue Bestellung an der Bestellannahme bereit! (Akt1)</span>
            </div>
          `;
        } else {
          ordersHtml = `
            <div class="pending-order-banner empty-banner">
              <span class="banner-text">Warte auf Gäste...</span>
            </div>
          `;
        }

        // 2. Render player status badges
        const joinedPlayersHtml = state.players
          .map((p) => {
            if (!p.joined) return "";
            let itemText = "leer";
            if (p.carriedItem) {
              if (p.carriedItem.type === "plate") {
                const r = getRecipeDefinition(p.carriedItem.recipeId);
                itemText = `${r.emoji} ${r.name}`;
              } else {
                const ing = INGREDIENT_METADATA[p.carriedItem.ingredient];
                itemText = `${ing.emoji} ${ing.label}`;
              }
            }
            return `
              <div class="hud-player-badge" style="border-left: 3px solid ${p.color};">
                <span class="hud-player-name" style="color: ${p.color};">P${p.id + 1}:</span>
                <span class="hud-player-item">${itemText}</span>
              </div>
            `;
          })
          .join("");

        // 3. Render delivery feedback toast if active
        const feedback = state.scoreState?.recentFeedback;
        const feedbackHtml = feedback
          ? `<div class="hud-delivery-toast feedback-${feedback.type}">
              <span class="toast-text">${feedback.message}</span>
            </div>`
          : "";

        const shiftTimeRemaining = state.shift ? state.shift.timeRemaining : 0;
        const shiftMinutes = Math.floor(shiftTimeRemaining / 60);
        const shiftSeconds = Math.floor(shiftTimeRemaining % 60);
        const shiftFormatted = `${shiftMinutes}:${shiftSeconds < 10 ? "0" : ""}${shiftSeconds}`;
        const isShiftLow = shiftTimeRemaining <= 20;

        html = `
          <div class="hud-top-bar">
            <div class="hud-orders-container">
              ${ordersHtml}
            </div>
            <div class="hud-center-container">
              <div class="hud-badges-group">
                <div class="hud-shift-badge ${isShiftLow ? "time-low" : ""}">
                  <span class="timer-icon">⏱️</span>
                  <span class="shift-timer-value">${shiftFormatted}</span>
                </div>
                <div class="hud-score-badge">
                  <span class="score-icon">🏆</span>
                  <span class="score-value">${state.scoreState?.totalScore ?? 0}</span>
                  <span class="score-label">Punkte</span>
                </div>
              </div>
              ${feedbackHtml}
            </div>
            <div class="hud-controls">
              <button id="btn-pause" class="btn btn-small">Pause (Esc)</button>
            </div>
          </div>
          <div class="hud-bottom-bar">
            <div class="hud-players-list">
              ${joinedPlayersHtml}
            </div>
          </div>
        `;
        break;
      }
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
    } else if (phase === "completed") {
      this.container
        .querySelector("#btn-restart")
        ?.addEventListener("click", () => this.callbacks.onStart());
      this.container
        .querySelector("#btn-menu")
        ?.addEventListener("click", () => this.callbacks.onReset());
    } else if (phase === "error") {
      this.container
        .querySelector("#btn-retry")
        ?.addEventListener("click", () => this.callbacks.onRetry());
    }
  }
}
