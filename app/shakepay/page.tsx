import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon } from "@hugeicons/core-free-icons";
import Image from "next/image";
import type { Metadata } from "next";
import { SiteHeader } from "../site-header";
import { HeroShot } from "./hero-shot";
import { IntroFilm } from "./intro-film";
import { ScrollBackground } from "./scroll-background";
import { ScreenGallery, ProfileWalkthrough } from "./screen-gallery";
import styles from "./study.module.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title:"Shakepay rewards exploration — Ramon JM", description:"An independent product design study, shared for discussion.", robots:{index:false,follow:false}, alternates:{canonical:"/shakepay"}, openGraph:{title:"Shakepay rewards exploration — Ramon JM",description:"Shared for discussion.",images:[]},twitter:{title:"Shakepay rewards exploration",description:"Shared for discussion.",images:[]} };
export default function Study() {
 return <><SiteHeader textOnly backHref="/#explorations" backLabel="Back to portfolio" /><ScrollBackground /><main className={styles.page} id="main-content">
 <section className={styles.hero}><div className={styles.heroCopy}><div className={styles.brand}><Image src="/shakepay-icon.png" alt="" width={54} height={54}/><span>Shakepay <small>Rewards exploration</small></span></div><p className={styles.eyebrow}>Unsolicited product design study / Ramon JM</p><h1>See your<br/><em>rewards add up.</em></h1><p>Everyday actions bring small rewards. This exploration connects them into a clearer picture of what you’ve earned—and what your routine could make possible.</p><a className={styles.primary} href="#film"><HugeiconsIcon icon={PlayIcon} size={19} strokeWidth={1.8} aria-hidden="true" />Watch the film</a><small className={styles.disclosure}>Independent work. Not commissioned, endorsed by, or affiliated with Shakepay. I do not work for or represent the company.</small></div><div className={styles.heroStage}><figure className={styles.frontPhone}><HeroShot asset="rewards" alt="Rewards overview in the working SwiftUI prototype"/><figcaption>Rewards, brought together.</figcaption></figure><figure className={styles.backPhone}><HeroShot asset="potential" alt="Reward calculator in the working prototype"/></figure></div></section>
 <section className={styles.film} id="film"><IntroFilm /><div><p className={styles.eyebrow}>The idea in motion</p><h2>One place to see<br/>the bigger picture.</h2><p>Bring rewards together, explain their sources, and let people explore a scenario without committing to it.</p><small>Self-initiated concept using fictional data. Existing brand and interface references belong to Shakepay.</small></div></section>
 <section id="opportunity" className={styles.section}><p className={styles.eyebrow}>01 / The opportunity</p><h2>Make the value<br/>easier to understand.</h2><p>My hypothesis: a shared view of rewards could help people connect individual actions to their overall progress. I focused on visibility and comprehension while preserving the app’s familiar navigation.</p><div className={styles.grid}><article><h3>Bring it together.</h3><p>A clear rewards entry on Home, with earned amounts and their sources in one place.</p></article><article><h3>Explain what earns.</h3><p>Compact rows reveal the calculation when needed. Profile keeps status and tier progression.</p></article><article><h3>Explore a possibility.</h3><p>Adjust a simple scenario and see estimates change, separate from rewards already received.</p></article></div></section>

 <ScreenGallery />
 <section className={`${styles.section} ${styles.profileSection}`} id="profile">
  <div className={styles.profileCopy}><p className={styles.eyebrow}>02 / Profile, connected</p>
  <h2>Your benefits here.<br/>Your rewards, one tap away.</h2>
  <p>Profile stays familiar: your tier, progress toward the next one, and ShakingSats history. The update adds a clearer choice of what to see.</p>
  <div className={styles.profilePoints}>
   <article><span>01</span><div><h3>Active by default.</h3><p>See the benefits you have today, without scanning every tier.</p></div></article>
   <article><span>02</span><div><h3>Compare when it helps.</h3><p>Switch to the side-by-side table to understand what changes at the next tier.</p></div></article>
   <article><span>03</span><div><h3>Follow through to Rewards.</h3><p>The same Rewards card as Home opens the same overview. Status explains what you qualify for; Rewards shows what you’ve received.</p></div></article>
  </div></div>
  <ProfileWalkthrough />
 </section>
 <section id="sandbox" className={styles.collapsibleSection}>
  <details><summary>R&amp;D sandbox<span aria-hidden="true" className={styles.disclosurePlus}>+</span></summary>
   <div className={`${styles.section} ${styles.sandboxSection}`}>
  <div><p className={styles.eyebrow}>03 / R&amp;D sandbox</p><h2>Build it.<br/>Understand it.<br/>Explore within it.</h2></div>
  <div className={styles.sandboxCopy}><p>I rebuilt the core Shakepay experience as a local iOS app in SwiftUI, with AI assistance for development. It gave me a working environment to understand the existing flows, experiment, and integrate the Rewards proposal directly into the experience.</p><p>Instead of reviewing screens in isolation, I could test how the idea connects to Home, Profile, benefits, and everyday interactions.</p><div className={styles.aiBuildNote}><h3>Built with agentic AI.</h3><p>I used GPT-6 Astra in Codex as my coding assistant to rebuild the iOS experience in SwiftUI. I directed the product decisions, compared the result with the reference app, and iterated on the interactions.</p></div><div className={styles.sandboxFacts}><span>Native iOS · SwiftUI</span><span>Working interactions</span><span>Fictional demo data</span></div></div>
  <aside className={styles.prototypeOffer}><p className={styles.eyebrow}>For the Shakepay team</p><h3>Explore the full prototype.</h3><p>I can provide access to the complete prototype and GitHub repository so your team can interact directly with the proposed experience and explore the code behind it.</p><p className={styles.prototypeNote}>I’m a product designer, not an engineer, and I don’t manually review all of the generated code. I use this as a tool to make ideas tangible, rather than present it as an engineering-ready deliverable. I guide the build toward established practices; engineering review would still be needed. My ambition is for this work to become a useful starting point for developers—helping the team move faster without starting from scratch.</p></aside>
  </div></details>
 </section>
 <section id="process" className={styles.collapsibleSection}>
  <details><summary>My process<span aria-hidden="true" className={styles.disclosurePlus}>+</span></summary>
   <div className={`${styles.section} ${styles.processSection}`}>
  <div className={styles.processIntro}><p className={styles.eyebrow}>04 / My process</p><h2>From what I have.<br/>To what it brings me.</h2><p>As a longtime Shakepay user who has followed crypto on and off for years, I wanted to understand the opportunity beyond buying Bitcoin: how everyday financial habits could make the product more useful over time.</p></div>
  <div className={styles.processSteps}>
   <article><span>01 / Understand the context</span><h3>Understand Shakepay’s place in everyday finance.</h3><p>I used agentic AI research, alongside my experience with Shakepay and familiarity with alternatives such as Wealthsimple and Desjardins, to understand the market. I explored how cards, direct deposit, and Bitcoin rewards could build a longer-term relationship through everyday financial habits.</p></article>
   <article><span>02 / Rebuild to understand</span><h3>Rebuild the iOS app. Explore, test, iterate.</h3><p>With AI as my coding assistant, I rebuilt the core iOS experience so I could explore it directly. I tested the existing flows, identified opportunities, and integrated the proposal into a working app—then iterated on how it felt in use.</p></article>
   <article><span>03 / Form a hypothesis</span><h3>What is my money doing for me?</h3><p>A balance tells me what I have. It does not tell me what my money and habits are generating. In the flows I reviewed, I could see percentages, tier targets, and ShakingSats, but I wanted a clearer view of the combined rewards. That became the hypothesis: help people understand what they get from participating in the ecosystem.</p></article>
   <article><span>04 / Make it tangible</span><h3>See how everyday rewards could add up.</h3><p>Rewards connects what you have received to the products and habits behind it. The calculator then explores how changing savings, card spending, or qualifying deposits could change rewards over time. The idea is to make a possible snowball effect tangible: small contributions accumulating into something meaningful, with clear assumptions rather than a promise of growth.</p></article>
  </div>
  <div className={styles.processTakeaway}><p>Rates describe a benefit.<br/><strong>Rewards make its outcome visible.</strong></p><span>A design hypothesis, not a validated customer insight. This exploration has not yet been tested with users or Shakepay’s team.</span></div>
  </div></details>
 </section>
 <section id="validation" className={styles.collapsibleSection}>
  <details><summary>Questions to explore<span aria-hidden="true" className={styles.disclosurePlus}>+</span></summary>
   <div className={styles.section}>
  <p className={styles.eyebrow}>05 / Questions to explore</p>
  <h2>Questions this<br/>first iteration raises.</h2>
  <p>The prototype makes the idea tangible. These are the questions I would explore next with the team and with users.</p>
  <div className={styles.questionCards}>
   <article><span>01 / Where it belongs</span><h3>Where would you expect to find your rewards?</h3><p>Home makes them visible. Profile gives them context. Which feels natural without suggesting another account holding money?</p></article>
   <article><span>02 / What the total means</span><h3>Is it clear what you earned—and what you can spend?</h3><p>Rewards may already have been moved or spent. How do we make lifetime earnings distinct from money available today?</p></article>
   <article><span>03 / How to show value</span><h3>Sats, dollars, or both?</h3><p>Bitcoin’s price changes. Which view helps people understand their rewards: exact sats, dollars at payout, or today’s value? Estimates need equally clear assumptions.</p></article>
  </div>
  <p className={styles.note}>I would also validate the calculation rules: which actions earn rewards, which unlock a tier, and when rates or eligibility change. Any projection should make its price and reinvestment assumptions explicit.</p>
  </div></details>
 </section>
 <section id="next-opportunities" className={`${styles.section} ${styles.opportunityNote}`}>
  <details><summary>What else could be explored?<span aria-hidden="true" className={styles.disclosurePlus}>+</span></summary><p>Automation is another opportunity: how people set up financial habits around recurring deposits, Bitcoin purchases, and investing—and how those experiences connect across the app.</p></details>
 </section>
 <section className={styles.closing}><p className={styles.eyebrow}>Built to start a conversation</p><h2>Small moments.<br/>A more complete picture.</h2><a className={styles.discussButton} href="mailto:jmanuelr.99@gmail.com?subject=Let’s%20discuss%20the%20rewards%20exploration">Let’s discuss the idea</a><small>Film music: <a href="https://www.scottbuckley.com.au/library/origami/">Origami — Scott Buckley</a>, <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Edited excerpt with added interaction sounds.</small></section>
 </main></>;
}
