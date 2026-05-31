import type { Day } from "./types";
import { assetUrl } from "../lib/assets";

/**
 * The two-chapter itinerary for the Tafnit 2026 company retreat.
 *
 *   Day 1 — Thursday, 4 June 2026
 *     8:15 מפגש בעזריאלי
 *     09:00 עגלת קפה — מיקא
 *     10:45 שייט מהמרינה בהרצליה
 *     ~15:00 הגעה למלון דן תל אביב
 *     אחה"צ/ערב: בריכה · ספא Via LOMAH · ארוחת ערב · אומן אורח (הפתעה)
 *
 *   Day 2 — Friday, 5 June 2026
 *     ארוחת בוקר · טיפולים · בריכה
 *     12:30 שיחת פרידה · שבת שלום
 *
 * The 4 June evening "אומן אורח" activity is flagged `isMystery: true`
 * so the UI renders it with the MysteryGuestCard treatment (silhouette
 * + "?" + "אל תספיילרו 🤫" footnote). The AI host's system prompt has a
 * hard guardrail to never reveal or guess who the artist is.
 */

export const TRIP_START = "2026-06-04";
export const TRIP_END = "2026-06-05";

export const itinerary: Day[] = [
  {
    dayNumber: 1,
    date: "2026-06-04",
    weekday: "חמישי",
    title: "יוצאים לים",
    subtitle: "מפגש בעזריאלי · שייט מהמרינה · ערב חגיגי במלון דן",
    leadImage: assetUrl("images/sailing-hero.jpg"),
    activities: [
      {
        time: "8:15",
        title: "מפגש בעזריאלי",
        description:
          "מתאספים במשרד שלנו בעזריאלי ויוצאים מכאן יחד ליום הנופש.",
        venueId: "azrieli",
        icon: "meeting",
        image: assetUrl("images/azrieli.jpg"),
      },
      {
        time: "09:00",
        title: "עגלת קפה — מיקא",
        description:
          "מיקא מארחת אותנו עם עגלת קפה במשתלת ירוק ישראלי ברמת השרון — רגע טעים לפתיחת יום הנופש.",
        venueId: "mika-coffee",
        icon: "coffee",
        image: assetUrl("images/coffee-cart.jpg"),
      },
      {
        time: "10:45",
        title: "שייט מהמרינה בהרצליה",
        description:
          "יוצאים לשייט מפנק לאורך החוף — שמש, בריזה טובה, מוזיקה ומבט חדש ומרהיב על קו הרקיע.",
        venueId: "marina-herzliya",
        icon: "boat",
        image: assetUrl("images/sailing-deck.jpg"),
      },
      {
        time: "~15:00",
        title: "הגעה למלון דן תל אביב",
        description:
          "עושים צ'ק-אין במלון, מתארגנים בחדרים, מחליפים בגדים — ומכאן הקצב רק עולה.",
        venueId: "dan-tel-aviv",
        icon: "hotel",
        image: assetUrl("images/dan-tel-aviv.jpg"),
      },
      {
        title: "אחר הצהריים — בריכה",
        description:
          "שתי בריכות מול נוף פתוח לים: בריכת מי מלח חיצונית ובריכה פנימית מקורה ומחוממת.",
        icon: "pool",
        image: assetUrl("images/pool.jpg"),
      },
      {
        title: "טיפולים בספא Via LOMAH",
        description:
          "חדרי טיפולים יוקרתיים, עיסויים של 45 דקות בשילוב שמנים ארץ-ישראליים מובחרים, וחליטת צמחים חמה לסיום.",
        icon: "spa",
        image: assetUrl("images/via-lomah-spa.jpg"),
      },
      {
        title: "ארוחת ערב חגיגית",
        description:
          "ארוחת ערב במלון — מתיישבים כולם יחד לחגוג את הביחד שלנו ואת סופו של רבעון מצוין.",
        icon: "dinner",
        image: assetUrl("images/dinner.jpg"),
      },
      {
        title: "אומן אורח — הפתעה",
        description:
          "בערב, מיד אחרי הארוחה, נארח אומן מיוחד במינו. שמרנו את ההפתעה לסוף — מבטיחים שיהיה שווה!",
        icon: "mic",
        isMystery: true,
      },
    ],
    dayTips: [
      "לוקחים בגד ים, חולצה דקה לשייט וקרם הגנה מעל 30 SPF",
      "לארוחת הערב והופעה — תבואו חגיגיים ויפים.",
    ],
  },
  {
    dayNumber: 2,
    date: "2026-06-05",
    weekday: "שישי",
    title: "בוקר רגוע · שבת שלום",
    subtitle: "ארוחת בוקר · טיפולים · בריכה · שיחת פרידה",
    leadImage: assetUrl("images/dan-tel-aviv.jpg"),
    activities: [
      {
        title: "ארוחת בוקר במלון",
        description:
          "ארוחת בוקר ישראלית עשירה ומגוונת מול נוף מרהיב לים. פותחים את שישי ברוגע מוחלט.",
        icon: "breakfast",
        image: assetUrl("images/breakfast.jpg"),
      },
      {
        title: "טיפולים בספא",
        description:
          "למי שרוצה להספיק עוד רגע של רוגע — טיפולים ב-Via LOMAH לפני שמתפזרים.",
        icon: "spa",
        image: assetUrl("images/via-lomah-spa.jpg"),
      },
      {
        title: "בריכה ושעה חופשית",
        description:
          "זמן חופשי אחרון ליהנות מהבריכה ומהשמש לפני האריזות והצ'ק-אאוט.",
        icon: "pool",
        image: assetUrl("images/pool.jpg"),
      },
      {
        time: "12:30",
        title: "שיחת פרידה · שבת שלום",
        description:
          "מתכנסים לשיחת סיכום ופרידה קצרה, מודים זה לזה ויוצאים הביתה בנחת, מספיק זמן לפני כניסת השבת.",
        icon: "farewell",
        image: assetUrl("images/tel-aviv-skyline.jpg"),
      },
    ],
    dayTips: [
      "שימו לב: פינוי החדרים (צ'ק-אאוט) הוא עד השעה 12:00. מומלץ להתארגן בבוקר ולהפקיד את המזוודות לשמירה בלובי.",
      "כניסת השבת בתל אביב (יום שישי, 5 ביוני 2026) היא ב-19:24. שחרור החדרים המוקדם משאיר לנו שפע של זמן להגיע הביתה ברוגע.",
    ],
  },
];

export function getDay(dayNumber: 1 | 2): Day {
  return itinerary[dayNumber - 1];
}
