"use client";

import { useState } from "react";
import styles from "./portfolio-entrance.module.css";

function EntranceAnimation() {
  const [complete, setComplete] = useState(false);
  if (complete) return null;
  return <div className={styles.entrance} data-portfolio-entrance aria-hidden="true" onAnimationEnd={(event) => {
    if (event.target === event.currentTarget) setComplete(true);
  }}>
    <div className={styles.aura} />
    <div className={styles.skeleton}><i /><i /><i /></div>
  </div>;
}

export function PortfolioEntrance({ enabled }: { enabled: boolean }) {
  return enabled ? <EntranceAnimation /> : null;
}
