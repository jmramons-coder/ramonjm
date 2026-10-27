/**
 * STATION 4 du PDF d'architecture — « Le copilote : capté / manquant ».
 *
 * Ce module ne dessine rien : il traduit un `TripBrief` en TROIS À CINQ LIGNES
 * de français. C'est la seule chose qu'il fait, et c'est volontaire — la
 * question « qu'est-ce qu'on affiche » est un artefact de jugement, pas un
 * détail de rendu, donc elle vit dans un fichier pur qu'on peut lire d'un trait.
 *
 * ── CE QUE CE PANNEAU EST ────────────────────────────────────────────────────
 * Le PDF le dit en une phrase : « L'agent voit, en silence, ce qui est capté et
 * ce qui manque encore ». Et `plan-abeam.md` dit ce qu'il EST vraiment : le
 * Payload Agent se demande « le Trip Brief est-il assez complet pour interroger
 * l'API ? » → **ce panneau est cet état-là, rendu visible**. Ce n'est pas une
 * fonctionnalité d'interface : c'est la gate qui dit ce qui lui manque encore
 * pour tirer, montrée pendant qu'on peut encore poser la question.
 *
 * D'où trois contraintes qui gouvernent tout ce fichier :
 *
 * ① **Ce qui manque n'est listé QUE si ça bloque une carte.** Les gates réelles
 *    sont dans `lib/suggestions/engine.ts` (§1 de `regles-curation-notifications.md`) :
 *      · hôtels  → un hôtel NOMMÉ + des dates
 *      · vols    → une destination requêtable + une date de départ
 *      · photos/avis → un hôtel NOMMÉ
 *      · vigie   → un hôtel NOMMÉ × une contrainte captée
 *    Les conditions de nudge de l'engin sont recopiées ici À L'IDENTIQUE (voir
 *    chaque atome). Un champ vide qui ne bloque rien ne produit AUCUNE ligne :
 *    c'est ce qui distingue ce panneau du mur de 30 cartes que le fondateur a
 *    rejeté (« pour l'humain, ça ne sert absolument à rien »).
 *
 * ② **Jamais un nom de champ, jamais un statut brut, jamais un compteur**
 *    (loi 9 + §6.1bis : « 29 à clarifier » est un mensonge de cadrage). Les mots
 *    d'ici — destination, dates, hôtel, contrainte, budget — sont des mots
 *    ordinaires que l'agente emploie déjà ; `lieu.hotel_nomme` et `capte` ne
 *    sortent jamais de la machine.
 *
 * ③ **Silencieux.** L'ordre des atomes est FIXE. Une ligne change d'état sur
 *    place, elle ne remonte jamais dans la liste : un panneau qui se réordonne
 *    attire l'œil, et l'agente est en train de parler à un client. C'est aussi
 *    ce qui rend le « retrait silencieux » (§3) gratuit — quand la voie lente
 *    contredit la voie rapide, la ligne se corrige à sa place, sans transition.
 *
 * ── CE QUE CE PANNEAU N'EST PAS ──────────────────────────────────────────────
 * Il ne dit pas si une recherche a RÉUSSI. « J'ai cherché et je n'ai rien
 * trouvé » appartient au fil du Nudge Agent (loi 4 des règles de curation, via
 * `nudgeGateway`). Ici on répond à une seule question : **est-ce que la machine
 * a entendu ?** La suite se raconte à côté, dans le fil.
 */

import { defineBilingualCopy } from "@/lib/ui/copy";
import { formatTravelPeriod } from "@/lib/ui/date-field";
import { uiLocale, type UILanguage } from "@/lib/ui/language";
import { budgetValide, type Statut, type TripBrief } from "@/lib/extraction/trip-brief";
// `destinations.ts` n'a AUCUN import : on peut consommer `nameOverlap` côté
// navigateur sans traîner SerpAPI ni le SDK d'IA derrière (ce qui interdit, à
// l'inverse, d'importer quoi que ce soit de `engine.ts`).
import { nameOverlap } from "@/lib/suggestions/destinations";

/** Les trois états qu'une ligne peut porter. `contradiction` n'a pas cours ici :
 *  arbitrer deux versions d'un fait est le travail de la voie lente, pas d'un
 *  panneau qu'on lit du coin de l'œil. */
export type EtatLigne = Extract<Statut, "capte" | "incertain" | "manquant">;

export type LigneCapteManquant = {
  /** Identité stable de l'atome — c'est elle qui garantit qu'une ligne se
   *  corrige SUR PLACE au lieu de disparaître et de réapparaître ailleurs. */
  id: "destination" | "dates" | "hotel" | "contrainte" | "budget";
  etat: EtatLigne;
  /** La phrase, telle qu'elle s'affiche : « Destination captée ». */
  texte: string;
  /** Le complément muet : la valeur entendue quand c'est capté, ce que ça
   *  débloquerait quand ça manque. Absent quand il n'y a rien d'honnête à dire. */
  detail?: string;
};

/**
 * Le plafond du PDF (« trois lignes, pas un tableau ») et de la commande
 * (« trois à cinq lignes maximum »). Il y a exactement cinq atomes, donc ce
 * `slice` ne coupe jamais rien aujourd'hui — il est là pour que l'ajout d'un
 * sixième atome, un jour, se heurte à la règle au lieu de la contourner.
 */
export const LIGNES_MAX = 5;

/**
 * COPIE de `SEUIL_RESOLUTION` (`lib/suggestions/engine.ts`), qui reste la source
 * de vérité. On ne l'importe pas : `engine.ts` tire `ai`, `@ai-sdk/openai` et le
 * client SerpAPI derrière lui, et rien de tout ça n'a sa place dans le paquet
 * navigateur pour lire un seul nombre. Si le seuil bouge là-bas, il bouge ici.
 */
const SEUIL_RESOLUTION = 0.6;

/** Longueur au-delà de laquelle un complément cesse d'être lisible en diagonale. */
const DETAIL_MAX = 48;

const nonVide = (value: string | null | undefined): value is string => Boolean(value && value.trim());

function court(value: string | null | undefined): string | undefined {
  if (!nonVide(value)) return undefined;
  const propre = value.trim().replace(/\s+/g, " ");
  return propre.length <= DETAIL_MAX ? propre : `${propre.slice(0, DETAIL_MAX - 1).trimEnd()}…`;
}

/** Un champ compte comme entendu quand il porte une valeur ET que l'extraction
 *  ne l'a pas marqué manquant. Le `statut` reste DANS la machine : il décide
 *  ici, il ne s'affiche jamais. */
function entendu<T>(f: { valeur: T | null; statut: Statut } | undefined | null): T | null {
  if (!f || f.valeur === null || f.valeur === undefined) return null;
  if (f.statut === "manquant") return null;
  return f.valeur;
}

/** « Michès, Punta Cana, République dominicaine » — même construction que
 *  `labelResolution` dans l'engin, pour que l'écran et les recherches parlent
 *  du même endroit avec les mêmes mots. */
function libelleResolution(r: NonNullable<TripBrief["lieu"]["resolution"]>): string {
  const zone = r.region_touristique && r.region_touristique !== r.ville ? r.region_touristique : null;
  return [r.ville, zone, r.pays].filter(nonVide).join(", ");
}

const COPY = defineBilingualCopy({
  fr: {
    destinationCaptured: "Destination captée",
    destinationUnconfirmed: "Destination à confirmer",
    destinationPending: "Destination à venir",
    datesCaptured: "Dates captées",
    datesApproximate: "Dates approximatives",
    datesPending: "Dates à venir",
    hotelCaptured: "Hôtel capté",
    hotelUnconfirmed: "Hôtel à confirmer",
    hotelPending: "Hôtel à venir",
    constraintCaptured: "Contrainte captée",
    constraintsCaptured: "Contraintes captées",
    budgetCaptured: "Budget capté",
    flightGate: "débloque les vols",
    priceGate: "débloque les prix",
    hotelConstraintGate: "débloque ses avis, croisés avec ses contraintes",
    hotelReviewGate: "débloque ses photos et ses avis",
    perPerson: "par personne",
  },
  en: {
    destinationCaptured: "Destination captured",
    destinationUnconfirmed: "Destination to confirm",
    destinationPending: "Destination pending",
    datesCaptured: "Dates captured",
    datesApproximate: "Approximate dates",
    datesPending: "Dates pending",
    hotelCaptured: "Hotel captured",
    hotelUnconfirmed: "Hotel to confirm",
    hotelPending: "Hotel pending",
    constraintCaptured: "Constraint captured",
    constraintsCaptured: "Constraints captured",
    budgetCaptured: "Budget captured",
    flightGate: "unlocks flights",
    priceGate: "unlocks prices",
    hotelConstraintGate: "unlocks reviews checked against their constraints",
    hotelReviewGate: "unlocks photos and reviews",
    perPerson: "per person",
  },
});

/** Ce que le client a DIT sur le moment du voyage, préféré à la date ISO :
 *  « en mars » est plus court et plus vrai que « 15 mars 2027 », qui est notre
 *  interprétation et non sa phrase. */
function momentDit(depart: TripBrief["temps"]["depart"], language: UILanguage): string | undefined {
  if (nonVide(depart.verbatim)) return court(depart.verbatim);
  if (!nonVide(depart.valeur)) return undefined;
  return court(formatTravelPeriod(depart.valeur, null, language) ?? depart.valeur);
}

/**
 * Le brief → les lignes. Pure, synchrone, sans effet : on peut la lire, la
 * tester et la contredire sans lancer l'application.
 */
export function lignesCapteManquant(brief: TripBrief | null, language: UILanguage = "fr"): LigneCapteManquant[] {
  const copy = COPY[language];
  if (!brief) return [];
  // Une demande d'info ou du hors-sujet n'arme aucune gate — l'engin retourne
  // sur-le-champ (`nature_conversation !== "planification"`). Un panneau qui
  // listerait des manques dans ce cas dramatiserait une absence normale (§6.1bis,
  // symptôme n°1). On se tait.
  if (brief.meta.nature_conversation !== "planification") return [];

  const lignes: LigneCapteManquant[] = [];

  // ── ① DESTINATION ──────────────────────────────────────────────────────────
  // La résolution (station 3) fait autorité sur ce qui a été dit : c'est la
  // seule station qui sait où sont les choses dans le monde. Sous le seuil, son
  // propre doute porte sur l'ENDROIT — et l'engin refuse alors de deviner et
  // nudge (« Confirmer l'endroit »). Ici, cette même hésitation devient la ligne
  // la plus utile du panneau : « Destination à confirmer », posée pendant que
  // l'agente peut encore demander.
  const resolution = brief.lieu.resolution ?? null;
  const resolue = resolution && resolution.confiance >= SEUIL_RESOLUTION ? resolution : null;
  const hotel = entendu(brief.lieu.hotel_nomme);
  const libelleLieu = resolution ? libelleResolution(resolution) : "";

  /**
   * Une « destination » qui n'est que le nom du resort n'est PAS une
   * destination. La voie rapide écrit régulièrement `destinations = ["Club Med
   * Michès"]` — le trigger-scan entend un nom propre et le range là. Affiché
   * tel quel, on obtiendrait deux lignes qui disent le même mot (« Destination
   * captée · Club Med Michès » sous « Hôtel capté · Club Med Michès ») : du
   * bruit, et pire, un MENSONGE — on prétendrait savoir où c'est alors que
   * personne ne l'a encore situé.
   *
   * Le filtre est celui de l'engin, au même seuil (`nameOverlap(...) < 0.5`,
   * ligne du repli autocomplete) : ce qu'il refuse d'essayer comme lieu, on
   * refuse de l'annoncer comme lieu.
   */
  const destinationsDites = (entendu(brief.lieu.destinations) ?? [])
    .filter((dite) => !hotel || nameOverlap(dite, hotel) < 0.5);

  if (resolue && nonVide(libelleLieu)) {
    lignes.push({ id: "destination", etat: "capte", texte: copy.destinationCaptured, detail: court(libelleLieu) });
  } else if (resolution && nonVide(libelleLieu)) {
    lignes.push({ id: "destination", etat: "incertain", texte: copy.destinationUnconfirmed, detail: court(libelleLieu) });
  } else if (destinationsDites.length > 0) {
    // Un vrai nom de lieu a été prononcé mais personne ne l'a encore situé —
    // typiquement la voie rapide, qui saute la station 3 et n'a donc pas de
    // `resolution`. On affiche ce que la machine a entendu, mot pour mot : c'est
    // honnête, et l'agente corrige d'une phrase si on a mal compris. La voie
    // lente y substituera le lieu situé, sans bruit.
    lignes.push({
      id: "destination",
      etat: brief.lieu.destinations.statut === "incertain" ? "incertain" : "capte",
      texte: brief.lieu.destinations.statut === "incertain" ? copy.destinationUnconfirmed : copy.destinationCaptured,
      detail: court(destinationsDites.join(", ")),
    });
  } else if (hotel) {
    // Un hôtel nommé sans lieu situé : l'engin passera la gate hôtel mais pas
    // celle des vols (`resolved && arrivalId && checkIn`). Le manque bloque donc
    // quelque chose de réel → il se dit.
    lignes.push({ id: "destination", etat: "manquant", texte: copy.destinationPending, detail: copy.flightGate });
  }
  // Rien de géographique n'a été dit et aucun hôtel n'est nommé → AUCUNE ligne.
  // Loi 4 : rien à dire, rien d'affiché. Le début d'une rencontre où on ne sait
  // rien est un début de rencontre, pas un problème.

  const aUnLieu = Boolean(resolue) || destinationsDites.length > 0;

  // ── ② DATES ────────────────────────────────────────────────────────────────
  // `precision` (jour | mois | saison) est ce qui décide, dans l'engin, si une
  // DATE REPRÉSENTATIVE peut être calculée (§2.4). Avec elle, les recherches
  // partent et la carte porte l'étiquette « Dates à confirmer » — donc ici :
  // « Dates approximatives », capté-mais-flou. Sans elle, rien ne part.
  const depart = brief.temps.depart;
  const dateFerme = nonVide(depart.valeur) && depart.statut === "capte";
  const dateUtilisable = nonVide(depart.valeur) || depart.precision !== null;

  if (dateFerme) {
    lignes.push({ id: "dates", etat: "capte", texte: copy.datesCaptured, detail: momentDit(depart, language) });
  } else if (dateUtilisable) {
    lignes.push({ id: "dates", etat: "incertain", texte: copy.datesApproximate, detail: momentDit(depart, language) });
  } else if (aUnLieu || hotel) {
    // Condition recopiée de l'engin : `if ((resolved || hotelNomme) && !checkIn)`.
    // Sans un lieu ou un hôtel, l'absence de dates ne bloque rien — on se tait.
    lignes.push({ id: "dates", etat: "manquant", texte: copy.datesPending, detail: copy.priceGate });
  }

  // ── ③ CONTRAINTE ───────────────────────────────────────────────────────────
  // Calculée AVANT l'hôtel : c'est elle qui décide de ce que nommer un hôtel
  // débloquerait. Une contrainte au dossier + un hôtel nommé = la carte VIGIE,
  // le cas fondateur du produit (la plage rocheuse, le client à mobilité
  // réduite) — la seule carte exemptée du budget d'attention.
  const contraintes = [
    entendu(brief.contraintes.mobilite_sante),
    entendu(brief.contraintes.restrictions_alimentaires),
    ...(entendu(brief.services.elements_a_eviter) ?? []),
  ].filter(nonVide);

  // ── ④ HÔTEL ────────────────────────────────────────────────────────────────
  if (hotel) {
    lignes.push({ id: "hotel", etat: "capte", texte: copy.hotelCaptured, detail: court(hotel) });
  } else if (aUnLieu) {
    // Condition recopiée de l'engin : `if (resolved && !hotelNomme)`.
    lignes.push({
      id: "hotel",
      etat: "manquant",
      texte: copy.hotelPending,
      detail: contraintes.length > 0 ? copy.hotelConstraintGate : copy.hotelReviewGate,
    });
  }

  if (contraintes.length > 0) {
    lignes.push({
      id: "contrainte",
      etat: "capte",
      texte: contraintes.length > 1 ? copy.constraintsCaptured : copy.constraintCaptured,
      detail: court(contraintes.join(" · ")),
    });
  }
  // Pas de « contrainte à venir » : une agente sait demander s'il y a des
  // allergies ou des problèmes de mobilité. Le corollaire de la loi 9 nous
  // interdit de le lui suggérer.

  // ── ⑤ BUDGET ───────────────────────────────────────────────────────────────
  // Le PDF nomme le budget dans son exemple (« budget à venir »). On l'affiche
  // donc — mais CAPTÉ SEULEMENT, jamais en manque, et c'est un écart assumé
  // avec la lettre du schéma. Raison : aucune gate ne dépend du budget, donc un
  // « budget à venir » ne débloquerait rien (critère ①), et rappeler à une
  // agente de voyage de demander le budget est exactement ce que le corollaire
  // de la loi 9 interdit. Capté, en revanche, la ligne vaut : elle dit « je l'ai
  // entendu », ce qui est le service que rend ce panneau.
  const argent = new Intl.NumberFormat(uiLocale(language), { style: "currency", currency: brief.budget.devise, maximumFractionDigits: 0 });
  const budget = budgetValide(brief.budget.total);
  const parPersonne = budgetValide(brief.budget.par_personne);
  if (budget !== null) {
    lignes.push({ id: "budget", etat: "capte", texte: copy.budgetCaptured, detail: argent.format(budget) });
  } else if (parPersonne !== null) {
    lignes.push({ id: "budget", etat: "capte", texte: copy.budgetCaptured, detail: `${argent.format(parPersonne)} ${copy.perPerson}` });
  }

  return lignes.slice(0, LIGNES_MAX);
}

/** Ordre d'affichage — FIXE, et c'est la règle la plus importante du panneau.
 *  Une ligne change d'état à sa place ; elle ne remonte jamais. Un panneau qui
 *  se réordonne attire l'œil, et l'agente est en train de parler à un client. */
const ORDRE: Array<LigneCapteManquant["id"]> = ["destination", "dates", "hotel", "contrainte", "budget"];

/**
 * LES DEUX VITESSES, COMPOSÉES (règles §2 et §3).
 *
 * Le problème que ça règle, et il est réel : la voie rapide ne lit que la
 * FENÊTRE RÉCENTE (15 tours de parole). Son brief est donc structurellement plus
 * pauvre que celui de la voie lente, qui relit tout. Poser bêtement le dernier
 * brief arrivé ferait « oublier » au panneau, à chaque scan rapide, tout ce que
 * la voie lente avait établi cinq minutes plus tôt — et l'agente verrait le
 * copilote perdre la mémoire en direct.
 *
 * La règle, qui est celle de l'architecture :
 *   · la voie LENTE fait autorité — elle confirme, corrige, et peut RETIRER ;
 *   · la voie RAPIDE ne fait que combler ce que la lente n'a pas encore vu.
 *
 * Le retrait silencieux tient parce que l'appelant remet `rapide` à `null` dès
 * qu'une passe lente aboutit : à cet instant le panneau ne reflète QUE
 * l'autorité, donc ce qu'elle a laissé tomber disparaît. Entre deux passes, la
 * voie rapide re-remplit — et c'est précisément son travail.
 *
 * ⚠️ LE PRIX ASSUMÉ. « La lente écrase » veut dire que si le client change
 * d'avis (« finalement, Cuba »), le panneau garde l'ancienne destination
 * jusqu'à la prochaine passe lente — au pire ~3 min (le filet de sécurité de
 * §2.2). On le paie volontiers : l'inverse — laisser une fenêtre de 15 tours de
 * parole écraser une lecture du transcript entier — ferait perdre au panneau,
 * toutes les 20 s, des lignes exactes qu'il affichait déjà. Et l'exigence temps
 * réel (§2, loi 3) ne repose pas sur ce panneau : elle repose sur les CARTES,
 * que la voie rapide continue d'armer immédiatement, sans passer par ici.
 */
export function lignesPanneau(rapide: TripBrief | null, lent: TripBrief | null, language: UILanguage = "fr"): LigneCapteManquant[] {
  const copy = COPY[language];
  if (!rapide) return lignesCapteManquant(lent, language);
  if (!lent) return lignesCapteManquant(rapide, language);

  const parAtome = new Map<LigneCapteManquant["id"], LigneCapteManquant>();
  const lignesRapides = lignesCapteManquant(rapide, language);
  const lignesLentes = lignesCapteManquant(lent, language);
  const rapideParAtome = new Map(lignesRapides.map((ligne) => [ligne.id, ligne]));

  for (const ligne of lignesRapides) parAtome.set(ligne.id, ligne);
  for (const ligne of lignesLentes) {
    const provisoire = rapideParAtome.get(ligne.id);
    const sujetChange = (ligne.id === "destination" || ligne.id === "hotel")
      && provisoire?.detail
      && ligne.detail
      && provisoire.detail.trim().toLocaleLowerCase() !== ligne.detail.trim().toLocaleLowerCase()
      && (provisoire.etat === "capte" || provisoire.etat === "incertain");

    // Une nouvelle destination/hôtel détecté dans la fenêtre live ne doit pas
    // être effacé par le dernier brief autoritaire. Ce n'est pas encore une
    // confirmation : on le montre donc explicitement « à confirmer » jusqu'à
    // la prochaine passe lente, qui pourra confirmer, corriger ou retirer.
    if (sujetChange && provisoire) {
      parAtome.set(ligne.id, {
        ...provisoire,
        etat: "incertain",
        texte: ligne.id === "destination" ? copy.destinationUnconfirmed : copy.hotelUnconfirmed,
      });
    } else {
      parAtome.set(ligne.id, ligne);
    }
  }

  return ORDRE.map((id) => parAtome.get(id))
    .filter((ligne): ligne is LigneCapteManquant => Boolean(ligne))
    .slice(0, LIGNES_MAX);
}
