import type { WorldState } from "../state/WorldState";
import type { PlayerIndex } from "../input/PlayerInput";
import { INGREDIENT_METADATA } from "../rules/IngredientConfig";
import { getRecipeDefinition } from "../rules/RecipeConfig";
import { calculateShiftRating } from "../rules/ShiftConfig";
import { i18n } from "../i18n";

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
  private lastState: WorldState | null = null;
  private readonly onLanguageChanged = (): void => {
    this.currentHtml = "";
    if (this.lastState) this.render(this.lastState);
  };

  constructor(root: HTMLElement, callbacks: OverlayCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement("div");
    this.container.className = "ui-overlay";
    root.appendChild(this.container);
    i18n.on("languageChanged", this.onLanguageChanged);
  }

  public render(state: WorldState): void {
    this.lastState = state;
    const t = i18n.t.bind(i18n);
    let html = "";

    switch (state.phase) {
      case "loading":
        html = `
          <div class="overlay-card loading-card">
            <h2>${t("loading")}</h2>
            <div class="spinner"></div>
          </div>
        `;
        break;

      case "error":
        html = `
          <div class="overlay-card error-card">
            <h2>⚠️ ${t("error.heading")}</h2>
            <p class="error-msg">${state.errorMessage ?? t("error.unexpected")}</p>
            <button id="btn-retry" class="btn btn-primary">${t("error.retry")}</button>
          </div>
        `;
        break;

      case "title": {
        const p1Joined = state.players[0].joined;
        const p2Joined = state.players[1].joined;
        const p3Joined = state.players[2].joined;
        const p4Joined = state.players[3].joined;
        const currentLanguage = i18n.resolvedLanguage === "de" ? "de" : "en";

        html = `
          <div class="overlay-card title-card">
            <div class="language-switch" role="group" aria-label="${t("language.label")}">
              <button type="button" class="language-option" data-language="en" aria-label="${t("language.english")}" aria-pressed="${currentLanguage === "en"}">🇬🇧 <span>EN</span></button>
              <button type="button" class="language-option" data-language="de" aria-label="${t("language.german")}" aria-pressed="${currentLanguage === "de"}">🇩🇪 <span>DE</span></button>
            </div>
            <h1 class="game-title">🍣 Sushi Order Disorder</h1>
            <p class="tagline">${t("menu.tagline")}</p>

            <div class="players-setup">
              <div class="player-slot ${p1Joined ? "active" : "inactive"}" data-slot="0">
                <span class="badge p1-badge">P1</span>
                <span class="slot-desc">${t("menu.arrows")}</span>
                <button class="btn-slot-toggle ${p1Joined ? "active" : ""}" data-slot="0">
                  ${t(p1Joined ? "menu.joined" : "menu.join")}
                </button>
              </div>

              <div class="player-slot ${p2Joined ? "active" : "inactive"}" data-slot="1">
                <span class="badge p2-badge">P2</span>
                <span class="slot-desc">${t("menu.wasd")}</span>
                <button class="btn-slot-toggle ${p2Joined ? "active" : ""}" data-slot="1">
                  ${t(p2Joined ? "menu.joined" : "menu.join")}
                </button>
              </div>

              <div class="player-slot ${p3Joined ? "active" : "inactive"}" data-slot="2">
                <span class="badge p3-badge">P3</span>
                <span class="slot-desc">${t("menu.gamepad", { number: 1 })}</span>
                <button class="btn-slot-toggle ${p3Joined ? "active" : ""}" data-slot="2">
                  ${t(p3Joined ? "menu.joined" : "menu.join")}
                </button>
              </div>

              <div class="player-slot ${p4Joined ? "active" : "inactive"}" data-slot="3">
                <span class="badge p4-badge">P4</span>
                <span class="slot-desc">${t("menu.gamepad", { number: 2 })}</span>
                <button class="btn-slot-toggle ${p4Joined ? "active" : ""}" data-slot="3">
                  ${t(p4Joined ? "menu.joined" : "menu.join")}
                </button>
              </div>
            </div>

            <div class="card-actions">
              <button id="btn-start" class="btn btn-primary">${t("menu.start")}</button>
            </div>
            <div class="controls-hint">
              <span>${t("menu.pauseHint")}</span>
            </div>
          </div>
        `;
        break;
      }

      case "paused":
        html = `
          <div class="overlay-card pause-card">
            <h2>⏸️ ${t("pause.heading")}</h2>
            <div class="card-actions">
              <button id="btn-resume" class="btn btn-primary">${t("pause.resume")}</button>
              <button id="btn-reset" class="btn btn-secondary">${t("summary.mainMenu")}</button>
            </div>
          </div>
        `;
        break;

      case "completed": {
        const scoreState = state.scoreState;
        const rating = calculateShiftRating(scoreState);
        const ratingKey = `ratings.${rating.stars}`;
        const totalOrders = scoreState.completedOrders;
        const onTime = scoreState.onTimeOrders;
        const late = scoreState.lateOrders;
        const wrong = scoreState.wrongDeliveries;

        html = `
          <div class="overlay-card summary-card">
            <h1 class="summary-title">🏁 ${t("summary.heading")}</h1>
            <div class="rating-box">
              <div class="rating-title">${"⭐".repeat(rating.stars)} ${t(`${ratingKey}.title`)}</div>
              <p class="rating-description">${t(`${ratingKey}.description`)}</p>
            </div>

            <div class="summary-stats-grid">
              <div class="stat-box stat-highlight">
                <span class="stat-label">🏆 ${t("summary.totalScore")}</span>
                <span class="stat-value">${scoreState.totalScore}</span>
              </div>
              <div class="stat-box">
                <span class="stat-label">✅ ${t("summary.onTime")}</span>
                <span class="stat-value">${onTime}</span>
              </div>
              <div class="stat-box">
                <span class="stat-label">⏳ ${t("summary.late")}</span>
                <span class="stat-value">${late}</span>
              </div>
              <div class="stat-box">
                <span class="stat-label">❌ ${t("summary.wrong")}</span>
                <span class="stat-value">${wrong}</span>
              </div>
              <div class="stat-box">
                <span class="stat-label">📦 ${t("summary.totalOrders")}</span>
                <span class="stat-value">${totalOrders}</span>
              </div>
            </div>

            <div class="card-actions">
              <button id="btn-restart" class="btn btn-primary">${t("summary.restart")}</button>
              <button id="btn-menu" class="btn btn-secondary">${t("summary.mainMenu")}</button>
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
                    <span class="recipe-ingredient-tag" title="${t(`ingredients.${ing}`)}">
                      <span class="ing-emoji">${meta.emoji}</span>
                      <span class="ing-label">${t(`ingredients.${ing}`)}</span>
                    </span>
                  `;
                })
                .join("");

              return `
                <div class="recipe-card ${isExpired ? "card-expired" : ""} ${order.isExpress ? "card-express" : ""}" data-order-id="${order.id}">
                  <div class="recipe-card-header">
                    <span class="recipe-title">${recipe.emoji} ${t(`recipes.${recipe.id}`)}</span>
                    ${order.isExpress ? `<span class="express-badge">⚡ ${t("hud.express")}</span>` : ""}
                  </div>
                  <div class="recipe-ingredients-list">
                    ${ingredientsHtml}
                  </div>
                  <div class="recipe-timer-wrapper">
                    <div class="recipe-timer-bar">
                      <div class="recipe-timer-fill ${timeClass}" style="width: ${pct}%;"></div>
                    </div>
                    <span class="recipe-timer-text ${timeClass}">
                      ${isExpired ? t("hud.expired") : `${Math.ceil(order.timeRemaining)}s`}
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
              <span class="banner-text">${t("hud.pendingOrder")}</span>
            </div>
          `;
        } else {
          ordersHtml = `
            <div class="pending-order-banner empty-banner">
              <span class="banner-text">${t("hud.waiting")}</span>
            </div>
          `;
        }

        // 2. Render player status badges
        const joinedPlayersHtml = state.players
          .map((p) => {
            if (!p.joined) return "";
            let itemText = t("hud.empty");
            if (p.carriedItem) {
              if (p.carriedItem.type === "plate") {
                const r = getRecipeDefinition(p.carriedItem.recipeId);
                itemText = `${r.emoji} ${t(`recipes.${r.id}`)}`;
              } else {
                const ing = INGREDIENT_METADATA[p.carriedItem.ingredient];
                itemText = `${ing.emoji} ${t(`ingredients.${p.carriedItem.ingredient}`)}`;
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
        const feedbackRecipe =
          feedback && getRecipeDefinition(feedback.recipeId);
        const feedbackText =
          feedback && feedbackRecipe
            ? t(`feedback.${feedback.type}`, {
                prefix:
                  feedback.isExpress && feedback.type === "success"
                    ? "⚡ "
                    : "",
                emoji: feedbackRecipe.emoji,
                recipe: t(`recipes.${feedback.recipeId}`),
                points: Math.abs(feedback.scoreDelta),
              })
            : "";
        const feedbackHtml = feedback
          ? `<div class="hud-delivery-toast feedback-${feedback.type}">
              <span class="toast-text">${feedbackText}</span>
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
                  <span class="score-label">${t("hud.score")}</span>
                </div>
              </div>
              ${feedbackHtml}
            </div>
            <div class="hud-controls">
              <button id="btn-pause" class="btn btn-small">${t("pause.button")}</button>
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
    i18n.off("languageChanged", this.onLanguageChanged);
    this.container.remove();
  }

  private attachListeners(phase: WorldState["phase"]): void {
    if (phase === "title") {
      this.container.querySelectorAll(".language-option").forEach((button) => {
        button.addEventListener("click", (event) => {
          const language = (event.currentTarget as HTMLElement).dataset
            .language;
          if (language === "en" || language === "de") {
            void i18n.changeLanguage(language);
          }
        });
      });
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
