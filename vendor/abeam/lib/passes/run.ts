import "server-only";

/**
 * EXÉCUTEUR DE PASSES (T5).
 *
 * Chaîne : gate → prompt → modèle → schéma → garde de sortie. Aucun maillon n'est
 * sauté et rien ne s'exécute sans demande explicite (voir `app/api/pass/route.ts`).
 *
 * Discipline d'échec, calquée sur `lib/extraction/llm.ts` :
 *  - erreur d'INFRASTRUCTURE fournisseur (clé, quota, facturation, 401/403/429) →
 *    on s'arrête NET, aucun repli, aucune boucle de retry : réessayer sur un
 *    problème de facturation ne fait que brûler des appels.
 *  - sortie structurée invalide (le seul échec qui se répare) → UN repli
 *    `generateText` + parse JSON, une fois.
 *
 * Ne jette pas : renvoie un résultat discriminé, pour que la route réponde
 * honnêtement (gate bloqué ≠ fournisseur en panne ≠ sortie invalide).
 */

import { openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";

import { requireEnv } from "@/lib/env";
import { providerErrorMessage as errorMessage, isProviderInfrastructureError, isRetriableProviderError as isRetriable, extractJsonObject as extractJson } from "@/lib/ai/response";
import type { TripBrief } from "@/lib/extraction/trip-brief";
import type { PasseContexte } from "@/lib/passes/prompts";
import {
  etatCaptation,
  evaluateGate,
  getPasse,
  PASSE_MODEL_ID,
  type GateManque,
  type PasseDefinition,
  type PasseId,
  type PasseResultat,
} from "@/lib/passes/registry";

export type RunPasseOutcome =
  | { ok: true; resultat: PasseResultat }
  | { ok: false; raison: "gate"; manquant: GateManque[] }
  | { ok: false; raison: "fournisseur"; message: string; retriable: boolean }
  | { ok: false; raison: "sortie_invalide"; message: string };

function validerSortie(passe: PasseDefinition, brut: unknown): { ok: true; donnees: unknown } | { ok: false; message: string } {
  const parsed = passe.schema.safeParse(brut);
  if (!parsed.success) {
    const details = parsed.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join(".") || "(racine)"}: ${issue.message}`)
      .join(" ; ");
    return { ok: false, message: `Sortie non conforme au schéma ${passe.schemaName} — ${details}` };
  }

  const manquements = passe.garde(parsed.data);
  if (manquements.length > 0) {
    return { ok: false, message: `Garde de sortie de « ${passe.titre} » : ${manquements.join(" ")}` };
  }

  return { ok: true, donnees: parsed.data };
}

export async function runPasse(
  passeId: PasseId,
  brief: TripBrief,
  contexte: PasseContexte = {},
  now: Date = new Date(),
): Promise<RunPasseOutcome> {
  const passe = getPasse(passeId);

  // 1. Le gate. Une passe sans ses entrées ne s'exécute pas — et on dit pourquoi.
  const verdict = evaluateGate(passe, brief);
  if (!verdict.ok) {
    return { ok: false, raison: "gate", manquant: verdict.manquant };
  }

  requireEnv("OPENAI_API_KEY");

  const { captes, manquants } = etatCaptation(brief);
  const prompt = passe.buildPrompt({ brief, contexte, captes, manquants });

  let brut: unknown;
  try {
    const result = await generateObject({
      model: openai(PASSE_MODEL_ID),
      prompt,
      schema: passe.schema,
      schemaName: passe.schemaName,
      schemaDescription: passe.schemaDescription,
      temperature: 0.1,
    });
    brut = result.object;
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

    // Sortie structurée refusée : UN seul repli texte + parse.
    try {
      const repli = await generateText({
        model: openai(PASSE_MODEL_ID),
        prompt: `${prompt}\n\nRetourne uniquement le JSON demandé, valide, sans Markdown.\nCorrection requise: ${errorMessage(error)}`,
        temperature: 0.1,
      });
      brut = JSON.parse(extractJson(repli.text)) as unknown;
    } catch (replErreur) {
      if (isProviderInfrastructureError(replErreur)) {
        return {
          ok: false,
          raison: "fournisseur",
          message: `Appel OpenAI échoué: ${errorMessage(replErreur)}`,
          retriable: isRetriable(replErreur),
        };
      }
      return {
        ok: false,
        raison: "sortie_invalide",
        message: `Passe « ${passe.titre} » : sortie invalide après repli JSON. Premier échec: ${errorMessage(error)}. Repli: ${errorMessage(replErreur)}`,
      };
    }
  }

  const validee = validerSortie(passe, brut);
  if (!validee.ok) {
    return { ok: false, raison: "sortie_invalide", message: validee.message };
  }

  return {
    ok: true,
    resultat: {
      passeId: passe.id,
      titre: passe.titre,
      livrable: passe.livrable,
      promptVersion: passe.promptVersion,
      modele: PASSE_MODEL_ID,
      genereLe: now.toISOString(),
      envoiAutomatique: false,
      donnees: validee.donnees,
    },
  };
}
