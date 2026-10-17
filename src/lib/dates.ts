// Due dates are calendar dates ("20 October"), not moments in time.
// Postgres stores them as DATE, and Prisma hands them over as a JS Date at
// midnight UTC. Everything here works in UTC on purpose, so "20 Oct" never
// turns into "19 Oct" for someone in another time zone.

/** "2026-10-20" → Date at 2026-10-20T00:00:00Z, for writing to a DATE column. */
export function dateOnlyToDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** A Date from a DATE column → "2026-10-20", for <input type="date"> and props. */
export function dateToDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** "2026-10-20" → "20 Oct" */
export function formatDateOnly(value: string): string {
  return dateOnlyToDate(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC", // without this, Los Angeles would see "19 Oct"
  });
}
