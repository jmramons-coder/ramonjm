const applications = [
  { name: "Lounge", slug: "lounge", mark: "L" },
  { name: "Maxing", slug: "maxing", mark: "M" },
  { name: "Push", slug: "push", mark: "P" },
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
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      <span>{children}</span>
      <span aria-hidden="true" className="link-arrow">
        ↗
      </span>
    </a>
  );
}

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Ramon JM, home">
          Ramon JM
        </a>
        <nav aria-label="Primary navigation">
          <a href="#applications">Applications</a>
          <a href="#about">About</a>
          <ExternalLink href="https://github.com/jmramons-coder">
            GitHub
          </ExternalLink>
        </nav>
      </header>

      <main id="main-content">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="hero-eyebrow reveal reveal--one">
            <span>Independent product work</span>
            <span>Portfolio / 2026</span>
          </div>

          <div className="hero-title-wrap">
            <p className="hero-kicker reveal reveal--one">Ramon JM</p>
            <h1 id="hero-title" className="reveal reveal--two">
              Useful ideas,
              <span>made unmistakable.</span>
            </h1>
          </div>

          <div className="hero-bottom reveal reveal--three">
            <p>
              A personal index of applications shaped through product thinking,
              interface design, and hands-on implementation.
            </p>
            <a className="round-link" href="#applications" aria-label="Explore applications">
              <span>Explore</span>
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </section>

        <section
          className="applications-section"
          id="applications"
          aria-labelledby="applications-title"
        >
          <div className="applications-heading">
            <p className="section-index">01 / Selected applications</p>
            <h2 id="applications-title">
              Built with care.
              <span>Presented with character.</span>
            </h2>
            <div className="applications-intro">
              <p>
                Seven visual canvases for an evolving body of application work.
              </p>
              <p className="scroll-note" aria-hidden="true">
                Scroll to explore <span>→</span>
              </p>
            </div>
          </div>

          <div
            className="application-rail"
            role="region"
            aria-label="Selected application gallery"
            tabIndex={0}
          >
            {applications.map((application, index) => {
              const number = String(index + 1).padStart(2, "0");

              return (
                <article
                  className="application-card"
                  id={`app-${application.slug}`}
                  key={application.slug}
                >
                  <div className="application-meta">
                    <span>{number}</span>
                    <span>Application</span>
                  </div>

                  <div
                    className={`app-canvas app-canvas--${application.slug}`}
                    aria-hidden="true"
                  >
                    <span className="motif motif--one" />
                    <span className="motif motif--two" />
                    <span className="motif motif--three" />
                    <span className="canvas-mark">{application.mark}</span>
                    <span className="canvas-name">{application.name}</span>
                  </div>

                  <div className="application-footer">
                    <h3>{application.name}</h3>
                    <p>Selected application</p>
                  </div>
                </article>
              );
            })}
          </div>

          <nav className="application-index" aria-label="Application index">
            {applications.map((application, index) => (
              <a href={`#app-${application.slug}`} key={application.slug}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {application.name}
              </a>
            ))}
          </nav>
        </section>

        <section className="about-section" id="about" aria-labelledby="about-title">
          <p className="section-index">02 / Approach</p>
          <div className="about-heading">
            <h2 id="about-title">
              Clear systems.
              <span>Human screens.</span>
            </h2>
            <p>
              I work across product thinking, interface design, and implementation
              to turn focused ideas into useful digital experiences.
            </p>
          </div>

          <div className="about-notes">
            <p>
              The portfolio is deliberately simple: the applications carry the
              personality, while the system around them stays calm and precise.
            </p>
            <ExternalLink
              className="underlined-link"
              href="https://github.com/jmramons-coder"
            >
              Explore the code
            </ExternalLink>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <p className="footer-kicker">Ramon JM / Digital product portfolio</p>
        <p className="footer-statement">
          Make it useful.
          <span>Make it memorable.</span>
        </p>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Ramon JM</p>
          <a href="#top">Back to top ↑</a>
          <ExternalLink href="https://github.com/jmramons-coder">
            GitHub
          </ExternalLink>
        </div>
      </footer>
    </>
  );
}
