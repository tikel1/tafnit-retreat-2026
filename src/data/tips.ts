import type { Tip } from "./types";

/**
 * The handful of practical tips that earn a spot on the home page.
 * Severity drives the chip color (`info` = mint, `warning` = sun).
 *
 * Tips with a `link` get a small CTA button beside them — used here
 * for the spa booking phone and the hotel switchboard.
 */
export const tips: Tip[] = [
  {
    id: "parking",
    title: "חנייה ועזריאלי",
    body: "החנייה במגדלי עזריאלי היא בתשלום. מומלץ להגיע ברכבת ישראל (תחנת השלום הסמוכה), ברכבת הקלה, או להשתלב בטרמפים. זכרו: נקודת המפגש היא ב-08:30 ויוצאים לדרך ב-09:00 בדיוק!",
    severity: "info",
  },
  {
    id: "spa-booking",
    title: "להזמין טיפול ספא מראש",
    body: "ספא Via LOMAH הוא ספא בוטיק אינטימי הכולל 4 חדרי טיפולים בלבד. מומלץ בחום לתאם טיפול טלפונית או בוואטסאפ מראש, כדי להבטיח לעצמכם חלון זמן מושלם בין הבריכה לארוחת הערב.",
    severity: "warning",
    link: "tel:0548608888",
    linkLabel: "התקשרו עכשיו",
  },
  {
    id: "spa-age",
    title: "כניסה לספא מגיל 18",
    body: "הטיפולים והכניסה למתחם הספא מותרים מגיל 18 ומעלה. מהבריכה הראשית והמפנקת של המלון ניתן ליהנות בכל גיל.",
    severity: "info",
  },
  {
    id: "boat-attire",
    title: "מה ללבוש לשייט",
    body: "מומלץ להגיע לשייט עם בגד ים מתחת לבגדים, חולצה קלילה, כובע, משקפי שמש וקרם הגנה. שימו לב שהסיפון עלול להיות לח, ולכן סנדלים נוחים שמתייבשים מהר עדיפים על נעליים סגורות.",
    severity: "info",
  },
  {
    id: "dress-code",
    title: "ערב חגיגי — סמארט-קז'ואל",
    body: "אין קוד לבוש (Dress Code) נוקשה לארוחת הערב ולהופעה, אך זו הזדמנות מעולה ללבוש חולצה יפה או שמלה קלילה. העיקר שיהיה לכם נוח לרקוד ולחגוג!",
    severity: "info",
  },
  {
    id: "shabbat",
    title: "כניסת השבת",
    body: "פינוי החדרים (צ'ק-אאוט) הוא עד השעה 12:00, ולאחר מכן נתכנס לשיחת פרידה ב-12:30. כניסת השבת בתל אביב היא ב-19:24, כך שיש שפע של זמן לחזור הביתה בנחת וברוגע.",
    severity: "warning",
  },
];
