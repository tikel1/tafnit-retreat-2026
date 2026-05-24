import { motion } from "framer-motion";
import { itinerary } from "../data/itinerary";
import { useT } from "../lib/dict";
import ChapterCard from "./ChapterCard";

/**
 * Two-chapter itinerary section. Simpler than tuscany's: only two days,
 * so we skip the carousel and just render both cards in a 2-column
 * grid (stacked on mobile).
 */
export default function ItinerarySection() {
  const t = useT();
  const days = itinerary;

  return (
    <section
      id="plan"
      className="relative scroll-mt-20 pt-12 sm:pt-20 pb-12 sm:pb-20 overflow-hidden"
    >
      {/* Decorative oversized wordmark in the background. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-2 sm:top-2 inset-x-0 text-center font-display font-black select-none whitespace-nowrap text-[18vw] sm:text-[12rem] leading-none text-tafnit-mint-500/[0.07] tracking-tight"
      >
        {t("plan_title")}
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mb-8 sm:mb-12 max-w-2xl"
        >
          <span className="brand-brush text-[12px] tracking-[0.18em] uppercase">
            {t("plan_eyebrow")}
          </span>
          <h2 className="mt-4 font-display font-bold text-[34px] sm:text-5xl text-tafnit-navy-900 leading-tight tracking-tight">
            {t("plan_title")}
          </h2>
          <p className="mt-3 text-ink-700/85 text-base sm:text-lg leading-relaxed">
            {t("plan_kicker")}
          </p>
        </motion.header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-7">
          {days.map((day) => (
            <ChapterCard key={day.dayNumber} day={day} />
          ))}
        </div>
      </div>
    </section>
  );
}
