---
name: sushi-rush-implementation
description: Implementiere einen Slice des Sushi-Rush-Plans im Repository und prüfe Änderungen mit dem lokalen Harness. Für Spielcode, Tests und Projekt-Harness; nicht für reine Spielideen.
---

# Sushi Rush: Slice umsetzen

1. Lies `PLAN.md` für den zugewiesenen Slice, `README.md` für Spielregeln und `AGENTS.md` für technische Grenzen. Prüfe `git status` und erhalte fremde Änderungen. Falls kein Slice genannt ist, beginne mit dem ersten offenen Slice samt Voraussetzungen.
2. Wenn die Harness-Skripte noch fehlen, implementiere zuerst H0 aus `PLAN.md`. Behaupte keine bestandene Prüfung für nicht vorhandene Skripte.
3. Baue die kleinste integrierte Änderung mit passenden Verhaltenstests. Halte Simulation unabhängig von Browser-APIs; Eingabe wird als Snapshot übergeben, Rendering liest Zustand.
4. Nutze nach H0 lokale Tools für mechanische Arbeiten: `npm run format`, bei Bedarf `npm run lint:fix`, danach `npm run check`. Formatiere Code nicht manuell im Modell und wiederhole keine vollständigen Dateiinhalte zur Stilkorrektur. Wenn ein Befehl scheitert, behebe die konkrete Ursache und führe ihn erneut aus.
5. Prüfe zusätzlich den im Slice genannten Spielpfad. Berichte den erreichten Zustand und die tatsächlich ausgeführten Prüfungen. Markiere einen Slice nur nach erfüllter Abnahme als erledigt; bei paralleler Arbeit aktualisiert der koordinierende Agent `PLAN.md`.
