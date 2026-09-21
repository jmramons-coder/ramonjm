import type { NextConfig } from "next";
import { existsSync } from "node:fs";

// Private assets must accompany every deployment. Never publish an incomplete study.
if (process.env.VERCEL && !existsSync("private-media/film.mp4")) {
  throw new Error("Shakepay private media missing. Deploy from the portfolio workspace with private-media included; see docs/shakepay-private-study.md.");
}

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/shakepay/media/*": ["./private-media/**/*"] },
};

export default nextConfig;
