import type { NextConfig } from "next";

// This is the genuine aBeam frontend with local portfolio services. The parent
// build serves the complete export, so this sub-app has no server or secrets.
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/embed/abeam",
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  devIndicators: false,
  experimental: { cpus: 2 },
};

export default nextConfig;
