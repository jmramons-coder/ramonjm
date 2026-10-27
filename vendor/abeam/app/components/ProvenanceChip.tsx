/**
 * ProvenanceChip — l'ancre temporelle inline (T1, répare D2 ; loi 8.5).
 *
 *   ⟨02:54⟩
 *
 * Chaque fait dérivé porte le moment où il a été dit. Un clic renvoie l'audio
 * à cet instant (le dock expose la fonction de seek, voir `AudioDock`).
 *
 * Loi 4 — « rien à dire → rien ne s'affiche » : sans ancre, le composant ne
 * rend RIEN. Pas de `--:--`, pas de pastille grise inerte. Un brief produit
 * avant W3 n'a pas d'`ancre_ms` ; il ne doit pas hériter d'une fausse ancre.
 *
 * Sans `onSeek`, l'ancre reste affichée (c'est de l'information de provenance)
 * mais sous forme de texte inerte : on ne rend jamais un bouton qui ne fait rien.
 */

import type { UILanguage } from "@/lib/ui/language";
import { formatTimecode, hasAncre } from "@/lib/ui/provenance";

import "./components.css";

export type ProvenanceChipProps = {
  /** Position dans l'enregistrement, en millisecondes. `null` → rien n'est rendu. */
  ancreMs: number | null;
  /** Fonction de seek fournie par le dock audio. Absente → pastille non interactive. */
  onSeek?: (ms: number) => void;
  /** Le mot-à-mot capté. Sert d'infobulle : survoler l'ancre montre la preuve. */
  verbatim?: string | null;
  /** Langue de l'étiquette d'accessibilité. Défaut : `fr`. */
  language?: UILanguage;
  className?: string;
};

const COPY = {
  fr: { seek: "Écouter à", said: "dit" },
  en: { seek: "Listen at", said: "said" },
} as const;

export function ProvenanceChip({ ancreMs, onSeek, verbatim, language = "fr", className }: ProvenanceChipProps) {
  if (!hasAncre(ancreMs)) return null;

  const copy = COPY[language];
  const timecode = formatTimecode(ancreMs);
  const quote = verbatim?.trim() ? (language === "fr" ? `« ${verbatim.trim()} »` : `“${verbatim.trim()}”`) : null;
  const classes = ["ab-prov", className].filter(Boolean).join(" ");
  const inner = (
    <>
      <span aria-hidden="true">⟨</span>
      {timecode}
      <span aria-hidden="true">⟩</span>
    </>
  );

  if (!onSeek) {
    return (
      <span className={classes} data-static="true" title={quote ?? `${copy.said} ${timecode}`}>
        {inner}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      onClick={() => onSeek(ancreMs)}
      title={quote ?? `${copy.seek} ${timecode}`}
      aria-label={quote ? `${copy.seek} ${timecode} — ${quote}` : `${copy.seek} ${timecode}`}
    >
      {inner}
    </button>
  );
}

export default ProvenanceChip;
