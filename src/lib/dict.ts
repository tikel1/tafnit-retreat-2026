/**
 * The full UI dictionary. Every visible string in the shell of the app
 * lives here, keyed by short identifiers. Hebrew-only — no language
 * switch — but we keep the `useT(key)` shape so ported tuscany
 * components don't need import surgery.
 *
 *   const t = useT();
 *   t("plan_eyebrow");        // "התוכנית · יום אחר יום"
 *   t("plan_chapter_x_of_y", { x: 1, y: 2 });  // "יום 1 / 2"
 */

export const DICT = {
  /* ---------- Brand / hero ---------- */
  brand: "נופש חברה - תפנית",
  brand_short: "נופש חברה - תפנית 26'",
  brand_year: "יוני 26'",
  brand_subtitle: "4-5 ביוני 2026",
  /* Magazine-style "by-line" shown under the masthead in the hero. */
  families_byline: "יומיים על קו החוף · תל אביב · הרצליה · 4-5 ביוני 2026",
  families_byline_mobile_1: "יומיים על קו החוף",
  families_byline_mobile_2: "4-5 ביוני 2026",
  /* Phase-specific lead lines (italic, above the centerpiece). */
  hero_before_lead: "סוף שבוע של פינוקים וחוויות",
  hero_today_lead: "היום בנופש",
  hero_tomorrow_lead: "מחר בנופש",
  hero_after_lead: "ככה זה היה",
  /* Smaller phase hints (italic, below the countdown). */
  hero_close_almost: "כמעט שם – לא לשכוח לארוז את בגד הים!",
  hero_one_week: "שבוע אחד לסוף שבוע בלתי נשכח · זה הזמן להזמין טיפול בספא",
  hero_one_month: "עוד מעט ממש! זמן מעולה לאשר השתתפות",
  hero_far: "מתחילים את הספירה לאחור",
  hero_after_title: "תודה שבאתם",
  hero_after_sub: "4 – 5 ביוני 2026 · נופש החברה של תפנית",
  hero_today_day: "יום",
  hero_tomorrow_day: "מחר",
  hero_of_two: "מתוך שניים",
  scroll_to_plan: "לתוכנית",
  cta_to_plan: "אל התוכנית",
  cta_to_map: "המפה של היומיים",

  /* ---------- Countdown ---------- */
  countdown_days: "ימים",
  countdown_day_one: "יום אחד",
  countdown_hours: "שעות",
  countdown_minutes: "דקות",
  countdown_seconds: "שניות",
  countdown_until: "עד הנופש",
  countdown_starts_now: "התחלנו!",
  countdown_today: "היום!",

  /* ---------- Navbar ---------- */
  nav_plan: "תוכנית",
  nav_map: "מפה",
  nav_stay: "מלון",
  nav_tips: "טיפים",
  nav_pack: "אריזה",
  nav_more: "עוד",
  nav_chat: "ChatTFNT",

  /* ---------- Badges ---------- */
  badge_today: "היום",
  badge_day_n: "יום {n}",
  badge_d_until: "{n} ימים",

  /* ---------- Itinerary section ---------- */
  plan_eyebrow: "התוכנית · יום אחר יום",
  plan_title: "מה בתוכנית",
  plan_kicker: "יומיים של חוויות ורגעים יפים · החליקו ביניהם או לחצו לקריאה מלאה",
  plan_chapter_x_of_y: "יום {x} / {y}",
  read_more: "קראו עוד",
  hide_details: "הסתר פרטים",

  /* ---------- Chapter detail ---------- */
  back_to_plan: "חזרה לתוכנית",
  todays_plan: "התוכנית של היום",
  hour_by_hour: "שעה אחרי שעה",
  on_the_map: "על המפה",
  things_to_know: "טוב לדעת",
  tips_for_chapter: "טיפים ליום הזה",
  previous: "קודם",
  next: "הבא",

  /* ---------- Severity ---------- */
  severity_warning: "שימו לב",
  severity_info: "טוב לדעת",

  /* ---------- Map section ---------- */
  map_eyebrow: "מפה",
  map_title: "כל הנקודות במקום אחד",
  map_kicker: "עזריאלי · מיקא · מרינה הרצליה · מלון דן תל אביב",
  map_intro:
    "ארבע נקודות — המשרד בעזריאלי, עגלת הקפה מיקא ברמת השרון, נמל היציאה במרינה הרצליה, והמלון על קו החוף בתל אביב. לחצו על אחת הסיכות לפרטים ולניווט.",
  map_zoom_fit: "התאמת תצוגה לכל הנקודות",
  map_locate_me: "הצגת המיקום שלי",
  map_you_here: "אני כאן",

  /* Map categories */
  cat_meeting: "מפגש",
  cat_coffee: "קפה",
  cat_marina: "מרינה",
  cat_hotel: "מלון",
  cat_spa: "ספא",

  /* Map popup */
  navigate: "ניווט",
  navigate_google: "Google Maps",
  navigate_waze: "Waze",
  navigate_google_aria: "פתחו ב-Google Maps והתחילו ניווט",
  navigate_waze_aria: "פתחו ב-Waze והתחילו ניווט",
  website: "אתר",
  show_on_map: "הצג על המפה",
  call: "התקשרו",

  /* ---------- Stays section ---------- */
  stays_eyebrow: "המלון",
  stays_title: "לילה אחד במלון דן תל אביב",
  stays_kicker: "צ׳ק-אין בחמישי אחה״צ · צ׳ק-אאוט בשישי בצהריים",
  stays_intro:
    "המלון הראשון של רשת דן, ממש על קו החוף — שתי בריכות מול נוף פתוח לים, ספא Via LOMAH, וחוף הים של תל אביב מעבר לכביש.",
  stay_check_in: "צ'ק-אין",
  stay_check_out: "צ'ק-אאוט",
  stay_nights_one: "{n} לילה",
  stay_highlights: "מה מחכה לנו שם",
  stay_warnings: "כדאי לדעת",
  stay_open_booking: "אתר המלון",
  stay_call_hotel: "התקשרו למלון",
  stay_view_spa: "פרטי הספא",
  stay_hide_spa: "הסתר פרטי ספא",

  /* ---------- Spa sub-card ---------- */
  spa_section_title: "Via LOMAH Spa",
  spa_section_subtitle: "הספא של מלון דן תל אביב",
  spa_hours_label: "שעות פתיחה",
  spa_phone_label: "טלפון להזמנות",
  spa_rooms_label: "חדרי טיפולים",
  spa_book_call: "התקשרו",
  spa_book_whatsapp: "וואטסאפ",
  spa_age_note: "הכניסה מגיל 18 ומעלה",
  spa_booking_note: "מומלץ להזמין מראש",

  /* ---------- Tips section ---------- */
  tips_eyebrow: "טיפים",
  tips_title: "כמה דברים שכדאי לדעת מראש",
  tips_kicker: "חמש דקות של קריאה — חוסך הרבה אחר כך",

  /* ---------- Checklist ---------- */
  checklist_eyebrow: "מה לארוז",
  checklist_title: "האריזה ליומיים",
  checklist_kicker: "סמנו תוך כדי אריזה — נשמר במכשיר שלכם",
  checklist_progress: "{done} מתוך {total}",
  checklist_reset: "אפס סימונים",

  /* ---------- TripStats ---------- */
  trip_stats_eyebrow: "במספרים",
  trip_stats_days: "ימים",
  trip_stats_chapters: "ימים",
  trip_stats_venues: "מקומות",
  trip_stats_activities: "פעילויות",

  /* ---------- Mystery guest ---------- */
  mystery_eyebrow: "ההפתעה של הערב",
  mystery_title: "אומן אורח — הפתעה",
  mystery_subtitle: "בערב, אחרי הארוחה",
  mystery_kicker: "שמרנו את ההפתעה לסוף — נתראה שם.",
  mystery_dont_spoil: "אל תספיילרו 🤫",
  mystery_who: "מי האומן?",
  mystery_who_answer: "אנחנו לא מספרים. גם ChatTFNT נשבע לא לגלות.",

  /* ---------- Gemininio (AI host — ChatTFNT) ---------- */
  gem_open: "שאלו את ChatTFNT",
  gem_close: "סגור",
  gem_title: "ChatTFNT",
  gem_tagline: "מארח הנופש מטעם תפנית",
  gem_setup_title: "הגדרת ChatTFNT",
  gem_setup_blurb:
    "ChatTFNT מבוסס על מודל ה-Gemini API של גוגל. אפשר להדביק מפתח אישי בחינם — המפתח נשמר באופן מקומי על המכשיר שלכם בלבד.",
  gem_setup_link: "להפיק מפתח חינמי (aistudio.google.com/apikey)",
  gem_key_placeholder: "AIza…",
  gem_save_key: "שמרו והתחילו שיחה",
  gem_clear_key: "שכוח את המפתח שלי",
  gem_reset_history: "נקו את השיחה",
  gem_input_placeholder: "כתבו שאלה ל-ChatTFNT…",
  gem_send: "שלחו",
  gem_mic_hold: "החזיקו כדי לדבר",
  gem_mic_release: "שחררו כדי לשלוח",
  gem_mic_start: "הקישו להקלטה",
  gem_mic_stop: "הקישו לעצירה",
  gem_recording: "מקליט — עוצר לשליחה אוטומטית…",
  gem_transcribing: "מתמלל…",
  gem_transcribe_failed: "התמלול נכשל. נסו שוב.",
  gem_listening: "מקשיב…",
  gem_thinking: "חושב…",
  gem_speaking: "מדבר…",
  gem_connecting: "מתחבר…",
  gem_disconnected: "לא מחובר. הקישו להתחבר.",
  gem_error_generic: "לא הצלחתי לענות. נסו שוב.",
  gem_error_occurred: "לא הצלחתי לענות. (קוד: {code})",
  gem_error_quota: "מכסת Gemini נגמרה. נסו מאוחר יותר, או הדביקו מפתח חדש בהגדרות.",
  gem_error_key: "מפתח Gemini לא תקין. צרו מפתח חדש והדביקו בהגדרות.",
  gem_error_network: "בעיית חיבור. בדקו אינטרנט ונסו שוב.",
  gem_first_hint:
    "נסו: \"מתי השייט?\" · \"איך מגיעים למלון?\" · \"מה יש בספא?\" · \"מי האומן האורח?\"",
  gem_settings: "הגדרות",
  gem_back: "חזרה לשיחה",
  gem_builtin_key_note:
    "משתמשים במפתח המובנה של הנופש. כדי להשתמש במפתח אישי, הגדירו אותו במטמון הדפדפן.",
  gem_unmute: "השמעת קול תשובה",
  gem_mute: "השתקת קול תשובה",
  gem_input_mode_note: "הגדרות שימוש במיקרופון",
  gem_web_search_enable: "חיפוש בגוגל מופעל",
  gem_web_search_disable: "חיפוש בגוגל כבוי",

  /* ---------- Listen / audio (kept for parity, hidden in this build) ---------- */
  listen_play: "האזינו",
  listen_pause: "השהו",
  listen_unavailable: "האודיו לא זמין",

  /* ---------- Install / Add to Home Screen ---------- */
  install_eyebrow: "קחו את הנופש איתכם",
  install_title_ios: "שמרו את אפליקציית הנופש למסך הבית",
  install_title_android: "התקינו את אפליקציית הנופש",
  install_subtitle_ios:
    "האתר ייפתח כמו אפליקציה רגילה — ללא צורך בחנות האפליקציות, ועובד מעולה גם ללא חיבור לרשת.",
  install_subtitle_android:
    "הקשה אחת ממסך הבית, מסך מלא, בלי שורת דפדפן למעלה.",
  install_subtitle_android_fallback: "הוסיפו קיצור דרך מתפריט Chrome.",
  install_install_button: "התקנה",
  install_menu_label: "התקנת האפליקציה",
  install_dismiss: "אולי אחר כך",
  install_dont_show_again: "אל תציגו לי שוב",
  install_close_aria: "סגור חלונית התקנה",

  /* iOS Safari steps (iPhone) */
  install_step_share_iphone: "הקישו על סמל השיתוף",
  install_step_share_iphone_hint: "הכפתור עם אייקון הריבוע והחץ כלפי מעלה, בתחתית Safari",
  /* iOS Safari steps (iPad) */
  install_step_share_ipad: "הקישו על סמל השיתוף",
  install_step_share_ipad_hint: "הכפתור עם אייקון הריבוע והחץ כלפי מעלה, בסרגל העליון מימין",
  install_step_a2hs: "בחרו באפשרות ״הוספה למסך הבית״",
  install_step_a2hs_hint: "גללו למטה בתפריט השיתוף אם האפשרות לא מופיעה",
  install_step_confirm: "הקישו על ״הוסף״ בפינה העליונה",
  install_step_confirm_hint: "סמל האפליקציה של תפנית יופיע אצלכם במסך הבית",

  /* iOS – not Safari */
  install_ios_open_in_safari: "פתחו את הדף ב-Safari כדי להתקין",
  install_ios_open_in_safari_hint:
    "הוספה למסך הבית באייפון ובאייפד עובדת רק מתוך Safari",

  /* Android fallback steps */
  install_step_android_menu: "הקישו על תפריט (⋮) למעלה מימין",
  install_step_android_menu_hint: "שלוש נקודות אנכיות בסרגל של Chrome",
  install_step_android_a2hs: "בחרו ב״התקנת אפליקציה״ או ״הוסף למסך הבית״",
  install_step_android_a2hs_hint: "הניסוח תלוי בגרסת Chrome",

  /* ---------- TripStrip ---------- */
  scroll_chapters_prev: "ימים קודמים",
  scroll_chapters_next: "ימים הבאים",
  chapter_label: "יום",
  month_jun_short: "ביוני",

  /* ---------- Footer ---------- */
  footer_made_with: "נבנה לעובדי תפנית",
  footer_tagline: "יומיים של ים, פינוקים וזמן ביחד — הפרטים כולם כאן.",
  footer_attribution:
    "תמונות בקרדיט ליוצריהן. מפה © OpenStreetMap ו-CARTO.",
  footer_open_repo: "פתחו את הקוד",
  footer_tafnit: "תפנית דיסקונט · קבוצת דיסקונט",
  footer_tafnit_url: "https://www.tdih.co.il/",

  /* ---------- Floating buttons / common ---------- */
  open_map: "פתח מפה",
  open_external: "פתחו",
  loading: "טוען…",
  retry: "נסו שוב",

  /* ---------- 404 ---------- */
  notfound_title: "אופס, איבדנו אותך בים",
  notfound_subtitle: "נראה שהגעת לדף שלא קיים. נחזור לחוף?",
  notfound_cta: "חזרה לדף הבית",
} as const;

export type DictKey = keyof typeof DICT;

/**
 * Format a string with {placeholder} → value substitutions.
 *   formatTr("יום {n}", { n: 3 }) → "יום 3"
 */
export function formatTr(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

/**
 * Translate a key into Hebrew text. Hebrew-only site — there's no
 * `lang` argument any more — but the hook keeps the same shape so
 * ported tuscany components don't need their imports re-wired.
 */
export function useT() {
  return (key: DictKey, vars?: Record<string, string | number>) =>
    formatTr(DICT[key], vars);
}

/** Direct lookup (e.g. for non-hook code). */
export function tr(key: DictKey, vars?: Record<string, string | number>): string {
  return formatTr(DICT[key], vars);
}
