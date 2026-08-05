const projectSlots = ["01", "02", "03"] as const;

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
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noreferrer"
    >
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
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <ExternalLink href="https://github.com/jmramons-coder">
            GitHub
          </ExternalLink>
        </nav>
      </header>

      <main id="main-content">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="hero-kicker reveal reveal--one">
            <span className="signal" aria-hidden="true" />
            Digital product portfolio
          </div>

          <h1 id="hero-title" className="reveal reveal--two">
            Digital products,
            <span>considered from</span>
            <span>system to screen.</span>
          </h1>

          <div className="hero-footer reveal reveal--three">
            <p>
              An evolving collection of digital product work. Selected case
              studies will appear here when they are ready to share.
            </p>
            <a className="down-link" href="#work">
              <span>Selected work</span>
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </section>

        <section className="work-section" id="work" aria-labelledby="work-title">
          <div className="section-heading">
            <p className="section-index">01—03 / Selected</p>
            <h2 id="work-title">Work</h2>
            <p className="section-note">
              A quiet framework for selected work, ready for each future case
              study.
            </p>
          </div>

          <div className="project-list">
            {projectSlots.map((number) => (
              <article className="project project--empty" key={number}>
                <div className="project-meta">
                  <span>{number}</span>
                  <span>Project slot</span>
                  <span>Reserved</span>
                </div>

                <div
                  className="empty-project"
                  aria-labelledby={`empty-project-${number}`}
                >
                  <span className="empty-project-marker" aria-hidden="true">
                    +
                  </span>
                  <div className="empty-project-copy">
                    <p className="empty-project-label">Case study {number}</p>
                    <h3 id={`empty-project-${number}`}>Project coming soon.</h3>
                  </div>
                  <p className="empty-project-note">
                    Reserved for selected work.
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section" id="about" aria-labelledby="about-title">
          <div className="section-heading section-heading--about">
            <p className="section-index">04 / About</p>
            <h2 id="about-title">A clear idea, made tangible.</h2>
          </div>

          <div className="about-grid">
            <p className="about-lead">
              I turn clear ideas into useful, considered digital products.
            </p>
            <div className="about-detail">
              <p>
                My work moves between product thinking, interface design, and
                hands-on implementation. This portfolio will grow as new work
                is ready to share.
              </p>
              <ExternalLink
                className="text-link"
                href="https://github.com/jmramons-coder"
              >
                Explore all repositories
              </ExternalLink>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-mark" aria-hidden="true">
          RJ
        </div>
        <div className="footer-copy">
          <p>Ramon JM</p>
          <p>Digital product portfolio</p>
        </div>
        <ExternalLink
          className="footer-link"
          href="https://github.com/jmramons-coder"
        >
          GitHub
        </ExternalLink>
        <p className="copyright">© {new Date().getFullYear()}</p>
      </footer>
    </>
  );
}
