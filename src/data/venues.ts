import type { Venue } from "./types";
import { assetUrl } from "../lib/assets";

/**
 * The three physical venues that anchor the retreat:
 *   1. עזריאלי — Thursday morning meeting at the office.
 *   2. מרינה הרצליה — boat departure pier.
 *   3. מלון דן תל אביב — overnight stay, Via LOMAH Spa, pool, dinner, performance.
 *
 * Coordinates are real and used directly by `MapView` markers.
 */
export const venues: Venue[] = [
  {
    id: "azrieli",
    name: "מרכז עזריאלי",
    kind: "meeting",
    address: "דרך מנחם בגין 132, תל אביב",
    coords: [32.0744, 34.7919],
    description:
      "המשרד שלנו — בבוקר חמישי, 08:30, מתאספים ויוצאים יחד לכיוון המרינה.",
    image: assetUrl("images/azrieli.jpg"),
    website: "https://www.azrieli.com/centers/tel-aviv-center/",
  },
  {
    id: "marina-herzliya",
    name: "מרינה הרצליה",
    kind: "marina",
    address: "המעגן 1, הרצליה",
    coords: [32.1640, 34.7942],
    description:
      "נמל היאכטות של הרצליה — מכאן יוצאים לשייט המפנק ב-10:45.",
    image: assetUrl("images/marina-herzliya.jpg"),
    website: "https://herzliyamarina.co.il/",
  },
  {
    id: "dan-tel-aviv",
    name: "מלון דן תל אביב",
    kind: "hotel",
    address: "הירקון 99, תל אביב",
    coords: [32.0844, 34.7679],
    description:
      "המלון הראשון של רשת דן. שתי בריכות עם נוף לים, ספא Via LOMAH, חוף פרטי וחדר כושר.",
    image: assetUrl("images/dan-tel-aviv.jpg"),
    website: "https://www.danhotels.co.il/TelAvivHotels/DanTelAvivHotel",
    phone: "+972-3-5202525",
  },
];

export function getVenue(id: string): Venue | undefined {
  return venues.find((v) => v.id === id);
}
