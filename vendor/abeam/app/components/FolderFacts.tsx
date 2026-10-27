import type { UILanguage } from "@/lib/ui/language";
import { CalendarClock, CalendarDays, Users, Wallet } from "lucide-react";
import { budgetValide, type DateFloue, type Field, type Statut, type TripBrief } from "@/lib/extraction/trip-brief";

type LegacyFacts = { people?: string; timing?: string; budget?: string };
type FactState = Statut | "partiel";
type Fact = { id: "people" | "timing" | "budget"; label: string; value: string; detail?: string; state: FactState; quoted?: boolean };

const COPY = {
  fr: { people: "Personnes", timing: "Dates", budget: "Budget", unknown: "À préciser", peopleUnit: "personnes", adults: "Adultes connus", children: "Enfants connus", month: "Mois cité", citedDates: "Dates citées", departure: "Départ", return: "Retour", period: "Période à préciser", total: "total", perPerson: "/ pers.", amount: "Montant cité", historical: "Historique", incertain: "À confirmer", contradiction: "À vérifier", partiel: "Incomplet" },
  en: { people: "People", timing: "Dates", budget: "Budget", unknown: "To clarify", peopleUnit: "people", adults: "Known adults", children: "Known children", month: "Stated month", citedDates: "Stated dates", departure: "Departure", return: "Return", period: "Period to clarify", total: "total", perPerson: "/ person", amount: "Stated amount", historical: "Previous record", incertain: "Unconfirmed", contradiction: "Check details", partiel: "Incomplete" },
} as const;

const COUNT_WORDS: Record<string, number> = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, one: 1, two: 2, three: 3, four: 4, five: 5, seven: 7, eight: 8, nine: 9, ten: 10 };
const COUNT_TOKEN = "(\\d+|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|one|two|three|four|five|seven|eight|nine|ten)";
const PEOPLE_COUNT = new RegExp(`\\b${COUNT_TOKEN}\\s+(?:personnes?|voyageurs?|people|travelers?|travellers?)\\b`, "i");
const GROUP_COUNT = new RegExp(`^(?:nous\\s+(?:sommes|serons)|on\\s+(?:est|sera|serait)|we\\s+(?:are|will\\s+be)|we['’]re)\\s+${COUNT_TOKEN}[.!]?\\s*$`, "i");

function clean(value: string | null | undefined) { return value?.trim() || null; }

function normalized<T>(field: Field<T> | undefined): T | null {
  return field?.statut !== "manquant" && field?.valeur !== undefined ? field.valeur : null;
}

function stateOf(fields: Array<{ statut: Statut } | undefined>, fallback: FactState = "capte"): FactState {
  if (fields.some((field) => field?.statut === "contradiction")) return "contradiction";
  if (fields.some((field) => field?.statut === "incertain")) return "incertain";
  return fallback;
}

/** Only explicit group wording supplies a total; ages or a group type do not. */
function statedPeopleCount(text: string | null): number | null {
  const match = text && (text.match(PEOPLE_COUNT) ?? text.match(GROUP_COUNT));
  if (!match) return null;
  const value = COUNT_WORDS[match[1].toLowerCase()] ?? Number(match[1]);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

function peopleFact(brief: TripBrief, language: UILanguage): Fact {
  const copy = COPY[language];
  const base: Fact = { id: "people", label: copy.people, value: copy.unknown, state: "manquant" };
  const { adultes, enfants_ages, composition } = brief.voyageurs;
  const compositionValue = clean(normalized(composition));
  const compositionText = compositionValue ?? clean(composition.verbatim);
  const groupCount = statedPeopleCount(compositionText) ?? statedPeopleCount(clean(adultes.verbatim));
  if (groupCount !== null) {
    const source = statedPeopleCount(compositionText) !== null ? composition : adultes;
    return { ...base, value: String(groupCount), detail: copy.peopleUnit, state: stateOf([source], source.statut === "manquant" ? "incertain" : "capte") };
  }
  const adults = normalized(adultes);
  const ages = normalized(enfants_ages);
  const knownAdults = typeof adults === "number" && Number.isSafeInteger(adults) && adults > 0;
  const knownChildren = Array.isArray(ages) && ages.every((age) => Number.isFinite(age) && age >= 0);
  if (knownAdults && knownChildren) {
    return { ...base, value: String(adults + ages.length), detail: copy.peopleUnit, state: stateOf([adultes, enfants_ages]) };
  }
  if (knownAdults) return { ...base, value: String(adults), detail: copy.adults, state: stateOf([adultes], "partiel") };
  if (knownChildren && ages.length > 0) return { ...base, value: String(ages.length), detail: copy.children, state: stateOf([enfants_ages], "partiel") };
  if (compositionText) return { ...base, value: compositionText, quoted: !compositionValue, state: stateOf([composition], compositionValue ? "capte" : "incertain") };
  const raw = clean(adultes.verbatim) ?? clean(enfants_ages.verbatim);
  return raw ? { ...base, value: raw, quoted: true, state: stateOf([adultes, enfants_ages], "incertain") } : base;
}

function calendarDate(value: string | null) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? { date, year, month, day } : null;
}

function dateValue(field: DateFloue, language: UILanguage): { value: string; quoted: boolean; partial: boolean } | null {
  const value = field.statut !== "manquant" ? clean(field.valeur) : null;
  const locale = language === "fr" ? "fr-CA" : "en-CA";
  const exact = calendarDate(value);
  if (value && field.precision === "jour" && exact) {
    return { value: new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(exact.date), quoted: false, partial: false };
  }
  if (value && field.precision === "mois") {
    const month = value.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
    if (month && Number(month[2]) >= 1 && Number(month[2]) <= 12) {
      return { value: new Intl.DateTimeFormat(locale, { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(Number(month[1]), Number(month[2]) - 1, 1))), quoted: false, partial: true };
    }
    if (!/\d{4}-\d{2}/.test(value)) return { value, quoted: false, partial: true };
  }
  // A captured day-only value remains day-only; we never attach a month/year.
  if (value && field.precision !== "saison" && !/^\d{4}-\d{2}/.test(value)) return { value, quoted: false, partial: true };
  const raw = clean(field.verbatim);
  return raw ? { value: raw, quoted: true, partial: true } : null;
}

function timingFact(brief: TripBrief, language: UILanguage): Fact {
  const copy = COPY[language];
  const base: Fact = { id: "timing", label: copy.timing, value: copy.unknown, state: "manquant" };
  const { depart, retour } = brief.temps;
  const start = depart.statut !== "manquant" && depart.precision === "jour" ? calendarDate(depart.valeur) : null;
  const end = retour.statut !== "manquant" && retour.precision === "jour" ? calendarDate(retour.valeur) : null;
  const locale = language === "fr" ? "fr-CA" : "en-CA";
  if (start && end) {
    const sharedMonth = start.year === end.year && start.month === end.month;
    const sameYear = start.year === end.year;
    const format = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" });
    return {
      ...base,
      value: sharedMonth ? `${start.day}–${end.day}` : `${format.format(start.date)} → ${format.format(end.date)}`,
      detail: sharedMonth ? new Intl.DateTimeFormat(locale, { month: "short", year: "numeric", timeZone: "UTC" }).format(start.date) : sameYear ? String(start.year) : `${start.year} → ${end.year}`,
      state: end.date < start.date ? "contradiction" : stateOf([depart, retour]),
    };
  }
  const first = dateValue(depart, language);
  const last = dateValue(retour, language);
  if (first && last) {
    const same = first.value.toLowerCase() === last.value.toLowerCase();
    const raw = first.quoted || last.quoted;
    return { ...base, value: same ? first.value : `${first.quoted ? `“${first.value}”` : first.value} → ${last.quoted ? `“${last.value}”` : last.value}`, detail: same && depart.precision === "mois" && retour.precision === "mois" ? copy.month : copy.citedDates, quoted: same && first.quoted, state: stateOf([depart, retour], raw ? "incertain" : first.partial || last.partial ? "partiel" : "capte") };
  }
  const one = first ?? last;
  if (one) return { ...base, value: one.value, detail: one.quoted ? copy.citedDates : `${first ? copy.departure : copy.return}${start || end ? ` · ${(start ?? end)!.year}` : ""}`, quoted: one.quoted, state: stateOf([first ? depart : retour], one.quoted ? "incertain" : "partiel") };
  const duration = normalized(brief.temps.duree);
  const durations = language === "fr" ? { moins_7j: "Moins de 7 j", sept_j: "7 jours", dix_j: "10 jours", quatorze_j: "14 jours", plus_14j: "Plus de 14 j" } : { moins_7j: "Under 7 days", sept_j: "7 days", dix_j: "10 days", quatorze_j: "14 days", plus_14j: "Over 14 days" };
  return duration ? { ...base, value: durations[duration], detail: copy.period, state: stateOf([brief.temps.duree], "partiel") } : base;
}

function budgetFact(brief: TripBrief, language: UILanguage): Fact {
  const copy = COPY[language];
  const base: Fact = { id: "budget", label: copy.budget, value: copy.unknown, state: "manquant" };
  const { total, par_personne } = brief.budget;
  const totalAmount = budgetValide(total);
  const personAmount = budgetValide(par_personne);
  const amount = totalAmount ?? personAmount;
  if (amount !== null) {
    const source = totalAmount !== null ? total : par_personne;
    return { ...base, value: new Intl.NumberFormat(language === "fr" ? "fr-CA" : "en-CA", { maximumFractionDigits: 2 }).format(amount), detail: `${brief.budget.devise} · ${totalAmount !== null ? copy.total : copy.perPerson}`, state: stateOf([source]) };
  }
  // A rejected numeric sentinel is never brought back through its raw wording.
  const source = [total, par_personne].find((field) => field.valeur === null && clean(field.verbatim) && !isNumericPlaceholder(field.verbatim));
  return source ? { ...base, value: source.verbatim!.trim(), detail: copy.amount, quoted: true, state: stateOf([source], "incertain") } : base;
}

function isNumericPlaceholder(value: string | null | undefined) {
  return /^(?:0|12345)(?:[.,]00)?(?:\$|cad|dollars(?:canadiens)?)?$/i.test((value ?? "").replace(/\s/g, ""));
}

function legacyValue(value: string | undefined): string | null {
  const text = clean(value);
  if (!text || isNumericPlaceholder(text) || /^(?:[-—–]|n\/a|not (?:confirmed|specified|provided)|to be confirmed|to clarify|unknown|a (?:confirmer|preciser)|non (?:confirme|renseigne))$/i.test(text.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))) return null;
  return text;
}

/** Display-only: never repairs the brief, assigns ages, fills dates, or estimates a budget. */
export function folderFacts(brief: TripBrief | null, language: UILanguage, legacy?: LegacyFacts): Fact[] {
  if (brief) return [peopleFact(brief, language), timingFact(brief, language), budgetFact(brief, language)];
  const copy = COPY[language];
  return (["people", "timing", "budget"] as const).map((id) => {
    const value = legacyValue(legacy?.[id]);
    return { id, label: copy[id], value: value ?? copy.unknown, detail: value ? copy.historical : undefined, state: value ? "incertain" : "manquant", quoted: Boolean(value) };
  });
}

const ICONS = { people: Users, timing: CalendarDays, budget: Wallet };

export default function FolderFacts({ brief, language, legacy }: { brief: TripBrief | null; language: UILanguage; legacy?: LegacyFacts }) {
  const copy = COPY[language];
  return (
    <dl className="folder-facts" aria-label={language === "fr" ? "Repères du voyage" : "Trip at a glance"}>
      {folderFacts(brief, language, legacy).map((fact) => {
        const Icon = ICONS[fact.id];
        const confirmDates = fact.id === "timing" && fact.state !== "capte";
        return (
          <div className="folder-fact" key={fact.id} data-state={fact.state} data-quoted={fact.quoted || undefined}>
            <dt><Icon size={14} strokeWidth={1.7} aria-hidden="true" /><span>{fact.label}</span></dt>
            {confirmDates && fact.state === "manquant" ? null : (
              <dd className="folder-fact-value" title={fact.value}>{fact.quoted ? <q>{fact.value}</q> : fact.value}</dd>
            )}
            {fact.detail ? <dd className="folder-fact-detail">{fact.detail}</dd> : null}
            {confirmDates ? (
              <dd className="folder-fact-date-status" title={fact.state === "contradiction" ? copy.contradiction : undefined}>
                <span className="folder-date-lozenge">
                  <CalendarClock size={13} strokeWidth={1.7} aria-hidden="true" />
                  <span>{language === "fr" ? "À confirmer" : "Confirm dates"}</span>
                </span>
              </dd>
            ) : fact.state !== "capte" && fact.state !== "manquant" ? <dd className="folder-fact-state">{copy[fact.state]}</dd> : null}
          </div>
        );
      })}
    </dl>
  );
}
