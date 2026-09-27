# Sushi Order Disorder 🍣

**Sushi Order Disorder** ist ein lokales Koop-Spiel für 2 bis 4 Personen an einem Bildschirm. Gemeinsam nehmt ihr Bestellungen an, bereitet Sushi zu und liefert es vor Schichtende aus. Alle bewegen sich gleichzeitig durch dieselbe Küche; es gibt keinen Splitscreen.

## Spielen

Auf dem Startbildschirm sind Spieler 1 und 2 aktiv. Weitere Spieler können dort mit den Slot-Schaltflächen beitreten; die Slots 3 und 4 verwenden Gamepads. Mit **Spiel starten** beginnt eine zweiminütige Schicht. Neue Bestellungen warten an der Bestellannahme und erscheinen erst nach dem Annehmen als Rezeptkarten im HUD.

1. Nehmt eine Bestellung an der Bestellannahme mit Aktion 1 an. Die Rezeptkarte zeigt Gericht, Zutaten und verbleibende Zeit. Express-Bestellungen sind gekennzeichnet.
2. Holt Zutaten am Kühlschrank. Von links nach rechts gibt es Nori, Lachs, Gurke und Avocado; eure Position vor dem Kühlschrank bestimmt das Fach. Am Reiskocher startet Aktion 1 einen Kochvorgang; danach könnt ihr Reisportionen abholen. Jede Figur trägt höchstens einen Gegenstand.
3. Legt Zutaten mit Aktion 1 auf einer der zwei Rollstationen ab. Wenn genau die Zutaten eines Rezepts bereitliegen, startet eine weitere Aktion 1 die Zubereitung. Bei einer unvollständigen oder falschen Kombination nimmt eine freie Figur mit Aktion 1 den zuletzt abgelegten Gegenstand wieder auf. Die mittlere Arbeitsfläche kann Gegenstände zwischenlagern.
4. Holt den fertigen Teller mit Aktion 1 ab und bringt ihn zur Ausgabe. Dort liefert Aktion 1 oder 2 ihn aus. Ein passendes Gericht wird einer offenen Bestellung zugeordnet.

Falsch abgelegte Zutaten belegen Platz an der Rollstation, bis sie weggeräumt werden. Getragene Gegenstände können mit Aktion 2 auf den Boden gelegt und dort mit Aktion 1 wieder aufgehoben werden. Leere Kühlschrankfächer füllen sich nach kurzer Zeit automatisch auf.

## Rezepte

| Gericht | Zutaten |
| --- | --- |
| Lachs-Nigiri | Reis, Lachs |
| Gurken-Maki | Nori, Reis, Gurke |
| Lachs-Maki | Nori, Reis, Lachs |
| Avocado-Maki | Nori, Reis, Avocado |

Zu Beginn sind Lachs-Nigiri und Gurken-Maki verfügbar. Im Verlauf der Schicht kommen die weiteren Rezepte, mehr gleichzeitige Bestellungen und Express-Aufträge hinzu. Korrekte Lieferungen geben Punkte; verspätete Lieferungen geben weniger Punkte. Ein falsches Gericht kostet Punkte und lässt die Bestellung offen. Am Schichtende zeigt das Spiel die Punktzahl, Lieferstatistik und Bewertung.

## Steuerung

| Spieler | Bewegung | Aktion 1 | Aktion 2 |
| --- | --- | --- | --- |
| P1 | Pfeiltasten | K | L |
| P2 | W, A, S, D | F | G |
| P3 / P4 | Linker Stick oder Steuerkreuz | A / Cross | B / Circle |

Aktion 1 dient zum Annehmen, Aufnehmen, Ablegen, Bedienen und Ausliefern. Aktion 2 legt getragene Gegenstände auf den Boden oder bricht ohne getragenen Gegenstand einen laufenden Koch- oder Rollvorgang ab. Mit **Esc**, **P**, Gamepad-Start oder der Pause-Schaltfläche pausiert ihr die Schicht; in der Pause laufen keine Spiel-Timer weiter. Die Aktionstasten haben je nach Tastatur und Gamepad weitere gleichwertige Belegungen.

## Lokal starten

Voraussetzungen: Node.js >= 22 und npm.

```bash
npm ci
npm run dev
```

Die von Vite ausgegebene lokale URL im Browser öffnen. `npm run check` führt Formatprüfung, ESLint, Typprüfung, Vitest und Build aus. `npm run format` formatiert den Code und die ausgewählten Konfigurationsdateien.
