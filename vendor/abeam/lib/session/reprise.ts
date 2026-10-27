/**
 * LA RÈGLE DE FRAÎCHEUR D'UNE RENCONTRE (le filet) — UN seul jugement, lu par
 * l'écran ET par `/api/finalize`.
 *
 * Le défaut vécu le 2026-08-07 : l'onglet meurt à 94 s de rencontre, la ligne
 * reste `en_cours`, et l'agente recharge à 2 min. Sous le seuil de 3 min, donc
 * rien n'est marqué « interrompue » — aucun bouton n'apparaît (l'écran ne
 * proposait la reprise que sur `interrompue`/`traitement`/`transcrit`) et
 * `/api/finalize` refusait `en_cours` par principe, en conseillant un
 * rechargement qui, dans cette fenêtre-là, ne fait RIEN. Il fallait recharger
 * une SECONDE fois, plus tard, sans que rien ne le dise. Personne ne devine ça.
 *
 * Deux causes, et aucune des deux n'est la valeur du seuil :
 *  1. RIEN NE REJUGEAIT APRÈS LE CHARGEMENT. Le balayage de fraîcheur tournait
 *     une fois, à l'ouverture de la page : le temps ne passait pas dans l'écran.
 *  2. DEUX ENDROITS RÉPONDAIENT À LA MÊME QUESTION. L'écran tenait la règle des
 *     3 min, la route tenait un refus catégorique plus une règle des 5 min, et
 *     aucun des deux ne connaissait l'autre. Deux sources de vérité pour un
 *     seul jugement finissent toujours par diverger — ici en cul-de-sac.
 *
 * Le seuil, lui, PROTÈGE : une rencontre réellement vivante dans un autre
 * onglet ne doit jamais se faire piétiner. On ne le baisse pas et on ne rend
 * pas `en_cours` directement reprenable ; on rend l'attente FINIE, VISIBLE et
 * CHIFFRÉE, et on déplace l'arbitrage de la lecture vers l'écriture
 * (compare-and-swap SQL, voir `/api/finalize`).
 *
 * PUR et SANS AUCUNE DÉPENDANCE (même contrainte que `lib/live/reconnect.ts`) :
 * ce module s'importe depuis un composant client, depuis une route serverless
 * ET depuis un script `node` nu — d'où `pnpm check:reprise`, hors ligne.
 */

export const REPRISE = {
  /**
   * Une rencontre `en_cours` dont le battement dépasse ce seuil est un onglet
   * mort. Mesuré, pas choisi : `flushLiveSessionSnapshot` n'écrit que si
   * `Date.now() - liveFlushLastAtRef >= 60_000`, et ce test est évalué sur un
   * `setInterval` de 30 s (voir `travel-workspace.tsx`) — l'écart maximal entre
   * deux `updated_at` d'une rencontre BIEN VIVANTE est donc 60 + 30 = 90 s. Il
   * s'y ajoute une dérive d'horloge réelle : `updated_at` est écrit par le
   * NAVIGATEUR et comparé au `Date.now()` d'une AUTRE machine ; 30 s d'écart
   * entre deux portables non synchronisés est banal. 90 + 30 = 120 s de pire
   * cas mesurable, et 180 s laisse 1,5× de marge. Descendre à 120 s effacerait
   * la marge d'horloge ; descendre à 90 s tuerait une rencontre vivante dont le
   * battement vient juste de manquer un tour. C'est le nombre qui protège le
   * client assis en face.
   */
  STALE_EN_COURS_MS: 3 * 60_000,
  /**
   * Une sauvegarde `traitement` peut ne rien écrire pendant un batch long : la
   * transcription d'une longue rencontre tient plusieurs minutes sans une
   * ligne. Seuil GÉNÉREUX assumé — trop court, on casse une sauvegarde saine en
   * lui volant son fichier audio ; cinq minutes couvrent le pire batch observé
   * tout en gardant la reprise à portée de main.
   */
  TRAITEMENT_FRAIS_MS: 5 * 60_000,
  /**
   * Cadence de ré-évaluation côté écran, pour que l'attente se termine SEULE.
   * L'attente à couvrir vaut au plus 180 s : 15 s en représentent 8,3 %, donc
   * la latence ajoutée est invisible à côté du seuil qu'elle surveille.
   */
  RESWEEP_MS: 15_000,
} as const;

export type StatutSession = "en_cours" | "interrompue" | "traitement" | "transcrit" | "prete";

export type EtatReprise =
  /** Document complet : aucun badge, aucune alarme. */
  | { etat: "complete" }
  /** La rencontre de CET onglet : on n'y touche JAMAIS. */
  | { etat: "cet-onglet" }
  /** `en_cours` au battement frais → attendre, en le disant. */
  | { etat: "vivante"; resteMs: number }
  /** `en_cours` au battement périmé → écrire « interrompue » AVANT de reprendre. */
  | { etat: "a-marquer" }
  /** Un clic « Reprendre » sait finir celle-là. */
  | { etat: "reprenable" }
  /** Sauvegarde probablement encore en vol → attendre, en le disant. */
  | { etat: "en-traitement"; resteMs: number };

/**
 * Le jugement, à partir de ce que la ligne `sessions` dit d'elle-même.
 *
 * `updatedAtMs` accepte `null` ET `NaN` : la colonne est optionnelle par
 * contrat (base où la migration n'est pas passée) et une date illisible ne doit
 * pas se lire « fraîche ».
 *
 * POURQUOI « a-marquer » et « reprenable » sont DEUX états et pas un : une
 * rencontre `en_cours` ne devient jamais directement reprenable. Le passage
 * écrit par « interrompue » en base EST le jugement « cette rencontre est
 * morte » — il est daté, auditable, et visible par TOUS les onglets. Le
 * raccourci (ajouter `en_cours` à la liste des statuts reprenables) ferait
 * disparaître ce jugement, et avec lui la protection de la rencontre vivante.
 */
export function decideReprise(
  entree: { statut: StatutSession | string | null | undefined; updatedAtMs: number | null; estCetOnglet?: boolean },
  nowMs: number,
  reglages: { STALE_EN_COURS_MS: number; TRAITEMENT_FRAIS_MS: number } = REPRISE,
): EtatReprise {
  // AVANT tout le reste : l'onglet qui enregistre ne se déclare jamais mort
  // lui-même. C'était déjà la garde par id du chargement, remontée ici pour que
  // les deux appelants en héritent au lieu de la réécrire.
  if (entree.estCetOnglet === true) return { etat: "cet-onglet" };

  const statut = entree.statut;
  // Même doctrine que `sessionFromRow` : le pire risque est de ne PAS afficher
  // un badge, jamais d'en inventer un sur une session saine. Un statut inconnu
  // (colonne absente, valeur d'une version future) se lit donc « complète ».
  if (statut !== "en_cours" && statut !== "interrompue" && statut !== "traitement" && statut !== "transcrit") {
    return { etat: "complete" };
  }

  // `transcrit` est reprenable QUELLE QUE SOIT sa fraîcheur : la transcription
  // est déjà payée en crédits, l'étape qui reste ne coûte que l'extraction.
  if (statut === "interrompue" || statut === "transcrit") return { etat: "reprenable" };

  const battement = entree.updatedAtMs;
  const seuil = statut === "en_cours" ? reglages.STALE_EN_COURS_MS : reglages.TRAITEMENT_FRAIS_MS;

  if (battement === null || !Number.isFinite(battement)) {
    // Aucun battement du tout : ligne d'avant le chantier, ou écriture jamais
    // atterrie. Pour `en_cours`, c'est le comportement du chargement sur NaN,
    // conservé tel quel ; pour `traitement`, celui de la route, qui ne bloquait
    // que sur un battement fini.
    return statut === "en_cours" ? { etat: "a-marquer" } : { etat: "reprenable" };
  }

  const age = nowMs - battement;
  // Horloge de l'AUTRE poste EN AVANCE : on ne tue jamais une rencontre à cause
  // d'une horloge. L'erreur se paie toujours du côté prudent — l'attente.
  if (age < 0) {
    return statut === "en_cours" ? { etat: "vivante", resteMs: seuil } : { etat: "en-traitement", resteMs: seuil };
  }
  // Borne STRICTE : à `age === seuil` exactement, on est encore vivante avec
  // `resteMs === 0`. Le banc épingle les deux côtés pour qu'un refactor ne la
  // déplace pas en silence.
  if (age > seuil) return { etat: statut === "en_cours" ? "a-marquer" : "reprenable" };
  return statut === "en_cours"
    ? { etat: "vivante", resteMs: seuil - age }
    : { etat: "en-traitement", resteMs: seuil - age };
}
