import { Navigation } from "lucide-react";
import { googleMapsPlaceUrl, wazePlaceUrl, type NavTarget } from "../lib/nav";
import { useT } from "../lib/dict";

interface Props {
  name: string;
  coords: [number, number];
  address?: string;
  size?: number;
  className?: string;
}

/**
 * Side-by-side Google Maps + Waze deep links. Opens the place's listing
 * (not active navigation) so the user can confirm before tapping
 * "Directions" / "Go" themselves.
 */
export default function NavigateLinks({ name, coords, address, size = 12, className }: Props) {
  const t = useT();
  const target: NavTarget = { name, coords, address };

  return (
    <span className={`inline-flex items-center gap-3 ${className ?? ""}`}>
      <a
        href={googleMapsPlaceUrl(target)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("navigate_google_aria")}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-700 hover:text-tafnit-navy-700 transition-colors"
      >
        <Navigation size={size} />
        <span>{t("navigate_google")}</span>
      </a>
      <span className="text-ink-700/30 text-xs leading-none" aria-hidden>·</span>
      <a
        href={wazePlaceUrl(target)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("navigate_waze_aria")}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-700 hover:text-[#33CCFF] transition-colors"
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M3 11a9 9 0 1 1 16.5 5l1 4-4-1A9 9 0 0 1 3 11z" />
          <circle cx="9" cy="11" r="0.8" fill="currentColor" />
          <circle cx="15" cy="11" r="0.8" fill="currentColor" />
        </svg>
        <span>{t("navigate_waze")}</span>
      </a>
    </span>
  );
}
