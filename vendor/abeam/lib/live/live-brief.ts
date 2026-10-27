/**
 * VOIE RAPIDE (règles de curation §2) — côté client, PUR (aucune dépendance
 * serveur) : transforme les déclencheurs du trigger-scan en TripBrief
 * SYNTHÉTIQUE minimal, pour réutiliser /api/suggest TEL QUEL en live.
 * La voie lente (re-dérivation complète) et la passe batch de la sauvegarde
 * restent les versions qui font foi.
 */

import { createEmptyTripBrief, field, type Duree, type TripBrief } from "../extraction/trip-brief.ts";

/**
 * Ce que le client fait d'un lieu qu'il vient de nommer. CATÉGORIEL et non
 * scoré : un « degré de rejet » de 0 à 1 serait un bouton que personne ne
 * saurait calibrer à 1,4 s sur des partiels non ponctués.
 */
export type IntentionDestination = "souhaitee" | "evoquee" | "rejetee";
export type DestinationDite = { nom: string; intention: IntentionDestination };

export type LiveTriggers = {
  /**
   * Les lieux explicitement souhaités, dans l'ordre où ils ont été dits.
   * Un lieu écarté (« c'est pas la Floride qui nous intéresse ») ou seulement
   * raconté au passé (« ma famille allait souvent en Floride ») n'y est pas —
   * il vit dans `destinations_dites`, avec son intention.
   *
   * L'ordre stabilise le sujet courant et le rendu. Il ne sélectionne jamais
   * une destination : plusieurs envies explicites restent des alternatives
   * équivalentes jusqu'à une décision humaine.
   */
  destinations: string[];
  /**
   * TOUS les lieux nommés dans la fenêtre, écartés compris, dans l'ordre où
   * ils ont été dits. OPTIONNEL par construction : les fixtures et les
   * payloads déjà écrits n'en ont pas, et son absence doit rendre exactement
   * le comportement d'avant (aucun refus connu → aucun retrait, aucun tri).
   * `runTriggerScan` le remplit toujours ; personne d'autre n'a le droit de
   * l'inventer.
   */
  destinations_dites?: DestinationDite[];
  hotel: string | null;
  origine: string | null;
  aeroport_depart?: string | null;
  date_verbatim: string | null;
  duree: Duree | null;
  adultes: number | null;
  enfants_ages: number[];
  contraintes: string[];
  /**
   * L'hésitation du CLIENT SUR SON PROJET (prix, dates, attend un co-voyageur).
   * Elle nourrit le récap (`decision.notes_blocage`) et le nudge d'hésitation
   * (§4). Elle n'a RIEN à voir avec `hotel_nom_incertain` ci-dessous.
   */
  hesitation: string | null;
  /**
   * Le doute porte-t-il sur le NOM de l'établissement ? (« les Roches quelque
   * chose », « je sais plus le nom exact »)
   *
   * Un BOOLÉEN, et pas un texte : le nom approximatif est déjà dans `hotel`, ce
   * qu'on ignore c'est s'il est fiable. Un booléen répond exactement à cette
   * question et ne peut pas halluciner un nom.
   *
   * Il ne change AUCUNE recherche du moteur : il n'entre donc ni dans
   * `triggersKey` (sinon la même phrase reformulée relancerait des recherches
   * déjà payées) ni dans `buildLiveBrief` (le brief décrit le voyage, pas la
   * confiance qu'on a dans une captation). Son unique consommateur est la
   * désambiguïsation (`lib/suggestions/disambiguation.ts`).
   */
  hotel_nom_incertain: boolean;
};

const MONTH_WORDS = /janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre/i;
const SEASON_WORDS = /été|ete|hiver|printemps|automne|relâche|relache|fêtes|fetes/i;
const ISO_DATE = /\d{4}-\d{2}-\d{2}/;

/** Le gate minimal de la voie rapide : un lieu ou un hôtel nommé. */
export function hasGate(t: LiveTriggers): boolean {
  return t.destinations.length > 0 || Boolean(t.hotel);
}

/**
 * Clé de dédup : on ne re-tire que si le payload change réellement.
 *
 * Les intentions n'entrent PAS dans la clé, par le même raisonnement que
 * `hotel_nom_incertain` : un refus ne change aucune recherche à faire, il en
 * annule ; le faire entrer dans la clé rejouerait des recherches déjà payées à
 * chaque reformulation du refus. Le refus est traité hors cadence (voir
 * `memoriserRejets` dans `cadence.ts`).
 */
export function triggersKey(t: LiveTriggers): string {
  if (!hasGate(t)) return "";
  return JSON.stringify([
    [...t.destinations].map((d) => d.toLowerCase().trim()).sort(),
    t.hotel?.toLowerCase().trim() ?? null,
    t.origine?.toLowerCase().trim() ?? null,
    t.aeroport_depart?.toLowerCase().trim() ?? null,
    t.date_verbatim?.toLowerCase().trim() ?? null,
    t.duree,
    t.adultes,
    [...t.enfants_ages].sort(),
    [...t.contraintes].map((c) => c.toLowerCase().trim()).sort(),
  ]);
}

/**
 * Identité du sujet courant, sans les champs qui ne changent pas le lieu.
 * Une nouvelle destination ou un nouvel hôtel doit pouvoir réveiller
 * l'autorité même si le reste du transcript n'a pas encore franchi le seuil
 * de 400 mots.
 */
export function triggersSubjectKey(t: Pick<LiveTriggers, "destinations" | "hotel">): string {
  if (t.destinations.length === 0 && !t.hotel) return "";
  return JSON.stringify([
    t.destinations.map((d) => d.toLowerCase().trim()).filter(Boolean).sort(),
    t.hotel?.toLowerCase().trim() ?? null,
  ]);
}

/**
 * Signature des seuls champs qui CHANGENT une recherche. Deux briefs de
 * signature identique produiraient exactement les mêmes cartes : inutile de
 * repayer des recherches pour ça.
 */
export function briefSearchKey(brief: TripBrief): string {
  const v = <T,>(f: { valeur: T | null; statut: string } | undefined) => (f && f.valeur !== null && f.statut !== "manquant" ? f.valeur : null);
  return JSON.stringify([
    (v(brief.lieu.destinations) as string[] | null)?.map((d) => d.toLowerCase().trim()).sort() ?? null,
    (v(brief.lieu.hotel_nomme) as string | null)?.toLowerCase().trim() ?? null,
    (v(brief.lieu.origine) as string | null)?.toLowerCase().trim() ?? null,
    (v(brief.vols.aeroport_depart) as string | null)?.toLowerCase().trim() ?? null,
    brief.temps.depart.valeur ?? brief.temps.depart.verbatim?.toLowerCase().trim() ?? null,
    v(brief.temps.duree),
    v(brief.voyageurs.adultes),
    (v(brief.voyageurs.enfants_ages) as number[] | null)?.slice().sort() ?? null,
    (v(brief.contraintes.mobilite_sante) as string | null)?.toLowerCase().trim() ?? null,
    (v(brief.contraintes.restrictions_alimentaires) as string | null)?.toLowerCase().trim() ?? null,
  ]);
}

export function buildLiveBrief(t: LiveTriggers): TripBrief {
  const brief = createEmptyTripBrief();
  brief.meta.nature_conversation = "planification";

  if (t.destinations.length > 0) {
    brief.lieu.destinations = field({ verbatim: t.destinations.join(", "), valeur: t.destinations, statut: "capte", confiance: 0.7 });
  }
  if (t.hotel) {
    brief.lieu.hotel_nomme = field({ verbatim: t.hotel, valeur: t.hotel, statut: "capte", confiance: 0.7 });
  }
  if (t.origine) {
    brief.lieu.origine = field({ verbatim: t.origine, valeur: t.origine, statut: "capte", confiance: 0.7 });
  }
  if (t.aeroport_depart) {
    brief.vols.aeroport_depart = field({ verbatim: t.aeroport_depart, valeur: t.aeroport_depart, statut: "capte", confiance: 0.7 });
  }
  if (t.date_verbatim) {
    const iso = t.date_verbatim.match(ISO_DATE)?.[0] ?? null;
    const precision = iso ? "jour" : MONTH_WORDS.test(t.date_verbatim) ? "mois" : SEASON_WORDS.test(t.date_verbatim) ? "saison" : null;
    brief.temps.depart = { verbatim: t.date_verbatim, valeur: iso, precision, confiance: 0.6, statut: iso ? "capte" : "incertain" };
  }
  if (t.duree) {
    brief.temps.duree = field({ verbatim: null, valeur: t.duree, statut: "incertain", confiance: 0.6 });
  }
  if (typeof t.adultes === "number" && t.adultes > 0) {
    brief.voyageurs.adultes = field({ verbatim: null, valeur: t.adultes, statut: "incertain", confiance: 0.6 });
  }
  if (t.enfants_ages.length > 0) {
    brief.voyageurs.enfants_ages = field({ verbatim: null, valeur: t.enfants_ages, statut: "incertain", confiance: 0.6 });
  }
  if (t.contraintes.length > 0) {
    brief.contraintes.mobilite_sante = field({ verbatim: t.contraintes.join(" ; "), valeur: t.contraintes[0], statut: "capte", confiance: 0.75 });
    if (t.contraintes.length > 1) {
      brief.services.elements_a_eviter = field({ verbatim: t.contraintes.slice(1).join(" ; "), valeur: t.contraintes.slice(1), statut: "capte", confiance: 0.7 });
    }
  }
  if (t.hesitation) {
    brief.decision.notes_blocage = field({ verbatim: t.hesitation, valeur: t.hesitation, statut: "capte", confiance: 0.7 });
  }
  return brief;
}
