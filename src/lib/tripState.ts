import { itinerary } from "../data/itinerary";
import type { Day } from "../data/types";

/**
 * Trip clock. The retreat spans local Thursday 4 June 2026 morning
 * (~08:30) through Friday 5 June 2026 ~13:00.
 *
 * `featured` flips from today to tomorrow at 20:00 local time on Day 1
 * so by the time everyone's at dinner the hero already previews
 * Friday's plan.
 */
export const TRIP_START = new Date("2026-06-04T08:30:00+03:00");
export const TRIP_END = new Date("2026-06-05T13:00:00+03:00");

export interface CountdownParts {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export type TripState =
  | { phase: "before"; daysUntil: number; countdown: CountdownParts }
  | {
      phase: "during";
      today: Day;
      tomorrow?: Day;
      featured: Day;
      isFeaturingTomorrow: boolean;
      dayIndex: number;
      elapsed: CountdownParts;
    }
  | { phase: "after" };

function startOfDayLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isAfterEveningCutoff(now: Date): boolean {
  return now.getHours() >= 20;
}

export function partsFromMs(ms: number): CountdownParts {
  const safe = Math.max(0, ms);
  const days = Math.floor(safe / (1000 * 60 * 60 * 24));
  const hours = Math.floor((safe / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((safe / (1000 * 60)) % 60);
  const seconds = Math.floor((safe / 1000) % 60);
  return { totalMs: safe, days, hours, minutes, seconds };
}

export function getCurrentOrUpcomingDayNumber(now: Date = new Date()): number {
  const state = getTripState(now);
  if (state.phase === "during") return state.featured.dayNumber;
  return 1;
}

export function getTripState(now: Date = new Date()): TripState {
  const today = startOfDayLocal(now);
  const start = startOfDayLocal(TRIP_START);
  const end = startOfDayLocal(TRIP_END);

  if (today < start) {
    const ms = TRIP_START.getTime() - now.getTime();
    const countdown = partsFromMs(ms);
    const daysUntil = Math.round(
      (start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return { phase: "before", daysUntil, countdown };
  }
  if (today > end) {
    return { phase: "after" };
  }

  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const todayIso = `${y}-${m}-${d}`;
  const idx = itinerary.findIndex((day) => day.date === todayIso);
  const safeIdx = idx === -1 ? 0 : idx;
  const elapsed = partsFromMs(now.getTime() - TRIP_START.getTime());

  const todayDay = itinerary[safeIdx];
  const tomorrowDay = itinerary[safeIdx + 1];
  const featured =
    isAfterEveningCutoff(now) && tomorrowDay ? tomorrowDay : todayDay;
  const isFeaturingTomorrow = featured !== todayDay;

  return {
    phase: "during",
    today: todayDay,
    tomorrow: tomorrowDay,
    featured,
    isFeaturingTomorrow,
    dayIndex: safeIdx,
    elapsed
  };
}
