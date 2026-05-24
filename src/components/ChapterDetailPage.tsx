import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, MapPin, Lightbulb } from "lucide-react";
import { itinerary } from "../data/itinerary";
import { getVenue } from "../data/venues";
import { navigateChapter, navigateHome, rememberChapter } from "../lib/route";
import { linkifyPhones } from "../lib/linkifyPhones";
import { useT } from "../lib/dict";
import { formatDate } from "../lib/nav";
import DayCard from "./DayCard";
import MiniMap from "./MiniMap";
import MysteryGuestCard from "./MysteryGuestCard";
import type { Venue } from "../data/types";

const ROMAN = ["", "I", "II"];

interface Props {
  dayNumber: number;
}

export default function ChapterDetailPage({ dayNumber }: Props) {
  const t = useT();
  const day = itinerary.find((d) => d.dayNumber === dayNumber) ?? itinerary[0];
  const pageRef = useRef<HTMLDivElement>(null);

  // Remember which chapter the user was on so back-nav lands smoothly.
  useEffect(() => {
    rememberChapter(day.dayNumber);
    pageRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [day.dayNumber]);

  // Venues referenced by this day's activities — for the mini-map.
  const dayVenues = useMemo<Venue[]>(() => {
    const ids = new Set<string>();
    day.activities.forEach((a) => {
      if (a.venueId) ids.add(a.venueId);
    });
    return Array.from(ids)
      .map((id) => getVenue(id))
      .filter((v): v is Venue => !!v);
  }, [day]);

  const hasMystery = day.activities.some((a) => a.isMystery);

  const prevDay = day.dayNumber > 1 ? day.dayNumber - 1 : null;
  const nextDay = day.dayNumber < itinerary.length ? day.dayNumber + 1 : null;

  const handleVenueClick = (venueId: string) => {
    // Soft-scroll to the mini-map and let users see the venue's marker.
    const el = document.getElementById("chapter-map");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    void venueId;
  };

  return (
    <div ref={pageRef} className="min-h-screen bg-cream-50" dir="rtl">
      {/* Sticky top bar — back link + chapter Roman. */}
      <div
        className="sticky top-0 z-40 bg-cream-50/90 backdrop-blur-md border-b border-cream-200"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigateHome({ scrollToPlan: true })}
            className="inline-flex items-center gap-2 text-sm font-semibold text-tafnit-navy-700 hover:text-tafnit-navy-900 transition-colors"
          >
            <ArrowRight size={16} />
            {t("back_to_plan")}
          </button>
          <div className="text-[11px] uppercase tracking-[0.22em] text-tafnit-mint-700 font-bold">
            {t("plan_chapter_x_of_y", {
              x: String(day.dayNumber).padStart(2, "0"),
              y: "02"
            })}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-12 sm:pb-16">
        {/* Hero header */}
        <motion.header
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="card-tafnit-navy p-6 sm:p-8 relative overflow-hidden"
        >
          {day.leadImage && (
            <div className="absolute inset-0 opacity-25 pointer-events-none">
              <img
                src={day.leadImage}
                alt=""
                className="w-full h-full object-cover"
                aria-hidden
                onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
              />
              <div className="absolute inset-0 bg-gradient-to-l from-tafnit-navy-900/30 via-tafnit-navy-900/85 to-tafnit-navy-900" />
            </div>
          )}
          <div className="relative">
            <div className="flex items-baseline gap-3">
              <div className="font-display font-black text-3xl sm:text-5xl text-cream-50 leading-none">
                {ROMAN[day.dayNumber]}
              </div>
              <div className="text-[10px] sm:text-xs uppercase tracking-[0.22em] font-semibold text-tafnit-mint-300">
                {day.weekday} · {formatDate(day.date)}
              </div>
            </div>
            <h1 className="mt-3 font-display font-bold text-3xl sm:text-5xl text-cream-50 leading-tight">
              {day.title}
            </h1>
            {day.subtitle && (
              <p className="mt-2 text-cream-50/85 text-base sm:text-lg max-w-2xl">
                {day.subtitle}
              </p>
            )}
          </div>
        </motion.header>

        {/* Mystery teaser at the top of Day 1 — sits above the schedule
            so it doesn't get lost in the list. */}
        {hasMystery && (
          <div className="mt-6">
            <MysteryGuestCard />
          </div>
        )}

        {/* Activity schedule */}
        <section className="mt-8 sm:mt-10">
          <div className="mb-4 sm:mb-5 flex items-center gap-2">
            <span className="brand-brush text-[11px] tracking-[0.18em] uppercase">
              {t("hour_by_hour")}
            </span>
          </div>
          <DayCard day={day} onVenueClick={handleVenueClick} />
        </section>

        {/* Mini-map for the venues touched today. */}
        {dayVenues.length > 0 && (
          <section id="chapter-map" className="mt-10 scroll-mt-20">
            <div className="mb-4 flex items-center gap-2">
              <span className="brand-brush text-[11px] tracking-[0.18em] uppercase">
                {t("on_the_map")}
              </span>
            </div>
            <MiniMap venues={dayVenues} />
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-700/70">
              {dayVenues.map((v) => (
                <span key={v.id} className="inline-flex items-center gap-1.5">
                  <MapPin size={12} className="text-tafnit-mint-600" />
                  {v.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Day-tips block */}
        {day.dayTips && day.dayTips.length > 0 && (
          <section className="mt-10">
            <div className="mb-4 flex items-center gap-2">
              <span className="brand-brush text-[11px] tracking-[0.18em] uppercase">
                {t("tips_for_chapter")}
              </span>
            </div>
            <ul className="space-y-2.5">
              {day.dayTips.map((tip, i) => (
                <li
                  key={i}
                  className="card-tafnit p-3.5 sm:p-4 flex items-start gap-3"
                >
                  <span className="icon-chip">
                    <Lightbulb size={16} strokeWidth={1.8} />
                  </span>
                  <p className="text-[15px] text-ink-800 leading-relaxed flex-1">
                    {linkifyPhones(tip)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Prev / Next chapter nav */}
        <nav className="mt-12 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => prevDay && navigateChapter(prevDay)}
            disabled={prevDay === null}
            className="btn-ghost disabled:opacity-30 disabled:hover:bg-white/70"
          >
            <ArrowRight size={14} />
            {t("previous")}
          </button>
          <button
            type="button"
            onClick={() => nextDay && navigateChapter(nextDay)}
            disabled={nextDay === null}
            className="btn-primary disabled:opacity-30 disabled:hover:bg-tafnit-navy-700"
          >
            {t("next")}
            <ArrowLeft size={14} />
          </button>
        </nav>
      </div>
    </div>
  );
}
