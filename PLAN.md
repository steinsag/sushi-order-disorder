# Implementierungsplan: Sushi Rush

Dieser Plan richtet sich an Agents, die das Spiel in kleinen, überprüfbaren Schritten umsetzen. **Erste Aufgabe ist H0 (Harness).** Danach wird jeweils genau ein Slice mit seinen Voraussetzungen, Tests und Abnahmekriterien abgeschlossen. Der Plan beschreibt die Umsetzung; Spielregeln und Inhalte werden aus [`README.md`](README.md), technische Vorgaben aus [`AGENTS.md`](AGENTS.md) übernommen. Bei Widersprüchen zu Spielinhalten gilt `README.md`, bei technischen Vorgaben `AGENTS.md`.

## Ausgangslage und Ziel

Das Repository enthält derzeit nur das unveränderte Vite/TypeScript-Demoprojekt. Es gibt `dev` und `build`, aber noch keine Formatierung, kein Linting, keinen separaten Typcheck und keine Tests. `src/main.ts` zeigt die Starterseite; Spielmodule und Spielsprites fehlen. Lokale Änderungen an `AGENTS.md` sind vorhanden und dürfen bei der Umsetzung nicht versehentlich überschrieben oder formatiert werden.

Das MVP ist ein lokales Koop-Spiel für **2–4 Spieler auf einem gemeinsamen Bildschirm** mit einer Top-down-Küche, fünf Stationen, den fünf Zutaten und vier Rezepten aus `README.md`. Bewegung bleibt frei und kontinuierlich. Die Welt wird mit Canvas-2D-Sprites, Fußankern und Tiefensortierung dargestellt; die gemeinsame Kamera zeigt alle Spieler. Zwei Aktionen pro Spieler decken Interagieren sowie Ablegen/Abbrechen ab. Pause ist ein separates Systemsignal, kein dritter Gameplay-Aktionsknopf. Der optionale Sprint bleibt außerhalb des MVP.

## Arbeitsvertrag für jeden Slice

1. Vor dem Editieren `README.md`, `AGENTS.md`, diesen Plan und den Git-Status lesen. Vorhandene, fremde Änderungen erhalten. Einen Slice und seine Dateiverantwortung festlegen; bei paralleler Arbeit gemeinsame Schnittstellen vorher abstimmen.
2. Erst ein von außen beobachtbares Ergebnis definieren, dann die kleinste nötige Implementierung bauen. Jeder Slice lässt das Spiel startbar; keine großen, unintegrierten Modulstapel.
3. Geschäftslogik mit Vitest gegen Zustandsübergänge prüfen. Browser- und Gamepad-Verhalten dort prüfen, wo ein Unit-Test die reale Integration nicht abbildet. Keine Tests schreiben, die nur den eigenen Code Zeile für Zeile spiegeln.
4. Mechanische Formatierung und Autofixes durch lokale Tools ausführen: `npm run format`, bei Bedarf `npm run lint:fix`. Agents sollen Quelltext nicht manuell für Stiländerungen umschreiben oder dafür Kontext verbrauchen.
5. Vor Abschluss `npm run check` ausführen. Bei verhaltensrelevanten Änderungen zusätzlich den passenden manuellen oder automatisierten Spielpfad prüfen. Ergebnis, ausgeführte Befehle und verbleibende Einschränkungen übergeben. Ein Slice wird erst nach Abnahme im Plan als erledigt markiert; bei parallelen Agents übernimmt das der koordinierende Agent.

### Verbindliche Coding Guidelines ab H0

- TypeScript mit `strict: true`; Domänenzustand und Eingabe als explizite Typen. `any`, nicht-null Assertions und Typumgehungen nur mit begründeter Ausnahme. Keine tiefen Importe zwischen fachfremden Modulen.
- Welt und Spielregeln sind unabhängig von DOM, Canvas, `navigator` und `Date.now()`. Zeit (`dt`) und Zufall werden für Simulationen injiziert. Rendern liest Zustand und verändert ihn nicht.
- Ein `PlayerInput` ist ein Snapshot je Simulationsschritt. Der Input-Layer kennt Keyboard/Gamepads; die Simulation kennt nur normalisierte Bewegungsvektoren und die zwei Aktionen. Flanken von Aktionstasten werden genau einmal verarbeitet.
- Positionen, Kollisionen und Interaktionsreichweiten verwenden Weltkoordinaten. Die Spielerposition bezeichnet die Fußposition des Sprites. Größen, Anker, Frames und Tiefe bleiben Render-Metadaten.
- Rezepte, Stationsparameter, Timer und Punktewerte werden an einer fachlichen Konfigurationsstelle definiert, nicht in Renderer oder UI dupliziert. Noch nicht in `README.md` bezifferte Balancewerte sind Implementierungsparameter und werden beim jeweiligen Slice nachvollziehbar gewählt.
- Dateien haben eine klare Verantwortung. Exporte bleiben klein; Modulgrenzen haben aussagekräftige Typen. Kommentare erklären ungewöhnliche Entscheidungen oder Invarianten, nicht offensichtliche Anweisungen.
- Tests liegen möglichst neben der getesteten Logik (`*.test.ts`). Benennung beschreibt Verhalten. Jeder Bugfix erhält einen Regressionstest, wenn er deterministisch reproduzierbar ist. Browser-Tests prüfen wenige vollständige Spielerpfade.
- Formatierung und Linting gelten auch für Tests und Konfiguration. Kein Merge eines Slices mit fehlschlagendem `check`; Warnungen werden nicht pauschal deaktiviert.

### Zielstruktur

Die Ordner können bei der Implementierung leicht angepasst werden; die Abhängigkeitsrichtung ist verbindlich.

```text
src/
  main.ts                 Bootstrap und Fehleranzeige
  game/                   Loop, Ablaufsteuerung, Simulationsschritt
  input/                  Tastatur, Gamepads, Bindings, PlayerInput
  state/                  Welt-, Spieler-, Item- und Bestellzustand
  rules/                  Rezepte, Stationen, Wertung, Schichtlogik
  world/                  Layout, Reichweiten und Kollisionen
  render/                 Kamera, AssetLoader, Sprites, Canvas-Szene
  ui/                     Start, HUD, Pause und Schichtende
  assets/sprites/         Projektassets und Metadaten
```

`game` verbindet die Module. `rules` und zustandsbezogene Funktionen dürfen von Browser-APIs nichts wissen. `input` erzeugt Snapshots; `render` und `ui` lesen den resultierenden Zustand. Die UI darf semantisches HTML für Menüs, Rezeptkarten und Text-HUD über dem Canvas verwenden; die Spielwelt und Figuren bleiben Sprite-basiert im Canvas.

## Slices in Abhängigkeitsreihenfolge

| ID | Ergebnis | Voraussetzung | Status |
| --- | --- | --- | --- |
| H0 | Reproduzierbares Harness und Projektregeln | keine | erledigt |
| T1 | Spiel-Bootstrap und deterministischer Loop | H0 | erledigt |
| T2 | 2–4 lokale Eingaben, Join/Disconnect und freie Bewegung | T1 | erledigt |
| T3 | Sprite-Szene, zentrale Assets und gemeinsame Kamera | T2 | offen |
| T4 | Küchenlayout, Hindernisse und eindeutige Interaktionsziele | T2, T3 | offen |
| G1 | Tragbare Zutaten, Kühlschrank und Reiskocher | T4 | offen |
| G2 | Bestellannahme und gemeinsame Rezeptkarten | G1 | offen |
| G3 | Rollstation und ein vollständiges Rezept | G2 | offen |
| G4 | Ausgabe, Timer und Wertung für einen kompletten Auftrag | G3 | offen |
| G5 | Alle vier Rezepte und parallele Bestellungen | G4 | offen |
| G6 | Gemeinsamer Engpass, Aufräumen und Vorratsdynamik | G5 | offen |
| G7 | Schichtverlauf, Pause und Endwertung | G6 | offen |
| Q1 | End-to-End- und Geräteabnahme des MVP | G7 | offen |

### H0 — Harness und Agent-Arbeitsweise

**Liefern:** Eine unterstützte Node-LTS-Major im Projekt festlegen, `npm ci` als reproduzierbaren Installationsweg dokumentieren und nur projektspezifische Dev-Dependencies ergänzen. Prettier für automatische Formatierung, ESLint mit TypeScript-Regeln, `tsc --noEmit` für den Typcheck und Vitest für Logiktests einrichten. TypeScript `strict` aktivieren. Die `package.json`-Skripte heißen verbindlich `format`, `format:check`, `lint`, `lint:fix`, `typecheck`, `test`, `check`, zusätzlich zu `dev` und `build`. `check` führt Formatprüfung, Linting, Typcheck, Tests und Build aus. Formatierungsziele bewusst auf Quellcode, Tests und ausgewählte Konfiguration begrenzen; `README.md`, `AGENTS.md`, `PLAN.md`, generierte Dateien und fremde lokale Änderungen nicht beiläufig umformatieren. Einen minimalen aussagekräftigen Test für eine kleine reine Funktion ergänzen. Eine kurze Arbeitsanweisung für spätere Agents im Projekt-Skill aktuell halten. Falls ein CI-Host später feststeht, dort denselben `check`-Befehl ausführen; ein Remote ist derzeit nicht konfiguriert.

**Abnahme:** `npm ci` und `npm run check` laufen aus einem sauberen Checkout; `npm run format` ist wiederholbar und verändert beim zweiten Lauf nichts. Ein absichtlich eingeführter Format-, Lint- oder Typfehler lässt den passenden Check fehlschlagen. Die Vite-Demo bleibt bis T1 startbar.

### T1 — Bootstrap, Zeit und Simulationsgrenze

**Liefern:** Starterseite durch einen Startbildschirm mit Canvas ersetzen. `requestAnimationFrame` treibt einen Simulationsschritt mit begrenztem `dt`; für Timer und Interaktionen einen festen Update-Takt (z. B. 60 Hz) wählen, Rendering darf interpolieren. Große Frame-Lücken und inaktive Tabs dürfen keine sprunghaften Fortschritte verursachen. Fehler- und Ladezustand sichtbar behandeln.

**Abnahme:** Start/Stop und Sichtbarkeitswechsel funktionieren ohne doppelte Loops; Tests belegen `dt`-Grenze und Update-Reihenfolge. `npm run check` ist grün.

### T2 — Lokaler Input und Bewegung

**Liefern:** Keyboard-State, Gamepad-Polling, Deadzone, Normalisierung, zwei Aktionen und vier feste Player-Slots. Für ein Spiel ohne Controller zwei getrennte Tastaturschemata anbieten; weitere Slots können Gamepads nutzen. Ein Gerät/Schemata darf nie gleichzeitig zwei Spielern zugeordnet sein. Join/Leave, `blur` und Gamepad-Disconnect liefern neutrale Eingaben; Reconnect ist nachvollziehbar. Spieler bewegen sich frei und diagonal mit gleicher Maximalgeschwindigkeit wie entlang einer Achse. System-Pause getrennt von `PlayerInput` behandeln.

**Abnahme:** 2–4 Slots können besetzt werden; mindestens zwei Tastaturspieler lassen sich lokal prüfen. Unit-Tests decken Deadzone, Diagonalen, Flankenerkennung, Slot-Zuordnung und Disconnect ab. Bewegung bleibt bei verschiedenen Frameraten vergleichbar.

### T3 — Sprite-Rendering und Kamera

**Liefern:** Zentraler asynchroner AssetLoader, Sprite-Metadaten, Fußanker, stabile Tiefensortierung und Welt-zu-Bildschirm-Transformation. Kleine, projektgepflegte Spieler- und Umgebungssprites anlegen; keine Kreise als reguläre Spielfiguren. Ein Lade- oder Assetfehler darf den Loop nicht abstürzen lassen. Canvas und Viewport auf Resize und DPR-Wechsel anpassen. Gemeinsame Kamera hält die 2–4 Spieler und die relevanten Stationen in einem lesbaren Bild; kein Splitscreen.

**Abnahme:** Zwei Figuren kreuzen ein Szenenobjekt und werden abhängig von ihrer Fußposition davor/dahinter gezeichnet. Tests prüfen Sortierung und Koordinatentransformation. Visuelle Prüfung bei zwei Viewportgrößen und unterschiedlicher DPR.

### T4 — Küche, Wege und Interaktionsziel

**Liefern:** Alle fünf Stationen aus `README.md` als gemeinsam erreichbare Orte im Küchenlayout, mit Hindernissen, begehbaren Wegen und Weltkoordinaten. Bewegungs-/Stationskollisionen und eine eindeutige, sichtbare Interaktionsauswahl pro Spieler. Keine Station darf nur per Bildschirmkoordinate oder Sprite-Bildkante getroffen werden. Gleichzeitige Aktionen werden in definierter Reihenfolge verarbeitet.

**Abnahme:** Spieler können jede Station erreichen, nicht durch feste Hindernisse laufen und an benachbarten Stationen das erwartete Ziel wählen. Tests prüfen Reichweite, Kollision und deterministische Zielwahl; ein kurzer manueller Rundgang bestätigt die Erreichbarkeit.

### G1 — Zutaten transportieren

**Liefern:** Ein klar begrenztes Inventar pro Spieler (für das MVP ein getragener Gegenstand). `action1` nimmt auf, legt ab oder bedient kontextsensitiv; `action2` legt einen Gegenstand ab oder bricht eine laufende Interaktion ab. Der Kühlschrank liefert Nori, Lachs, Gurke und Avocado; der Reiskocher startet einen Kochvorgang, hält begrenzten Vorrat und gibt fertigen Reis aus. Aufgehobene/abgelegte Gegenstände sind in Welt und UI erkennbar.

**Abnahme:** Zwei Spieler können unterschiedliche Zutaten zur Rollstation bringen, ohne Item-Duplikation oder Verlust. Tests prüfen Zustandsübergänge, Koch-Timer, begrenzten Vorrat und gleichzeitige Zugriffe.

### G2 — Bestellannahme

**Liefern:** Bestellungen entstehen an der Bestelltheke und werden erst durch Interaktion angenommen. Danach ist für alle eine gut lesbare Rezeptkarte mit Gericht, Zutaten und Restzeit sichtbar. Bestelllogik und HUD beziehen Rezeptdaten aus derselben Quelle. Für diesen Slice reicht zunächst ein Rezept und eine aktive Bestellung.

**Abnahme:** Bestellung annehmen, anzeigen und herunterzählen funktioniert. Tests prüfen Annahme und Timergrenzen; Rezeptkarte bleibt bei Resize lesbar.

### G3 — Rollstation und erstes Rezept

**Liefern:** Zutaten auf der gemeinsamen Arbeitsfläche ablegen, Rezeptvoraussetzungen prüfen, Zubereitung per Aktion auslösen und nach kurzer Dauer einen fertigen Teller erzeugen. Zunächst nur ein Rezept aus `README.md`, mit sichtbar unterscheidbarem Zwischen- und Endzustand. Während des Rollens verhindern atomare Zustandsübergänge doppelte Teller.

**Abnahme:** Ein gültiger Zutatenstapel erzeugt genau einen Teller; fehlende/falsche Zutaten starten keine Zubereitung. Zwei gleichzeitig interagierende Spieler erzeugen keinen Duplikat-Teller. Tests bilden diese Fälle ab.

### G4 — Ausgabe und erster vollständiger Spielpfad

**Liefern:** Teller zur Ausgabe tragen und einer aktiven Bestellung zuordnen; korrekte, verspätete und falsche Lieferung gemäß `README.md` behandeln. Punktestand und Auftragsergebnis sichtbar machen. Für Ablauf, Punkte und Strafen zunächst einfache zentrale Balancewerte wählen und dokumentieren, ohne sie als bereits festgelegte Spielregeln auszugeben.

**Abnahme:** Ein kompletter Pfad von Annahme über Reis/Zutat, Rollen und Ausgeben ist zu zweit spielbar. Tests prüfen korrekte, verspätete und falsche Lieferung sowie einmalige Wertung.

### G5 — Rezeptvielfalt und parallele Aufträge

**Liefern:** Lachs-Nigiri, Gurken-Maki, Lachs-Maki und Avocado-Maki mit den Zutaten aus `README.md`. Mehrere Aufträge können gleichzeitig aktiv sein; Teller werden eindeutig einem passenden Auftrag zugewiesen. Express-Priorität als klar erkennbares Auftragsmerkmal vorbereiten oder aktivieren. Keine Rezeptlogik in UI-Texten verdoppeln.

**Abnahme:** Jedes Rezept lässt sich herstellen und ausgeben; falsche Komponenten bleiben unterscheidbar. Tests prüfen alle Rezeptkombinationen und parallele Aufträge, einschließlich identischer Gerichte mit unterschiedlichen Timern.

### G6 — Gemeinsame Arbeitsfläche und Vorratsdynamik

**Liefern:** Falsch abgelegte oder liegengebliebene Zutaten blockieren die Rollstation wie in `README.md` beschrieben und können gezielt weggeräumt werden. Kühlschrank-Fächer können begrenzt sein und sich nach einer kurzen, sichtbaren Zeit auffüllen; die genaue Balance wird konfiguriert. Bei konkurrierenden Interaktionen bleibt der Weltzustand konsistent.

**Abnahme:** Blockierte Fläche lässt sich ohne Neustart freiräumen. Tests prüfen Kapazität, Auffüllen, Abbrechen und simultane Aktionen; manueller Koop-Test bestätigt verständliche Rückmeldung.

### G7 — Schicht, Progression und Pause

**Liefern:** Start, laufende Schicht, Pause, Endwertung und Neustart als klare Zustände. Die Belastung steigt schrittweise über Bestellanzahl, Geduldszeit, Rezeptauswahl und optionale Express-Aufträge, ohne neue Steuerungsregeln. Während Pause und Hintergrund-Tab laufen keine Spiel-Timer weiter. Schichtende zeigt Punkte und Bewertung nachvollziehbar an.

**Abnahme:** Eine Schicht ist von Start bis Endwertung spielbar und neu startbar; Pause friert alle Timer ein. Tests prüfen Zustandswechsel, Progressionsgrenzen und deterministische Endwertung.

### Q1 — MVP-Abnahme

**Liefern:** Wenige Browser-Smoke-Tests für Start, Join und einen vollständigen Auftrag; reproduzierbare Simulation mit injiziertem Input/Zeit für Varianten ohne Controller. Manuelle Geräte-Matrix mit zwei Tastaturschemata, Keyboard plus Gamepad sowie bis zu vier Gamepads soweit verfügbar. Visuelle Kontrolle von Küche, HUD, Lade-/Fehlerzustand, Resize und DPR. Fehlende echte Hardware wird als ungeprüfte Einschränkung festgehalten, nicht durch einen Mock als verifiziert ausgegeben.

**Abnahme:** `npm run check` läuft, alle vier Rezepte und fünf Stationen sind in einer vollständigen Schicht nutzbar, zwei bis vier Spieler können gemeinsam spielen. Der manuelle Prüfbericht nennt Browser, Geräte und konkrete Ergebnisse.

## Projektlokaler Agent-Skill

Ein erster Skill liegt unter [`.agents/skills/sushi-rush-implementation/SKILL.md`](.agents/skills/sushi-rush-implementation/SKILL.md). Codex lädt projektlokale Skills aus `.agents/skills`; automatische Auswahl erfolgt anhand der Beschreibung, explizite Auswahl ist ebenfalls möglich ([Codex-Dokumentation](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills)). Der Skill verweist auf diesen Plan und fordert ab H0 nur noch die lokalen Skripte für Formatierung und Qualitätssicherung an. Er enthält bewusst keinen eigenen Formatierungsalgorithmus. Nach Q1 kann bei wiederkehrendem Bedarf ein separater Skill für Geräte- und Browserabnahme ergänzt werden; vorher wären seine Schritte noch spekulativ.
