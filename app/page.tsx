import type { Metadata } from "next";
import { cookies } from "next/headers";
import { HomeView } from "./home-view";
import { getProjectBySlug } from "./project-links";

type HomeProps = {
  searchParams: Promise<{ project?: string | string[] }>;
};

function requestedProject(value: string | string[] | undefined) {
  return getProjectBySlug(Array.isArray(value) ? value[0] : value);
}

export async function generateMetadata({
  searchParams,
}: HomeProps): Promise<Metadata> {
  const project = requestedProject((await searchParams).project);
  if (!project) return {};

  const title = `${project.title} — Ramon JM`;
  const url = `/?project=${project.slug}`;
  const image = {
    url: project.image.src,
    width: project.image.width,
    height: project.image.height,
    alt: project.image.alt,
  };

  return {
    title,
    description: project.description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: project.description,
      type: "website",
      url,
      siteName: "Ramon JM",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: project.description,
      images: [image],
    },
    ...(project.private
      ? { robots: { index: false, follow: false, noarchive: true } }
      : {}),
  };
}

export default async function Home({ searchParams }: HomeProps) {
  const cookieStore = await cookies();
  const project = requestedProject((await searchParams).project);
  const initialTheme =
    cookieStore.get("portfolio-theme")?.value === "light" ? "light" : "dark";

  return (
    <HomeView initialTheme={initialTheme} initialProject={project?.slug ?? null} />
  );
}
