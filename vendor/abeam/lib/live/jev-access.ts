/** Vercel Gateway spends Gateway credits; Connect uses a TypeSafe credential. */
export function jevAccessFromEnv(env: Record<string, string | undefined> = process.env) {
  const mode = env.JEV_ACCESS_MODE
    ?? (env.AI_GATEWAY_API_KEY || env.VERCEL_OIDC_TOKEN ? "gateway" : env.JEV_CONNECTOR_ID ? "connect" : "direct");
  const connectorId = env.JEV_CONNECTOR_ID;
  return {
    gatewayToken: mode === "gateway" ? env.AI_GATEWAY_API_KEY || env.VERCEL_OIDC_TOKEN : undefined,
    connectToken: mode === "connect" && connectorId
      ? async () => {
        const { getToken } = await import("@vercel/connect");
        return getToken(connectorId, { subject: { type: "app" } });
      }
      : undefined,
    apiKey: mode === "direct" ? env.TYPESAFE_API_KEY : undefined,
  };
}
