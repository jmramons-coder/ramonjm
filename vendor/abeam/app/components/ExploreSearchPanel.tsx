"use client";

import type { UILanguage } from "@/lib/ui/language";
import { Baby, CalendarDays, ChevronDown, Compass, Hotel, LoaderCircle, MapPin, Plane, Search, SlidersHorizontal, UsersRound, X, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, type FormEvent, type ReactNode, type RefObject } from "react";
import { Form } from "react-aria-components/Form";
import { Button, Dialog, Modal, ModalOverlay } from "react-aria-components/Modal";

import { useSearchViewport } from "@/app/hooks/useSearchViewport";

import { PRODUCT_SEARCH_LIMITS } from "@/lib/product-search/constraints";
import type { ProductSearchField, ProductSearchKind } from "@/lib/product-search/types";
import { parseDateOnly } from "@/lib/ui/date-field";
import DateField from "./ui/DateField";
import { ExplorerAirportField, ExplorerNumberField, ExplorerSelectField, ExplorerTextField, type AirportOption } from "./ui/SearchFields";

export type ExploreSearchDraft = {
  kind: ProductSearchKind;
  origin: string;
  destination: string;
  query: string;
  departureDate: string;
  returnDate: string;
  adults: string;
  childrenAges: string;
  infantSeating: "" | "lap" | "seat";
  maxPrice: string;
};
export type ExploreSearchSection = "where" | "when" | "who" | "options";
export const SEARCH_KINDS = [
  { value: "flights", fr: "Vols", en: "Flights", icon: Plane },
  { value: "hotels", fr: "Hôtels", en: "Hotels", icon: Hotel },
  { value: "trips", fr: "Voyages", en: "Trips", icon: Compass },
] as const;

export function searchSectionForField(field: ProductSearchField): ExploreSearchSection {
  switch (field) {
    case "departureDate": case "returnDate": return "when";
    case "adults": case "childrenAges": case "infantSeating": return "who";
    case "maxPrice": return "options";
    default: return "where";
  }
}

export type ExploreSearchPanelProps = {
  id: string;
  language: UILanguage;
  draft: ExploreSearchDraft;
  mobile: boolean;
  expanded: boolean;
  formRevision: number;
  formRef: RefObject<HTMLFormElement | null>;
  section: ExploreSearchSection;
  onSectionChange: (section: ExploreSearchSection) => void;
  dateBounds: { minimum: string; maximum: string };
  returnMinimum: string;
  airportOptions: AirportOption[];
  fieldErrors: Partial<Record<ProductSearchField, string>>;
  validationMessage: string;
  operationError?: string;
  searching: boolean;
  onChange: (field: keyof ExploreSearchDraft, value: string) => void;
  onKindChange: (kind: ProductSearchKind) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  onReset: () => void;
  onCancel: () => void;
};

function SearchSection({ id, section, title, summary, icon: Icon, expanded, onExpand, children }: {
  id: string; section: ExploreSearchSection; title: string; summary: string; icon: LucideIcon; expanded: boolean; onExpand: () => void; children: ReactNode;
}) {
  return <section className="esp-step" data-section={section} data-expanded={expanded}>
    <button id={`${id}-heading`} className="esp-step-trigger" type="button" aria-expanded={expanded} aria-controls={`${id}-body`} aria-disabled={expanded || undefined} onClick={expanded ? undefined : onExpand}>
      <span className="esp-step-heading"><Icon className="esp-step-icon" size={19} aria-hidden="true" /><span className="esp-step-title">{title}</span></span>
      <span className="esp-step-summary">{summary}</span><ChevronDown className="esp-step-chevron" size={18} aria-hidden="true" />
    </button>
    <div className="esp-step-content" id={`${id}-body`} role="group" aria-labelledby={`${id}-heading`} hidden={!expanded}>{children}</div>
  </section>;
}

/** One controlled form, rendered inline or within a focus-contained React Aria modal. */
export function ExploreSearchPanel({ id, language, draft, mobile, expanded, formRevision, formRef, section, onSectionChange, dateBounds, returnMinimum, airportOptions, fieldErrors, validationMessage, operationError, searching, onChange, onKindChange, onSubmit, onClose, onReset, onCancel }: ExploreSearchPanelProps) {
  const fr = language === "fr";
  const viewportRef = useSearchViewport();
  const invalidBatchRef = useRef<symbol | null>(null);
  const focusFrameRef = useRef<number | null>(null);
  const resetFocusFrameRef = useRef<number | null>(null);
  const boundFormRef = useRef<HTMLFormElement | null>(null);
  useEffect(() => () => {
    if (focusFrameRef.current !== null) window.cancelAnimationFrame(focusFrameRef.current);
    focusFrameRef.current = null;
    invalidBatchRef.current = null;
  }, [draft.kind, expanded, formRevision, mobile]);
  useEffect(() => () => {
    if (resetFocusFrameRef.current !== null) window.cancelAnimationFrame(resetFocusFrameRef.current);
    resetFocusFrameRef.current = null;
  }, [draft.kind, expanded, mobile]);

  const reset = () => {
    onReset();
    onSectionChange("where");
    if (resetFocusFrameRef.current !== null) window.cancelAnimationFrame(resetFocusFrameRef.current);
    resetFocusFrameRef.current = window.requestAnimationFrame(() => {
      resetFocusFrameRef.current = null;
      // The parent remounts the keyed form to clear native errors. Restore focus
      // to a button in that new form so reset never opens the phone keyboard.
      formRef.current?.querySelector<HTMLButtonElement>(".esp-reset, .esp-step-trigger")?.focus({ preventScroll: true });
    });
  };

  const handleInvalid = useCallback((event: Event) => {
    // Capture precedes React Aria's native invalid listener. Its validation still
    // commits, while preventDefault suppresses its focus into a hidden section.
    event.preventDefault();
    if (invalidBatchRef.current || !(event.target instanceof HTMLElement)) return;
    const wrapper = event.target.closest<HTMLElement>("[data-search-field]");
    const name = wrapper?.dataset.searchField || event.target.getAttribute("name");
    if (!name) return;
    const field = name as ProductSearchField;
    const token = Symbol("invalid-batch");
    invalidBatchRef.current = token;
    onSectionChange(searchSectionForField(field));
    const details = wrapper?.closest("details");
    if (details) details.open = true;
    if (focusFrameRef.current !== null) window.cancelAnimationFrame(focusFrameRef.current);
    focusFrameRef.current = window.requestAnimationFrame(() => {
      focusFrameRef.current = null;
      const visibleWrapper = formRef.current?.querySelector<HTMLElement>(`[data-search-field="${field}"]`);
      const input = visibleWrapper?.querySelector<HTMLElement>("[data-ui-input]:not([disabled]), [role='spinbutton']:not([aria-disabled='true']), .ui-select-control:not([data-disabled])");
      input?.focus({ preventScroll: true });
      visibleWrapper?.scrollIntoView({ block: "nearest", behavior: "instant" });
      if (invalidBatchRef.current === token) invalidBatchRef.current = null;
    });
  }, [formRef, onSectionChange]);
  const bindForm = useCallback((form: HTMLFormElement | null) => {
    const previous = boundFormRef.current;
    if (previous !== form) {
      previous?.removeEventListener("invalid", handleInvalid, true);
      form?.addEventListener("invalid", handleInvalid, true);
      boundFormRef.current = form;
    }
    formRef.current = form;
  }, [formRef, handleInvalid]);

  const childParts = draft.childrenAges.trim() ? draft.childrenAges.split(",").map((age) => age.trim()) : [];
  const validChildren = childParts.length <= PRODUCT_SEARCH_LIMITS.maxChildren && childParts.every((age) => /^\d{1,2}$/.test(age) && Number(age) >= PRODUCT_SEARCH_LIMITS.minChildAge && Number(age) <= PRODUCT_SEARCH_LIMITS.maxChildAge);
  const childValues = validChildren ? childParts.map(Number) : [];
  const hasInfant = draft.kind !== "hotels" && childParts.map(Number).some((age) => age < 2);
  const adultCount = Number(draft.adults);
  const validAdults = Number.isInteger(adultCount) && adultCount >= PRODUCT_SEARCH_LIMITS.minAdults && adultCount <= PRODUCT_SEARCH_LIMITS.maxAdults;
  const place = (value: string) => {
    const option = airportOptions.find((airport) => airport.code === value.trim().toUpperCase());
    return option ? `${option.label} (${option.code})` : value.trim();
  };
  const origin = place(draft.origin), destination = draft.kind === "hotels" ? draft.destination.trim() : place(draft.destination);
  const route = draft.kind === "hotels" ? destination : origin && destination ? `${origin} → ${destination}` : origin ? `${fr ? "De" : "From"} ${origin}` : destination ? `${fr ? "Vers" : "To"} ${destination}` : "";
  const whereSummary = [route, draft.kind !== "flights" ? draft.query.trim() : ""].filter(Boolean).join(" · ") || (fr ? "Choisissez une destination" : "Choose a destination");
  const dateLabel = (value: string) => {
    const parsed = parseDateOnly(value);
    return parsed ? new Intl.DateTimeFormat(fr ? "fr-CA" : "en-CA", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(parsed.toDate("UTC")) : value.trim();
  };
  const start = dateLabel(draft.departureDate), end = dateLabel(draft.returnDate);
  const whenSummary = start && end ? `${start} → ${end}` : start ? `${fr ? "Du" : "From"} ${start}` : end ? `${fr ? "Au" : "Until"} ${end}` : (fr ? "Ajoutez les dates" : "Add dates");
  const whoSummary = [
    validAdults ? `${adultCount} ${fr ? adultCount === 1 ? "adulte" : "adultes" : adultCount === 1 ? "adult" : "adults"}` : draft.adults.trim() ? (fr ? "Adultes à vérifier" : "Check adult count") : "",
    childValues.length ? `${childValues.length} ${fr ? childValues.length === 1 ? "enfant" : "enfants" : childValues.length === 1 ? "child" : "children"}` : !validChildren ? (fr ? "Âges à vérifier" : "Check ages") : "",
    hasInfant && draft.infantSeating ? draft.infantSeating === "lap" ? (fr ? "Bébé sur les genoux" : "Infant on a lap") : (fr ? "Siège pour bébé" : "Infant seat") : "",
  ].filter(Boolean).join(" · ") || (fr ? "Ajoutez les voyageurs" : "Add travellers");
  const maximum = draft.maxPrice.trim();
  const optionsSummary = draft.kind === "trips" ? (fr ? "Vols et hébergements séparés" : "Separate flights and stays") : maximum ? `${maximum} CAD${draft.kind === "hotels" ? (fr ? " / nuit" : " / night") : ""}` : (fr ? "Facultatif" : "Optional");

  const whereFields = <>
    {draft.kind === "hotels" ? <ExplorerTextField type="search" name="destination" label="Destination" hint={fr ? "Ville ou région" : "City or region"} value={draft.destination} onChange={(value) => onChange("destination", value)} placeholder={fr ? "Où souhaitez-vous aller ?" : "Where would you like to go?"} maxLength={PRODUCT_SEARCH_LIMITS.destinationLength} required error={fieldErrors.destination} />
      : <ExplorerAirportField mobile={mobile} name="destination" label={fr ? "Aéroport d’arrivée" : "Arrival airport"} hint="IATA" value={draft.destination} onChange={(value) => onChange("destination", value)} options={airportOptions} placeholder={fr ? "Ville ou code" : "City or code"} required error={fieldErrors.destination} />}
    {draft.kind !== "hotels" ? <ExplorerAirportField mobile={mobile} name="origin" label={fr ? "Aéroport de départ" : "Departure airport"} hint="IATA" value={draft.origin} onChange={(value) => onChange("origin", value)} options={airportOptions} placeholder={fr ? "Ville ou code" : "City or code"} required error={fieldErrors.origin} /> : null}
    {draft.kind !== "flights" ? <ExplorerTextField type="search" name="query" label={draft.kind === "trips" ? (fr ? "Ville ou hôtel" : "City or hotel") : (fr ? "Hôtel ou mots-clés" : "Hotel or keywords")} hint={draft.kind === "hotels" ? (fr ? "Facultatif" : "Optional") : undefined} value={draft.query} onChange={(value) => onChange("query", value)} maxLength={PRODUCT_SEARCH_LIMITS.queryLength} placeholder={fr ? "Nom, quartier, près de la plage…" : "Name, area, near the beach…"} description={draft.kind === "trips" ? (fr ? "Requis si la zone hôtelière de l’aéroport est inconnue." : "Required when the airport’s hotel area is unknown.") : undefined} error={fieldErrors.query} /> : null}
  </>;
  const whenFields = <div className="explore-field-pair explore-date-fields">
    <DateField name="departureDate" label={draft.kind === "hotels" ? (fr ? "Arrivée le" : "Check-in") : (fr ? "Départ le" : "Depart")} language={language} value={draft.departureDate} onChange={(value) => onChange("departureDate", value)} minDate={dateBounds.minimum} maxDate={dateBounds.maximum} required error={fieldErrors.departureDate} />
    <DateField name="returnDate" label={draft.kind === "hotels" ? (fr ? "Départ le" : "Check-out") : (fr ? "Retour le" : "Return")} language={language} value={draft.returnDate} onChange={(value) => onChange("returnDate", value)} minDate={returnMinimum} maxDate={dateBounds.maximum} required error={fieldErrors.returnDate} />
  </div>;
  const whoFields = <>
    <div className="explore-field-pair">
      <ExplorerNumberField name="adults" label={fr ? "Adultes" : "Adults"} value={draft.adults} onChange={(value) => onChange("adults", value)} min={PRODUCT_SEARCH_LIMITS.minAdults} max={PRODUCT_SEARCH_LIMITS.maxAdults} step={1} required error={fieldErrors.adults} />
      <ExplorerTextField name="childrenAges" label={fr ? "Âges des enfants" : "Children’s ages"} value={draft.childrenAges} onChange={(value) => onChange("childrenAges", value)} inputMode="text" placeholder="4, 8" maxLength={45} description={fr ? "Facultatif · séparés par une virgule" : "Optional · separated by commas"} error={fieldErrors.childrenAges} />
    </div>
    {hasInfant ? <ExplorerSelectField name="infantSeating" label={fr ? "Place pour le bébé" : "Infant seating"} value={draft.infantSeating} onChange={(value) => onChange("infantSeating", value)} placeholder={fr ? "Choisir" : "Choose"} options={[{ id: "lap", label: fr ? "Sur les genoux" : "On a lap" }, { id: "seat", label: fr ? "Dans son propre siège" : "In their own seat" }]} required error={fieldErrors.infantSeating} /> : null}
  </>;
  const optionsFields = draft.kind !== "trips" ? <ExplorerNumberField name="maxPrice" label={draft.kind === "hotels" ? (fr ? "Maximum par nuit · CAD" : "Maximum per night · CAD") : (fr ? "Tarif maximum · CAD" : "Maximum fare · CAD")} hint={fr ? "Facultatif" : "Optional"} value={draft.maxPrice} onChange={(value) => onChange("maxPrice", value)} min={1} max={PRODUCT_SEARCH_LIMITS.maxPrice} step={1} error={fieldErrors.maxPrice} /> : <p className="explore-form-note">{fr ? "Vols et hébergements comparés séparément, sans tarif forfaitaire." : "Flights and stays compared separately, without a package quote."}</p>;
  const kinds = <div className={`explore-kinds${mobile ? " esp-kinds" : ""}`} role="group" aria-label={fr ? "Type de recherche" : "Search type"}>{SEARCH_KINDS.map(({ value, icon: Icon, ...labels }) => <button key={value} className={mobile ? "esp-kind" : undefined} type="button" aria-pressed={draft.kind === value} onClick={() => onKindChange(value)}><Icon size={16} aria-hidden="true" /><span>{labels[language]}</span></button>)}</div>;
  const messages = <>{validationMessage ? <p className="explore-validation-message" role="alert">{validationMessage}</p> : null}{mobile && operationError ? <p className="explore-validation-message esp-operation-error" role="alert">{operationError}</p> : null}</>;
  const actions = <div className={`explore-search-actions${mobile ? " esp-footer" : ""}`}>
    {mobile && searching ? <button className="explore-cancel-search esp-cancel" type="button" onClick={onCancel}>{fr ? "Annuler" : "Cancel"}</button>
      : mobile ? <button className="esp-reset" type="button" onClick={reset}>{fr ? "Tout effacer" : "Clear all"}</button> : null}
    <button className="explore-submit esp-submit" type="submit" disabled={searching}>{searching ? <LoaderCircle className="explore-spinner" size={16} aria-hidden="true" /> : <Search size={16} aria-hidden="true" />}{searching ? (fr ? "Recherche…" : "Searching…") : (fr ? "Rechercher" : "Search")}</button>
    {!mobile && searching ? <button className="explore-cancel-search esp-cancel" type="button" onClick={onCancel}>{fr ? "Annuler" : "Cancel"}</button> : null}
  </div>;
  const form = <Form key={`${draft.kind}-${formRevision}`} className={`explore-search-form${expanded ? " is-expanded" : ""}${mobile ? " esp-form" : ""}`} ref={bindForm} onSubmit={onSubmit} validationBehavior="native" autoComplete="off" validationErrors={fieldErrors} aria-labelledby={`${id}-form-title`}>
    {mobile ? <>
      <header className="esp-header">{kinds}<Button autoFocus className="esp-close" onPress={onClose} aria-label={fr ? "Fermer la recherche" : "Close search"}><X size={20} aria-hidden="true" /></Button></header>
      <div className="esp-body">{messages}
        {([
          { key: "where", title: fr ? "Où ?" : "Where?", summary: whereSummary, icon: MapPin, fields: whereFields },
          { key: "when", title: fr ? "Quand ?" : "When?", summary: whenSummary, icon: CalendarDays, fields: whenFields },
          { key: "who", title: fr ? "Qui ?" : "Who?", summary: whoSummary, icon: hasInfant ? Baby : UsersRound, fields: whoFields },
          { key: "options", title: "Options", summary: optionsSummary, icon: SlidersHorizontal, fields: optionsFields },
        ] as const).map(({ key, title, summary, icon, fields }) => <SearchSection key={key} section={key} id={`${id}-${key}`} title={title} summary={summary} icon={icon} expanded={section === key} onExpand={() => onSectionChange(key)}><div className="explore-form-fields" data-search-section={key}>{fields}</div></SearchSection>)}
      </div>
      {actions}
    </> : <div className="explore-form-controls" id={`${id}-controls`}>{kinds}<div className="explore-form-fields" id={`${id}-fields`}>{messages}{whereFields}{whenFields}{whoFields}
      {draft.kind !== "trips" ? <details className="explore-more-options"><summary><SlidersHorizontal size={16} aria-hidden="true" /><span>{fr ? "Affiner la recherche" : "Refine search"}</span><ChevronDown className="explore-options-chevron" size={16} aria-hidden="true" /></summary>{optionsFields}</details> : optionsFields}
      {actions}
    </div></div>}
  </Form>;

  return mobile ? <ModalOverlay ref={viewportRef} className="esp-overlay" isOpen={expanded} isDismissable onOpenChange={(open) => { if (!open) onClose(); }}><Modal className="esp-modal"><Dialog id={`${id}-mobile-search`} lang={language} className="esp-panel" aria-label={fr ? "Critères de recherche" : "Search criteria"}>{form}</Dialog></Modal></ModalOverlay> : form;
}
