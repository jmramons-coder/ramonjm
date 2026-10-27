import type { NextConfig } from "next";
import { existsSync } from "node:fs";

// Private assets must accompany every deployment. Never publish an incomplete study.
if (process.env.VERCEL && !existsSync("private-media/film.mp4")) {
  throw new Error(
    "Shakepay private media missing. Deploy from the portfolio workspace with private-media included; see docs/shakepay-private-study.md.",
  );
}

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/shakepay/media/*": ["./private-media/**/*"] },
  async rewrites() {
    return [{ source: "/embed/abeam", destination: "/embed/abeam/index.html" }];
  },
  async headers() {
    return [
      {
        source: "/embed/abeam/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'none'; media-src 'self' blob:; object-src 'none'; frame-src 'none'; base-uri 'self'; frame-ancestors 'self'",
          },
          {
            key: "Permissions-Policy",
            value: "microphone=(), camera=(), geolocation=()",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
