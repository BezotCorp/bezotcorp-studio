import { describe, expect, it, vi } from "vitest";

describe("library i18n namespace scoping", () => {
  it("exports raw translation resources for host-app registration", async () => {
    const { BEZOTCORP_I18N_NAMESPACE, translationResources } =
      await import("../../src/i18n");

    expect(BEZOTCORP_I18N_NAMESPACE).toBe("bezotcorp");
    expect(translationResources.en).toHaveProperty("ERROR$GENERIC");
    expect(translationResources.en).not.toHaveProperty(
      BEZOTCORP_I18N_NAMESPACE,
    );
  });

  it("configures standalone i18n to load the bezotcorp namespace by default", async () => {
    const { BEZOTCORP_I18N_NAMESPACE, createAgentServerI18n } =
      await import("../../src/i18n");

    const instance = createAgentServerI18n();

    expect(instance.options.defaultNS).toBe(BEZOTCORP_I18N_NAMESPACE);
    expect(instance.options.fallbackNS).toContain(BEZOTCORP_I18N_NAMESPACE);
    expect(instance.options.ns).toContain(BEZOTCORP_I18N_NAMESPACE);
  });

  it("does not initialize the global i18next singleton when importing the library entry", async () => {
    vi.resetModules();

    const { default: globalI18n } = await import("i18next");

    await globalI18n.init({
      lng: "en",
      fallbackLng: "en",
      ns: ["translation"],
      defaultNS: "translation",
      resources: {
        en: {
          translation: {
            HOST_ONLY: "Host only",
          },
        },
      },
    });
    globalI18n.removeResourceBundle("en", "bezotcorp");

    expect(globalI18n.hasResourceBundle("en", "bezotcorp")).toBe(false);

    await import("../../src/index");

    expect(globalI18n.hasResourceBundle("en", "bezotcorp")).toBe(false);
    expect(globalI18n.t("HOST_ONLY")).toBe("Host only");
  }, 15_000);
});
