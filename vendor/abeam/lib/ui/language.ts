export type UILanguage = "fr" | "en";

/** One regional formatting locale for every interface surface. */
export function uiLocale(language: UILanguage): "fr-CA" | "en-CA" {
  return language === "fr" ? "fr-CA" : "en-CA";
}
