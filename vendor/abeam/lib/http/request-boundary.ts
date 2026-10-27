/** Match the JSON media type exactly while allowing parameters such as charset. */
export function hasJsonContentType(request: Request): boolean {
  return request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() === "application/json";
}

/** Shared browser-origin policy for authenticated research endpoints. */
export function requestOriginError(request: Request): "invalid" | "cross-origin" | null {
  if (request.headers.get("sec-fetch-site") === "cross-site") return "cross-origin";
  try {
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    if (!origin) return null;
    const source = new URL(origin);
    // Next may expose an internal localhost URL while the browser uses the
    // incoming Host (e.g. 127.0.0.1). Preserve the actual request authority.
    const host = request.headers.get("host")?.trim().toLowerCase() || url.host.toLowerCase();
    const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
    const protocol = forwarded === "http" || forwarded === "https" ? `${forwarded}:` : url.protocol;
    return source.host.toLowerCase() === host && source.protocol === protocol ? null : "cross-origin";
  } catch {
    return "invalid";
  }
}
