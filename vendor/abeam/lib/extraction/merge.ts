import { missingField } from "./trip-brief.ts";
import type { Anchor, DateFloue, Field, LieuResolution, Statut, TripBrief } from "@/lib/extraction/trip-brief";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * ANCRE APRÈS FUSION.
 *
 * Une ancre est un couple (enregistrement, milliseconde) : hors de SA session, un
 * timecode ne désigne rien. Dans un brief de dossier — qui fusionne N conversations —
 * l'ancre doit donc suivre **la valeur qui gagne** ET dire de quelle session elle
 * vient. C'est pourquoi `ancre_session_id` est porté par le champ lui-même : la
 * signature de `mergeSessionBriefs(briefs)` reste inchangée (les appelants n'ont rien
 * à fournir), et chaque champ fusionné reste auto-suffisant.
 *
 * Trois cas, dans cet ordre :
 *  1. le champ gagnant porte une ancre attribuée (ms + session) → elle est transportée ;
 *  2. il porte une ancre orpheline (ms sans session) → elle est REMISE À `null`.
 *     Un timecode qu'on ne peut pas rattacher à un enregistrement est un bug de
 *     provenance (loi 5), pas une information : mieux vaut aucune puce d'ancre ;
 *  3. le champ ne parle pas d'ancre du tout (brief historique) → le champ fusionné
 *     n'en parle pas non plus : aucune clé ajoutée, forme historique préservée.
 */
function applyMergedAnchor(target: Anchor, source: Anchor) {
  const declared = source.ancre_ms !== undefined || source.ancre_session_id !== undefined;
  if (!declared) {
    delete target.ancre_ms;
    delete target.ancre_session_id;
    return;
  }

  const ms = source.ancre_ms;
  const sessionId = source.ancre_session_id;
  const attributed = typeof ms === "number" && Number.isFinite(ms) && ms >= 0 && typeof sessionId === "string" && sessionId.length > 0;

  if (attributed) {
    target.ancre_ms = ms;
    target.ancre_session_id = sessionId;
    return;
  }

  target.ancre_ms = null;
  target.ancre_session_id = null;
}

function isMissing(status: Statut) {
  return status === "manquant";
}

function hasValue<T>(field: Field<T>) {
  if (field.valeur === null) return false;
  if (Array.isArray(field.valeur)) return field.valeur.length > 0;
  return true;
}

function serialize(value: unknown) {
  return JSON.stringify(value);
}

function statusFor(candidates: Array<Field<unknown>>, fallback: Statut) {
  if (candidates.some((field) => field.statut === "contradiction")) return "contradiction";
  const values = new Set(candidates.filter(hasValue).map((field) => serialize(field.valeur)));
  if (values.size > 1) return "contradiction";
  if (candidates.some((field) => field.statut === "capte")) return "capte";
  if (candidates.some((field) => field.statut === "incertain")) return "incertain";
  return fallback;
}

function mergeScalarField<T>(fields: Array<Field<T>>): Field<T> {
  const winner = fields.find((field) => !isMissing(field.statut)) ?? fields[0];
  const candidates = fields.filter((field) => !isMissing(field.statut));
  if (!winner || candidates.length === 0) {
    const fallback = clone(fields[0]);
    applyMergedAnchor(fallback, fields[0]);
    return fallback;
  }

  const merged: Field<T> = {
    ...clone(winner),
    confiance: Math.max(...candidates.map((field) => field.confiance)),
    statut: statusFor(candidates as Array<Field<unknown>>, winner.statut),
  };
  // L'ancre suit la valeur qui gagne — y compris quand le statut fusionné devient
  // "contradiction" : le timecode doit mener au moment de la valeur AFFICHÉE.
  applyMergedAnchor(merged, winner);
  return merged;
}

function mergeListField<T>(fields: Array<Field<T[]>>): Field<T[]> {
  const candidates = fields.filter((field) => !isMissing(field.statut));
  if (candidates.length === 0) {
    const fallback = clone(fields[0]);
    applyMergedAnchor(fallback, fields[0]);
    return fallback;
  }

  const values = new Map<string, T>();
  const verbatims: string[] = [];
  for (const field of candidates) {
    if (field.verbatim && !verbatims.includes(field.verbatim)) verbatims.push(field.verbatim);
    for (const item of field.valeur ?? []) {
      values.set(serialize(item), item);
    }
  }

  const first = candidates[0];
  const mergedValues = [...values.values()];
  const merged: Field<T[]> = {
    verbatim: verbatims.length ? verbatims.join(" | ") : first.verbatim,
    valeur: mergedValues,
    confiance: Math.max(...candidates.map((field) => field.confiance)),
    statut: candidates.some((field) => field.statut === "contradiction")
      ? "contradiction"
      : mergedValues.length > 0
        ? "capte"
        : first.statut,
  };
  // Une liste n'a pas UNE valeur gagnante : son verbatim est la concaténation des
  // verbatims, dans l'ordre des candidats. L'ancre suit donc le PREMIER fragment de
  // ce verbatim composite, c'est-à-dire le candidat le plus récent (`briefs[0]`).
  applyMergedAnchor(merged, first);
  return merged;
}

function mergeDateField(fields: DateFloue[]): DateFloue {
  const winner = fields.find((field) => !isMissing(field.statut)) ?? fields[0];
  const candidates = fields.filter((field) => !isMissing(field.statut));
  if (!winner || candidates.length === 0) {
    const fallback = clone(fields[0]);
    applyMergedAnchor(fallback, fields[0]);
    return fallback;
  }

  const values = new Set(candidates.filter((field) => field.valeur).map((field) => `${field.valeur}:${field.precision}`));
  const merged: DateFloue = {
    ...clone(winner),
    confiance: Math.max(...candidates.map((field) => field.confiance)),
    statut: candidates.some((field) => field.statut === "contradiction") || values.size > 1
      ? "contradiction"
      : winner.statut === "capte"
        ? "capte"
        : "incertain",
  };
  applyMergedAnchor(merged, winner);
  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
// RÉSOLUTION DE LIEU APRÈS FUSION — pourquoi ce n'est PAS du newest-first
// ─────────────────────────────────────────────────────────────────────────────
//
// Le contrat de ce module est NEWEST-FIRST (`briefs[0]` = la rencontre la plus
// récente) et c'est juste pour tout ce qui a été DIT : un client change d'avis,
// et sa dernière phrase l'emporte sur l'avant-dernière (« mars… non, avril »).
//
// `lieu.resolution` n'est pas de cette nature. Ce n'est pas une déclaration du
// client, c'est un JUGEMENT du modèle sur l'endroit du monde dont on parle. Or où
// se trouve Michès ne change pas entre deux rencontres. Quand deux résolutions
// diffèrent, il n'y a que deux explications :
//
//  (a) le sujet a changé — on parlait du Club Med Michès, on parle maintenant de
//      Tulum : la nouvelle résolution est la seule pertinente, même moins sûre ;
//  (b) le sujet est le même et le modèle a été MOINS sûr cette fois (transcript
//      plus bruité, mention en passant). Écraser 0.9 par 0.4 ne corrige rien :
//      ça détruit une bonne réponse et fait retomber le Payload sous son seuil,
//      donc transforme une carte utile en question inutile posée au client.
//
// D'où la règle retenue : **le plus récent fixe le SUJET, la confiance tranche à
// sujet égal.**
//   1. la résolution la plus récente désigne le sujet courant (`base_sur`) ;
//   2. parmi les résolutions qui portent sur CE sujet, on garde la plus sûre ;
//      à confiance égale, la plus récente (elle a vu le plus de conversation) ;
//   3. les résolutions d'un autre sujet sont abandonnées — elles situent
//      correctement quelque chose dont on ne parle plus.
//
// Conséquence assumée : on ne fabrique JAMAIS une résolution composite (la ville
// de l'une, le pays de l'autre). Une résolution est un tout cohérent ; recoudre
// deux jugements produirait un lieu que personne n'a jamais situé — exactement le
// genre de faux qui envoie un vrai client au mauvais endroit.

const normalizeSubject = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** De quoi cette résolution parle-t-elle : ce qui a été dit, à défaut le lieu situé. */
function subjectOf(resolution: LieuResolution): string {
  const said = resolution.base_sur?.trim();
  if (said) return normalizeSubject(said);
  return normalizeSubject([resolution.ville, resolution.pays].filter(Boolean).join(" "));
}

/**
 * Deux résolutions répondent-elles à la même question ?
 * Comparaison par mots porteurs : « Club Med Michès » et « le Club Med à Michès »
 * sont le même sujet ; « Club Med Michès » et « Tulum » ne le sont pas. Le seuil
 * porte sur le sujet le plus COURT des deux (le plus récent est souvent plus
 * bref) : la moitié de ses mots doit se retrouver dans l'autre.
 */
function sameSubject(a: string, b: string): boolean {
  if (!a || !b) return a === b;
  if (a === b) return true;
  const wordsA = new Set(a.split(" ").filter((w) => w.length > 2));
  const wordsB = new Set(b.split(" ").filter((w) => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return false;
  const [petit, grand] = wordsA.size <= wordsB.size ? [wordsA, wordsB] : [wordsB, wordsA];
  let communs = 0;
  for (const word of petit) if (grand.has(word)) communs += 1;
  return communs / petit.size >= 0.5;
}

/**
 * Fusionne `lieu.resolution` selon la règle documentée ci-dessus.
 * Rend `undefined` quand AUCUN brief ne déclare la clé : un dossier fait de
 * briefs historiques garde exactement sa forme historique (même parti que
 * `applyMergedAnchor`).
 */
function mergeResolution(briefs: TripBrief[]): LieuResolution | null | undefined {
  const declaree = briefs.some((brief) => "resolution" in brief.lieu);
  if (!declaree) return undefined;

  const candidats = briefs
    .map((brief) => brief.lieu.resolution)
    .filter((resolution): resolution is LieuResolution => Boolean(resolution));
  if (candidats.length === 0) return null;

  const sujetCourant = subjectOf(candidats[0]);
  const memeSujet = candidats.filter((candidat) => sameSubject(subjectOf(candidat), sujetCourant));

  // `reduce` sans `>` strict inversé : à confiance égale on garde l'accumulateur,
  // c'est-à-dire le plus RÉCENT (les candidats sont ordonnés newest-first).
  const gagnant = memeSujet.reduce((meilleur, candidat) => (candidat.confiance > meilleur.confiance ? candidat : meilleur));
  return clone(gagnant);
}

function mergeCroisiere(briefs: TripBrief[]) {
  const cruiseBriefs = briefs.filter((brief) => brief.croisiere);
  const base = clone(cruiseBriefs[0]?.croisiere ?? null);
  if (!base) return null;

  return {
    zone_navigation: mergeScalarField(cruiseBriefs.map((brief) => brief.croisiere!.zone_navigation)),
    ligne: mergeScalarField(cruiseBriefs.map((brief) => brief.croisiere!.ligne)),
    type_cabine: mergeListField(cruiseBriefs.map((brief) => brief.croisiere!.type_cabine)),
    duree_croisiere: mergeScalarField(cruiseBriefs.map((brief) => brief.croisiere!.duree_croisiere)),
    port_embarquement: mergeScalarField(cruiseBriefs.map((brief) => brief.croisiere!.port_embarquement)),
  };
}

/**
 * Fusionne des briefs de sessions ordonnés du plus récent au plus ancien.
 * Contrat d'appel: `briefs[0]` est le dernier brief connu. Les scalaires,
 * dates et itinéraires prennent le premier champ non manquant dans cet ordre.
 */
export function mergeSessionBriefs(briefs: TripBrief[]): TripBrief {
  if (briefs.length === 0) {
    throw new Error("mergeSessionBriefs requiert au moins un TripBrief.");
  }

  const merged = clone(briefs[0]);

  merged.meta = {
    nature_conversation: briefs.find((brief) => brief.meta.nature_conversation !== "info")?.meta.nature_conversation ?? briefs[0].meta.nature_conversation,
    langue: briefs[0].meta.langue,
    source_demande: mergeScalarField(briefs.map((brief) => brief.meta.source_demande)),
  };

  merged.voyageurs = {
    adultes: mergeScalarField(briefs.map((brief) => brief.voyageurs.adultes)),
    enfants_ages: mergeListField(briefs.map((brief) => brief.voyageurs.enfants_ages)),
    nombre_chambres: mergeScalarField(briefs.map((brief) => brief.voyageurs.nombre_chambres)),
    type_groupe: mergeScalarField(briefs.map((brief) => brief.voyageurs.type_groupe)),
    composition: mergeScalarField(briefs.map((brief) => brief.voyageurs.composition)),
  };

  merged.lieu = {
    origine: mergeScalarField(briefs.map((brief) => brief.lieu.origine)),
    destinations: mergeListField(briefs.map((brief) => brief.lieu.destinations)),
    region: mergeScalarField(briefs.map((brief) => brief.lieu.region)),
    hotel_nomme: mergeScalarField(briefs.map((brief) => brief.lieu.hotel_nomme)),
  };
  // La clé n'apparaît que si au moins un brief la déclare (voir `mergeResolution`).
  const resolution = mergeResolution(briefs);
  if (resolution !== undefined) merged.lieu.resolution = resolution;

  merged.temps = {
    depart: mergeDateField(briefs.map((brief) => brief.temps.depart)),
    retour: mergeDateField(briefs.map((brief) => brief.temps.retour)),
    duree: mergeScalarField(briefs.map((brief) => brief.temps.duree)),
    flexibilite: mergeScalarField(briefs.map((brief) => brief.temps.flexibilite)),
    type_trajet: mergeScalarField(briefs.map((brief) => brief.temps.type_trajet)),
    itineraire: briefs.find((brief) => brief.temps.itineraire)?.temps.itineraire ?? null,
  };

  merged.type_voyage = {
    type: mergeScalarField(briefs.map((brief) => brief.type_voyage.type)),
    composantes: mergeListField(briefs.map((brief) => brief.type_voyage.composantes)),
    encadrement: mergeScalarField(briefs.map((brief) => brief.type_voyage.encadrement)),
  };

  merged.vols = {
    ...(briefs.some((brief) => brief.vols.aeroport_depart && brief.vols.aeroport_depart.statut !== "manquant")
      ? { aeroport_depart: mergeScalarField(briefs.map((brief) => brief.vols.aeroport_depart ?? missingField<string>())) }
      : {}),
    classe: mergeScalarField(briefs.map((brief) => brief.vols.classe)),
    bagages_soute: mergeScalarField(briefs.map((brief) => brief.vols.bagages_soute)),
    correspondances: mergeScalarField(briefs.map((brief) => brief.vols.correspondances)),
    escales_a_eviter: mergeListField(briefs.map((brief) => brief.vols.escales_a_eviter)),
    compagnie_preferee: mergeScalarField(briefs.map((brief) => brief.vols.compagnie_preferee)),
  };

  merged.hebergement = {
    type_hebergement: mergeScalarField(briefs.map((brief) => brief.hebergement.type_hebergement)),
    niveau_confort: mergeListField(briefs.map((brief) => brief.hebergement.niveau_confort)),
    plan_repas: mergeScalarField(briefs.map((brief) => brief.hebergement.plan_repas)),
    localisation: mergeScalarField(briefs.map((brief) => brief.hebergement.localisation)),
    preference_plage: mergeScalarField(briefs.map((brief) => brief.hebergement.preference_plage)),
    preference_piscine: mergeScalarField(briefs.map((brief) => brief.hebergement.preference_piscine)),
  };

  merged.croisiere = mergeCroisiere(briefs);

  merged.motivation = {
    motivations: mergeListField(briefs.map((brief) => brief.motivation.motivations)),
    ambiance: mergeScalarField(briefs.map((brief) => brief.motivation.ambiance)),
    occasion: mergeScalarField(briefs.map((brief) => brief.motivation.occasion)),
    occasion_details: mergeScalarField(briefs.map((brief) => brief.motivation.occasion_details)),
  };

  merged.budget = {
    total: mergeScalarField(briefs.map((brief) => brief.budget.total)),
    par_personne: mergeScalarField(briefs.map((brief) => brief.budget.par_personne)),
    devise: "CAD",
  };

  merged.services = {
    services_importants: mergeListField(briefs.map((brief) => brief.services.services_importants)),
    excursions: mergeScalarField(briefs.map((brief) => brief.services.excursions)),
    elements_importants: mergeListField(briefs.map((brief) => brief.services.elements_importants)),
    elements_a_eviter: mergeListField(briefs.map((brief) => brief.services.elements_a_eviter)),
  };

  merged.contraintes = {
    mobilite_sante: mergeScalarField(briefs.map((brief) => brief.contraintes.mobilite_sante)),
    restrictions_alimentaires: mergeScalarField(briefs.map((brief) => brief.contraintes.restrictions_alimentaires)),
  };

  merged.assurance = {
    statut_assurance: mergeScalarField(briefs.map((brief) => brief.assurance.statut_assurance)),
  };

  merged.decision = {
    raison_hesitation: mergeListField(briefs.map((brief) => brief.decision.raison_hesitation)),
    notes_blocage: mergeScalarField(briefs.map((brief) => brief.decision.notes_blocage)),
  };

  merged.notes_agent = mergeScalarField(briefs.map((brief) => brief.notes_agent));

  return merged;
}
