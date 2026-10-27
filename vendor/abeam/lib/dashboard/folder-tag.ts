import type { TripBrief } from "../extraction/trip-brief";

const GROUP_LABELS = {
  solo: { fr: "Solo", en: "Solo" },
  couple: { fr: "Couple", en: "Couple" },
  famille: { fr: "Famille", en: "Family" },
  groupe: { fr: "Groupe", en: "Group" },
} as const;

/** Only a captured group qualifies: traveler counts and uncertain deductions do not. */
export function folderGroupTag(brief: TripBrief | null, language: "fr" | "en"): string | null {
  const group = brief?.voyageurs?.type_groupe;
  if (!group?.valeur || group.statut !== "capte" || !Object.hasOwn(GROUP_LABELS, group.valeur)) return null;
  return GROUP_LABELS[group.valeur][language];
}
