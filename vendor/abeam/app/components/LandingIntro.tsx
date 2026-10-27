import type { UILanguage } from "@/lib/ui/language";

import ShaderOrb from "./ShaderOrb";
import styles from "./landing-intro.module.css";

export type LandingIntroProps = {
  language?: UILanguage;
  exiting?: boolean;
};

/** Initial public entry only; the caller owns loading and the handoff timing. */
export default function LandingIntro({ language = "fr", exiting = false }: LandingIntroProps) {
  return (
    <div className={styles.intro} lang={language} role="status" aria-busy={!exiting} aria-hidden={exiting || undefined} data-landing-intro data-exiting={exiting || undefined}>
      <span className={styles.status}>{language === "fr" ? "Chargement d’aBeam…" : "Loading aBeam…"}</span>
      <ShaderOrb className={styles.orb} tone="blue" edge="smooth" animated={!exiting} />
    </div>
  );
}
