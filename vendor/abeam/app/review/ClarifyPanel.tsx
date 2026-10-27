"use client";

/**
 * ClarifyPanel — « À clarifier », premier onglet du volet droit (§6.2).
 *
 * Ce que ce panneau n'est PAS, et c'est tout le lot W6b : ce n'est pas la liste
 * des champs `manquant` du `TripBrief`. Cette liste-là existait, elle affichait
 * 29 pastilles sur une demande d'info de 51 secondes, et c'était un mensonge de
 * cadrage (§6.1bis) — sur un premier contact, il est normal de ne rien savoir.
 *
 * Ici on affiche **les phrases du générateur, telles qu'il les rend** : des
 * choses à régler avec un humain (« Confirmer les dates exactes de départ »).
 * Aucune reformulation côté UI — reformuler, ce serait re-fabriquer du texte à
 * partir d'un schéma, exactement ce qu'on vient de retirer.
 *
 * Pas de compteur : « 5 à clarifier » dramatise un état normal. Le plafond de 5
 * est appliqué à la lecture (`parseNotesAgent`), pas annoncé à l'écran.
 */

import { defineBilingualCopy } from "@/lib/ui/copy";
import { AlertCircle, CheckCircle2, ListChecks, RefreshCw, type LucideIcon } from "lucide-react";

import { SectionSkeleton } from "@/app/components/PageSkeleton";

import type { ReviewLanguage, ReviewNotesState } from "./types";

const COPY = defineBilingualCopy({
  fr: {
    label: "À clarifier avec le client",
    emptyTitle: "Pas de point à confirmer",
    emptyHint: "Ce brief n'identifie pas de question en attente. Vous pouvez toujours vérifier les échanges.",
    noRecapTitle: "Les points à confirmer apparaîtront ici",
    noRecapHint: "Rédigez le brief pour retrouver les questions laissées ouvertes dans la conversation.",
    staleTitle: "Brief à actualiser",
    staleHint: "Mettez à jour le brief pour inclure les derniers échanges.",
    pending: "Lecture des échanges…",
    failed: "Les points à confirmer sont indisponibles",
    failedHint: "Réessayez la rédaction du brief pour les retrouver.",
    prepare: "Préparer le brief",
    update: "Actualiser le brief",
    retry: "Réessayer",
  },
  en: {
    label: "To clarify with the client",
    emptyTitle: "No open questions identified",
    emptyHint: "This brief does not identify any open questions. You can still review the conversation.",
    noRecapTitle: "Open questions will appear here",
    noRecapHint: "Write the brief to see what still needs confirming with the client.",
    staleTitle: "Brief needs updating",
    staleHint: "Update the brief to include the latest exchanges.",
    pending: "Reviewing the conversation…",
    failed: "Open questions are unavailable",
    failedHint: "Try writing the brief again to see them.",
    prepare: "Prepare the brief",
    update: "Update the brief",
    retry: "Try again",
  },
});

const FOLDER_COPY = defineBilingualCopy({
  fr: {
    emptyHint: "Cet aperçu n'identifie pas de question en attente. Vous pouvez toujours vérifier les échanges.",
    noRecapHint: "Préparez l’aperçu pour retrouver les points à confirmer avec le client.",
    staleTitle: "Aperçu à actualiser",
    staleHint: "Actualisez l’aperçu pour inclure les derniers échanges du dossier.",
    failedHint: "Réessayez de préparer l’aperçu pour retrouver les points à confirmer.",
    prepare: "Préparer l’aperçu",
    update: "Actualiser l’aperçu",
  },
  en: {
    emptyHint: "This overview does not identify any open questions. You can still review the exchanges.",
    noRecapHint: "Prepare the overview to see what still needs confirming with the client.",
    staleTitle: "Overview needs updating",
    staleHint: "Update the overview to include the folder’s latest exchanges.",
    failedHint: "Try preparing the overview again to see the open questions.",
    prepare: "Prepare the overview",
    update: "Update the overview",
  },
});

export type ClarifyPanelProps = {
  notes: ReviewNotesState;
  language?: ReviewLanguage;
  variant?: "default" | "folder";
  onGenerate?: () => void;
};

function ClarifyEmpty({ title, hint, icon: Icon = ListChecks, action }: { title: string; hint: string; icon?: LucideIcon; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="rv-pane-body rv-pane-empty" role="status">
      <span className="rv-pane-empty-mark" aria-hidden="true">
        <Icon className="ab-icon" />
      </span>
      <strong>{title}</strong>
      <p>{hint}</p>
      {action ? <button className="rv-context-action" type="button" onClick={action.onClick}><RefreshCw size={14} aria-hidden="true" />{action.label}</button> : null}
    </div>
  );
}

export function ClarifyPanel({ notes, language = "fr", variant = "default", onGenerate }: ClarifyPanelProps) {
  const copy = variant === "folder" ? { ...COPY[language], ...FOLDER_COPY[language] } : COPY[language];
  if (notes.state === "loading") {
    return <div className="rv-pane-body"><SectionSkeleton variant="list" language={language} label={copy.pending} count={3} /></div>;
  }
  if (notes.state === "idle" && notes.stale) {
    return <ClarifyEmpty title={copy.staleTitle} hint={copy.staleHint} icon={RefreshCw} action={onGenerate ? { label: copy.update, onClick: onGenerate } : undefined} />;
  }
  // Une seule ligne sobre, jamais un état vide illustré : le panneau est un
  // onglet, l'agente sait déjà où elle est.
  if (notes.state !== "ready") {
    const title = notes.state === "error" ? copy.failed : copy.noRecapTitle;
    const hint = notes.state === "error" ? copy.failedHint : copy.noRecapHint;
    return (
      <ClarifyEmpty title={title} hint={hint} icon={notes.state === "error" ? AlertCircle : ListChecks} action={onGenerate ? { label: notes.state === "error" ? copy.retry : copy.prepare, onClick: onGenerate } : undefined} />
    );
  }

  if (notes.stale) {
    return <ClarifyEmpty title={copy.staleTitle} hint={copy.staleHint} icon={RefreshCw} action={onGenerate ? { label: copy.update, onClick: onGenerate } : undefined} />;
  }

  const items = notes.notes.a_clarifier;

  if (items.length === 0) {
    return <ClarifyEmpty title={copy.emptyTitle} hint={copy.emptyHint} icon={CheckCircle2} />;
  }

  return (
    <div className="rv-pane-body rv-clarify">
      <span className="rv-pane-label">
        <ListChecks className="ab-icon ab-icon-sm" aria-hidden="true" />
        {copy.label}
      </span>
      <ul className="rv-clarify-list ab-scroll-y">
        {items.map((item, index) => (
          <li key={`${index}-${item}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default ClarifyPanel;
