import type { ReactNode } from "react";
import { ChevronRight, MessagesSquare } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  date: string;
  status: ReactNode;
  showChevron?: boolean;
  onOpen: () => void;
};

export default function RecentConversationItem({ title, subtitle, date, status, showChevron = false, onOpen }: Props) {
  return (
    <button className={`home-conversation-row home-conversation-item${showChevron ? " has-chevron" : ""}`} type="button" onClick={onOpen}>
      <span className="home-conversation-asset" aria-hidden="true"><MessagesSquare className="workspace-icon" size={18} strokeWidth={1.6} /></span>
      <span className="home-conversation-copy">
        <strong className="home-conversation-title" title={title}>{title}</strong>
        <span className="home-conversation-status">{status}</span>
        <small className="home-conversation-subtitle" title={subtitle}>{subtitle}</small>
        <span className="home-conversation-date">{date}</span>
      </span>
      {showChevron ? <ChevronRight className="home-conversation-chevron" size={16} strokeWidth={1.6} aria-hidden="true" /> : null}
    </button>
  );
}
