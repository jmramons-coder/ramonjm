import type { ReactNode } from "react";

const applications = [
  { name: "Lounge", slug: "lounge", mark: "L" },
  { name: "Maxing", slug: "maxing", mark: "M" },
  { name: "Push", slug: "push", mark: "✦" },
  { name: "World", slug: "world", mark: "W" },
  { name: "Add", slug: "add", mark: "+" },
  { name: "Tracer", slug: "tracer", mark: "T" },
  { name: "Abeam", slug: "abeam", mark: "A" },
] as const;

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
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <span aria-hidden="true">↗</span>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to selected work
      </a>

      <header className="site-header" id="top">
        <a className="wordmark" href="#top" aria-label="Ramon JM, home">
          Ramon JM
        </a>
        <ExternalLink
          className="header-action"
          href="https://github.com/jmramons-coder"
        >
          GitHub
        </ExternalLink>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="hero" aria-labelledby="page-title">
          <div className="hero-copy">
            <p className="status-pill">
              <span aria-hidden="true" />
              Ramon JM · App portfolio
            </p>
            <h1 id="page-title">
              <span>Apps, made with a</span>
              <span>clear point of view.</span>
            </h1>
            <p className="hero-description">
              A focused collection of digital products by Ramon JM, gathered
              in one place.
            </p>
            <a className="primary-action" href="#applications">
              <span className="action-dot" aria-hidden="true" />
              Explore the apps
              <span aria-hidden="true">↓</span>
            </a>
          </div>

          <nav className="app-strip" aria-label="Jump to an application">
            <ul>
              {applications.map((application) => (
                <li key={application.slug}>
                  <a href={`#${application.slug}`}>
                    <span
                      className={`app-icon app-icon--${application.slug}`}
                      aria-hidden="true"
                    >
                      <span>{application.mark}</span>
                    </span>
                    <span className="sr-only">Go to {application.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </section>

        <section
          className="work-section"
          id="applications"
          aria-labelledby="applications-title"
        >
          <div className="work-intro">
            <p className="section-pill">Selected work · 07</p>
            <h2 id="applications-title">
              <span>Seven applications.</span>
              <span>One evolving body of work.</span>
            </h2>
          </div>

          <div className="gallery-grid">
            {applications.map((application, index) => (
              <article
                className="application-card"
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
                  <p>{String(index + 1).padStart(2, "0")} / Application</p>
                  <h3 id={`${application.slug}-title`}>
                    {application.name}
                  </h3>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section" aria-labelledby="about-title">
          <p className="section-pill">About</p>
          <div className="about-content">
            <h2 id="about-title">
              <span>Clear products.</span>
              Considered interfaces.
            </h2>
            <p>
              I build digital products with an emphasis on clarity, utility,
              and considered interfaces. This portfolio is a simple record of
              that work.
            </p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-top">
          <p>Ramon JM · Digital product portfolio</p>
          <a href="#top">Back to top ↑</a>
        </div>
        <div className="footer-main">
          <h2>Keep exploring the work behind the apps.</h2>
          <ExternalLink
            className="footer-action"
            href="https://github.com/jmramons-coder"
          >
            Continue on GitHub
          </ExternalLink>
        </div>
        <p className="copyright">© {new Date().getFullYear()} Ramon JM</p>
      </footer>
    </>
  );
}
