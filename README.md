# Sushi Rush 🍣

**Sushi Rush** ist ein kooperatives Casual-Game für **2–4 Spieler an einem gemeinsamen Bildschirm**. Das Team betreibt gemeinsam ein kleines Sushi-Restaurant und versucht, eingehende Bestellungen möglichst schnell und korrekt zuzubereiten.

Alle Spieler steuern ihre Figuren gleichzeitig in einer gemeinsamen **Top-down-2D-Küche**. Es gibt keinen Splitscreen: Kommunikation, Arbeitsteilung und spontanes Reagieren stehen im Mittelpunkt.

---

## Spielprinzip

Gäste geben Sushi-Bestellungen auf, die innerhalb einer begrenzten Zeit zubereitet und ausgegeben werden müssen.

Eine Bestellung besteht aus einem einfachen Rezept, das über gut erkennbare Icons dargestellt wird, zum Beispiel:

- 🍣 **Lachs-Nigiri:** Reis + Lachs
- 🥒 **Gurken-Maki:** Nori + Reis + Gurke
- 🐟 **Lachs-Maki:** Nori + Reis + Lachs
- 🥑 **Avocado-Maki:** Nori + Reis + Avocado

Das Team muss die benötigten Zutaten beschaffen, Reis vorbereiten, die Rollen herstellen und das fertige Sushi an der Ausgabe abliefern.

> **Bestellung annehmen → Reis und Zutaten bereitstellen → Rolle zubereiten → Bestellung ausgeben.**

Für jede korrekt und pünktlich erledigte Bestellung erhält das Team Punkte. Verspätete oder falsche Bestellungen senken die Bewertung der laufenden Schicht.

---

## Stationen

Die Küche besteht bewusst aus nur **fünf zentralen Stationen**. Dadurch bleibt das Spiel leicht verständlich, erzeugt aber trotzdem kooperatives Chaos.

### 1. Bestellannahme

An der Bestelltheke erscheinen neue Aufträge.

Ein Spieler nimmt die Bestellung entgegen. Danach wird sie für alle sichtbar als Rezeptkarte angezeigt. Die Karte zeigt:

- gewünschtes Sushi,
- benötigte Zutaten,
- verbleibende Zeit,
- gegebenenfalls eine Priorität, z. B. *Express*.

Die Bestellannahme ist nicht dauerhaft einer Person zugeordnet: Wenn viel los ist, kann jede Figur Bestellungen annehmen.

---

### 2. Reiskocher

Der Reiskocher produziert Reis, der für fast alle Sushi-Gerichte benötigt wird.

- Reis braucht kurz, bis er fertig gekocht ist.
- Der Vorrat ist begrenzt.
- Ist der Reiskocher leer, muss ein Spieler neuen Reis starten.
- Fertiger Reis kann von Spielern aufgenommen und zur Rollstation gebracht werden.

Der Reiskocher schafft einen natürlichen Rhythmus: Das Team muss rechtzeitig vorausdenken, statt erst dann Reis zu kochen, wenn die Bestellung bereits dringend ist.

---

### 3. Kühlschrank mit Zutaten

Im Kühlschrank befinden sich die Zutaten für die Sushi-Gerichte, etwa:

- Lachs,
- Gurke,
- Avocado,
- Nori-Blätter.

Spieler nehmen Zutaten aus dem Kühlschrank und tragen sie zur Rollstation.

Für zusätzliche Dynamik können Zutaten begrenzt verfügbar sein. Leere Fächer werden nach einer kurzen Zeit automatisch wieder aufgefüllt oder müssen durch eine einfache Interaktion nachgefüllt werden.

---

### 4. Rollstation

Die Rollstation ist der zentrale Arbeitsplatz der Küche.

Hier werden Reis und Zutaten zu Sushi verarbeitet. Spieler legen die für ein Rezept benötigten Bestandteile auf die Arbeitsfläche. Sind alle Komponenten korrekt vorhanden, kann ein Spieler die Zubereitung starten.

Beispiel: Für eine **Gurken-Maki** müssen an der Rollstation liegen:

1. Nori  
2. Reis  
3. Gurke  

Nach einer kurzen Roll-Animation entsteht ein fertiger Teller mit Sushi.

Die Rollstation ist absichtlich ein gemeinsamer Engpass: Mehrere Spieler können Zutaten bringen, müssen sich aber abstimmen, welche Bestellung gerade vorbereitet wird. Falsche oder liegengebliebene Zutaten blockieren die Fläche, bis sie weggeräumt werden.

---

### 5. Ausgabe

An der Ausgabe werden fertige Teller den wartenden Gästen zugeordnet.

Ein Spieler bringt den fertigen Teller von der Rollstation zur Ausgabe. Dort wird geprüft, ob das Gericht zur aktiven Bestellung passt:

- **korrekt und rechtzeitig:** Punkte und zufriedene Gäste,
- **korrekt, aber verspätet:** weniger Punkte,
- **falsches Gericht:** Bestellung bleibt offen oder führt zu einer kleinen Punktestrafe.

Die Ausgabe sollte räumlich nicht direkt neben der Rollstation liegen, damit Spieler zwischen Zubereitung und Bedienung pendeln und sich gegenseitig den Weg freimachen müssen.

---

## Koop-Gameplay

Sushi Rush hat keine festgelegten Rollen. Die Spieler entscheiden selbst, wer gerade welche Aufgabe übernimmt.

Typische Situationen:

- Ein Spieler nimmt neue Bestellungen an, während andere Reis und Zutaten holen.
- Zwei Spieler bringen gleichzeitig unterschiedliche Zutaten zur Rollstation.
- Der Reiskocher ist leer, obwohl mehrere Bestellungen Reis benötigen.
- Eine dringende Bestellung zwingt das Team, eine bereits vorbereitete Bestellung kurz zurückzustellen.
- Zutaten liegen falsch an der Rollstation und müssen erst weggeräumt werden.
- Eine Person bringt fertige Teller zur Ausgabe, während der Rest die nächste Bestellung vorbereitet.

Der Spaß entsteht aus kurzen Abstimmungen wie:

> „Ich starte den Reis!“  
> „Hol bitte Nori und Gurke!“  
> „Die Lachsrolle ist fertig – wer bringt sie zur Ausgabe?“  
> „Räum die Avocado weg, wir brauchen Platz für Nigiri!“

---

## Schwierigkeit und Progression

Zu Beginn gibt es wenige Bestellungen und einfache Rezepte. Im Lauf einer Schicht erhöht sich schrittweise der Druck:

- mehr Bestellungen gleichzeitig,
- kürzere Geduldszeiten,
- mehr mögliche Rezepte,
- Zutaten gehen schneller zur Neige,
- besonders dringende Express-Bestellungen.

Die Komplexität soll dabei nie durch komplizierte Bedienung entstehen, sondern durch die Notwendigkeit, sich als Team gut zu organisieren.

---

## Steuerung

Die Steuerung ist für **Gamepads** konzipiert, kann aber auch mit Tastaturen unterstützt werden.

| Eingabe | Aktion |
|---|---|
| Linker Stick / Steuerkreuz | Figur bewegen |
| Aktionstaste | Gegenstand aufnehmen, ablegen oder Station bedienen |
| Abbrechen-Taste | Gegenstand fallen lassen bzw. Aktion abbrechen |
| Schultertaste | optional: kurzer Sprint oder „Hilfe“-Signal |
| Start | Spiel pausieren |

Interaktionen sind kontextsensitiv: Steht eine Figur am Kühlschrank, nimmt sie Zutaten; steht sie am Reiskocher, startet oder nimmt sie Reis; an der Rollstation fügt sie Zutaten hinzu.

---

## MVP-Umfang

Die erste spielbare Version sollte bewusst klein bleiben:

- **2–4 lokale Spieler**
- gemeinsame Top-down-Kamera
- fünf Stationen:
  - Bestellannahme
  - Reiskocher
  - Kühlschrank
  - Rollstation
  - Ausgabe
- Zutaten:
  - Reis
  - Nori
  - Lachs
  - Gurke
  - Avocado
- Rezepte:
  - Lachs-Nigiri
  - Gurken-Maki
  - Lachs-Maki
  - Avocado-Maki
- Bestell-Timer, Punktestand und Schicht-Endwertung
- Unterstützung für Tastatur und Gamepads

---

## Ziel

Das Spiel soll in wenigen Sekunden verständlich sein, aber durch gemeinsames Planen und hektische Situationen dauerhaft Spaß machen.

**Sushi Rush** ist kein realistischer Restaurant-Simulator, sondern ein zugängliches, humorvolles Koop-Spiel: schnell, übersichtlich und ideal für eine kurze Runde mit Freunden an einem Bildschirm.
