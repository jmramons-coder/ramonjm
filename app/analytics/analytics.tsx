"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAnalyticsEnabled, saveConsent, track, useAnalyticsConsent } from "./client";
import styles from "./analytics.module.css";

export function Analytics() {
  const pathname = usePathname();
  const enabled = useAnalyticsEnabled();
  const consent = useAnalyticsConsent();
  const lastPage = useRef<string | null>(null);
  const [settings, setSettings] = useState(false);
  useEffect(() => {
    if (consent !== "accepted") { lastPage.current = null; return; }
    if (lastPage.current === pathname) return;
    track("page_view", pathname);
    lastPage.current = pathname;
  }, [pathname, consent]);

  if (!enabled) return null;
  const open = settings || (consent !== "accepted" && consent !== "declined");
  return open ? (
    <aside className={styles.panel} aria-label="Analytics preferences">
      <p><strong>A little insight, with your permission.</strong> Google Analytics helps me understand portfolio visits and which case studies people view. Access codes and private study content are never included.</p>
      <div className={styles.actions}>
        <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">How Google uses data</a>
        <button onClick={() => { saveConsent("declined"); setSettings(false); }}>Decline</button>
        <button onClick={() => { saveConsent("accepted"); setSettings(false); }}>Allow analytics</button>
      </div>
    </aside>
  ) : <button className={styles.settings} onClick={() => setSettings(true)}>Analytics preferences</button>;
}

// Rendered only inside the server-authorized study, never on the access-code form.
export function PrivateStudyAnalytics() {
  const consent = useAnalyticsConsent();
  const sent = useRef(false);
  useEffect(() => {
    if (consent !== "accepted" || sent.current) return;
    track("private_case_study_view", "/shakepay");
    sent.current = true;
  }, [consent]);
  return null;
}
