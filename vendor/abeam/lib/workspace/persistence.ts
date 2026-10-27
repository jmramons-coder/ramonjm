/** Only send columns whose value changed since the last successful write. */
export function changedRowFields<Row extends object>(
  row: Row,
  persisted: Row | undefined,
  excluded: readonly (keyof Row)[] = [],
): Partial<Row> {
  const changes: Partial<Row> = {};
  for (const key of Object.keys(row) as (keyof Row)[]) {
    if (excluded.includes(key)) continue;
    if (!persisted || (!Object.is(row[key], persisted[key]) && JSON.stringify(row[key]) !== JSON.stringify(persisted[key]))) {
      changes[key] = row[key];
    }
  }
  return changes;
}
