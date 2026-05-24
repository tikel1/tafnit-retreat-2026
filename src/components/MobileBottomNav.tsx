import { useEffect, useState } from "react";
import { CalendarDays, Map, Hotel, Sparkles, MoreHorizontal, Download, ListChecks } from "lucide-react";
import { useT, type DictKey } from "../lib/dict";
import { canShowInstallOption, triggerInstallPrompt } from "../lib/install";

// Primary 4 tabs are the "I just landed on the site, where do I go"
// essentials. Tips + Checklist hide behind More.
const TABS: { id: string; key: DictKey; Icon: typeof CalendarDays }[] = [
  { id: "plan", key: "nav_plan", Icon: CalendarDays },
  { id: "map",  key: "nav_map",  Icon: Map },
  { id: "stay", key: "nav_stay", Icon: Hotel },
  { id: "tips", key: "nav_tips", Icon: Sparkles },
  { id: "more", key: "nav_more", Icon: MoreHorizontal }
];

const MORE_LINKS: { id: string; key: DictKey; Icon: typeof ListChecks }[] = [
  { id: "checklist", key: "nav_pack", Icon: ListChecks }
];

// Every section that has an anchor on the home page.
const SECTION_IDS = ["plan", "map", "stay", "tips", "checklist"];

const MORE_SECTION_IDS = new Set(["checklist"]);

export default function MobileBottomNav() {
  const t = useT();
  const [active, setActive] = useState<string>("plan");
  const [moreOpen, setMoreOpen] = useState(false);
  const [showInstall] = useState<boolean>(() => canShowInstallOption());

  const handleInstallClick = () => {
    setMoreOpen(false);
    triggerInstallPrompt();
  };

  useEffect(() => {
    const onScroll = () => {
      const fromTop = window.scrollY + window.innerHeight * 0.3;
      let current = SECTION_IDS[0];
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= fromTop) current = id;
      }
      setActive(MORE_SECTION_IDS.has(current) ? "more" : current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (id: string) => {
    setMoreOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {moreOpen && (
        <div
          className="fixed inset-0 z-[8000] bg-tafnit-navy-900/30 backdrop-blur-sm md:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="absolute bottom-[calc(64px+env(safe-area-inset-bottom))] inset-x-0 bg-cream-50 border-t border-cream-200 rounded-t-3xl px-4 pt-3 pb-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="w-10 h-1 bg-cream-200 rounded-full mx-auto mb-4" />
            <div className="grid grid-cols-1 gap-2">
              {MORE_LINKS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => goTo(l.id)}
                  className="text-start bg-cream-100 hover:bg-cream-200 active:bg-cream-200 transition-colors rounded-xl px-4 py-4 text-base font-semibold text-tafnit-navy-900 flex items-center gap-3"
                >
                  <span className="icon-chip w-9 h-9">
                    <l.Icon size={18} strokeWidth={1.8} />
                  </span>
                  {t(l.key)}
                </button>
              ))}
            </div>
            {showInstall && (
              <button
                onClick={handleInstallClick}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-tafnit-navy-700 hover:bg-tafnit-navy-900 active:bg-tafnit-navy-900 text-cream-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-sm shadow-tafnit-navy-900/20 transition-colors"
              >
                <Download size={16} />
                {t("install_menu_label")}
              </button>
            )}
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 inset-x-0 z-[8001] md:hidden bg-cream-50/95 backdrop-blur-md border-t border-cream-200 shadow-[0_-4px_24px_rgba(15,42,85,0.08)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        dir="rtl"
      >
        <ul className="grid grid-cols-5 h-16">
          {TABS.map(({ id, key, Icon }) => {
            const isActive = active === id;
            return (
              <li key={id}>
                <button
                  onClick={() => (id === "more" ? setMoreOpen((o) => !o) : goTo(id))}
                  className={`w-full h-full flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors active:scale-[0.96] ${
                    isActive ? "text-tafnit-navy-900" : "text-ink-700/70"
                  }`}
                >
                  <span
                    className={`w-10 h-7 flex items-center justify-center rounded-full transition-colors ${
                      isActive ? "bg-tafnit-mint-100 text-tafnit-mint-700" : ""
                    }`}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.4 : 1.8} />
                  </span>
                  {t(key)}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
