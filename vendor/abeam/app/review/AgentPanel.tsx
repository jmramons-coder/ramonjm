"use client";

/**
 * AgentPanel — le copilote SURVIT à la rencontre (T4, répare D8, loi 6).
 *
 * Le fil du Nudge Agent n'existait que pendant `view === "recording"` : dès que
 * la rencontre était finie, l'agente se retrouvait seule devant un brief. Ici le
 * même agent (`/api/nudge-chat`, mêmes recherches, même prompt) est **scopé au
 * dossier** : il reçoit le brief FUSIONNÉ des N conversations, pas le brief
 * synthétique de la voie rapide.
 *
 * ── W6b : les suggestions changent de nature ──────────────────────────────────
 *
 * La v1 dérivait les questions des champs `manquant` : « Qu'est-ce que je dois
 * demander pour combler *adultes* ? ». 27 méta-questions, en violation de loi 9
 * (corollaire : le copilote ne suggère jamais de demander ce qu'une agente sait
 * déjà demander) et de `regles-curation-notifications.md` §4 (un nudge à la fois,
 * et c'est *une phrase à dire au client*, pas une question posée à l'IA).
 *
 * Ce qui reste ici est donc uniquement ce qu'une agente **ne peut pas savoir de
 * tête**, et qui exige une recherche que l'agent sait faire :
 *   · l'avis récent sur un lieu **nommé** (la règle du produit nommé, §1) ;
 *   · le croisement d'une contrainte captée avec ce lieu — le cas fondateur VIGIE ;
 *   · les formalités d'entrée ;
 *   · le prix typique à une période donnée.
 * Rien n'est suggéré « dans le vide » : pas de nom capté → pas de suggestion.
 *
 * Et **au plus UN** nudge de déblocage (§4), qui n'est pas une question à l'IA
 * mais une phrase à dire au client. Il est donc rendu à part, sans bouton : le
 * pousser dans le champ de saisie en ferait une question à la machine.
 *
 * Loi 1 (silencieux) : ce panneau ne parle JAMAIS le premier. Aucun message
 * automatique, aucune question envoyée sans clic.
 */

import { defineBilingualCopy } from "@/lib/ui/copy";
import { formatTravelPeriod } from "@/lib/ui/date-field";
import { ArrowUp, ChevronDown, MessageSquareQuote, RefreshCw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import type { Field, TripBrief } from "@/lib/extraction/trip-brief";
import type { NudgeMessage } from "@/lib/live/nudge-agent";

import type { ReviewLanguage } from "./types";

const COPY = defineBilingualCopy({
  fr: {
    scope: "Portée",
    intro: "Vérifiez une information à partir du brief de ce dossier.",
    // Le bac « Non classées » ne fusionne RIEN (ses conversations ne partagent ni
    // client ni voyage). Annoncer un brief fusionné y serait un mensonge sur sa
    // propre portée — la même faute que d'afficher un nom de champ.
    introSeule: "Vérifiez une information à partir de cette conversation.",
    suggested: "À faire vérifier",
    emptyTitle: "Une question sur ce voyage ?",
    emptyHint: "Hôtel, vol ou formalité : vous choisissez ce qui mérite une recherche.",
    relance: "À souffler au client",
    placeholder: "Demander à l'Agent…",
    ariaInput: "Question à l'Agent du dossier",
    send: "Envoyer",
    thinking: "Je vérifie…",
    failed: "Cette vérification n'a pas abouti. Vous pouvez réessayer.",
    noReply: "Je n'ai pas pu répondre.",
    thread: "Fil de l'Agent",
    retry: "Réessayer",
    you: "Vous",
    assistant: "aBeam",
  },
  en: {
    scope: "Scope",
    intro: "Check an item using this folder's brief.",
    introSeule: "Check an item using this conversation.",
    suggested: "Worth checking",
    emptyTitle: "A question about this trip?",
    emptyHint: "Hotel, flight, or travel requirement: you choose what needs checking.",
    relance: "Worth asking the client",
    placeholder: "Ask the Agent…",
    ariaInput: "Question for the folder Agent",
    send: "Send",
    thinking: "Checking…",
    failed: "This check could not be completed. You can try again.",
    noReply: "I could not answer.",
    thread: "Agent thread",
    retry: "Try again",
    you: "You",
    assistant: "aBeam",
  },
});

const FOLDER_COPY = defineBilingualCopy({
  fr: {
    intro: "Posez une question sur l’ensemble des conversations du dossier.",
    emptyTitle: "Une question sur ce dossier ?",
    emptyHint: "Retrouvez une demande, comparez les échanges ou vérifiez une information.",
    placeholder: "Poser une question…",
    ariaInput: "Question sur les conversations du dossier",
    suggested: "Suggestions",
  },
  en: {
    intro: "Ask about the conversations in this folder.",
    emptyTitle: "A question about this folder?",
    emptyHint: "Find a request, compare exchanges, or check an item.",
    placeholder: "Ask about this folder…",
    ariaInput: "Question about the folder’s conversations",
    suggested: "Suggestions",
  },
});

type AgentTurn = { id: string; from: "agent" | "nudge"; text: string; failed?: boolean; failureKind?: "no-reply" | "request" };

/** Un champ compte comme dit quand il porte une valeur et n'est pas `manquant`. */
function dit<T>(field: Field<T>): boolean {
  if (field.statut === "manquant") return false;
  const valeur = field.valeur;
  if (valeur === null || valeur === undefined) return false;
  if (Array.isArray(valeur)) return valeur.length > 0;
  if (typeof valeur === "string") return valeur.trim().length > 0;
  return true;
}

function texte(valeur: unknown): string | null {
  if (typeof valeur !== "string") return null;
  const propre = valeur.trim();
  return propre.length > 0 ? propre : null;
}

/**
 * Les vérifications que l'agent peut vraiment faire, et que l'agente ne peut pas
 * faire de tête. Le lieu NOMMÉ est la condition d'existence de la plupart
 * d'entre elles : c'est la règle du produit nommé (§1 des règles de curation),
 * qui vaut ici comme pour les cartes.
 */
function verificationsUtiles(brief: TripBrief, language: ReviewLanguage): string[] {
  const fr = language === "fr";
  const hotel = texte(brief.lieu.hotel_nomme.valeur);
  const destination = texte(brief.lieu.destinations.valeur?.[0]);
  const lieu = hotel ?? destination;
  const questions: string[] = [];

  if (lieu) {
    questions.push(
      fr ? `Qu'est-ce que les avis récents disent de ${lieu} ?` : `What do recent reviews say about ${lieu}?`,
    );
  }

  // Le cas fondateur : contrainte captée × lieu identifié. C'est ce croisement
  // que l'agente ne peut PAS faire de tête, et qui a coûté un voyage.
  const contrainte = texte(brief.contraintes.mobilite_sante.valeur)
    ?? texte(brief.contraintes.restrictions_alimentaires.valeur);
  if (lieu && contrainte) {
    questions.push(
      fr
        ? `${lieu} convient-il pour « ${contrainte} » ?`
        : `Is ${lieu} suitable for “${contrainte}”?`,
    );
  }

  if (destination) {
    questions.push(
      fr
        ? `Quelles formalités d'entrée à ${destination} pour un voyageur canadien ?`
        : `What are the entry requirements for ${destination} for a Canadian traveller?`,
    );
  }

  // Le prix typique n'a de sens qu'avec une période : sans date, la question
  // n'est pas vérifiable, donc on ne la pose pas.
  const periode = formatTravelPeriod(texte(brief.temps.depart.valeur), brief.temps.depart.verbatim, language);
  const origine = texte(brief.lieu.origine.valeur);
  if (destination && periode) {
    questions.push(
      fr
        ? `Quel est le prix typique d'un vol ${origine ? `${origine} — ${destination}` : `vers ${destination}`} pour ${periode} ?`
        : `What is the typical flight price ${origine ? `${origine} — ${destination}` : `to ${destination}`} for ${periode}?`,
    );
  }

  return questions.slice(0, 4);
}

/**
 * Nudge de déblocage (§4) : **un seul**, et seulement quand il manque
 * exactement UN élément pour qu'une recherche de valeur devienne possible. Ce
 * n'est pas « remplis ce champ » : c'est « un mot du client et la recherche
 * part ». Deux éléments manquants ou plus → on se taît (la conversation n'est pas
 * assez avancée, et souffler trois choses à la fois n'est pas un nudge).
 */
function relanceUnique(brief: TripBrief, language: ReviewLanguage): string | null {
  const fr = language === "fr";
  const manque = [
    { cle: "destination", dit: dit(brief.lieu.destinations) },
    { cle: "origine", dit: dit(brief.lieu.origine) },
    { cle: "depart", dit: brief.temps.depart.statut !== "manquant" && Boolean(brief.temps.depart.valeur) },
  ].filter((item) => !item.dit);

  if (manque.length !== 1) return null;

  switch (manque[0].cle) {
    case "destination":
      return fr
        ? "Vous avez une destination en tête, ou on explore ensemble ?"
        : "Do you have a destination in mind, or should we explore together?";
    case "origine":
      return fr
        ? "Vous partiriez de Québec ou de Montréal ?"
        : "Would you fly out of Quebec City or Montreal?";
    default:
      return fr
        ? "Vous visez quelle période pour partir ?"
        : "What time of year are you aiming for?";
  }
}

export type AgentPanelProps = {
  /** Le brief fusionné : il nourrit l'agent et les vérifications. Jamais affiché. */
  brief: TripBrief;
  /** Nom du dossier, affiché dans le chip de scope. */
  scopeLabel: string;
  /** Contexte honnête du scope (ex. « 2 conversations »). Jamais un compte de champs. */
  scopeNote?: string;
  /** The folder rail already presents this context above its tabs. */
  showScope?: boolean;
  /** Keep history mounted while hidden, without scrolling or announcing it. */
  active?: boolean;
  variant?: "default" | "folder";
  /**
   * Le brief reçu est-il la fusion de plusieurs conversations ? Faux dans le bac
   * « Non classées », où l'on refuse la fusion. L'agent doit alors annoncer la
   * portée qu'il a vraiment.
   */
  fusionne?: boolean;
  language: ReviewLanguage;
  /** Envoie l'historique à `/api/nudge-chat` (le parent tient le jeton et le brief). */
  onAsk: (messages: NudgeMessage[]) => Promise<string>;
  draft: string;
  onDraftChange: (value: string) => void;
};

export function AgentPanel({
  brief,
  scopeLabel,
  scopeNote,
  showScope = true,
  active = true,
  variant = "default",
  fusionne = true,
  language,
  onAsk,
  draft,
  onDraftChange,
}: AgentPanelProps) {
  const copy = variant === "folder" ? { ...COPY[language], ...FOLDER_COPY[language] } : COPY[language];
  const scopeId = useId();
  const scopeDescription = [scopeLabel, scopeNote].filter(Boolean).join(" · ");
  const [thread, setThread] = useState<AgentTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const mountedRef = useRef(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const followLatestRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!active) return;
    const scroller = scrollRef.current;
    if (!scroller || !followLatestRef.current) return;
    scroller.scrollTo({
      top: scroller.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }, [active, thread.length, busy]);

  const suggestions = useMemo(() => verificationsUtiles(brief, language), [brief, language]);
  const relance = useMemo(() => relanceUnique(brief, language), [brief, language]);

  const ask = useCallback(
    (question: string) => {
      const clean = question.trim();
      if (!clean || busyRef.current) return;
      onDraftChange("");
      busyRef.current = true;
      followLatestRef.current = true;
      setBusy(true);
      const asked: AgentTurn = { id: `q-${Date.now()}`, from: "agent", text: clean };
      setThread((current) => [...current, asked]);

      void (async () => {
        try {
          const history: NudgeMessage[] = [...thread, asked]
            .filter((turn) => !turn.failed)
            .slice(-8)
            .map((turn) => ({ role: turn.from === "agent" ? "user" : "assistant", content: turn.text }));
          const reply = await onAsk(history);
          if (!mountedRef.current) return;
          setThread((current) => [
            ...current,
            { id: `a-${Date.now()}`, from: "nudge", text: reply.trim(), failed: !reply.trim(), ...(!reply.trim() ? { failureKind: "no-reply" as const } : {}) },
          ]);
        } catch {
          if (!mountedRef.current) return;
          setThread((current) => [
            ...current,
            { id: `a-${Date.now()}`, from: "nudge", text: "", failed: true, failureKind: "request" },
          ]);
        } finally {
          busyRef.current = false;
          if (mountedRef.current) setBusy(false);
        }
      })();
    },
    [onAsk, onDraftChange, thread],
  );

  const clientPrompt = relance ? <div className="rv-relance">
    <span className="rv-pane-label"><MessageSquareQuote className="ab-icon ab-icon-sm" aria-hidden="true" />{copy.relance}</span>
    <p className="rv-relance-line">« {relance} »</p>
  </div> : null;
  const suggestionsLabel = copy.suggested;

  return (
    <div className="rv-pane-body rv-agent">
      {showScope ? <div className="rv-scope">
        <span className="ab-chip" data-tone="brand">
          <Sparkles className="ab-icon ab-icon-sm" aria-hidden="true" />
          <span className="ab-chip-label">{copy.scope} : {scopeLabel}</span>
        </span>
        {scopeNote ? <span className="rv-scope-note">{scopeNote}</span> : null}
      </div> : null}

      <div
        ref={scrollRef}
        className="rv-agent-thread ab-scroll-y"
        role="log"
        aria-label={copy.thread}
        aria-live={active ? "polite" : "off"}
        aria-relevant="additions text"
        onScroll={(event) => {
          const scroller = event.currentTarget;
          followLatestRef.current = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 48;
        }}
      >
        {thread.length === 0 ? (
          <div className="rv-agent-empty">
            <span className="rv-pane-empty-mark" aria-hidden="true">
              <Sparkles className="ab-icon" />
            </span>
            <strong>{copy.emptyTitle}</strong>
            <p>{fusionne ? copy.intro : copy.introSeule}</p>
            <span className="rv-agent-empty-hint">{copy.emptyHint}</span>
          </div>
        ) : null}
        {thread.map((turn, index) => (
          <article key={turn.id} className={`rv-agent-msg is-${turn.from}${turn.failed ? " is-failed" : ""}`} aria-label={turn.from === "agent" ? copy.you : copy.assistant}>
            {variant === "folder" ? <span className="rv-agent-msg-author" aria-hidden="true">{turn.from === "agent" ? copy.you : copy.assistant}</span> : null}
            <p>{turn.failed ? turn.failureKind === "no-reply" ? copy.noReply : copy.failed : turn.text}</p>
            {turn.failed && index === thread.length - 1 ? (
              <button
                type="button"
                className="ab-text-button rv-agent-retry"
                disabled={busy}
                onClick={() => {
                  const question = thread.slice(0, index).findLast((item) => item.from === "agent");
                  if (question) ask(question.text);
                }}
              >
                <RefreshCw className="ab-icon ab-icon-sm" aria-hidden="true" />
                {copy.retry}
              </button>
            ) : null}
          </article>
        ))}
        {busy ? (
          <article className="rv-agent-msg is-nudge is-pending">
            {variant === "folder" ? <span className="rv-agent-msg-author" aria-hidden="true">{copy.assistant}</span> : null}
            <p>{copy.thinking}</p>
          </article>
        ) : null}
      </div>

      {/* Une phrase à DIRE, pas une question à poser à la machine : donc pas de
          bouton. La confondre avec les suggestions serait rejouer l'erreur de la
          v1 (§6.1bis, symptôme 2). */}
      {variant !== "folder" ? clientPrompt : null}

      {suggestions.length > 0 || (variant === "folder" && clientPrompt) ? (
        <details className="rv-suggested">
          <summary>
            <span className="rv-pane-label">{suggestionsLabel}</span>
            <ChevronDown className="ab-icon ab-icon-sm" aria-hidden="true" />
          </summary>
          <div className="rv-suggested-list" role="group" aria-label={suggestionsLabel}>
            {variant === "folder" ? clientPrompt : null}
            {suggestions.map((question) => (
              <button
                key={question}
                type="button"
                className="rv-suggested-item"
                onClick={() => onDraftChange(question)}
                disabled={busy}
                title={question}
              >
                {question}
              </button>
            ))}
          </div>
        </details>
      ) : null}

      {scopeDescription ? <span className="ab-sr-only" id={scopeId}>{scopeDescription}</span> : null}
      <form
        className="rv-agent-form"
        onSubmit={(event) => {
          event.preventDefault();
          ask(draft);
        }}
      >
        <input
          type="text"
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder={copy.placeholder}
          aria-label={copy.ariaInput}
          aria-describedby={scopeDescription ? scopeId : undefined}
          enterKeyHint="send"
          autoComplete="off"
        />
        <button type="submit" className="ab-text-button" aria-label={copy.send} disabled={busy || !draft.trim()}>
          <ArrowUp size={17} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}

export default AgentPanel;
