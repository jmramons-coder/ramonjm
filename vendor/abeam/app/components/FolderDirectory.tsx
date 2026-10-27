import { ArrowDown, ArrowUp, ArrowUpDown, Folder } from "lucide-react";
import type { UILanguage } from "@/lib/ui/language";
import { folderLatestTime, nextFolderSort, type FolderSort, type FolderSortKey } from "../workspace/folder-sort";
import type { ClientFolder } from "../workspace/types";
import { displayOfferDate as displayDate } from "./offer-format";

type Props = {
  folders: ClientFolder[];
  language: UILanguage;
  sort: FolderSort;
  onSortChange: (sort: FolderSort) => void;
  onOpen: (key: string) => void;
};

const COLUMNS: { key: FolderSortKey; fr: string; en: string }[] = [
  { key: "name", fr: "Dossier", en: "Folder" },
  { key: "client", fr: "Client", en: "Client" },
  { key: "conversations", fr: "Conversations", en: "Conversations" },
  { key: "latest", fr: "Dernière conversation", en: "Last conversation" },
];

export default function FolderDirectory({ folders, language, sort, onSortChange, onOpen }: Props) {
  const fr = language === "fr";
  return (
    <table className="folder-directory">
      <caption className="sr-only">{fr ? "Dossiers. Sélectionnez un en-tête pour trier les dossiers." : "Folders. Select a column header to sort folders."}</caption>
      <thead>
        <tr>{COLUMNS.map(({ key, ...labels }) => {
          const active = sort.key === key;
          const next = nextFolderSort(sort, key);
          const Icon = active ? sort.direction === "ascending" ? ArrowUp : ArrowDown : ArrowUpDown;
          const direction = next.direction === "ascending" ? (fr ? "ordre croissant" : "ascending") : (fr ? "ordre décroissant" : "descending");
          return <th key={key} scope="col" aria-sort={active ? sort.direction : undefined}>
            <button className={`folder-sort-button${active ? " is-active" : ""}`} type="button" onClick={() => onSortChange(next)} title={labels[language]} aria-label={fr ? `Trier par ${labels[language].toLowerCase()}, ${direction}` : `Sort by ${labels[language].toLowerCase()}, ${direction}`}>
              <span>{labels[language]}</span><Icon size={14} aria-hidden="true" />
            </button>
          </th>;
        })}</tr>
      </thead>
      <tbody>{folders.map((folder) => {
        const latestDate = folder.latest?.createdAt.trim();
        const validDate = latestDate !== undefined && folderLatestTime(folder) !== null;
        return <tr key={folder.key}>
        <td><button className="folder-directory-open" type="button" onClick={() => onOpen(folder.key)} aria-label={fr ? `Ouvrir le dossier ${folder.tripTitle}` : `Open folder ${folder.tripTitle}`}><Folder size={18} aria-hidden="true" /><span><strong title={folder.tripTitle}>{folder.tripTitle}</strong></span></button></td>
        <td className="folder-directory-contact"><span title={folder.clientName}>{folder.clientName}</span></td>
        <td className="folder-directory-count">{folder.sessions.length}</td>
        <td className="folder-directory-date">{validDate ? <time dateTime={latestDate}>{displayDate(latestDate, language)}</time> : <span>{folder.latest ? (fr ? "Date indisponible" : "Date unavailable") : (fr ? "À commencer" : "Not started")}</span>}</td>
      </tr>;
      })}</tbody>
    </table>
  );
}
