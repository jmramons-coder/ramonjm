import { UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { uiLocale, type UILanguage } from "@/lib/ui/language";
import "./folder-client-snapshot.css";

export type FolderClientSnapshotProps = {
  clientName: string;
  language: UILanguage;
  facts?: ReactNode;
};

const COPY = {
  fr: { trip: "Repères du voyage", client: "Client principal", unnamed: "Client à préciser" },
  en: { trip: "Trip at a glance", client: "Primary client", unnamed: "Client to confirm" },
} as const;

/** Actual trip facts live in Overview; mobile adds the client above them. */
export default function FolderClientSnapshot({ clientName, language, facts }: FolderClientSnapshotProps) {
  const copy = COPY[language];
  const name = clientName.trim();
  const parts = name.split(/\s+/).filter(Boolean);
  const initials = parts.length ? [parts[0], ...(parts.length > 1 ? [parts[parts.length - 1]] : [])]
    .map((part) => Array.from(part)[0]).join("").toLocaleUpperCase(uiLocale(language)) : "";
  const hasFacts = facts !== null && facts !== undefined && typeof facts !== "boolean" && facts !== "";

  return <section className="folder-client-snapshot" aria-label={copy.trip} data-has-facts={hasFacts || undefined}>
    <div className="folder-client-snapshot-identity">
      <span className="folder-client-snapshot-avatar" aria-hidden="true">{initials || <UserRound size={18} strokeWidth={1.7} aria-hidden="true" />}</span>
      <div className="folder-client-snapshot-copy">
        <span className="folder-client-snapshot-label">{copy.client}</span>
        <strong className="folder-client-snapshot-name" title={name || copy.unnamed}>{name || copy.unnamed}</strong>
      </div>
    </div>
    {hasFacts ? <div className="folder-client-snapshot-facts">{facts}</div> : null}
  </section>;
}
