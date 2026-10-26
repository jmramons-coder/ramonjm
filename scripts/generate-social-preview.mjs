// Compose the sharing card from the same real product assets as the home grid.
// Change the output filename in app/layout.tsx when publishing a new composition.
import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const destination = resolve(root, "public/social/portfolio-grid-20261025.png");
const assets = {
  portrait: "public/profile/ramon.jpg",
  desktop: "public/showcase/abeam/desktop-explorer.webp",
  voice: "public/showcase/abeam/mobile-voice-session.webp",
  nudge: "public/nudge/store-01-voice.webp",
  world: "public/world/store-01-count.webp",
  landscape: "public/showcase/editorial/tracer-landscape.webp",
  glass: "public/showcase/editorial/tracer-glass.webp",
};
const images = Object.fromEntries(
  await Promise.all(
    Object.entries(assets).map(async ([name, path]) => {
      const data = await sharp(await readFile(resolve(root, path)))
        .png()
        .toBuffer();
      return [name, `data:image/png;base64,${data.toString("base64")}`];
    }),
  ),
);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow"><stop stop-color="#24334d"/><stop offset="1" stop-color="#0a0b0d"/></radialGradient>
    <linearGradient id="beam" x2=".8" y2="1"><stop stop-color="#172136"/><stop offset="1" stop-color="#34547f"/></linearGradient>
    <linearGradient id="fade" x2="0" y2="1"><stop stop-color="#0a0b0d" stop-opacity="0"/><stop offset="1" stop-color="#0a0b0d" stop-opacity=".85"/></linearGradient>
    <clipPath id="portrait"><circle cx="83" cy="83" r="35"/></clipPath>
    <clipPath id="beamCard"><rect x="500" y="40" width="652" height="292" rx="22"/></clipPath>
    <clipPath id="desktop"><rect x="526" y="102" width="586" height="391" rx="9"/></clipPath>
    <clipPath id="voice"><rect x="1005" y="78" width="117" height="253" rx="16"/></clipPath>
    <clipPath id="tracer"><rect x="500" y="346" width="216" height="244" rx="22"/></clipPath>
    <clipPath id="nudge"><rect x="730" y="346" width="204" height="443" rx="22"/></clipPath>
    <clipPath id="world"><rect x="948" y="346" width="204" height="443" rx="22"/></clipPath>
  </defs>
  <rect width="1200" height="630" fill="#0a0b0d"/>
  <ellipse cx="1130" cy="230" rx="620" ry="690" fill="url(#glow)" opacity=".55"/>

  <image xlink:href="${images.portrait}" x="48" y="48" width="70" height="70" clip-path="url(#portrait)"/>
  <circle cx="83" cy="83" r="35" fill="none" stroke="#ffffff26"/>
  <g font-family="Helvetica Neue,Arial,sans-serif">
    <text x="134" y="78" fill="#f5f5f7" font-size="27" font-weight="600" letter-spacing="-.8">Ramon JM</text>
    <text x="134" y="103" fill="#a6a8b0" font-size="16">Product designer &amp; builder</text>

    <text x="48" y="228" fill="#f5f5f7" font-size="63" font-weight="600" letter-spacing="-3.2">Design &amp; build.</text>
    <text x="48" y="299" fill="#a6b8d0" font-size="63" font-weight="600" letter-spacing="-3.2">Zero to one.</text>
    <text x="50" y="353" fill="#a6a8b0" font-size="20">Design, strategy, AI &amp; passion.</text>

    <g fill="none" stroke="#ffffff2b">
      <rect x="48" y="393" width="52" height="34" rx="17"/>
      <rect x="108" y="393" width="46" height="34" rx="17"/>
      <rect x="162" y="393" width="96" height="34" rx="17"/>
      <rect x="266" y="393" width="106" height="34" rx="17"/>
    </g>
    <g fill="#c4c6ce" font-size="14" text-anchor="middle">
      <text x="74" y="415">UX</text><text x="131" y="415">UI</text>
      <text x="210" y="415">Strategy</text><text x="319" y="415">Research</text>
    </g>
    <text x="48" y="574" fill="#a6a8b0" font-size="18" letter-spacing="-.3">ramonjm.com</text>
  </g>

  <g clip-path="url(#beamCard)">
    <rect x="500" y="40" width="652" height="292" fill="url(#beam)"/>
    <text x="526" y="78" font-family="Helvetica Neue,Arial,sans-serif" fill="#f0f5ff" font-size="19" font-weight="600">aBeam</text>
    <rect x="523" y="99" width="592" height="397" rx="12" fill="#dfe5ed"/>
    <image xlink:href="${images.desktop}" x="526" y="102" width="586" height="391" clip-path="url(#desktop)"/>
    <rect x="1001" y="74" width="125" height="261" rx="20" fill="#e0e6ef"/>
    <image xlink:href="${images.voice}" x="1005" y="78" width="117" height="253" clip-path="url(#voice)"/>
  </g>
  <g clip-path="url(#tracer)">
    <image xlink:href="${images.landscape}" x="486" y="346" width="244" height="244" preserveAspectRatio="xMidYMid slice"/>
    <image xlink:href="${images.glass}" x="523" y="391" width="170" height="155"/>
  </g>
  <image xlink:href="${images.nudge}" x="730" y="346" width="204" height="443" clip-path="url(#nudge)"/>
  <image xlink:href="${images.world}" x="948" y="346" width="204" height="443" clip-path="url(#world)"/>
  <rect x="480" y="566" width="720" height="64" fill="url(#fade)"/>
</svg>`;

await mkdir(resolve(root, "public/social"), { recursive: true });
await writeFile(destination, await sharp(Buffer.from(svg)).png().toBuffer());
console.log(destination);
