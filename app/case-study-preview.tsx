import styles from "./case-study-preview.module.css";

/** An anonymous visual teaser: no case records are rendered before access. */
export function CaseStudyPreview({ cover = false }: { cover?: boolean }) {
  return (
    <div className={styles.preview} data-cover={cover} aria-hidden="true">
      <div className={styles.interface}>
        <aside>
          <b>Workspace</b>
          <span>Cases</span><span>Tasks</span>
          <i /><i /><i />
        </aside>
        <section>
          <div className={styles.topbar}><i /><i /></div>
          <div className={styles.heading}><i /><span /></div>
          <div className={styles.tabs}><i /><i /><i /><i /><i /></div>
          <div className={styles.search}><i /><span /></div>
          <div className={styles.table}>
            {Array.from({ length: 7 }, (_, index) => (
              <div key={index}>
                <i style={{ width: `${48 + (index % 3) * 12}%` }} />
                <span className={styles.actor}><b /><i /></span>
                <span className={styles.status} />
              </div>
            ))}
          </div>
        </section>
      </div>
      {cover && (
        <div className={styles.cover}>
          <span className={styles.lock}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="5" y="10" width="14" height="11" rx="3" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
            </svg>
          </span>
          <strong>Private project</strong>
          <span>Access code required</span>
        </div>
      )}
    </div>
  );
}
