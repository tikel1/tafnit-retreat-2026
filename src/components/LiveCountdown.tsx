import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { partsFromMs, type CountdownParts } from "../lib/tripState";

const LABELS = {
  days: "ימים",
  hrs: "שעות",
  min: "דקות",
  sec: "שניות",
} as const;

interface Props {
  /** Target date to count down to (or up from). */
  target: Date;
  /** "down" before target, switches to "up" after target. */
  mode?: "down" | "up";
  /** Show seconds block (default true). */
  showSeconds?: boolean;
  /** Show days block (default true). */
  showDays?: boolean;
  /** Visual size: "lg" for hero, "md" default. */
  size?: "md" | "lg";
  /** "light" on dark hero backgrounds, "dark" on cream. */
  tone?: "light" | "dark";
  className?: string;
}

interface DigitCellProps {
  value: string;
  size: "md" | "lg";
  tone: "light" | "dark";
}

function DigitCell({ value, size, tone }: DigitCellProps) {
  // Numerals are always Latin (Assistant) with tabular-num so the digit
  // box width is stable as values change.
  const digitCls =
    size === "lg"
      ? "font-latin-display text-5xl sm:text-7xl"
      : "font-latin-display text-3xl sm:text-5xl";
  const colorCls = tone === "light" ? "text-white" : "text-tafnit-navy-900";
  return (
    <span className="relative inline-grid min-w-[1ch] place-items-center tabular-nums align-middle">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "42%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-42%", opacity: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
          className={`col-start-1 row-start-1 flex items-center justify-center ${digitCls} ${colorCls} font-bold`}
          style={{
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

interface BlockProps {
  value: number;
  label: string;
  pad: number;
  size: "md" | "lg";
  tone: "light" | "dark";
  pulse?: boolean;
}

function CountdownBlock({ value, label, pad, size, tone }: BlockProps) {
  const str = String(value).padStart(pad, "0");

  const padCls =
    size === "lg" ? "pt-1 pb-1.5 sm:pt-1.5 sm:pb-2.5" : "pt-1 pb-1.5 sm:pt-1.5 sm:pb-2";

  const bgCls =
    tone === "light"
      ? "bg-black/30 backdrop-blur-sm"
      : "bg-tafnit-mint-100";

  const labelCls = tone === "light" ? "text-tafnit-mint-300" : "text-tafnit-navy-700/80";

  return (
    <div className="flex flex-col items-center gap-1.5 sm:gap-2">
      <div className={`flex items-center justify-center px-2 sm:px-3 ${padCls} rounded-xl ${bgCls}`}>
        <span className="flex items-center justify-center">
          {str.split("").map((d, i) => (
            <DigitCell key={`${label}-${i}`} value={d} size={size} tone={tone} />
          ))}
        </span>
      </div>
      <div
        className={`uppercase tracking-[0.22em] font-semibold ${labelCls} ${
          size === "lg" ? "text-[10px] sm:text-xs" : "text-[9px] sm:text-[11px]"
        }`}
      >
        {label}
      </div>
    </div>
  );
}

function Sep({ size, tone }: { size: "md" | "lg"; tone: "light" | "dark" }) {
  const sizeCls =
    size === "lg"
      ? "font-latin-display text-4xl sm:text-6xl"
      : "font-latin-display text-2xl sm:text-4xl";
  const colorCls = tone === "light" ? "text-white/75" : "text-tafnit-navy-700/50";
  return (
    <span className={`${sizeCls} ${colorCls} px-0.5 sm:px-1 self-center leading-none font-bold`}>
      :
    </span>
  );
}

export default function LiveCountdown({
  target,
  mode = "down",
  showSeconds = true,
  showDays = true,
  size = "md",
  tone = "dark",
  className
}: Props) {
  const [parts, setParts] = useState<CountdownParts>(() => {
    const ms = mode === "down" ? target.getTime() - Date.now() : Date.now() - target.getTime();
    return partsFromMs(ms);
  });
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    function tick() {
      const ms = mode === "down" ? target.getTime() - Date.now() : Date.now() - target.getTime();
      setParts(partsFromMs(ms));
      const delay = 1000 - (Date.now() % 1000);
      if (!cancelled) {
        timerRef.current = window.setTimeout(tick, delay);
      }
    }
    tick();
    return () => {
      cancelled = true;
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [target, mode]);

  return (
    <div dir="ltr" className={`flex items-center justify-center gap-1 sm:gap-2 ${className ?? ""}`}>
      {showDays && (
        <>
          <CountdownBlock
            value={parts.days}
            label={LABELS.days}
            pad={String(parts.days).length > 2 ? 3 : 2}
            size={size}
            tone={tone}
          />
          <Sep size={size} tone={tone} />
        </>
      )}
      <CountdownBlock value={parts.hours} label={LABELS.hrs} pad={2} size={size} tone={tone} />
      <Sep size={size} tone={tone} />
      <CountdownBlock value={parts.minutes} label={LABELS.min} pad={2} size={size} tone={tone} />
      {showSeconds && (
        <>
          <Sep size={size} tone={tone} />
          <CountdownBlock value={parts.seconds} label={LABELS.sec} pad={2} size={size} tone={tone} />
        </>
      )}
    </div>
  );
}
