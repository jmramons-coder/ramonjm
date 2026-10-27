import type { SuggestionCard, SuggestionsResult } from "@/lib/suggestions/engine";

export type SuggestionPayload = SuggestionsResult & { generatedAt?: string };

type ProgressEvent = { type: "progress"; cards: SuggestionCard[] };
type CompleteEvent = { type: "complete"; result: SuggestionPayload };
type ErrorEvent = { type: "error"; error: string };
type StreamEvent = ProgressEvent | CompleteEvent | ErrorEvent;

/** Read progressive live cards while keeping ordinary JSON callers compatible. */
export async function readSuggestionResponse(
  response: Response,
  onProgress: (cards: SuggestionCard[]) => void,
): Promise<SuggestionPayload> {
  if (!response.headers.get("content-type")?.includes("application/x-ndjson")) {
    return response.json() as Promise<SuggestionPayload>;
  }
  if (!response.body) throw new Error("Flux de suggestions vide.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completed: SuggestionPayload | null = null;

  const consume = (line: string) => {
    if (!line.trim()) return;
    const event = JSON.parse(line) as StreamEvent;
    if (event.type === "progress") onProgress(event.cards);
    if (event.type === "complete") completed = event.result;
    if (event.type === "error") throw new Error(event.error);
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline = buffer.indexOf("\n");
      while (newline !== -1) {
        consume(buffer.slice(0, newline));
        buffer = buffer.slice(newline + 1);
        newline = buffer.indexOf("\n");
      }
    }
    buffer += decoder.decode();
    consume(buffer);
    if (!completed) throw new Error("Flux de suggestions interrompu.");
    return completed;
  } finally {
    reader.releaseLock();
  }
}
