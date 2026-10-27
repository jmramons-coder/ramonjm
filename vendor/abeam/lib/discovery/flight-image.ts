/** Keep an actual provider airline logo; never derive one from a carrier name. */
export function flightOfferImage(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 2000) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port
      || [...url.searchParams.keys()].some((key) => /^(api[_-]?key|access[_-]?token)$/i.test(key))) return undefined;
    const hostname = url.hostname.toLowerCase();
    if (hostname === "googleusercontent.com" || hostname.endsWith(".googleusercontent.com")) return url.href;
    if ((hostname === "gstatic.com" || hostname === "www.gstatic.com")
      && /^\/flights\/airline_logos\/(?:\d+(?:px)?\/)?[a-z\d_-]+\.(?:png|svg|webp|jpe?g)$/i.test(url.pathname)) return url.href;
    return undefined;
  } catch { return undefined; }
}
