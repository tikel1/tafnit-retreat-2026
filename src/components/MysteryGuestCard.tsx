import { motion } from "framer-motion";
import { PartyPopper, Sparkles } from "lucide-react";
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
 * gives that moment a slot to live in: a party-popper surprise icon, a
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
          <span className="icon-chip bg-sun-500/15 text-sun-500 ring-1 ring-sun-500/30">
            <PartyPopper size={18} strokeWidth={1.8} />
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
        <div className="shrink-0 relative">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-sun-500/20 via-cream-50/10 to-tafnit-mint-500/10 ring-1 ring-sun-500/35 flex items-center justify-center">
            <PartyPopper
              size={40}
              strokeWidth={1.6}
              className="text-sun-500 drop-shadow-[0_2px_10px_rgba(244,183,58,0.45)]"
              aria-hidden
            />
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
