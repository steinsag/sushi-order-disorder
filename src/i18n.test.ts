import { afterEach, describe, expect, it, vi } from "vitest";
import { resources } from "./i18n";

function leafKeys(value: object, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === "string" ? [path] : leafKeys(child, path);
  });
}

describe("localization", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("has the same translation keys in English and German", () => {
    expect(leafKeys(resources.de.translation).sort()).toEqual(
      leafKeys(resources.en.translation).sort(),
    );
  });

  it("uses the browser's preferred German regional variant", async () => {
    vi.stubGlobal("navigator", {
      languages: ["de-DE", "en-US"],
      language: "de-DE",
    });
    vi.resetModules();
    const { i18n } = await import("./i18n");

    expect(i18n.resolvedLanguage).toBe("de");
    expect(i18n.t("menu.start")).toBe("Spiel starten");
  });

  it("falls back to English for an unavailable browser language", async () => {
    vi.stubGlobal("navigator", { languages: ["fr-FR"], language: "fr-FR" });
    vi.resetModules();
    const { i18n } = await import("./i18n");

    expect(i18n.resolvedLanguage).toBe("en");
    expect(i18n.t("menu.start")).toBe("Start game");
  });
});
