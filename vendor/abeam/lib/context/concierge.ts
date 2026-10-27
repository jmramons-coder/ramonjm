/**
 * CONCIERGE AGENT v1 — la mémoire persistante du client (PDF : profiler les
 * personnes présentes, autres que le worker). Partagé au niveau AGENCE, comme
 * le carnet clients : ce qu'un collègue apprend protège toute l'agence.
 *
 * Deux injections :
 *  - EN AMONT  : buildKnownContext() → bloc « contexte connu » du prompt
 *    d'extraction (continuité, rôles, orthographe) — ARRIÈRE-PLAN seulement.
 *  - EN AVAL   : profileVigieConstraints() → la vigie vérifie les contraintes
 *    connues même si personne ne les re-verbalise (le cas fondateur : la
 *    mobilité de la mère, dite une fois, protège toutes les rencontres).
 *
 * Fusion pure et déterministe (testable sans API). Imports relatifs (scripts).
 */

import type { TripBrief, Field } from "../extraction/trip-brief";

export type ProfileFact = {
  valeur: string;
  verbatim: string | null;
  confiance: number;
  maj: string; // ISO
  /** Rencontre qui a produit ce fait, quand la mémoire connaît son origine. */
  source_session_id?: string | null;
};

export type ClientProfile = {
  version: 1;
  contraintes_sante: ProfileFact[];
  restrictions_alimentaires: ProfileFact[];
  preferences: ProfileFact[];
  contexte_humain: ProfileFact[];
  destinations_visitees: string[]; // rempli plus tard (post-voyage)
  maj: string;
};

const MAX_FACTS = 8;

export function createEmptyProfile(now: string): ClientProfile {
  return {
    version: 1,
    contraintes_sante: [],
    restrictions_alimentaires: [],
    preferences: [],
    contexte_humain: [],
    destinations_visitees: [],
    maj: now,
  };
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

const val = <T,>(f: Field<T> | undefined | null): T | null =>
  f && f.valeur !== null && f.valeur !== undefined && f.statut !== "manquant" ? f.valeur : null;

/** Upsert par valeur normalisée : garde la version la plus récente/confiante. */
function upsertFact(list: ProfileFact[], fact: ProfileFact): { list: ProfileFact[]; changed: boolean } {
  const idx = list.findIndex((f) => norm(f.valeur) === norm(fact.valeur));
  if (idx === -1) return { list: [...list, fact].slice(-MAX_FACTS), changed: true };
  const existing = list[idx];
  const provenanceAdded = !existing.source_session_id && Boolean(fact.source_session_id);
  if (fact.confiance >= existing.confiance && (fact.verbatim !== existing.verbatim || provenanceAdded)) {
    const next = [...list];
    next[idx] = { ...fact, confiance: Math.max(fact.confiance, existing.confiance) };
    return { list: next, changed: true };
  }
  return { list, changed: false };
}

const LABELS: Record<string, string> = {
  economique: "classe économique", economique_premium: "économique premium", affaires: "classe affaires", premiere: "première classe",
  tout_inclus: "tout-inclus", petit_hotel_intime: "petit hôtel intime", adultes_18plus: "resort adultes seulement", luxe: "hébergement de luxe",
  calme_intime: "ambiance calme et intime", animee_dynamique: "ambiance animée", familiale: "ambiance familiale", festive_party: "ambiance festive", style_club_med: "style Club Med", equilibre: "équilibre détente-animation",
};
const label = (key: string) => LABELS[key] ?? key.replace(/_/g, " ");

/** Fusionne les faits PERSISTANTS d'un TripBrief dans le profil client. */
export function mergeBriefIntoProfile(
  existing: ClientProfile | null,
  brief: TripBrief,
  now: string,
  options: { sourceSessionId?: string | null } = {},
): { profile: ClientProfile; changed: boolean } {
  const profile = existing && existing.version === 1 ? { ...existing } : createEmptyProfile(now);
  let changed = !existing;

  const push = (target: keyof Pick<ClientProfile, "contraintes_sante" | "restrictions_alimentaires" | "preferences" | "contexte_humain">, valeur: string | null, verbatim: string | null, confiance: number) => {
    if (!valeur || !valeur.trim()) return;
    const res = upsertFact(profile[target], {
      valeur: valeur.trim(),
      verbatim,
      confiance,
      maj: now,
      source_session_id: options.sourceSessionId ?? null,
    });
    profile[target] = res.list;
    if (res.changed) changed = true;
  };

  // Contraintes (le cœur — nourrit la vigie pour toujours)
  push("contraintes_sante", val(brief.contraintes.mobilite_sante), brief.contraintes.mobilite_sante.verbatim, brief.contraintes.mobilite_sante.confiance);
  push("restrictions_alimentaires", val(brief.contraintes.restrictions_alimentaires), brief.contraintes.restrictions_alimentaires.verbatim, brief.contraintes.restrictions_alimentaires.confiance);

  // Préférences persistantes (voyagent d'une rencontre à l'autre)
  const classe = val(brief.vols.classe);
  if (classe) push("preferences", `vol : ${label(String(classe))}`, brief.vols.classe.verbatim, brief.vols.classe.confiance);
  const compagnie = val(brief.vols.compagnie_preferee);
  if (compagnie) push("preferences", `compagnie préférée : ${compagnie}`, brief.vols.compagnie_preferee.verbatim, brief.vols.compagnie_preferee.confiance);
  const plage = val(brief.hebergement.preference_plage);
  if (plage) push("preferences", `plage : ${plage}`, brief.hebergement.preference_plage.verbatim, brief.hebergement.preference_plage.confiance);
  const piscine = val(brief.hebergement.preference_piscine);
  if (piscine) push("preferences", `piscine : ${piscine}`, brief.hebergement.preference_piscine.verbatim, brief.hebergement.preference_piscine.confiance);
  const hebergement = val(brief.hebergement.type_hebergement);
  if (hebergement) push("preferences", `hébergement : ${label(String(hebergement))}`, brief.hebergement.type_hebergement.verbatim, brief.hebergement.type_hebergement.confiance);
  const ambiance = val(brief.motivation.ambiance);
  if (ambiance) push("preferences", label(String(ambiance)), brief.motivation.ambiance.verbatim, brief.motivation.ambiance.confiance);

  // Contexte humain (sensible — sobre, jamais commercial)
  if (brief.notes_agent.statut === "capte") {
    push("contexte_humain", val(brief.notes_agent), brief.notes_agent.verbatim, brief.notes_agent.confiance);
  }

  if (changed) profile.maj = now;
  return { profile, changed };
}

/**
 * Bloc de mémoire autorisé pour l'extraction du brief courant.
 *
 * Le brief décrit ce qui est dit dans la rencontre actuelle. La mémoire ne doit
 * donc pas y injecter silencieusement une contrainte santé ou un contexte
 * personnel historique : ces faits appartiennent à la vigie et non à la vérité
 * de la conversation. Les préférences restantes servent uniquement de
 * continuité et sont explicitement marquées comme non copiables.
 */
export function buildKnownContext(profile: ClientProfile | null): string | null {
  if (!profile) return null;
  const parts: string[] = [];
  if (profile.preferences.length) {
    parts.push("Mémoire de continuité — ne pas copier dans le brief courant sans que le client le redise :");
    parts.push(`Préférences historiques : ${profile.preferences.map((f) => f.valeur).join(" ; ")}.`);
  }
  return parts.length ? parts.join("\n") : null;
}

/** Contraintes connues → la vigie (EN AVAL), sans re-verbalisation nécessaire. */
export function profileVigieConstraints(profile: ClientProfile | null): string[] {
  if (!profile) return [];
  return [...profile.contraintes_sante, ...profile.restrictions_alimentaires].map((f) => f.valeur);
}
