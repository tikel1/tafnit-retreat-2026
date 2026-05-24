import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { getTripState, TRIP_START } from "../lib/tripState";
import type { TripState } from "../lib/tripState";
import { formatDate } from "../lib/nav";
import { useT } from "../lib/dict";
import LiveCountdown from "./LiveCountdown";
import { useCarouselSwipe } from "../lib/useCarouselSwipe";
import { assetUrl } from "../lib/assets";

interface HeroPhoto {
  src: string;
  /** Hebrew "place / vibe" label shown top-end of the photo strip. */
  place: string;
  /** Tiny credit / theme tag underneath the place. */
  credit: string;
  /** Day number this image belongs to (chip next to the place name).
   *  Day 1 = the boat, Day 2 = the spa. */
  dayNumber?: number;
}

// Six bespoke "brain of the retreat" key-art shots — the company
// logotype as the literal brain of each beat (sea, sail, pool, dinner,
// comedy night, spa). Crossfaded full-bleed behind the hero copy.
const HERO_PHOTOS: HeroPhoto[] = [
  {
    src: assetUrl("images/hero/brain-summer-table.png"),
    place: "המוח הקיצי · יום של ים",
    credit: "key art · נופש תפנית 2026",
  },
  {
    src: assetUrl("images/hero/brain-captain-sand.png"),
    place: "המוח של הקפטן · שייט מהמרינה",
    credit: "key art · יום 1 בנופש",
    dayNumber: 1,
  },
  {
    src: assetUrl("images/hero/brain-cruise-water.png"),
    place: "מוח בים · בריכת המלון",
    credit: "key art · יום 1 בנופש",
    dayNumber: 1,
  },
  {
    src: assetUrl("images/hero/brain-gourmet-dinner.png"),
    place: "מוח של ארוחת ערב · שולחן חגיגי",
    credit: "key art · יום 1 בנופש",
    dayNumber: 1,
  },
  {
    src: assetUrl("images/hero/brain-comedy-night.png"),
    place: "מוח של הערב · אומן אורח",
    credit: "key art · ההפתעה של הערב",
    dayNumber: 1,
  },
  {
    src: assetUrl("images/hero/brain-spa-marble.png"),
    place: "מוח של ספא · Via LOMAH",
    credit: "key art · יום 2 בנופש",
    dayNumber: 2,
  },
];

const PHOTO_DURATION_MS = 7000;

function useTripStateLive() {
  const [state, setState] = useState<TripState>(() => getTripState());
  useEffect(() => {
    const id = window.setInterval(() => setState(getTripState()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return state;
}

function useHeroPhoto(photos: HeroPhoto[]) {
  const sig = useMemo(() => photos.map((p) => p.src).join("|"), [photos]);
  const [idx, setIdx] = useState(0);
  const [prevSig, setPrevSig] = useState(sig);
  if (sig !== prevSig) {
    setPrevSig(sig);
    setIdx(0);
  }

  // Lazy preload: as soon as a photo becomes active, prefetch the next
  // one so the crossfade is buttery.
  useEffect(() => {
    if (photos.length === 0) return;
    const next = (idx + 1) % photos.length;
    const img = new Image();
    img.src = photos[next].src;
  }, [idx, photos]);

  useEffect(() => {
    if (photos.length <= 1) return;
    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % photos.length);
    }, PHOTO_DURATION_MS);
    return () => window.clearInterval(id);
  }, [photos]);

  const safe = photos[idx] ?? photos[0] ?? HERO_PHOTOS[0];
  const step = useCallback(
    (delta: number) => {
      setIdx((i) => {
        const len = photos.length;
        if (len <= 1) return i;
        return (i + delta + len) % len;
      });
    },
    [photos]
  );
  return { photo: safe, idx, step };
}

function HeroBody({ state }: { state: TripState }) {
  const t = useT();

  if (state.phase === "before") {
    return (
      <>
        <div className="font-display italic text-white/95 text-base sm:text-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
          {t("hero_before_lead")}
        </div>
        <div className="mt-3 sm:mt-4">
          <LiveCountdown
            target={TRIP_START}
            mode="down"
            size="lg"
            tone="light"
          />
        </div>
        <div className="mt-3 sm:mt-4 font-display italic text-tafnit-mint-300 text-sm sm:text-base drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
          {state.daysUntil <= 1
            ? t("hero_close_almost")
            : state.daysUntil <= 7
            ? t("hero_one_week")
            : state.daysUntil <= 30
            ? t("hero_one_month")
            : t("hero_far")}
        </div>
      </>
    );
  }

  if (state.phase === "during") {
    const day = state.featured;
    const leadKey = state.isFeaturingTomorrow ? "hero_tomorrow_lead" : "hero_today_lead";
    const dayLabelKey = state.isFeaturingTomorrow ? "hero_tomorrow_day" : "hero_today_day";
    return (
      <>
        <div className="font-display italic text-white/95 text-base sm:text-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
          {t(leadKey)}
        </div>
        <div className="mt-3 sm:mt-4 flex items-end gap-3 sm:gap-5 justify-center" dir="rtl">
          <div className="text-white text-end drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            <div className="text-[10px] uppercase tracking-[0.28em] font-semibold text-tafnit-mint-300">
              {t(dayLabelKey)}
            </div>
            <div className="font-display font-bold text-6xl sm:text-8xl leading-none mt-0.5">
              {String(day.dayNumber).padStart(2, "0")}
            </div>
          </div>
          <div className="text-white/95 pb-1 sm:pb-2 text-start max-w-[55%] drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            <div className="text-[10px] uppercase tracking-[0.22em] font-semibold text-tafnit-mint-300">
              {t("hero_of_two")} · {formatDate(day.date)}
            </div>
            <div className="font-display font-semibold text-lg sm:text-2xl leading-tight mt-0.5">
              {day.title}
            </div>
          </div>
        </div>
        {day.activities[0] && (
          <div className="mt-3 font-display italic text-tafnit-mint-300 text-sm max-w-md mx-auto px-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
            {day.activities[0].time ? `${day.activities[0].time} · ` : ""}
            {day.activities[0].title}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="font-display italic text-white/95 text-base sm:text-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
        {t("hero_after_lead")}
      </div>
      <div className="mt-3 sm:mt-4 font-display font-bold text-4xl sm:text-6xl text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
        {t("hero_after_title")}
      </div>
      <div className="mt-3 font-display italic text-tafnit-mint-300 text-sm sm:text-base drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
        {t("hero_after_sub")}
      </div>
    </>
  );
}

export default function Hero() {
  const state = useTripStateLive();
  const t = useT();

  const photos = HERO_PHOTOS;
  const { photo, idx, step } = useHeroPhoto(photos);

  const { swipeHandlers, swipeTouchAction } = useCarouselSwipe({
    onPrev: () => step(-1),
    onNext: () => step(1),
    disabled: photos.length <= 1,
  });

  return (
    <header
      id="hero"
      className="relative flex flex-col overflow-hidden text-white bg-cream-100 h-[min(48svh,420px)] sm:h-[min(68svh,620px)]"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        ...(swipeTouchAction ? { touchAction: swipeTouchAction } : {}),
      }}
      {...swipeHandlers}
    >
      {/* Full-bleed photo — object-cover fills the frame (no navy letterbox). */}
      <AnimatePresence mode="sync">
        <motion.img
          key={photo.src}
          src={photo.src}
          alt=""
          aria-hidden
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1.02 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{
            opacity: { duration: 1.6, ease: "easeInOut" },
            scale: { duration: PHOTO_DURATION_MS / 1000 + 1.6, ease: "linear" },
          }}
          className="absolute inset-0 z-0 w-full h-full object-cover object-center will-change-transform pointer-events-none"
          draggable={false}
        />
      </AnimatePresence>

      {/* Scrim behind copy — darkens the photo so white/mint text pops. */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-black/50 via-black/25 to-black/55" />

      {/* Progress dashes — RTL: anchored bottom-end (left) */}
      <div
        className="absolute left-4 sm:left-8 bottom-2 sm:bottom-3 z-10 flex gap-1 pointer-events-none"
        aria-hidden
      >
        {photos.map((_, i) => (
          <span
            key={i}
            className={`block h-px transition-all duration-500 ${
              i === idx ? "w-5 bg-white/95" : "w-2 bg-white/35"
            }`}
          />
        ))}
      </div>

      {/* Top strip: brand wordmark only (RTL). */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="relative z-10 shrink-0 max-w-6xl w-full mx-auto px-5 sm:px-8 pt-8 sm:pt-16"
        dir="rtl"
      >
        <div className="flex items-baseline gap-3">
          <div className="h-px flex-1 bg-tafnit-mint-300/70" />
        </div>

        <div className="mt-1 sm:mt-1.5 font-display italic text-tafnit-mint-300 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)] text-center sm:text-start">
          <span className="sm:hidden text-[11px] leading-snug tracking-normal">
            {t("families_byline_mobile_1")}
            <br />
            {t("families_byline_mobile_2")}
          </span>
          <span className="hidden sm:block text-[12px] tracking-wide">
            {t("families_byline")}
          </span>
        </div>
      </motion.div>

      {/* Centerpiece — countdown / day info */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-5 sm:px-8 py-2 min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.15 }}
          className="text-center max-w-3xl"
        >
          <HeroBody state={state} />
        </motion.div>
      </div>

      {/* Bottom strip — scroll cue centered. */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="relative z-10 shrink-0 max-w-6xl w-full mx-auto px-5 sm:px-8 pb-3 sm:pb-4 flex items-center justify-center"
      >
        <button
          type="button"
          onClick={() =>
            document
              .getElementById("plan")
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
          className="group flex flex-col items-center gap-0.5 text-white/95 hover:text-tafnit-mint-300 transition-colors"
          aria-label={t("scroll_to_plan")}
        >
          <span className="font-display italic text-xs sm:text-sm tracking-wide">
            {t("scroll_to_plan")}
          </span>
          <ChevronDown
            size={18}
            className="animate-bounce group-hover:animate-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
          />
        </button>
      </motion.div>
    </header>
  );
}
