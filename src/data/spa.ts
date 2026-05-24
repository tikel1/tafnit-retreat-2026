import type { Spa } from "./types";
import { assetUrl } from "../lib/assets";

/**
 * Via LOMAH Spa — the in-hotel spa at Dan Tel Aviv.
 *
 * All facts here are sourced verbatim from the official Dan Hotels page:
 *   https://www.danhotels.co.il/TelAvivHotels/DanTelAvivHotel/BusinessServices
 *
 * The same block is referenced in the AI host's system prompt so chat
 * answers about the spa stay consistent with what the StaysSection
 * sub-card shows on screen.
 */
export const viaLomahSpa: Spa = {
  id: "via-lomah",
  name: "Via LOMAH Spa",
  hotelId: "dan-tel-aviv",
  hours: "9:00 – 21:00 (כפוף לשינוי)",
  phone: "054-860-88-88",
  whatsapp: "https://wa.me/972548608888",
  rooms: 4,
  highlights: [
    "נוף פנורמי לחוף תל אביב",
    "ארבעה חדרי טיפולים — מתאימים גם לטיפולים זוגיים",
    "עיסויים מותאמים אישית מ-60 דקות ומעלה",
    "עיסויי הריון עם מטפלים שהוכשרו במיוחד וציוד ייעודי",
    "שמנים ארץ-ישראליים מובחרים",
    "תה קר בכניסה · נשנושים וחליטת צמחים חמה לאחר העיסוי",
    "ניתן לשלב טיפול עם ארוחת בוקר/צהריים וכניסה למתחם הבריכות",
  ],
  bookingNote:
    "מומלץ להזמין טיפול מראש כדי לתפוס את החלון שמתאים לכם בין הבריכה לארוחת הערב. אפשר גם בוואטסאפ.",
  ageLimitNote: "הכניסה לספא מגיל 18 ומעלה.",
  image: assetUrl("images/via-lomah-spa.jpg"),
};
