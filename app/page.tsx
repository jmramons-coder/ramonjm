import type { ReactNode } from "react";

const applications: ReadonlyArray<{
  name: string;
  slug: string;
  mark: string;
  featured?: boolean;
}> = [
  { name: "Lounge", slug: "lounge", mark: "L" },
  { name: "Maxing", slug: "maxing", mark: "M" },
  { name: "Push", slug: "push", mark: "P" },
  { name: "World", slug: "world", mark: "W" },
  { name: "Add", slug: "add", mark: "+" },
  { name: "Tracer", slug: "tracer", mark: "T" },
  { name: "Abeam", slug: "abeam", mark: "A", featured: true },
];

function ExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a className={className} href={href}>
      {children}
      <span aria-hidden="true">↗</span>
    </a>
  );
}

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#applications">
        Skip to applications
      </a>

      <main className="portfolio-shell" id="top">
        <aside className="profile-panel" aria-labelledby="page-title">
          <header className="profile-header">
            <a className="wordmark" href="#top" aria-label="Ramon JM, home">
              Ramon JM
            </a>
            <ExternalLink
              className="header-link"
              href="https://github.com/jmramons-coder"
            >
              GitHub
            </ExternalLink>
          </header>

          <div className="profile-intro">
            <p className="availability">
              <span aria-hidden="true" />
              Independent digital product work
            </p>
            <p className="eyebrow">Ramon JM / Selected work</p>
            <h1 id="page-title">A clear view of the apps I build.</h1>
            <p className="intro-copy">
              A focused collection of digital products, gathered in one place.
            </p>
            <div className="intro-actions">
              <a className="primary-action" href="#applications">
                View applications <span aria-hidden="true">↓</span>
              </a>
              <ExternalLink
                className="text-action"
                href="https://github.com/jmramons-coder"
              >
                GitHub
              </ExternalLink>
            </div>
          </div>

          <nav className="application-index" aria-label="Application index">
            <p>Application index</p>
            <ol>
              {applications.map((application, index) => (
                <li key={application.slug}>
                  <a href={`#${application.slug}`}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <span>{application.name}</span>
                    <span aria-hidden="true">↘</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <section className="profile-about" aria-labelledby="about-title">
            <p className="eyebrow" id="about-title">
              About
            </p>
            <p>
              I build digital products with an emphasis on clarity, utility,
              and considered interfaces. This portfolio is a simple record of
              that work.
            </p>
          </section>

          <footer className="profile-footer">
            <p>© {new Date().getFullYear()} Ramon JM</p>
            <a href="#top">Back to top ↑</a>
          </footer>
        </aside>

        <section
          className="gallery-panel"
          id="applications"
          aria-labelledby="applications-title"
        >
          <header className="gallery-header">
            <h2 id="applications-title">Selected applications</h2>
            <p>07 / Digital products</p>
          </header>

          <div className="gallery-grid">
            {applications.map((application, index) => (
              <article
                className={`application-card${
                  application.featured ? " application-card--featured" : ""
                }`}
                id={application.slug}
                key={application.slug}
                aria-labelledby={`${application.slug}-title`}
              >
                <div
                  className={`app-canvas app-canvas--${application.slug}`}
                  aria-hidden="true"
                >
                  <span className="motif motif--one" />
                  <span className="motif motif--two" />
                  <span className="motif motif--three" />
                  <span className="canvas-mark">{application.mark}</span>
                </div>
                <div className="application-label">
                  <p>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    Application
                  </p>
                  <h3 id={`${application.slug}-title`}>
                    {application.name}
                  </h3>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
