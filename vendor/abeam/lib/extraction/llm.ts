import "server-only";

import { openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";

import { buildExtractionPrompt } from "@/lib/extraction/prompt";
import { tripBriefSchema } from "@/lib/extraction/schema";
import { assertTripBrief } from "@/lib/extraction/validate";
import { requireEnv } from "@/lib/env";
import { providerErrorMessage as errorMessage, isProviderInfrastructureError, extractJsonObject } from "@/lib/ai/response";
import type { TripBrief } from "@/lib/extraction/trip-brief";
import type { TranscriptLine } from "@/lib/transcription/types";

export const EXTRACTION_MODEL_ID = "gpt-4.1-mini";

async function generateJsonFallback(prompt: string, retryHint?: string): Promise<TripBrief> {
  const result = await generateText({
    model: openai(EXTRACTION_MODEL_ID),
    prompt: `${prompt}

Retourne uniquement le JSON TripBrief valide, sans Markdown.
${retryHint ? `Correction requise: ${retryHint}` : ""}`,
    temperature: 0.1,
  });

  const parsed = JSON.parse(extractJsonObject(result.text, "La réponse LLM ne contient pas d'objet JSON.")) as unknown;
  return assertTripBrief(parsed);
}

export async function extractTripBriefWithLlm(transcript: TranscriptLine[], knownContext?: string | null): Promise<TripBrief> {
  requireEnv("OPENAI_API_KEY");

  const prompt = buildExtractionPrompt(transcript, knownContext);

  try {
    const result = await generateObject({
      model: openai(EXTRACTION_MODEL_ID),
      prompt,
      schema: tripBriefSchema,
      schemaName: "TripBrief",
      schemaDescription: "Brief voyage structure TripBrief v1 pour aBeam.",
      temperature: 0.1,
    });
    return assertTripBrief(result.object);
  } catch (error) {
    if (isProviderInfrastructureError(error)) {
      throw new Error(`Appel OpenAI échoué: ${errorMessage(error)}`);
    }

    const firstError = errorMessage(error) || "sortie structurée invalide";
    try {
      return await generateJsonFallback(prompt, firstError);
    } catch (retryError) {
      throw new Error(
        `Extraction TripBrief invalide après retry JSON. Premier échec: ${firstError}. Retry: ${
          retryError instanceof Error ? retryError.message : "erreur inconnue"
        }`,
      );
    }
  }
}
