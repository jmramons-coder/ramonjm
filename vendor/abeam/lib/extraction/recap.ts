import "server-only";

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

import { requireEnv } from "@/lib/env";
import { buildRecapPrompt, type RecapContext } from "@/lib/extraction/recap-prompt";
import type { TripBrief } from "@/lib/extraction/trip-brief";

export const RECAP_MODEL_ID = "gpt-4.1-mini";

const recapSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10_000),
});

export type ClientRecap = z.infer<typeof recapSchema>;

export async function generateClientRecap(
  brief: TripBrief,
  context: RecapContext,
): Promise<ClientRecap> {
  requireEnv("OPENAI_API_KEY");

  const result = await generateObject({
    model: openai(RECAP_MODEL_ID),
    prompt: buildRecapPrompt(brief, context),
    schema: recapSchema,
    schemaName: "ClientRecap",
    schemaDescription: "Courriel de suivi client en français avec objet et corps.",
    temperature: 0.1,
  });

  const subject = result.object.subject.trim();
  const body = result.object.body.trim();
  if (!subject || !body) {
    throw new Error("Le modèle a produit un récap vide.");
  }

  return { subject, body };
}
