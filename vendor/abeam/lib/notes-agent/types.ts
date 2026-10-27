/**
 * NOTES AGENT — le contrat du récap interne affiché dans le review.
 *
 * Ce que José appelait « les notes guidées pour l'agent ». C'est le LIVRABLE
 * HUMAIN du brief : de la prose française, pas le schéma. Le `TripBrief` reste
 * la représentation interne (gates, vigie, fusion, ancres) et ne s'affiche
 * jamais — loi 9 du design sheet, §6.1bis.
 *
 * Ne pas confondre avec ses deux voisins :
 *   · `lib/extraction/recap-prompt.ts` → le COURRIEL au client (chaleureux, vouvoiement).
 *   · `lib/passes/prompts.ts` fiche-soumission → un livrable À LA DEMANDE, listé
 *     pour monter une soumission.
 *   · ici → l'écran par défaut : ce qui s'est dit, lisible d'un coup d'œil.
 */

/**
 * Une affirmation du récap, avec les champs du TripBrief dont elle est tirée.
 *
 * `champs` est le mécanisme de PROVENANCE : l'ancre ⟨mm:ss⟩ affichée sous la
 * phrase n'est jamais produite par le modèle, elle est HÉRITÉE du `ancre_ms`
 * des champs cités (dérivé, lui, du verbatim retrouvé dans les utterances).
 * C'est ce qui permet de retirer le schéma de l'écran sans perdre la
 * vérifiabilité : la couche structurée passe dessous, elle ne disparaît pas.
 *
 * Une affirmation qui ne peut citer aucun champ ne doit pas être écrite.
 */
export type NotesClaim = {
  texte: string;
  /** Chemins de champs, ex. "temps.depart", "lieu.destinations". Liste fermée. */
  champs: string[];
};

export type NotesAgent = {
  version: string;
  /** Une phrase qui situe le projet. Pas un slogan, pas un titre de brochure. */
  titre: string;
  /**
   * Le cadre de lecture quand il change tout : « Première prise de contact »,
   * « Simple demande de prix ». `null` quand la conversation est une
   * planification ordinaire et que le cadre n'apprend rien.
   */
  cadre: string | null;
  /** 2 à 4 affirmations : ce qui s'est dit. */
  resume: NotesClaim[];
  /** 0 à 4 : ce qui compte pour eux (préférences, motivation, ambiance). */
  ce_qui_compte: NotesClaim[];
  /** 0 à 4 : contraintes — santé/mobilité, restrictions, à éviter, dates fixes. */
  contraintes: NotesClaim[];
  /**
   * 0 à 5 phrases à dire à un humain (« Confirmer les dates exactes de
   * départ »). Jamais un nom de champ, jamais une question posée à l'IA.
   */
  a_clarifier: string[];
  /** 0 à 4 actions concrètes pour l'agente. */
  prochaines_etapes: string[];
};
