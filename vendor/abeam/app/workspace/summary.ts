import type { TripBrief } from "@/lib/extraction/trip-brief";
import { defineBilingualCopy } from "../../lib/ui/copy.ts";
import type { UILanguage } from "../../lib/ui/language.ts";
import type { BriefSummary, SessionSetup, SessionSummary, TranscriptLine } from "./types.ts";

const COPY = defineBilingualCopy({
  fr: {
    headline: (title: string) => `Un premier aperçu pour ${title}.`,
    nextHeadline: "Un premier aperçu pour la prochaine conversation.",
    captured: "Les éléments importants de la conversation sont prêts à être relus.",
    noTranscript: "Aucune transcription n’a été enregistrée. Ajoutez les informations connues avant de partager cet aperçu.",
    unknown: "Non confirmé",
    unknownDates: "À confirmer",
    priorities: "Relire la transcription et confirmer les priorités du client",
    noConstraints: "Aucune contrainte captée pour le moment",
    openQuestions: "Confirmer le contexte, les dates, les personnes et le budget",
    completeContext: "Compléter le contexte de la conversation",
    nextSteps: "Préparer les premières étapes adaptées",
  },
  en: {
    headline: (title: string) => `A clear starting brief for ${title}.`,
    nextHeadline: "A clear starting brief for the next conversation.",
    captured: "The important direction has been captured from the conversation and is ready for review.",
    noTranscript: "No transcript was captured. Add the known details before sharing this brief.",
    unknown: "Not confirmed",
    unknownDates: "To be confirmed",
    priorities: "Review the transcript and confirm the contact’s top priorities",
    noConstraints: "No constraints captured yet",
    openQuestions: "Confirm context, timing, people, and budget",
    completeContext: "Complete the conversation context",
    nextSteps: "Prepare the first tailored next steps",
  },
});

export function buildSummary(lines: TranscriptLine[], setup: SessionSetup, language: UILanguage = "en"): SessionSummary {
  const copy = COPY[language];
  const spokenLines = lines.filter((line) => line.kind !== "private-note");
  const text = spokenLines.map((line) => line.text).join(" ").toLowerCase();

  const budgetMatch = text.match(/(?:budget|around|about)\s+([^.!?]{0,45})/i);
  const travelerMatch = text.match(/\b(one|two|three|four|five|six|\d+)\s+(?:adults?|travell?ers?|people)\b/i);

  return {
    headline: setup.tripTitle ? copy.headline(setup.tripTitle) : copy.nextHeadline,
    atGlance: spokenLines.length > 0 ? copy.captured : copy.noTranscript,
    travelers: travelerMatch ? travelerMatch[0] : copy.unknown,
    dates: copy.unknownDates,
    budget: budgetMatch ? budgetMatch[1].trim() : copy.unknown,
    preferences: [copy.priorities],
    constraints: [copy.noConstraints],
    openQuestions: [copy.openQuestions],
    followUps: [copy.completeContext, copy.nextSteps],
  };
}

export function isTripBriefSummary(summary: BriefSummary | null | undefined): summary is TripBrief {
  return Boolean(
    summary
    && typeof summary === "object"
    && "voyageurs" in summary
    && "lieu" in summary
    && "decision" in summary,
  );
}
