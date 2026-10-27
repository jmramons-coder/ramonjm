"use client";

import type { UILanguage } from "@/lib/ui/language";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { today } from "@internationalized/date";
import { useSyncExternalStore } from "react";
import { DatePicker, DateInput, DateSegment, Group, Label, Text, FieldError, Button, Popover, Calendar, CalendarGrid, CalendarGridHeader, CalendarGridBody, CalendarHeaderCell, CalendarCell, type DatePickerState } from "react-aria-components/DatePicker";
import { CalendarMonthPicker, CalendarYearPicker, type CalendarMonthPickerAria } from "react-aria-components/Calendar";
import { Dialog, Modal, ModalOverlay } from "react-aria-components/Modal";
import { Select, SelectValue, ListBox, ListBoxItem } from "react-aria-components/Select";

import { dateOnlyError, parseDateOnly } from "@/lib/ui/date-field";

export type DateFieldProps = {
  name: string;
  label: string;
  language: UILanguage;
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  description?: string;
  className?: string;
};

const MOBILE_CALENDAR = "(max-width: 800px)";
function subscribeToViewport(listener: () => void) {
  const media = window.matchMedia(MOBILE_CALENDAR);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
const mobileSnapshot = () => window.matchMedia(MOBILE_CALENDAR).matches;
const serverSnapshot = () => false;

function CalendarPeriodSelect({ items, className, ...props }: CalendarMonthPickerAria & { className: string }) {
  return <Select {...props} className={className}>
    <Button className="ui-select-trigger ui-calendar-period-trigger ui-calendar-period-button"><SelectValue className="ui-select-value" /><ChevronDown size={14} aria-hidden="true" /></Button>
    <Popover className="ui-popover ui-calendar-period-popover" placement="bottom start" offset={5}>
      <ListBox className="ui-listbox" items={items}>{(item) => <ListBoxItem className="ui-listbox-item" id={item.id} textValue={item.formatted}>{item.formatted}</ListBoxItem>}</ListBox>
    </Popover>
  </Select>;
}

function CalendarContent({ label, language, state, minDate, maxDate }: { label: string; language: UILanguage; state: DatePickerState; minDate?: string; maxDate?: string }) {
  const fr = language === "fr";
  const utcToday = today("UTC");
  return <Dialog className="ui-date-dialog" lang={language} aria-label={label}>
    <Calendar className="ui-calendar" aria-label={label}>
      <header className="ui-calendar-header">
        <Button className="ui-calendar-nav" slot="previous" aria-label={fr ? "Mois précédent" : "Previous month"}><ChevronLeft size={17} aria-hidden="true" /></Button>
        <CalendarMonthPicker format="long">{(props) => <CalendarPeriodSelect {...props} className="ui-calendar-month" />}</CalendarMonthPicker>
        <CalendarYearPicker visibleYears={40}>{(props) => <CalendarPeriodSelect {...props} className="ui-calendar-year" />}</CalendarYearPicker>
        <Button className="ui-calendar-nav" slot="next" aria-label={fr ? "Mois suivant" : "Next month"}><ChevronRight size={17} aria-hidden="true" /></Button>
      </header>
      <CalendarGrid className="ui-calendar-grid" weekdayStyle="short">
        <CalendarGridHeader>{(day) => <CalendarHeaderCell className="ui-calendar-weekday">{day}</CalendarHeaderCell>}</CalendarGridHeader>
        <CalendarGridBody>{(date) => <CalendarCell className="ui-calendar-cell" date={date} />}</CalendarGridBody>
      </CalendarGrid>
    </Calendar>
    <footer className="ui-calendar-footer">
      <Button className="ui-calendar-clear ui-calendar-today" slot={null} isDisabled={Boolean(dateOnlyError(utcToday.toString(), { minDate, maxDate }))} onPress={() => { state.setValue(utcToday); state.close(); }}>{fr ? "Aujourd’hui" : "Today"}</Button>
      <Button className="ui-calendar-clear" slot={null} onPress={() => { state.setValue(null); state.close(); }}>{fr ? "Effacer" : "Clear"}</Button>
      <Button className="ui-calendar-close" slot={null} onPress={() => state.close()}>{fr ? "Fermer" : "Close"}</Button>
    </footer>
  </Dialog>;
}

/** Use beneath the app's Gregorian I18nProvider; owns its visible label/errors. */
export function DateField({ name, label, language, value, onChange, minDate, maxDate, required = false, disabled = false, error, description, className = "" }: DateFieldProps) {
  const fr = language === "fr";
  const mobile = useSyncExternalStore(subscribeToViewport, mobileSnapshot, serverSnapshot);
  const date = parseDateOnly(value);
  const minimum = parseDateOnly(minDate);
  const maximum = parseDateOnly(maxDate);
  const invalidISO = dateOnlyError(value) === "invalid";
  const boundaryLabel = (boundary: string | undefined) => {
    const parsed = parseDateOnly(boundary);
    return parsed ? new Intl.DateTimeFormat(fr ? "fr-CA" : "en-CA", { dateStyle: "medium", timeZone: "UTC" }).format(parsed.toDate("UTC")) : "";
  };

  return <DatePicker className={`ui-field ui-date-field ${className}`.trim()} data-search-field={name} data-date-field={name}
    name={name} value={date} onChange={(next) => onChange(next?.toString() ?? "")} granularity="day" shouldForceLeadingZeros
    minValue={minimum ?? undefined} maxValue={maximum ?? undefined} isRequired={required} isDisabled={disabled}
    isInvalid={error || invalidISO ? true : undefined} validationBehavior="native" shouldCloseOnSelect>
    {({ state }) => <>
      <Label className="ui-field-label"><span>{label}</span></Label>
      <Group className="ui-control ui-date-control">
        <DateInput className="ui-date-input">{(segment) => <DateSegment className="ui-date-segment" data-ui-input={segment.isEditable ? true : undefined} segment={segment} />}</DateInput>
        <Button className="ui-date-trigger" aria-label={`${label} : ${fr ? "ouvrir le calendrier" : "open calendar"}`}><CalendarDays size={17} strokeWidth={1.7} aria-hidden="true" /></Button>
      </Group>
      {description ? <Text className="ui-field-description" slot="description">{description}</Text> : null}
      <FieldError className="ui-field-error">{({ validationDetails }) => error
        || (invalidISO ? (fr ? "Choisissez une date valide." : "Choose a valid date.")
          : validationDetails.valueMissing ? (fr ? "Choisissez une date." : "Choose a date.")
            : validationDetails.rangeUnderflow ? (fr ? `Choisissez une date à partir du ${boundaryLabel(minDate)}.` : `Choose a date on or after ${boundaryLabel(minDate)}.`)
              : validationDetails.rangeOverflow ? (fr ? `Choisissez une date au plus tard le ${boundaryLabel(maxDate)}.` : `Choose a date on or before ${boundaryLabel(maxDate)}.`)
                : (fr ? "Complétez la date." : "Complete the date."))}</FieldError>
      {mobile ? <ModalOverlay className="ui-date-backdrop" isDismissable><Modal className="ui-popover ui-date-popover"><CalendarContent label={label} language={language} state={state} minDate={minDate} maxDate={maxDate} /></Modal></ModalOverlay>
        : <Popover className="ui-popover ui-date-popover" placement="bottom start" offset={8}><CalendarContent label={label} language={language} state={state} minDate={minDate} maxDate={maxDate} /></Popover>}
    </>}
  </DatePicker>;
}

export default DateField;
