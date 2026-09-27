import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";

export const resources = {
  en: {
    translation: {
      language: { label: "Language", english: "English", german: "German" },
      loading: "Loading Sushi Order Disorder...",
      error: {
        heading: "An error occurred",
        unexpected: "An unexpected error occurred.",
        unknown: "Unknown error",
        retry: "Try again",
        startup: "Could not start the game",
        missingRoot: "The #app root element was not found.",
      },
      menu: {
        tagline: "Local co-op kitchen chaos (2–4 players)",
        arrows: "Arrow keys (K: Action 1, L: Action 2)",
        wasd: "WASD (F: Action 1, G: Action 2)",
        gamepad: "Gamepad {{number}} (A: Action 1, B: Action 2)",
        joined: "Joined",
        join: "Join",
        start: "Start game",
        pauseHint: "Pause: Esc / P / Gamepad Start",
        ready: "Kitchen ready – select Start",
      },
      pause: {
        heading: "Game paused",
        resume: "Resume",
        button: "Pause (Esc)",
      },
      summary: {
        heading: "Shift complete!",
        totalScore: "Total score",
        onTime: "Delivered on time",
        late: "Delivered late",
        wrong: "Wrong deliveries",
        totalOrders: "Orders completed",
        restart: "Start new shift",
        mainMenu: "Main menu",
      },
      ratings: {
        "0": {
          title: "Kitchen chaos",
          description: "Too many orders missed or wrong dishes served.",
        },
        "1": {
          title: "Kitchen apprentices",
          description: "You made it through the shift, with room to improve.",
        },
        "2": {
          title: "Well-coordinated team",
          description: "Good kitchen work and solid organization.",
        },
        "3": {
          title: "Master chefs",
          description: "Excellent teamwork and outstanding kitchen work!",
        },
      },
      hud: {
        score: "Points",
        express: "Express",
        expired: "Expired",
        pendingOrder: "New order ready at the order counter! (Action 1)",
        waiting: "Waiting for guests...",
        empty: "empty",
        status: "Status: {{phase}}",
        timeTicks: "Time: {{time}}s | Ticks: {{ticks}}",
        phase: { running: "RUNNING", paused: "PAUSED" },
      },
      ingredients: {
        nori: "Nori",
        rice: "Rice",
        salmon: "Salmon",
        cucumber: "Cucumber",
        avocado: "Avocado",
      },
      recipes: {
        "cucumber-maki": "Cucumber Maki",
        "salmon-nigiri": "Salmon Nigiri",
        "salmon-maki": "Salmon Maki",
        "avocado-maki": "Avocado Maki",
      },
      stations: {
        order: "Order counter",
        rice: "Rice cooker",
        fridge: "Fridge",
        counter: "Counter",
        roll: "Rolling station",
        delivery: "Delivery counter",
        accept: "🛎️ Accept (Action 1)",
        acceptExpress: "⚡ Accept express order (Action 1)",
        newOrder: "🛎️ New order!",
        newExpress: "⚡ New express order!",
        noOrder: "No new order",
        cooking: "♨️ Cooking... ({{seconds}}s)",
        takeRice: "🍚 Take rice (Action 1) [{{dots}}]",
        riceReady: "🍚 Rice [{{dots}}] ({{count}}/{{max}})",
        startRice: "🍚 Start cooking (Action 1)",
        riceEmpty: "🍚 Rice cooker empty (Action 1)",
        rolling: "🔄 Rolling {{recipe}}... ({{seconds}}s)",
        rollRecipe: "🍱 Roll {{recipe}} (Action 1)",
        readyToRoll: "[ {{icons}} ] ✨ Ready to roll",
        takePlate: "🍽️ Take plate (Action 1)",
        fullClear: "⚠️ Full ({{count}}/{{max}}) [ {{icons}} ] Clear (Action 1)",
        full: "⚠️ Full [ {{icons}} ]",
        blockedClear: "⚠️ Blocked / wrong [ {{icons}} ] Clear (Action 1)",
        cannotRoll: "[ {{icons}} ] ⚠️ Cannot roll",
        takeCounter: "[ {{icons}} ] ({{count}}/{{max}}) Take (Action 1)",
        takeIngredient:
          "{{emoji}} {{ingredient}} [{{dots}}] ({{count}}/{{max}}) (Action 1)",
        ingredientEmpty: "{{emoji}} {{ingredient}} empty ⏳ {{seconds}}s",
        refillingIngredient: "⏳ {{ingredient}} {{seconds}}s",
        refilling: "⏳ Refilling {{seconds}}s",
        deliver: "🍽️ Deliver plate (Action 1/2)",
        platesOnly: "❌ Finished plates only!",
        deliveryReady: "🍽️ Delivery counter",
      },
      feedback: {
        success:
          "{{prefix}}{{emoji}} {{recipe}} delivered on time! (+{{points}})",
        late: "{{emoji}} {{recipe}} delivered late! (+{{points}})",
        wrong: "Wrong dish: {{emoji}} {{recipe}}! (-{{points}})",
      },
    },
  },
  de: {
    translation: {
      language: { label: "Sprache", english: "Englisch", german: "Deutsch" },
      loading: "Lade Sushi Order Disorder...",
      error: {
        heading: "Fehler aufgetreten",
        unexpected: "Ein unerwarteter Fehler ist aufgetreten.",
        unknown: "Unbekannter Fehler",
        retry: "Erneut versuchen",
        startup: "Fehler beim Spielstart",
        missingRoot: "Das Wurzelelement #app wurde nicht gefunden.",
      },
      menu: {
        tagline: "Lokales Koop-Küchen-Chaos (2–4 Spieler)",
        arrows: "Pfeiltasten (K: Akt1, L: Akt2)",
        wasd: "WASD (F: Akt1, G: Akt2)",
        gamepad: "Gamepad {{number}} (A: Akt1, B: Akt2)",
        joined: "Dabei",
        join: "Beitreten",
        start: "Spiel starten",
        pauseHint: "Pause: Esc / P / Gamepad Start",
        ready: "Küche bereit – Klicke auf Start",
      },
      pause: {
        heading: "Spiel pausiert",
        resume: "Fortsetzen",
        button: "Pause (Esc)",
      },
      summary: {
        heading: "Schicht beendet!",
        totalScore: "Gesamtpunkte",
        onTime: "Pünktlich geliefert",
        late: "Verspätet geliefert",
        wrong: "Falsche Lieferungen",
        totalOrders: "Bestellungen gesamt",
        restart: "Neue Schicht starten",
        mainMenu: "Hauptmenü",
      },
      ratings: {
        "0": {
          title: "Küchen-Chaos",
          description:
            "Zu viele Bestellungen verpasst oder falsche Gerichte ausgegeben.",
        },
        "1": {
          title: "Küchenlehrlinge",
          description:
            "Die Schicht überstanden, aber es gibt noch Ausbaupotenzial.",
        },
        "2": {
          title: "Eingespieltes Team",
          description: "Gute Küchenleistung mit solider Organisation.",
        },
        "3": {
          title: "Meisterköche",
          description:
            "Hervorragende Zusammenarbeit und meisterhafte Küchenleistung!",
        },
      },
      hud: {
        score: "Punkte",
        express: "Express",
        expired: "Abgelaufen",
        pendingOrder: "Neue Bestellung an der Bestellannahme bereit! (Akt1)",
        waiting: "Warte auf Gäste...",
        empty: "leer",
        status: "Status: {{phase}}",
        timeTicks: "Zeit: {{time}}s | Ticks: {{ticks}}",
        phase: { running: "LÄUFT", paused: "PAUSIERT" },
      },
      ingredients: {
        nori: "Nori",
        rice: "Reis",
        salmon: "Lachs",
        cucumber: "Gurke",
        avocado: "Avocado",
      },
      recipes: {
        "cucumber-maki": "Gurken-Maki",
        "salmon-nigiri": "Lachs-Nigiri",
        "salmon-maki": "Lachs-Maki",
        "avocado-maki": "Avocado-Maki",
      },
      stations: {
        order: "Bestellannahme",
        rice: "Reiskocher",
        fridge: "Kühlschrank",
        counter: "Arbeitsfläche",
        roll: "Rollstation",
        delivery: "Ausgabe",
        accept: "🛎️ Annehmen (Akt1)",
        acceptExpress: "⚡ Express annehmen (Akt1)",
        newOrder: "🛎️ Neue Bestellung!",
        newExpress: "⚡ Neue Express-Bestellung!",
        noOrder: "Keine neue Bestellung",
        cooking: "♨️ Kocht... ({{seconds}}s)",
        takeRice: "🍚 Nehmen (Akt1) [{{dots}}]",
        riceReady: "🍚 Reis [{{dots}}] ({{count}}/{{max}})",
        startRice: "🍚 Kochen starten (Akt1)",
        riceEmpty: "🍚 Reiskocher leer (Akt1)",
        rolling: "🔄 Rollt {{recipe}}... ({{seconds}}s)",
        rollRecipe: "🍱 {{recipe}} rollen (Akt1)",
        readyToRoll: "[ {{icons}} ] ✨ Bereit zum Rollen",
        takePlate: "🍽️ Teller nehmen (Akt1)",
        fullClear:
          "⚠️ Voll ({{count}}/{{max}}) [ {{icons}} ] Freiräumen (Akt1)",
        full: "⚠️ Voll [ {{icons}} ]",
        blockedClear: "⚠️ Blockiert / Falsch [ {{icons}} ] Freiräumen (Akt1)",
        cannotRoll: "[ {{icons}} ] ⚠️ Nicht rollbar",
        takeCounter: "[ {{icons}} ] ({{count}}/{{max}}) Nehmen (Akt1)",
        takeIngredient:
          "{{emoji}} {{ingredient}} [{{dots}}] ({{count}}/{{max}}) (Akt1)",
        ingredientEmpty: "{{emoji}} {{ingredient}} leer ⏳ {{seconds}}s",
        refillingIngredient: "⏳ {{ingredient}} {{seconds}}s",
        refilling: "⏳ Nachfüllen {{seconds}}s",
        deliver: "🍽️ Teller abgeben (Akt1/2)",
        platesOnly: "❌ Nur fertige Teller!",
        deliveryReady: "🍽️ Ausgabe",
      },
      feedback: {
        success:
          "{{prefix}}{{emoji}} {{recipe}} pünktlich geliefert! (+{{points}})",
        late: "{{emoji}} {{recipe}} verspätet geliefert! (+{{points}})",
        wrong: "Falsches Gericht: {{emoji}} {{recipe}}! (-{{points}})",
      },
    },
  },
} as const;

export const i18n = i18next.createInstance();

void i18n.use(LanguageDetector).init({
  resources,
  fallbackLng: "en",
  supportedLngs: ["en", "de"],
  load: "languageOnly",
  initAsync: false,
  interpolation: { escapeValue: false },
  detection: {
    order: ["localStorage", "navigator"],
    caches: ["localStorage"],
  },
});

if (typeof document !== "undefined") {
  const updateDocumentLanguage = (language: string): void => {
    document.documentElement.lang = language === "de" ? "de" : "en";
  };
  updateDocumentLanguage(i18n.resolvedLanguage ?? i18n.language);
  i18n.on("languageChanged", updateDocumentLanguage);
}
