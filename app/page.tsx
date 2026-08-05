import Image from "next/image";

const projects = [
  {
    number: "01",
    title: "Amplify Case Management",
    category: "Insurance operations",
    status: "Prototype",
    description:
      "A high-fidelity workspace that brings cases, documents, requirements, tasks, and contextual AI into one clear insurance-operations flow.",
    stack: ["React", "TypeScript", "Vite", "Tailwind"],
    liveUrl: "https://cm-sandbox-jmr.vercel.app/",
    sourceUrl: "https://github.com/jmramons-coder/CM-sandbox-jmr",
    image: {
      src: "/projects/amplify.png",
      alt: "Case-management workspace with a document viewer, evidence summary, and requirement context",
    },
    visualClass: "project-visual--amplify",
  },
  {
    number: "02",
    title: "Snapuzzle",
    category: "Kids’ creative play",
    status: "Live web app",
    description:
      "A calm, touch-first puzzle-coloring app for children. Assemble cutout pieces, then scratch the artwork to reveal its colour.",
    stack: ["JavaScript", "Supabase", "PWA", "Touch interaction"],
    liveUrl: "https://snapuzzle.ca/",
    sourceUrl: "https://github.com/jmramons-coder/colorcut-studio",
    image: {
      src: "/projects/snapuzzle.webp",
      alt: "A smiling red panda character used in the Snapuzzle creative-play app",
    },
    visualClass: "project-visual--snapuzzle",
  },
  {
    number: "03",
    title: "Kidory",
    category: "Interactive storytelling",
    status: "Prototype",
    description:
      "A cinematic French-and-English picture-book experience with swipe reading, optional narration, bookmarks, and sharing.",
    stack: ["JavaScript", "Responsive web", "EN / FR", "Audio"],
    liveUrl: "https://interactive-stories-six.vercel.app/",
    sourceUrl: "https://github.com/jmramons-coder/interactive-stories",
    image: {
      src: "/projects/kidory.jpg",
      alt: "Warm illustrated story scene of two children building a blanket fort",
    },
    visualClass: "project-visual--kidory",
  },
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
              Selected web applications across complex operations, calm play,
              and interactive storytelling.
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
              Three applications, each shaped around a different kind of
              clarity.
            </p>
          </div>

          <div className="project-list">
            {projects.map((project) => (
              <article className="project" key={project.number}>
                <div className="project-meta">
                  <span>{project.number}</span>
                  <span>{project.category}</span>
                  <span>{project.status}</span>
                </div>

                <div className="project-grid">
                  <div className="project-copy">
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>

                    <ul className="project-stack" aria-label="Technologies">
                      {project.stack.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>

                    <div className="project-links">
                      <ExternalLink
                        className="project-link project-link--primary"
                        href={project.liveUrl}
                      >
                        View live
                      </ExternalLink>
                      <ExternalLink
                        className="project-link"
                        href={project.sourceUrl}
                      >
                        Source
                      </ExternalLink>
                    </div>
                  </div>

                  <a
                    className={`project-visual ${project.visualClass}`}
                    href={project.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${project.title}`}
                  >
                    <div className="project-image-wrap">
                      <Image
                        src={project.image.src}
                        alt={project.image.alt}
                        fill
                        sizes="(max-width: 900px) 100vw, 58vw"
                      />
                    </div>
                    <span className="visual-label" aria-hidden="true">
                      Open project ↗
                    </span>
                  </a>
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
              I build web products that make complicated workflows clearer and
              playful ideas more tangible.
            </p>
            <div className="about-detail">
              <p>
                My work moves between product thinking, interface design, and
                hands-on implementation—from enterprise case management to
                learning and creative-play experiences.
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
