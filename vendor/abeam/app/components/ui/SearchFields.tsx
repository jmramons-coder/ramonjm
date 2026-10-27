"use client";

import { Check, ChevronDown, Minus, Plus, X } from "lucide-react";
import { useId, useRef, useState, type InputHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { Button, ComboBox, FieldError, Input, Label, ListBox, ListBoxItem, Popover, Text, useFilter } from "react-aria-components/ComboBox";
import { useLocale } from "react-aria-components/I18nProvider";
import { Group, NumberField as AriaNumberField } from "react-aria-components/NumberField";
import { Select as AriaSelect, SelectValue } from "react-aria-components/Select";
import { TextField as AriaTextField } from "react-aria-components/TextField";
import MobileAirportPicker from "./MobileAirportPicker";

export type SearchFieldMetadata = {
  name: string;
  label: string;
  description?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
};

type ControlledStringField = SearchFieldMetadata & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export type ExplorerTextFieldProps = ControlledStringField & {
  maxLength?: number;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  type?: "text" | "search";
};
export type AirportOption = { code: string; label: string };
export type ExplorerAirportFieldProps = ControlledStringField & { options: AirportOption[]; mobile?: boolean };
export type SelectOption = { id: string; label: string };
export type ExplorerSelectFieldProps = ControlledStringField & { options: SelectOption[] };
export type ExplorerNumberFieldProps = ControlledStringField & { min?: number; max?: number; step?: number };

function FieldLabel({ label, hint }: Pick<SearchFieldMetadata, "label" | "hint">) {
  return <Label className="ui-field-label"><span>{label}</span>{hint ? <span className="ui-field-hint">{hint}</span> : null}</Label>;
}

function FieldHelp({ description, error, min, max, step, formatMessage, idPrefix }: Pick<SearchFieldMetadata, "description" | "error"> & { min?: number; max?: number; step?: number; formatMessage?: string; idPrefix?: string }) {
  const { locale } = useLocale();
  const fr = locale.toLowerCase().startsWith("fr");
  const number = (value: number) => new Intl.NumberFormat(locale).format(value);
  return <>{description ? <Text id={idPrefix ? `${idPrefix}-description` : undefined} slot="description" className="ui-field-description">{description}</Text> : null}<FieldError id={idPrefix ? `${idPrefix}-error` : undefined} className="ui-field-error">{({ validationDetails, validationErrors }) => {
    if (error) return error;
    if (validationDetails.valueMissing) return fr ? "Ce champ est requis." : "This field is required.";
    if (validationDetails.rangeUnderflow && min !== undefined) return fr ? `Entrez une valeur d’au moins ${number(min)}.` : `Enter a value of at least ${number(min)}.`;
    if (validationDetails.rangeOverflow && max !== undefined) return fr ? `Entrez une valeur d’au plus ${number(max)}.` : `Enter a value of at most ${number(max)}.`;
    if (validationDetails.badInput) return fr ? "Entrez un nombre valide." : "Enter a valid number.";
    if (validationDetails.stepMismatch) return step === 1 ? (fr ? "Entrez un nombre entier." : "Enter a whole number.")
      : step !== undefined ? (fr ? `Utilisez des incréments de ${number(step)}.` : `Use increments of ${number(step)}.`)
        : (fr ? "Vérifiez la précision de cette valeur." : "Check the precision of this value.");
    if (validationDetails.patternMismatch && formatMessage) return formatMessage;
    return validationErrors.join(" ");
  }}</FieldError></>;
}

// An absent server error must leave React Aria's native validation state intact.
function validationProps({ required, disabled, error }: SearchFieldMetadata) {
  return { isRequired: required, isDisabled: disabled, ...(error ? { isInvalid: true } : {}) };
}

export function ExplorerTextField(props: ExplorerTextFieldProps) {
  const { name, value, onChange, placeholder, maxLength, inputMode, type = "text" } = props;
  return <AriaTextField className="ui-field ui-text-field" data-search-field={name} name={name} value={value} onChange={onChange} maxLength={maxLength} inputMode={inputMode} type={type} autoComplete="off" {...validationProps(props)}>
    <FieldLabel {...props} />
    <div className="ui-control"><Input className="ui-input" data-ui-input placeholder={placeholder} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} enterKeyHint={type === "search" ? "search" : "next"} /></div>
    <FieldHelp {...props} />
  </AriaTextField>;
}

/** City text filters known choices; only an explicit choice writes its code. */
function DesktopAirportField(props: ExplorerAirportFieldProps) {
  const { name, value, onChange, options, placeholder } = props;
  const { contains } = useFilter({ sensitivity: "base" });
  const { locale } = useLocale();
  const fr = locale.toLowerCase().startsWith("fr");
  const formatMessage = fr ? "Choisissez un aéroport ou entrez son code à trois lettres." : "Choose an airport or enter a three-letter code.";
  const selection = options.find((option) => option.code === value.toUpperCase())?.code ?? null;
  return <ComboBox<AirportOption>
    className="ui-field ui-airport-field" data-search-field={name} name={name}
    defaultItems={options} defaultFilter={contains} value={selection} inputValue={value}
    onChange={(key) => { if (key !== null) onChange(String(key).toUpperCase()); }}
    onInputChange={(input) => onChange(input.toUpperCase())}
    allowsCustomValue allowsEmptyCollection menuTrigger="input"
    validate={({ inputValue }) => inputValue && !/^[A-Za-z]{3}$/.test(inputValue) ? formatMessage : null}
    {...validationProps(props)}>
    <FieldLabel {...props} />
    <div className="ui-control ui-airport-control">
      <Input className="ui-input ui-airport-input" data-ui-input placeholder={placeholder} pattern="[A-Za-z]{3}" maxLength={80} autoComplete="off" autoCorrect="off" autoCapitalize="characters" spellCheck={false} enterKeyHint="next" />
      <Button className="ui-control-button"><ChevronDown className="ui-control-icon" size={18} aria-hidden="true" /></Button>
    </div>
    <FieldHelp {...props} formatMessage={formatMessage} />
    <Popover className="ui-popover ui-options-popover ui-airport-popover" placement="bottom start" offset={6}>
      <ListBox<AirportOption> className="ui-options-list" renderEmptyState={() => <Text className="ui-options-empty">{fr ? "Aucun aéroport correspondant. Un code à trois lettres peut être saisi." : "No matching airport. You can enter a three-letter code."}</Text>}>
        {(option) => <ListBoxItem id={option.code} textValue={`${option.label} ${option.code}`} className="ui-option">
          {({ isSelected }) => <><Text slot="label" className="ui-option-label">{option.label}</Text><span className="ui-option-code">{option.code}</span><span className="ui-option-check" aria-hidden="true">{isSelected ? <Check size={15} /> : null}</span></>}
        </ListBoxItem>}
      </ListBox>
    </Popover>
  </ComboBox>;
}

function MobileAirportField(props: ExplorerAirportFieldProps) {
  const { name, value, onChange, options, placeholder, label, hint, description, required } = props;
  const { locale } = useLocale();
  const fr = locale.toLowerCase().startsWith("fr");
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const committedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.code === value.toUpperCase());
  const formatMessage = fr ? "Choisissez un aéroport ou entrez son code à trois lettres." : "Choose an airport or enter a three-letter code.";
  const select = (code: string) => {
    if (committedRef.current || (code !== "" && !/^[A-Za-z]{3}$/.test(code))) return;
    committedRef.current = true;
    onChange(code.toUpperCase());
    setOpen(false);
  };
  return <>
    <AriaTextField className="ui-field ui-airport-field ui-mobile-airport-field" data-search-field={name} name={name} value={value} onChange={onChange} aria-label={label} autoComplete="off"
      validate={(code) => code && !/^[A-Za-z]{3}$/.test(code) ? formatMessage : null} {...validationProps(props)}>
      {({ isInvalid, isDisabled }) => <>
        <label className="ui-field-label" id={`${id}-label`} htmlFor={`${id}-trigger`}><span>{label}</span>{hint ? <span className="ui-field-hint">{hint}</span> : null}</label>
        <Button id={`${id}-trigger`} ref={triggerRef} className="ui-control ui-select-control ui-airport-picker-trigger" data-ui-input type="button" isDisabled={isDisabled}
          aria-labelledby={`${id}-label ${id}-value`} aria-describedby={[required ? `${id}-required` : "", description ? `${id}-description` : "", isInvalid ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined}
          aria-invalid={isInvalid || undefined} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? `${id}-picker` : undefined}
          onPress={() => { committedRef.current = false; setTyping(false); triggerRef.current?.focus({ preventScroll: true }); setOpen(true); }}>
          <span id={`${id}-value`} className="ui-select-value" data-placeholder={!value || undefined}>{selected ? `${selected.label} · ${selected.code}` : value || placeholder || (fr ? "Choisir un aéroport" : "Choose an airport")}</span><ChevronDown className="ui-control-icon" size={18} aria-hidden="true" />
        </Button>
        {required ? <span id={`${id}-required`} className="sr-only">{fr ? "Champ requis." : "Required field."}</span> : null}
        {/* Enabled type=text retains native required/pattern validation. Hidden
            prevents focus/keyboard; the parent Form focuses the real trigger. */}
        <Input className="ui-airport-native-input" type="text" hidden aria-hidden="true" tabIndex={-1} pattern="[A-Za-z]{3}" maxLength={80} autoComplete="off" autoCorrect="off" autoCapitalize="characters" spellCheck={false} />
        <FieldHelp {...props} formatMessage={formatMessage} idPrefix={id} />
      </>}
    </AriaTextField>
    <MobileAirportPicker id={`${id}-picker`} label={label} language={fr ? "fr" : "en"} value={value} options={options} open={open} onOpenChange={setOpen} query={query} onQueryChange={setQuery} typing={typing} onTypingChange={setTyping} onSelect={select} />
  </>;
}

/** Mobile chooses first; desktop retains the searchable ComboBox. */
export function ExplorerAirportField(props: ExplorerAirportFieldProps) {
  return props.mobile ? <MobileAirportField {...props} /> : <DesktopAirportField {...props} />;
}

export function ExplorerSelectField(props: ExplorerSelectFieldProps) {
  const { name, value, onChange, options, placeholder, label } = props;
  const [open, setOpen] = useState(false);
  const { locale } = useLocale();
  const fr = locale.toLowerCase().startsWith("fr");
  const titleId = useId();
  return <AriaSelect<SelectOption>
    className="ui-field ui-select-field" data-search-field={name} name={name}
    value={value || null} onChange={(key) => onChange(key === null ? "" : String(key))}
    isOpen={open} onOpenChange={setOpen} placeholder={placeholder} {...validationProps(props)}>
    <FieldLabel {...props} />
    <Button className="ui-control ui-select-control" data-ui-input>
      <SelectValue className="ui-select-value" /><ChevronDown className="ui-control-icon" size={18} aria-hidden="true" />
    </Button>
    <FieldHelp {...props} />
    {open ? createPortal(<div className="ui-select-backdrop" aria-hidden="true" onPointerDown={() => setOpen(false)} />, document.body) : null}
    <Popover className="ui-popover ui-options-popover ui-select-popover" placement="bottom start" offset={6} aria-labelledby={titleId}>
      <div className="ui-select-sheet-header"><span className="ui-select-sheet-title" id={titleId}>{label}</span><Button className="ui-select-sheet-close" onPress={() => setOpen(false)} aria-label={fr ? "Fermer les options" : "Close options"}><X size={18} aria-hidden="true" /></Button></div>
      <ListBox className="ui-options-list" items={options}>
        {(option) => <ListBoxItem id={option.id} textValue={option.label} className="ui-option">
          {({ isSelected }) => <><Text slot="label" className="ui-option-label">{option.label}</Text><span className="ui-option-check" aria-hidden="true">{isSelected ? <Check size={15} /> : null}</span></>}
        </ListBoxItem>}
      </ListBox>
    </Popover>
  </AriaSelect>;
}

/** Empty fields remain empty until the advisor types or uses a step button. */
export function ExplorerNumberField(props: ExplorerNumberFieldProps) {
  const { name, value, onChange, min, max, step, placeholder } = props;
  const number = value.trim() === "" ? NaN : Number(value);
  return <AriaNumberField
    className="ui-field ui-number-field" data-search-field={name} name={name}
    value={Number.isFinite(number) ? number : NaN}
    onChange={(next) => onChange(Number.isFinite(next) ? String(next) : "")}
    minValue={min} maxValue={max} step={step} commitBehavior="validate" {...validationProps(props)}>
    <FieldLabel {...props} />
    <Group className="ui-control ui-number-control">
      <Button slot="decrement" className="ui-number-button"><Minus size={16} aria-hidden="true" /></Button>
      <Input className="ui-input ui-number-input" data-ui-input placeholder={placeholder} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} enterKeyHint="next" />
      <Button slot="increment" className="ui-number-button"><Plus size={16} aria-hidden="true" /></Button>
    </Group>
    <FieldHelp {...props} />
  </AriaNumberField>;
}
