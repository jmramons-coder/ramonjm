import type { UILanguage } from "@/lib/ui/language";
import type { ReactNode } from "react";

export type PageSkeletonVariant = "dashboard" | "folders" | "overview" | "review" | "folder-conversations" | "conversation" | "explore" | "settings" | "form" | "auth" | "landing" | "shell";
export type SectionSkeletonVariant = "list" | "products" | "brief" | "conversation" | "transcript" | "form" | "audio" | "control";
type LoadingProps = { language?: UILanguage; label?: string; className?: string };
export type PageSkeletonProps = LoadingProps & { variant: PageSkeletonVariant; shell?: boolean };
export type SectionSkeletonProps = LoadingProps & { variant: SectionSkeletonVariant; count?: number; announce?: boolean };
export type OfferListSkeletonProps = { kind: "flight" | "hotel"; count?: number; className?: string };

function countWithinBounds(count: number | undefined, fallback: number): number {
  return count === undefined || !Number.isFinite(count) ? fallback : Math.min(8, Math.max(1, Math.floor(count)));
}

function Line({ size = "text" }: { size?: "title" | "text" | "short" | "caption" }) {
  return <span className={`ps-shape ps-line ps-line--${size}`} />;
}
function Heading({ back = false }: { back?: boolean }) {
  return <div className="ps-page-heading">{back ? <Line size="caption" /> : null}<Line size="title" /><Line size="short" /></div>;
}
function Tabs() {
  return <div className="ps-tabs"><span className="ps-shape ps-tab" /><span className="ps-shape ps-tab" /><span className="ps-shape ps-tab" /></div>;
}
function FolderHeaderSkeleton() {
  return <div className="ps-folder-header">
    <div className="ps-folder-back"><span className="ps-shape ps-icon" /><Line size="caption" /></div>
    <div className="ps-folder-client"><span className="ps-shape ps-icon" /><Line size="caption" /></div>
    <div className="ps-folder-title"><Line size="title" /></div>
    <div className="ps-folder-actions"><span className="ps-shape ps-action" /><span className="ps-shape ps-folder-delete" /></div>
  </div>;
}
function FolderFrame({ tab, children }: { tab: 0 | 1 | 2; children: ReactNode }) {
  return <div className="ps-folder-profile">
    <FolderHeaderSkeleton />
    <div className="ps-tabs ps-folder-tabs">{[0, 1, 2].map((index) => <span key={index} className={`ps-shape ps-tab${index === tab ? " is-active" : ""}`} />)}</div>
    {children}
  </div>;
}
function ListRows({ count = 4, columns = false }: { count?: number; columns?: boolean }) {
  return <div className={`ps-list${columns ? " ps-list--directory" : ""}`}>{Array.from({ length: countWithinBounds(count, 4) }, (_, index) => <div className="ps-list-row" key={index}>
    <span className="ps-shape ps-icon" /><div className="ps-row-copy"><Line /><Line size="caption" /></div>
    {columns ? <><span className="ps-shape ps-column-value" /><span className="ps-shape ps-column-count" /></> : null}<span className="ps-shape ps-pill" />
  </div>)}</div>;
}
function OfferRows({ kind, count = 3, className = "" }: OfferListSkeletonProps) {
  return <ul className={`ps-offer-list ps-offer-list--${kind} ${className}`.trim()}>{Array.from({ length: countWithinBounds(count, 3) }, (_, index) => <li className="ps-offer-row" key={index}>
    <span className="ps-shape ps-offer-visual" /><div className="ps-row-copy"><Line /><Line size="caption" /></div><span className="ps-shape ps-price" />
  </li>)}</ul>;
}
/** Inert product rows for a parent which already announces the pending request. */
export function OfferListSkeleton({ kind, count = 3, className = "" }: OfferListSkeletonProps) {
  return <div className="ps-offers ps-motion" aria-hidden="true" inert><OfferRows kind={kind} count={count} className={className} /></div>;
}
function Brief({ count = 4 }: { count?: number }) {
  return <div className="ps-brief">{Array.from({ length: countWithinBounds(count, 4) }, (_, index) => <div className="ps-text-group" key={index}><Line /><Line /><Line size="short" /></div>)}</div>;
}
function FormFields({ count = 4 }: { count?: number }) {
  return <div className="ps-form-fields">{Array.from({ length: countWithinBounds(count, 4) }, (_, index) => <div className="ps-field" key={index}><Line size="caption" /><span className="ps-shape ps-control" /></div>)}</div>;
}
function Transcript({ count = 4 }: { count?: number }) {
  return <div className="ps-transcript">{Array.from({ length: countWithinBounds(count, 4) }, (_, index) => <div className="ps-transcript-row" key={index}><span className="ps-shape ps-avatar" /><div className="ps-row-copy"><Line size="caption" /><Line /><Line size="short" /></div></div>)}</div>;
}
function Audio() {
  return <div className="ps-audio"><span className="ps-shape ps-audio-play" /><span className="ps-shape ps-audio-meta" /><span className="ps-shape ps-audio-track" /><span className="ps-shape ps-audio-time" /></div>;
}
function SectionContent({ variant, count }: Pick<SectionSkeletonProps, "variant" | "count">) {
  switch (variant) {
    case "list": return <ListRows count={count} />;
    case "products": return <OfferRows kind="hotel" count={count} />;
    case "brief": return <Brief count={count} />;
    case "conversation": case "transcript": return <Transcript count={count} />;
    case "form": return <FormFields count={count} />;
    case "audio": return <Audio />;
    case "control": return <span className="ps-shape ps-control" />;
  }
}

/** Content-only placeholders; provide a job-specific label when a heading already exists. */
export function SectionSkeleton({ variant, language = "fr", count, label, className = "", announce = true }: SectionSkeletonProps) {
  return <div className={`section-skeleton ps-section--${variant} ${className}`.trim()} role={announce ? "status" : undefined} aria-busy="true">
    {announce ? <span className="ps-status">{label ?? (language === "fr" ? "Chargement…" : "Loading…")}</span> : null}
    <div className="ps-content ps-motion" aria-hidden="true" inert><SectionContent variant={variant} count={count} /></div>
  </div>;
}

function Dashboard() {
  return <><Heading /><div className="ps-invitation"><div className="ps-invitation-copy"><Line size="title" /><Line /><span className="ps-shape ps-action" /></div></div><div className="ps-dashboard-tabs"><Tabs /></div><div className="ps-dashboard-columns">
    <div className="ps-column"><Line size="short" /><ListRows /></div><div className="ps-column"><Line size="short" /><ListRows /></div><div className="ps-column"><Line size="short" /><OfferRows kind="hotel" /></div>
  </div></>;
}
function FolderOverview() {
  return <FolderFrame tab={0}>
    <div className="ps-overview-grid ps-overview-trip">
      <div className="ps-overview-reading">
        <div className="ps-folder-snapshot"><div className="ps-client-snapshot-identity"><span className="ps-shape ps-avatar" /><div className="ps-column"><Line size="caption" /><Line size="short" /></div></div><div className="ps-facts"><span className="ps-shape ps-fact" /><span className="ps-shape ps-fact" /><span className="ps-shape ps-fact" /></div></div>
        <div className="ps-overview-shared-row">
          <div className="ps-overview-plan"><div className="ps-overview-section-heading"><Line size="short" /></div><div className="ps-overview-empty"><span className="ps-shape ps-icon" /><Line /><Line size="short" /><span className="ps-shape ps-action" /></div></div>
          <div className="ps-overview-bookmarks"><div className="ps-overview-section-heading"><Line size="short" /></div><div className="ps-overview-empty"><span className="ps-shape ps-icon" /><Line /><Line size="short" /></div></div>
        </div>
      </div>
      <div className="ps-overview-aside"><Line size="short" /><div className="ps-journey-empty"><span className="ps-shape ps-icon" /><Line size="short" /></div></div>
    </div>
  </FolderFrame>;
}
function FolderFollowUp() {
  return <FolderFrame tab={2}>
    <div className="ps-folder-followup">
      <div className="ps-column"><Line size="short" /><Line size="caption" /></div>
      <FormFields count={2} />
      <div className="ps-folder-followup-message"><Brief count={3} /></div>
      <div className="ps-form-footer"><span className="ps-shape ps-action" /><span className="ps-shape ps-action" /><span className="ps-shape ps-action" /></div>
    </div>
  </FolderFrame>;
}
function FolderConversations() {
  return <FolderFrame tab={1}><div className="ps-folder-conversations-grid">
    <div className="ps-folder-conversations-list">{Array.from({ length: 6 }, (_, index) => <div className="ps-folder-conversation-row" key={index}><Line /><Line size="caption" /></div>)}</div>
    <div className="ps-folder-conversation-detail">
      <div className="ps-folder-conversation-heading"><Line size="short" /><Line size="caption" /></div>
      <span className="ps-shape ps-folder-conversation-search" />
      <div className="ps-folder-conversation-transcript"><Transcript count={5} /></div>
      <div className="ps-folder-conversation-audio"><Audio /></div>
    </div>
  </div></FolderFrame>;
}
function Conversation() {
  return <div className="ps-conversation"><div className="ps-conversation-toolbar"><span className="ps-shape ps-back" /><span className="ps-shape ps-pill" /><span className="ps-shape ps-action" /></div><div className="ps-conversation-body"><OfferRows kind="flight" /><Transcript count={4} /></div><div className="ps-composer"><span className="ps-shape ps-composer-input" /><span className="ps-shape ps-audio-play" /></div></div>;
}
function Explore() {
  return <><Heading /><div className="ps-explore-grid"><div className="ps-explore-search"><Tabs /><span className="ps-shape ps-search-summary" /><FormFields count={5} /><span className="ps-shape ps-action" /></div><div className="ps-column"><div className="ps-context"><Line size="title" /><Line size="short" /></div><OfferRows kind="flight" count={5} /></div></div></>;
}
function FlatForm({ settings = false }: { settings?: boolean }) {
  return <><Heading /><div className="ps-form">{settings ? <span className="ps-shape ps-profile" /> : null}<FormFields count={settings ? 4 : 5} /><div className="ps-form-footer"><span className="ps-shape ps-action" /><span className="ps-shape ps-pill" /></div></div></>;
}
function Auth() {
  return <div className="ps-auth"><span className="ps-shape ps-auth-image" /><div className="ps-auth-form"><span className="ps-shape ps-avatar" /><Heading /><FormFields count={2} /><span className="ps-shape ps-control" /><Line size="caption" /></div></div>;
}
function Landing() {
  return <><div className="ps-landing-header"><span className="ps-shape ps-avatar" /><span className="ps-shape ps-action" /></div><div className="ps-landing-hero"><Line size="title" /><Line size="title" /><Line /><span className="ps-shape ps-action" /></div><span className="ps-shape ps-landing-image" /><div className="ps-dashboard-columns"><Brief count={2} /><Brief count={2} /><Brief count={2} /></div></>;
}
function PageContent({ variant }: { variant: PageSkeletonVariant }) {
  switch (variant) {
    case "dashboard": case "shell": return <Dashboard />;
    case "folders": return <><Heading /><span className="ps-shape ps-directory-search" /><ListRows count={6} columns /></>;
    case "overview": return <FolderOverview />;
    case "review": return <FolderFollowUp />;
    case "folder-conversations": return <FolderConversations />;
    case "conversation": return <Conversation />;
    case "explore": return <Explore />;
    case "settings": return <FlatForm settings />;
    case "form": return <FlatForm />;
    case "auth": return <Auth />;
    case "landing": return <Landing />;
  }
}
function Sidebar() {
  return <div className="ps-sidebar"><span className="ps-shape ps-avatar" /><span className="ps-shape ps-control" /><ListRows count={4} /><div className="ps-sidebar-account"><span className="ps-shape ps-avatar" /><Line size="short" /></div></div>;
}
function MobileNavigation() {
  return <div className="ps-mobile-nav">{[0, 1, 2, 3].map((index) => <span className="ps-shape ps-icon" key={index} />)}</div>;
}

export function PageSkeleton({ variant, language = "fr", shell = false, label, className = "" }: PageSkeletonProps) {
  const withShell = shell || variant === "shell";
  const standalone = withShell || variant === "auth" || variant === "landing" || variant === "conversation";
  return <main className={`page-skeleton ps-page--${variant}${withShell ? " has-shell" : ""}${standalone ? "" : " dashboard-page"} ${className}`.trim()} role="status" aria-busy="true">
    <span className="ps-status">{label ?? (language === "fr" ? "Chargement de la page…" : "Loading page…")}</span>
    <div className={`ps-content ps-motion${withShell ? " ps-shell-layout" : ""}`} aria-hidden="true" inert>
      {withShell ? <Sidebar /> : null}<div className="ps-page-content"><PageContent variant={variant} /></div>{withShell ? <MobileNavigation /> : null}
    </div>
  </main>;
}

export default PageSkeleton;
