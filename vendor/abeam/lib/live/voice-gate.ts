/**
 * PORTE D'ÉNERGIE — le silence ne sort pas de la pièce.
 *
 * Le défaut qu'elle corrige (rencontre réelle du 2026-08-06) : AssemblyAI a
 * rendu un tour de parole que le fondateur n'a JAMAIS prononcé — une phrase
 * anglaise fluide et cohérente, fabriquée sur du silence de pièce, étiquetée
 * « Client » par notre diarisation sémantique. C'est le mode d'échec connu des
 * modèles séquence-à-séquence sur du non-parlé : à qui on donne du bruit, un
 * modèle génératif rend du langage.
 *
 * La parade la plus directe n'est pas un filtre en aval : c'est de **ne pas
 * envoyer le silence**. Un modèle qui ne reçoit pas de silence n'hallucine pas
 * dessus. Cette porte s'intercale entre l'AudioWorklet et le WebSocket.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TROIS CONTRAINTES QUI DESSINENT LA CONCEPTION
 *
 * ① **Un faux négatif coûte une vraie phrase du client.** Une porte qui coupe
 *    trop tôt perd un chuchotement, et une phrase perdue est un mal pire qu'une
 *    phrase inventée qu'on rattrapera en aval. D'où : seuil bas, **pré-roll**
 *    (on garde les 400 ms qui précèdent l'ouverture, sinon on décapite la
 *    première syllabe) et **hystérésis** (une fois ouverte, la porte se ferme
 *    plus tard qu'elle ne s'est ouverte).
 *
 * ② **Le silence est ce qui FINALISE les tours.** AssemblyAI détecte la fin de
 *    tour sur le silence (`max_turn_silence`, 768 ms quand `speaker_labels` est
 *    actif, 1536 ms sinon). Une porte qui coupe le son dès le dernier mot
 *    priverait le moteur du silence dont il a besoin, et le tour ne se
 *    finaliserait JAMAIS — c'est exactement le défaut ② qu'on corrige par
 *    ailleurs. D'où le **hangover** de 2,5 s : après la dernière parole on
 *    continue d'envoyer, largement de quoi laisser le moteur fermer son tour.
 *    Ce n'est qu'ENSUITE que la pièce se tait pour de bon.
 *
 * ③ **Le seuil ne peut pas être une constante inventée.** Il est double :
 *    un plancher absolu MESURÉ (voir ci-dessous) et un plancher ADAPTATIF suivi
 *    en continu sur le bruit de la pièce, le plus haut des deux gagnant.
 *    Une pièce silencieuse n'impose que le plancher absolu ; une pièce
 *    ventilée relève la barre d'elle-même.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * COMMENT LE SEUIL ABSOLU A ÉTÉ MESURÉ (hors ligne, sans micro ni crédits)
 *
 * Deux phrases françaises du domaine synthétisées en PCM16 16 kHz mono (voix
 * `Amelie` et `Thomas`), découpées en trames de 100 ms — la trame EXACTE que
 * notre AudioWorklet envoie — puis atténuées pour simuler la parole douce, le
 * chuchotement et le chuchotement lointain. RMS par trame, en dBFS :
 *
 *   voix pleine (0 dB)              médiane −15,0   p10 −35,5
 *   voix douce (−12 dB)             médiane −27,0   p10 −47,5
 *   chuchotement (−20 dB)           médiane −34,8   p10 −52,8
 *   chuchotement lointain (−26 dB)  médiane −40,8   p10 −58,5
 *
 *   bruit de pièce très calme        −70 dBFS
 *   bureau calme                     −60 dBFS
 *   bureau bruyant / ventilation     −50 à −45 dBFS
 *
 * À −50 dBFS, 86 % des trames d'un chuchotement et 78 % des trames d'un
 * chuchotement lointain passent, alors qu'un bureau calme (−60 dBFS) reste 10 dB
 * en dessous. Et il suffit d'UNE trame au-dessus du seuil pour ouvrir la porte :
 * le pré-roll et le hangover se chargent du reste de la phrase. C'est pour ça
 * que la comparaison qui compte est « médiane de la parole vs plancher de la
 * pièce », pas « toutes les trames de parole au-dessus du seuil » (les 8 % de
 * trames sous le seuil dans la voix pleine sont les blancs entre les mots).
 *
 * Le plancher adaptatif est plafonné à −50 dBFS : même dans une pièce très
 * bruyante, le seuil effectif ne monte jamais au-dessus de −42 dBFS, ce qui
 * reste sous la médiane d'un chuchotement (−34,8). On refuse de laisser le
 * bruit ambiant nous faire jeter une vraie phrase.
 *
 * `getUserMedia` tourne déjà avec `noiseSuppression` et `autoGainControl`
 * (`travel-workspace.tsx`), ce qui abaisse le plancher et remonte la parole
 * faible : les marges ci-dessus sont donc pessimistes, pas optimistes.
 *
 * Logique PURE et sans dépendance : testée hors ligne par `pnpm check:sttgarde`.
 */

/** Trame de l'AudioWorklet : 1600 échantillons à 16 kHz = 100 ms. */
export const TRAME_MS = 100;

export const PORTE_ENERGIE = {
  /** Plancher absolu mesuré (voir l'en-tête). Sous ça, ce n'est pas de la parole. */
  SEUIL_ABSOLU_DBFS: -50,
  /** Marge au-dessus du bruit de la pièce pour qu'une trame compte comme parole. */
  MARGE_PLANCHER_DB: 8,
  /** Hystérésis : une fois la porte ouverte, on reste ouvert 6 dB plus bas. */
  HYSTERESIS_DB: 6,
  /**
   * Plafond du plancher adaptatif. Une pièce bruyante ne doit jamais pouvoir
   * pousser le seuil effectif au-dessus de −42 dBFS (= plafond + marge).
   */
  PLANCHER_MAX_DBFS: -50,
  /** Le plancher ne descend pas sous ça (évite un −∞ sur du numérique muet). */
  PLANCHER_MIN_DBFS: -95,
  /** Descente rapide du plancher : la pièce devient silencieuse, on le suit. */
  PLANCHER_DESCENTE_DB_PAR_TRAME: 3,
  /** Remontée lente : 0,5 dB/s — la parole ne doit pas s'auto-masquer. */
  PLANCHER_MONTEE_DB_PAR_TRAME: 0.05,
  /** Trames conservées avant l'ouverture (400 ms) : la première syllabe survit. */
  PREROLL_TRAMES: 4,
  /**
   * On continue d'émettre 2,5 s après la dernière parole. Doit rester
   * confortablement au-dessus de `max_turn_silence` (768 ms avec
   * `speaker_labels`, 1536 ms sinon) — sinon les tours ne se finalisent plus.
   */
  HANGOVER_MS: 2_500,
} as const;

/** Énergie RMS d'une trame PCM16, en dBFS. `-Infinity` sur du silence numérique. */
export function rmsDbfs(frame: Int16Array): number {
  if (frame.length === 0) return Number.NEGATIVE_INFINITY;
  let somme = 0;
  for (let i = 0; i < frame.length; i += 1) {
    const s = frame[i] / 32768;
    somme += s * s;
  }
  const rms = Math.sqrt(somme / frame.length);
  return rms > 0 ? 20 * Math.log10(rms) : Number.NEGATIVE_INFINITY;
}

export type DecisionTrame = {
  /**
   * Les trames à transmettre MAINTENANT : la trame courante précédée, à
   * l'ouverture, du pré-roll retenu. Vide quand la porte est fermée.
   */
  aEmettre: Int16Array[];
  /** Cette trame porte-t-elle de la parole ? (au sens du seuil, pas du hangover) */
  parole: boolean;
  /** Porte ouverte (parole OU hangover) : c'est ce qui décide de l'émission. */
  ouverte: boolean;
  dbfs: number;
  plancherDbfs: number;
  seuilDbfs: number;
};

export type PorteEnergie = {
  pousser: (frame: Int16Array, nowMs: number) => DecisionTrame;
  /** Y a-t-il eu de la PAROLE dans les `fenetreMs` dernières millisecondes ? */
  paroleRecente: (nowMs: number, fenetreMs: number) => boolean;
  /** Horodatage de la dernière trame de parole (`null` si jamais). */
  derniereParoleAt: () => number | null;
  /** Diagnostic (bancs, journalisation) — jamais affiché à l'agent. */
  bilan: () => { tramesVues: number; tramesEmises: number; plancherDbfs: number };
};

/**
 * Crée une porte. Un état par session de streaming : le plancher de bruit
 * appartient à la pièce, pas au processus.
 */
export function creerPorteEnergie(reglages: Partial<typeof PORTE_ENERGIE> = {}): PorteEnergie {
  const R = { ...PORTE_ENERGIE, ...reglages };

  let plancher: number = R.PLANCHER_MAX_DBFS;
  let plancherAmorce = false;
  let ouverte = false;
  let derniereParole: number | null = null;
  let tramesVues = 0;
  let tramesEmises = 0;
  const preroll: Int16Array[] = [];

  return {
    pousser(frame, nowMs) {
      tramesVues += 1;
      const dbfs = rmsDbfs(frame);

      // ── Plancher de bruit : descente rapide, remontée lente, bornée des deux
      // côtés. Sur la toute première trame on s'amorce dessus pour ne pas
      // passer les premières secondes à croire la pièce plus calme qu'elle
      // n'est (ou l'inverse).
      const dbfsBorne = Number.isFinite(dbfs) ? dbfs : R.PLANCHER_MIN_DBFS;
      if (!plancherAmorce) {
        plancher = dbfsBorne;
        plancherAmorce = true;
      } else if (dbfsBorne < plancher) {
        plancher = Math.max(dbfsBorne, plancher - R.PLANCHER_DESCENTE_DB_PAR_TRAME);
      } else {
        plancher = Math.min(dbfsBorne, plancher + R.PLANCHER_MONTEE_DB_PAR_TRAME);
      }
      plancher = Math.min(R.PLANCHER_MAX_DBFS, Math.max(R.PLANCHER_MIN_DBFS, plancher));

      // ── Seuil effectif : le plus exigeant du plancher absolu mesuré et du
      // bruit réel de la pièce. Hystérésis une fois la porte ouverte.
      const seuilOuverture = Math.max(R.SEUIL_ABSOLU_DBFS, plancher + R.MARGE_PLANCHER_DB);
      const seuil = ouverte ? seuilOuverture - R.HYSTERESIS_DB : seuilOuverture;
      const parole = dbfs > seuil;

      if (parole) derniereParole = nowMs;
      const dansHangover = derniereParole !== null && nowMs - derniereParole < R.HANGOVER_MS;
      const etaitOuverte = ouverte;
      ouverte = parole || dansHangover;

      const aEmettre: Int16Array[] = [];
      if (ouverte) {
        // Ouverture : on recrache d'abord le pré-roll retenu — la première
        // syllabe d'un « Cassis » chuchoté est précisément ce qu'on ne veut
        // pas perdre.
        if (!etaitOuverte && preroll.length > 0) aEmettre.push(...preroll.splice(0, preroll.length));
        aEmettre.push(frame);
      } else {
        preroll.push(frame);
        while (preroll.length > R.PREROLL_TRAMES) preroll.shift();
      }
      tramesEmises += aEmettre.length;

      return { aEmettre, parole, ouverte, dbfs, plancherDbfs: plancher, seuilDbfs: seuil };
    },
    paroleRecente(nowMs, fenetreMs) {
      return derniereParole !== null && nowMs - derniereParole <= fenetreMs;
    },
    derniereParoleAt: () => derniereParole,
    bilan: () => ({ tramesVues, tramesEmises, plancherDbfs: plancher }),
  };
}
