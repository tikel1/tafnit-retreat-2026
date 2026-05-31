import type { ChecklistItem } from "./types";

/**
 * Packing checklist for a 2-day retreat with a boat morning, a spa
 * afternoon, and a Friday morning by the pool. Persisted per-device
 * by ChecklistSection so toggling carries between sessions.
 */
export const checklist: ChecklistItem[] = [
  {
    id: "id",
    text: "תעודת זהות",
    detail: "חובה עבור הצ'ק-אין במלון ועבור העלייה לסירה.",
  },
  {
    id: "swimsuit",
    text: "בגד ים (או שניים)",
    detail: "אחד לשייט וליום הראשון, ואחד נוסף לבריכה ולספא.",
  },
  {
    id: "towel",
    text: "מגבת — לא חובה",
    detail: "המלון מספק מגבות בשפע לבריכה ולספא, אך אם אתם מעדיפים מגבת אישית משלכם – זה הזמן לארוז אותה.",
  },
  {
    id: "sun",
    text: "כובע, משקפי שמש וקרם הגנה 30+",
    detail: "השמש בלב ים חזקה במיוחד בשילוב הבריזה. מומלץ להימרח היטב לפני השייט ולחדש את ההגנה במהלכו.",
  },
  {
    id: "sandals",
    text: "סנדלים נוחים שמתייבשים מהר",
    detail: "נוח ובטיחותי יותר על הסיפון מאשר נעליים סגורות.",
  },
  {
    id: "comfy",
    text: "בגדים נוחים ליום שישי",
    detail: "בגדים נוחים ליום השני, אחרי הבריכה והספא, וכן לדרך הביתה.",
  },
  {
    id: "phone",
    text: "מטען לטלפון",
    detail: "כדי שתוכלו לצלם בלי סוף בשייט ובספא.",
  },
  {
    id: "meds",
    text: "תרופות אישיות / כדורים נגד מחלת ים",
    detail: "למי שנוטה לסבול מבחילות בים — מומלץ להצטייד בכדורים מתאימים וליטול אותם מראש. השייט צפוי להיות רגוע, אך עדיף להגיע מוכנים.",
  },
  {
    id: "good-mood",
    text: "מצב רוח טוב",
    detail: "באמת! דאגנו לכם להכל מ-א' ועד ת', כל מה שנשאר לכם זה להגיע וליהנות.",
  },
];
