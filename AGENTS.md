# AGENTS.md — Technische Grundlage (lokales 2.5D-Browser-Coop-Spiel)

**Wichtiger Hinweis:** Diese Datei dokumentiert **ausschließlich** die technische Grundlage/Architektur.  
**Alle Spielregeln, Inhalte, Ziele und die Spielbeschreibung stehen ausschließlich in `README.md`.**  
Wenn du wissen willst, *worum es im Spiel geht* oder *wie es gespielt wird*, lies **nur** `README.md`.

---

## Stack & Rahmenbedingungen

- **Build/Dev:** Vite
- **Sprache:** TypeScript
- **Rendering:** HTML **`<canvas>`** mit 2D-Context und Sprite-basiertem 2.5D-Look
- **Darstellung:** 2D-Sprites, Ebenen und Tiefensortierung erzeugen räumliche Wirkung; keine Echtzeit-3D-Geometrie als Voraussetzung
- **Assets:** Sprite-Bilder und optionale Sprite-Sheets/Atlanten liegen als Projektassets vor und werden zentral geladen
- **Input:** Browser **Gamepad API** + Tastatur
- **Spieler:** maximal **4** lokale Spieler
- **Bewegung:** frei & flüssig in 2D inkl. **Diagonalbewegung**  
  - **keine** Raster-/Schachbrettbewegung
  - Bewegungsachsen werden normalisiert (konstante Geschwindigkeit auch diagonal)
- **Controls pro Spieler:**
  - **4 Bewegungsrichtungen** (als 2D-Vektor)
  - **2 Aktionstasten** (z. B. `action1`, `action2`)
  - Eingabequelle je Spieler: **Gamepad oder Keyboard**

---

## Projektstruktur (Vorschlag)

> Ziel: klar getrennte Module für Loop, Input, Welt/Entities und Rendering.

Beispielhafte Ordner:

- `src/`
  - `main.ts` (Bootstrap: Canvas, Game instantiieren, Start)
  - `game/`
    - `Game.ts` (Orchestrierung, Game Loop, Update/Render)
    - `Time.ts` (Delta-Time, Fixed/Variable Timestep optional)
  - `input/`
    - `InputSystem.ts` (Polling, Device-Zuordnung, Aggregation)
    - `GamepadInput.ts` (navigator.getGamepads, Deadzone, Mapping)
    - `KeyboardInput.ts` (Key-Events, State)
    - `Mappings.ts` (Konfiguration: Tasten/Buttons/Achsen)
  - `state/`
    - `PlayerState.ts` (Position, Velocity, Actions, Device Binding)
    - `WorldState.ts` (Sammlung Entities/Spieler, globale Daten)
  - `render/`
    - `Renderer.ts` (Canvas-Rendering und Szenenaufbau; keine Game-Logik)
    - `SpriteRenderer.ts` (Sprites, Ankerpunkte, Animationen und Tiefensortierung)
    - `AssetLoader.ts` (zentraler, asynchroner Bild-/Sprite-Loader)
    - `Camera.ts` (Viewport, Skalierung und optionaler Welt-/Bildschirm-Transform)
  - `assets/`
    - `sprites/` (Figuren, Umgebung und weitere Bildressourcen)
    - `spritesheet/` (optional: Atlanten und zugehörige Metadaten)
  - `math/`
    - `Vec2.ts` (Vektorrechnung, Normalisierung)
    - `Clamp.ts`, `Deadzone.ts`

---

## Kernprinzipien

### 1) Update/Render-Trennung

- **Update**:
  - Input lesen (abstrahiert), Spielerzustände ändern
  - Physik/Bewegung (Positionsintegration) durchführen
  - Kollisionen *technisch* möglich, aber **keine** Regeln/Inhalte hier dokumentieren
- **Render**:
  - aktuellen Zustand als Sprite-Szene zeichnen (Canvas 2D API)
  - Renderobjekte anhand ihrer Boden-/Fußposition oder eines expliziten Tiefenwerts sortieren
  - keine Spielzustände ändern (außer debug overlays)

### 2.5D-Sprite-Darstellung

- Die Spielwelt bleibt technisch zweidimensional; räumliche Wirkung entsteht durch Sprite-Art, Überlagerung, Größen-/Ebenenwirkung und Tiefensortierung.
- Figuren und Objekte werden als Bildressourcen gerendert. Platzhalter-Kreise sind nur für Debug-Overlays zulässig, nicht als reguläre Spieldarstellung.
- Trenne Weltkoordinaten von Bildschirmkoordinaten. Die Kamera übernimmt Skalierung und Viewport-Transform; Spiellogik und Kollisionen bleiben in Weltkoordinaten.
- Verankere bewegliche Sprites an einer definierten Boden-/Fußposition. Die Position im Weltzustand repräsentiert diesen Anker, damit sichtbare Sprite-Höhe die Bewegung und Sortierung nicht verfälscht.
- Sortiere Renderobjekte stabil nach Bodenposition/Tiefenwert, damit Figuren vor oder hinter passenden Szenenobjekten gezeichnet werden. Verwende bei Gleichstand eine deterministische Zusatzreihenfolge.
- Sprite-Größe, Ankerpunkt, Animation-Frames und Tiefeninformation gehören in Render-Metadaten und dürfen den Gameplay-Zustand nicht unnötig vermischen.
- Lade Assets zentral und asynchron. Der Renderer muss mit einem neutralen Ladezustand umgehen können, bis benötigte Bilder verfügbar sind.
- Begrenze Bildglättung und Skalierung konsistent mit der gewählten Sprite-Art; die konkrete Stilentscheidung und Motive sind Spielinhalt, keine Architekturvorgabe.

### 2) Game Loop

- `requestAnimationFrame` als Haupttreiber
- Delta-Time (`dt`) in Sekunden
- Optional: Fixed timestep (z. B. 60 Hz) für deterministischere Updates

Minimalform:

```ts
type UpdateFn = (dt: number) => void;
type RenderFn = (alpha?: number) => void;

class Game {
  private last = 0;

  constructor(
    private readonly update: UpdateFn,
    private readonly render: RenderFn
  ) {}

  start() {
    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - this.last) / 1000); // clamp gegen große Sprünge
      this.last = t;

      this.update(dt);
      this.render();

      requestAnimationFrame(tick);
    };
    requestAnimationFrame((t) => {
      this.last = t;
      tick(t);
    });
  }
}
```

---

## Input-Abstraktion (pro Spieler, 4 Slots)

### Datenmodell: „Spieler-Input“ als Output der Abstraktion

Der Rest des Spiels sollte **nicht** wissen, ob ein Spieler per Gamepad oder Keyboard spielt.

```ts
export interface PlayerInput {
  /** Normalisierter Bewegungsvektor: Länge <= 1 */
  move: { x: number; y: number };
  action1: boolean;
  action2: boolean;
}
```

> Empfehlung: pro Frame einen **Snapshot** erzeugen (immutable), damit Update-Logik stabil bleibt.

### Spieler-Slot & Device-Binding

- Slots: `playerIndex` 0–3
- Jeder Slot hat genau **eine** aktive Eingabequelle:
  - `keyboard` (z. B. nur für Spieler 1 oder konfigurierbar)
  - `gamepad` mit `gamepadIndex` (0–3, wie vom Browser bereitgestellt)

```ts
export type InputDevice =
  | { kind: "keyboard" }
  | { kind: "gamepad"; gamepadIndex: number };

export interface PlayerBinding {
  playerIndex: 0 | 1 | 2 | 3;
  device: InputDevice;
}
```

**Zuordnungsidee (technisch, ohne Spielregeln):**
- Bei erstem Tastendruck: Keyboard an einen freien Slot binden (optional fix auf Slot 0).
- Bei erstem Gamepad-Input (Button/Achse über Schwellwert): dieses Gamepad an freien Slot binden.
- Reconnect/Disconnect handhaben: `gamepadconnected`/`gamepaddisconnected` Events können unterstützend genutzt werden, **Polling bleibt dennoch die Quelle**.

---

## Gamepad-Polling (navigator.getGamepads)

### Warum Polling?

- `navigator.getGamepads()` liefert den aktuellen State der angeschlossenen Gamepads.
- Polling pro Frame ist üblich und zuverlässig (insbesondere für Achsen).

Minimal:

```ts
function pollGamepads(): (Gamepad | null)[] {
  // In manchen Browsern ist das Array "sparse"
  return Array.from(navigator.getGamepads?.() ?? []);
}
```

### Achsen, Deadzone und Normalisierung

Analoge Sticks liefern Werte in `[-1, 1]`. Typisch:
- `axes[0]`: left stick X
- `axes[1]`: left stick Y

**Deadzone** verhindert Driften (Stick nicht exakt 0).

```ts
function applyDeadzone(value: number, deadzone = 0.2): number {
  const v = Math.abs(value) < deadzone ? 0 : value;
  // optional: Rescaling nach Deadzone, damit der nutzbare Bereich wieder [0..1] wird
  if (v === 0) return 0;
  const sign = Math.sign(v);
  const mag = (Math.abs(v) - deadzone) / (1 - deadzone);
  return sign * Math.min(1, Math.max(0, mag));
}
```

**Normalisierte Diagonalbewegung**:  
Damit diagonal nicht schneller ist als geradeaus, wird der Vektor bei Länge > 1 normalisiert.

```ts
function normalizeMove(x: number, y: number): { x: number; y: number } {
  const len = Math.hypot(x, y);
  if (len <= 1e-6) return { x: 0, y: 0 };
  if (len <= 1) return { x, y };
  return { x: x / len, y: y / len };
}
```

Beispiel: Gamepad -> `PlayerInput`

```ts
function gamepadToInput(gp: Gamepad, deadzone = 0.2): PlayerInput {
  const rawX = gp.axes[0] ?? 0;
  const rawY = gp.axes[1] ?? 0;

  // Y-Achse ist oft "nach unten positiv" im Gamepad; hier direkt übernehmen
  const x = applyDeadzone(rawX, deadzone);
  const y = applyDeadzone(rawY, deadzone);

  const move = normalizeMove(x, y);

  return {
    move,
    // Mapping-Beispiele; je nach Controller variieren Indizes
    action1: Boolean(gp.buttons[0]?.pressed), // A / Cross
    action2: Boolean(gp.buttons[1]?.pressed), // B / Circle
  };
}
```

---

## Keyboard-Input (Stateful)

### Ansatz

- `keydown`/`keyup` Events aktualisieren einen **Key-State**.
- Pro Frame wird daraus ein `PlayerInput` berechnet.
- Für „vier Richtungen“ entspricht das typischerweise:
  - links/rechts -> X
  - oben/unten -> Y
- Danach ebenfalls **Normalisierung**, damit diagonales Drücken nicht schneller ist.

Beispiel:

```ts
type Key = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" | "KeyZ" | "KeyX";

class KeyboardState {
  private down = new Set<string>();

  attach(target: Window = window) {
    target.addEventListener("keydown", (e) => this.down.add(e.code));
    target.addEventListener("keyup", (e) => this.down.delete(e.code));
    target.addEventListener("blur", () => this.down.clear());
  }

  isDown(code: Key): boolean {
    return this.down.has(code);
  }
}

function keyboardToInput(keys: KeyboardState): PlayerInput {
  const x = (keys.isDown("ArrowRight") ? 1 : 0) + (keys.isDown("ArrowLeft") ? -1 : 0);
  const y = (keys.isDown("ArrowDown") ? 1 : 0) + (keys.isDown("ArrowUp") ? -1 : 0);

  return {
    move: normalizeMove(x, y),
    action1: keys.isDown("KeyZ"),
    action2: keys.isDown("KeyX"),
  };
}
```

---

## Spielerzustand (State) & Movement-Integration

### PlayerState (technische Felder)

```ts
export interface PlayerState {
  id: 0 | 1 | 2 | 3;
  pos: { x: number; y: number };
  vel: { x: number; y: number }; // optional, je nach Bewegungsmodell
  input: PlayerInput;            // Snapshot vom aktuellen Frame
}
```

### Bewegung (frei/flüssig, dt-basiert)

- Bewegung als kontinuierliche Positionsänderung, nicht rasterbasiert
- Beispiel: direkte Geschwindigkeit aus Input

```ts
function updatePlayer(p: PlayerState, dt: number, speed = 240) {
  const vx = p.input.move.x * speed;
  const vy = p.input.move.y * speed;

  p.pos.x += vx * dt;
  p.pos.y += vy * dt;
}
```

---

## Canvas-Rendering (2.5D mit Sprites)

### Canvas-Grundsetup

- Canvas auf DPR (devicePixelRatio) skalieren für Schärfe
- Render-Funktion zeichnet ausschließlich aus dem aktuellen State

```ts
function resizeCanvas(canvas: HTMLCanvasElement) {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);

  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Koordinaten in CSS-Pixeln zeichnen
  return ctx;
}
```

### Renderdaten und Ankerpunkt

Der Gameplay-Zustand hält Position und Bewegung in Weltkoordinaten. Der Renderer leitet daraus Bildschirmposition, Sprite-Rechteck und Sortiertiefe ab.

```ts
export interface SpriteRenderState {
  image: HTMLImageElement;
  worldX: number;
  worldY: number; // Boden-/Fußposition auf der Spielebene
  width: number;
  height: number;
  anchorX: number; // normiert von 0 bis 1
  anchorY: number; // normiert von 0 bis 1; meist am unteren Sprite-Rand
  depth?: number;  // überschreibt bei Bedarf die aus worldY abgeleitete Tiefe
  sortOrder?: number; // deterministischer Tie-Breaker bei gleicher Tiefe
}
```

Die Bildposition ergibt sich aus dem Ankerpunkt. Damit liegt die Fußposition unabhängig von der transparenten Fläche und der Höhe des Bildes an der Weltposition.

```ts
function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: SpriteRenderState,
  screenX: number,
  screenY: number,
) {
  ctx.drawImage(
    sprite.image,
    screenX - sprite.width * sprite.anchorX,
    screenY - sprite.height * sprite.anchorY,
    sprite.width,
    sprite.height,
  );
}
```

### Render-Loop (Beispiel)

```ts
function render(
  ctx: CanvasRenderingContext2D,
  sprites: SpriteRenderState[],
  camera: Camera,
) {
  const w = ctx.canvas.getBoundingClientRect().width;
  const h = ctx.canvas.getBoundingClientRect().height;

  ctx.clearRect(0, 0, w, h);

  // Weltpositionen in Bildschirmpositionen transformieren und nach Tiefe sortieren.
  const ordered = [...sprites].sort((a, b) =>
    (a.depth ?? a.worldY) - (b.depth ?? b.worldY)
      || (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );

  for (const sprite of ordered) {
    const screen = camera.worldToScreen({ x: sprite.worldX, y: sprite.worldY });
    drawSprite(ctx, sprite, screen.x, screen.y);
  }
}
```

> Hinweis: Konkrete Motive und Spielinhalte werden in `README.md` beschrieben und als Dateien in den Spielassets gepflegt. Diese technische Datei legt nur das Sprite-/Render-Verfahren fest.

---

## InputSystem: Zusammenführung pro Frame

### Verantwortlichkeiten

- Pro Frame:
  1. Gamepads pollen
  2. Keyboard-State auswerten
  3. Für jeden Spieler-Slot `PlayerInput` berechnen (abhängig vom Binding)
  4. `PlayerState.input` aktualisieren (Snapshot)

Skizze:

```ts
class InputSystem {
  constructor(
    private readonly keyboard: KeyboardState,
    private readonly bindings: PlayerBinding[]
  ) {}

  readInputs(): PlayerInput[] {
    const pads = Array.from(navigator.getGamepads?.() ?? []);
    const out: PlayerInput[] = [];

    for (const b of this.bindings) {
      if (b.device.kind === "keyboard") {
        out[b.playerIndex] = keyboardToInput(this.keyboard);
      } else {
        const gp = pads[b.device.gamepadIndex];
        out[b.playerIndex] = gp ? gamepadToInput(gp) : { move: { x: 0, y: 0 }, action1: false, action2: false };
      }
    }
    return out;
  }
}
```

---

## Technische Hinweise & Edge Cases

- **Sparse Gamepad-Liste:** `navigator.getGamepads()` kann `null` Einträge enthalten.
- **Disconnected Pads:** Bindings müssen Fallback liefern (Input = neutral).
- **Deadzone-Tuning:** typischer Bereich `0.15–0.25` je Controller.
- **Y-Achse:** Gamepad Y ist oft „unten positiv“; konsistent im gesamten Code halten.
- **Clamping dt:** verhindert Teleporting bei Tab-Wechsel/Frame-Drops.
- **Event + Polling:** `gamepadconnected`/`gamepaddisconnected` nützlich für UI/Bindings, aber State immer via Polling lesen.
- **Max 4 Spieler:** feste Arrays/Slots vereinfachen Architektur und Rendering.
- **Sprite-Tiefe:** Sortiertiefe muss aus der Bodenposition oder einem expliziten Tiefenwert folgen, nicht aus der oberen Bildkante.
- **Asset-Ladezustand:** Rendern darf nicht abstürzen, wenn ein Sprite noch lädt oder fehlt; Lade-/Fehlerzustände zentral behandeln.
- **Canvas-Größe:** DPR-Änderung und Fenster-Resize müssen Canvas-Auflösung und Kamera-Viewport aktualisieren.

---

## Verweis auf Spielregeln & Beschreibung

Diese Datei enthält **keine** Spielregeln, Ziele, Inhalte oder konkrete Spielbeschreibung.  
**Die einzige Quelle dafür ist `README.md`.**
