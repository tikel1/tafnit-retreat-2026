import { motion } from "framer-motion";
import { Mic, Sparkles } from "lucide-react";
import { useT } from "../lib/dict";

interface Props {
  /** Optional override copy. Defaults to dict mystery_* keys. */
  time?: string;
  /** "compact" sits inline as an activity row; "full" is the standalone
   *  card used inside Day 1 evening and on the chapter detail page. */
  variant?: "full" | "compact";
}

/**
 * The Mystery Guest card.
 *
 * The retreat's evening performer is intentionally undisclosed — we hint
 * at the category ("אומן אורח") and lean into the surprise. This card
 * gives that moment a slot to live in: a silhouette behind a "?", a
 * playful "אל תספיילרו 🤫" footnote, and a small mint spotlight that
 * gently sweeps across the silhouette while you're looking at it.
 */
export default function MysteryGuestCard({ time, variant = "full" }: Props) {
  const t = useT();

  if (variant === "compact") {
    return (
      <div
        className="card-tafnit-navy relative overflow-hidden p-4 sm:p-5"
        dir="rtl"
      >
        <div className="absolute -inset-y-10 -end-10 w-40 bg-gradient-to-l from-tafnit-mint-500/0 via-sun-500/40 to-tafnit-mint-500/0 blur-2xl animate-mystery-spotlight pointer-events-none" />
        <div className="relative flex items-start gap-3">
          <span className="icon-chip bg-cream-50/15 text-cream-50 ring-1 ring-cream-50/20">
            <Mic size={18} strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            {time && (
              <div className="text-[10px] uppercase tracking-[0.22em] font-semibold text-tafnit-mint-300 mb-0.5">
                {time}
              </div>
            )}
            <div className="font-display font-bold text-lg sm:text-xl text-cream-50">
              {t("mystery_title")}
            </div>
            <p className="mt-1 text-sm text-cream-50/85 leading-relaxed">
              {t("mystery_kicker")}
            </p>
            <div className="mt-2 text-[11px] text-tafnit-mint-300/95 inline-flex items-center gap-1.5">
              <Sparkles size={12} className="inline-block" />
              {t("mystery_dont_spoil")}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="card-tafnit-navy relative overflow-hidden p-5 sm:p-7"
      dir="rtl"
    >
      {/* Sweeping mint spotlight behind the silhouette. */}
      <div
        className="absolute -inset-y-16 -end-20 w-56 bg-gradient-to-l from-tafnit-mint-500/0 via-sun-500/40 to-tafnit-mint-500/0 blur-3xl animate-mystery-spotlight pointer-events-none"
        aria-hidden
      />

      <div className="relative flex items-start gap-4 sm:gap-5">
        {/* Silhouette card — a mic on a stand inside a soft circle.
            Uses an inline SVG so we don't need to pre-bundle an asset. */}
        <div className="shrink-0 relative">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-cream-50/10 ring-1 ring-cream-50/20 flex items-center justify-center relative overflow-hidden">
            <svg
              viewBox="0 0 64 64"
              className="w-12 h-12 sm:w-14 sm:h-14 text-cream-50/90"
              fill="currentColor"
              aria-hidden
            >
              {/* Stage circle */}
              <ellipse cx="32" cy="56" rx="22" ry="3" opacity="0.4" />
              {/* Mic stand */}
              <rect x="30.5" y="36" width="3" height="18" rx="1.5" />
              {/* Mic body */}
              <rect x="24" y="10" width="16" height="24" rx="8" />
              {/* Mic grille line */}
              <rect x="26" y="16" width="12" height="1" rx="0.5" opacity="0.5" />
              <rect x="26" y="19" width="12" height="1" rx="0.5" opacity="0.5" />
              <rect x="26" y="22" width="12" height="1" rx="0.5" opacity="0.5" />
              {/* Mic cable bend */}
              <path
                d="M32 34 Q 32 42 24 44"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                opacity="0.7"
              />
            </svg>
            {/* The big "?" sits over the silhouette. */}
            <span
              className="absolute inset-0 flex items-center justify-center font-display font-black text-5xl sm:text-6xl text-sun-500 mix-blend-screen"
              aria-hidden
            >
              ?
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.22em] font-semibold text-tafnit-mint-300 mb-1">
            {t("mystery_eyebrow")}
          </div>
          <h3 className="font-display font-bold text-2xl sm:text-3xl text-cream-50 leading-tight">
            {t("mystery_title")}
          </h3>
          <p className="mt-1 text-cream-50/85 text-sm font-medium">
            {t("mystery_subtitle")}
          </p>
          <p className="mt-3 text-cream-50/90 text-base leading-relaxed">
            {t("mystery_kicker")}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-cream-50/12 ring-1 ring-cream-50/20 px-3 py-1.5 text-xs text-tafnit-mint-300 font-medium">
            <Sparkles size={12} />
            {t("mystery_dont_spoil")}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
