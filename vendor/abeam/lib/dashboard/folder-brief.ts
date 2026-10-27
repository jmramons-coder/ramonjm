import { budgetValide, type DateFloue, type Field, type TripBrief } from "../extraction/trip-brief.ts";
import type { UILanguage } from "../ui/language.ts";

export type FolderBriefLegacy = {
  travelers?: string;
  dates?: string;
  budget?: string;
  preferences?: string[];
};

export type FolderBriefNarrative = {
  paragraphs: string[];
  unconfirmed: boolean;
  historical: boolean;
};

const OCCASIONS = {
  lune_de_miel: ["une lune de miel", "a honeymoon"],
  anniversaire_couple: ["un anniversaire de couple", "a couple’s anniversary"],
  anniversaire_age: ["un anniversaire", "a birthday"],
  retraite: ["un départ à la retraite", "a retirement"],
  celebration_diverse: ["une célébration", "a celebration"],
  graduation: ["une remise de diplôme", "a graduation"],
} as const;

const TRIP_TYPES = {
  forfait_soleil: ["un forfait soleil", "a sun holiday package"],
  croisiere: ["une croisière", "a cruise"],
  forfait_circuit_europe: ["un circuit en Europe", "a European tour"],
  long_sejour: ["un long séjour", "an extended stay"],
  hotel_seulement: ["un séjour à l’hôtel", "a hotel stay"],
  a_la_carte: ["un voyage à la carte", "a tailor-made trip"],
  groupe_agence: ["un voyage de groupe", "a group trip"],
  vol_seul: ["un vol", "a flight"],
  luxe_haut_de_gamme: ["un voyage haut de gamme", "a luxury trip"],
  disney: ["un voyage Disney", "a Disney trip"],
  indecis: ["", ""],
  autre: ["", ""],
} as const;

const STAYS = {
  tout_inclus: ["un tout-inclus", "an all-inclusive stay"],
  petit_hotel_intime: ["un petit hôtel intime", "a small, intimate hotel"],
  grand_complexe: ["un grand complexe", "a large resort"],
  adultes_18plus: ["un hébergement réservé aux adultes", "adults-only accommodation"],
  familial: ["un hébergement familial", "family-friendly accommodation"],
  luxe: ["un hébergement de luxe", "luxury accommodation"],
  bon_rapport_qualite_prix: ["un bon rapport qualité-prix", "good value for money"],
  local_authentique: ["un hébergement local et authentique", "local, authentic accommodation"],
  activites_plus: ["un hébergement avec des activités", "accommodation with activities"],
  appart_hotel: ["un appart-hôtel", "an apartment hotel"],
  petit_navire: ["un petit navire", "a small ship"],
  moyen_navire: ["un navire de taille moyenne", "a mid-sized ship"],
  grand_navire: ["un grand navire", "a large ship"],
} as const;

const MOTIVATIONS = {
  safari: ["un safari", "a safari"], ski: ["le ski", "skiing"], golf: ["le golf", "golf"],
  plongee: ["la plongée", "diving"], spectacles_nature: ["la nature", "nature"],
  aventure_plein_air: ["l’aventure en plein air", "outdoor adventure"], expedition_polaire: ["une expédition polaire", "a polar expedition"],
  culture_patrimoine: ["la culture et le patrimoine", "culture and heritage"], gastronomie_vins: ["la gastronomie et le vin", "food and wine"],
  bien_etre_spa: ["le bien-être", "wellness"], festif_vie_nocturne: ["la vie nocturne", "nightlife"],
  immersif_hors_sentiers: ["des découvertes hors des sentiers battus", "experiences off the beaten path"],
  repos_deconnexion: ["le repos et la déconnexion", "rest and time to disconnect"], romance_lune_de_miel: ["du temps en amoureux", "time together as a couple"],
  voyage_famille: ["du temps en famille", "family time"],
} as const;

const AMBIANCES = {
  animee_dynamique: ["une ambiance animée", "a lively atmosphere"],
  calme_intime: ["une ambiance calme et intime", "a quiet, intimate atmosphere"],
  familiale: ["une ambiance familiale", "a family atmosphere"],
  festive_party: ["une ambiance festive", "a party atmosphere"],
  style_club_med: ["une ambiance de type Club Med", "a Club Med-style atmosphere"],
  equilibre: ["une ambiance équilibrée", "a balanced atmosphere"],
} as const;

function captured<T>(field: Field<T> | undefined): T | null {
  return field?.statut === "capte" ? field.valeur : null;
}

function clean(value: string | null | undefined): string | null {
  return value?.replace(/\s+/g, " ").trim() || null;
}

function quote(value: string, language: UILanguage): string {
  return language === "fr" ? `« ${value} »` : `“${value}”`;
}

function join(values: string[], language: UILanguage): string {
  return new Intl.ListFormat(language === "fr" ? "fr-CA" : "en-CA", { style: "long", type: "conjunction" }).format(values);
}

function strings(field: Field<string[]> | undefined): string[] {
  return [...new Set((captured(field) ?? []).map(clean).filter((value): value is string => Boolean(value)))];
}

function validDay(value: string): Date | null {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!parts) return null;
  const [year, month, day] = parts.slice(1).map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

function dateText(field: DateFloue, language: UILanguage): { text: string; kind: "day" | "month" | "raw"; date?: Date } | null {
  if (field.statut !== "capte") return null;
  const value = clean(field.valeur);
  const locale = language === "fr" ? "fr-CA" : "en-CA";
  const day = value && field.precision === "jour" ? validDay(value) : null;
  if (day) return { text: new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(day), kind: "day", date: day };
  const month = value && field.precision === "mois" ? /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(value) : null;
  if (month && Number(month[2]) >= 1 && Number(month[2]) <= 12) {
    const date = new Date(0);
    date.setUTCFullYear(Number(month[1]), Number(month[2]) - 1, 1);
    return { text: new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(date), kind: "month" };
  }
  const raw = clean(field.verbatim) ?? (value && !/^\d{4}-/.test(value) ? value : null);
  return raw ? { text: quote(raw, language), kind: "raw" } : null;
}

function peopleSentence(brief: TripBrief, language: UILanguage): string | null {
  const fr = language === "fr";
  const adults = captured(brief.voyageurs.adultes);
  const ages = captured(brief.voyageurs.enfants_ages);
  const people: string[] = [];
  if (typeof adults === "number" && Number.isSafeInteger(adults) && adults > 0) people.push(`${adults} ${fr ? adults === 1 ? "adulte" : "adultes" : adults === 1 ? "adult" : "adults"}`);
  if (ages?.length && ages.every((age) => Number.isFinite(age) && age >= 0)) people.push(`${ages.length} ${fr ? ages.length === 1 ? "enfant" : "enfants" : ages.length === 1 ? "child" : "children"}`);
  if (people.length) return fr ? `Le voyage concerne ${join(people, language)}.` : `The trip is for ${join(people, language)}.`;
  const composition = clean(captured(brief.voyageurs.composition));
  if (composition) return fr ? `Le groupe est décrit ainsi : ${quote(composition, language)}.` : `The group is described as ${quote(composition, language)}.`;
  const group = captured(brief.voyageurs.type_groupe);
  const labels = { solo: ["en solo", "solo"], couple: ["en couple", "as a couple"], famille: ["en famille", "as a family"], groupe: ["en groupe", "as a group"] } as const;
  if (group) return fr ? `Le voyage est envisagé ${labels[group][0]}.` : `The trip is being considered ${labels[group][1]}.`;
  return null;
}

function legacyText(value: string | undefined): string | null {
  const text = clean(value);
  if (!text) return null;
  const plain = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/^(?:[-—–]|n\/a|unknown|not (?:confirmed|specified|provided)|to be confirmed|to clarify|a (?:confirmer|preciser)|non (?:confirme|renseigne))$/.test(plain)) return null;
  if (/^(?:0|12345)(?:[.,]00)?(?:\$)?(?:cad|dollars(?:canadiens)?)?$/.test(plain.replace(/\s/g, ""))) return null;
  if (/^(?:review the transcript and confirm|relire la transcription et confirmer|no constraints captured|aucune contrainte captee|confirm context, timing|confirmer le contexte, les dates|complete the conversation context|completer le contexte de la conversation|prepare the first tailored|preparer les premieres etapes)/.test(plain)) return null;
  return text;
}

/** Presentation only: captures are described, unknowns never completed or promoted. */
export function folderBriefNarrative(brief: TripBrief | null, language: UILanguage, legacy?: FolderBriefLegacy | null): FolderBriefNarrative {
  const fr = language === "fr";
  const index = fr ? 0 : 1;
  const paragraphs: string[] = [];
  let unconfirmed = false;
  if (brief) {
    const relevant = [brief.lieu.destinations, brief.voyageurs.adultes, brief.voyageurs.enfants_ages, brief.voyageurs.type_groupe, brief.voyageurs.composition, brief.temps.depart, brief.temps.retour, brief.temps.duree, brief.budget.total, brief.budget.par_personne, brief.type_voyage.type, brief.hebergement.type_hebergement, brief.hebergement.preference_plage, brief.hebergement.preference_piscine, brief.hebergement.localisation, brief.motivation.occasion, brief.motivation.occasion_details, brief.motivation.motivations, brief.motivation.ambiance, brief.services.elements_importants, brief.services.services_importants, brief.services.elements_a_eviter, brief.contraintes.mobilite_sante, brief.contraintes.restrictions_alimentaires];
    unconfirmed = relevant.some((field) => field.statut === "incertain" || field.statut === "contradiction");
    const destinations = strings(brief.lieu.destinations);
    const occasion = captured(brief.motivation.occasion);
    const type = captured(brief.type_voyage.type);
    const project: string[] = [];
    if (occasion) project.push(fr ? `Un voyage pour ${OCCASIONS[occasion][index]}` : `A trip for ${OCCASIONS[occasion][index]}`);
    else if (type && TRIP_TYPES[type][index]) project.push(fr ? `Le projet porte sur ${TRIP_TYPES[type][index]}` : `The plan is for ${TRIP_TYPES[type][index]}`);
    if (destinations.length) {
      const names = join(destinations.map((value) => quote(value, language)), language);
      const where = destinations.length === 1 ? fr ? `${names} comme destination évoquée` : `${names} as the destination discussed` : fr ? `${names} comme pistes de destination` : `${names} as possible destinations`;
      project.push(project.length ? `${fr ? "avec" : "with"} ${where}` : fr ? `${destinations.length === 1 ? "La destination envisagée est" : "Les destinations envisagées sont"} ${names}` : `${destinations.length === 1 ? "The destination being considered is" : "The possible destinations are"} ${names}`);
    }
    const occasionDetails = clean(captured(brief.motivation.occasion_details));
    const people = peopleSentence(brief, language);
    if (project.length || people || occasionDetails) paragraphs.push([
      project.length ? `${project.join(", ")}.` : null,
      occasionDetails ? fr ? `L’occasion évoquée est ${quote(occasionDetails, language)}.` : `The occasion discussed is ${quote(occasionDetails, language)}.` : null,
      people,
    ].filter(Boolean).join(" "));

    const details: string[] = [];
    const start = dateText(brief.temps.depart, language);
    const end = dateText(brief.temps.retour, language);
    if (start?.date && end?.date && end.date < start.date) unconfirmed = true;
    else if (start?.kind === "day" && end?.kind === "day") details.push(fr ? `La période envisagée va du ${start.text} au ${end.text}.` : `The planned dates run from ${start.text} to ${end.text}.`);
    else if (start) details.push(fr ? `Le départ est envisagé ${start.kind === "month" ? "en" : start.kind === "day" ? "le" : "pour"} ${start.text}.` : `Departure is planned ${start.kind === "month" ? "in" : start.kind === "day" ? "on" : "for"} ${start.text}.`);
    else if (end) details.push(fr ? `Le retour est envisagé ${end.kind === "month" ? "en" : end.kind === "day" ? "le" : "pour"} ${end.text}.` : `The return is planned ${end.kind === "month" ? "in" : end.kind === "day" ? "on" : "for"} ${end.text}.`);
    const duration = captured(brief.temps.duree);
    if (!start && !end && duration) {
      const durations = { moins_7j: ["moins de 7 jours", "under 7 days"], sept_j: ["7 jours", "7 days"], dix_j: ["10 jours", "10 days"], quatorze_j: ["14 jours", "14 days"], plus_14j: ["plus de 14 jours", "over 14 days"] } as const;
      details.push(fr ? `La durée évoquée est de ${durations[duration][index]}.` : `The duration discussed is ${durations[duration][index]}.`);
    }
    const total = brief.budget.total.statut === "capte" ? budgetValide(brief.budget.total) : null;
    const person = brief.budget.par_personne.statut === "capte" ? budgetValide(brief.budget.par_personne) : null;
    const amount = total ?? person;
    if (amount !== null) {
      const money = `${new Intl.NumberFormat(fr ? "fr-CA" : "en-CA", { maximumFractionDigits: 2 }).format(amount)} ${brief.budget.devise}`;
      details.push(fr ? `Le budget prévu est de ${money} ${total !== null ? "au total" : "par personne"}.` : `The planned budget is ${money} ${total !== null ? "in total" : "per person"}.`);
    }
    if (details.length) paragraphs.push(details.join(" "));

    const preferences: string[] = [];
    const stay = captured(brief.hebergement.type_hebergement);
    if (stay) preferences.push(STAYS[stay][index]);
    const ambiance = captured(brief.motivation.ambiance);
    if (ambiance) preferences.push(AMBIANCES[ambiance][index]);
    for (const motivation of captured(brief.motivation.motivations) ?? []) preferences.push(MOTIVATIONS[motivation][index]);
    for (const preference of strings(brief.services.elements_importants)) preferences.push(quote(preference, language));
    for (const preference of strings(brief.services.services_importants)) preferences.push(quote(preference, language));
    const nuance = [clean(captured(brief.hebergement.preference_plage)), clean(captured(brief.hebergement.preference_piscine)), clean(captured(brief.hebergement.localisation))].filter((value): value is string => Boolean(value));
    for (const preference of nuance) preferences.push(quote(preference, language));
    const priorities = [...new Set(preferences)].slice(0, 4);
    const meaning: string[] = [];
    if (priorities.length) meaning.push(fr ? `Les envies exprimées concernent ${join(priorities, language)}.` : `The preferences expressed include ${join(priorities, language)}.`);
    const constraints = [clean(captured(brief.contraintes.mobilite_sante)), clean(captured(brief.contraintes.restrictions_alimentaires))].filter((value): value is string => Boolean(value));
    if (constraints.length) meaning.push(fr ? `À prendre en compte : ${join(constraints.map((value) => quote(value, language)), language)}.` : `Important considerations: ${join(constraints.map((value) => quote(value, language)), language)}.`);
    const avoid = strings(brief.services.elements_a_eviter);
    if (avoid.length) meaning.push(fr ? `À éviter : ${join(avoid.map((value) => quote(value, language)), language)}.` : `To avoid: ${join(avoid.map((value) => quote(value, language)), language)}.`);
    if (meaning.length) paragraphs.push(meaning.join(" "));
  }
  if (paragraphs.length || !legacy) return { paragraphs, unconfirmed, historical: false };

  const historic = [
    [legacyText(legacy.travelers), fr ? "Les personnes mentionnées" : "The travellers mentioned"],
    [legacyText(legacy.dates), fr ? "La période évoquée" : "The timing discussed"],
    [legacyText(legacy.budget), fr ? "Le budget mentionné" : "The budget mentioned"],
  ].filter((item): item is [string, string] => Boolean(item[0])).map(([value, label]) => `${label} : ${quote(value, language)}.`);
  const preferences = (legacy.preferences ?? []).map(legacyText).filter((value): value is string => Boolean(value));
  if (preferences.length) historic.push(fr ? `Les préférences notées : ${join(preferences.map((value) => quote(value, language)), language)}.` : `The preferences noted: ${join(preferences.map((value) => quote(value, language)), language)}.`);
  return { paragraphs: historic.length ? [historic.join(" ")] : [], unconfirmed, historical: historic.length > 0 };
}
