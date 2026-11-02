export type ProjectLink = Readonly<{
  id: string;
  slug: string;
  title: string;
  description: string;
  image: Readonly<{
    src: string;
    width: number;
    height: number;
    alt: string;
  }>;
  private?: boolean;
}>;

/** Public links identify expanded portfolio projects, not their embedded apps. */
export const projects: readonly ProjectLink[] = [
  {
    id: "abeam",
    slug: "abeam",
    title: "aBeam",
    description:
      "An interactive AI copilot exploration for conversations, travel planning and client context.",
    image: {
      src: "/showcase/abeam/desktop-explorer.webp",
      width: 1440,
      height: 960,
      alt: "aBeam desktop workspace",
    },
  },
  {
    id: "nudge",
    slug: "nudge",
    title: "Nudge",
    description:
      "A shared to-do app for everyday life. Explore the native task flow and App Store screens.",
    image: {
      src: "/showcase/nudge/native-poster.webp",
      width: 496,
      height: 1078,
      alt: "Nudge native task creation interface",
    },
  },
  {
    id: "case-workspace",
    slug: "case-management",
    title: "Agent-first case management",
    description:
      "A contextual workflow exploration connecting people, AI specialists, tasks, requirements and documents. Access code required.",
    image: {
      src: "/social/portfolio-grid-20261025.png",
      width: 1200,
      height: 630,
      alt: "Ramon JM portfolio — product design and development",
    },
    private: true,
  },
  {
    id: "cryptocroc",
    slug: "cryptocroc",
    title: "CryptoCroc",
    description:
      "A digital legacy concept that helps people organize crypto holdings, prepare beneficiaries and rehearse the handover.",
    image: {
      src: "/showcase/crypto/holdings.webp",
      width: 1100,
      height: 820,
      alt: "CryptoCroc holdings dashboard",
    },
  },
  {
    id: "tracer-brand",
    slug: "tracer",
    title: "Tracer — visual identity",
    description:
      "A research security identity exploring transparency, trust and intelligence through form and material.",
    image: {
      src: "/showcase/editorial/tracer-glass.webp",
      width: 523,
      height: 478,
      alt: "Tracer glass identity mark",
    },
  },
  {
    id: "tracer-website",
    slug: "tracer-website",
    title: "Tracer — website",
    description:
      "Explore the Tracer landing page and Labs in light and dark mode.",
    image: {
      src: "/showcase/tracer-website/landing-dark.webp",
      width: 1440,
      height: 6093,
      alt: "Tracer website landing page in dark mode",
    },
  },
  {
    id: "shakepay",
    slug: "shakepay",
    title: "Shakepay rewards exploration",
    description:
      "An independent product design study exploring rewards, potential and profile interactions. Not affiliated with Shakepay.",
    image: {
      src: "/showcase/shakepay/rewards.webp",
      width: 600,
      height: 1304,
      alt: "Shakepay rewards interaction exploration",
    },
  },
  {
    id: "decision-art",
    slug: "decision-roi-art",
    title: "Decision ROI — artwork",
    description:
      "A sculptural calculator illustration accompanying an exploration of the cost of delayed decisions.",
    image: {
      src: "/showcase/roi/calculator.webp",
      width: 800,
      height: 800,
      alt: "Decision ROI sculptural calculator artwork",
    },
  },
  {
    id: "world-crew",
    slug: "pushedworld",
    title: "PushedWorld",
    description:
      "Explore the App Store presentation for an AR push-up app, with hands-free tracking, Buster and a progression system.",
    image: {
      src: "/world/store-01-count.webp",
      width: 990,
      height: 2151,
      alt: "PushedWorld App Store screen — push, we count",
    },
  },
  {
    id: "crypto-brand",
    slug: "cryptocroc-art",
    title: "CryptoCroc — character artwork",
    description:
      "A character system bringing a playful guide to the serious subject of digital inheritance.",
    image: {
      src: "/showcase/crypto/hang-glider.webp",
      width: 800,
      height: 1200,
      alt: "CryptoCroc hang-glider character illustration",
    },
  },
  {
    id: "decision",
    slug: "decision-roi",
    title: "Decision ROI",
    description:
      "A desktop prototype making the cost of delayed decisions and missing data visible.",
    image: {
      src: "/equisoft-labs/app-screenshot.jpg",
      width: 1200,
      height: 833,
      alt: "Decision ROI desktop prototype",
    },
  },
  {
    id: "grok-safe",
    slug: "grok-safe",
    title: "Grok Safe",
    description:
      "An independent concept exploring AI protection against scams in new message requests. Not affiliated with X or xAI.",
    image: {
      src: "/showcase/grok-safe/scenario-poster.webp",
      width: 804,
      height: 1748,
      alt: "Grok Safe anti-scam message scenario",
    },
  },
  {
    id: "arcera",
    slug: "arcera-rise-daily",
    title: "Arcera Rise Daily",
    description:
      "A layered motion exploration for a personal habits application, with an anatomy of the visual composition.",
    image: {
      src: "/showcase/arcera/loading-poster.webp",
      width: 804,
      height: 1748,
      alt: "Arcera Rise Daily layered loading screen",
    },
  },
  {
    id: "midjourney",
    slug: "midjourney",
    title: "Midjourney · June 19, 2025",
    description: "An animated visual exploration created with Midjourney.",
    image: {
      src: "/showcase/midjourney/poster.webp",
      width: 1080,
      height: 1080,
      alt: "Midjourney spacecraft above the water",
    },
  },
  {
    id: "shakepay-launch",
    slug: "shakepay-launch",
    title: "Shakepay — launch film",
    description:
      "A launch film for an independent fictional Shakepay prototype. Not affiliated with Shakepay.",
    image: {
      src: "/showcase/shakepay/launch-poster.webp",
      width: 720,
      height: 1280,
      alt: "Shakepay independent prototype launch film",
    },
  },
  {
    id: "next-player",
    slug: "next-player",
    title: "Next Player",
    description: "A visual exploration of a game handoff experience.",
    image: {
      src: "/showcase/editorial/nextplayer-handoff.webp",
      width: 1000,
      height: 1000,
      alt: "Next Player handoff artwork",
    },
  },
  {
    id: "lungsmaxing",
    slug: "lungsmaxing",
    title: "Lungsmaxing",
    description:
      "An interactive visual exploration of the potential savings and avoided vaping moments from stopping.",
    image: {
      src: "/showcase/lungsmaxing/impact-scene.webp",
      width: 887,
      height: 1774,
      alt: "Lungsmaxing interactive impact scene",
    },
  },
];

export function getProjectBySlug(value: string | null | undefined) {
  return projects.find((project) => project.slug === value);
}

export function getProjectById(id: string) {
  return projects.find((project) => project.id === id);
}
