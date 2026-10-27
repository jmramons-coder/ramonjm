"use client";

import type { UILanguage } from "@/lib/ui/language";
import { ArrowLeft, Baby, CalendarDays, ChevronDown, Clock3, Compass, Hotel, LoaderCircle, PencilLine, Plane, RefreshCw, Search, UsersRound } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { today } from "@internationalized/date";
import { I18nProvider } from "react-aria-components/I18nProvider";

import type { DiscoveryEntry } from "@/lib/discovery/entries";
import type { ProductSearchField, ProductSearchItem, ProductSearchKind, ProductSearchRequest, ProductSearchResult } from "@/lib/product-search/types";
import { PRODUCT_SEARCH_LIMITS } from "@/lib/product-search/constraints";
import { manualResearchEntries } from "@/lib/discovery/research";
import { exploreIdeaRequest, groupExploreItems, latestExploreIdea } from "@/lib/discovery/explore";
import { editorialSearchScope } from "@/lib/product-search/feed-catalog";
import type { DailyFeedItem, EditorialSearchScope } from "@/lib/product-search/feed-types";
import { parseDateOnly } from "@/lib/ui/date-field";
import type { ToastMessage, ToastVariant } from "@/lib/ui/toast";
import { ExploreOfferRow, ExploreOfferDetails } from "./ExploreOffers";
import { OfferListSkeleton } from "./PageSkeleton";
import { displayOfferDate as displayDate } from "./offer-format";
import { DEFAULT_DRAWER_WIDTH } from "./useDrawerResize";
import { ExploreSearchPanel, SEARCH_KINDS, searchSectionForField, type ExploreSearchDraft, type ExploreSearchSection } from "./ExploreSearchPanel";
import Toast from "./Toast";

import "./explore.css";
import "./ui/search-controls.css";
import "./explore-search-panel.css";

export type ExploreProps = {
  language: UILanguage;
  entries: DiscoveryEntry[];
  onSearch: (input: ProductSearchRequest, signal: AbortSignal) => Promise<ProductSearchResult>;
  onSearchCompleted?: (result: ProductSearchResult) => void;
  onRefresh: () => Promise<void>;
  refreshing?: boolean;
  feedError?: string;
  feedNotice?: string;
  feedWarnings?: string[];
  inspirationItems?: DailyFeedItem[];
  inspirationScopes?: EditorialSearchScope[];
  launchRequest?: { id: number; kind: ProductSearchKind; offer?: DiscoveryEntry } | null;
};

type Draft = ExploreSearchDraft;
const initialDraft = (): Draft => ({ kind: "flights", origin: "", destination: "", query: "", departureDate: "", returnDate: "", adults: "", childrenAges: "", infantSeating: "", maxPrice: "" });
const AIRPORTS = [{ code: "YUL", fr: "Montréal", en: "Montréal" }, { code: "YQB", fr: "Québec", en: "Québec City" }, { code: "YYZ", fr: "Toronto", en: "Toronto" }, { code: "YVR", fr: "Vancouver", en: "Vancouver" }, { code: "CDG", fr: "Paris", en: "Paris" }, { code: "CUN", fr: "Cancún", en: "Cancún" }, { code: "PUJ", fr: "Punta Cana", en: "Punta Cana" }, { code: "LIS", fr: "Lisbonne", en: "Lisbon" }, { code: "ATH", fr: "Athènes", en: "Athens" }, { code: "BCN", fr: "Barcelone", en: "Barcelona" }, { code: "FCO", fr: "Rome", en: "Rome" }, { code: "LHR", fr: "Londres", en: "London" }];

const EMPTY_ITEMS: DailyFeedItem[] = [];
const EMPTY_SCOPES: EditorialSearchScope[] = [];
const EMPTY_WARNINGS: string[] = [];
const MOBILE_SEARCH_QUERY = "(max-width: 800px)";
function subscribeSearchViewport(listener: () => void) {
  const media = window.matchMedia(MOBILE_SEARCH_QUERY);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
const mobileSearchSnapshot = () => window.matchMedia(MOBILE_SEARCH_QUERY).matches;
const serverSearchSnapshot = () => false;
type OperationToast = { id: number; message: string; variant: Extract<ToastVariant, "warning" | "error">; retry: { kind: "search"; request: ProductSearchRequest } | { kind: "feed" } };

function placeName(code: string | undefined, language: UILanguage) {
  return AIRPORTS.find((airport) => airport.code === code)?.[language] || code || "";
}

function contextTitle(input: ProductSearchRequest, language: UILanguage) {
  return input.kind === "hotels" ? [input.destination, input.query].filter(Boolean).join(" · ")
    : [placeName(input.origin, language), placeName(input.destination, language)].filter(Boolean).join(" → ");
}

function contextFacts(input: ProductSearchRequest, language: UILanguage) {
  const fr = language === "fr";
  const adults = input.adults ?? 0;
  const days = Math.round((Date.parse(input.returnDate || "") - Date.parse(input.departureDate || "")) / 86_400_000);
  const shortDates = new Intl.DateTimeFormat(fr ? "fr-CA" : "en-CA", { day: "numeric", month: "short" });
  const departure = input.departureDate ? new Date(`${input.departureDate}T12:00:00`) : null;
  const startLabel = departure && Number.isFinite(departure.getTime()) && input.departureDate?.slice(0, 4) === input.returnDate?.slice(0, 4) ? shortDates.format(departure) : displayDate(input.departureDate, language);
  const children = input.childrenAges?.length ?? 0;
  return [
    { key: "adults", icon: UsersRound, label: adults > 0 ? `${adults} ${fr ? (adults === 1 ? "adulte" : "adultes") : (adults === 1 ? "adult" : "adults")}` : "" },
    { key: "children", icon: Baby, label: children ? `${children} ${fr ? (children === 1 ? "enfant" : "enfants") : (children === 1 ? "child" : "children")}` : "" },
    { key: "duration", icon: Clock3, label: Number.isFinite(days) && days > 0 ? (days % 7 === 0 ? `${days / 7} ${fr ? (days === 7 ? "semaine" : "semaines") : (days === 7 ? "week" : "weeks")}` : `${days} ${input.kind === "flights" ? (fr ? "jours" : "days") : (fr ? "nuits" : "nights")}`) : "" },
    { key: "dates", icon: CalendarDays, label: [startLabel, displayDate(input.returnDate, language)].filter(Boolean).join(" → ") },
  ].filter((fact) => fact.label);
}

function isPriceReference(message: string) {
  return /^(?:Hotel prices are references|Tarifs d’hôtel indicatifs|Flights and stays are separate price references|Vols et hébergements sont des repères séparés)/i.test(message);
}

export default function Explore({ language, entries, onSearch, onSearchCompleted, onRefresh, refreshing = false, feedError, feedNotice, feedWarnings = EMPTY_WARNINGS, inspirationItems = EMPTY_ITEMS, inspirationScopes = EMPTY_SCOPES, launchRequest }: ExploreProps) {
  const fr = language === "fr";
  const id = useId();
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [dateBounds] = useState(() => {
    const minimum = today("UTC");
    return { minimum: minimum.toString(), maximum: minimum.add({ days: PRODUCT_SEARCH_LIMITS.maxFutureDays }).toString() };
  });
  const airportOptions = useMemo(() => AIRPORTS.map((airport) => ({ code: airport.code, label: airport[language] })), [language]);
  const departure = parseDateOnly(draft.departureDate);
  const earliestReturn = departure?.add({ days: 1 }).toString();
  const returnMinimum = earliestReturn && earliestReturn > dateBounds.minimum ? earliestReturn : dateBounds.minimum;
  const [completedSearch, setCompletedSearch] = useState<{ request: ProductSearchRequest; result: ProductSearchResult } | null>(null);
  const result = completedSearch?.result ?? null;
  const [fallbackIdea] = useState(() => editorialSearchScope(0));
  const [activeSearchRequest, setActiveSearchRequest] = useState<ProductSearchRequest | null>(null);
  const searching = activeSearchRequest !== null;
  const [formExpanded, setFormExpanded] = useState(false);
  const [searchSection, setSearchSection] = useState<ExploreSearchSection>("where");
  const mobileSearch = useSyncExternalStore(subscribeSearchViewport, mobileSearchSnapshot, serverSearchSnapshot);
  const [formRevision, setFormRevision] = useState(0);
  const [validationMessage, setValidationMessage] = useState("");
  const [toast, setToast] = useState<OperationToast | null>(null);
  const [localRefreshing, setLocalRefreshing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ProductSearchField, string>>>({});
  const [selectedOffer, setSelectedOffer] = useState<{ entry: DiscoveryEntry; item?: ProductSearchItem } | null>(null);
  const [detailWidth, setDetailWidth] = useState(DEFAULT_DRAWER_WIDTH);
  const mountedRef = useRef(true);
  const busyRef = useRef(false);
  const refreshBusyRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  const requestRef = useRef(0);
  const toastSequenceRef = useRef(0);
  const toastRef = useRef<HTMLDivElement>(null);
  const refreshSequenceRef = useRef(0);
  const completedRefreshRef = useRef<number | null>(null);
  const launchedRef = useRef<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fieldFocusVersionRef = useRef(0);
  const searchLauncherRef = useRef<HTMLButtonElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const focusedSearchRef = useRef<typeof completedSearch>(null);
  const focusField = useCallback((field: ProductSearchField) => {
    const version = ++fieldFocusVersionRef.current;
    setSearchSection(searchSectionForField(field));
    window.requestAnimationFrame(() => {
      if (mountedRef.current && version === fieldFocusVersionRef.current) formRef.current?.querySelector<HTMLElement>(`[data-search-field="${field}"] [data-ui-input]`)?.focus();
    });
  }, []);
  useEffect(() => {
    if (!completedSearch || formExpanded || focusedSearchRef.current === completedSearch) return;
    // React Aria restores the modal opener during teardown; focus results after it.
    const frame = window.requestAnimationFrame(() => {
      if (!mountedRef.current) return;
      focusedSearchRef.current = completedSearch;
      resultHeadingRef.current?.focus({ preventScroll: true });
      if (window.matchMedia("(max-width: 1100px)").matches) resultHeadingRef.current?.closest(".explore-context-bar")?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [completedSearch, formExpanded]);
  const showOperationToast = useCallback((message: string, retry: OperationToast["retry"], variant: OperationToast["variant"] = "error") => {
    setToast({ id: ++toastSequenceRef.current, message, variant, retry });
  }, []);
  const dismissToast = (id: ToastMessage["id"]) => {
    if (!toast || id !== `explore-${toast.id}` || toast.id !== toastSequenceRef.current) return;
    if (toastRef.current?.contains(document.activeElement)) resultHeadingRef.current?.focus({ preventScroll: true });
    setToast((current) => current?.id === toast.id ? null : current);
  };
  const cancelSearch = useCallback(() => {
    fieldFocusVersionRef.current += 1;
    controllerRef.current?.abort(); controllerRef.current = null; requestRef.current += 1; busyRef.current = false; setActiveSearchRequest(null); setToast(null); setValidationMessage("");
  }, []);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; controllerRef.current?.abort(); refreshSequenceRef.current += 1; }; }, []);
  useEffect(() => {
    if (!launchRequest || launchedRef.current === launchRequest.id) return;
    const frame = window.requestAnimationFrame(() => {
      launchedRef.current = launchRequest.id;
      cancelSearch(); setCompletedSearch(null); setFieldErrors({});
      setDraft((current) => ({ ...current, kind: launchRequest.kind, destination: (current.kind === "hotels") !== (launchRequest.kind === "hotels") ? "" : current.destination }));
      setSelectedOffer(launchRequest.offer ? { entry: launchRequest.offer } : null);
      if (!launchRequest.offer) {
        setSearchSection("where");
        setFormExpanded(true);
        if (!window.matchMedia(MOBILE_SEARCH_QUERY).matches) window.requestAnimationFrame(() => { if (mountedRef.current) focusField("destination"); });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [launchRequest, cancelSearch, focusField]);

  const feed = useMemo(() => entries.filter((entry) => entry.kind === "flight" || entry.kind === "hotel"), [entries]);
  const inspiration = useMemo(() => latestExploreIdea(inspirationItems, inspirationScopes, draft.kind), [inspirationItems, inspirationScopes, draft.kind]);
  const ideaRequest = exploreIdeaRequest(inspiration.scope ?? fallbackIdea, draft.kind, language);
  const contextRequest = completedSearch?.request ?? ideaRequest;
  const viewItems = result?.items ?? inspiration.items;
  const groups = useMemo(() => groupExploreItems(viewItems, draft.kind).map((group) => {
    const projected = manualResearchEntries(group.items, language);
    return { ...group, rows: group.items.map((item, index) => ({ entry: projected[index], item })) };
  }), [viewItems, draft.kind, language]);
  const selectedEntry = selectedOffer?.item ? manualResearchEntries([selectedOffer.item], language)[0] : feed.find((entry) => entry.id === selectedOffer?.entry.id) ?? selectedOffer?.entry;
  const selectedItem = selectedOffer?.item;
  const selectedEditorialScope = selectedItem?.kind === "hotel" && "editorialScopeId" in selectedItem
    ? inspirationScopes.find((scope) => scope.id === selectedItem.editorialScopeId
      && scope.destination === selectedItem.destination && scope.departureDate === selectedItem.departureDate
      && scope.returnDate === selectedItem.returnDate && scope.adults === selectedItem.adults
      && scope.childrenAges.length === 0 && selectedItem.childrenAges.length === 0)
    : undefined;
  const ContextIcon = draft.kind === "hotels" ? Hotel : draft.kind === "trips" ? Compass : Plane;
  const childValues = draft.childrenAges.trim() ? draft.childrenAges.split(",").map((value) => Number(value.trim())) : [];
  const summaryChildren = childValues.length <= PRODUCT_SEARCH_LIMITS.maxChildren && draft.childrenAges.trim() && draft.childrenAges.split(",").every((value) => /^\d{1,2}$/.test(value.trim()) && Number(value) >= PRODUCT_SEARCH_LIMITS.minChildAge && Number(value) <= PRODUCT_SEARCH_LIMITS.maxChildAge) ? childValues : [];
  const summaryAdults = Number(draft.adults);
  const searchKindLabel = SEARCH_KINDS.find((kind) => kind.value === draft.kind)![language];
  const summaryRequest = activeSearchRequest ?? {
    kind: draft.kind, language, origin: draft.origin, destination: draft.destination, query: draft.query,
    departureDate: draft.departureDate, returnDate: draft.returnDate,
    adults: Number.isInteger(summaryAdults) && summaryAdults >= PRODUCT_SEARCH_LIMITS.minAdults && summaryAdults <= PRODUCT_SEARCH_LIMITS.maxAdults ? summaryAdults : undefined,
    childrenAges: summaryChildren,
  };
  const summaryTitle = contextTitle(summaryRequest, language) || (fr ? `Rechercher des ${searchKindLabel.toLowerCase()}` : `Search ${searchKindLabel.toLowerCase()}`);
  const summaryFacts = contextFacts(summaryRequest, language).filter((fact) => fact.key !== "duration");
  const summaryDescription = [searchKindLabel, ...summaryFacts.map((fact) => fact.label)].join(" · ");
  const searchToggleLabel = formExpanded ? (fr ? "Réduire les critères de recherche" : "Collapse search criteria") : (fr ? "Ouvrir les critères de recherche" : "Open search criteria");
  const hasInfant = draft.kind !== "hotels" && childValues.some((age) => age < 2);
  const pendingRefresh = refreshing || localRefreshing;
  const loadingResults = searching || (!result && pendingRefresh);
  const notices = feedWarnings.length ? feedWarnings : feedNotice ? [feedNotice] : EMPTY_WARNINGS;
  const feedAlert = notices.filter((notice) => !isPriceReference(notice)).join(" ");
  const feedFeedback = feedError || feedAlert;
  const feedFeedbackVariant: OperationToast["variant"] = feedError ? "error" : "warning";
  const observedFeedFeedbackRef = useRef({ message: feedFeedback, variant: feedFeedbackVariant });
  useEffect(() => {
    if (pendingRefresh) return;
    const explicit = completedRefreshRef.current !== null;
    completedRefreshRef.current = null;
    const changed = observedFeedFeedbackRef.current.message !== feedFeedback || observedFeedFeedbackRef.current.variant !== feedFeedbackVariant;
    observedFeedFeedbackRef.current = { message: feedFeedback, variant: feedFeedbackVariant };
    if (!feedFeedback || (!changed && !explicit)) return;
    const timer = window.setTimeout(() => {
      if (mountedRef.current) showOperationToast(feedFeedback, { kind: "feed" }, feedFeedbackVariant);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [feedFeedback, feedFeedbackVariant, pendingRefresh, showOperationToast]);
  const priceNotes = (result?.warnings ?? notices).filter((notice) => isPriceReference(notice)
    && (!/^(?:Hotel prices|Tarifs d’hôtel)/i.test(notice) || draft.kind !== "flights")
    && (!/^(?:Flights and stays|Vols et hébergements)/i.test(notice) || draft.kind === "trips"));

  const change = (field: keyof Draft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current }; delete next[field]; return next;
    });
  };
  const switchKind = (kind: ProductSearchKind) => {
    if (kind === draft.kind) return;
    cancelSearch(); setCompletedSearch(null); setSelectedOffer(null);
    setDraft((current) => ({ ...current, kind, destination: (current.kind === "hotels") !== (kind === "hotels") ? "" : current.destination }));
    setFieldErrors({});
    setSearchSection("where");
    // The keyed form resets native validation; retain focus on the chosen type.
    window.requestAnimationFrame(() => {
      if (mountedRef.current) formRef.current?.querySelector<HTMLButtonElement>(`.explore-kinds button[aria-pressed="true"]`)?.focus();
    });
  };
  const runSearch = async (input: ProductSearchRequest) => {
    if (busyRef.current) return;
    const request = ++requestRef.current;
    const controller = new AbortController(); controllerRef.current = controller; busyRef.current = true;
    const isCurrent = () => mountedRef.current && !controller.signal.aborted && request === requestRef.current;
    setActiveSearchRequest(input); setToast(null); setValidationMessage(""); setFieldErrors({});
    try {
      const next = await onSearch(input, controller.signal);
      if (!isCurrent()) return;
      if (next.status === "needs-details") {
        setFormExpanded(true);
        setFieldErrors(Object.fromEntries(next.clarifications.map((item) => [item.field, item.message])));
        setValidationMessage(fr ? "Précisez ces détails pour comparer les bonnes options." : "Add these details to compare the right options.");
        const first = next.clarifications[0]?.field;
        if (first) window.requestAnimationFrame(() => { if (isCurrent()) focusField(first); });
      } else {
        setCompletedSearch({ request: input, result: next }); setSelectedOffer(null); setFormExpanded(false); onSearchCompleted?.(next);
        const warnings = next.warnings.filter((warning) => !isPriceReference(warning));
        if (warnings.length) showOperationToast(warnings.join(" "), { kind: "search", request: input }, "warning");
      }
    } catch (caught) {
      if (!isCurrent()) return;
      showOperationToast(caught instanceof Error && caught.message ? caught.message : (fr ? "La recherche n’a pas abouti. Réessayez." : "Search could not finish. Try again."), { kind: "search", request: input });
    } finally {
      if (request === requestRef.current) { busyRef.current = false; controllerRef.current = null; if (mountedRef.current) setActiveSearchRequest(null); }
    }
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ages = draft.childrenAges.split(",");
    if (draft.childrenAges.trim() && (ages.length > PRODUCT_SEARCH_LIMITS.maxChildren || ages.some((value) => !/^\d{1,2}$/.test(value.trim()) || Number(value) < PRODUCT_SEARCH_LIMITS.minChildAge || Number(value) > PRODUCT_SEARCH_LIMITS.maxChildAge))) {
      const { maxChildren, minChildAge, maxChildAge } = PRODUCT_SEARCH_LIMITS;
      setFieldErrors({ childrenAges: ages.length > maxChildren ? (fr ? `La recherche accepte jusqu’à ${maxChildren} enfants.` : `Search supports up to ${maxChildren} children.`) : (fr ? `Indiquez les âges de ${minChildAge} à ${maxChildAge}, séparés par une virgule.` : `Enter ages from ${minChildAge} to ${maxChildAge}, separated by commas.`) });
      focusField("childrenAges"); return;
    }
    void runSearch({ kind: draft.kind, language, destination: draft.destination.trim(), ...(draft.kind !== "hotels" ? { origin: draft.origin.trim().toUpperCase() } : {}), ...(draft.kind !== "flights" && draft.query.trim() ? { query: draft.query.trim() } : {}), departureDate: draft.departureDate, returnDate: draft.returnDate, adults: Number(draft.adults), childrenAges: childValues, ...(hasInfant && draft.infantSeating ? { infantSeating: draft.infantSeating } : {}), ...(draft.kind !== "trips" && draft.maxPrice ? { maxPrice: Number(draft.maxPrice) } : {}) });
  };
  const refresh = async () => {
    if (refreshBusyRef.current || pendingRefresh) return;
    refreshBusyRef.current = true;
    const request = ++refreshSequenceRef.current;
    completedRefreshRef.current = null;
    setLocalRefreshing(true); setToast(null);
    try {
      await onRefresh();
      if (mountedRef.current && request === refreshSequenceRef.current) completedRefreshRef.current = request;
    } catch (caught) {
      const message = caught instanceof Error && caught.message ? caught.message : (fr ? "Actualisation indisponible. Réessayez." : "Refresh unavailable. Try again.");
      observedFeedFeedbackRef.current = { message, variant: "error" };
      if (mountedRef.current && request === refreshSequenceRef.current) showOperationToast(message, { kind: "feed" });
    } finally { refreshBusyRef.current = false; if (mountedRef.current) setLocalRefreshing(false); }
  };
  const editSearch = (input?: ProductSearchRequest, preserveResults = false) => {
    if (input) {
      cancelSearch(); if (!preserveResults) setCompletedSearch(null); setSelectedOffer(null); setFieldErrors({});
      // Prefilled criteria start a fresh form, including native validation/calendar state.
      setFormRevision((current) => current + 1);
      setDraft({ kind: input.kind, origin: input.origin ?? "", destination: input.destination ?? "", query: input.query ?? "", departureDate: input.departureDate ?? "", returnDate: input.returnDate ?? "", adults: String(input.adults ?? ""), childrenAges: input.childrenAges?.join(", ") ?? "", infantSeating: input.infantSeating ?? "", maxPrice: input.maxPrice ? String(input.maxPrice) : "" });
    }
    setSearchSection("where");
    setFormExpanded(true);
    if (!mobileSearch) window.requestAnimationFrame(() => { if (mountedRef.current) focusField("destination"); });
  };
  const closeSearch = () => {
    fieldFocusVersionRef.current += 1;
    if (searching) cancelSearch();
    setFormExpanded(false);
    if (!mobileSearch) searchLauncherRef.current?.focus({ preventScroll: true });
  };
  const resetSearch = () => {
    cancelSearch();
    setDraft({ ...initialDraft(), kind: draft.kind });
    setFieldErrors({});
    setFormRevision((current) => current + 1);
    setSearchSection("where");
  };
  const toggleSearch = () => {
    if (!formExpanded) { editSearch(); return; }
    closeSearch();
  };

  return <I18nProvider locale={fr ? "fr-CA-u-ca-gregory" : "en-CA-u-ca-gregory"}><main className="dashboard-page explore-page">
    <div className="explore-content">
    <header className="explore-page-heading"><div><h1>{fr ? "Explorer" : "Explore"}</h1><p>{fr ? "Comparez les options, préparez votre proposition." : "Compare options and shape your next proposal."}</p></div></header>
    <div className="explore-layout">
      <div className="explore-search-area">
        <div className="explore-form-heading">
          <h2 id={`${id}-form-title`}>{fr ? "Votre recherche" : "Your search"}</h2>
          <button className="explore-search-launcher" ref={searchLauncherRef} type="button" aria-expanded={formExpanded} aria-controls={`${id}-${mobileSearch ? "mobile-search" : "controls"}`} aria-haspopup={mobileSearch ? "dialog" : undefined} aria-label={`${searchToggleLabel} : ${summaryTitle}`} aria-describedby={`${id}-search-summary`} onClick={toggleSearch}>
            <span className="explore-search-launcher-icon">{searching ? <LoaderCircle className="explore-spinner" size={21} aria-hidden="true" /> : <Search size={21} aria-hidden="true" />}</span>
            <span className="explore-search-launcher-copy"><strong>{summaryTitle}</strong><small id={`${id}-search-summary`}>{searching ? (fr ? "Recherche en cours · " : "Searching · ") : ""}{summaryFacts.length ? summaryDescription : (fr ? `${searchKindLabel} · Destination, dates, voyageurs` : `${searchKindLabel} · Destination, dates, travelers`)}</small></span>
            <span className="explore-search-launcher-action"><ChevronDown size={18} aria-hidden="true" /></span>
          </button>
        </div>
        <ExploreSearchPanel
          id={id} language={language} draft={draft} mobile={mobileSearch} expanded={formExpanded}
          formRevision={formRevision} formRef={formRef} section={searchSection} onSectionChange={setSearchSection}
          dateBounds={dateBounds} returnMinimum={returnMinimum} airportOptions={airportOptions}
          fieldErrors={fieldErrors} validationMessage={validationMessage} operationError={formExpanded && toast?.retry.kind === "search" && toast.variant === "error" ? toast.message : undefined}
          searching={searching} onChange={change} onKindChange={switchKind} onSubmit={submit}
          onClose={closeSearch} onReset={resetSearch} onCancel={cancelSearch}
        />
      </div>

      <section className="explore-options" aria-labelledby={`${id}-options-title`} aria-busy={loadingResults}>
        <header className={`explore-context-bar${result ? " is-search" : ""}`}>
          <div className="explore-context-copy"><span>{result ? (fr ? "Votre recherche" : "Your search") : draft.kind === "hotels" ? (fr ? "Idée de séjour" : "Stay inspiration") : draft.kind === "trips" ? (fr ? "Idée de voyage" : "Trip inspiration") : (fr ? "Idée de vol" : "Flight inspiration")}</span><h2 id={`${id}-options-title`} ref={resultHeadingRef} tabIndex={-1} aria-describedby={`${id}-criteria`}><ContextIcon className="explore-context-icon" size={20} aria-hidden="true" /><span>{contextTitle(contextRequest, language)}</span></h2><ul className="explore-context-facts" id={`${id}-criteria`}>{contextFacts(contextRequest, language).map(({ key, icon: Icon, label }) => <li key={key}><Icon size={13} strokeWidth={1.7} aria-hidden="true" /><span>{label}</span></li>)}</ul></div>
          <div className="explore-context-actions">
            {result ? <button type="button" className="explore-context-action" onClick={() => { cancelSearch(); setCompletedSearch(null); }} aria-label={fr ? "Revenir aux idées de recherche" : "Back to search ideas"} title={fr ? "Idées de recherche" : "Search ideas"}><ArrowLeft size={16} aria-hidden="true" /></button> : null}
            <button type="button" className="explore-context-action explore-adapt" onClick={() => editSearch(completedSearch?.request ?? ideaRequest, Boolean(completedSearch))} aria-label={result ? (fr ? "Modifier la recherche" : "Edit search") : (fr ? "Utiliser les critères de cette idée" : "Use this idea’s criteria")} title={result ? (fr ? "Modifier la recherche" : "Edit search") : (fr ? "Utiliser les critères de cette idée" : "Use this idea’s criteria")}><PencilLine size={15} aria-hidden="true" /><span>{result ? (fr ? "Modifier" : "Edit") : (fr ? "Adapter" : "Adapt")}</span></button>
            <button className="explore-context-action" type="button" disabled={searching || pendingRefresh} onClick={() => { if (completedSearch) void runSearch({ ...completedSearch.request, language }); else void refresh(); }} aria-label={result ? (fr ? "Actualiser cette recherche" : "Refresh this search") : (fr ? "Découvrir une autre idée" : "Discover another idea")} title={result ? (fr ? "Actualiser cette recherche" : "Refresh this search") : (fr ? "Découvrir une autre idée" : "Discover another idea")}><RefreshCw className={searching || pendingRefresh ? "explore-spinner" : ""} size={16} aria-hidden="true" /></button>
          </div>
        </header>
        {groups.map((group) => <section key={group.kind} className="explore-product-section" aria-label={group.kind === "hotel" ? (fr ? "Hôtels" : "Hotels") : (fr ? "Vols" : "Flights")}>
          {draft.kind === "trips" ? <h3>{group.kind === "hotel" ? (fr ? "Hôtels" : "Hotels") : (fr ? "Vols" : "Flights")}</h3> : null}
          {group.rows.length ? <ul className={`explore-offer-list${loadingResults ? " is-loading" : ""}`}>{group.rows.map(({ entry, item }) => <ExploreOfferRow key={entry.id} entry={entry} language={language} selected={selectedEntry?.id === entry.id} onSelect={() => setSelectedOffer({ entry, item })} />)}</ul> : loadingResults ? <OfferListSkeleton kind={group.kind} className="explore-offer-list" /> : <div className="explore-empty"><ContextIcon size={26} aria-hidden="true" /><h3>{result ? (fr ? "Aucune option pour cette recherche" : "No options for this search") : (fr ? "Une idée pour votre prochaine proposition" : "An idea for your next proposal")}</h3><p>{result ? (fr ? "Ajustez les dates ou la destination pour comparer d’autres options." : "Adjust the dates or destination to compare more options.") : (fr ? "Utilisez ces critères comme point de départ, puis adaptez-les à votre client." : "Use these criteria as a starting point, then adapt them to your client.")}</p><button type="button" onClick={() => editSearch(completedSearch?.request ?? ideaRequest, Boolean(completedSearch))}>{result ? (fr ? "Modifier la recherche" : "Edit search") : (fr ? "Utiliser cette idée" : "Use this idea")}</button></div>}
        </section>)}
        {priceNotes.length ? <div className="explore-price-notes" role="note" aria-label={fr ? "Notes sur les tarifs" : "Price reference notes"}>{priceNotes.map((note) => <p key={note}>{note}</p>)}</div> : null}
        {typeof result?.searchesRemaining === "number" ? <p className="explore-usage">{result.searchesRemaining} {fr ? "recherches restantes après cette recherche" : "searches remaining after this search"}</p> : null}
      </section>
    </div>
    </div>
    <p className="explore-sr-only" role="status" aria-live="polite" aria-atomic="true">{loadingResults ? searching ? (fr ? "Recherche en cours." : "Search in progress.") : (fr ? "Actualisation des offres en cours." : "Updating offers.") : ""}</p>
    <Toast
      language={language}
      contentRef={toastRef}
      onDismiss={dismissToast}
      toast={toast && !selectedEntry && !(mobileSearch && formExpanded) ? {
        id: `explore-${toast.id}`,
        message: toast.message,
        variant: toast.variant,
        action: {
          label: fr ? "Réessayer" : "Retry",
          disabled: searching || pendingRefresh,
          onClick: () => {
            if (toast.retry.kind === "search") {
              if (toast.retry.request.kind === draft.kind) void runSearch({ ...toast.retry.request, language });
            } else void refresh();
          },
        },
      } : null}
    />
    {selectedEntry ? <ExploreOfferDetails key={selectedEntry.id} entry={selectedEntry} item={selectedOffer?.item} destinationLabel={selectedEditorialScope?.destinationLabel} language={language} width={detailWidth} onWidthChange={setDetailWidth} fallbackFocusRef={resultHeadingRef} onClose={() => setSelectedOffer(null)} /> : null}
  </main></I18nProvider>;
}
