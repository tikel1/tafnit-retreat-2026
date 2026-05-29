import type { Tip } from "./types";

/**
 * The handful of practical tips that earn a spot on the home page.
 * Severity drives the chip color (`info` = mint, `warning` = sun).
 *
 * Tips with a `link` get a small CTA button beside them.
 */
export const tips: Tip[] = [
  {
    id: "boat-attire",
    title: "מה ללבוש לשייט",
    body: "מומלץ להגיע לשייט עם בגד ים מתחת לבגדים, חולצה קלילה, כובע, משקפי שמש וקרם הגנה. שימו לב שהסיפון עלול להיות לח, ולכן סנדלים נוחים שמתייבשים מהר עדיפים על נעליים סגורות.",
    severity: "info",
  },
  {
    id: "shabbat",
    title: "כניסת השבת",
    body: "פינוי החדרים (צ'ק-אאוט) הוא עד השעה 12:00, ולאחר מכן נתכנס לשיחת פרידה ב-12:30. כניסת השבת בתל אביב היא ב-19:24, כך שיש שפע של זמן לחזור הביתה בנחת וברוגע.",
    severity: "warning",
  },
];
