import "./style.css";
import { Game } from "./game/Game";
import { i18n } from "./i18n";

function bootstrap(): void {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) {
    document.body.innerHTML = `
      <div style="padding: 20px; color: #ef4444; font-family: sans-serif;">
        <h2>${i18n.t("error.heading")}</h2>
        <p>${i18n.t("error.missingRoot")}</p>
      </div>
    `;
    return;
  }

  try {
    new Game(app);
  } catch (error) {
    app.innerHTML = `
      <div class="bootstrap-error">
        <h2>${i18n.t("error.startup")}</h2>
        <p>${error instanceof Error ? error.message : String(error)}</p>
      </div>
    `;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
