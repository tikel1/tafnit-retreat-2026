import { Heart } from "lucide-react";
import { useT } from "../lib/dict";

export default function Footer() {
  const t = useT();
  return (
    <footer className="border-t border-cream-200 bg-gradient-to-b from-cream-100/0 to-cream-100/80 mt-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="text-center max-w-xl mx-auto">
          <h3 className="font-display font-bold text-3xl sm:text-4xl text-tafnit-navy-900 leading-tight">
            {t("footer_made_with")}
          </h3>
          <p className="mt-3 text-ink-700/80 text-base sm:text-lg">
            {t("footer_tagline")}
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-700/70 flex-wrap">
            <span className="font-display font-semibold">{t("brand_short")}</span>
            <span aria-hidden>·</span>
            <span>{t("brand_subtitle")}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              נבנה ב
              <Heart size={10} className="text-tafnit-mint-600 fill-tafnit-mint-500" />
            </span>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-ink-700/60">
            <a
              href={t("footer_tafnit_url")}
              target="_blank"
              rel="noreferrer"
              className="hover:text-tafnit-navy-700 transition-colors underline decoration-tafnit-mint-300 underline-offset-4"
            >
              {t("footer_tafnit")}
            </a>
          </div>
          <div className="mt-4 text-[10px] text-ink-700/45 leading-relaxed max-w-md mx-auto">
            {t("footer_attribution")}
          </div>
        </div>
      </div>
    </footer>
  );
}
