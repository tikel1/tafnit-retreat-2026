import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Sparkles, RotateCcw, KeyRound } from "lucide-react";
import { useT } from "../lib/dict";
import {
  loadHistory,
  saveHistory,
  clearHistory,
  newMessage,
  type ChatMessage
} from "../lib/gemininio/chatHistory";
import {
  getBuiltinKey,
  getUserKey,
  setUserKey,
  clearUserKey,
  getActiveKey
} from "../lib/gemininio/storage";
import { streamReply } from "../lib/gemininio/generate";
import { CHATTFNT_OPENER } from "../lib/gemininio/persona";

/**
 * ChatTFNT — the floating AI host chat.
 *
 * Text-only port of tuscany's Gemininio (no voice modules). Renders as a
 * FAB in the bottom-end corner that opens into a bottom-sheet chat on
 * mobile and a card on md+. Streams replies from Gemini in real time;
 * gracefully shows a paste-your-key form if neither a built-in nor a
 * per-device key is available.
 */
export default function Gemininio() {
  const t = useT();

  // We DON'T early-return on missing key — instead we show the FAB and
  // surface the setup form when the user opens the sheet. That way the
  // chat is discoverable even when the deploy didn't bake a key in.
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>(loadHistory);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [showSetup, setShowSetup] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Persist history on every change.
  useEffect(() => {
    saveHistory(history);
  }, [history]);

  // Auto-scroll on new content.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [history, open, streaming]);

  // Re-read on every render — the key store can change due to user
  // pasting one in the setup sheet or hitting "reset".
  const activeKey = getActiveKey();
  const builtinKey = useMemo(() => getBuiltinKey(), []);

  // Show the opener as a synthetic first message whenever history is empty.
  const renderHistory: ChatMessage[] = useMemo(() => {
    if (history.length > 0) return history;
    return [
      {
        id: "opener",
        role: "model",
        content: CHATTFNT_OPENER,
        ts: 0
      }
    ];
  }, [history]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    const key = getActiveKey();
    if (!key) {
      setShowSetup(true);
      return;
    }

    setError(null);
    setInput("");

    const userMsg = newMessage("user", text);
    const placeholder = newMessage("model", "");
    const nextHistory = [...history, userMsg, placeholder];
    setHistory(nextHistory);
    setStreaming(true);

    try {
      let assembled = "";
      for await (const chunk of streamReply(
        key,
        [...history, userMsg] // do NOT include the empty placeholder
      )) {
        assembled += chunk;
        setHistory((h) => {
          const next = h.slice();
          next[next.length - 1] = { ...next[next.length - 1], content: assembled };
          return next;
        });
      }
      // If the stream returned nothing, soften it with a polite fallback.
      if (!assembled) {
        setHistory((h) => {
          const next = h.slice();
          next[next.length - 1] = {
            ...next[next.length - 1],
            content: "סליחה, לא הצלחתי לענות הפעם. אפשר לנסות שוב?"
          };
          return next;
        });
      }
    } catch (e) {
      console.error(e);
      setError(t("gem_error_generic"));
      setHistory((h) => h.slice(0, -1)); // drop the failed placeholder
    } finally {
      setStreaming(false);
    }
  }, [history, input, streaming, t]);

  const handleSaveKey = () => {
    const v = keyInput.trim();
    if (!v) return;
    setUserKey(v);
    setShowSetup(false);
    setKeyInput("");
  };

  const handleClearKey = () => {
    clearUserKey();
    setShowSetup(true);
  };

  const handleReset = () => {
    clearHistory();
    setHistory([]);
    setError(null);
  };

  return (
    <>
      {/* Floating launcher */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="gem-fab"
            type="button"
            initial={{ opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(true)}
            className="fixed z-[7000] end-4 bottom-[calc(72px+env(safe-area-inset-bottom))] md:bottom-6 inline-flex items-center justify-center w-14 h-14 rounded-full bg-tafnit-navy-700 text-cream-50 shadow-lg shadow-tafnit-navy-900/30 hover:bg-tafnit-navy-900 transition-colors"
            aria-label={t("gem_open")}
          >
            <span
              className="absolute inset-0 rounded-full bg-tafnit-mint-500/30 animate-gem-breathe pointer-events-none"
              aria-hidden
            />
            <MessageCircle size={22} strokeWidth={1.8} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="gem-backdrop"
              className="fixed inset-0 z-[7000] bg-tafnit-navy-900/40 backdrop-blur-[2px] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              aria-hidden
            />

            <motion.div
              key="gem-sheet"
              role="dialog"
              aria-modal="true"
              aria-label={t("gem_title")}
              dir="rtl"
              className="fixed z-[7001] inset-x-0 bottom-0 md:inset-auto md:end-6 md:bottom-6 md:w-[400px] md:h-[600px]
                         bg-cream-50 text-ink-900
                         rounded-t-3xl md:rounded-3xl
                         border border-cream-200 shadow-[0_-12px_40px_-8px_rgba(15,42,85,0.25)] md:shadow-[0_24px_60px_-12px_rgba(15,42,85,0.35)]
                         flex flex-col overflow-hidden
                         max-h-[85vh] md:max-h-none"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
            >
              {/* Header */}
              <div className="relative bg-tafnit-navy-900 text-cream-50 px-4 py-3 flex items-center gap-3 shrink-0">
                <span
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-tafnit-mint-500 text-tafnit-navy-900 shrink-0"
                  aria-hidden
                >
                  <Sparkles size={18} strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-display font-bold text-base leading-tight">
                    {t("gem_title")}
                  </div>
                  <div className="text-[11px] text-cream-50/75 leading-tight">
                    {t("gem_tagline")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  aria-label={t("gem_reset_history")}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-cream-50/10 transition-colors text-cream-50/80 hover:text-cream-50"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t("gem_close")}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-cream-50/10 transition-colors text-cream-50/80 hover:text-cream-50"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body — either chat scroller, or setup form */}
              {showSetup || !activeKey ? (
                <div className="flex-1 overflow-y-auto px-4 py-5">
                  <div className="flex items-center gap-2 mb-2 text-tafnit-mint-700">
                    <KeyRound size={16} />
                    <h4 className="font-display font-bold text-tafnit-navy-900">
                      {t("gem_setup_title")}
                    </h4>
                  </div>
                  <p className="text-sm text-ink-700/85 leading-relaxed">
                    {t("gem_setup_blurb")}
                  </p>
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs text-tafnit-navy-700 underline decoration-tafnit-mint-300 underline-offset-4 hover:text-tafnit-navy-900"
                  >
                    {t("gem_setup_link")}
                  </a>
                  <div className="mt-4 flex flex-col gap-2">
                    <input
                      type="password"
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      placeholder={t("gem_key_placeholder")}
                      autoComplete="off"
                      className="w-full rounded-xl border border-cream-300 bg-white px-3 py-2.5 text-sm font-mono text-ink-900 focus:outline-none focus:ring-2 focus:ring-tafnit-navy-500/30"
                    />
                    <button
                      type="button"
                      onClick={handleSaveKey}
                      disabled={!keyInput.trim()}
                      className="btn-primary justify-center disabled:opacity-40"
                    >
                      {t("gem_save_key")}
                    </button>
                    {builtinKey && (
                      <p className="text-[11px] text-ink-700/65 leading-relaxed">
                        {t("gem_builtin_key_note")}
                      </p>
                    )}
                    {getUserKey() && (
                      <button
                        type="button"
                        onClick={handleClearKey}
                        className="text-xs text-ink-700/75 hover:text-tafnit-navy-700 underline decoration-cream-300 underline-offset-4 self-start"
                      >
                        {t("gem_clear_key")}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div
                    ref={scrollerRef}
                    className="gem-chat-scroll flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3"
                  >
                    {renderHistory.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words ${
                            m.role === "user"
                              ? "bg-tafnit-navy-700 text-cream-50"
                              : "bg-white border border-cream-200 text-ink-900 shadow-sm"
                          }`}
                        >
                          {m.content || (
                            <span className="inline-flex items-center gap-1 text-tafnit-mint-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-current animate-typing-dot" />
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-current animate-typing-dot"
                                style={{ animationDelay: "-0.15s" }}
                              />
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-current animate-typing-dot"
                                style={{ animationDelay: "-0.3s" }}
                              />
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {error && (
                      <div className="text-[12px] text-sun-500 text-center py-2">
                        {error}
                      </div>
                    )}
                    {history.length === 0 && (
                      <div className="text-[11px] text-ink-700/55 text-center pt-2">
                        {t("gem_first_hint")}
                      </div>
                    )}
                  </div>

                  <form
                    className="border-t border-cream-200 bg-white px-3 py-2 flex items-end gap-2 shrink-0"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void handleSend();
                    }}
                    style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
                  >
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void handleSend();
                        }
                      }}
                      rows={1}
                      placeholder={t("gem_input_placeholder")}
                      className="flex-1 resize-none rounded-2xl border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-700/40 focus:outline-none focus:ring-2 focus:ring-tafnit-navy-500/30 max-h-32"
                    />
                    <button
                      type="submit"
                      aria-label={t("gem_send")}
                      disabled={!input.trim() || streaming}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-tafnit-navy-700 text-cream-50 hover:bg-tafnit-navy-900 transition-colors disabled:opacity-40"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
