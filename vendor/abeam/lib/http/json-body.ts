/** Bound reads even when Content-Length is missing or dishonest. */
export class JsonBodyError extends Error {
  readonly status: 400 | 413;
  constructor(status: 400 | 413, message: string) {
    super(message);
    this.status = status;
  }
}

export async function readJsonObject(request: Request, maxBytes = 1_048_576): Promise<Record<string, unknown>> {
  const declared = Number(request.headers.get("content-length"));
  if (declared > maxBytes) throw new JsonBodyError(413, "Requête trop volumineuse.");
  const reader = request.body?.getReader();
  if (!reader) throw new JsonBodyError(400, "Un objet JSON est requis.");
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let text = "";
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new JsonBodyError(413, "Requête trop volumineuse.");
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    const body: unknown = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new JsonBodyError(400, "Un objet JSON est requis.");
    }
    const record = body as Record<string, unknown>;
    for (const key of ["sessionId", "session_id", "clientId", "client_id", "audioRef", "audio_ref"]) {
      if (record[key] !== undefined && (typeof record[key] !== "string" || (record[key] as string).length > 1024)) {
        throw new JsonBodyError(400, `${key} doit être une chaîne valide.`);
      }
    }
    return record;
  } catch (error) {
    if (error instanceof JsonBodyError) throw error;
    throw new JsonBodyError(400, "JSON invalide.");
  } finally {
    reader.releaseLock();
  }
}

export async function parseJsonBody(request: Request, maxBytes?: number) {
  try {
    return { body: await readJsonObject(request, maxBytes), response: null };
  } catch (error) {
    if (!(error instanceof JsonBodyError)) throw error;
    return { body: null, response: Response.json({ error: error.message }, { status: error.status }) };
  }
}
