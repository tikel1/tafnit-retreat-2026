import type { Stay } from "./types";
import { venues } from "./venues";

const dan = venues.find((v) => v.id === "dan-tel-aviv")!;

/**
 * The one stay of the retreat — Dan Tel Aviv, one night.
 *
 * Highlights and the linked `spaId` drive the expanded sub-card in
 * `StaysSection` (pool + spa list, then the Via LOMAH details).
 */
export const stays: Stay[] = [
  {
    ...dan,
    kind: "hotel",
    checkIn: "2026-06-04T15:00",
    checkOut: "2026-06-05T12:00",
    spaId: "via-lomah",
    highlights: [
      "בריכת ים פתוחה ומלוחה עם נוף ים",
      "בריכה פנימית מחוממת",
      "סאונה יבשה וחדר כושר מאובזר",
      "ספא Via LOMAH — 4 חדרי טיפולים",
      "חוף תל אביב במרחק חציית כביש",
      "ארוחת בוקר עשירה במלון",
    ],
    warnings: [
      "צ׳ק-אין רשמי מהשעה 15:00 — אם מגיעים מהשייט מוקדם יותר אפשר להשאיר ציוד בלובי.",
      "החנייה במלון מופעלת על-ידי חברה חיצונית, כניסה מרחוב פרישמן פינת הירקון, בתשלום.",
    ],
  },
];

export function getStay(): Stay {
  return stays[0];
}
