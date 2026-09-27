# AGENTS.md - Technische Arbeitsgrundlage

Spielbeschreibung, Regeln und Inhalte stehen in `README.md`. Diese Datei beschreibt nur Architektur und Arbeitsweise für Änderungen am implementierten Spiel.

## Architektur

- Vite und TypeScript mit `strict: true`; die Spielwelt wird als 2.5D-Sprite-Szene im Canvas-2D-Context gezeichnet. HTML dient Menues und HUD.
- `src/game` orchestriert Loop und Simulationsschritte. `src/input` liefert pro Schritt normalisierte Eingabe-Snapshots für vier feste Spielerslots. Die Simulation kennt weder Tastatur noch Gamepad.
- `src/state`, `src/rules` und `src/world` halten Zustand, Regeln, Layout, Kollisionen und Interaktionen. Sie bleiben unabhängig von DOM, Canvas, `navigator` und Wanduhrzeit. Timer verwenden `dt`; neue Zufallslogik soll eine injizierbare Zufallsquelle anbieten.
- `src/render` lädt Assets zentral und zeichnet den Zustand ohne ihn zu verändern. Spielfiguren und Objekte sind Sprites mit Fußankern und stabiler Tiefensortierung; Positionen, Kollisionen und Reichweiten verwenden Weltkoordinaten.
- `src/ui` zeigt Menüs und HUD. Rezepte, Stationsparameter, Timer und Punktewerte werden in den fachlichen Konfigurationen gepflegt, nicht im Renderer oder in der UI dupliziert.
- Bewegung ist frei und kontinuierlich, auch diagonal; Bewegungsvektoren sind normalisiert. Pro Spieler gibt es zwei Gameplay-Aktionen. Pause ist ein separates Systemsignal. Gleichzeitige Interaktionen werden deterministisch nach Spielerslot verarbeitet.

## Änderungen prüfen

1. Vor dem Editieren `README.md`, relevante Module und `git status` lesen. Fremde lokale Änderungen erhalten.
2. Verhalten an der passenden Modulgrenze implementieren. Deterministische Zustandsübergänge mit benachbarten Vitest-Tests prüfen; bei reproduzierbaren Fehlern einen Regressionstest ergänzen. Browser- und Geräteverhalten bei Bedarf zusätzlich im Spiel prüfen.
3. Mechanische Formatierung mit `npm run format` und bei Bedarf `npm run lint:fix` ausführen. Vor Abschluss `npm run check` (Format, Lint, Typcheck, Tests, Build) ausführen. Verhaltensänderungen zusätzlich auf dem betroffenen Spielpfad prüfen und ungeprüfte Geräte klar benennen.

Voraussetzung ist Node.js >= 22; Abhängigkeiten werden mit `npm ci` installiert. Der projektlokale Pre-commit-Hook führt `npm run check` aus.
