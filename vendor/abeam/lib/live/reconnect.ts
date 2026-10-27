/**
 * POLITIQUE DE RECONNEXION du streaming AssemblyAI (le filet, tranche D).
 *
 * Le défaut qu'elle corrige : une fermeture du WebSocket en pleine rencontre
 * n'avait que deux issues, toutes deux définitives — `error` dégradait vers la
 * reconnaissance du navigateur (sans diarisation, sans keyterms) pour tout le
 * reste de la rencontre, et `closed` n'était PAS géré du tout : la
 * transcription live mourait en silence, micro toujours ouvert, agente pas
 * prévenue. Un blip réseau de deux secondes coûtait quarante minutes de
 * qualité.
 *
 * La politique, volontairement simple :
 *  · une connexion qui tombe se retente jusqu'à 3 fois (1 s, 3 s, 8 s) avec un
 *    jeton FRAIS à chaque fois (le jeton streaming est à usage unique) ;
 *  · une connexion restée STABLE ≥ 30 s efface l'ardoise avant de compter la
 *    chute : trois incidents espacés dans l'heure sont trois incidents, pas
 *    une panne — seules les chutes en RAFALE épuisent le compteur ;
 *  · l'abandon bascule vers la reconnaissance du navigateur, EN LE DISANT
 *    (loi 4 : l'échec se dit) — et le document officiel restera complet, la
 *    transcription batch de la sauvegarde ne dépend pas du live.
 *
 * Limite assumée : une reconnexion ouvre une NOUVELLE session AssemblyAI, dont
 * les étiquettes de voix repartent à zéro — l'heuristique « premier locuteur =
 * Advisor » peut se tromper sur le segment reconnecté. Le batch de la
 * sauvegarde ré-infère les rôles sur l'enregistrement entier et corrige.
 *
 * Logique PURE, sans dépendance : testée hors ligne par `pnpm check:reconnexion`.
 */

export const RECONNEXION = {
  /** Chutes en rafale tolérées avant d'abandonner vers le navigateur. */
  TENTATIVES_MAX: 3,
  /** Délais avant chaque tentative, dans l'ordre. */
  DELAIS_MS: [1_000, 3_000, 8_000],
  /** Une connexion tenue aussi longtemps est « stable » : l'ardoise s'efface. */
  STABLE_MS: 30_000,
} as const;

export type EtatReconnexion = {
  /** Tentatives consommées dans la rafale en cours. */
  tentatives: number;
  /** Dernière ouverture réussie (`null` = aucune connexion en vie). */
  ouverteAt: number | null;
};

export const RECONNEXION_VIERGE: EtatReconnexion = { tentatives: 0, ouverteAt: null };

export type DecisionReconnexion =
  | { action: "retenter"; delaiMs: number; etat: EtatReconnexion }
  | { action: "abandonner"; etat: EtatReconnexion };

/** La connexion vient de s'ouvrir : on note QUAND, la stabilité se jugera à la chute. */
export function marquerOuverte(etat: EtatReconnexion, now: number): EtatReconnexion {
  return { ...etat, ouverteAt: now };
}

/**
 * La connexion vient de tomber (`error` OU `closed` — les deux se traitent
 * pareil : le flux n'existe plus). Décide de la suite.
 */
export function decideReconnexion(
  etat: EtatReconnexion,
  now: number,
  reglages: { TENTATIVES_MAX: number; DELAIS_MS: readonly number[]; STABLE_MS: number } = RECONNEXION,
): DecisionReconnexion {
  // La stabilité s'évalue AVANT de compter cette chute : une connexion qui a
  // tenu 30 s a prouvé que le chemin fonctionne, la rafale précédente ne la
  // concerne plus.
  const stable = etat.ouverteAt !== null && now - etat.ouverteAt >= reglages.STABLE_MS;
  const tentatives = stable ? 0 : etat.tentatives;

  if (tentatives >= reglages.TENTATIVES_MAX) {
    return { action: "abandonner", etat: { tentatives, ouverteAt: null } };
  }

  return {
    action: "retenter",
    delaiMs: reglages.DELAIS_MS[Math.min(tentatives, reglages.DELAIS_MS.length - 1)],
    etat: { tentatives: tentatives + 1, ouverteAt: null },
  };
}
