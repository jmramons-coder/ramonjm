/**
 * CADENCE DES DEUX VOIES (règles §2) — logique PURE, testée hors ligne par
 * `pnpm check:livefeed`. Aucune dépendance React, aucun réseau : c'est de la
 * décision, pas de la plomberie.
 *
 * Le défaut qu'elle corrige (mesuré en rencontre réelle le 2026-08-06) : une
 * garde fixe de 20 s protégeait la voie rapide du churn, mais elle était posée
 * AVANT le scan — le fondateur pouvait donc attendre 20 s de plus que les 5-9 s
 * budgétées avant que quoi que ce soit ne démarre. Or le churn qu'on voulait
 * éviter, c'était de re-tirer sur la MÊME information ; jamais de faire
 * attendre une information NEUVE.
 *
 * D'où la règle : la garde est **adaptative**. Elle ne s'applique qu'aux
 * déclencheurs qui n'apportent rien de nouveau. Un lieu ou un hôtel jamais
 * entendu, une date nouvelle, un nombre de voyageurs qui change → tir
 * immédiat, sans délai.
 */

import { hasGate, triggersKey, type LiveTriggers } from "./live-brief.ts";

/** Garde anti-churn : ne s'applique QUE quand rien de neuf n'a été dit. */
export const GARDE_MS = 20_000;

/**
 * Ce que la rencontre a déjà entendu. Sert à répondre à une seule question :
 * « est-ce que ça, c'est nouveau ? ». Immuable — `memoriser` rend un nouvel
 * objet, ce qui rend chaque état inspectable dans un banc.
 */
export type LiveSeen = {
  /** Lieux ET hôtels déjà entendus, normalisés. */
  lieux: string[];
  /** Formulations de date déjà entendues, normalisées. */
  dates: string[];
  /** Dernière composition du groupe connue (`null` = jamais dite). */
  pax: string | null;
  /**
   * Les lieux que le client a explicitement ÉCARTÉS, normalisés. Ce n'est pas
   * la même mémoire que `lieux` : `lieux` dit ce qu'on a déjà CHERCHÉ (donc
   * payé), `rejetes` dit ce que le client ne veut pas (un fait sur la
   * conversation, pas sur notre dépense). D'où deux fonctions distinctes pour
   * les écrire, et deux moments distincts pour les appeler.
   */
  rejetes: string[];
};

export const SEEN_VIDE: LiveSeen = { lieux: [], dates: [], pax: null, rejetes: [] };

function cle(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Les lieux et hôtels d'une fenêtre, normalisés et dédoublonnés.
 *
 * Elle lit `t.destinations` et JAMAIS `t.destinations_dites` — c'est ce qui fait
 * qu'une destination rejetée ne peut pas compter comme une nouveauté, donc ne
 * peut pas déclencher un tir. L'y brancher réintroduirait exactement le bug du
 * 2026-08-07, sans une ligne de code visible.
 */
function lieuxDe(t: LiveTriggers): string[] {
  const tous = [...t.destinations, ...(t.hotel ? [t.hotel] : [])].map(cle).filter(Boolean);
  return [...new Set(tous)];
}

/**
 * La composition du groupe, en une chaîne comparable. `null` quand rien n'a
 * été dit : « on ne sait pas » n'est pas « ça a changé ».
 */
export function paxSignature(t: LiveTriggers): string | null {
  if (t.adultes === null && t.enfants_ages.length === 0) return null;
  return `${t.adultes ?? "?"}|${[...t.enfants_ages].sort((a, b) => a - b).join(",")}`;
}

/**
 * Ce que cette fenêtre apporte de NEUF. Liste de raisons lisibles (elles
 * servent au banc et au diagnostic), vide quand rien n'est nouveau.
 */
export function nouveautes(t: LiveTriggers, seen: LiveSeen): string[] {
  const raisons: string[] = [];
  for (const lieu of lieuxDe(t)) {
    // UN LIEU ÉCARTÉ N'EST PLUS UNE NOUVEAUTÉ, même s'il est reprononcé.
    //
    // `rejetes` était MÉMORISÉ et lu par personne : la protection annoncée
    // n'existait pas. Le cas qui la rend nécessaire est celui de la rencontre
    // réelle : « c'est pas la Floride qui nous intéresse » écarte la Floride,
    // mais la fenêtre du détecteur ne fait que 15 lignes. Plus tard, un simple
    // « bon, on oublie la Floride » remet le mot dans `destinations` sans que le
    // refus soit encore dans LA MÊME fenêtre pour le filtrer — et un lieu que le
    // client a explicitement écarté repartait en recherche payée.
    //
    // C'est ici que ça se joue et pas ailleurs : `rejetes` dit un fait sur la
    // CONVERSATION, et la seule question que pose cette fonction est « est-ce
    // que ça, c'est neuf ? ». Un lieu refusé n'est jamais neuf.
    if (seen.rejetes.includes(lieu)) continue;
    if (!seen.lieux.includes(lieu)) raisons.push(`lieu ou hôtel jamais entendu : « ${lieu} »`);
  }
  const date = t.date_verbatim ? cle(t.date_verbatim) : null;
  if (date && !seen.dates.includes(date)) raisons.push(`date nouvelle : « ${date} »`);
  const pax = paxSignature(t);
  if (pax !== null && pax !== seen.pax) {
    raisons.push(seen.pax === null ? `voyageurs enfin dits : ${pax}` : `voyageurs modifiés : ${seen.pax} → ${pax}`);
  }
  return raisons;
}

/** À n'appeler QUE quand on tire : ce qu'on n'a pas cherché reste « neuf ». */
export function memoriser(t: LiveTriggers, seen: LiveSeen): LiveSeen {
  const date = t.date_verbatim ? cle(t.date_verbatim) : null;
  const pax = paxSignature(t);
  return {
    lieux: [...new Set([...seen.lieux, ...lieuxDe(t)])],
    dates: date && !seen.dates.includes(date) ? [...seen.dates, date] : seen.dates,
    pax: pax ?? seen.pax,
    // Recopié tel quel : un tir ne dit rien sur ce que le client veut ou pas.
    // Sans cette ligne, le premier tir qui suit un refus l'effacerait.
    rejetes: seen.rejetes,
  };
}

/**
 * Ce que le client a écarté. Appelée à chaque fenêtre, tir ou pas : un refus
 * ne coûte aucune recherche, donc rien ne justifie de le faire attendre la
 * décision de cadence — et c'est justement quand la fenêtre ne contient plus
 * rien à chercher (`action: "rien"`, parce que `hasGate` est faux) que le refus
 * doit quand même être entendu.
 *
 * Un refus tient jusqu'à ce que le client redemande le lieu LUI-MÊME : c'est
 * lui l'autorité sur son voyage, il a le droit de changer d'avis, et rien
 * d'autre qu'une envie redite ne lève un refus.
 *
 * On n'ajoute QUE sur `intention === "rejetee"` explicitement présent dans la
 * fenêtre courante, JAMAIS sur l'absence : la fenêtre glisse (15 lignes), et un
 * lieu qui en sort n'est pas un lieu refusé.
 *
 * Rendre `seen` À L'IDENTITÉ quand rien ne change n'est pas cosmétique : côté
 * React, c'est ce qui permet à l'appelant de tester `!==` et de ne pas re-rendre
 * le feed à chaque scan.
 */
export function memoriserRejets(t: LiveTriggers, seen: LiveSeen): LiveSeen {
  const dites = t.destinations_dites ?? [];
  const refuses = dites.filter((d) => d.intention === "rejetee").map((d) => cle(d.nom)).filter(Boolean);
  const voulus = new Set([...t.destinations, ...dites.filter((d) => d.intention === "souhaitee").map((d) => d.nom)].map(cle));
  const suivants = [...new Set([...seen.rejetes, ...refuses])].filter((r) => !voulus.has(r));
  const inchange = suivants.length === seen.rejetes.length && suivants.every((r, i) => r === seen.rejetes[i]);
  return inchange ? seen : { ...seen, rejetes: suivants };
}

export type DecisionRapide = {
  /** `rien` : pas de gate ou déclencheurs identiques. `garder` : rien de neuf, la garde tient. `tirer` : on cherche. */
  action: "rien" | "garder" | "tirer";
  /** La clé de déclencheurs de cette fenêtre (`""` si pas de gate). */
  cle: string;
  raisons: string[];
};

/**
 * VOIE RAPIDE — que faire de cette fenêtre de déclencheurs.
 *
 * L'ordre des questions est le raisonnement lui-même :
 *   1. y a-t-il seulement un gate (§1 : rien de nommé → rien) ;
 *   2. est-ce STRICTEMENT la même chose que la dernière fois → on se tait ;
 *   3. y a-t-il du NEUF → on tire tout de suite, la garde ne s'applique pas ;
 *   4. sinon (les mêmes faits reformulés) → la garde tient, on attendra.
 */
export function decideVoieRapide(args: {
  triggers: LiveTriggers;
  seen: LiveSeen;
  derniereCle: string;
  dernierTirAt: number;
  now: number;
  gardeMs?: number;
}): DecisionRapide {
  const { triggers, seen, derniereCle, dernierTirAt, now, gardeMs = GARDE_MS } = args;
  if (!hasGate(triggers)) return { action: "rien", cle: "", raisons: ["aucun lieu ni hôtel nommé"] };

  const cleTriggers = triggersKey(triggers);
  if (!cleTriggers) return { action: "rien", cle: "", raisons: ["aucun lieu ni hôtel nommé"] };
  if (cleTriggers === derniereCle) return { action: "rien", cle: cleTriggers, raisons: ["déclencheurs identiques au dernier tir"] };

  const neuf = nouveautes(triggers, seen);
  if (neuf.length > 0) return { action: "tirer", cle: cleTriggers, raisons: neuf };

  if (now - dernierTirAt < gardeMs) {
    return { action: "garder", cle: cleTriggers, raisons: ["rien de neuf dans cette fenêtre — garde anti-churn"] };
  }
  return { action: "tirer", cle: cleTriggers, raisons: ["déclencheurs changés, garde écoulée"] };
}

/**
 * Le tokenizer de mots de ce fichier, et le SEUL. Il sert au signal de la voie
 * lente comme à `decidePartiel` : deux compteurs divergents dans le même
 * fichier feraient glisser les seuils de l'un sans que personne ne le voie.
 * « tout-inclus » = 1 mot, « d'hôtels » = 1 mot, « 15 » = 1 mot.
 */
function motsDe(texte: string): string[] {
  return texte.split(/[^\p{L}\p{N}'’-]+/u).filter(Boolean);
}

export function compterMots(texte: string): number {
  return motsDe(texte).length;
}

/**
 * Les mots de PAROLE d'un transcript. Type STRUCTUREL et non `TranscriptLine`
 * importé : ce fichier ne dépend que de `./live-brief.ts`, et les deux
 * déclarations de `TranscriptLine` du dépôt satisfont cette forme.
 *
 * La note privée que l'agente tape n'est pas la conversation qui avance : 300
 * mots de notes ne doivent pas réveiller l'autorité. La couche appelante filtre
 * déjà, mais la fonction pure doit le prouver au banc.
 */
export function motsTranscript(lignes: ReadonlyArray<{ text: string; kind?: string }>): number {
  let total = 0;
  for (const ligne of lignes) {
    if (ligne.kind === "private-note") continue;
    total += compterMots(ligne.text);
  }
  return total;
}

/**
 * VOIE LENTE (§2.2) — « déclenchée par le CHANGEMENT RÉEL, et non par
 * l'horloge ». Deux seuils, et une nuance qui manquait : le filet de sécurité
 * est un FILET, pas une horloge. Tel qu'il était écrit, il repartait sur
 * `nouvelles > 0` — une seule ligne prononcée en trois minutes suffisait à
 * relancer une re-dérivation complète (15-25 s de LLM). C'est ce qui a fait
 * tourner `/api/extract` 11 fois en une rencontre. Le filet exige donc lui
 * aussi un minimum de matière : en dessous, ce n'est pas la conversation qui
 * parle, c'est la montre.
 *
 * Le second défaut, mesuré en rencontre réelle le 2026-08-07 : le compteur de
 * LIGNES est un mauvais proxy de l'avancement, parce que `appendTranscriptLine`
 * fusionne les tours consécutifs du même locuteur — un monologue de 77 s reste
 * UNE ligne qui grossit sur place. Le transcript entier de la rencontre faisait
 * 97 mots pour 5 lignes : le seuil de 12 lignes était inatteignable par
 * construction, et la voie lente n'a JAMAIS tourné. Le signal est donc passé
 * aux MOTS, immunisés contre la fusion.
 *
 * Les seuils, en une phrase chacun (le calcul complet est asserté par la
 * simulation d'une heure de `pnpm check:livefeed`, section G) : débit de parole
 * français 130-160 mots/min, 110 en dialogue transcrit (silences inter-tours,
 * hésitations et back-channels écartés par le STT).
 */
export const VOIE_LENTE = {
  /**
   * AMORCE : matière minimale sous laquelle une extraction n'a rien à dire.
   * 90 mots ≈ 37 s de parole continue à 145 mots/min, 49 s d'échange à 110.
   * Franchi par le seul tour long du 2026-08-07 (79 mots comptés sur un
   * extrait amputé, ≈186 mots pour le tour complet de 77 s), et hors d'atteinte
   * d'une minute d'accueil (« bonjour, installez-vous, un café ? »).
   */
  MOTS_AMORCE: 90,
  /**
   * Assez de matière NEUVE pour re-dériver tout de suite. Calibré à l'envers,
   * par le budget : l'incident des 11 appels dit qu'une extraction toutes les
   * ~1,5 min est trop chère ; 400 mots rendent ~3 min à débit de dialogue, soit
   * 15 passes sur une rencontre de 45 min — assez pour qu'une carte fausse ne
   * survive pas plus de 3 min à son apparition.
   */
  MOTS_CHANGEMENT: 400,
  /** Le filet de sécurité temporel — 4 min, pour qu'il reste plus rare que le chemin du changement (3 min 38 s en échange vif). */
  FILET_MS: 240_000,
  /** …qui reste un filet : 150 mots neufs ≈ 1 min de parole, un paragraphe entier et pas une phrase polie. */
  MOTS_MIN_FILET: 150,
  /**
   * Le filet de TIRS : la voie rapide a montré N choses neuves au CLIENT
   * (doctrine 3) sans que l'autorité ait parlé. Pas 2, parce qu'une seule
   * phrase peut nommer une ville ET une date — c'est UN tir portant deux
   * raisons. Pas 5, parce que le 2026-08-07 a produit quatre nouveautés en
   * 94 s : à 3, le filet réveille l'autorité DANS la rencontre.
   */
  TIRS_SANS_AUTORITE: 3,
  /** Plancher absolu entre deux re-dérivations — le seul plafond de coût dur : 3600/120 = 30 extractions/h, quoi qu'il arrive. */
  REPOS_MIN_MS: 120_000,
} as const;

export type DecisionLente = {
  action: "rien" | "deriver";
  /** Le chemin emprunté : « amorce », « changement », « tirs », « filet » — ou la raison du refus. */
  raison: string;
};

/**
 * Faut-il re-dériver le Master Context maintenant ?
 *
 * L'ORDRE DES QUESTIONS EST LE RAISONNEMENT (même style que `decideVoieRapide`).
 * Elle rend une RAISON et pas un booléen : c'est ce qui permet au banc
 * d'asserter QUEL chemin a tiré. Un seuil qui tire pour le mauvais motif est un
 * bug qu'un booléen ne peut pas voir.
 */
export function decideVoieLente(args: {
  /** Mots de PAROLE accumulés depuis le début de la rencontre (notes privées exclues). */
  mots: number;
  /** Le même total, figé au lancement de la dernière re-dérivation. 0 = jamais. */
  motsDerives: number;
  /** L'autorité a-t-elle déjà rendu un brief dans cette rencontre ? */
  aDejaDerive: boolean;
  /** Tirs de la voie rapide depuis la dernière re-dérivation RÉUSSIE. */
  tirsSansAutorite: number;
  /** ms depuis la dernière re-dérivation, ou depuis le début de la rencontre. */
  depuisMs: number;
}): DecisionLente {
  const { mots, motsDerives, aDejaDerive, tirsSansAutorite, depuisMs } = args;

  // ① Le gate UNIQUE qui protège tous les chemins en dessous : ni l'horloge ni
  // le filet de tirs ne peuvent parler dans une pièce qui n'a presque rien dit.
  if (mots < VOIE_LENTE.MOTS_AMORCE) {
    return { action: "rien", raison: `rencontre trop courte (${mots} < ${VOIE_LENTE.MOTS_AMORCE} mots)` };
  }
  // ② L'amorce passe AVANT le repos, sinon rien ne peut démarrer avant 2 min.
  //
  // ⚠️ MAIS ELLE DOIT PAYER LE REPOS DÈS LA SECONDE TENTATIVE — sinon elle est
  // une boucle. Le commentaire précédent affirmait ici que « son faux positif
  // est borné à UN appel ». C'était FAUX, et la revue adverse l'a démontré :
  // l'appelant ne pose `aDejaDerive` qu'après avoir reçu un brief de nature
  // « planification ». Une conversation qui n'en est pas une (accueil, small
  // talk, un client qui raconte son dernier voyage — exactement ce que la
  // règle 11 du prompt d'extraction range en « hors_sujet ») laissait donc
  // `aDejaDerive` à false POUR TOUJOURS, et le déclencheur sur le transcript,
  // qui n'a pas de débounce, relançait une extraction complète à chaque tour
  // de parole. Même chose sur un échec HTTP (jeton expiré, 502) : la boucle
  // devenait serrée, une extraction toutes les 15-25 s, soit 150 à 240 par
  // heure là où ce dispositif annonce 30 comme plafond dur.
  //
  // C'est très exactement la maladie que le commentaire de `VOIE_LENTE`
  // raconte plus haut (les 11 appels à /api/extract en une rencontre), et le
  // lot qui l'a réintroduite est celui qui prétendait la guérir.
  //
  // `motsDerives` est le discriminant : l'appelant le pose AU LANCEMENT de
  // chaque tentative, et il vaut 0 tant qu'aucune n'est partie. Une amorce
  // JAMAIS tentée part donc immédiatement (c'est tout l'intérêt du chemin ②) ;
  // une amorce déjà tentée attend le plancher, comme tout le monde. Retenter
  // reste légitime — l'autorité n'a toujours pas parlé — mais au rythme borné.
  if (!aDejaDerive) {
    if (motsDerives > 0 && depuisMs < VOIE_LENTE.REPOS_MIN_MS) {
      return {
        action: "rien",
        raison: `amorce retentée trop tôt (${depuisMs} ms < ${VOIE_LENTE.REPOS_MIN_MS} ms)`,
      };
    }
    return { action: "deriver", raison: "amorce — l'autorité n'a jamais parlé de cette rencontre" };
  }
  if (depuisMs < VOIE_LENTE.REPOS_MIN_MS) {
    return { action: "rien", raison: `repos (${depuisMs} ms < ${VOIE_LENTE.REPOS_MIN_MS} ms)` };
  }

  const neufs = mots - motsDerives;
  if (neufs >= VOIE_LENTE.MOTS_CHANGEMENT) {
    return { action: "deriver", raison: `changement — ${neufs} mots neufs` };
  }
  if (tirsSansAutorite >= VOIE_LENTE.TIRS_SANS_AUTORITE) {
    return { action: "deriver", raison: `filet de tirs — ${tirsSansAutorite} tirs de la voie rapide sans confirmation` };
  }
  if (neufs >= VOIE_LENTE.MOTS_MIN_FILET && depuisMs >= VOIE_LENTE.FILET_MS) {
    return { action: "deriver", raison: `filet — ${neufs} mots neufs depuis ${Math.round(depuisMs / 1000)} s` };
  }
  return {
    action: "rien",
    raison: `rien d'assez neuf (${neufs} mots, ${Math.round(depuisMs / 1000)} s, ${tirsSansAutorite} tirs)`,
  };
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ARMER SUR LES PARTIELS (défaut mesuré en rencontre réelle, 2026-08-06)
 *
 * Le fondateur : « ce n'est qu'au moment où j'ai appuyé sur pause que ça m'a
 * affiché la question ». Ce n'était pas une coïncidence. Tout ce qu'il avait
 * dit tenait en UN seul tour, et `liveTranscript` ne bougeait que sur un tour
 * FINALISÉ. AssemblyAI ne finalise qu'après un silence suffisant : tant qu'il
 * parlait, son tour restait en suspens ; la pause a coupé le flux, ce qui a
 * forcé la finalisation, et toute la chaîne s'est déclenchée d'un coup.
 *
 * Conséquence : zéro déclenchement possible pendant une minute de parole
 * continue — et toute la latence gagnée par ailleurs (garde adaptative,
 * débounce 1,2 s) restait théorique.
 *
 * La correction est de nourrir la voie rapide avec les PARTIELS. Deux
 * garde-fous, et ils sont dans les types autant que dans le code :
 *
 *  – un partiel n'est JAMAIS stocké comme un tour. Le transcript officiel reste
 *    fait de tours finalisés : c'est le document de référence de la rencontre
 *    (consentement, Loi 25). Le partiel ne sert qu'à ARMER plus tôt — d'où le
 *    nom de cette fonction, et le fait qu'elle ne rende jamais de texte à
 *    conserver, seulement une décision.
 *  – un partiel est INSTABLE : chaque message `Turn` re-transcrit tout le tour
 *    depuis le début et peut réviser ce qui précède. Relancer un scan à chaque
 *    mot serait du churn payant. On ne relance que sur un CHANGEMENT
 *    SIGNIFICATIF, jamais sur chaque frappe.
 *
 * Ce qui compte comme significatif :
 *   ① un NOM CANDIDAT apparaît, qui n'était pas dans le dernier partiel armé —
 *      c'est le seul déclencheur qui vaille la peine d'être instantané (§1 :
 *      règle du produit nommé) ;
 *   ② à défaut, le tour a grossi d'au moins `MOTS_DELTA` mots depuis le dernier
 *      armement — la conversation a assez avancé pour qu'un rescan trouve
 *      autre chose.
 *
 * ⚠️ Sur les partiels, `turn_is_formatted` vaut `false` : la casse et la
 * ponctuation ne sont PAS garanties (seuls les finals sont formatés). Détecter
 * un nom propre à la majuscule serait donc fragile. C'est pourquoi ① combine
 * DEUX détecteurs indépendants — la majuscule en milieu de phrase quand elle
 * est là, ET un appariement lexical sur le vocabulaire connu, qui, lui, ne
 * dépend pas de la casse.
 */
export const PARTIEL = {
  /** En dessous, il n'y a rien à scanner : on ne paie pas un LLM pour trois mots. */
  MOTS_MIN: 6,
  /** Croissance minimale, en mots, pour re-armer sans nom nouveau. */
  MOTS_DELTA: 8,
} as const;

export type EtatPartiel = {
  /** Le partiel sur lequel on a armé la dernière fois (`""` = jamais). */
  texteArme: string;
  /** Son nombre de mots. */
  motsArmes: number;
};

export const PARTIEL_VIDE: EtatPartiel = { texteArme: "", motsArmes: 0 };

function normaliser(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/**
 * Les noms candidats d'un texte : majuscule en milieu de phrase (quand la casse
 * est là) OU appartenance au vocabulaire connu (insensible à la casse). Rendu
 * normalisé pour être comparable d'un partiel à l'autre.
 */
export function nomsCandidats(texte: string, vocabulaire: string[] = []): string[] {
  const tokens = motsDe(texte);
  const trouves = new Set<string>();

  // ① Majuscule ailleurs qu'au tout premier mot. Présent seulement si le moteur
  // a mis de la casse — d'où le détecteur ② en parallèle.
  for (let i = 1; i < tokens.length; i += 1) {
    const t = tokens[i];
    if (t.length > 2 && t[0] === t[0].toUpperCase() && t[0] !== t[0].toLowerCase()) {
      trouves.add(normaliser(t));
    }
  }

  // ② Vocabulaire connu, en expressions complètes et sans casse — le détecteur
  // qui survit à un partiel tout en minuscules.
  const plat = ` ${tokens.map(normaliser).join(" ")} `;
  for (const terme of vocabulaire) {
    const cle = normaliser(terme).trim();
    if (cle.length > 2 && plat.includes(` ${cle} `)) trouves.add(cle.replace(/\s+/g, " "));
  }

  return [...trouves];
}

export type DecisionPartiel = {
  /** `armer` : on lance un scan sur ce partiel. `attendre` : pas encore. */
  action: "armer" | "attendre";
  raisons: string[];
  /** L'état à conserver — inchangé quand on attend. */
  etat: EtatPartiel;
};

/**
 * Faut-il armer la voie rapide sur ce partiel ? Logique PURE (`pnpm check:sttgarde`).
 *
 * N'appelle rien, ne stocke rien : elle rend une décision et le nouvel état.
 * L'appelant ne doit JAMAIS écrire `partiel` dans le transcript.
 */
export function decidePartiel(args: {
  partiel: string;
  etat: EtatPartiel;
  vocabulaire?: string[];
  motsMin?: number;
  motsDelta?: number;
}): DecisionPartiel {
  const { partiel, etat, vocabulaire = [], motsMin = PARTIEL.MOTS_MIN, motsDelta = PARTIEL.MOTS_DELTA } = args;
  const texte = partiel.replace(/\s+/g, " ").trim();
  const nbMots = motsDe(texte).length;

  if (nbMots < motsMin) {
    return { action: "attendre", raisons: [`partiel trop court (${nbMots} < ${motsMin} mots)`], etat };
  }
  if (normaliser(texte) === normaliser(etat.texteArme)) {
    return { action: "attendre", raisons: ["partiel identique au dernier armement"], etat };
  }

  const raisons: string[] = [];
  const dejaVus = new Set(nomsCandidats(etat.texteArme, vocabulaire));
  const nouveaux = nomsCandidats(texte, vocabulaire).filter((n) => !dejaVus.has(n));
  if (nouveaux.length > 0) raisons.push(`nom nouveau dans le partiel : « ${nouveaux.join(" », « ")} »`);

  const croissance = nbMots - etat.motsArmes;
  if (croissance >= motsDelta) raisons.push(`+${croissance} mots depuis le dernier armement`);

  if (raisons.length === 0) {
    return { action: "attendre", raisons: [`changement insignifiant (+${croissance} mots, aucun nom nouveau)`], etat };
  }
  return { action: "armer", raisons, etat: { texteArme: texte, motsArmes: nbMots } };
}
