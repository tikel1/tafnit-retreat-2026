/**
 * Type contract for the Tafnit retreat companion app.
 *
 * Kept deliberately slim — this is a 2-day work retreat with one hotel,
 * three venues on the map, two chapters, and an evening mystery guest. Everything
 * the UI consumes flows through these shapes.
 */

export type VenueKind = "meeting" | "coffee" | "marina" | "hotel" | "spa";

export interface Venue {
  id: string;
  /** Display name in Hebrew. */
  name: string;
  kind: VenueKind;
  address?: string;
  /** [lat, lon] for the map. */
  coords: [number, number];
  description?: string;
  /** Path under `public/images/...` (always relative, never root-absolute). */
  image?: string;
  website?: string;
  phone?: string;
}

/** Activity icon id — drives the icon-chip on the activity pill. */
export type ActivityIcon =
  | "coffee"
  | "boat"
  | "hotel"
  | "spa"
  | "pool"
  | "dinner"
  | "mic"
  | "breakfast"
  | "farewell"
  | "meeting";

export interface DayActivity {
  /** "8:15", "9:00", "10:45". Optional for "evening" blocks without a hard time. */
  time?: string;
  title: string;
  description?: string;
  /** Links the activity row to a `Venue` (for tap-through). */
  venueId?: string;
  /** Drives the mint icon-chip. */
  icon?: ActivityIcon;
  /** Optional path under `public/images/` (e.g. "./images/boat.jpg") —
   *  shown as a thumbnail next to the activity pill on the detail page. */
  image?: string;
  /** When true, render with the MysteryGuestCard treatment instead of
   *  a normal activity pill (silhouette + "?" + playful copy). */
  isMystery?: boolean;
}

export interface Day {
  /** 1 or 2 — the only two chapters in the retreat. */
  dayNumber: 1 | 2;
  /** Local YYYY-MM-DD. */
  date: string;
  /** Hebrew weekday name (e.g. "חמישי"). */
  weekday: string;
  /** Short headline ("היום שבים", "השבת מתחילה"). */
  title: string;
  subtitle?: string;
  /** Fallback hero image if no activity in the day has one. */
  leadImage?: string;
  activities: DayActivity[];
  /** Per-day advice — e.g. "מה ללבוש לשייט". */
  dayTips?: string[];
}

/** Real, on-the-record info for Via LOMAH Spa (from danhotels.co.il).
 *  Used both in the StaysSection sub-card and as ground-truth context
 *  for the AI host's system prompt. */
export interface Spa {
  id: string;
  name: string;
  hotelId: string;
  hours: string;
  phone: string;
  whatsapp?: string;
  rooms: number;
  highlights: string[];
  ageLimitNote?: string;
  image?: string;
}

export interface Stay extends Venue {
  kind: "hotel";
  /** Local ISO-like "YYYY-MM-DDTHH:mm". */
  checkIn: string;
  checkOut: string;
  highlights: string[];
  warnings?: string[];
  /** Links to the spa entry in `spa.ts` so the StaysSection can render
   *  the expanded Via LOMAH sub-card. */
  spaId?: string;
}

export interface Tip {
  id: string;
  title: string;
  body: string;
  severity: "info" | "warning";
  /** Optional CTA link — `tel:`, `https:`, or `mailto:`. */
  link?: string;
  /** Label for the link button. */
  linkLabel?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  detail?: string;
}
