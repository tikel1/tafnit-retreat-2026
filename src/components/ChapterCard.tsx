import { motion } from "framer-motion";
import { ArrowLeft, Sun } from "lucide-react";
import type { Day } from "../data/types";
import { getTripState } from "../lib/tripState";
import { activityIconFor } from "../lib/activityIcon";
import { navigateChapter } from "../lib/route";
import { useT } from "../lib/dict";
import { formatDateShort } from "../lib/nav";

const ROMAN = ["", "I", "II"];

/**
 * ChapterCard — summary card for one day, shown inside the home
 * itinerary section. Has a hero photo header, a 3-activity preview,
 * and a "read more" CTA that opens the chapter detail page.
 */
export default function ChapterCard({ day }: { day: Day }) {
  const t = useT();

  const tripState = getTripState();
  const isToday =
    tripState.phase === "during" && tripState.today.dayNumber === day.dayNumber;

  const previewActivities = day.activities.slice(0, 3);
  const remaining = Math.max(0, day.activities.length - previewActivities.length);

  return (
    <article
      className={`group h-full flex flex-col rounded-3xl overflow-hidden bg-white ${
        isToday
          ? "ring-2 ring-tafnit-mint-500 shadow-[0_30px_60px_-30px_rgba(107,184,154,0.55)]"
          : "ring-1 ring-cream-200 shadow-[0_18px_40px_-22px_rgba(15,42,85,0.22)]"
      }`}
    >
      {/* Hero photo / header band */}
      <div className="relative aspect-[16/8] sm:aspect-[16/7] overflow-hidden bg-tafnit-navy-900 shrink-0">
        {day.leadImage ? (
          <img
            src={day.leadImage}
            alt={day.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-tafnit-navy-900/95 via-tafnit-navy-900/55 to-tafnit-navy-900/15" />
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-tafnit-navy-900/40 to-transparent" />

        <div className="absolute top-3 sm:top-4 left-4 sm:left-5 right-4 sm:right-5 flex items-start justify-between gap-2 text-cream-50">
          <div className="flex items-baseline gap-2 sm:gap-3">
            <div className="font-display font-black text-2xl sm:text-3xl leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
              {ROMAN[day.dayNumber]}
            </div>
            <div className="hidden sm:block h-px w-10 bg-cream-50/40 mb-1.5" />
            <div className="text-[10px] uppercase tracking-[0.24em] font-semibold text-tafnit-mint-300">
              {t("plan_chapter_x_of_y", {
                x: String(day.dayNumber).padStart(2, "0"),
                y: "02"
              })}
            </div>
          </div>
          {isToday && (
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-tafnit-mint-500 text-tafnit-navy-900 text-[10px] uppercase tracking-[0.22em] font-bold shadow-[0_4px_18px_rgba(107,184,154,0.5)]">
              <Sun size={10} /> {t("badge_today")}
            </div>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-5 text-cream-50">
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-cream-50/85 font-semibold">
            <span>{day.weekday}</span>
            <span aria-hidden>·</span>
            <span>{formatDateShort(day.date)}</span>
          </div>
          <h3 className="mt-1 font-display font-bold text-xl sm:text-3xl leading-[1.1] tracking-tight max-w-md drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            {day.title}
          </h3>
          {day.subtitle && (
            <p className="mt-1 text-sm text-cream-50/80 max-w-md leading-snug">
              {day.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Activity preview */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 flex-1 flex flex-col">
        <ul className="space-y-3 sm:space-y-3.5 flex-1">
          {previewActivities.map((a, i) => {
            const Icon = activityIconFor(a.icon);
            const isMysteryRow = a.isMystery === true;
            return (
              <li key={i} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isMysteryRow
                      ? "bg-tafnit-navy-900 text-sun-500 ring-1 ring-sun-500/40"
                      : "bg-tafnit-mint-100 text-tafnit-mint-700 ring-1 ring-tafnit-mint-300/60"
                  }`}
                >
                  <Icon size={14} strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    {a.time && (
                      <span className="text-[10px] uppercase tracking-[0.18em] text-tafnit-mint-700 font-semibold">
                        {a.time}
                      </span>
                    )}
                    {isMysteryRow && (
                      <span className="text-[10px] uppercase tracking-[0.18em] text-sun-500 font-bold">
                        · הפתעה
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-[15px] text-tafnit-navy-900 leading-snug mt-0.5">
                    {a.title}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {remaining > 0 && (
          <div className="mt-3 text-[11px] text-ink-700/65">
            <span className="inline-flex items-center gap-1">
              <span className="font-bold text-tafnit-navy-900">+{remaining}</span>{" "}
              עוד פעילויות
            </span>
          </div>
        )}

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => navigateChapter(day.dayNumber)}
          className="mt-5 sm:mt-6 group/cta inline-flex items-center justify-center gap-2 w-full sm:w-auto sm:self-stretch px-5 py-3 rounded-xl bg-tafnit-navy-900 text-cream-50 hover:bg-tafnit-navy-700 transition-colors"
        >
          <span className="font-semibold text-[15px]">{t("read_more")}</span>
          <ArrowLeft size={15} className="transition-transform group-hover/cta:-translate-x-1" />
        </motion.button>
      </div>
    </article>
  );
}
