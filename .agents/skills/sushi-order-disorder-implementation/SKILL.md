---
name: sushi-order-disorder-implementation
description: Implementiere Änderungen am Sushi Order Disorder-Spiel und prüfe sie mit dem lokalen Harness. Für Spielcode, Tests und Projekt-Harness; nicht für reine Spielideen.
---

# Sushi Order Disorder: Änderung umsetzen

1. Lies `README.md` für Spielregeln und `AGENTS.md` für technische Grenzen. Prüfe `git status` und erhalte fremde Änderungen.
2. Baue eine integrierte Änderung mit passenden Verhaltenstests. Halte die Simulation unabhängig von Browser-APIs; Eingaben werden als Snapshots übergeben, Rendering liest Zustand.
3. Nutze lokale Tools für mechanische Arbeiten: `npm run format`, bei Bedarf `npm run lint:fix`, danach `npm run check`. Wenn ein Befehl scheitert, behebe die konkrete Ursache und führe ihn erneut aus.
4. Prüfe bei Verhaltensänderungen den betroffenen Spielpfad. Berichte Änderungen, ausgeführte Prüfungen und verbleibende Einschränkungen; gib einen kurzen manuellen Testpfad mit erwartetem Ergebnis an.
