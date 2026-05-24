import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, MapPin, Plus, X } from "lucide-react";
import type { Day, DayActivity, Venue } from "../data/types";
import { activityIconFor } from "../lib/activityIcon";
import { getVenue } from "../data/venues";
import { useT } from "../lib/dict";
import NavigateLinks from "./NavigateLinks";
import MysteryGuestCard from "./MysteryGuestCard";

/**
 * DayCard — the full activity list for a single day, rendered as a
 * stack of "pill" rows with a mint icon-chip on the right (RTL).
 * Used inside the ChapterDetailPage.
 *
 * Activities linked to a venue can expand with "read more" — photo,
 * description, navigation and map — matching the Tuscany day view.
 */
interface Props {
  day: Day;
  onVenueClick?: (venueId: string) => void;
}

function ActivityRow({
  activity,
  onVenueClick,
}: {
  activity: DayActivity;
  onVenueClick?: (venueId: string) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const Icon = activityIconFor(activity.icon);
  const venue = activity.venueId ? getVenue(activity.venueId) : undefined;
  const hasMoreInfo = !!venue && !!(venue.image || venue.description);

  return (
    <li className="card-tafnit p-3.5 sm:p-4 flex items-start gap-3 sm:gap-4">
      <span className="icon-chip">
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          {activity.time && (
            <span className="text-[11px] uppercase tracking-[0.18em] text-tafnit-mint-700 font-semibold">
              {activity.time}
            </span>
          )}
          {venue && !hasMoreInfo && (
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
          {activity.title}
        </div>
        {activity.description && (
          <p className="text-sm text-ink-700/85 leading-relaxed mt-1.5">
            {activity.description}
          </p>
        )}

        {hasMoreInfo && venue && (
          <>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] font-semibold text-tafnit-mint-700 hover:text-tafnit-mint-800 transition-colors"
                aria-expanded={open}
              >
                {open ? <X size={12} /> : <Plus size={12} />}
                {open ? t("hide_details") : t("more_about_place")}
              </button>
              {!open && (
                <button
                  type="button"
                  onClick={() => onVenueClick?.(venue.id)}
                  className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] font-semibold text-ink-700/70 hover:text-tafnit-navy-800 transition-colors"
                >
                  <MapPin size={12} />
                  {t("on_the_map")}
                </button>
              )}
            </div>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  key="venue-details"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <VenueReveal venue={venue} onVenueClick={onVenueClick} />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {activity.image && !hasMoreInfo && (
        <div className="hidden sm:block shrink-0">
          <div className="w-24 h-24 rounded-xl overflow-hidden ring-1 ring-cream-200 bg-cream-100">
            <img
              src={activity.image}
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
}

function VenueReveal({
  venue,
  onVenueClick,
}: {
  venue: Venue;
  onVenueClick?: (venueId: string) => void;
}) {
  const t = useT();

  return (
    <div className="mt-4 rounded-2xl bg-cream-50 ring-1 ring-cream-200 overflow-hidden grid sm:grid-cols-[180px_1fr]">
      {venue.image && (
        <div className="relative aspect-[4/3] sm:aspect-auto bg-cream-100 overflow-hidden">
          <img
            src={venue.image}
            alt={venue.name}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
      <div className="p-4 sm:p-5 flex flex-col">
        <div className="text-[10px] uppercase tracking-[0.22em] text-tafnit-mint-700 font-semibold">
          {t("about_this_place")}
        </div>
        <h5 className="mt-1 font-display font-bold text-lg text-tafnit-navy-900 leading-tight">
          {venue.name}
        </h5>
        {venue.address && (
          <p className="mt-1 text-xs text-ink-700/75 leading-snug">{venue.address}</p>
        )}
        {venue.description && (
          <p className="mt-2 text-[13px] sm:text-[14px] text-ink-700/85 leading-relaxed">
            {venue.description}
          </p>
        )}
        <div className="mt-auto pt-4 flex flex-wrap gap-x-4 gap-y-2">
          {venue.website && (
            <a
              href={venue.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-tafnit-navy-700 hover:text-tafnit-navy-900 transition-colors"
            >
              <ExternalLink size={12} />
              {t("website")}
            </a>
          )}
          <NavigateLinks name={venue.name} coords={venue.coords} address={venue.address} />
          <button
            type="button"
            onClick={() => onVenueClick?.(venue.id)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-tafnit-navy-700 hover:text-tafnit-navy-900 transition-colors"
          >
            <MapPin size={12} />
            {t("show_on_map")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DayCard({ day, onVenueClick }: Props) {
  return (
    <ol className="space-y-3 sm:space-y-3.5" dir="rtl">
      {day.activities.map((activity, i) => {
        if (activity.isMystery) {
          return (
            <li key={i}>
              <MysteryGuestCard time={activity.time} variant="compact" />
            </li>
          );
        }

        return (
          <ActivityRow
            key={i}
            activity={activity}
            onVenueClick={onVenueClick}
          />
        );
      })}
    </ol>
  );
}
