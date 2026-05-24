import {
  Ship,
  Coffee,
  Sparkles,
  Waves,
  Hotel,
  UtensilsCrossed,
  Mic,
  Sunrise,
  Handshake,
  Users,
  type LucideIcon
} from "lucide-react";
import type { ActivityIcon } from "../data/types";

const ICON_MAP: Record<ActivityIcon, LucideIcon> = {
  coffee: Coffee,
  boat: Ship,
  hotel: Hotel,
  spa: Sparkles,
  pool: Waves,
  dinner: UtensilsCrossed,
  mic: Mic,
  breakfast: Sunrise,
  farewell: Handshake,
  meeting: Users
};

/**
 * Pick the Lucide icon for an activity row. Falls back to a sun for
 * any unknown id so missing icons don't crash the layout.
 */
export function activityIconFor(icon: ActivityIcon | undefined): LucideIcon {
  if (icon && ICON_MAP[icon]) return ICON_MAP[icon];
  return Sunrise;
}
