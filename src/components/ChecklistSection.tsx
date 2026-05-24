import { useState } from "react";
import { motion } from "framer-motion";
import { Check, RotateCcw } from "lucide-react";
import Section from "./Section";
import { checklist } from "../data/checklist";
import { useT } from "../lib/dict";

const STORAGE_KEY = "tafnit:checklist:v1";

function loadDone(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as Record<string, boolean>;
    return {};
  } catch {
    return {};
  }
}

function saveDone(map: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export default function ChecklistSection() {
  const t = useT();
  const [done, setDone] = useState<Record<string, boolean>>(loadDone);

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveDone(next);
      return next;
    });
  };

  const reset = () => {
    setDone({});
    saveDone({});
  };

  const doneCount = Object.values(done).filter(Boolean).length;
  const total = checklist.length;
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  return (
    <Section
      id="checklist"
      eyebrow={t("checklist_eyebrow")}
      title={t("checklist_title")}
      kicker={t("checklist_kicker")}
    >
      <div className="max-w-3xl">
        {/* Progress bar */}
        <div className="card-tafnit p-4 sm:p-5 mb-5 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="text-[11px] uppercase tracking-[0.22em] text-tafnit-mint-700 font-semibold">
                {t("checklist_progress", { done: doneCount, total })}
              </div>
              <div className="text-xs font-display font-bold text-tafnit-navy-900">
                {pct}%
              </div>
            </div>
            <div className="h-2 bg-cream-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-l from-tafnit-mint-500 to-tafnit-mint-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={reset}
            className="btn-ghost text-xs"
            aria-label={t("checklist_reset")}
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">{t("checklist_reset")}</span>
          </button>
        </div>

        <ul className="space-y-2.5">
          {checklist.map((item) => {
            const isDone = !!done[item.id];
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-pressed={isDone}
                  className={`w-full text-start card-tafnit p-3.5 sm:p-4 flex items-start gap-3 transition-all ${
                    isDone ? "bg-tafnit-mint-100/60" : "hover:shadow-md"
                  }`}
                >
                  <span
                    className={`mt-0.5 shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                      isDone
                        ? "bg-tafnit-mint-500 text-white ring-1 ring-tafnit-mint-600"
                        : "bg-white ring-1 ring-cream-300"
                    }`}
                  >
                    {isDone && <Check size={14} strokeWidth={3} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`font-display font-semibold text-[15px] leading-snug ${
                        isDone
                          ? "text-tafnit-navy-700/65 line-through decoration-tafnit-mint-500/60"
                          : "text-tafnit-navy-900"
                      }`}
                    >
                      {item.text}
                    </div>
                    {item.detail && (
                      <p
                        className={`mt-1 text-[13px] leading-relaxed ${
                          isDone ? "text-ink-700/55" : "text-ink-700/80"
                        }`}
                      >
                        {item.detail}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}
