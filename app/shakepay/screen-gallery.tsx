"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, ArrowRight02Icon, PlayIcon, PauseIcon } from "@hugeicons/core-free-icons";
import styles from "./study.module.css";
const screens = [
 {asset:"home",title:"Start where you already are.",body:"A rewards entry within the familiar Home experience."},
 {asset:"rewards",title:"See what contributes.",body:"Earned amounts and their sources, brought together."},
 {asset:"potential",title:"Try a different routine.",body:"Explore an illustrative scenario without making a commitment."},
];
const subscribe = (notify: () => void) => { const query=window.matchMedia("(prefers-reduced-motion: reduce)"); query.addEventListener("change",notify); return ()=>query.removeEventListener("change",notify); };
const snapshot=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function Loop({asset,title,playing}:{asset:string;title:string;playing:boolean}) {
 const video=useRef<HTMLVideoElement>(null);
 useEffect(()=>{const el=video.current;if(!el)return;const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting&&playing)void el.play().catch(()=>{});else el.pause();},{threshold:0.2});observer.observe(el);if(!playing)el.pause();return ()=>{observer.disconnect();el.pause();};},[playing]);
 return <video ref={video} muted loop playsInline preload="none" poster={`/shakepay/media/${asset}`} aria-label={title}><source src={`/shakepay/media/${asset}-loop`} type="video/mp4"/></video>;
}
export function ScreenGallery(){
 const ref=useRef<HTMLDivElement>(null);const [enabled,setEnabled]=useState(true);const reduced=useSyncExternalStore(subscribe,snapshot,()=>true);const [override,setOverride]=useState(false);const playing=enabled&&(!reduced||override);
 function toggle(){if(!playing){setOverride(true);setEnabled(true);}else{setOverride(false);setEnabled(false);}}
 function move(direction:number){const el=ref.current;if(el)el.scrollBy({left:direction*el.clientWidth*.75,behavior:reduced?"instant":"smooth"});}
 return <section className={styles.gallerySection}><div className={styles.galleryHeading}><div><p className={styles.eyebrow}>A connected experience</p><h2>Familiar steps.<br/>A clearer picture.</h2></div><div className={styles.galleryActions}><button className={styles.motionControl} onClick={toggle} aria-label={playing?"Pause gallery animations":"Play gallery animations"}><HugeiconsIcon icon={playing?PauseIcon:PlayIcon} size={18} strokeWidth={1.8} aria-hidden="true" />{playing?"Pause":"Play"}</button><button onClick={()=>move(-1)} aria-label="Previous screens"><HugeiconsIcon icon={ArrowLeft02Icon} size={20} strokeWidth={1.8} aria-hidden="true" /></button><button onClick={()=>move(1)} aria-label="Next screens"><HugeiconsIcon icon={ArrowRight02Icon} size={20} strokeWidth={1.8} aria-hidden="true" /></button></div></div><div ref={ref} className={styles.gallery} role="region" aria-label="Animated prototype screens. Scroll horizontally to explore." tabIndex={0}>{screens.map((screen,i)=><figure key={screen.asset}><div className={styles.galleryPhone}><Loop asset={screen.asset} title={screen.title} playing={playing}/></div><figcaption><span>0{i+1}</span><h3>{screen.title}</h3><p>{screen.body}</p></figcaption></figure>)}</div><p className={styles.galleryNote}>Actual native prototype · Silent interaction loops · Fictional demo data</p></section>;
}

export function ProfileWalkthrough(){
 const [enabled,setEnabled]=useState(true);const reduced=useSyncExternalStore(subscribe,snapshot,()=>true);const [override,setOverride]=useState(false);const playing=enabled&&(!reduced||override);
 function toggle(){if(!playing){setOverride(true);setEnabled(true);}else{setOverride(false);setEnabled(false);}}
 return <figure className={styles.profileWalkthrough}><div className={styles.galleryPhone}><Loop asset="profile" title="Profile walkthrough: Active benefits, Compare, then open Rewards" playing={playing}/></div><figcaption><span>Active · Compare · Rewards</span><button className={styles.profileMotion} onClick={toggle} aria-label={playing?"Pause profile animation":"Play profile animation"}><HugeiconsIcon icon={playing?PauseIcon:PlayIcon} size={18} strokeWidth={1.8} aria-hidden="true" />{playing?"Pause":"Play"}</button></figcaption></figure>;
}
