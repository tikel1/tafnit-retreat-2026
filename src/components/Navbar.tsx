import { useEffect, useState } from "react";
import { useT, type DictKey } from "../lib/dict";
import { assetUrl } from "../lib/assets";

// 5 primary sections of the retreat site. AI chat lives in its own FAB.
const links: { id: string; key: DictKey }[] = [
  { id: "plan",      key: "nav_plan" },
  { id: "map",       key: "nav_map" },
  { id: "stay",      key: "nav_stay" },
  { id: "tips",      key: "nav_tips" },
  { id: "checklist", key: "nav_pack" }
];

export default function Navbar() {
  const t = useT();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      dir="rtl"
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-cream-50/90 backdrop-blur-md border-b border-cream-200 shadow-sm"
          : "bg-transparent"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Right-side brand (RTL primary). Round icon tile + wordmark. */}
        <button
          onClick={() => handleClick("hero")}
          className="flex items-center gap-2 group min-h-11"
          aria-label={t("brand")}
        >
          <span
            className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-tafnit-mint-100 overflow-hidden ring-1 ring-tafnit-mint-300/60"
            aria-hidden
          >
            <img
              src={`${assetUrl("app-icon-192.png")}?v=2`}
              alt=""
              className="w-7 h-7 object-contain"
            />
          </span>
          <span className="flex items-baseline gap-1.5">
            <span
              className={`font-display font-bold text-lg sm:text-xl transition-colors ${
                scrolled
                  ? "text-tafnit-navy-900 group-hover:text-tafnit-mint-700"
                  : "text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.55)] group-hover:text-tafnit-mint-300"
              }`}
            >
              <span className="hidden sm:inline">{t("brand")}</span>
              <span className="sm:hidden">{t("brand_short")}</span>
            </span>
            <span
              className={`font-display text-xs sm:text-sm font-semibold ${
                scrolled ? "text-tafnit-mint-700" : "text-tafnit-mint-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]"
              }`}
            >
              {t("brand_year")}
            </span>
          </span>
        </button>

        {/* Center/left desktop links. */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => handleClick(l.id)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                scrolled
                  ? "text-ink-700 hover:text-tafnit-navy-700"
                  : "text-white/90 hover:text-tafnit-mint-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]"
              }`}
            >
              {t(l.key)}
            </button>
          ))}
        </div>

        <div className="md:hidden w-2" />
      </div>
    </nav>
  );
}
