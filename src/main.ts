import "./style.css";
import { Game } from "./game/Game";

function bootstrap(): void {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) {
    document.body.innerHTML = `
      <div style="padding: 20px; color: #ef4444; font-family: sans-serif;">
        <h2>Fehler</h2>
        <p>Das Wurzelelement #app wurde nicht gefunden.</p>
      </div>
    `;
    return;
  }

  try {
    new Game(app);
  } catch (error) {
    app.innerHTML = `
      <div class="bootstrap-error">
        <h2>Fehler beim Spielstart</h2>
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
