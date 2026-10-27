"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  ChevronDown,
  FileText,
  Folder,
  Menu,
  Mic,
  Send,
  ShieldCheck,
  X,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import ShaderOrb from "./ShaderOrb";
import LandingPricing from "./LandingPricing";
import LandingProductPreview from "./LandingProductPreview";
import { landingText } from "./landing-copy";
import type { UILanguage } from "@/lib/ui/language";
import styles from "./landing-page.module.css";

const workflowCopy = [
  {
    label: "Capture the conversation",
    icon: Mic,
    title: "Listen to the person, not your notes.",
    text: "With your client’s consent, record the consultation. Keep a transcript to revisit the details in their own words.",
    outcome: "A conversation you can return to.",
  },
  {
    label: "Understand the trip",
    icon: FileText,
    title: "Turn the conversation into a useful brief.",
    text: "Bring the destination, timing, preferences, and open questions into a readable recap. Review it before building your proposal.",
    outcome: "A clearer starting point for the next step.",
  },
  {
    label: "Prepare the follow-up",
    icon: Send,
    title: "Move the relationship forward.",
    text: "Prepare a client recap, refine the wording, and choose when to send it. Keep next steps with the client’s file.",
    outcome: "A thoughtful follow-up, with you in control.",
  },
] as const;
const questionsCopy = [
  [
    "Who is aBeam built for?",
    "Travel advisors who want to keep client consultations, trip context, and follow-ups together. It supports your work from the first conversation to the next meeting.",
  ],
  [
    "How do I start a consultation?",
    "Sign in, open or create a client file, confirm the client’s explicit consent to recording, and start the microphone. When the conversation ends, review the saved transcript and prepare the recap.",
  ],
  [
    "What makes it different from a general transcription app?",
    "aBeam is organized around a travel consultation: destination, timing, travelers, preferences, constraints, and the questions still to clarify. Conversations live in a client file alongside the brief and follow-up.",
  ],
  [
    "Does it book travel or replace my recommendations?",
    "No. You remain the travel advisor. aBeam helps capture context and surface relevant travel information. You decide what to recommend, verify, and share.",
  ],
  [
    "Is anything sent to my client automatically?",
    "No. The follow-up is a draft you can edit. Sending it requires an explicit action, and recording requires the client’s consent.",
  ],
  [
    "Can I pick up where a previous conversation ended?",
    "Yes. Open the client’s file to revisit saved conversations, their recap, and next steps before the next consultation.",
  ],
] as const;
function Brand() {
  return (
    <span className={styles.brand}>
      <ShaderOrb animated tone="blue" className={styles.brandMark} />
      aBeam
    </span>
  );
}
export default function LandingPage({ onLogin, language, onLanguageChange }: {
  onLogin: () => void;
  language: UILanguage;
  onLanguageChange: (language: UILanguage) => void;
}) {
  const t = (text: string) => landingText(language, text);
  const workflow = workflowCopy.map((item) => ({ ...item, label: t(item.label), title: t(item.title), text: t(item.text), outcome: t(item.outcome) }));
  const questions = questionsCopy.map(([question, answer]) => [t(question), t(answer)]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [stage, setStage] = useState(1);
  const StageIcon = workflow[stage].icon;
  return (
    <main className={styles.page} id="top" lang={language}>
      <a className={styles.skipLink} href="#main-content">{t("Skip to content")}</a>
      <header className={styles.header}>
        <a href="#top" aria-label={t("aBeam home")}>
          <Brand />
        </a>
        <nav className={styles.desktopNav} aria-label={t("Main navigation")}>
          <a href="#product">{t("See the app")}</a>
          <a href="#workflow">{t("How it works")}</a>
          <a href="#control">{t("Your control")}</a>
          <a href="#pricing">{t("Pricing")}</a>
          <a href="#questions">{t("Questions")}</a>
        </nav>
        <div className={styles.headerActions}>
          <div className={styles.languageSwitch} role="group" aria-label={language === "fr" ? "Langue" : "Language"}>
            {(["fr", "en"] as const).map((locale) => (
              <button key={locale} type="button" lang={locale} aria-label={locale === "fr" ? "Français" : "English"} aria-pressed={language === locale} onClick={() => onLanguageChange(locale)}>
                {locale.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            className={`${styles.primaryButton} ${styles.headerSignIn}`}
            onClick={onLogin}
            type="button"
            aria-label={t("Log in")}
          >
            <span>{t("Log in")}</span>
          </button>
          <button
            className={styles.menuButton}
            onClick={() => setMenuOpen(!menuOpen)}
            type="button"
            aria-label={menuOpen ? t("Close navigation") : t("Open navigation")}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {menuOpen ? (
        <nav
          id="mobile-nav"
          className={styles.mobileNav}
          aria-label={t("Mobile navigation")}
        >
          {[
            [t("See the app"), "product"],
            [t("How it works"), "workflow"],
            [t("Your control"), "control"],
            [t("Pricing"), "pricing"],
            [t("Questions"), "questions"],
          ].map(([label, id]) => (
            <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>
              {label}
              <ArrowRight size={16} />
            </a>
          ))}
        </nav>
      ) : null}
      <section
        className={styles.hero}
        id="main-content"
        aria-labelledby="hero-title"
      >
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>
            <Mic size={15} />{t("THE CONVERSATION COPILOT FOR TRAVEL ADVISORS")}</span>
          <h1 id="hero-title">{t("Your client conversation.")}<br />
            <em>{t("A clear travel brief.")}</em>
          </h1>
          <p>{t("Capture preferences, unanswered questions, and next steps. Then prepare a follow-up you can review—all in the client’s file.")}</p>
          <div className={styles.heroActions}>
            <button
              className={styles.primaryButton}
              onClick={onLogin}
              type="button"
              aria-label={t("Start a consultation")}
            >
              <span>{t("Start a consultation")}</span>
              <ArrowRight size={18} />
            </button>
            <a className={styles.secondaryButton} href="#product">{t("See how it works")}<ArrowRight size={16} />
            </a>
          </div>
          <span className={styles.heroNote}>
            <ShieldCheck size={15} />{t("Client consent first. Advisor review before sending.")}</span>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.travelPhoto}><Image src="/embed/abeam/travel-rail.jpg" alt={t("Illustrative Alpine rail journey beside a mountain lake")} fill loading="eager" sizes="(max-width: 800px) 90vw, 45vw" /></div>
          <div className={styles.previewEyebrow}>
            <span className={styles.statusDot} />{t("YOUR CLIENT FILE, AT A GLANCE")}</div>
          <LandingProductPreview compact language={language} />
          <div className={styles.heroResult}>
            <CheckCircle2 size={20} />
            <span>
              <strong>{t("The details are ready to work with.")}</strong>{t("What matters. What’s missing. What happens next.")}</span>
          </div>
        </div>
      </section>
      <section className={styles.outcomes} aria-label={t("What aBeam helps you do")}>
        <div>
          <Mic />
          <span>{t("Stay present")}<strong>{t("Keep a record of the consultation.")}</strong>
          </span>
        </div>
        <div>
          <FileText />
          <span>{t("See the essentials")}<strong>{t("Read a brief instead of rebuilding your notes.")}</strong>
          </span>
        </div>
        <div>
          <Folder />
          <span>{t("Keep the context")}<strong>{t("Return to one client file, ready for the next call.")}</strong>
          </span>
        </div>
      </section>
      <section
        className={styles.product}
        id="product"
        aria-labelledby="product-title"
      >
        <div className={styles.sectionHeading}>
          <span className={styles.eyebrow}>{t("THE PRODUCT, IN CONTEXT")}</span>
          <h2 id="product-title">{t("One client. One conversation.")}<br />{t("A clearer next step.")}</h2>
          <p>{t("Follow Maya and Alex’s anniversary trip through aBeam. Choose a view to see what the advisor works with.")}</p>
        </div>
        <div
          className={styles.demoTabs}
          role="tablist"
          aria-label={t("Product workflow")}
        >
          {workflow.map((item, index) => (
            <button
              key={item.label}
              type="button"
              role="tab"
              id={`demo-tab-${index}`}
              aria-selected={stage === index}
              tabIndex={stage === index ? 0 : -1}
              onKeyDown={(event) => {
                const next =
                  event.key === "ArrowRight"
                    ? (index + 1) % workflow.length
                    : event.key === "ArrowLeft"
                      ? (index + workflow.length - 1) % workflow.length
                      : event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? workflow.length - 1
                          : null;
                if (next === null) return;
                event.preventDefault();
                setStage(next);
                event.currentTarget.parentElement
                  ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
                  [next]?.focus();
              }}
              aria-controls="workflow-demo"
              className={stage === index ? styles.activeTab : ""}
              onClick={() => setStage(index)}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <div
          className={styles.demoLayout}
          id="workflow-demo"
          role="tabpanel"
          aria-labelledby={`demo-tab-${stage}`}
          tabIndex={0}
        >
          <div className={styles.demoExplanation}>
            <StageIcon size={24} />
            <span className={styles.stepNumber}>0{stage + 1}</span>
            <h3>{workflow[stage].title}</h3>
            <p>{workflow[stage].text}</p>
            <div>
              <Check size={16} />
              {workflow[stage].outcome}
            </div>
          </div>
          <LandingProductPreview stage={stage} language={language} />
        </div>
        <p className={styles.demoNote}>{t("Read-only product example with fictional client data. The recap uses aBeam’s actual app component. No recording or sending takes place here.")}</p>
      </section>
      <section
        className={styles.workflow}
        id="workflow"
        aria-labelledby="workflow-title"
      >
        <div className={styles.sectionHeading}>
          <span className={styles.eyebrow}>{t("BUILT AROUND YOUR CONSULTATION")}</span>
          <h2 id="workflow-title">{t("From “tell me about your trip”")}<br />{t("to “here’s what we’ll do next.”")}</h2>
        </div>
        <div className={styles.steps}>
          {[
            {
              icon: Folder,
              title: t("Open the client’s file"),
              text: t("Start with a new client or return to an existing file. Keep their conversations and next steps together."),
            },
            {
              icon: Mic,
              title: t("Have the conversation"),
              text: t("Confirm consent, start listening, and stay with your client. Capture preferences and the reasons behind them."),
            },
            {
              icon: CheckCircle2,
              title: t("Review and follow through"),
              text: t("Read the recap, clarify what’s missing, and prepare the follow-up. You choose the next action."),
            },
          ].map((item, index) => (
            <article key={item.title}>
              <div>
                <item.icon size={23} />
                <span>0{index + 1}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className={styles.difference} aria-labelledby="difference-title">
        <div>
          <span className={styles.eyebrow}>{t("MORE THAN A TRANSCRIPT")}</span>
          <h2 id="difference-title">{t("A destination is a detail.")}<br />{t("Why they’re going is the context.")}</h2>
          <p>{t("“Greece in September” is a starting point. An anniversary, a quieter pace, and time together are what shape the recommendation. aBeam keeps the conversation’s meaning close to the travel details.")}</p>
        </div>
        <div className={styles.contextCard}>
          <div className={styles.travelPhoto}><Image src="/embed/abeam/travel-coast.jpg" alt={t("Illustrative Mediterranean coast with a quiet terrace and sailboat")} fill sizes="(max-width: 800px) 90vw, 40vw" /></div>
          <MessageSquare size={22} />
          <blockquote>{t("“Sea views, local food—and time to slow down together.”")}</blockquote>
          <span>{t("EXAMPLE CLIENT PREFERENCE")}</span>
          <div>
            <span>
              <Check size={15} />{t("What matters to them")}</span>
            <span>
              <FileText size={15} />{t("In the trip recap")}</span>
            <span>
              <Folder size={15} />{t("Kept with the client")}</span>
          </div>
        </div>
      </section>
      <section
        className={styles.control}
        id="control"
        aria-labelledby="control-title"
      >
        <div className={styles.sectionHeading}>
          <span className={styles.eyebrow}>{t("SUPPORT FOR THE ADVISOR")}</span>
          <h2 id="control-title">{t("Your judgment.")}<br />{t("Your client relationship.")}</h2>
          <p>{t("aBeam supports the conversation. You decide what happens next.")}</p>
        </div>
        <div className={styles.controlGrid}>
          {[
            {
              icon: ShieldCheck,
              title: t("Record with consent"),
              text: t("Recording begins after you confirm the client’s explicit consent. Stop whenever you need to."),
            },
            {
              icon: FileText,
              title: t("Review the output"),
              text: t("Read the transcript and recap. Refine the follow-up before it becomes a client message."),
            },
            {
              icon: Send,
              title: t("Choose what to share"),
              text: t("Nothing is sent automatically. You choose the recipient, the wording, and the moment to send."),
            },
          ].map((item) => (
            <article key={item.title}>
              <item.icon size={24} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>
      <LandingPricing language={language} onExplore={onLogin} />
      <section
        className={styles.questions}
        id="questions"
        aria-labelledby="questions-title"
      >
        <div>
          <span className={styles.eyebrow}>{t("BEFORE YOUR FIRST CONSULTATION")}</span>
          <h2 id="questions-title">{t("A few useful answers.")}</h2>
          <p>{t("Understand how aBeam fits into your work.")}</p>
        </div>
        <div>
          {questions.map(([question, answer]) => (
            <details key={question}>
              <summary>
                {question}
                <ChevronDown size={18} />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
      <section className={styles.closing}>
        <div>
          <span className={styles.eyebrow}>{t("READY FOR THE NEXT CONVERSATION")}</span>
          <h2>{t("Give your client your attention.")}<br />{t("Keep the details with aBeam.")}</h2>
          <p>{t("Open a client file, capture the consultation, and turn it into a next step you can act on.")}</p>
        </div>
        <button
          className={styles.primaryButton}
          onClick={onLogin}
          type="button"
          aria-label={t("Open aBeam")}
        >
          <span>{t("Open aBeam")}</span>
          <ArrowRight size={18} />
        </button>
      </section>
      <footer className={styles.footer}>
        <a href="#top" aria-label={t("aBeam home")}>
          <Brand />
        </a>
        <span>{t("Built for travel advisors. Designed around the conversation.")}</span>
        <a href="#questions">{t("Questions")}<ArrowRight size={14} />
        </a>
      </footer>
    </main>
  );
}
