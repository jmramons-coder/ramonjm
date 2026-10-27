/**
 * LE FEED LIVE — identité, contenu, mise à jour. Logique PURE, testée hors
 * ligne par `pnpm check:livefeed`.
 *
 * Le défaut qu'elle corrige (rencontre réelle du 2026-08-06) : le fondateur a
 * ajouté des voyageurs en cours de rencontre. La chaîne a fait son travail —
 * le trigger-scan a capté `adultes`, `briefSearchKey` a changé, les recherches
 * SerpAPI sont reparties, les vols sont revenus avec les prix pour quatre.
 * Puis le feed a JETÉ la carte : l'ancienne signature était
 * `[type, titre, sousTitre, items.map(titre)]` — mêmes compagnies aériennes,
 * même trajet, donc signature identique. Les PRIX, eux, n'y étaient pas. Une
 * carte calculée, payée, et jetée en silence.
 *
 * Et ce n'était pas un oubli : §3 dit « même destination/hôtel → on MET À JOUR
 * la carte existante (nouvelles dates → nouveaux prix), on n'empile pas ». Le
 * code ne connaissait que deux issues — empiler ou jeter. Jamais mettre à jour.
 *
 * ─── La correction : séparer l'IDENTITÉ du CONTENU ───────────────────────────
 *
 *   identité = de quoi cette carte parle   → décide « même carte ou pas »
 *   contenu  = ce que l'écran montre       → décide « est-ce que ça a bougé »
 *
 * Trois cas, trois comportements :
 *   • identité inconnue                → carte NEUVE, elle se pose en tête ;
 *   • identité connue, contenu égal     → on ne touche à rien, elle ne bouge
 *                                         même pas de place (pas de faux
 *                                         « ça a changé », c'est ça, le calme) ;
 *   • identité connue, contenu différent → MISE À JOUR EN PLACE : une seule
 *                                         carte (jamais un doublon empilé),
 *                                         qui garde son `id`, remonte EN TÊTE
 *                                         et porte une marque de fraîcheur.
 *
 * Pourquoi remonter en tête ET marquer, alors que §3 dit seulement « mettre à
 * jour » : parce que les deux exigences ne se contredisent pas, elles se
 * complètent. §3 interdit le doublon ; la 3ᵉ loi (temps réel) et le feed
 * « vivant » exigé par le fondateur veulent qu'un changement se VOIE. Mettre à
 * jour en silence une carte posée quatrième, sous la ligne de flottaison,
 * c'est exactement l'échec que la 4ᵉ loi nomme : le fondateur a agi, le
 * produit a répondu, et l'écran n'a rien dit. La carte remonte donc là où il
 * regarde, et la marque lui dit pourquoi elle a bougé — sinon « en tête » se
 * confondrait avec « nouvelle ».
 *
 * Contrainte dure qui en découle : AUCUNE carte dont le contenu a changé ne
 * disparaît en silence. Comme toute carte modifiée remonte en tête, le
 * plafond du feed ne peut jamais l'écarter.
 */

import type { SuggestionCard } from "../suggestions/engine.ts";

/** Le feed reste court : c'est un feed curé (§3), pas un mur de résultats. */
export const FEED_MAX = 8;

export type LiveFeedCard = SuggestionCard & {
  /** ISO — posé quand une carte DÉJÀ au feed voit son contenu changer. */
  majAt?: string;
  /** Nombre de mises à jour subies depuis son arrivée. */
  majCount?: number;
};

function norm(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * DE QUOI CETTE CARTE PARLE — son sujet, pas son état.
 *
 * `titre` porte le sujet dans toutes les cartes du moteur : « Club Med Michès
 * — Michès, Punta Cana » pour un hôtel, « Vols YUL → Punta Cana » pour un vol.
 * Ce qui bouge d'une recherche à l'autre — dates, nombre d'adultes, prix,
 * badge — vit dans `sousTitre`, `badge` et `items`, donc DEHORS : c'est
 * précisément ce qui permet à une même carte d'être mise à jour au lieu d'être
 * empilée quand le client change d'avis.
 *
 * Repli sur `sousTitre` pour les cartes sans titre (`info`, promues au feed par
 * l'agente) : sans lui, toutes les réponses promues se confondraient en une.
 */
export function cardIdentity(card: SuggestionCard): string {
  const sujet = norm(card.titre) || norm(card.sousTitre ?? "") || card.id;
  return `${card.type}::${sujet}`;
}

/**
 * CE QUE L'ÉCRAN MONTRE — tout ce dont un changement mérite d'être vu.
 *
 * Les PRIX en font partie : c'est leur absence qui a fait jeter la carte du
 * fondateur. Les URL d'images, non : Google les resigne d'un appel à l'autre,
 * les inclure ferait clignoter « mis à jour » sur des cartes strictement
 * identiques — soit exactement le churn qu'on cherche à éviter. Une photo qui
 * change sans qu'aucun texte ne change n'est pas une information.
 */
export function cardContentHash(card: SuggestionCard): string {
  return JSON.stringify([
    card.titre,
    card.sousTitre ?? "",
    card.badge ?? "",
    card.extraits ?? [],
    card.source,
    card.items.map((item) => [item.titre, item.detail ?? "", item.prix ?? "", item.note ?? "", item.lien ?? ""]),
  ]);
}

/**
 * Fusion du feed live. `previous` = ce qui est à l'écran, `incoming` = ce que
 * la recherche vient de rendre.
 */
export function mergeLiveCards(
  previous: LiveFeedCard[],
  incoming: SuggestionCard[],
  now: Date = new Date(),
): LiveFeedCard[] {
  const horodatage = now.toISOString();
  const restantes = [...previous];
  // Tout ce que ce tour a touché — neuf comme mis à jour — monte en tête, dans
  // l'ordre de priorité rendu par le moteur (vigie d'abord, §3).
  const touchees: LiveFeedCard[] = [];

  incoming.forEach((card, index) => {
    const identite = cardIdentity(card);
    const position = restantes.findIndex((existante) => cardIdentity(existante) === identite);

    if (position === -1) {
      touchees.push({ ...card, id: `${card.id}-${now.getTime()}-${index}` });
      return;
    }

    const ancienne = restantes[position];
    if (cardContentHash(ancienne) === cardContentHash(card)) return; // rien n'a bougé : elle reste où elle est

    restantes.splice(position, 1);
    touchees.push({
      ...card,
      id: ancienne.id, // la carte n'est pas remplacée, elle est corrigée
      majAt: horodatage,
      majCount: (ancienne.majCount ?? 0) + 1,
    });
  });

  return [...touchees, ...restantes].slice(0, FEED_MAX);
}
