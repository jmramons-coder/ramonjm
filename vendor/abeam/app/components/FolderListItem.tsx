import { ChevronRight, Folder } from "lucide-react";

type Props = {
  title: string;
  client: string;
  conversationCount: string;
  onOpen: () => void;
  variant?: "default" | "compact";
  tag?: string | null;
};

export default function FolderListItem({ title, client, conversationCount, onOpen, variant = "default", tag }: Props) {
  if (variant === "compact") {
    return (
      <button className="home-folder-row folder-list-item folder-list-item-compact" type="button" onClick={onOpen} aria-label={[...new Set([title, client, tag].filter(Boolean))].join(", ")}>
        <span className="home-list-asset" aria-hidden="true"><Folder className="workspace-icon" size={18} strokeWidth={1.6} /></span>
        <strong className="folder-list-name" title={title}>{title}</strong>
        {tag ? <span className="folder-list-tag">{tag}</span> : null}
      </button>
    );
  }
  return (
    <button className="home-folder-row folder-list-item" type="button" onClick={onOpen} aria-label={[title, client, conversationCount].filter(Boolean).join(", ")}>
      <span className="home-list-asset" aria-hidden="true"><Folder className="workspace-icon" size={20} strokeWidth={1.6} /></span>
      <span className="home-list-copy">
        <strong>{title}</strong>
        <small className="folder-list-details">
          {client ? <><span className="folder-list-client">{client}</span><span className="folder-list-separator" aria-hidden="true"> · </span></> : null}
          <span className="folder-list-count">{conversationCount}</span>
        </small>
      </span>
      <ChevronRight size={16} aria-hidden="true" />
    </button>
  );
}
