/**
 * DÉSAMBIGUÏSATION D'ÉTABLISSEMENT — « Parlez-vous des Roches Blanches à Cassis ? »
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * POURQUOI CE MODULE EXISTE (rencontre réelle, 2026-08-06)
 * Le fondateur a parlé d'un hôtel sans en connaître le nom exact : il a donné le
 * nom qu'il croyait et une ville. Rien n'est parti. Il a fini par écrire au Nudge
 * Agent, qui a trouvé l'établissement — et « Montrer au client » a publié la
 * RÉPONSE TEXTUELLE de l'agent comme carte, sans photos, parce que la chaîne
 * d'enrichissement n'était jamais déclenchée.
 *
 * Ce que le produit doit faire à la place : quand la conversation contient un
 * établissement ET une hésitation SUR SON NOM, le Nudge propose de lui-même la
 * désambiguïsation, sous forme de pastille cliquable dans son fil. Le clic
 * produit une VRAIE carte hôtel dans le feed, photos comprises.
 *
 * C'est plus conforme à nos lois que de deviner (§1) : on ne tranche pas à la
 * place de l'agente, on lui pose la question, elle valide d'un clic.
 *
 * ─── LE CONTRAT POUR L'UI (c'est la partie à lire avant de câbler la pastille) ──
 *
 * 1) DÉTECTION + RECHERCHE (côté serveur, pendant la rencontre) :
 *      const issue = await proposerDesambiguisation(signal, etat, { serp });
 *      // issue.proposition : la pastille à afficher, ou null
 *      // issue.etat        : le nouvel état de curation (à conserver, cf. §4)
 *      // issue.message     : loi 4 — la phrase à afficher quand une recherche
 *      //                     est partie et n'a rien donné (jamais un silence)
 *
 * 2) LA PASTILLE — charge utile RÉELLE, copiée d'un appel SerpAPI du 2026-08-06
 *    (dit : « les roches blanche », lieu : « Cassis » — 1 crédit) :
 *
 *    {
 *      "id": "desamb-ChkI06KBnsK3mLlUGg0vZy8xMWdjNnloY3RkEAE",
 *      "question": "Parlez-vous des Roches Blanches à Cassis ?",
 *      "entendu": "les roches blanche",
 *      "confiance": 1,
 *      "candidat": {
 *        "nom": "Hôtel Les Roches Blanches",
 *        "libelle": "Hôtel Les Roches Blanches, Cassis",
 *        "ville": "Cassis",
 *        "pays": null,
 *        "property_token": "ChkI06KBnsK3mLlUGg0vZy8xMWdjNnloY3RkEAE",
 *        "vignette": "https://lh4.googleusercontent.com/proxy/Gi-e9zC5rQ…=w320-h240-k-no",
 *        "confiance": 1
 *      },
 *      "alternative": null
 *    }
 *
 *    L'UI affiche `question` (français naturel — loi 9, jamais un nom de champ)
 *    et rend `candidat` (et `alternative` s'il existe) cliquables : `libelle`
 *    est le texte de la pastille, `vignette` l'image optionnelle.
 *    `pays` reste `null` sur ce chemin : la liste de ville ne porte pas
 *    d'adresse. Il arrive au clic, avec la fiche. Ne t'en sers pas pour décider.
 *
 * 3) LE CLIC (c'est exactement ce qui manquait) :
 *      const { card, message } = await enrichirCandidat(candidat, { serp });
 *      // card : une SuggestionCard de type "hotels", photos comprises,
 *      //        consommable TELLE QUELLE par le feed (mergeLiveCards)
 *      // card === null → `message` dit l'échec (loi 4)
 *    Puis : trancherProposition(etat, proposition.id) pour libérer la place.
 *
 *    Ce que ça a donné en vrai (1 crédit ; les 5 URLs d'images testées en HTTP :
 *    200 image/jpeg, de 29 ko à 337 ko) :
 *      titre     : "Hôtel Les Roches Blanches — Cassis"
 *      sousTitre : "9 Av. des Calanques, 13260 Cassis, France"
 *      items[0]  : { detail: "Hôtel de tourisme 5 étoiles · Wi-Fi · …",
 *                    note: "4★ (556)", image: <héros 1280×800>,
 *                    images: [4 vignettes 400×400],
 *                    lien: "https://www.roches-blanches-cassis.com/" }
 *
 * 4) CURATION (§3, §4) : au plus UNE proposition à la fois, jamais deux fois la
 *    même, jamais deux fois le même nom entendu. Elle ne compte pas dans le
 *    budget cartes (c'est un nudge), mais elle en respecte la loi du silence :
 *    le copilote souffle, il ne pousse pas.
 *
 * ─── CE QUE LES APPELS RÉELS ONT APPRIS (à ajouter à la cartographie §11) ──────
 * `google_hotels_autocomplete` ne rend PAS de fiche pour « Les Roches Blanches » :
 * ni « roches blanche cassis », ni « les roches blanches cassis », ni « hotel les
 * roches blanches cassis » ne rendent la moindre suggestion portant un
 * `property_token` — uniquement des complétions de requête. Et `google_hotels` en
 * recherche texte sur le NOM (« roches blanche cassis ») rend 0 propriété, comme
 * pour « Club Med Michès ».
 * Ce qui marche : `google_hotels` sur la VILLE (`q="Cassis, France"`) → 18
 * propriétés, chacune avec `name`, `property_token`, `hotel_class`,
 * `overall_rating` et 9 images — dont « Hôtel Les Roches Blanches » en position 4.
 * D'où la chaîne d'ici : le lieu dit sert à OUVRIR LA LISTE, et le rapprochement
 * de nom se fait chez nous, gratuitement, sur des noms exacts.
 *
 * Imports relatifs volontaires (module utilisable par les scripts Node).
 */

import { norm } from "./destinations.ts";
import { googlePhoto } from "./engine.ts";
import type { SuggestionCard } from "./engine.ts";
import type { SerpApiClient } from "./serpapi.ts";

// Réponses SerpAPI non typées — accès défensif uniquement.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

/** Le minimum attendu du client SerpAPI (garde ce module testable sans réseau). */
export type DisambiguationClient = Pick<SerpApiClient, "googleHotels" | "hotelsAutocomplete" | "hotelPhotos">;

// ═══════════════════════════════════════════════════════════════════════════════
// 1. LE SIGNAL — ce que la voie rapide nous donne
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Entrée du détecteur. Se remplit depuis `LiveTriggers` (trigger-scan) SANS le
 * copier : ce module ne dépend pas de `lib/live/*`, qui appartient à un autre
 * agent. Mapping attendu côté appelant :
 *   { nomApproximatif: t.hotel, lieux: t.destinations,
 *     hesitationProjet: t.hesitation, fenetre: <texte des dernières lignes> }
 */
export type DisambiguationSignal = {
  /** Le nom d'établissement tel qu'il a été prononcé — approximatif par nature. */
  nomApproximatif: string | null;
  /** Les lieux captés (ville, région). Le premier sert à ouvrir la liste. */
  lieux?: string[];
  /**
   * L'hésitation du CLIENT SUR SON PROJET (prix, dates, attend un co-voyageur).
   * Présente ici uniquement pour être IGNORÉE explicitement : ce n'est pas une
   * hésitation sur le nom d'un établissement, et les confondre ferait tirer la
   * pastille sur des rencontres qui n'ont rien demandé.
   */
  hesitationProjet?: string | null;
  /**
   * L'hésitation SUR LE NOM, quand elle est déclarée en amont. Le trigger-scan ne
   * la distingue pas encore (voir la note d'ajustement en bas de fichier) : tant
   * qu'elle n'existe pas, le détecteur lexical ci-dessous prend le relais.
   */
  doutePourLeNom?: boolean | null;
  /** La fenêtre récente du transcript, pour le détecteur lexical de repli. */
  fenetre?: string | null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. LA DÉTECTION — un nom d'établissement × une hésitation SUR CE NOM
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Le doute exprimé : « je sais plus », « c'est quoi déjà », « pas sûr »…
 * Seul, il ne suffit pas — « je suis pas sûr des dates » n'est pas une
 * hésitation sur un nom.
 */
const MARQUEURS_DOUTE =
  /\b(?:pas s[uû]re?|pas certaine?|sais plus|sait plus|sais pu|rappelle plus|souviens plus|souvient plus|oubli[ée]|c'?est quoi d[ée]j[àa]|comment (?:[çc]a|il|elle) s'?appelle)\b/i;

/** La référence au NOM, qui donne sa cible au doute. */
const MARQUEURS_NOM = /\b(?:nom|nomm[ée]e?s?|s'?appell?ait?e?|appel[ée]e?)\b/i;

/**
 * L'approximation qui se suffit à elle-même : elle DIT déjà que le nom est
 * approché, sans avoir besoin du mot « nom ».
 */
const MARQUEURS_APPROXIMATION =
  /(?:quelque chose comme|un truc comme|dans ce genre|du genre|quelque chose du genre|[çc]a ressemble [àa]|les? [a-zà-ÿ]+ quelque chose|ou quelque chose)/i;

/**
 * Y a-t-il un doute SUR LE NOM dans ce texte ? (déterministe, hors ligne)
 *
 * Deux familles suffisent, et il faut les deux dans le premier cas : un doute
 * (« je sais plus ») ET une référence au nom (« le nom », « ça s'appelle »).
 * La seconde famille — l'approximation explicite (« les Roches quelque chose »)
 * — se suffit, parce qu'elle nomme déjà l'approximation.
 */
export function exprimeUnDouteSurLeNom(texte: string | null | undefined): boolean {
  if (!texte || !texte.trim()) return false;
  if (MARQUEURS_APPROXIMATION.test(texte)) return true;
  return MARQUEURS_DOUTE.test(texte) && MARQUEURS_NOM.test(texte);
}

/** Ce que la détection retient quand elle arme la recherche. */
export type DouteDetecte = {
  nomApproximatif: string;
  lieu: string | null;
  /** D'où vient la certitude qu'on hésite sur le NOM (pour les journaux). */
  origine: "declare" | "fenetre";
};

/**
 * LE GATE. Deux conditions, et pas une de moins :
 *  · un nom d'établissement a été prononcé — un LIEU SEUL ne suffit pas, sinon
 *    « un hôtel à Cassis » nous ferait choisir l'hôtel à la place de l'agente ;
 *  · l'hésitation porte sur CE NOM, pas sur le projet du client (§4 : la
 *    `raison_hesitation` — prix, dates, co-voyageur — n'a rien à voir ici).
 */
export function detecterDouteSurLeNom(signal: DisambiguationSignal): DouteDetecte | null {
  const nom = (signal.nomApproximatif ?? "").trim();
  if (!nom) return null;

  const lieu = (signal.lieux ?? []).map((l) => l.trim()).find((l) => l.length > 0) ?? null;

  if (signal.doutePourLeNom) return { nomApproximatif: nom, lieu, origine: "declare" };
  // Le repli lexical lit la fenêtre — et le nom lui-même, qui porte souvent
  // l'approximation (« les Roches quelque chose »).
  if (exprimeUnDouteSurLeNom(signal.fenetre) || exprimeUnDouteSurLeNom(nom)) {
    return { nomApproximatif: nom, lieu, origine: "fenetre" };
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. LE RAPPROCHEMENT DE NOM — gratuit, hors ligne, et c'est là que tout se joue
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Mots qui ne portent aucune identité : les garder ferait passer « l'hôtel
 * Bellevue Trucmuche » pour « Hôtel Le Bellevue » (2 mots sur 3 « retrouvés »,
 * dont un qui ne veut rien dire). `norm()` ayant déjà retiré les accents et les
 * mots de ≤ 2 lettres étant écartés d'office, la liste reste courte.
 */
const MOTS_SANS_IDENTITE = new Set([
  "hotel", "hotels", "resort", "resorts", "spa", "auberge", "hostellerie", "motel", "hostel",
  "les", "des", "une", "aux", "the", "and", "chez",
]);

const motsUtiles = (texte: string, aRetirer: Set<string>): string[] =>
  norm(texte)
    .split(" ")
    .filter((mot) => mot.length > 2 && !MOTS_SANS_IDENTITE.has(mot) && !aRetirer.has(mot));

/**
 * Deux mots désignent-ils la même chose ? Le singulier/pluriel et les fautes de
 * captation sont la règle, pas l'exception : « blanche » doit retrouver
 * « Blanches ». Sans ça, le cas fondateur échoue à 0,5.
 */
function memeMot(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a))) return true;
  return a.length >= 5 && b.length >= 5 && distance1(a, b);
}

/** Une seule substitution/insertion/suppression d'écart (Levenshtein ≤ 1). */
function distance1(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let ecarts = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i += 1; j += 1; continue; }
    ecarts += 1;
    if (ecarts > 1) return false;
    if (a.length === b.length) { i += 1; j += 1; }
    else if (a.length > b.length) i += 1;
    else j += 1;
  }
  return ecarts + (a.length - i) + (b.length - j) <= 1;
}

/**
 * SEUIL DE CORRESPONDANCE — 0,6, et voici pourquoi ce chiffre-là.
 *
 * La chaîne de résolution (§11.6) accepte à **0,5** : « 50 % des mots prononcés
 * retrouvés ». Ce seuil-là s'applique à un candidat dont l'identité est déjà
 * confirmée par un `property_token` rendu pour CETTE requête. Ici, le contexte
 * est différent : on ouvre la liste d'une ville entière (18 établissements pour
 * Cassis) et on choisit dedans. Un mot sur deux, sur un nom de deux mots, veut
 * dire qu'un mot sur deux ne correspond PAS — « Roches Rouges » passerait pour
 * « Roches Blanches ». C'est exactement la devinette que §1 interdit.
 *
 * 0,6 est la plus petite valeur qui rend « un mot sur deux » insuffisant :
 *   · nom de 2 mots  → les 2 exigés (1,00)
 *   · nom de 3 mots  → 2 sur 3 (0,67) — la marge pour un mot mal capté
 *   · nom de 4 mots  → 3 sur 4 (0,75)
 * Plus haut (0,75) on perdrait le mot mal capté d'un nom de trois mots, c'est-
 * à-dire précisément le cas qu'on cherche à servir. Plus bas, on devine.
 *
 * Le rapprochement tolérant (`memeMot`) porte le reste : « blanche » retrouve
 * « Blanches ». Sans lui, 0,6 serait un mur.
 */
export const SEUIL_CORRESPONDANCE = 0.6;

/**
 * Sans lieu prononcé, rien ne corrobore le nom : on n'ouvre pas de liste, on
 * interroge l'autocomplete et on exige beaucoup plus. « Club Med Miches » rend
 * 1,00 sur ce chemin (vérifié §11) — le seuil ne coûte donc rien aux vrais cas.
 */
export const SEUIL_CORRESPONDANCE_SANS_LIEU = 0.8;

/**
 * Part des mots IDENTIFIANTS du nom prononcé retrouvés dans le candidat.
 * Les mots du lieu sont retirés du nom prononcé : « les roches blanches à
 * Cassis » ne doit pas gagner de points parce que le candidat est à Cassis.
 */
export function correspondanceNom(candidat: string, prononce: string, lieu?: string | null): number {
  const motsDuLieu = new Set(lieu ? norm(lieu).split(" ").filter((m) => m.length > 2) : []);
  const voulus = motsUtiles(prononce, motsDuLieu);
  if (voulus.length === 0) return 0;
  const trouves = motsUtiles(candidat, new Set());
  let hits = 0;
  for (const mot of voulus) if (trouves.some((t) => memeMot(mot, t))) hits += 1;
  return hits / voulus.length;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. LE CONTRAT DE LA PROPOSITION
// ═══════════════════════════════════════════════════════════════════════════════

export type CandidatEtablissement = {
  /** Le nom tel que Google le connaît (« Hôtel Les Roches Blanches »). */
  nom: string;
  /** Le texte de la pastille (« Hôtel Les Roches Blanches, Cassis »). */
  libelle: string;
  ville: string | null;
  pays: string | null;
  /** L'identité de l'établissement — c'est lui qui ouvre la fiche et les photos. */
  property_token: string;
  /** Vignette déjà connue (gratuite) : la pastille peut être illustrée. */
  vignette?: string;
  confiance: number;
};

export type DisambiguationProposal = {
  /** Stable et dérivé du token : c'est la clé de dédoublonnage. */
  id: string;
  /** En français naturel, jamais un nom de champ (loi 9). */
  question: string;
  /** Le nom approximatif tel qu'il a été prononcé — pour le journal et l'échec. */
  entendu: string;
  candidat: CandidatEtablissement;
  /** Au plus UN second candidat. Jamais une liste. */
  alternative: CandidatEtablissement | null;
  confiance: number;
};

// ── Rédaction de la question ────────────────────────────────────────────────

/** « Les Roches Blanches » → « des Roches Blanches ». */
function syntagme(nom: string): string {
  // « Hôtel Les Roches Blanches » se dit « les Roches Blanches » : on retire le
  // mot de catégorie quand un article suit, c'est ainsi qu'on en parle de vive voix.
  const propre = nom.trim().replace(/^(?:h[oô]tel|hostellerie|auberge|resort)\s+(?=(?:les|le|la|l')\b)/i, "");
  if (/^les\s+/i.test(propre)) return `des ${propre.replace(/^les\s+/i, "")}`;
  if (/^le\s+/i.test(propre)) return `du ${propre.replace(/^le\s+/i, "")}`;
  if (/^la\s+/i.test(propre)) return `de la ${propre.replace(/^la\s+/i, "")}`;
  if (/^l['’]/i.test(propre)) return `de l'${propre.replace(/^l['’]\s*/i, "")}`;
  if (/^(?:h[oô]tel|auberge|hostellerie|appartement|[aeiouyàâéèêîôû])/i.test(propre)) return `de l'${propre}`;
  return `de ${propre}`;
}

function redigerQuestion(premier: CandidatEtablissement, second: CandidatEtablissement | null): string {
  const s1 = syntagme(premier.nom);
  if (!second) {
    return premier.ville ? `Parlez-vous ${s1} à ${premier.ville} ?` : `Parlez-vous ${s1} ?`;
  }
  const s2 = syntagme(second.nom);
  if (premier.ville && second.ville && norm(premier.ville) === norm(second.ville)) {
    return `À ${premier.ville}, parlez-vous ${s1} ou ${s2} ?`;
  }
  const q1 = premier.ville ? `${s1} à ${premier.ville}` : s1;
  const q2 = second.ville ? `${s2} à ${second.ville}` : s2;
  return `Parlez-vous ${q1}, ou ${q2} ?`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. LA CURATION — au plus une, jamais deux fois la même
// ═══════════════════════════════════════════════════════════════════════════════

export type DisambiguationState = {
  /** L'id de la proposition affichée et pas encore tranchée. Une seule à la fois. */
  enAttente: string | null;
  /** Les propositions déjà faites — on ne repose jamais la même question. */
  vues: string[];
  /** Les noms déjà traités, même quand la recherche est revenue bredouille. */
  entendus: string[];
};

export const ETAT_INITIAL: DisambiguationState = { enAttente: null, vues: [], entendus: [] };

/** La clé d'un nom entendu : c'est elle qui empêche de re-chercher en boucle. */
export function cleEntendu(nom: string, lieu?: string | null): string {
  return [norm(nom), lieu ? norm(lieu) : ""].join("@");
}

/** Le nom a été traité — qu'on ait trouvé ou non. Empêche la boucle. */
export function marquerEntendu(etat: DisambiguationState, cle: string): DisambiguationState {
  return etat.entendus.includes(cle) ? etat : { ...etat, entendus: [...etat.entendus, cle] };
}

/** Une proposition part à l'écran : elle occupe la place jusqu'à ce qu'on tranche. */
export function enregistrerProposition(etat: DisambiguationState, proposition: DisambiguationProposal): DisambiguationState {
  return {
    enAttente: proposition.id,
    vues: etat.vues.includes(proposition.id) ? etat.vues : [...etat.vues, proposition.id],
    // Le nom entendu a déjà été marqué avant la recherche (`marquerEntendu`) :
    // qu'on trouve ou non, on ne repart pas chercher le même nom.
    entendus: etat.entendus,
  };
}

/** L'agente a cliqué (ou ignoré) : la place se libère, la question ne revient pas. */
export function trancherProposition(etat: DisambiguationState, id: string): DisambiguationState {
  return {
    enAttente: etat.enAttente === id ? null : etat.enAttente,
    vues: etat.vues.includes(id) ? etat.vues : [...etat.vues, id],
    entendus: etat.entendus,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. LA RECHERCHE DU CANDIDAT
// ═══════════════════════════════════════════════════════════════════════════════

const arrondi2 = (n: number) => Math.round(n * 100) / 100;

/** Fenêtre neutre : `google_hotels` EXIGE des dates, même pour ouvrir une liste. */
function fenetreNeutre(now: Date): { checkIn: string; checkOut: string } {
  const jour = 86_400_000;
  const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
  return { checkIn: iso(now.getTime() + 30 * jour), checkOut: iso(now.getTime() + 37 * jour) };
}

/** « 9 Av. des Calanques, 13260 Cassis, France » → « France ». */
function paysDepuisAdresse(adresse: unknown): string | null {
  if (typeof adresse !== "string") return null;
  const morceaux = adresse.split(",").map((m) => m.trim()).filter(Boolean);
  const dernier = morceaux[morceaux.length - 1];
  return dernier && !/^\d/.test(dernier) ? dernier : null;
}

function versCandidat(brut: Raw, score: number, ville: string | null): CandidatEtablissement | null {
  const token = typeof brut.property_token === "string" ? brut.property_token : null;
  const nom = typeof brut.name === "string" && brut.name.trim() ? brut.name.trim()
    : typeof brut.value === "string" && brut.value.trim() ? brut.value.trim() : null;
  if (!token || !nom) return null;
  const villeFinale = ville ?? (typeof brut.location === "string" && brut.location.trim() ? brut.location.trim() : null);
  const images = (brut.images ?? []) as Array<{ thumbnail?: string; original_image?: string }>;
  const vignette = googlePhoto(images[0], 320, 240)
    ?? (typeof brut.thumbnail === "string" ? brut.thumbnail : undefined);
  return {
    nom,
    libelle: villeFinale ? `${nom}, ${villeFinale}` : nom,
    ville: villeFinale,
    pays: paysDepuisAdresse(brut.address),
    property_token: token,
    vignette,
    confiance: arrondi2(score),
  };
}

/**
 * Retenir AU PLUS DEUX candidats — et abandonner s'il y en a plus.
 *
 * « Au plus 2, jamais une liste » ne veut pas dire « tronquer à 2 » : si trois
 * établissements répondent aussi bien au nom prononcé, c'est que le nom
 * n'identifie rien, et cacher le troisième serait présenter un choix faux.
 * Trois candidats ou plus → aucune proposition (§1).
 */
function retenir(candidats: CandidatEtablissement[]): CandidatEtablissement[] {
  const parToken = new Map<string, CandidatEtablissement>();
  for (const c of candidats) {
    const existant = parToken.get(c.property_token);
    if (!existant || c.confiance > existant.confiance) parToken.set(c.property_token, c);
  }
  const tries = [...parToken.values()].sort((a, b) => b.confiance - a.confiance);
  return tries.length > 2 ? [] : tries;
}

export type RechercheCandidats = {
  candidats: CandidatEtablissement[];
  searchesUsed: number;
  /** Vrai si la liste était fournie mais qu'aucun nom n'approchait assez. */
  tropGenerique: boolean;
  warnings: string[];
};

/**
 * Un nom approximatif (+ un lieu) → au plus deux établissements NOMMÉS.
 *
 * ① Un lieu est connu → on ouvre la LISTE de la ville (`google_hotels`) et on
 *    rapproche les noms chez nous. C'est le chemin qui sauve le cas fondateur :
 *    l'autocomplete est muet sur « Les Roches Blanches » (vérifié), la liste de
 *    Cassis la rend en position 4 avec son `property_token` et ses 9 images.
 * ② Rien de concluant, ou aucun lieu → `google_hotels_autocomplete` désaccentué
 *    (le piège §11 : « Michès » rend 0 résultat, « Miches » rend la fiche), qui
 *    reste le seul chemin quand le client n'a nommé aucune ville.
 * ③ Rien au-dessus du seuil → aucun candidat. Pas de devinette.
 */
export async function chercherCandidats(
  doute: DouteDetecte,
  opts: { serp: DisambiguationClient; now?: Date },
): Promise<RechercheCandidats> {
  const now = opts.now ?? new Date();
  const warnings: string[] = [];
  let searchesUsed = 0;
  let tropGenerique = false;

  // ① La liste de la ville.
  if (doute.lieu) {
    const { checkIn, checkOut } = fenetreNeutre(now);
    try {
      searchesUsed += 1;
      const res = (await opts.serp.googleHotels({
        q: doute.lieu,
        check_in_date: checkIn,
        check_out_date: checkOut,
      })) as { properties?: Raw[] };
      const proprietes = Array.isArray(res.properties) ? res.properties : [];
      const notes = proprietes
        .map((p) => ({ p, score: correspondanceNom(String(p.name ?? ""), doute.nomApproximatif, doute.lieu) }))
        .filter((x) => x.score >= SEUIL_CORRESPONDANCE)
        .map((x) => versCandidat(x.p, x.score, doute.lieu))
        .filter((c): c is CandidatEtablissement => c !== null);
      const retenus = retenir(notes);
      if (retenus.length > 0) return { candidats: retenus, searchesUsed, tropGenerique: false, warnings };
      if (notes.length > 2) tropGenerique = true;
    } catch (e) {
      warnings.push(`Désambiguïsation (liste ${doute.lieu}): ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // ② L'autocomplete, sur la requête désaccentuée.
  const seuil = doute.lieu ? SEUIL_CORRESPONDANCE : SEUIL_CORRESPONDANCE_SANS_LIEU;
  try {
    searchesUsed += 1;
    const q = norm([doute.nomApproximatif, doute.lieu].filter(Boolean).join(" "));
    const res = (await opts.serp.hotelsAutocomplete(q)) as { suggestions?: Raw[] };
    const notes = (res.suggestions ?? [])
      .filter((s) => typeof s.property_token === "string")
      // Un lieu prononcé est une corroboration : le candidat doit s'y trouver.
      .filter((s) => {
        if (!doute.lieu) return true;
        const loc = typeof s.location === "string" ? s.location : "";
        return loc ? correspondanceNom(loc, doute.lieu) > 0 : false;
      })
      .map((s) => ({ s, score: correspondanceNom(String(s.value ?? ""), doute.nomApproximatif, doute.lieu) }))
      .filter((x) => x.score >= seuil)
      .map((x) => versCandidat(x.s, x.score, null))
      .filter((c): c is CandidatEtablissement => c !== null);
    const retenus = retenir(notes);
    if (retenus.length > 0) return { candidats: retenus, searchesUsed, tropGenerique: false, warnings };
    if (notes.length > 2) tropGenerique = true;
  } catch (e) {
    warnings.push(`Désambiguïsation (autocomplete): ${e instanceof Error ? e.message : String(e)}`);
  }

  return { candidats: [], searchesUsed, tropGenerique, warnings };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. L'ENTRÉE PUBLIQUE — détection + recherche + curation
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Le `champ` du nudge « je n'ai pas trouvé cet hôtel » de `lib/suggestions/
 * engine.ts`. Repris ici pour que les deux messages portent la MÊME identité :
 * le fil de l'agente les dédoublonne déjà par `champ`, il ne restait qu'à leur
 * donner la même clé.
 */
export const CHAMP_HOTEL_INTROUVABLE = "hotel_introuvable" as const;

export type DisambiguationOutcome = {
  proposition: DisambiguationProposal | null;
  etat: DisambiguationState;
  searchesUsed: number;
  /** Ce qui s'est passé — pour les journaux, jamais pour l'écran. */
  raison:
    | "propose"
    | "pas_de_doute_sur_le_nom"
    | "proposition_en_attente"
    | "deja_traite"
    | "aucun_candidat"
    | "trop_generique";
  /**
   * Loi 4 — « l'échec se dit ». Renseigné UNIQUEMENT quand une recherche est
   * réellement partie et n'a rien donné : « rien à dire » reste silencieux,
   * « j'ai cherché et je n'ai pas trouvé » se dit.
   */
  message: string | null;
  /**
   * L'identité du SUJET du message, partagée avec le nudge homonyme de
   * `engine.ts`. Deux sous-systèmes répondent à la même question — « je n'ai pas
   * trouvé cet hôtel » — et sur la rencontre du 2026-08-06 l'agente a lu les
   * deux, dans deux formulations. L'affichage doit n'en garder qu'un (§3) ;
   * cette clé est ce qui le lui permet, sans coupler les deux modules.
   */
  champ?: typeof CHAMP_HOTEL_INTROUVABLE;
  warnings: string[];
};

export async function proposerDesambiguisation(
  signal: DisambiguationSignal,
  etat: DisambiguationState,
  opts: { serp: DisambiguationClient; now?: Date },
): Promise<DisambiguationOutcome> {
  const vide = (raison: DisambiguationOutcome["raison"]): DisambiguationOutcome =>
    ({ proposition: null, etat, searchesUsed: 0, raison, message: null, warnings: [] });

  const doute = detecterDouteSurLeNom(signal);
  if (!doute) return vide("pas_de_doute_sur_le_nom");
  if (etat.enAttente !== null) return vide("proposition_en_attente");

  const cle = cleEntendu(doute.nomApproximatif, doute.lieu);
  if (etat.entendus.includes(cle)) return vide("deja_traite");

  const { candidats, searchesUsed, tropGenerique, warnings } = await chercherCandidats(doute, opts);
  // Le nom est traité, trouvé ou non : sans ça, la boucle live repose la même
  // question toutes les 2,5 secondes (§4 : un à la fois, jamais deux fois).
  let suite = marquerEntendu(etat, cle);

  if (candidats.length === 0) {
    return {
      proposition: null,
      etat: suite,
      searchesUsed,
      raison: tropGenerique ? "trop_generique" : "aucun_candidat",
      // Même sujet que le nudge `hotel_introuvable` de `engine.ts` : sur la
      // rencontre réelle du 2026-08-06, l'agente a lu DEUX fois qu'on n'avait
      // rien trouvé, dans deux formulations différentes — deux sous-systèmes qui
      // répondent à la même question, et un seul des deux chemins était
      // dédoublonné. Ce champ leur donne une identité commune pour que
      // l'affichage n'en garde qu'un (§3, un message à la fois). Celui-ci est le
      // plus informatif : il cite ce qui a été entendu et nomme le lieu.
      champ: CHAMP_HOTEL_INTROUVABLE,
      message: tropGenerique
        ? `Plusieurs établissements répondent à « ${doute.nomApproximatif} »${doute.lieu ? ` à ${doute.lieu}` : ""} — un mot de plus dans le nom et je saurais lequel.`
        : `Je n'ai rien trouvé qui ressemble à « ${doute.nomApproximatif} »${doute.lieu ? ` du côté de ${doute.lieu}` : ""} — le nom complet ou la ville m'aideraient à le retrouver.`,
      warnings,
    };
  }

  const [premier, second = null] = candidats;
  const id = `desamb-${premier.property_token}`;
  if (etat.vues.includes(id)) {
    return { proposition: null, etat: suite, searchesUsed, raison: "deja_traite", message: null, warnings };
  }

  const proposition: DisambiguationProposal = {
    id,
    question: redigerQuestion(premier, second),
    entendu: doute.nomApproximatif,
    candidat: premier,
    alternative: second,
    confiance: premier.confiance,
  };
  suite = enregistrerProposition(suite, proposition);
  return { proposition, etat: suite, searchesUsed, raison: "propose", message: null, warnings };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 8. LE CLIC — de la pastille à une VRAIE carte, photos comprises
// ═══════════════════════════════════════════════════════════════════════════════

export type EnrichissementResultat = {
  /** Consommable telle quelle par le feed (même type que les cartes du moteur). */
  card: SuggestionCard | null;
  /** Loi 4 : renseigné quand `card` est null — on dit qu'on n'a pas trouvé. */
  message: string | null;
  searchesUsed: number;
  warnings: string[];
};

/**
 * `property_token` → fiche exacte → carte hôtel avec photos.
 *
 * C'est ce qui manquait : « Montrer au client » publiait le TEXTE de la réponse
 * du Nudge, jamais la chaîne d'enrichissement. Ici, un clic = un appel
 * `google_hotels` par token (réponse À PLAT, §11.2) qui rend le nom exact,
 * l'adresse, le classement, la note et 9 images `googleusercontent`.
 *
 * Les dates : `google_hotels` en exige, même pour lire une fiche. Quand la
 * rencontre n'en a pas encore, on passe une fenêtre neutre — et on ne l'affiche
 * PAS : la carte montre l'établissement, elle ne promet pas un séjour.
 */
export async function enrichirCandidat(
  candidat: CandidatEtablissement,
  opts: {
    serp: DisambiguationClient;
    now?: Date;
    /** Les vraies dates de la rencontre, si elles existent — alors elles s'affichent. */
    checkIn?: string | null;
    checkOut?: string | null;
    adultes?: number;
    enfantsAges?: number[];
  },
): Promise<EnrichissementResultat> {
  const now = opts.now ?? new Date();
  const warnings: string[] = [];
  let searchesUsed = 0;
  const datesReelles = Boolean(opts.checkIn && opts.checkOut);
  const neutre = fenetreNeutre(now);
  const checkIn = opts.checkIn ?? neutre.checkIn;
  const checkOut = opts.checkOut ?? neutre.checkOut;
  const enfants = (opts.enfantsAges ?? []).map((a) => Math.min(Math.max(a, 1), 17));

  let fiche: Raw | null = null;
  try {
    searchesUsed += 1;
    fiche = (await opts.serp.googleHotels({
      // `q` reste requis même avec le token (vérifié) : on y met le lieu.
      q: candidat.ville ?? candidat.nom,
      property_token: candidat.property_token,
      check_in_date: checkIn,
      check_out_date: checkOut,
      adults: opts.adultes ?? 1,
      children: enfants.length || undefined,
      children_ages: enfants.length ? enfants.join(",") : undefined,
    })) as Raw;
  } catch (e) {
    warnings.push(`Fiche ${candidat.nom}: ${e instanceof Error ? e.message : String(e)}`);
  }

  const nom = typeof fiche?.name === "string" ? fiche.name : candidat.nom;
  let images = (fiche?.images ?? []) as Array<{ thumbnail?: string; original_image?: string }>;

  // Repli photos : la fiche porte normalement 9 images ; si elle n'en a pas,
  // le moteur dédié reste le chemin, et il ne coûte qu'un crédit de plus.
  if (images.length === 0) {
    try {
      searchesUsed += 1;
      const photos = (await opts.serp.hotelPhotos(candidat.property_token)) as Raw;
      const sections = (photos.photos ?? photos.images ?? []) as Raw[];
      images = sections
        .flatMap((s) => (Array.isArray(s?.images) ? (s.images as Raw[]) : [s]))
        .filter(Boolean) as Array<{ thumbnail?: string; original_image?: string }>;
    } catch (e) {
      warnings.push(`Photos ${candidat.nom}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const hero = images.map((img) => googlePhoto(img, 1280, 800)).find(Boolean);
  const galerie = images
    .map((img) => googlePhoto(img, 400, 400))
    .filter((url): url is string => Boolean(url))
    .slice(1, 5);

  // L'échec se dit (loi 4). Une carte sans nom ni image n'est pas une carte.
  if (!fiche?.name && !hero) {
    return {
      card: null,
      message: `Je n'arrive pas à ouvrir la fiche ${candidat.ville ? `${candidat.nom} à ${candidat.ville}` : candidat.nom} — rien à montrer pour l'instant.`,
      searchesUsed,
      warnings,
    };
  }

  const ville = candidat.ville ?? null;
  const classe = typeof fiche?.hotel_class === "string" ? fiche.hotel_class : null;
  const equipements = Array.isArray(fiche?.amenities) ? (fiche.amenities as string[]).slice(0, 2) : [];
  const note = typeof fiche?.overall_rating === "number"
    ? `${fiche.overall_rating}★${typeof fiche.reviews === "number" ? ` (${fiche.reviews})` : ""}`
    : undefined;

  const card: SuggestionCard = {
    id: `hotels-${candidat.property_token.slice(0, 12)}`,
    type: "hotels",
    priorite: 1,
    titre: `${nom}${ville ? ` — ${ville}` : ""}`,
    // Sans vraies dates, on montre l'ADRESSE : afficher une fenêtre inventée
    // ferait croire à une disponibilité qu'on n'a pas vérifiée.
    sousTitre: datesReelles
      ? `${checkIn} → ${checkOut} · ${opts.adultes ?? 1} adulte(s)${enfants.length ? ` · ${enfants.length} enfant(s)` : ""}`
      : (typeof fiche?.address === "string" ? fiche.address : candidat.pays ?? undefined),
    items: [{
      titre: nom,
      detail: [classe, ...equipements].filter(Boolean).join(" · ") || undefined,
      // Pas de prix dans le feed : il est tourné vers le client, et un tarif
      // Google que l'agence ne facturera pas sème le doute (même règle que le moteur).
      note,
      image: hero,
      images: galerie,
      lien: typeof fiche?.link === "string" ? fiche.link : undefined,
    }],
    source: "Google Hotels via SerpAPI",
  };

  return { card, message: null, searchesUsed, warnings };
}

/**
 * ─── AJUSTEMENT DEMANDÉ AU TRIGGER-SCAN (à écrire par l'agent qui possède
 *     `lib/live/*` — décrit ici, PAS implémenté) ────────────────────────────────
 *
 * Aujourd'hui `LiveTriggers.hesitation` mélange deux choses qui n'ont rien à voir :
 *   · l'hésitation du CLIENT SUR SON PROJET (« il trouve ça cher », « il attend
 *     son co-voyageur ») — c'est `decision.raison_hesitation`, elle nourrit le
 *     récap et le nudge d'hésitation (§4) ;
 *   · l'hésitation SUR LE NOM d'un établissement (« les Roches quelque chose, je
 *     sais plus ») — c'est le déclencheur de CE module.
 *
 * Demandé : un champ SÉPARÉ, booléen, laissé à `false` par défaut —
 *   `hotel_nom_incertain: boolean`
 *     « true UNIQUEMENT si la personne montre qu'elle n'est pas sûre du NOM de
 *      l'établissement (elle le cherche, l'approxime, dit qu'elle l'a oublié).
 *      Une hésitation sur le prix, les dates ou la décision de partir n'est PAS
 *      ça → false. »
 * `hesitation` garde son sens actuel et sa description inchangée.
 *
 * Pourquoi un booléen et pas un texte : le nom approximatif est DÉJÀ dans
 * `hotel` ; ce qu'on ne sait pas, c'est s'il est fiable. Un booléen répond
 * exactement à cette question et ne peut pas halluciner un nom.
 *
 * En attendant, `detecterDouteSurLeNom()` se rabat sur un détecteur lexical
 * déterministe (`exprimeUnDouteSurLeNom`) qui lit la fenêtre du transcript. Il
 * couvre le cas fondateur, mais il est plus bête qu'un LLM : c'est un repli, pas
 * la solution.
 */
