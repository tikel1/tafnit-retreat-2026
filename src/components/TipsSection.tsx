import { AlertTriangle, Info, Phone, Globe } from "lucide-react";
import { motion } from "framer-motion";
import Section from "./Section";
import { tips } from "../data/tips";
import { useT } from "../lib/dict";

export default function TipsSection() {
  const t = useT();

  return (
    <Section
      id="tips"
      eyebrow={t("tips_eyebrow")}
      title={t("tips_title")}
      kicker={t("tips_kicker")}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {tips.map((tip, i) => {
          const isWarning = tip.severity === "warning";
          const Icon = isWarning ? AlertTriangle : Info;
          return (
            <motion.article
              key={tip.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
              className="card-tafnit p-4 sm:p-5 flex flex-col"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`icon-chip ${
                    isWarning
                      ? "bg-sun-500/15 text-sun-500"
                      : "bg-tafnit-mint-100 text-tafnit-mint-700"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-[0.22em] font-semibold mb-0.5">
                    <span
                      className={
                        isWarning ? "text-sun-500" : "text-tafnit-mint-700"
                      }
                    >
                      {isWarning ? t("severity_warning") : t("severity_info")}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-base text-tafnit-navy-900 leading-tight">
                    {tip.title}
                  </h3>
                </div>
              </div>
              <p className="mt-3 text-[15px] text-ink-700/90 leading-relaxed">
                {tip.body}
              </p>
              {tip.link && (
                <div className="mt-4">
                  <a
                    href={tip.link}
                    className="btn-mint"
                    target={tip.link.startsWith("http") ? "_blank" : undefined}
                    rel={tip.link.startsWith("http") ? "noopener noreferrer" : undefined}
                  >
                    {tip.link.startsWith("tel:") ? (
                      <Phone size={14} />
                    ) : (
                      <Globe size={14} />
                    )}
                    {tip.linkLabel ?? t("open_external")}
                  </a>
                </div>
              )}
            </motion.article>
          );
        })}
      </div>
    </Section>
  );
}
