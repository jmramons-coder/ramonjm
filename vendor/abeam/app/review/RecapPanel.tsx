"use client";

/**
 * RecapPanel — le volet principal du review : DE LA PROSE, en français (§6.2).
 *
 * Ce composant remplace `BriefPanel`, qui posait le `TripBrief` à l'écran : 30
 * cartes de champ, 29 pastilles « à demander », des filtres par statut. Verdict
 * de François (§6.1bis) : c'était la représentation de la machine posée sur
 * l'écran de l'humain. Loi 9 — **le schéma ne s'affiche jamais**.
 *
 *   titre · cadre (si présent)
 *   2 à 4 phrases de ce qui s'est dit, chacune avec son ⟨01:42⟩
 *   Ce qui compte pour eux · Contraintes · Prochaines étapes
 *   Suggestions (cartes) sous le récap
 *
 * Trois règles portées ici :
 *
 * • **Une section vide ne s'affiche pas.** Pas de titre orphelin, pas de « rien à
 *   signaler », pas de tiret de remplissage (loi 4). Le seul vide qui parle est
 *   celui du récap entier — et il propose alors de le générer.
 * • **Chaque affirmation porte son ancre**, héritée des champs qu'elle cite (voir
 *   `notes.ts`). Sans ancre, `ProvenanceChip` ne rend rien : jamais de `--:--`.
 * • **Rien ne se génère tout seul.** Le récap coûte un appel modèle ; c'est un
 *   geste de l'agente, ici comme pour les passes.
 *
 * Aucun nom de champ, aucun statut, aucun compteur ne sort de ce composant.
 */

import { defineBilingualCopy } from "@/lib/ui/copy";
import { AlertTriangle, RefreshCw, FileText } from "lucide-react";

import EmptyState from "@/app/components/EmptyState";
import { SectionSkeleton } from "@/app/components/PageSkeleton";
import ProvenanceChip from "@/app/components/ProvenanceChip";
import type { TripBrief } from "@/lib/extraction/trip-brief";
import type { NotesAgent, NotesClaim } from "@/lib/notes-agent/types";

import { resolveClaimAnchor } from "./notes";
import type { ReviewLanguage, ReviewNotesState, ReviewSeek } from "./types";

const COPY = defineBilingualCopy({
  fr: {
    eyebrow: "Brief de voyage",
    dashboardTitle: "Ce qui compte",
    dashboardIdleHint: "Rassemblez les préférences et les points à retenir des conversations de ce dossier.",
    ceQuiCompte: "Ce qui compte pour eux",
    contraintes: "Contraintes",
    prochainesEtapes: "Prochaines étapes",
    regenerate: "Régénérer",
    idleTitle: "L'essentiel, au même endroit",
    idleHint: "Retrouvez les préférences, les contraintes et les prochaines étapes dans un brief que vous pouvez vérifier.",
    idleAction: "Rédiger le brief",
    idleNoAction: "Commencez une conversation pour construire le brief de ce voyage.",
    staleEyebrow: "Brief à actualiser",
    staleTitle: "Une nouvelle conversation est arrivée",
    staleHint: "Régénérez le brief pour intégrer les derniers échanges.",
    staleAction: "Mettre à jour le brief",
    staleNotice: "Le brief n'intègre pas encore cette conversation.",
    loading: "Rédaction du brief…",
    loadingHint: "Les échanges sont organisés en résumé et prochaines étapes.",
    errorTitle: "Le brief n'a pas pu être rédigé",
    errorHint: "Vous pouvez réessayer à partir de la conversation enregistrée.",
    errorAction: "Réessayer",
  },
  en: {
    eyebrow: "Travel brief",
    dashboardTitle: "What matters",
    dashboardIdleHint: "Bring together preferences and key details from this folder's conversations.",
    ceQuiCompte: "What matters to them",
    contraintes: "Constraints",
    prochainesEtapes: "Next steps",
    regenerate: "Regenerate",
    idleTitle: "Bring the conversation together",
    idleHint: "Review preferences, constraints, and next steps in one clear brief.",
    idleAction: "Write the brief",
    idleNoAction: "Start a conversation to build this travel brief.",
    staleEyebrow: "Brief needs updating",
    staleTitle: "There is a new conversation",
    staleHint: "Update the brief to include the latest exchanges.",
    staleAction: "Update the brief",
    staleNotice: "This brief does not include the latest conversation yet.",
    loading: "Writing the brief…",
    loadingHint: "The conversation is being organised into a summary and next steps.",
    errorTitle: "The brief could not be written",
    errorHint: "You can try again using the saved conversation.",
    errorAction: "Try again",
  },
});

type RecapCopy = { [Key in keyof typeof COPY.fr]: string };

const DASHBOARD_COPY = defineBilingualCopy({
  fr: { idleAction: "Préparer l’aperçu", idleNoAction: "Une conversation enregistrée fera apparaître l’essentiel ici.", staleHint: "Actualisez l’aperçu pour intégrer le contexte actuel du dossier.", staleAction: "Actualiser l’aperçu", staleNotice: "Cet aperçu doit être actualisé.", loading: "Préparation de l’aperçu…", errorTitle: "L’aperçu n’a pas pu être préparé" },
  en: { idleAction: "Prepare overview", idleNoAction: "A saved conversation will bring the key details here.", staleHint: "Update the overview to include the folder’s current context.", staleAction: "Update overview", staleNotice: "This overview needs updating.", loading: "Preparing overview…", errorTitle: "The overview could not be prepared" },
}) satisfies Record<ReviewLanguage, Partial<RecapCopy>>;

export type RecapPanelProps = {
  /** Le brief fusionné du dossier — jamais affiché : il ne sert qu'aux ancres. */
  brief: TripBrief;
  notes: ReviewNotesState;
  /** Interface labels only; saved notes keep their original language. */
  language?: ReviewLanguage;
  /** Dashboard context omits generated document headings, never saved claims. */
  variant?: "document" | "dashboard";
  /** Demande explicite de génération. Absente → aucune action proposée. */
  onGenerate?: () => void;
  /** Renvoie l'audio au moment dit. Absent → l'ancre reste affichée, inerte. */
  onSeek?: ReviewSeek;
};

/** Une affirmation et sa provenance. Le texte est rendu TEL QUEL, jamais reformulé. */
function Claim({
  claim,
  brief,
  language,
  onSeek,
  className,
}: {
  claim: NotesClaim;
  brief: TripBrief;
  language: ReviewLanguage;
  onSeek?: ReviewSeek;
  className: string;
}) {
  const ancre = resolveClaimAnchor(claim, brief);

  // L'ancre est un bouton, donc une boîte atomique : le navigateur accepte de
  // couper la ligne juste avant elle, et on se retrouve avec un timecode orphelin
  // en début de ligne. On la solidarise donc avec le DERNIER MOT de la phrase —
  // les deux passent à la ligne ensemble ou pas du tout.
  const mots = claim.texte.split(" ");
  const dernier = mots.pop() ?? "";
  const tete = mots.length > 0 ? `${mots.join(" ")} ` : "";

  return (
    <span className={className}>
      {tete}
      <span className="rv-claim-tail">
        {dernier}
        <ProvenanceChip
          language={language}
          ancreMs={ancre.ancreMs}
          verbatim={ancre.verbatim}
          onSeek={onSeek ? (ms) => onSeek(ms, ancre.ancreSessionId) : undefined}
          className="rv-claim-anchor"
        />
      </span>
    </span>
  );
}

/** Une section en liste. Vide → `null` : le titre ne survit pas à son contenu. */
function ClaimBlock({
  title,
  claims,
  brief,
  language,
  onSeek,
}: {
  title?: string;
  claims: NotesClaim[];
  brief: TripBrief;
  language: ReviewLanguage;
  onSeek?: ReviewSeek;
}) {
  if (claims.length === 0) return null;
  const Block = title ? "section" : "div";
  return (
    <Block className="rv-block">
      {title ? <h3 className="rv-block-title">{title}</h3> : null}
      <ul className="rv-list">
        {claims.map((claim) => (
          <li key={claim.texte}>
            <Claim claim={claim} brief={brief} language={language} onSeek={onSeek} className="rv-claim-inline" />
          </li>
        ))}
      </ul>
    </Block>
  );
}

/** Les prochaines étapes sont des actions de l'agente : elles ne citent rien. */
function StepBlock({ title, steps }: { title: string; steps: string[] }) {
  if (steps.length === 0) return null;
  return (
    <section className="rv-block rv-next-steps">
      <h3 className="rv-block-title">{title}</h3>
      <ul className="rv-list">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ul>
    </section>
  );
}

export function RecapPanel({ brief, notes, language = "fr", variant = "document", onGenerate, onSeek }: RecapPanelProps) {
  const dashboard = variant === "dashboard";
  const copy: RecapCopy = dashboard ? { ...COPY[language], ...DASHBOARD_COPY[language] } : COPY[language];
  return (
    <section className="rv-recap" data-testid="review-recap" data-state={notes.state} data-variant={variant} aria-busy={notes.state === "loading"}>
      <div className="rv-recap-scroll">
        {notes.state === "loading" ? (
          <div className="rv-recap-loading">
            <div className="rv-recap-loading-copy" aria-hidden="true">
              {dashboard ? <h2 className="rv-dashboard-title">{copy.dashboardTitle}</h2> : <><p className="rv-eyebrow">{copy.eyebrow}</p><h2>{copy.loading}</h2></>}
              {dashboard ? <p>{copy.loading}</p> : null}
              <p>{copy.loadingHint}</p>
            </div>
            <SectionSkeleton variant="brief" language={language} label={copy.loading} />
          </div>
        ) : notes.state === "error" ? (
          <EmptyState
            className="rv-recap-error"
            variant="compact"
            language={language}
            icon={AlertTriangle}
            title={copy.errorTitle}
            description={copy.errorHint}
            action={onGenerate ? { label: copy.errorAction, onClick: onGenerate } : undefined}
          />
        ) : notes.state === "idle" ? (
          <BriefEmptyState stale={notes.stale === true} dashboard={dashboard} copy={copy} onGenerate={onGenerate} />
        ) : (
          <>
            {notes.stale ? (
              <div className="rv-recap-stale" role="status">
                <span className="rv-recap-stale-mark" aria-hidden="true">
                  <RefreshCw className="ab-icon ab-icon-sm" />
                </span>
                <p>{copy.staleNotice}</p>
                {onGenerate ? (
                  <button type="button" className="ab-text-button" onClick={onGenerate}>
                    {copy.staleAction}
                  </button>
                ) : null}
              </div>
            ) : null}
            <Recap notes={notes.notes} brief={brief} language={language} dashboard={dashboard} copy={copy} onGenerate={onGenerate} onSeek={onSeek} />
          </>
        )}
      </div>

    </section>
  );
}

function BriefEmptyState({ stale, dashboard, copy, onGenerate }: { stale: boolean; dashboard: boolean; copy: RecapCopy; onGenerate?: () => void }) {
  return (
    <section className="rv-recap-empty" aria-live="polite">
      {dashboard ? null : <FileText className="rv-recap-empty-mark" size={36} strokeWidth={1.5} aria-hidden="true" />}
      <div className="rv-recap-empty-copy">
        {dashboard ? null : <p className="rv-eyebrow">{stale ? copy.staleEyebrow : copy.eyebrow}</p>}
        <h2 className={dashboard ? "rv-dashboard-title" : undefined}>{dashboard ? copy.dashboardTitle : stale ? copy.staleTitle : copy.idleTitle}</h2>
        <p>{stale ? copy.staleHint : onGenerate ? dashboard ? copy.dashboardIdleHint : copy.idleHint : copy.idleNoAction}</p>
      </div>
      {onGenerate ? (
        <button type="button" className="rv-recap-empty-action" onClick={onGenerate}>
          {stale ? <RefreshCw className="ab-icon ab-icon-sm" aria-hidden="true" /> : <FileText className="ab-icon ab-icon-sm" aria-hidden="true" />}
          {stale ? copy.staleAction : copy.idleAction}
        </button>
      ) : null}
    </section>
  );
}

function Recap({
  notes,
  brief,
  language,
  dashboard,
  copy,
  onGenerate,
  onSeek,
}: {
  notes: NotesAgent;
  brief: TripBrief;
  language: ReviewLanguage;
  dashboard: boolean;
  copy: RecapCopy;
  onGenerate?: () => void;
  onSeek?: ReviewSeek;
}) {
  return (
    <>
      <header className="rv-recap-head">
        <div className="rv-recap-head-line">
          {dashboard ? <h2 className="rv-dashboard-title">{copy.dashboardTitle}</h2> : (
            <div className="rv-recap-identity">
              <FileText className="rv-recap-mark" size={20} strokeWidth={1.5} aria-hidden="true" />
              <p className="rv-eyebrow">{copy.eyebrow}</p>
            </div>
          )}
          {onGenerate ? (
            <button type="button" className="ab-text-button rv-regen mobile-icon-action" aria-label={copy.regenerate} onClick={onGenerate}>
              <RefreshCw className="ab-icon ab-icon-sm" aria-hidden="true" />
              {copy.regenerate}
            </button>
          ) : null}
        </div>
        {!dashboard && notes.titre ? <h2 className="rv-recap-title">{notes.titre}</h2> : null}
        {/* Le cadre ne s'affiche que quand il change la lecture (§6.2,
            nature-conscient) : sur un premier contact, il dit « où on en est »
            au lieu de laisser l'écran dramatiser l'absence. */}
        {!dashboard && notes.cadre ? <p className="rv-recap-cadre">{notes.cadre}</p> : null}
      </header>

      {notes.resume.length > 0 ? (
        <div className="rv-recap-lede">
          {notes.resume.map((claim) => (
            <p className="rv-claim" key={claim.texte}>
              <Claim claim={claim} brief={brief} language={language} onSeek={onSeek} className="rv-claim-inner" />
            </p>
          ))}
        </div>
      ) : null}

      <ClaimBlock title={dashboard ? undefined : copy.ceQuiCompte} claims={notes.ce_qui_compte} brief={brief} language={language} onSeek={onSeek} />
      <ClaimBlock title={copy.contraintes} claims={notes.contraintes} brief={brief} language={language} onSeek={onSeek} />
      <StepBlock title={copy.prochainesEtapes} steps={notes.prochaines_etapes} />
    </>
  );
}

export default RecapPanel;
