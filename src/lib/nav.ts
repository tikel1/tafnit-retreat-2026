/**
 * Place-aware deep links to Google Maps and Waze. Same idea as tuscany's
 * helper: prefer to open the place's listing (card with photos, hours,
 * reviews, "Directions" button) instead of jumping straight into nav.
 */

export interface NavTarget {
  /** Place name (used in the search query). */
  name: string;
  /** Lat, lon. Used when no name is available. */
  coords: [number, number];
  /** Optional street address. Sharpens the search; we fall back to
   *  "<name>, Israel" if absent. */
  address?: string;
}

function buildSearchQuery(target: NavTarget): string {
  const trimmedName = target.name.trim();
  const addr = target.address?.trim();
  return addr ? `${trimmedName}, ${addr}` : `${trimmedName}, Israel`;
}

export function googleMapsPlaceUrl(target: NavTarget | [number, number]): string {
  if (Array.isArray(target)) {
    const [lat, lon] = target;
    return `https://www.google.com/maps/?q=${lat},${lon}`;
  }
  const query = encodeURIComponent(buildSearchQuery(target));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function wazePlaceUrl(target: NavTarget | [number, number]): string {
  if (Array.isArray(target)) {
    const [lat, lon] = target;
    return `https://waze.com/ul?ll=${lat},${lon}&navigate=no`;
  }
  const query = encodeURIComponent(buildSearchQuery(target));
  return `https://waze.com/ul?q=${query}&navigate=no`;
}

/* Date / scroll helpers reused by the chapter pages. */

const HE_MONTHS = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר"
];

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ב${HE_MONTHS[m - 1]} ${y}`;
}

export function formatDateShort(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  if (!m || !d) return iso;
  return `${d} ${HE_MONTHS[m - 1].slice(0, 3)}`;
}

export function scrollToId(id: string): void {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}
