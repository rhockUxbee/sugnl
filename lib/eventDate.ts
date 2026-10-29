// An event stays "upcoming" for its whole day (Dutch time) and counts as past from the next day.
export function isEventPast(date: string, now: Date = new Date()): boolean {
  const today = now.toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" }); // YYYY-MM-DD
  return date < today;
}
