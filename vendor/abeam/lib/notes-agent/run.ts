import "server-only";

/**
 * EXÉCUTEUR DU RÉCAP INTERNE.
 *
 * Chaîne, et aucun maillon n'est sauté :
 *   prompt → modèle → schéma Zod → garde de sortie → ANCRES RÉSOLUES EN CODE.
 *
 * Le dernier maillon est le sens du lot : le modèle cite des CHAMPS, jamais une
 * milliseconde. Les ⟨mm:ss⟩ sont lues dans le brief par `anchors.ts` après la
 * validation. Une ancre ne peut donc pas être inventée — au pire elle est absente.
 *
 * Discipline d'échec, calquée sur `lib/extraction/llm.ts` et `lib/passes/run.ts` :
 *  · erreur d'INFRASTRUCTURE fournisseur (clé, quota, facturation, 401/403/429) →
 *    arrêt NET. Aucun repli, aucune boucle : réessayer sur un problème de
 *    facturation ne fait que brûler des appels ;
 *  · sortie structurée invalide (le seul échec qui se répare) → UN repli
 *    `generateText` + parse JSON, une seule fois, avec la correction en clair.
 *
 * Ne jette pas : rend un résultat discriminé, pour que la route réponde
 * honnêtement (fournisseur en panne ≠ sortie invalide ≠ brief vide).
 */

import { openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";

import { requireEnv } from "@/lib/env";
import { providerErrorMessage as errorMessage, isProviderInfrastructureError, isRetriableProviderError as isRetriable, extractJsonObject as extractJson } from "@/lib/ai/response";
import type { TripBrief } from "@/lib/extraction/trip-brief";
import { resolveNotesAgentAnchors, type ResolvedNotesAgent } from "@/lib/notes-agent/anchors";
import { buildNotesAgentPrompt, NOTES_AGENT_PROMPT_VERSION, NOTES_AGENT_SYSTEM } from "@/lib/notes-agent/prompt";
import {
  decrireEchec,
  gardeNotesAgent,
  notesAgentOutputSchema,
  type NotesAgentOutput,
} from "@/lib/notes-agent/schema";

export const NOTES_AGENT_MODEL_ID = "gpt-4.1-mini";

export type NotesAgentRunOptions = {
  /** Nombre de conversations derrière le brief (change le ton du prompt). */
  conversations?: number;
  /** Sessions du dossier, de la plus ANCIENNE à la plus RÉCENTE (voir `anchors.ts`). */
  sessionOrder?: readonly string[];
};

export type NotesAgentResultat = {
  notes: ResolvedNotesAgent;
  modele: string;
  promptVersion: string;
  genereLe: string;
  conversations: number;
  /** Empreinte du brief d'entrée : ce qui rend une note persistée détectable comme périmée. */
  briefEmpreinte: string;
};

export type RunNotesAgentOutcome =
  | { ok: true; resultat: NotesAgentResultat }
  | { ok: false; raison: "fournisseur"; message: string; retriable: boolean }
  | { ok: false; raison: "sortie_invalide"; message: string };

/**
 * Espaces en trop retirés AVANT validation : un « titre » de 92 caractères dont
 * deux sont des espaces de bord n'est pas un dépassement, et une ligne faite de
 * blancs doit tomber sur `min(1)` plutôt que de s'afficher vide.
 */
function trimStrings(valeur: unknown): unknown {
  if (typeof valeur === "string") return valeur.trim();
  if (Array.isArray(valeur)) return valeur.map(trimStrings);
  if (typeof valeur === "object" && valeur !== null) {
    return Object.fromEntries(Object.entries(valeur as Record<string, unknown>).map(([cle, val]) => [cle, trimStrings(val)]));
  }
  return valeur;
}

/**
 * Empreinte du brief — FNV-1a sur le JSON. Ce n'est pas de la cryptographie :
 * c'est ce qui permet de savoir qu'une note rangée en base a été écrite depuis un
 * AUTRE brief que le brief courant (ré-extraction, conversation ajoutée), donc
 * qu'elle est périmée. Une note périmée qui se croit fraîche est un mensonge
 * d'écran ; mieux vaut le détecter que l'afficher.
 */
export function empreinteBrief(brief: TripBrief): string {
  const json = JSON.stringify(brief);
  let hash = 0x811c9dc5;
  for (let i = 0; i < json.length; i += 1) {
    hash ^= json.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `fnv1a-${hash.toString(16).padStart(8, "0")}-${json.length}`;
}

function valider(brut: unknown): { ok: true; notes: NotesAgentOutput } | { ok: false; message: string } {
  const parsed = notesAgentOutputSchema.safeParse(trimStrings(brut));
  if (!parsed.success) {
    return { ok: false, message: `Sortie non conforme au schéma NotesAgent — ${decrireEchec(parsed.error)}` };
  }

  const manquements = gardeNotesAgent(parsed.data);
  if (manquements.length > 0) {
    return { ok: false, message: `Garde de sortie du récap : ${manquements.slice(0, 3).join(" ")}` };
  }

  return { ok: true, notes: parsed.data };
}

/**
 * Génère le récap interne d'UN brief (session ou dossier fusionné).
 * `sessionOrder` n'a de conséquence que sur un brief fusionné : c'est ce qui
 * permet de trancher une phrase dont les champs viennent de deux conversations.
 */
export async function generateNotesAgent(
  brief: TripBrief,
  options: NotesAgentRunOptions = {},
  now: Date = new Date(),
): Promise<RunNotesAgentOutcome> {
  requireEnv("OPENAI_API_KEY");

  const conversations = Math.max(1, Math.round(options.conversations ?? 1));
  const prompt = buildNotesAgentPrompt(brief, { conversations });

  // Ce qui a cloché au premier essai, en clair : c'est ce qui repart au modèle.
  let correction: string;
  try {
    const result = await generateObject({
      model: openai(NOTES_AGENT_MODEL_ID),
      system: NOTES_AGENT_SYSTEM,
      prompt,
      schema: notesAgentOutputSchema,
      schemaName: "NotesAgent",
      schemaDescription: "Notes internes FR d'une agente de voyage, chaque affirmation citant ses champs du TripBrief.",
      temperature: 0.2,
    });

    const premiere = valider(result.object);
    if (premiere.ok) return { ok: true, resultat: assembler(premiere.notes, brief, conversations, options, now) };

    // Forme acceptée par le fournisseur mais refusée par NOS règles (plafonds,
    // champ inventé, ligne de remplissage) : c'est le cas réparable.
    correction = premiere.message;
  } catch (error) {
    if (isProviderInfrastructureError(error)) {
      // ARRÊT NET : pas de repli, pas de retry.
      return {
        ok: false,
        raison: "fournisseur",
        message: `Appel OpenAI échoué: ${errorMessage(error)}`,
        retriable: isRetriable(error),
      };
    }
    // Tout le reste est réparable, y compris un fournisseur qui refuserait les
    // plafonds du schéma (minItems/maxLength) : le repli n'envoie plus de schéma,
    // et nos règles sont de toute façon revérifiées en code juste après.
    correction = errorMessage(error) || "sortie structurée invalide";
  }

  // UN SEUL repli, quelle que soit la voie qui nous amène ici.
  let brut: unknown;
  try {
    brut = await repli(prompt, correction);
  } catch (erreurRepli) {
    if (isProviderInfrastructureError(erreurRepli)) {
      return {
        ok: false,
        raison: "fournisseur",
        message: `Appel OpenAI échoué: ${errorMessage(erreurRepli)}`,
        retriable: isRetriable(erreurRepli),
      };
    }
    return {
      ok: false,
      raison: "sortie_invalide",
      message: `Récap interne : sortie invalide après repli JSON. Premier échec: ${correction}. Repli: ${errorMessage(erreurRepli)}`,
    };
  }

  const validee = valider(brut);
  if (!validee.ok) {
    return {
      ok: false,
      raison: "sortie_invalide",
      message: `Récap interne, après repli — ${validee.message} (premier échec: ${correction})`,
    };
  }

  return { ok: true, resultat: assembler(validee.notes, brief, conversations, options, now) };
}

async function repli(prompt: string, correction: string): Promise<unknown> {
  const result = await generateText({
    model: openai(NOTES_AGENT_MODEL_ID),
    system: NOTES_AGENT_SYSTEM,
    prompt: `${prompt}

Retourne uniquement le JSON demandé, valide, sans Markdown.
Correction requise: ${correction}`,
    temperature: 0.1,
  });

  return JSON.parse(extractJson(result.text)) as unknown;
}

/**
 * Estampille la version, puis RÉSOUT LES ANCRES. C'est ici, et nulle part
 * ailleurs, que des millisecondes entrent dans le récap.
 */
function assembler(
  sortie: NotesAgentOutput,
  brief: TripBrief,
  conversations: number,
  options: NotesAgentRunOptions,
  now: Date,
): NotesAgentResultat {
  const notes = resolveNotesAgentAnchors(
    brief,
    { ...sortie, version: NOTES_AGENT_PROMPT_VERSION },
    { sessionOrder: options.sessionOrder },
  );

  return {
    notes,
    modele: NOTES_AGENT_MODEL_ID,
    promptVersion: NOTES_AGENT_PROMPT_VERSION,
    genereLe: now.toISOString(),
    conversations,
    briefEmpreinte: empreinteBrief(brief),
  };
}
