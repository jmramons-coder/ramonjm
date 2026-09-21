"use client";
import Image from "next/image";
import { useState } from "react";
import styles from "./study.module.css";
export function HeroShot({asset,alt}:{asset:string;alt:string}){
 const [ready,setReady]=useState(false);
 return <div className={`${styles.heroShot} ${ready?styles.shotReady:""}`}><span className={styles.shotPlaceholder} aria-hidden="true"><span/><span/><span/></span><Image unoptimized loading="eager" fetchPriority="high" src={`/shakepay/media/${asset}`} alt={alt} width={402} height={874} onLoad={()=>setReady(true)}/></div>;
}
