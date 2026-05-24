import type { Day } from "../data/types";
import { activityIconFor } from "../lib/activityIcon";
import { getVenue } from "../data/venues";
import MysteryGuestCard from "./MysteryGuestCard";

/**
 * DayCard — the full activity list for a single day, rendered as a
 * stack of "pill" rows with a mint icon-chip on the right (RTL).
 * Used inside the ChapterDetailPage.
 *
 * Mystery-guest activities (where `isMystery === true`) render as a
 * compact MysteryGuestCard inline instead of a normal pill row, so the
 * surprise is visually flagged in context.
 */
interface Props {
  day: Day;
  onVenueClick?: (venueId: string) => void;
}

export default function DayCard({ day, onVenueClick }: Props) {
  return (
    <ol className="space-y-3 sm:space-y-3.5" dir="rtl">
      {day.activities.map((a, i) => {
        if (a.isMystery) {
          return (
            <li key={i}>
              <MysteryGuestCard time={a.time} variant="compact" />
            </li>
          );
        }

        const Icon = activityIconFor(a.icon);
        const venue = a.venueId ? getVenue(a.venueId) : undefined;

        return (
          <li
            key={i}
            className="card-tafnit p-3.5 sm:p-4 flex items-start gap-3 sm:gap-4"
          >
            <span className="icon-chip">
              <Icon size={18} strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                {a.time && (
                  <span className="text-[11px] uppercase tracking-[0.18em] text-tafnit-mint-700 font-semibold">
                    {a.time}
                  </span>
                )}
                {venue && (
                  <button
                    type="button"
                    onClick={() => onVenueClick?.(venue.id)}
                    className="text-[11px] text-tafnit-navy-700 hover:text-tafnit-navy-900 underline decoration-tafnit-mint-300 underline-offset-4 transition-colors"
                  >
                    {venue.name}
                  </button>
                )}
              </div>
              <div className="font-display font-bold text-[15px] sm:text-base text-tafnit-navy-900 leading-snug mt-1">
                {a.title}
              </div>
              {a.description && (
                <p className="text-sm text-ink-700/85 leading-relaxed mt-1.5">
                  {a.description}
                </p>
              )}
            </div>
            {a.image && (
              <div className="hidden sm:block shrink-0">
                <div className="w-24 h-24 rounded-xl overflow-hidden ring-1 ring-cream-200 bg-cream-100">
                  <img
                    src={a.image}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
