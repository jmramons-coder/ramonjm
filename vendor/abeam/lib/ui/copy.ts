/** Matching keys and callable parameters in each supported interface language. */
type TranslatedCopy<Original extends Record<string, unknown>> = {
  [Key in keyof Original]: Original[Key] extends string ? string
    : Original[Key] extends (...args: infer Parameters) => unknown ? (...args: Parameters) => string
    : never;
};

/** Keep dictionaries local while making missing or mistyped translations a type error. */
export function defineBilingualCopy<const French extends Record<string, unknown>>(
  copy: { fr: French; en: TranslatedCopy<French> },
) {
  return copy;
}
