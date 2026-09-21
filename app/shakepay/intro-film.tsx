"use client";
import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, PauseIcon, VolumeHighIcon, VolumeOffIcon } from "@hugeicons/core-free-icons";
import styles from "./study.module.css";
export function IntroFilm(){
 const ref=useRef<HTMLVideoElement>(null);const manualPause=useRef(false);
 const [playing,setPlaying]=useState(false);const [muted,setMuted]=useState(false);
 useEffect(()=>{const video=ref.current;if(!video)return;const motion=window.matchMedia("(prefers-reduced-motion: reduce)");const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting&&!motion.matches&&!manualPause.current)void video.play().catch(()=>{video.muted=true;setMuted(true);void video.play().catch(()=>{});});else video.pause();},{threshold:.35});observer.observe(video);return()=>observer.disconnect();},[]);
 function toggle(){const video=ref.current;if(!video)return;if(video.paused){manualPause.current=false;void video.play().catch(()=>{});}else{manualPause.current=true;video.pause();}}
 return <div className={styles.filmPlayer}><video ref={ref} muted={muted} loop playsInline preload="metadata" poster="/shakepay/media/poster" aria-label="Shakepay rewards concept film" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)}><source src="/shakepay/media/film" type="video/mp4"/></video><div className={styles.filmControls}><button onClick={toggle} aria-label={playing?"Pause film":"Play film"}><HugeiconsIcon icon={playing?PauseIcon:PlayIcon} size={22} strokeWidth={1.8} aria-hidden="true"/>{playing?"Pause":"Play"}</button><button className={styles.soundButton} title={muted?"Turn sound on":"Mute sound"} onClick={()=>setMuted(!muted)} aria-label={muted?"Turn film sound on":"Mute film"} aria-pressed={!muted}><HugeiconsIcon icon={muted?VolumeOffIcon:VolumeHighIcon} size={22} strokeWidth={1.8} aria-hidden="true"/></button></div></div>;
}
