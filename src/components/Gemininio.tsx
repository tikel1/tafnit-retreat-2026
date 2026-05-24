import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Send,
  Mic,
  Globe,
  Trash2,
  ExternalLink,
  Loader2,
  FilePenLine,
  Menu,
  Volume2,
  VolumeX,
  AudioLines
} from "lucide-react";
import { useT } from "../lib/dict";
import { useLang } from "../lib/i18n";
import { LiveSession } from "../lib/gemininio/live";
import { PcmPlayer } from "../lib/gemininio/audio";
import { VoiceRecorder } from "../lib/gemininio/voiceRecorder";
import { transcribeAudio } from "../lib/gemininio/transcribe";
import {
  buildTypedReplySystemPrompt,
  CHATTFNT_OPENER
} from "../lib/gemininio/persona";
import { generateGroundedReply, generateChatTitle } from "../lib/gemininio/groundedSearch";
import {
  getApiKey,
  setApiKey,
  clearApiKey,
  loadHistory,
  saveHistory,
  clearHistory,
  loadConversations,
  saveConversations,
  loadActiveConversationId,
  saveActiveConversationId,
  hasBuildTimeKey,
  hasUserOverride,
  createId,
  type PersistedMessage,
  type Conversation
} from "../lib/gemininio/storage";
import { userFacingGemError } from "../lib/gemininio/logUserFacingError";
import { completedTurnsForApi } from "../lib/gemininio/chatHistory";
import { subscribeOpenGemininio } from "../lib/gemininio/openEvent";

/**
 * ChatTFNT — the floating AI host chat with real-time sound and voice.
 *
 * Technical specifications match the Tuscany project exactly:
 * - Direct Gemini Live API over WebSocket when speaker is unmuted (sound on)
 * - Tap-to-record with voice activity detection (VAD) and REST transcription
 * - Dynamic system prompt built directly from physical Tafnit retreat data
 * - Multiple conversations and auto-chat titles
 * - Google Search grounding tool (globe toggle) on the REST path
 */

type ChatStatus =
  | "closed"           // panel not open
  | "needs-key"        // panel open, no API key yet
  | "ready"            // key present, no live session
  | "connecting"
  | "recording"        // mic is open, capturing user's voice
  | "transcribing"     // user finished, audio uploading + being transcribed
  | "thinking"         // user finished, waiting for / receiving model reply
  | "speaking"         // model is currently producing audio
  | "error";

interface Message extends PersistedMessage {
  /** Lets us update the SAME bubble as text streams in. */
  streaming?: boolean;
}

export default function Gemininio() {
  const t = useT();
  const { lang } = useLang();

  /* ---------------- state ---------------- */

  const [status, setStatus] = useState<ChatStatus>("closed");
  const [keyDraft, setKeyDraft] = useState("");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>(() => loadHistory());
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations());
  const [activeConvId, setActiveConvId] = useState<string | null>(() => loadActiveConversationId());

  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [micVolume, setMicVolume] = useState(0);

  // Audio is OFF by default. Persisted to localStorage.
  const [audioEnabled, setAudioEnabled] = useState<boolean>(() => {
    try {
      return typeof localStorage !== "undefined" &&
        localStorage.getItem("gem-audio-enabled") === "true";
    } catch {
      return false;
    }
  });

  /** Google Search on REST sends only. Default off. */
  const [webSearchEnabled, setWebSearchEnabled] = useState<boolean>(() => {
    try {
      return (
        typeof localStorage !== "undefined" &&
        localStorage.getItem("gem-web-search-enabled") === "true"
      );
    } catch {
      return false;
    }
  });

  /* ---------------- refs ---------------- */

  const sessionRef = useRef<LiveSession | null>(null);
  const playerRef = useRef<PcmPlayer | null>(null);
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const audioEnabledRef = useRef(audioEnabled);
  const webSearchEnabledRef = useRef(webSearchEnabled);

  /* ---------------- side effects ---------------- */

  // Persist history on change
  useEffect(() => {
    saveHistory(messages.map(m => ({ role: m.role, text: m.text, ts: m.ts })));
  }, [messages]);

  // Persist audio preference
  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
    try {
      localStorage.setItem("gem-audio-enabled", String(audioEnabled));
    } catch {
      /* ignore */
    }
  }, [audioEnabled]);

  // Persist web search preference
  useEffect(() => {
    webSearchEnabledRef.current = webSearchEnabled;
    try {
      localStorage.setItem("gem-web-search-enabled", String(webSearchEnabled));
    } catch {
      /* ignore */
    }
  }, [webSearchEnabled]);

  // Auto-scroll on new message
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  // Tear down on close
  useEffect(() => {
    if (status !== "closed") return;
    sessionRef.current?.close();
    sessionRef.current = null;
    recorderRef.current?.cancel();
    recorderRef.current = null;
    playerRef.current?.stop();
    playerRef.current = null;
  }, [status]);

  // Prevent background scrolling when panel is open
  useEffect(() => {
    if (status === "closed") return;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    const prevOverscroll = document.body.style.overscrollBehavior;
    const prevHtmlOs = document.documentElement.style.overscrollBehavior;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "contain";
    document.documentElement.style.overscrollBehavior = "none";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
      document.body.style.overscrollBehavior = prevOverscroll;
      document.documentElement.style.overscrollBehavior = prevHtmlOs;
    };
  }, [status]);

  // subscribe to custom open event
  useEffect(() => {
    return subscribeOpenGemininio(() => {
      open();
    });
  }, []);

  /* ---------------- handlers ---------------- */

  async function handleToggleAudio() {
    const next = !audioEnabled;
    setAudioEnabled(next);

    if (next) {
      if (!playerRef.current) playerRef.current = new PcmPlayer();
      try {
        await playerRef.current.ensureAudioUnlocked();
      } catch {
        /* ignore */
      }
    } else {
      playerRef.current?.stop();
      if (status === "speaking") {
        setStatus("ready");
      }
    }
  }

  function startNewChat() {
    sessionRef.current?.close();
    sessionRef.current = null;

    const id = createId();
    const welcomeText = CHATTFNT_OPENER || "אהלן! אני ChatTFNT 🌊 שאלו על התוכנית, המלון או השייט.";
    const welcome: Message = {
      role: "model",
      text: welcomeText,
      ts: Date.now()
    };

    const newConv: Conversation = {
      id,
      title: lang === "he" ? "שיחה חדשה" : "New Chat",
      updatedAt: Date.now(),
      messages: [welcome]
    };

    setConversations(prev => {
      const next = [newConv, ...prev];
      saveConversations(next);
      return next;
    });
    setActiveConvId(newConv.id);
    saveActiveConversationId(newConv.id);
    setMessages([welcome]);
    setShowHistory(false);
  }

  function open() {
    const key = getApiKey();
    setError(null);
    if (!key) {
      setStatus("needs-key");
      return;
    }
    setStatus("ready");
  }

  function close() {
    setStatus("closed");
  }

  async function submitUserMessage(explicitText?: string) {
    const raw = explicitText ?? text;
    const trimmed = raw.trim();
    if (!trimmed) return;
    const searchOn = webSearchEnabledRef.current;

    const priorForApi = completedTurnsForApi(messages);
    if (explicitText === undefined) setText("");
    setMessages(ms => [
      ...ms,
      { role: "user", text: trimmed, ts: Date.now() },
      { role: "model", text: "", ts: Date.now() + 1, streaming: true }
    ]);
    setStatus("thinking");
    setError(null);

    const apiKey = getApiKey();
    if (!apiKey) {
      setStatus("needs-key");
      setMessages(ms => ms.filter(m => !(m.role === "model" && m.streaming && !m.text)));
      return;
    }

    const activeId = loadActiveConversationId();
    const currentConv = conversations.find(c => c.id === activeId);
    const needsTitle = !currentConv || currentConv.title === "שיחה חדשה" || currentConv.title === "New Chat" || currentConv.title === "Original Chat";

    if (needsTitle) {
      generateChatTitle(apiKey, trimmed, lang).then(title => {
        setConversations(convs => {
          let updated = false;
          const next = convs.map(c => {
            if (c.id === loadActiveConversationId() && (c.title === "New Chat" || c.title === "שיחה חדשה" || c.title === "Original Chat")) {
              updated = true;
              return { ...c, title };
            }
            return c;
          });
          if (updated) {
            saveConversations(next);
            return next;
          }
          return convs;
        });
      }).catch(() => { /* ignore */ });
    }

    const sys = buildTypedReplySystemPrompt();
    try {
      const reply = await generateGroundedReply({
        apiKey,
        systemInstruction: sys,
        userMessage: trimmed,
        useGoogleSearch: searchOn,
        history: priorForApi
      });
      setMessages(ms => {
        const next = [...ms];
        const last = next[next.length - 1];
        if (last?.role === "model" && last.streaming) {
          next[next.length - 1] = { ...last, text: reply, streaming: false };
        }
        return next;
      });
    } catch (e) {
      const message = userFacingGemError("typed:rest", e, t);
      setError(message);
      setStatus("error");
      setMessages(ms => ms.filter(m => !(m.role === "model" && m.streaming && !m.text)));
      return;
    }
    setStatus("ready");
  }

  async function sendText() {
    await submitUserMessage();
  }

  function toggleWebSearch() {
    sessionRef.current?.close();
    sessionRef.current = null;
    setWebSearchEnabled(v => !v);
  }

  async function startRecording() {
    const apiKey = getApiKey();
    if (!apiKey) {
      setStatus("needs-key");
      return;
    }
    if (recorderRef.current?.isRecording()) return;

    setError(null);
    const recorder = new VoiceRecorder({
      onAutoStop: () => {
        void finalizeRecording();
      },
      onVolumeChange: setMicVolume
    });
    recorderRef.current = recorder;
    setMicVolume(0);
    try {
      await recorder.start();
      setStatus("recording");
    } catch (e) {
      recorderRef.current = null;
      setError(userFacingGemError("voice:start", e, t));
      setStatus("error");
    }
  }

  async function finalizeRecording() {
    const recorder = recorderRef.current;
    if (!recorder) return;
    recorderRef.current = null;

    const apiKey = getApiKey();
    if (!apiKey) {
      recorder.cancel();
      setStatus("needs-key");
      return;
    }

    setStatus("transcribing");
    setMicVolume(0);
    let blob: Blob;
    try {
      blob = await recorder.stop();
    } catch (e) {
      setError(userFacingGemError("voice:stop", e, t));
      setStatus("error");
      return;
    }

    if (!blob.size) {
      setStatus("ready");
      return;
    }

    if (!playerRef.current) playerRef.current = new PcmPlayer();
    try {
      await playerRef.current.ensureAudioUnlocked();
    } catch {
      /* ignore */
    }

    let transcript: string;
    try {
      transcript = await transcribeAudio({ apiKey, audio: blob, language: lang });
    } catch (e) {
      setError(userFacingGemError("voice:transcribe", e, t));
      setStatus("error");
      return;
    }

    const cleaned = transcript.trim();
    if (!cleaned) {
      setError(t("gem_transcribe_failed"));
      setStatus("ready");
      return;
    }

    await submitUserMessage(cleaned);
  }

  async function toggleRecording() {
    if (recorderRef.current?.isRecording()) {
      await finalizeRecording();
    } else {
      await startRecording();
    }
  }

  function handleSaveKey() {
    const v = keyDraft.trim();
    if (!v) return;
    setApiKey(v);
    setKeyDraft("");
    setStatus("ready");
    setError(null);
  }

  function handleForgetKey() {
    clearApiKey();
    setShowHistory(false);
    setStatus(hasBuildTimeKey() ? "ready" : "needs-key");
  }

  function handleClearHistory() {
    clearHistory();
    setMessages([]);
  }

  return (
    <>
      {/* Floating launcher */}
      <AnimatePresence>
        {status === "closed" && (
          <motion.button
            key="gem-launcher"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            onClick={open}
            className="fixed z-[8010] right-6 bottom-[calc(72px+env(safe-area-inset-bottom))] md:bottom-6 w-14 h-14 rounded-full bg-tafnit-navy-900 text-cream-50 flex items-center justify-center shadow-lg shadow-tafnit-navy-900/30 hover:bg-tafnit-navy-800 transition"
            aria-label={t("gem_open")}
          >
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-tafnit-mint-500/40 animate-gem-breathe"
            />
            <Sparkles size={18} className="relative" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {status !== "closed" && (
          <>
            {/* Backdrop */}
            <motion.div
              key="gem-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={close}
              className="fixed inset-0 z-[8020] bg-ink-900/55 backdrop-blur-sm touch-none"
            />

            {/* Panel */}
            <motion.div
              key="gem-panel"
              initial={{ y: "100%", opacity: 0.6 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
              className="fixed z-[8030] inset-x-0 bottom-0 h-[70dvh] max-h-[70dvh] sm:inset-x-auto sm:right-6 sm:left-auto sm:bottom-6 sm:w-[420px] sm:max-h-[70dvh] bg-cream-50 sm:rounded-3xl rounded-t-3xl shadow-2xl shadow-ink-900/40 flex flex-col min-h-0 overflow-hidden"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
              data-compact-ui
            >
              {/* Header */}
              <div className="px-5 pt-4 pb-3 border-b border-cream-300/70 flex items-center gap-3 bg-gradient-to-b from-cream-100 to-cream-50">
                <div className="relative shrink-0">
                  <div className={`relative w-10 h-10 rounded-full bg-tafnit-navy-700 text-cream-50 flex items-center justify-center shadow-md shadow-tafnit-navy-900/20 transition-transform ${status === "speaking" || status === "recording" ? "scale-105" : ""}`}>
                    {(status === "speaking" || status === "recording") && (
                      <span aria-hidden className={`absolute inset-0 rounded-full bg-tafnit-navy-700/40 ${status === "speaking" ? "animate-pulse" : "animate-gem-breathe"}`} />
                    )}
                    {status === "speaking" ? (
                      <div className="flex items-center justify-center gap-[3px] h-4 w-5 relative z-10">
                        <motion.div className="w-[3px] bg-cream-50 rounded-full" animate={{ height: ["40%", "100%", "40%"] }} transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }} />
                        <motion.div className="w-[3px] bg-cream-50 rounded-full" animate={{ height: ["70%", "30%", "100%", "70%"] }} transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }} />
                        <motion.div className="w-[3px] bg-cream-50 rounded-full" animate={{ height: ["30%", "100%", "30%"] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }} />
                        <motion.div className="w-[3px] bg-cream-50 rounded-full" animate={{ height: ["100%", "40%", "100%"] }} transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }} />
                      </div>
                    ) : (
                      <Sparkles size={16} className="relative z-10" />
                    )}
                  </div>
                  {/* Status indicator dot */}
                  <span
                    aria-hidden
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-cream-50 ${
                      status === "recording"
                        ? "bg-tafnit-mint-500 animate-gem-breathe"
                        : status === "speaking"
                        ? "bg-tafnit-navy-500 animate-pulse"
                        : status === "thinking" ||
                            status === "connecting" ||
                            status === "transcribing"
                          ? "bg-amber-400 animate-gem-breathe"
                          : status === "error"
                            ? "bg-rose-600"
                            : "bg-tafnit-mint-500"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0 text-start">
                  <div className="font-display font-bold text-lg leading-tight text-ink-900">
                    {t("gem_title")}
                  </div>
                  <div className="text-[11px] text-ink-700/60 leading-tight">
                    {t("gem_tagline")}
                  </div>
                </div>
                <button
                  onClick={handleToggleAudio}
                  aria-label={audioEnabled ? t("gem_mute") : t("gem_unmute")}
                  aria-pressed={audioEnabled}
                  title={audioEnabled ? t("gem_mute") : t("gem_unmute")}
                  className={`p-2 rounded-full transition ${
                    audioEnabled
                      ? "bg-tafnit-navy-700/15 text-tafnit-navy-900 hover:bg-tafnit-navy-700/25"
                      : "text-ink-700/70 hover:bg-cream-200"
                  } ${status === "speaking" ? "animate-pulse" : ""}`}
                >
                  {audioEnabled ? (status === "speaking" ? <AudioLines size={16} /> : <Volume2 size={16} />) : <VolumeX size={16} />}
                </button>
                <button
                  onClick={startNewChat}
                  aria-label="שיחה חדשה"
                  title="שיחה חדשה"
                  className="p-2 rounded-full hover:bg-cream-200 transition"
                >
                  <FilePenLine size={16} />
                </button>
                <button
                  onClick={() => {
                    setConversations(loadConversations());
                    setActiveConvId(loadActiveConversationId());
                    setShowHistory(h => !h);
                  }}
                  aria-label="כל השיחות"
                  title="כל השיחות"
                  className={`p-2 rounded-full transition ${showHistory ? "bg-cream-200" : "hover:bg-cream-200"}`}
                >
                  <Menu size={16} />
                </button>
                <button
                  onClick={close}
                  aria-label={t("gem_close")}
                  className="p-2 rounded-full hover:bg-cream-200 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
                {showHistory ? (
                  <HistoryView
                    conversations={conversations}
                    activeConvId={activeConvId}
                    lang={lang}
                    showForgetKey={hasUserOverride()}
                    hasBuildTimeKey={hasBuildTimeKey()}
                    onSelect={(id) => {
                      const c = conversations.find(c => c.id === id);
                      if (c) {
                        setActiveConvId(c.id);
                        saveActiveConversationId(c.id);
                        setMessages(c.messages);
                        setShowHistory(false);
                      }
                    }}
                    onDelete={(id) => {
                      const updated = conversations.filter(c => c.id !== id);
                      saveConversations(updated);
                      setConversations(updated);
                      if (activeConvId === id) {
                        if (updated.length > 0) {
                          setActiveConvId(updated[0].id);
                          saveActiveConversationId(updated[0].id);
                          setMessages(updated[0].messages);
                        } else {
                          setActiveConvId(null);
                          if (typeof window !== "undefined") {
                            window.localStorage.removeItem("tafnit2026.gemininio.activeConvId");
                          }
                          setMessages([]);
                        }
                      }
                    }}
                    onClearHistory={() => {
                      handleClearHistory();
                      if (typeof window !== "undefined") {
                        window.localStorage.removeItem("tafnit2026.gemininio.activeConvId");
                      }
                      setActiveConvId(null);
                      setConversations([]);
                    }}
                    onForgetKey={handleForgetKey}
                    onBack={() => setShowHistory(false)}
                  />
                ) : status === "needs-key" ? (
                  <SetupView
                    draft={keyDraft}
                    setDraft={setKeyDraft}
                    onSave={handleSaveKey}
                  />
                ) : (
                  <ChatView
                    messages={messages}
                    status={status}
                    error={error}
                    text={text}
                    setText={setText}
                    scrollRef={scrollRef}
                    inputRef={inputRef}
                    webSearchEnabled={webSearchEnabled}
                    onToggleWebSearch={toggleWebSearch}
                    onSend={sendText}
                    onMicToggle={toggleRecording}
                    micVolume={micVolume}
                  />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ================================================================== */
/* Subviews                                                            */
/* ================================================================== */

function SetupView({
  draft,
  setDraft,
  onSave
}: {
  draft: string;
  setDraft: (s: string) => void;
  onSave: () => void;
}) {
  const t = useT();
  return (
    <div className="px-5 py-5 overflow-y-auto overscroll-contain flex-1 flex flex-col gap-4 text-start">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-full bg-cream-200 text-ink-700 flex items-center justify-center">
          <Sparkles size={16} />
        </div>
        <div className="flex-1">
          <div className="font-display font-bold text-lg text-ink-900">{t("gem_setup_title")}</div>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-700/85">
            {t("gem_setup_blurb")}
          </p>
        </div>
      </div>
      <a
        href="https://aistudio.google.com/apikey"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[12px] text-tafnit-navy-700 underline self-start"
      >
        <ExternalLink size={12} /> {t("gem_setup_link")}
      </a>
      <input
        type="password"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        placeholder={t("gem_key_placeholder")}
        className="px-4 py-3 rounded-xl border border-cream-300 bg-cream-100 text-ink-900 text-[14px] focus:outline-none focus:ring-2 focus:ring-tafnit-navy-500/40"
        spellCheck={false}
        autoComplete="off"
      />
      <button
        onClick={onSave}
        disabled={!draft.trim()}
        className="px-4 py-3 rounded-xl bg-tafnit-navy-900 text-cream-50 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-tafnit-navy-800 transition"
      >
        {t("gem_save_key")}
      </button>
    </div>
  );
}

function HistoryView({
  conversations,
  activeConvId,
  lang,
  showForgetKey,
  hasBuildTimeKey: builtIn,
  onSelect,
  onDelete,
  onClearHistory,
  onForgetKey,
  onBack
}: {
  conversations: Conversation[];
  activeConvId: string | null;
  lang: "he" | "en";
  showForgetKey: boolean;
  hasBuildTimeKey: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClearHistory: () => void;
  onForgetKey: () => void;
  onBack: () => void;
}) {
  const t = useT();
  return (
    <div className="px-5 py-5 overflow-y-auto overscroll-contain flex-1 flex flex-col gap-3 text-start">
      <button
        onClick={onBack}
        className="self-start text-[12px] uppercase tracking-[0.16em] text-ink-700/70 hover:text-ink-900"
      >
        ← {t("gem_back")}
      </button>

      <div className="flex flex-col gap-2 mt-2">
        {conversations.map(c => (
          <div key={c.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition ${c.id === activeConvId ? "bg-cream-200" : "bg-cream-100 hover:bg-cream-200"}`}>
            <button
              onClick={() => onSelect(c.id)}
              className="flex-1 flex flex-col min-w-0 text-start"
            >
              <span className="text-[14px] font-medium text-ink-900 truncate">
                {c.title || (lang === "he" ? "שיחה" : "Chat")}
              </span>
              <span className="text-[11px] text-ink-700/60 truncate">
                {new Date(c.updatedAt).toLocaleString(lang === "he" ? "he-IL" : "en-US", {
                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                })}
              </span>
            </button>
            <button
              onClick={() => onDelete(c.id)}
              className="p-2 text-ink-700/50 hover:text-rose-600 hover:bg-rose-500/10 rounded-full transition"
              aria-label={lang === "he" ? "מחק שיחה" : "Delete chat"}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {conversations.length === 0 && (
          <div className="text-[13px] text-ink-700/60 text-center py-4">
            {lang === "he" ? "אין שיחות קודמות." : "No previous conversations."}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-cream-300/70 flex flex-col gap-3">
        <button
          onClick={onClearHistory}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-cream-100 hover:bg-cream-200 transition text-ink-800 text-[13px]"
        >
          <Trash2 size={14} /> {t("gem_reset_history")}
        </button>
        {showForgetKey && (
          <button
            onClick={onForgetKey}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-cream-100 hover:bg-rose-500/10 hover:text-rose-600 transition text-ink-800 text-[13px]"
          >
            <Trash2 size={14} /> {t("gem_clear_key")}
          </button>
        )}
        {builtIn && (
          <div className="text-[11px] text-ink-700/60 leading-relaxed px-1">
            {t("gem_builtin_key_note")}
          </div>
        )}
      </div>
    </div>
  );
}

function bubbleTextDir(text: string): "rtl" | "ltr" {
  let he = 0;
  let lat = 0;
  for (const ch of text) {
    const c = ch.codePointAt(0)!;
    if (c >= 0x0590 && c <= 0x05ff) he++;
    else if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122)) lat++;
  }
  return he > lat ? "rtl" : "ltr";
}

function ChatView({
  messages,
  status,
  error,
  text,
  setText,
  scrollRef,
  inputRef,
  webSearchEnabled,
  onToggleWebSearch,
  onSend,
  onMicToggle,
  micVolume
}: {
  messages: Message[];
  status: ChatStatus;
  error: string | null;
  text: string;
  setText: (s: string) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  webSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  onSend: () => void;
  onMicToggle: () => void;
  micVolume: number;
}) {
  const t = useT();
  const isRecording = status === "recording";
  const inputBusy =
    status === "thinking" ||
    status === "connecting" ||
    status === "transcribing" ||
    status === "recording";
  const sendDisabled = !text.trim() || inputBusy;
  const micDisabled =
    status === "thinking" ||
    status === "transcribing" ||
    status === "connecting";

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div
        ref={scrollRef}
        className="gem-chat-scroll flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 flex flex-col gap-3 bg-cream-100/40"
      >
        {messages.length === 0 && (
          <div className="text-[12.5px] italic text-ink-700/65 leading-relaxed self-center max-w-[280px] text-center pt-6">
            {t("gem_first_hint")}
          </div>
        )}
        {messages.map((m, i) => (
          <Bubble key={i} message={m} />
        ))}
        {error && (
          <div className="text-[12px] text-rose-600 bg-rose-500/10 border border-rose-500/25 rounded-lg px-3 py-2 leading-snug text-start">
            {error}
          </div>
        )}
      </div>

      <StatusBar status={status} errorDetail={error} />

      <div className="shrink-0 border-t border-cream-300/70 bg-cream-50">
        <p className="px-3 pt-2 pb-0 text-[10px] leading-snug text-ink-700/75 text-center">
          {t("gem_input_mode_note")}
        </p>
        <div
          className="px-2 sm:px-3 py-3 flex flex-row items-center gap-1.5 sm:gap-2"
          dir="ltr"
        >
          <button
            type="button"
            onClick={onToggleWebSearch}
            aria-pressed={webSearchEnabled}
            aria-label={
              webSearchEnabled ? t("gem_web_search_disable") : t("gem_web_search_enable")
            }
            title={
              webSearchEnabled ? t("gem_web_search_disable") : t("gem_web_search_enable")
            }
            className={`shrink-0 w-10 h-10 rounded-full border flex items-center justify-center transition ${
              webSearchEnabled
                ? "border-tafnit-navy-700 bg-tafnit-navy-900 text-cream-50 shadow-md shadow-tafnit-navy-900/20"
                : "border-cream-400 bg-cream-100 text-ink-700/70 hover:bg-cream-200"
            }`}
          >
            <Globe size={16} />
          </button>
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder={
              isRecording
                ? t("gem_recording")
                : status === "transcribing"
                  ? t("gem_transcribing")
                  : t("gem_input_placeholder")
            }
            disabled={isRecording || status === "transcribing"}
            dir="auto"
            className="flex-1 min-w-0 px-3 py-2.5 rounded-full border border-cream-300 bg-cream-100 text-[14px] focus:outline-none focus:ring-2 focus:ring-tafnit-navy-500/40 disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-ink-700/50"
            inputMode="text"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={sendDisabled}
            aria-label={t("gem_send")}
            className="shrink-0 w-10 h-10 rounded-full bg-ink-900 text-cream-50 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-ink-800 transition"
          >
            <Send size={16} />
          </button>
          <button
            type="button"
            onClick={onMicToggle}
            disabled={micDisabled}
            aria-label={isRecording ? t("gem_mic_stop") : t("gem_mic_start")}
            aria-pressed={isRecording}
            title={isRecording ? t("gem_mic_stop") : t("gem_mic_start")}
            className={`relative shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition select-none disabled:opacity-40 disabled:cursor-not-allowed ${
              isRecording
                ? "bg-tafnit-navy-700 text-cream-50 shadow-lg shadow-tafnit-navy-900/30"
                : "bg-tafnit-mint-600 text-cream-50 hover:bg-tafnit-mint-700"
            }`}
          >
            {isRecording && (
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-tafnit-navy-700/40 pointer-events-none transition-transform duration-75"
                style={{ transform: `scale(${1 + Math.min(1, micVolume * 5) * 0.6})` }}
              />
            )}
            <Mic size={16} className="relative z-10" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Bubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isWaiting = !isUser && message.streaming && !message.text;
  const isStreaming = !isUser && message.streaming && !!message.text;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 22, stiffness: 320, mass: 0.6 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm ${
          isUser
            ? "bg-gradient-to-br from-tafnit-navy-800 to-tafnit-navy-900 text-cream-50 rounded-ee-md shadow-tafnit-navy-900/15 text-start"
            : "bg-cream-50 text-ink-800 ring-1 ring-cream-300/70 rounded-es-md shadow-ink-900/5 text-start"
        }`}
      >
        {isWaiting ? (
          <TypingDots />
        ) : (
          <div
            dir={bubbleTextDir(message.text)}
            className="[unicode-bidi:isolate] whitespace-pre-wrap break-words"
          >
            {message.text}
            {isStreaming && <BlinkingCaret />}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1 px-0.5" aria-label="typing">
      <span className="w-1.5 h-1.5 rounded-full bg-ink-700/55 animate-typing-dot [animation-delay:-300ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-ink-700/55 animate-typing-dot [animation-delay:-150ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-ink-700/55 animate-typing-dot" />
    </span>
  );
}

function BlinkingCaret() {
  return (
    <span
      aria-hidden
      className="inline-block w-[2px] h-[1em] -mb-[0.15em] ms-[1px] bg-ink-700 align-baseline animate-caret-blink"
    />
  );
}

function StatusBar({
  status,
  errorDetail
}: {
  status: ChatStatus;
  errorDetail: string | null;
}) {
  const t = useT();

  const row = (() => {
    switch (status) {
      case "connecting":
        return {
          label: t("gem_connecting"),
          icon: <Loader2 size={12} className="animate-spin" />
        };
      case "recording":
        return {
          label: t("gem_recording"),
          icon: <Mic size={12} className="text-tafnit-mint-600 animate-pulse" />
        };
      case "transcribing":
        return {
          label: t("gem_transcribing"),
          icon: <Loader2 size={12} className="animate-spin" />
        };
      case "thinking":
        return {
          label: t("gem_thinking"),
          icon: <Loader2 size={12} className="animate-spin" />
        };
      case "speaking":
        return {
          label: t("gem_speaking"),
          icon: <Sparkles size={12} className="text-tafnit-mint-500" />
        };
      case "error":
        return {
          label: errorDetail?.trim() ? errorDetail : t("gem_error_generic"),
          icon: null as ReactNode
        };
      default:
        return null;
    }
  })();

  if (!row) return null;

  return (
    <div className="px-4 py-1.5 text-[11px] uppercase tracking-[0.14em] text-ink-700/65 bg-cream-100/70 border-t border-cream-300/40 flex items-center gap-1.5">
      {row.icon}
      <span>{row.label}</span>
    </div>
  );
}
