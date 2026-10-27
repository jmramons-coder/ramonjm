import { ArrowRight, MessagesSquare } from "lucide-react";
import type { UILanguage } from "@/lib/ui/language";
import "./folder-inbox.css";

type Props = { count: number; language: UILanguage; onOpen: () => void };

export default function UnassignedConversationBanner({ count, language, onOpen }: Props) {
  if (count < 1) return null;
  const fr = language === "fr";
  const title = fr
    ? `${count} ${count === 1 ? "conversation à classer" : "conversations à classer"}`
    : `${count} unassigned ${count === 1 ? "conversation" : "conversations"}`;
  return <button type="button" className="folder-inbox-banner" onClick={onOpen}>
    <MessagesSquare size={20} strokeWidth={1.7} aria-hidden="true" />
    <span><strong>{title}</strong><small>{fr ? "Retrouvez vos échanges pour les classer ou les supprimer." : "Review your saved recordings to file or delete them."}</small></span>
    <ArrowRight size={18} aria-hidden="true" />
  </button>;
}
