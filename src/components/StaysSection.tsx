import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Phone,
  Sparkles,
  Hotel,
  ExternalLink,
  MessageCircle,
  Info
} from "lucide-react";
import Section from "./Section";
import { stays } from "../data/stays";
import { viaLomahSpa } from "../data/spa";
import { useT } from "../lib/dict";

export default function StaysSection() {
  const t = useT();
  const stay = stays[0];
  const [showSpa, setShowSpa] = useState(true);

  return (
    <Section
      id="stay"
      eyebrow={t("stays_eyebrow")}
      title={t("stays_title")}
      kicker={t("stays_kicker")}
      intro={t("stays_intro")}
    >
      <article className="card-tafnit overflow-hidden">
        {/* Hero photo / header band */}
        <div className="relative aspect-[16/8] sm:aspect-[16/7] overflow-hidden bg-tafnit-navy-900">
          {stay.image && (
            <img
              src={stay.image}
              alt={stay.name}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-tafnit-navy-900/95 via-tafnit-navy-900/45 to-tafnit-navy-900/15" />

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 text-cream-50">
            <div className="text-[10px] uppercase tracking-[0.22em] font-semibold text-tafnit-mint-300">
              {t("cat_hotel")}
            </div>
            <h3 className="mt-1 font-display font-bold text-2xl sm:text-4xl leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
              {stay.name}
            </h3>
            {stay.address && (
              <p className="mt-1 text-cream-50/80 text-sm">{stay.address}</p>
            )}
          </div>
        </div>

        {/* Check-in / check-out + highlights + warnings */}
        <div className="p-5 sm:p-7 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          <div className="space-y-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-tafnit-mint-700 font-semibold">
                {t("stay_check_in")}
              </div>
              <div className="mt-1 font-display font-bold text-lg text-tafnit-navy-900">
                חמישי · 4 ביוני · 15:00
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-tafnit-mint-700 font-semibold">
                {t("stay_check_out")}
              </div>
              <div className="mt-1 font-display font-bold text-lg text-tafnit-navy-900">
                שישי · 5 ביוני · 12:00
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-tafnit-mint-700 font-semibold">
                לילות
              </div>
              <div className="mt-1 font-display font-bold text-lg text-tafnit-navy-900">
                {t("stay_nights_one", { n: 1 })}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {stay.website && (
                <a
                  href={stay.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  <ExternalLink size={14} />
                  {t("stay_open_booking")}
                </a>
              )}
              {stay.phone && (
                <a href={`tel:${stay.phone.replace(/\s+/g, "")}`} className="btn-ghost">
                  <Phone size={14} />
                  {t("stay_call_hotel")}
                </a>
              )}
            </div>
          </div>

          <div className="md:col-span-2 space-y-5">
            <div>
              <h4 className="font-display font-bold text-tafnit-navy-900 text-base flex items-center gap-2">
                <Hotel size={16} className="text-tafnit-mint-600" />
                {t("stay_highlights")}
              </h4>
              <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4">
                {stay.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-[15px] text-ink-800 leading-snug">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-tafnit-mint-500 shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            {stay.warnings && stay.warnings.length > 0 && (
              <div>
                <h4 className="font-display font-bold text-tafnit-navy-900 text-base flex items-center gap-2">
                  <Info size={16} className="text-tafnit-mint-600" />
                  {t("stay_warnings")}
                </h4>
                <ul className="mt-2 space-y-1.5">
                  {stay.warnings.map((w, i) => (
                    <li key={i} className="text-[14px] text-ink-700/85 leading-relaxed flex items-start gap-2">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-sun-500 shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Via LOMAH Spa expandable sub-card */}
        <div className="border-t border-cream-200 bg-tafnit-mint-100/40">
          <button
            type="button"
            onClick={() => setShowSpa((s) => !s)}
            className="w-full px-5 sm:px-7 py-4 flex items-center justify-between gap-3 text-start hover:bg-tafnit-mint-100/60 transition-colors"
            aria-expanded={showSpa}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="icon-chip">
                <Sparkles size={18} strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <div className="font-display font-bold text-tafnit-navy-900 text-lg leading-tight">
                  {t("spa_section_title")}
                </div>
                <div className="text-xs text-ink-700/80 mt-0.5">
                  {t("spa_section_subtitle")}
                </div>
              </div>
            </div>
            <span className="shrink-0 text-tafnit-navy-700">
              {showSpa ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </span>
          </button>

          <AnimatePresence initial={false}>
            {showSpa && (
              <motion.div
                key="spa-body"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                {viaLomahSpa.image && (
                  <div className="aspect-[16/6] overflow-hidden bg-tafnit-mint-100">
                    <img
                      src={viaLomahSpa.image}
                      alt={viaLomahSpa.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
                <div className="px-5 sm:px-7 pt-5 sm:pt-6 pb-6 sm:pb-7 grid grid-cols-1 md:grid-cols-5 gap-5">
                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-start gap-3">
                      <Clock size={16} className="mt-0.5 text-tafnit-mint-700 shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.22em] text-tafnit-mint-700 font-semibold">
                          {t("spa_hours_label")}
                        </div>
                        <div className="text-sm text-tafnit-navy-900 font-medium">
                          {viaLomahSpa.hours}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone size={16} className="mt-0.5 text-tafnit-mint-700 shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.22em] text-tafnit-mint-700 font-semibold">
                          {t("spa_phone_label")}
                        </div>
                        <div className="text-sm text-tafnit-navy-900 font-medium" dir="ltr">
                          {viaLomahSpa.phone}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Sparkles size={16} className="mt-0.5 text-tafnit-mint-700 shrink-0" />
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.22em] text-tafnit-mint-700 font-semibold">
                          {t("spa_rooms_label")}
                        </div>
                        <div className="text-sm text-tafnit-navy-900 font-medium">
                          {viaLomahSpa.rooms} חדרי טיפולים
                        </div>
                      </div>
                    </div>
                    <div className="pt-1 flex flex-wrap gap-2">
                      <a
                        href={`tel:${viaLomahSpa.phone.replace(/[\s-]/g, "")}`}
                        className="btn-mint"
                      >
                        <Phone size={14} />
                        {t("spa_book_call")}
                      </a>
                      {viaLomahSpa.whatsapp && (
                        <a
                          href={viaLomahSpa.whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-ghost"
                        >
                          <MessageCircle size={14} />
                          {t("spa_book_whatsapp")}
                        </a>
                      )}
                    </div>
                    {viaLomahSpa.ageLimitNote && (
                      <p className="text-[11px] text-ink-700/65 mt-1">
                        {viaLomahSpa.ageLimitNote}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-3">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-tafnit-mint-700 font-semibold mb-2">
                      {t("stay_highlights")}
                    </div>
                    <ul className="space-y-1.5">
                      {viaLomahSpa.highlights.map((h, i) => (
                        <li
                          key={i}
                          className="text-[14px] text-ink-800 leading-relaxed flex items-start gap-2"
                        >
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-tafnit-mint-500 shrink-0" />
                          {h}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-[13px] text-tafnit-navy-700/85 italic">
                      {viaLomahSpa.bookingNote}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </article>
    </Section>
  );
}
