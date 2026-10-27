/** Mechanical response handling shared by the structured-output executors. */
export function providerErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function isProviderInfrastructureError(error: unknown): boolean {
  return /rate limit|unauthorized|forbidden|invalid api key|api key|quota|billing|insufficient_quota|401|403|429/i.test(providerErrorMessage(error));
}

/** Transient failures can be retried later; credentials and billing cannot. */
export function isRetriableProviderError(error: unknown): boolean {
  const message = providerErrorMessage(error);
  if (/quota|billing|insufficient_quota|invalid api key|unauthorized|forbidden|401|403/i.test(message)) return false;
  return /rate limit|429|timeout|ETIMEDOUT|ECONNRESET|502|503|504/i.test(message);
}

/** Extract a candidate object; parsing and schema validation stay with callers. */
export function extractJsonObject(text: string, missingMessage = "La réponse du modèle ne contient pas d'objet JSON."): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? text;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) throw new Error(missingMessage);
  return candidate.slice(firstBrace, lastBrace + 1);
}
