"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import styles from "./arcera-exploration.module.css";

const layers = [
  { asset: "sky", title: "A place to begin", detail: "A full-bleed painted sky establishes the emotional tone. The open centre leaves room for the sun and identity without competing edges.", note: "01 / Background artwork" },
  { asset: "sun", title: "One point of attention", detail: "A separate sun sits a quarter of the way down the screen. A slow opacity breath creates a focal point without moving the interface.", note: "02 / Light & hierarchy" },
  { asset: "clouds", title: "Depth, at different speeds", detail: "Two instances of one transparent cloud asset drift in opposite directions. The nearer plane is softened to 30% opacity and masked at the centre to protect readability.", note: "03 / Foreground atmosphere" },
  { asset: null, title: "A little life, drawn in code", detail: "Five white gulls are drawn with SwiftUI Canvas paths. Independent flight phases and a continuous wing shape keep their movement organic; no bird sprite sheet is needed.", note: "04 / Procedural motion" },
  { asset: "wordmark", title: "A clear invitation to enter", detail: "Separate wordmark and Rise Daily artwork carry the expressive identity. Supporting text and the entry button stay native, with a narrow masked highlight moving across the lettering.", note: "05 / Identity & interaction" },
] as const;

function Gulls() {
  return <svg viewBox="0 0 200 100" className={styles.gulls} aria-hidden="true">{[0,1,2].map(i => <g key={i} transform={`translate(${38+i*58} ${35+(i%2)*28})`}><path d="M-19-5Q-8-13 0 3Q8-13 19-5Q8-6 0 8Q-8-6-19-5" fill="currentColor" /></g>)}</svg>;
}

function LayerControl({ name, value, onChange }: { name: string; value: number; onChange: (value: number) => void }) {
  const label = value > 0 ? `Reassemble ${name} layers` : `Separate ${name} layers`;
  return <div className={styles.layerControl}><button type="button" aria-label={label} aria-pressed={value > 0} onClick={()=>onChange(value > 0 ? 0 : 100)}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m3 8 9-5 9 5-9 5-9-5Zm0 4 9 5 9-5M3 16l9 5 9-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg><span role="tooltip">{label}</span></button><input type="range" min="0" max="100" value={value} onChange={event=>onChange(Number(event.target.value))} aria-label={`${name} layer separation`} aria-valuetext={`${value}% separated`} /></div>;
}

function ExplodedComposition({ paused }: { paused: boolean }) {
  const stage = useRef<HTMLDivElement>(null);
  const [depth,setDepth] = useState(100);
  useEffect(() => {
    const element = stage.current;
    if (!element || paused || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => { frame = 0; const rect=element.getBoundingClientRect(); const progress=Math.max(0,Math.min(1,(innerHeight-rect.top)/(innerHeight*.85))); element.style.setProperty("--lift",`${progress*36}px`); };
    const queue = () => { if (!frame) frame=requestAnimationFrame(update); };
    const parent=element.closest("dialog");
    parent?.addEventListener("scroll",queue,{passive:true}); window.addEventListener("resize",queue); update();
    return () => { parent?.removeEventListener("scroll",queue); window.removeEventListener("resize",queue); cancelAnimationFrame(frame); };
  },[paused]);
  return <section className={styles.depthSection}>
    <div className={styles.sectionIntro}><span>Composition study / 02</span><h2>A small world,<br />built in planes.</h2><p>The depth comes from a few independent layers. Scroll through the scene to lift them apart, then reassemble it to see how they resolve into one screen.</p><ol>{["Painted sky","Breathing sunlight","Drifting cloud planes","Coded gulls & horizon","Wordmark & entry UI"].map(item=><li key={item}>{item}</li>)}</ol></div>
    <div ref={stage} className={styles.depthStage} data-separated={depth > 0} style={{ "--layer-amount": depth / 100 } as CSSProperties} aria-label={depth > 0 ? "Exploded artwork layers" : "Reassembled artwork layers"}>
      <div className={styles.layerStack}>
        <div className={`${styles.plane} ${styles.skyPlane}`}><Image src="/showcase/arcera/sky.webp" alt="Painted sky layer" fill unoptimized /></div>
        <div className={`${styles.plane} ${styles.sunPlane}`}><Image src="/showcase/arcera/sun.webp" alt="Transparent sun layer" fill unoptimized /></div>
        <div className={`${styles.plane} ${styles.cloudPlane}`}><Image src="/showcase/arcera/clouds.webp" alt="Transparent foreground cloud layer" fill unoptimized /></div>
        <div className={`${styles.plane} ${styles.horizonPlane}`}><Gulls /><Image src="/showcase/arcera/horizon.webp" alt="Coastal horizon layer" fill unoptimized /></div>
        <div className={`${styles.plane} ${styles.identityPlane}`}><Image src="/showcase/arcera/wordmark.webp" alt="Arcera wordmark layer" width={720} height={240} unoptimized /><Image src="/showcase/arcera/tagline.webp" alt="Rise Daily lettering layer" width={720} height={240} unoptimized /><span>Small steps. Real momentum.</span><i>Enter Arcera</i></div>
      </div>
      <LayerControl name="Arcera" value={depth} onChange={setDepth} />
    </div>
  </section>;
}

function RiverWater({ paused }: { paused: boolean }) {
  const id=useId().replace(/:/g,"");
  const surface=useRef<HTMLDivElement>(null);
  const turbulence=useRef<SVGFETurbulenceElement>(null);
  useEffect(()=>{
    const element=surface.current;
    if(!element)return;
    const reduced=matchMedia("(prefers-reduced-motion: reduce)");
    let visible=false,frame=0,last=0;
    const tick=(time:number)=>{
      if(time-last>40){ const t=time/1000; turbulence.current?.setAttribute("baseFrequency",`${.012+Math.sin(t*.7)*.002} ${.045+Math.cos(t*.5)*.009}`);last=time; }
      frame=requestAnimationFrame(tick);
    };
    const sync=()=>{cancelAnimationFrame(frame);frame=0;const active=visible&&!document.hidden&&!paused&&!reduced.matches;element.dataset.moving=String(active);if(active)frame=requestAnimationFrame(tick);};
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();},{threshold:.05});observer.observe(element);
    document.addEventListener("visibilitychange",sync);reduced.addEventListener("change",sync);sync();
    return()=>{cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener("visibilitychange",sync);reduced.removeEventListener("change",sync);};
  },[paused]);
  return <div ref={surface} className={styles.riverWater} aria-hidden="true"><svg width="0" height="0"><defs><filter id={`${id}-current`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB"><feTurbulence ref={turbulence} type="fractalNoise" baseFrequency=".012 .045" numOctaves="2" seed="8" result="current" /><feDisplacementMap in="SourceGraphic" in2="current" scale="6" xChannelSelector="R" yChannelSelector="G" /></filter></defs></svg><Image src="/showcase/arcera/river-world.webp" alt="" fill unoptimized style={{filter:`url(#${id}-current)`}} /><div className={styles.waterGlints} /></div>;
}

function FishingConcept({ paused }: { paused: boolean }) {
  const [depth,setDepth]=useState(0);
  const phone=useRef<HTMLDivElement>(null);
  const feedback=useRef<Animation | null>(null);
  useEffect(()=>()=>feedback.current?.cancel(),[]);
  function acknowledge() {
    if (paused || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    feedback.current?.cancel();
    feedback.current=phone.current?.animate([{translate:"0 0"},{translate:"-4px 0"},{translate:"4px 0"},{translate:"-2px 0"},{translate:"0 0"}],{duration:340,easing:"ease-out"}) ?? null;
  }
  return <section className={styles.fishingSection}>
    <div className={styles.fishingCopy}><span>Transfer study / 03</span><h2>A river world.<br />Above and below.</h2><p>For this fishing-app exploration, the welcome becomes a small world you can look into: a winding river above the surface, clear mineral water and riverbed detail below.</p><p>Near-camera trees frame the scene. Clouds and mist move on their own plane. Warm coral, deep teal and pearl lettering give the entry its own character, while one clear primary action anchors the interface.</p><ol className={styles.riverLayerList}><li>River world & underwater depth</li><li>Clouds & low mist</li><li>Near-camera trees & stones</li><li>Brand, light & entry interaction</li></ol><small>Riffle is a portfolio concept. Three separately generated artwork plates are composed with coded depth, parallax, atmospheric motion and interface elements.</small></div>
    <div className={styles.riverStage}><div ref={phone} className={styles.fishingPhone} data-exploded={depth > 0} style={{ "--river-depth": depth / 100 } as CSSProperties} onPointerMove={event=>{ if(event.pointerType!=="mouse")return; const rect=event.currentTarget.getBoundingClientRect();event.currentTarget.style.setProperty("--river-x",`${(event.clientX-rect.left)/rect.width-.5}`);event.currentTarget.style.setProperty("--river-y",`${(event.clientY-rect.top)/rect.height-.5}`); }} onPointerLeave={event=>{event.currentTarget.style.setProperty("--river-x","0");event.currentTarget.style.setProperty("--river-y","0");}}>
      <div className={styles.riverComposition}>
        <div className={`${styles.riverPlane} ${styles.riverBase}`}><Image src="/showcase/arcera/river-world.webp" alt="Sculptural river world with a sunrise forest above and clear turquoise riverbed below the water" fill unoptimized /><RiverWater paused={paused} /></div>
        <div className={`${styles.riverPlane} ${styles.riverAtmosphere}`}><Image src="/showcase/arcera/river-clouds.webp" alt="" fill unoptimized /></div>
        <div className={`${styles.riverPlane} ${styles.riverForeground}`}><Image className={styles.canopyArt} src="/showcase/arcera/river-foreground.webp" alt="" fill unoptimized /><Image className={styles.groundedArt} src="/showcase/arcera/river-foreground.webp" alt="" fill unoptimized /></div>
        <div className={`${styles.riverPlane} ${styles.riverInterface}`}>
          <div className={styles.fishingTitle}><Image className={styles.fishEmblem} src="/showcase/arcera/riffle-fish.webp" alt="Riffle trout emblem" width={400} height={400} unoptimized /><span>THE RIVER IS CALLING</span><h3>riffle</h3><p>Follow the water.</p></div><div className={styles.fishingEntry}><button type="button" onClick={acknowledge} tabIndex={depth > 0 ? -1 : 0}>Find your water</button><small>A fishing journal for days worth keeping.</small></div>
        </div>
      </div>
    </div><LayerControl name="Riffle" value={depth} onChange={setDepth} /></div>
  </section>;
}

export function ArceraExploration({ children, paused }: { children: ReactNode; paused: boolean }) {
  return <article className={styles.caseStudy} data-paused={paused}>
    <section className={styles.intro}>
      <div className={styles.previewColumn}>{children}<span className={styles.recordingLabel}>Arcera · Rise Daily / Native app recording</span></div>
      <div className={styles.anatomy}>
        <header><span className={styles.eyebrow}>Personal exploration / Interaction & art direction</span><h1>Make the first<br />moment feel alive.</h1><p className={styles.lead}>An entry-screen concept for a personal habits app. I explored how atmosphere, motion and a clear invitation could make returning to a daily practice feel more welcoming.</p><p className={styles.scope}>My focus: visual hierarchy, layered composition and a deliberate handoff into the product.</p></header>
        <div className={styles.anatomyList}>{layers.map(layer=><section key={layer.title} className={styles.anatomyRow}><div className={styles.layerThumbnail} data-asset={layer.asset ?? "gulls"}>{layer.asset ? <Image src={`/showcase/arcera/${layer.asset}.webp`} alt="" fill unoptimized /> : <Gulls />}</div><div><span>{layer.note}</span><h2>{layer.title}</h2><p>{layer.detail}</p></div></section>)}</div>
        <aside className={styles.implementation}><span>Designed to stay responsive</span><p>The native opening uses a TimelineView scheduling target of 60 Hz. Decorative motion pauses when inactive; Reduce Motion holds a still composition. Entry remains a deliberate tap, and incoming links wait for the welcome handoff.</p><small>Design intent: a warmer return to the product. This exploration does not claim a measured change in engagement or sign-in completion.</small></aside>
      </div>
    </section>
    <ExplodedComposition paused={paused} />
    <FishingConcept paused={paused} />
  </article>;
}
