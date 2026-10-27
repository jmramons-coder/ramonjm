"use client";

import type { UILanguage } from "@/lib/ui/language";
import { ArrowLeft, Check, Search, X } from "lucide-react";
import { useRef } from "react";
import { flushSync } from "react-dom";
import { Button, Dialog, Modal, ModalOverlay } from "react-aria-components/Modal";
import { ListBox, ListBoxItem, Text } from "react-aria-components/ListBox";
import { useFilter } from "react-aria-components/ComboBox";
import { useSearchViewport } from "@/app/hooks/useSearchViewport";
import type { AirportOption } from "./SearchFields";

type Props = {
  id: string;
  label: string;
  language: UILanguage;
  value: string;
  options: AirportOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (query: string) => void;
  typing: boolean;
  onTypingChange: (typing: boolean) => void;
  onSelect: (code: string) => void;
};

/** Selection-only entry; typing and custom codes require an explicit user action. */
export default function MobileAirportPicker({ id, label, language, value, options, open, onOpenChange, query, onQueryChange, typing, onTypingChange, onSelect }: Props) {
  const fr = language === "fr";
  const inputRef = useRef<HTMLInputElement>(null);
  const listActionRef = useRef<HTMLButtonElement>(null);
  const viewportRef = useSearchViewport();
  const { contains } = useFilter({ sensitivity: "base" });
  const filter = typing ? query.trim() : "";
  const items = options.filter((option) => !filter || contains(option.label, filter) || contains(option.code, filter));
  const selected = options.find((option) => option.code === value.toUpperCase())?.code;
  const manualCode = typing && /^[A-Za-z]{3}$/.test(query.trim()) ? query.trim().toUpperCase() : "";
  const beginTyping = () => {
    // Same user gesture focus is needed for iOS keyboard activation. No input
    // receives autoFocus when opening the picker or restoring a selection.
    flushSync(() => {
      if (!query && value && !selected) onQueryChange(value);
      onTypingChange(true);
    });
    inputRef.current?.focus({ preventScroll: true });
  };
  const backToList = () => {
    inputRef.current?.blur();
    flushSync(() => onTypingChange(false));
    listActionRef.current?.focus({ preventScroll: true });
  };

  return <ModalOverlay className="ui-airport-picker-overlay" ref={viewportRef} isOpen={open} isDismissable onOpenChange={onOpenChange}>
    <Modal className="ui-airport-picker-modal"><Dialog id={id} lang={language} className="ui-airport-picker-dialog" aria-labelledby={`${id}-title`}>
      <header className="ui-airport-picker-header">{typing ? <Button className="ui-airport-picker-back" type="button" onPress={backToList} aria-label={fr ? "Revenir à la liste des aéroports" : "Back to airport list"}><ArrowLeft size={20} aria-hidden="true" /></Button> : null}<h2 id={`${id}-title`}>{label}</h2><Button className="ui-airport-picker-close" autoFocus type="button" onPress={() => onOpenChange(false)} aria-label={fr ? "Fermer les aéroports" : "Close airports"}><X size={20} aria-hidden="true" /></Button></header>
      <div className="ui-airport-picker-search">
        {typing ? <>
          <label className="ui-airport-picker-search-label" id={`${id}-query-label`} htmlFor={`${id}-query`}>{fr ? "Ville ou code à trois lettres" : "City or three-letter code"}</label>
          <div className="ui-control ui-airport-picker-search-control"><Search className="ui-control-icon" size={17} aria-hidden="true" /><input id={`${id}-query`} ref={inputRef} className="ui-airport-picker-input" type="search" aria-labelledby={`${id}-query-label`} value={query} onChange={(event) => onQueryChange(event.target.value)} maxLength={80} autoComplete="off" autoCorrect="off" autoCapitalize="characters" spellCheck={false} enterKeyHint="done" onKeyDown={(event) => { if (event.key === "Enter") { event.stopPropagation(); if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return; event.preventDefault(); if (manualCode) onSelect(manualCode); } }} /></div>
        </> : <Button ref={listActionRef} className="ui-airport-picker-search-action" type="button" onPress={beginTyping}><Search size={18} aria-hidden="true" /><span>{fr ? "Rechercher ou saisir un code" : "Search or enter a code"}</span></Button>}
      </div>
      <div className="ui-airport-picker-results"><ListBox<AirportOption> className="ui-options-list ui-airport-picker-list" aria-label={fr ? "Aéroports disponibles" : "Available airports"} items={items} selectionMode="single" selectionBehavior="toggle" selectedKeys={selected ? [selected] : []} escapeKeyBehavior="none"
        renderEmptyState={() => <div className="ui-options-empty">{fr ? "Aucun aéroport dans cette liste. Vous pouvez saisir un code à trois lettres." : "No airport in this list. You can enter a three-letter code."}</div>}>
        {(option) => <ListBoxItem id={option.code} textValue={`${option.label} ${option.code}`} className="ui-option ui-airport-picker-option" onPress={() => onSelect(option.code)}>{({ isSelected }) => <><Text slot="label" className="ui-option-label">{option.label}</Text><Text slot="description" className="ui-option-code">{option.code}</Text><span className="ui-option-check" aria-hidden="true">{isSelected ? <Check size={16} /> : null}</span></>}</ListBoxItem>}
      </ListBox></div>
      <footer className="ui-airport-picker-footer"><Button className="ui-airport-picker-clear" type="button" onPress={() => onSelect("")}>{fr ? "Effacer" : "Clear"}</Button>{manualCode ? <Button className="ui-airport-picker-apply" type="button" onPress={() => onSelect(manualCode)}>{fr ? `Utiliser ${manualCode}` : `Use ${manualCode}`}</Button> : <Button className="ui-airport-picker-done" type="button" onPress={() => onOpenChange(false)}>{fr ? "Terminer" : "Done"}</Button>}</footer>
    </Dialog></Modal>
  </ModalOverlay>;
}
