import { AssemblyAI, type Transcript, type TranscriptSentence, type TranscriptUtterance } from "assemblyai";

import { requireEnv } from "@/lib/env";
import { estIsoleDansLeTemps, evaluerTour } from "@/lib/transcription/hallucination";
import { STT_CONTEXT_PROMPT, TRAVEL_KEYTERMS } from "@/lib/transcription/keyterms";
import type { SttAdapter, TranscriptLine, TranscriptSpeaker } from "@/lib/transcription/types";

const ADVISOR_PATTERNS = [
  /\bbonjour\b/i,
  /\bje vais\b/i,
  /\best-ce que\b/i,
  /\bpouvez-vous\b/i,
  /\bavez-vous\b/i,
  /\bquel(?:le|s|les)?\b/i,
  /\bcombien\b/i,
  /\bbudget\b/i,
  /\bdates?\b/i,
  /\bdestination\b/i,
  /\bassurance\b/i,
  /\bpréférez-vous\b/i,
];

const CLIENT_PATTERNS = [
  /\bon aimerait\b/i,
  /\bj'aimerais\b/i,
  /\bnous voulons\b/i,
  /\bon voudrait\b/i,
  /\bma conjointe\b/i,
  /\bmon conjoint\b/i,
  /\bmes enfants\b/i,
  /\bnotre budget\b/i,
  /\bon hésite\b/i,
  /\bpas sûrs?\b/i,
];

function scoreSpeaker(text: string, patterns: RegExp[]) {
  return patterns.reduce((score, pattern) => score + (pattern.test(text) ? 1 : 0), 0);
}

type TranscriptSegment = {
  start: number;
  end: number;
  speaker: string | null;
  text: string;
  confidence: number;
};

function inferSpeakerMap(segments: TranscriptSegment[]) {
  const scores = new Map<string, number>();

  for (const segment of segments) {
    const speaker = segment.speaker ?? "unknown";
    const advisorScore = scoreSpeaker(segment.text, ADVISOR_PATTERNS);
    const clientScore = scoreSpeaker(segment.text, CLIENT_PATTERNS);
    scores.set(speaker, (scores.get(speaker) ?? 0) + advisorScore - clientScore);
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const advisorLabel = ranked[0]?.[0] ?? segments[0]?.speaker ?? "unknown";

  return new Map<string, TranscriptSpeaker>(
    [...scores.keys()].map((label) => [label, label === advisorLabel ? "Advisor" : "Client"]),
  );
}

/**
 * LE MÊME TROU EXISTE ICI — la transcription batch de la sauvegarde n'est pas
 * à l'abri de la phrase inventée : c'est le même moteur, sur le même audio, et
 * c'est CE transcript-là qui devient le document officiel de la rencontre.
 *
 * Deux différences avec le live, qui changent les signaux disponibles :
 *  – il n'y a pas de porte d'énergie à la sauvegarde. Le substitut honnête de
 *    « arrivé sur du silence » est l'ISOLEMENT TEMPOREL, directement mesurable
 *    sur `utterances[].start/end` : un tour entouré d'un grand blanc des deux
 *    côtés est posé sur du silence ;
 *  – le batch expose, lui, une VRAIE confiance de transcription par tour
 *    (`utterances[].confidence`), là où le streaming n'a que le mot à mot.
 *
 * Le filtrage se fait AVANT `inferSpeakerMap` : c'est précisément parce que le
 * tour inventé a été étiqueté « Client » qu'il aurait fini dans le courriel.
 * Le laisser voter sur l'attribution des voix serait le laisser abîmer deux
 * fois le transcript.
 */
function sansHallucinations<T extends TranscriptSegment>(segments: T[], language?: string): T[] {
  const bornes = segments.map((segment) => ({ start: segment.start, end: segment.end }));
  const gardees = segments.filter((segment, index) =>
    evaluerTour({
      texte: segment.text,
      confianceDuTour: typeof segment.confidence === "number" ? segment.confidence : null,
      surSilence: estIsoleDansLeTemps(index, bornes),
      langueAttendue: language ?? null,
      vocabulaireDeLaRencontre: TRAVEL_KEYTERMS,
    }).garder,
  );
  // Filet : si la règle jetait TOUT (audio atypique, seuils mal calibrés), on
  // rend le transcript brut. Un transcript imparfait vaut mieux qu'aucun.
  return gardees.length > 0 ? gardees : segments;
}

function linesFromSegments(segments: TranscriptSegment[]): TranscriptLine[] {
  const speakerMap = inferSpeakerMap(segments);

  return segments.map((segment, index) => ({
    id: `aai-${index + 1}`,
    speaker: speakerMap.get(segment.speaker ?? "unknown") ?? "Conversation",
    text: segment.text,
    time: Math.max(1, Math.round(segment.start / 1000)),
    // Bornes exactes conservées : `time` est arrondi à la seconde (et planché à 1s)
    // pour l'affichage, ce qui est trop grossier et faux au tout début de
    // l'enregistrement pour servir d'ancre de provenance. Voir anchor.ts.
    startMs: Math.max(0, Math.round(segment.start)),
    endMs: Math.max(0, Math.round(segment.end)),
  }));
}

function assertCompleted(transcript: Transcript) {
  if (transcript.status === "error") {
    throw new Error(transcript.error ?? "AssemblyAI a retourné une erreur de transcription.");
  }

  if (transcript.status !== "completed") {
    throw new Error(`Transcription AssemblyAI incomplète: ${transcript.status}.`);
  }
}

export function createAssemblyAiSttAdapter(): SttAdapter {
  const client = new AssemblyAI({ apiKey: requireEnv("ASSEMBLYAI_API_KEY") });

  return {
    async transcribe(input) {
      const transcript = await client.transcripts.transcribe({
        audio: input.audioUrl,
        speech_models: ["universal-3-5-pro", "universal-2"],
        speaker_labels: input.diarize,
        // Omise (undefined) => universal-3-5-pro code-switch nativement (FR/EN mêlés).
        language_code: input.language,
        // Contexte + vocabulaire voyage (agence QC) : améliore accents, noms de
        // destinations, marques d'hôtels et termes du métier. Voir keyterms.ts.
        prompt: STT_CONTEXT_PROMPT,
        keyterms_prompt: TRAVEL_KEYTERMS,
      });

      assertCompleted(transcript);

      // `utterances` peut contenir un seul bloc quand une même personne parle
      // longtemps. AssemblyAI fournit pourtant une segmentation beaucoup plus
      // utile dans `sentences` : elle conserve les bornes temporelles sans
      // inventer de changement de locuteur. Utiliser les phrases ici évite que
      // tout un monologue devienne une seule ligne officielle, ce qui retardait
      // les ancres, les corrections de destination et la reprise du brief.
      const transcriptAvecPhrases = transcript as Transcript & { sentences?: TranscriptSentence[] };
      const segments: Array<TranscriptSentence | TranscriptUtterance> = transcriptAvecPhrases.sentences?.length
        ? transcriptAvecPhrases.sentences
        : transcript.utterances ?? [];
      const gardes = sansHallucinations(segments, input.language);
      if (gardes.length > 0) {
        return { lines: linesFromSegments(gardes) };
      }

      return {
        lines: transcript.text
          ? [{
              id: "aai-1",
              speaker: "Conversation",
              text: transcript.text,
              time: 1,
              // Sans diarisation, tout le transcript est un seul bloc : la seule
              // ancre honnête est le début de l'enregistrement.
              startMs: 0,
            }]
          : [],
      };
    },
  };
}
