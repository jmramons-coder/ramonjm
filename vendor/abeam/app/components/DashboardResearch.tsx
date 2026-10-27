"use client";

import type { UILanguage } from "@/lib/ui/language";
import { ArrowUpRight, Hotel, Plane, Search } from "lucide-react";
import { useId, useMemo, useState } from "react";

import type { DiscoveryEntry } from "@/lib/discovery/entries";
import type { ProductSearchKind } from "@/lib/product-search/types";
import FlightOfferRow from "./FlightOfferRow";
import { OfferListSkeleton } from "./PageSkeleton";
import OfferThumbnail from "./OfferThumbnail";
import { displayDiscoveryOfferDates, displayDiscoveryOfferDetail, offerRetrievalDate } from "./offer-format";

import "./dashboard-research.css";

type ResearchKind = Extract<ProductSearchKind, "flights" | "hotels">;

export type DashboardResearchProps = {
  entries: DiscoveryEntry[];
  language: UILanguage;
  loading?: boolean;
  onOpen: (entry: DiscoveryEntry) => void;
  onSearch: (kind: ResearchKind) => void;
};

export default function DashboardResearch({ entries, language, onOpen, onSearch, loading = false }: DashboardResearchProps) {
  const fr = language === "fr";
  const headingId = useId();
  const [kind, setKind] = useState<ResearchKind>("flights");
  const flight = kind === "flights";
  const Icon = flight ? Plane : Hotel;
  const searchLabel = flight ? (fr ? "Rechercher des vols" : "Search flights") : (fr ? "Rechercher des hôtels" : "Search hotels");

  const visibleEntries = useMemo(() => {
    const seen = new Set<string>();
    return entries
      .filter((entry) => entry.kind === (kind === "flights" ? "flight" : "hotel"))
      .sort((a, b) => (Date.parse(b.observedAt ?? "") || 0) - (Date.parse(a.observedAt ?? "") || 0))
      .filter((entry) => {
        // Provider links can be shared by distinct airlines and itineraries.
        // Evidence IDs remain stable when a result's price is refreshed.
        const identity = `${entry.kind}:${entry.id}`;
        if (seen.has(identity)) return false;
        seen.add(identity);
        return true;
      })
      .slice(0, 5);
  }, [entries, kind]);

  return (
    <section className="home-panel home-research-panel" aria-labelledby={headingId}>
      <header className="home-panel-heading home-research-heading">
        <div><h2 id={headingId}>{fr ? "Recherches récentes" : "Recent research"}</h2></div>
        <button className="home-research-search" type="button" aria-label={searchLabel} title={searchLabel} onClick={() => onSearch(kind)}><Search size={16} strokeWidth={1.6} aria-hidden="true" /></button>
      </header>
      <div className="home-research-switch" role="group" aria-label={fr ? "Type de recherche" : "Research type"} onKeyDown={(event) => {
        const next = event.key === "Home" ? "flights" : event.key === "End" ? "hotels"
          : ["ArrowLeft", "ArrowRight"].includes(event.key) ? (flight ? "hotels" : "flights") : null;
        if (!next) return;
        event.preventDefault();
        setKind(next);
        event.currentTarget.querySelector<HTMLButtonElement>(`[data-kind="${next}"]`)?.focus();
      }}>
        <button type="button" data-kind="flights" aria-pressed={flight} onClick={() => setKind("flights")}><Plane size={14} strokeWidth={1.6} aria-hidden="true" /><span>{fr ? "Vols" : "Flights"}</span></button>
        <button type="button" data-kind="hotels" aria-pressed={!flight} onClick={() => setKind("hotels")}><Hotel size={14} strokeWidth={1.6} aria-hidden="true" /><span>{fr ? "Hôtels" : "Hotels"}</span></button>
      </div>
      {visibleEntries.length ? (
        <ul className="home-research-list">
          {visibleEntries.map((entry) => {
            const date = offerRetrievalDate(entry.observedAt, language);
            const source = entry.source || (fr ? "Recherche enregistrée" : "Saved research");
            const offerDetail = displayDiscoveryOfferDetail(entry, language);
            const offerDates = displayDiscoveryOfferDates(entry, language);
            const detail = [offerDetail, offerDates].filter(Boolean).join(" · ");
            const provenance = [source, date ? `${fr ? "Consulté le" : "Retrieved"} ${date.full}` : (fr ? "Date de consultation non disponible" : "Retrieval date unavailable")].join(" · ");
            return (
              <li key={entry.id}>
                <button className="home-research-row" type="button" onClick={() => onOpen(entry)} aria-label={[entry.title, entry.price, detail, provenance].filter(Boolean).join(" · ")}>
                  {entry.kind === "flight" ? <span className="home-research-copy home-research-flight-copy">
                    <FlightOfferRow title={entry.title} detail={offerDetail} price={entry.price} image={entry.image} compact language={language} />
                    {offerDates ? <span className="home-research-detail" title={offerDates}>{offerDates}</span> : null}
                    <span className="home-research-provenance" title={provenance}><span>{source}</span>{date ? <time dateTime={date.value}>{date.label}</time> : null}</span>
                  </span> : <>
                    <OfferThumbnail image={entry.image} className="home-research-visual is-hotel" width={44} height={50} />
                    <span className="home-research-copy">
                      <span className="home-research-row-heading"><strong title={entry.title}>{entry.title}</strong>{entry.price ? <b title={[entry.price, entry.dateLabel].filter(Boolean).join(" · ")}>{entry.price}</b> : null}</span>
                      {detail ? <span className="home-research-detail" title={detail}>{detail}</span> : null}
                      <span className="home-research-provenance" title={provenance}><span>{source}</span>{date ? <time dateTime={date.value}>{date.label}</time> : null}</span>
                    </span>
                    <ArrowUpRight className="home-research-open" size={13} strokeWidth={1.6} aria-hidden="true" />
                  </>}
                </button>
              </li>
            );
          })}
        </ul>
      ) : loading ? (
        <div role="status" aria-busy="true"><span className="sr-only">{fr ? "Chargement des recherches…" : "Loading research…"}</span><OfferListSkeleton kind={flight ? "flight" : "hotel"} count={3} /></div>
      ) : (
        <div className="home-research-empty">
          <Icon size={20} strokeWidth={1.4} aria-hidden="true" />
          <p>{flight ? (fr ? "Aucun vol recherché pour le moment." : "No flight research yet.") : (fr ? "Aucun hôtel recherché pour le moment." : "No hotel research yet.")}</p>
          <button type="button" onClick={() => onSearch(kind)}><Search size={14} strokeWidth={1.6} aria-hidden="true" />{searchLabel}</button>
        </div>
      )}
    </section>
  );
}
