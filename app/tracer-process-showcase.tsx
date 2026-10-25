"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import styles from "./tracer-process-showcase.module.css";

const palette = ["#E6EDFD", "#C6D3F1", "#94AFE8", "#638CE0", "#306ED9", "#2557A5", "#1D54B5"];

function ColorPalette() {
  return <section className={styles.livePalette} aria-label="Tracer colour palette"><div className={styles.swatchStack}>{palette.map((color,index) => <button type="button" key={color} className={styles.swatch} style={{ backgroundColor: color, color: index < 4 ? "#183457" : "#fff" }} aria-label={`Colour ${color}`}><span>{color}</span></button>)}</div></section>;
}

function Symbol({ name, label }: { name: string; label: string }) {
  return <figure className={styles.symbol}>{name === "complete" ? <div className={styles.resultComposite}><Image src="/tracer/tracer-symbol-nature.webp" alt="" fill unoptimized /><Image className={styles.resultMark} src="/tracer/tracer-symbol-complete.webp" alt={label} width={523} height={478} unoptimized /></div> : <Image src={`/tracer/tracer-symbol-${name}.webp`} alt={label} width={480} height={480} unoptimized />}<figcaption>{label}</figcaption></figure>;
}

export function ProcessGallery({ paused, onClose }: { paused: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    element.querySelector<HTMLButtonElement>('[aria-label="Close Tracer design gallery"]')?.focus({ preventScroll: true });
    element.scrollTop = 0;
    return () => { element.close(); document.body.style.overflow = overflow; };
  }, []);
  return <dialog ref={dialog} className={styles.dialog} aria-label="Tracer identity design gallery" data-paused={paused} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className={styles.gallery}>
      <figure className={styles.heroGlass}><Image src="/showcase/editorial/tracer-landscape.webp" alt="" fill unoptimized /><Image className={styles.glassMark} src="/showcase/editorial/tracer-glass.webp" alt="Tracer glass monogram against a natural landscape" width={523} height={478} unoptimized /></figure>
      <figure className={styles.system}><Image src="/showcase/editorial/tracer-system.webp" alt="Tracer brand guidelines, our purpose and primary logotype" width={1800} height={327} unoptimized /></figure>
      <figure className={styles.campaign}><Image src="/tracer/campaign-human.webp" alt="Tracer research security campaign with a researcher" width={2000} height={1500} unoptimized /></figure>
      <figure className={styles.campaign}><Image src="/tracer/campaign-architecture.webp" alt="Tracer research security campaign with modern architecture" width={2000} height={1500} unoptimized /></figure>
      <section className={styles.diagramWindow} aria-label="Tracer identity construction" tabIndex={0}>
        <div className={styles.diagram}>
          <svg className={styles.connections} viewBox="0 0 1120 520" preserveAspectRatio="none" aria-hidden="true"><path d="M420 65h20q18 0 18 18v160q0 17 20 17h38M420 195h20q18 0 18 18v30M420 325h20q18 0 18-18v-47M420 455h20q18 0 18-18V280q0-20 20-20M805 170h12q18 0 18 18v55q0 17 20 17h30M805 330h12q18 0 18-18v-35" /></svg>
          <div className={styles.iterations}>
            {[{name:"modules-inward",label:"Letterform"},{name:"modules-outward",label:"Modular exploration"},{name:"movement-dark",label:"Direction"},{name:"movement-light",label:"Movement study"}].map(item => <Symbol key={item.name} {...item} />)}
          </div>
          <div className={styles.principles}>
            {[{name:"eye",label:"Horus eye"},{name:"movement",label:"Movement"},{name:"path",label:"Path"},{name:"shield",label:"Protection"}].map(item => <Symbol key={item.name} {...item} />)}
          </div>
          <div className={styles.synthesis}><Symbol name="final" label="The monogram" /></div>
          <div className={styles.materials}><Symbol name="nature" label="Authenticity · Nature" /><Symbol name="glass" label="Glass · Transparency" /><Symbol name="outlines" label="Simple · Minimal outlines" /></div>
          <div className={styles.result}><Symbol name="complete" label="The Tracer identity" /></div>
        </div>
      </section>
      <ColorPalette />
      <figure className={styles.fullCampaign}><Image src="/tracer/brand-campaign.webp" alt="Tracer landscape campaign displayed on a large billboard" width={2400} height={1600} unoptimized /></figure>

    </div>
    <button type="button" className={styles.close} aria-label="Close Tracer design gallery" onClick={onClose}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg><span role="tooltip">Close gallery</span></button>
  </dialog>;
}
