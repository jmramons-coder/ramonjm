"use client";

import { ArrowRight, Check, Clock3, Search, Users } from "lucide-react";
import type { UILanguage } from "@/lib/ui/language";
import styles from "./landing-page.module.css";

const proposal = { membership: 49, topUp: 29, minutes: 300, searches: 150 } as const;

/** Marketing proposal only: no checkout, quota enforcement, or charges. */
export default function LandingPricing({ language, onExplore }: {
  language: UILanguage;
  onExplore: () => void;
}) {
  const fr = language === "fr";
  const text = (french: string, english: string) => fr ? french : english;
  const price = (amount: number) => new Intl.NumberFormat(fr ? "fr-CA" : "en-CA", {
    style: "currency", currency: "CAD", maximumFractionDigits: 0,
  }).format(amount);

  return (
    <section className={styles.pricing} id="pricing" aria-labelledby="pricing-title">
      <div className={styles.sectionHeading}>
        <span className={styles.eyebrow}>{text("UN ABONNEMENT. VOTRE RYTHME.", "ONE MEMBERSHIP. YOUR PACE.")}</span>
        <h2 id="pricing-title">{text("Une base simple.", "A simple starting point.")}<br />{text("De la souplesse pour la suite.", "Room for busier months.")}</h2>
        <p>{text("Un abonnement pour votre travail au quotidien, de l’usage inclus et des recharges au besoin.", "A membership for your everyday work, included usage, and optional top-ups when you need more.")}</p>
        <span className={styles.pricingProposal}>{text("Proposition de lancement · tarifs à confirmer", "Launch proposal · pricing to be confirmed")}</span>
      </div>
      <div className={styles.pricingGrid}>
        <article className={`${styles.pricingCard} ${styles.pricingMembership}`} aria-labelledby="membership-title">
          <span className={styles.eyebrow}>{text("VOTRE ESPACE ABEAM", "YOUR ABEAM WORKSPACE")}</span>
          <h3 id="membership-title">{text("Abonnement conseiller", "Advisor membership")}</h3>
          <div className={styles.pricingAmount}><strong>{price(proposal.membership)}</strong><span>CAD · {text("par conseiller / mois", "per advisor / month")}</span></div>
          <p>{text("Les outils pour écouter, comprendre et préparer la prochaine étape.", "The tools to listen, understand, and prepare the next step.")}</p>
          <ul className={styles.pricingFeatures}>
            {[
              text("Dossiers clients et conversations sauvegardées", "Client files and saved conversations"),
              text("Transcription, brief voyage et brouillon de suivi", "Transcription, travel brief, and follow-up draft"),
              text("Assistant et informations voyage en direct", "Assistant and live travel information"),
            ].map((feature) => <li key={feature}><Check size={16} aria-hidden="true" /><span>{feature}</span></li>)}
          </ul>
          <div className={styles.pricingAllowance}>
            <span><Clock3 size={17} aria-hidden="true" /><strong>{proposal.minutes} {text("minutes", "minutes")}</strong><span>{text("de consultation / mois", "of consultation / month")}</span></span>
            <span><Search size={17} aria-hidden="true" /><strong>{proposal.searches} {text("recherches", "searches")}</strong><span>{text("voyage / mois", "for travel / month")}</span></span>
          </div>
          <button className={styles.primaryButton} type="button" onClick={onExplore}>{text("Découvrir aBeam", "Explore aBeam")}<ArrowRight size={16} aria-hidden="true" /></button>
        </article>
        <article className={styles.pricingCard} aria-labelledby="topup-title">
          <span className={styles.eyebrow}>{text("POUR LES MOIS PLUS ACTIFS", "FOR BUSIER MONTHS")}</span>
          <h3 id="topup-title">{text("Recharge à la demande", "Optional usage top-up")}</h3>
          <div className={styles.pricingAmount}><strong>{price(proposal.topUp)}</strong><span>CAD · {text("par recharge", "per top-up")}</span></div>
          <p>{text("Gardez le même abonnement. Ajoutez de l’usage quand votre activité augmente.", "Keep the same membership. Add usage when your workload grows.")}</p>
          <div className={styles.pricingAllowance}>
            <span><Clock3 size={17} aria-hidden="true" /><strong>+ {proposal.minutes} {text("minutes", "minutes")}</strong><span>{text("de consultation", "of consultation")}</span></span>
            <span><Search size={17} aria-hidden="true" /><strong>+ {proposal.searches} {text("recherches", "searches")}</strong><span>{text("voyage", "for travel")}</span></span>
          </div>
          <ul className={styles.pricingFeatures}>
            {[
              text("Aucun changement de forfait", "No plan change"),
              text("Achat volontaire, sans recharge automatique", "Optional purchase, no automatic top-up"),
              text("Consommation exprimée en minutes et recherches", "Usage shown in minutes and searches"),
            ].map((feature) => <li key={feature}><Check size={16} aria-hidden="true" /><span>{feature}</span></li>)}
          </ul>
          <div className={styles.pricingExample}>
            <strong>{text("Exemple : 20 rencontres de 30 minutes", "Example: 20 consultations of 30 minutes")}</strong>
            <p>{text("Avec 10 recherches par rencontre : 600 minutes et 200 recherches. Un abonnement + une recharge =", "With 10 searches per consultation: 600 minutes and 200 searches. One membership + one top-up =")} <strong>{price(proposal.membership + proposal.topUp)}</strong>.</p>
          </div>
        </article>
      </div>
      <div className={styles.pricingTeam}>
        <Users size={21} aria-hidden="true" />
        <div><strong>{text("Vous travaillez en agence ?", "Working as an agency?")}</strong><p>{text("Le modèle proposé mutualise les minutes et les recherches entre les conseillers de votre équipe.", "The proposed model pools consultation minutes and travel searches across your team’s advisors.")}</p></div>
      </div>
      <div className={styles.pricingTerms}>
        <p>{text("Une minute correspond à une minute de consultation enregistrée. Une recherche est une demande d’information voyage (hôtel, vol ou destination), pas chaque résultat affiché. Les questions à l’assistant consommeraient des recherches lorsqu’elles déclenchent une recherche voyage.", "One minute means one recorded consultation minute. One search is a travel-information request (hotel, flight, or destination), not each result displayed. Assistant questions would use searches when they trigger travel research.")}</p>
        <p>{text("Tarifs indicatifs en dollars canadiens, avant taxes. Proposition en cours de validation : l’abonnement, les compteurs partagés et les recharges ne sont pas encore disponibles à l’achat.", "Indicative Canadian-dollar prices, before tax. This proposal is being validated: subscriptions, shared usage balances, and top-ups are not yet available to purchase.")}</p>
      </div>
    </section>
  );
}
