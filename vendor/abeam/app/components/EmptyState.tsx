/**
 * EmptyState — le vide **compact** (D7, loi 4).
 *
 * L'app actuelle consacre 50 % de l'accueil à annoncer qu'il n'y a rien. Ce
 * composant dit la même chose en trois lignes : icône · titre · une phrase ·
 * une action facultative. Il ne remplit pas l'espace, il l'économise.
 *
 * Deux variantes :
 *   • `compact`  — il n'y a rien, et on le dit franchement.
 *   • `skeleton` — ça arrive, et on montre l'attente sans inventer de contenu.
 *     Les lignes grises ne portent aucun texte factice : un squelette qui
 *     ressemble à des données est un mensonge (loi 4).
 *
 * Le squelette est annoncé (`role="status"`, `aria-busy`) parce que le contenu
 * arrive tout seul : sans annonce, un lecteur d'écran ne sait pas qu'il attend.
 */

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import type { UILanguage } from "@/lib/ui/language";

import "./components.css";

type EmptyStateAction = { label: string; onClick: () => void; icon?: LucideIcon; disabled?: boolean; testId?: string };

type EmptyStateBase = {
  /** Langue des libellés par défaut. Défaut : `fr`. */
  language?: UILanguage;
  className?: string;
  /** A smaller placeholder for dashboard lists and folder overviews. */
  compact?: boolean;
};

export type EmptyStateProps =
  | (EmptyStateBase & {
      variant?: "compact";
      /** Icône lucide (le composant, pas un élément). */
      icon?: LucideIcon;
      /** Le fait, en quelques mots (ex. « aBeam écoute »). */
      title: string;
      /** **Une** phrase. Pas un paragraphe. */
      description?: string;
      /** Action facultative : bouton rendu par le composant, ou nœud libre. */
      action?: EmptyStateAction | ReactNode;
      /** Optional semantic heading when the parent has no section heading. */
      headingLevel?: 2 | 3;
      /** `listening` = attente légitime en salle live (teinte marque, pas d'alarme). */
      tone?: "neutral" | "listening";
    })
  | (EmptyStateBase & {
      variant: "skeleton";
      /** Nombre de lignes fantômes. Défaut : 3. */
      lines?: number;
      /** Texte annoncé aux lecteurs d'écran. Défaut : « Chargement… ». */
      label?: string;
    });

const COPY = {
  fr: { loading: "Chargement…" },
  en: { loading: "Loading…" },
} as const;

function isActionSpec(action: unknown): action is EmptyStateAction {
  return (
    typeof action === "object"
    && action !== null
    && "label" in action
    && "onClick" in action
    && typeof (action as { label: unknown }).label === "string"
    && typeof (action as { onClick: unknown }).onClick === "function"
  );
}

export function EmptyState(props: EmptyStateProps) {
  const { language = "fr", className, compact = false } = props;
  const copy = COPY[language];

  if (props.variant === "skeleton") {
    const lines = Math.min(8, Math.max(1, Math.trunc(props.lines ?? 3)));
    return (
      <div
        className={["ab-empty", "ab-skeleton", "workspace-empty-state", className].filter(Boolean).join(" ")}
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        <span className="ab-sr-only">{props.label ?? copy.loading}</span>
        {Array.from({ length: lines }, (_, index) => (
          // Le motif de largeurs se répète tous les 3 traits : un squelette de 7
          // lignes garde un rythme, il ne devient pas un pavé plein.
          <span key={index} className="ab-skeleton-line" aria-hidden="true" data-index={index % 3} />
        ))}
      </div>
    );
  }

  const { icon: Icon, title, description, action, tone = "neutral", headingLevel } = props;
  const Heading = headingLevel === 2 ? "h2" : headingLevel === 3 ? "h3" : "p";
  const actionSpec = isActionSpec(action) ? action : null;
  const ActionIcon = actionSpec?.icon;

  return (
    <div className={["ab-empty", "workspace-empty-state", compact ? "is-compact" : "", className].filter(Boolean).join(" ")} data-tone={tone}>
      {Icon ? <span className="workspace-empty-state-icon" aria-hidden="true"><Icon className="ab-icon ab-empty-icon" /></span> : null}
      <div className="workspace-empty-state-copy">
        <Heading className="ab-empty-title">{title}</Heading>
        {description ? <p className="ab-empty-text">{description}</p> : null}
      </div>
      {actionSpec ? (
        <button type="button" className="primary-button workspace-empty-state-action" onClick={actionSpec.onClick} disabled={actionSpec.disabled} data-testid={actionSpec.testId}>
          {ActionIcon ? <span aria-hidden="true"><ActionIcon /></span> : null}
          <span>{actionSpec.label}</span>
        </button>
      ) : (
        (action as ReactNode) ?? null
      )}
    </div>
  );
}

export default EmptyState;
